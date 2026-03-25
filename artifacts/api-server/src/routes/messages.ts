import { Router } from "express";
import { db } from "@workspace/db";
import {
  conversationsTable, messagesTable, usersTable,
  productsTable, shopsTable,
} from "@workspace/db";
import { eq, and, or, desc, sql, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// ── Start or get existing conversation ──────────────────────────────────────
router.post("/conversations", requireAuth, async (req, res) => {
  try {
    const { productId, sellerId } = req.body as { productId: string; sellerId: string };
    const buyerId = req.userId!;

    if (!productId || !sellerId) {
      res.status(400).json({ error: "productId and sellerId are required" });
      return;
    }

    if (buyerId === sellerId) {
      res.status(400).json({ error: "You cannot message yourself" });
      return;
    }

    // Find existing conversation for this buyer+seller+product
    const existing = await db.query.conversationsTable.findFirst({
      where: and(
        eq(conversationsTable.buyerId, buyerId),
        eq(conversationsTable.sellerId, sellerId),
        eq(conversationsTable.productId, productId),
      ),
    });

    if (existing) {
      res.json({ id: existing.id, isNew: false });
      return;
    }

    const [conv] = await db
      .insert(conversationsTable)
      .values({ productId, buyerId, sellerId, lastMessageAt: new Date() })
      .returning();

    res.status(201).json({ id: conv.id, isNew: true });
  } catch (err) {
    req.log.error({ err }, "Start conversation error");
    res.status(500).json({ error: "Failed to start conversation" });
  }
});

// ── List my conversations ────────────────────────────────────────────────────
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;

    const convs = await db
      .select()
      .from(conversationsTable)
      .where(
        or(
          eq(conversationsTable.buyerId, userId),
          eq(conversationsTable.sellerId, userId),
        ),
      )
      .orderBy(desc(conversationsTable.lastMessageAt));

    // Enrich each conversation
    const enriched = await Promise.all(
      convs.map(async conv => {
        const otherUserId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;

        const [otherUser, lastMsg, product, unreadResult] = await Promise.all([
          db.query.usersTable.findFirst({ where: eq(usersTable.id, otherUserId) }),
          db.query.messagesTable.findFirst({
            where: eq(messagesTable.conversationId, conv.id),
            orderBy: [desc(messagesTable.createdAt)],
          }),
          conv.productId
            ? db.query.productsTable.findFirst({ where: eq(productsTable.id, conv.productId!) })
            : Promise.resolve(null),
          db
            .select({ count: sql<number>`count(*)` })
            .from(messagesTable)
            .where(
              and(
                eq(messagesTable.conversationId, conv.id),
                isNull(messagesTable.readAt),
                // Only count messages sent by the OTHER user (not me)
                eq(messagesTable.senderId, otherUserId),
              ),
            ),
        ]);

        return {
          ...conv,
          otherUser: otherUser
            ? { id: otherUser.id, name: otherUser.name, role: otherUser.role }
            : null,
          lastMessage: lastMsg || null,
          product: product ? { id: product.id, title: product.title, images: product.images } : null,
          unreadCount: Number(unreadResult[0]?.count ?? 0),
        };
      }),
    );

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "List conversations error");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// ── Get conversation + messages ──────────────────────────────────────────────
router.get("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const conv = await db.query.conversationsTable.findFirst({
      where: eq(conversationsTable.id, req.params.id),
    });

    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(messagesTable.createdAt);

    // Mark messages from the other user as read
    const otherUserId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
    await db
      .update(messagesTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messagesTable.conversationId, conv.id),
          eq(messagesTable.senderId, otherUserId),
          isNull(messagesTable.readAt),
        ),
      );

    const [otherUser, product] = await Promise.all([
      db.query.usersTable.findFirst({ where: eq(usersTable.id, otherUserId) }),
      conv.productId
        ? db.query.productsTable.findFirst({ where: eq(productsTable.id, conv.productId!) })
        : Promise.resolve(null),
    ]);

    res.json({
      conversation: {
        ...conv,
        otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, role: otherUser.role } : null,
        product: product ? { id: product.id, title: product.title, images: product.images, price: product.price } : null,
      },
      messages: msgs,
    });
  } catch (err) {
    req.log.error({ err }, "Get conversation error");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// ── Send a message ────────────────────────────────────────────────────────────
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { content } = req.body as { content: string };

    if (!content?.trim()) {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    const conv = await db.query.conversationsTable.findFirst({
      where: eq(conversationsTable.id, req.params.id),
    });

    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const [msg] = await db
      .insert(messagesTable)
      .values({ conversationId: conv.id, senderId: userId, content: content.trim() })
      .returning();

    // Update lastMessageAt
    await db
      .update(conversationsTable)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversationsTable.id, conv.id));

    res.status(201).json(msg);
  } catch (err) {
    req.log.error({ err }, "Send message error");
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ── Total unread count (for badge) ───────────────────────────────────────────
router.get("/unread", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;

    // Get all conversations where I am a participant
    const myConvs = await db
      .select({ id: conversationsTable.id, buyerId: conversationsTable.buyerId, sellerId: conversationsTable.sellerId })
      .from(conversationsTable)
      .where(or(eq(conversationsTable.buyerId, userId), eq(conversationsTable.sellerId, userId)));

    let total = 0;
    for (const conv of myConvs) {
      const otherUserId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
      const [r] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, conv.id),
            eq(messagesTable.senderId, otherUserId),
            isNull(messagesTable.readAt),
          ),
        );
      total += Number(r?.count ?? 0);
    }

    res.json({ unread: total });
  } catch (err) {
    res.json({ unread: 0 });
  }
});

export default router;
