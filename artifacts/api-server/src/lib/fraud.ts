import crypto from "crypto";
import { db } from "@workspace/db";
import {
  affiliateClicksTable, affiliateLinksTable, affiliatesTable,
  affiliateCouponsTable,
} from "@workspace/db";
import { and, eq, gte, count, sql, lt } from "drizzle-orm";

/** Hash an IP address for privacy-safe storage. */
export function hashIp(ip: string): string {
  return crypto.createHash("sha256")
    .update(ip + (process.env["SESSION_SECRET"] || "coastaq"))
    .digest("hex")
    .slice(0, 16);
}

/** Extract the real client IP from the request, handling proxies. */
export function getClientIp(
  req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } },
): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

/**
 * Validate a referral code or coupon code BEFORE order creation.
 * Returns an error string if the code is invalid or is a self-referral,
 * or null if the code is valid (or absent).
 *
 * Throws nothing — all errors are returned as strings so callers can
 * return a 400 response to the client.
 */
export async function validateReferralForCheckout(
  buyerUserId: string,
  refCode?: string,
  couponCode?: string,
): Promise<{ error: string } | null> {
  const code = refCode ?? couponCode;
  if (!code) return null;

  try {
    if (refCode) {
      const link = await db.query.affiliateLinksTable.findFirst({
        where: and(
          eq(affiliateLinksTable.code, refCode),
          eq(affiliateLinksTable.isActive, true),
        ),
        with: { affiliate: true },
      });
      if (!link) return null; // Unknown code — silently ignore
      if (!link.affiliate.isApproved) return null;
      if (link.affiliate.userId === buyerUserId) {
        return { error: "Self-referral is not allowed. You cannot purchase through your own affiliate link." };
      }
    } else if (couponCode) {
      const upper = couponCode.toUpperCase();
      const coupon = await db.query.affiliateCouponsTable.findFirst({
        where: eq(affiliateCouponsTable.code, upper),
        with: { affiliate: true },
      });
      if (!coupon) return { error: `Coupon code "${couponCode}" is invalid or does not exist.` };
      if (!coupon.isActive) return { error: `Coupon code "${couponCode}" is no longer active.` };
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return { error: `Coupon code "${couponCode}" has expired.` };
      }
      if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
        return { error: `Coupon code "${couponCode}" has reached its maximum use limit.` };
      }
      if (!coupon.affiliate.isApproved) {
        return { error: `Coupon code "${couponCode}" is not currently available.` };
      }
      if (coupon.affiliate.userId === buyerUserId) {
        return { error: "Self-referral is not allowed. You cannot purchase using your own affiliate coupon." };
      }
    }
  } catch (err) {
    console.error("[fraud] validateReferralForCheckout error:", err);
  }
  return null;
}

/**
 * Validate a coupon and return the discount percentage.
 * Returns the discountPct (number) if valid, or an error string.
 * Call this BEFORE createDbOrderWithEscrow to apply the discount.
 */
export async function resolveCouponDiscount(
  couponCode: string,
  buyerUserId: string,
): Promise<{ discountPct: number } | { error: string }> {
  const upper = couponCode.toUpperCase();
  const coupon = await db.query.affiliateCouponsTable.findFirst({
    where: eq(affiliateCouponsTable.code, upper),
    with: { affiliate: true },
  });
  if (!coupon) return { error: `Coupon code "${couponCode}" is invalid or does not exist.` };
  if (!coupon.isActive) return { error: `Coupon code "${couponCode}" is no longer active.` };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { error: `Coupon code "${couponCode}" has expired.` };
  }
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
    return { error: `Coupon code "${couponCode}" has reached its maximum use limit.` };
  }
  if (!coupon.affiliate.isApproved) {
    return { error: `Coupon code "${couponCode}" is not currently available.` };
  }
  if (coupon.affiliate.userId === buyerUserId) {
    return { error: "Self-referral is not allowed. You cannot purchase using your own affiliate coupon." };
  }
  return { discountPct: parseFloat(String(coupon.discountPct)) };
}

/**
 * Records a click for an affiliate link with duplicate detection.
 * Returns whether this was a new (non-duplicate) click.
 */
export async function recordAffiliateClick(
  linkId: string,
  affiliateId: string,
  ipHash: string,
  userAgent?: string,
  referrer?: string,
): Promise<{ isDuplicate: boolean }> {
  const since = new Date(Date.now() - 60 * 1000);

  const [existing] = await db
    .select({ id: affiliateClicksTable.id })
    .from(affiliateClicksTable)
    .where(
      and(
        eq(affiliateClicksTable.linkId, linkId),
        eq(affiliateClicksTable.ipHash, ipHash),
        gte(affiliateClicksTable.createdAt, since),
      )
    )
    .limit(1);

  const isDuplicate = !!existing;

  await db.insert(affiliateClicksTable).values({
    linkId,
    affiliateId,
    ipHash,
    userAgent: userAgent?.slice(0, 512),
    referrer: referrer?.slice(0, 512),
    isDuplicate,
  });

  if (!isDuplicate) {
    await db
      .update(affiliateLinksTable)
      .set({ clicks: sql`${affiliateLinksTable.clicks} + 1` })
      .where(eq(affiliateLinksTable.id, linkId));
  } else {
    await maybeIncrementSuspiciousCount(affiliateId);
  }

  return { isDuplicate };
}

async function maybeIncrementSuspiciousCount(affiliateId: string): Promise<void> {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [totals] = await db
      .select({
        total: count(),
        duplicates: sql<number>`SUM(CASE WHEN ${affiliateClicksTable.isDuplicate} THEN 1 ELSE 0 END)`,
      })
      .from(affiliateClicksTable)
      .where(and(
        eq(affiliateClicksTable.affiliateId, affiliateId),
        gte(affiliateClicksTable.createdAt, since),
      ));

    const total = Number(totals?.total ?? 0);
    const dups = Number(totals?.duplicates ?? 0);
    if (total > 10 && dups / total > 0.5) {
      await db
        .update(affiliatesTable)
        .set({ suspiciousClickCount: sql`${affiliatesTable.suspiciousClickCount} + 1` })
        .where(eq(affiliatesTable.id, affiliateId));
    }
  } catch {}
}

/**
 * Returns true if the referral is safe to award commission (not self-referral).
 * Used post-order-creation for commission resolution logic.
 */
export async function isSafeReferral(affiliateId: string, buyerUserId: string): Promise<boolean> {
  const [aff] = await db
    .select({ userId: affiliatesTable.userId })
    .from(affiliatesTable)
    .where(eq(affiliatesTable.id, affiliateId))
    .limit(1);
  if (!aff) return false;
  if (aff.userId === buyerUserId) {
    console.warn(`[fraud] Self-referral skipped at commission: affiliate=${affiliateId}, buyer=${buyerUserId}`);
    return false;
  }
  return true;
}
