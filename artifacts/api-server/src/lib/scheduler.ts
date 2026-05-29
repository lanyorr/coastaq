import cron from "node-cron";
import { db } from "@workspace/db";
import { shopsTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";
import { logger } from "./logger.js";

export function startScheduler() {
  // ── Every hour: expire trials and subscriptions that have lapsed ──────────
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      // Expire trials
      const expiredTrials = await db
        .update(shopsTable)
        .set({ subscriptionStatus: "EXPIRED", updatedAt: now })
        .where(
          and(
            eq(shopsTable.subscriptionStatus, "TRIAL"),
            lte(shopsTable.trialEndsAt, now),
          )
        )
        .returning({ id: shopsTable.id });

      if (expiredTrials.length > 0) {
        logger.info({ count: expiredTrials.length }, "Scheduler: expired trials");
      }

      // Expire active subscriptions past their period end
      const expiredSubs = await db
        .update(shopsTable)
        .set({ subscriptionStatus: "EXPIRED", updatedAt: now })
        .where(
          and(
            eq(shopsTable.subscriptionStatus, "ACTIVE"),
            lte(shopsTable.subscriptionCurrentPeriodEnd, now),
          )
        )
        .returning({ id: shopsTable.id });

      if (expiredSubs.length > 0) {
        logger.info({ count: expiredSubs.length }, "Scheduler: expired subscriptions");
      }
    } catch (err) {
      logger.error({ err }, "Scheduler error");
    }
  });

  // ── Every 6 hours: log scheduler heartbeat ──────────────────────────────
  cron.schedule("0 */6 * * *", () => {
    logger.info("Scheduler heartbeat OK");
  });

  logger.info("Background scheduler started");
}
