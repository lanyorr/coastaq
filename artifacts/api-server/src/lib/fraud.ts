import crypto from "crypto";
import { db } from "@workspace/db";
import { affiliateClicksTable, affiliateLinksTable, affiliatesTable } from "@workspace/db";
import { and, eq, gte, count, sql } from "drizzle-orm";

/**
 * Hash an IP address for privacy-safe storage.
 */
export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + (process.env["SESSION_SECRET"] || "coastaq")).digest("hex").slice(0, 16);
}

/**
 * Extract the real client IP from the request, handling proxies.
 */
export function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
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
  const since = new Date(Date.now() - 60 * 1000); // 60-second window

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
    // Increment suspicious click counter on the affiliate if duplicate rate is high
    await maybeIncrementSuspiciousCount(affiliateId);
  }

  return { isDuplicate };
}

/**
 * Checks duplicate-click rate in the rolling hour. If > 50%, bumps the
 * suspicious_click_count on the affiliate record.
 */
async function maybeIncrementSuspiciousCount(affiliateId: string): Promise<void> {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [totals] = await db
      .select({
        total: count(),
        duplicates: sql<number>`SUM(CASE WHEN ${affiliateClicksTable.isDuplicate} THEN 1 ELSE 0 END)`,
      })
      .from(affiliateClicksTable)
      .where(
        and(
          eq(affiliateClicksTable.affiliateId, affiliateId),
          gte(affiliateClicksTable.createdAt, since),
        )
      );

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
 * Validates that the buyer is not the affiliate themselves (self-referral guard).
 * Returns true if the commission is safe to award.
 */
export async function isSafeReferral(affiliateId: string, buyerUserId: string): Promise<boolean> {
  const [aff] = await db
    .select({ userId: affiliatesTable.userId })
    .from(affiliatesTable)
    .where(eq(affiliatesTable.id, affiliateId))
    .limit(1);

  if (!aff) return false;
  if (aff.userId === buyerUserId) {
    console.warn(`[fraud] Self-referral blocked: affiliate=${affiliateId}, buyer=${buyerUserId}`);
    return false;
  }
  return true;
}
