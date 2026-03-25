import { db } from "@workspace/db";
import {
  usersTable,
  shopsTable,
  categoriesTable,
  productsTable,
} from "@workspace/db";
import { getSeedProducts } from "@workspace/db";
import bcrypt from "bcryptjs";
import { isNull, eq } from "drizzle-orm";
import { logger } from "./logger";

type Cat = { id: string; name: string };

async function insertParent(name: string): Promise<Cat> {
  const [cat] = await db.insert(categoriesTable).values({ name }).returning();
  return cat;
}

async function insertChildren(parentId: string, names: string[]): Promise<void> {
  if (names.length === 0) return;
  await db.insert(categoriesTable).values(names.map(name => ({ name, parentId })));
}

export async function bootstrap(): Promise<void> {
  const existingCats = await db.select().from(categoriesTable).limit(1);
  
  if (existingCats.length > 0) {
    // Categories already exist — check if products are seeded too
    const existingProducts = await db.select().from(productsTable).limit(50);
    if (existingProducts.length < 50) {
      // Products are missing or very sparse — seed full catalog using existing demo shop
      logger.info("Categories found but no products — seeding product catalog...");
      const shops = await db.select().from(shopsTable).limit(1);
      if (shops.length > 0) {
        const shop = shops[0];
        const allCats = await db.select().from(categoriesTable);
        const findCat = (name: string) => allCats.find(c => c.name === name)?.id ?? null;
        const products = getSeedProducts(findCat, shop.id);
        // Shuffle for variety on the home page
        for (let i = products.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [products[i], products[j]] = [products[j], products[i]];
        }
        for (let i = 0; i < products.length; i += 50) {
          await db.insert(productsTable).values(products.slice(i, i + 50));
        }
        logger.info({ count: products.length }, "Product catalog seeded");
      }
    }

    logger.info("Database already seeded, skipping bootstrap");
    // Backfill any shops that don't have a trial period yet (migration safety)
    const shopsNeedingTrial = await db.select().from(shopsTable).where(isNull(shopsTable.trialEndsAt));
    if (shopsNeedingTrial.length > 0) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      for (const shop of shopsNeedingTrial) {
        await db.update(shopsTable)
          .set({ subscriptionStatus: "TRIAL", trialEndsAt, updatedAt: new Date() })
          .where(eq(shopsTable.id, shop.id));
      }
      logger.info({ count: shopsNeedingTrial.length }, "Backfilled subscription trial for existing shops");
    }
    return;
  }

  logger.info("Empty database detected — running initial seed...");

  // ── 1. Electronics ─────────────────────────────────────────────
  const electronics = await insertParent("Electronics");
  await insertChildren(electronics.id, [
    "Mobile Phones", "Tablets", "Mobile Phone Accessories", "Landline Phones",
    "Laptops & Computers", "Computer Accessories & Peripherals", "Networking Products",
    "Printers & Scanners", "Computer Monitors", "Audio & Music Equipment",
    "TV & DVD Equipment", "Cameras, Photo & Video", "Games & Consoles",
    "Generators, UPS & Solar Energy", "Electronic Spare Parts & Accessories",
  ]);

  // ── 2. Vehicles ────────────────────────────────────────────────
  const vehicles = await insertParent("Vehicles");
  await insertChildren(vehicles.id, [
    "Cars", "Buses & Microbuses", "Heavy Equipment", "Motorcycles & Bicycles",
    "Trucks & Trailers", "Watercraft & Boats", "Vehicle Parts & Accessories", "Car Rentals",
  ]);

  // ── 3. Property ────────────────────────────────────────────────
  const property = await insertParent("Property");
  await insertChildren(property.id, [
    "Houses & Apartments For Rent", "Houses & Apartments For Sale",
    "Land & Plots For Sale", "Land & Plots For Rent",
    "Commercial Property For Rent", "Commercial Property For Sale",
    "Short Let Property", "Real Estate Services",
  ]);

  // ── 4. Fashion ─────────────────────────────────────────────────
  const fashion = await insertParent("Fashion");
  await insertChildren(fashion.id, [
    "Men's Clothing", "Women's Clothing", "Children's Clothing",
    "Men's Shoes", "Women's Shoes", "Children's Shoes",
    "Bags", "Watches", "Jewelry & Accessories", "Other Fashion Items",
  ]);

  // ── 5. Home, Furniture & Appliances ────────────────────────────
  const home = await insertParent("Home, Furniture & Appliances");
  await insertChildren(home.id, [
    "Furniture & Decor", "Kitchen & Dining", "Bedding & Linen", "Garden & Outdoor",
    "Home Accessories & Decor", "Household Appliances", "Household Cleaning Supplies",
    "Arts & Crafts", "Other Home Items",
  ]);

  // ── 6. Health & Beauty ─────────────────────────────────────────
  const health = await insertParent("Health & Beauty");
  await insertChildren(health.id, [
    "Personal Care & Hygiene", "Hair & Extensions", "Fragrance & Deodorant",
    "Vitamins & Supplements", "Health Products", "Beauty Tools & Accessories",
    "Skin Care", "Medical Supplies", "Weight Loss Products",
  ]);

  // ── 7. Sports, Arts & Outdoors ─────────────────────────────────
  const sports = await insertParent("Sports, Arts & Outdoors");
  await insertChildren(sports.id, [
    "Exercise & Fitness", "Outdoor Recreation & Camping", "Sporting Goods",
    "Musical Instruments", "Art & Craft Supplies", "Bicycles", "Water Sports",
  ]);

  // ── 8. Jobs ────────────────────────────────────────────────────
  const jobs = await insertParent("Jobs");
  await insertChildren(jobs.id, [
    "Accounting & Finance", "Administrative & Office", "Construction & Artisans",
    "Customer Service", "Engineering & Technical", "Healthcare",
    "Hospitality & Hotel", "Human Resources", "IT & Telecoms", "Legal",
    "Media & Advertising", "Sales & Marketing", "Teaching & Education", "Other Jobs",
  ]);

  // ── 9. Services ────────────────────────────────────────────────
  const services = await insertParent("Services");
  await insertChildren(services.id, [
    "Building & Construction", "Cleaning & Fumigation", "Computer & Technology",
    "Education & Training", "Event Planning & Entertainment", "Financial Services",
    "Health & Wellness", "Home & Office Maintenance", "Moving & Relocation",
    "Photography & Videography", "Repair Services", "Transport & Freight",
    "Travel & Visa", "Other Services",
  ]);

  // ── 10. Animals & Pets ─────────────────────────────────────────
  const animals = await insertParent("Animals & Pets");
  await insertChildren(animals.id, [
    "Dogs", "Cats", "Birds", "Fish & Aquariums", "Other Pets",
    "Pet Food & Accessories", "Farm Animals", "Livestock",
  ]);

  // ── 11. Food & Agriculture ─────────────────────────────────────
  const food = await insertParent("Food & Agriculture");
  await insertChildren(food.id, [
    "Food & Drinks", "Farming Equipment & Tools", "Farm Produce",
    "Agricultural Land & Farms", "Fertilizers & Pesticides", "Seeds & Plants",
  ]);

  // ── 12. Kids Items ─────────────────────────────────────────────
  const kids = await insertParent("Kids Items");
  await insertChildren(kids.id, [
    "Baby & Kids Clothes", "Baby & Kids Shoes", "Baby & Kids Accessories",
    "Strollers & Prams", "Toys", "Baby Care", "Baby Food & Feeding", "Car Seats",
  ]);

  // ── 13. Commercial Equipment & Tools ───────────────────────────
  const commercial = await insertParent("Commercial Equipment & Tools");
  await insertChildren(commercial.id, [
    "Generators & Power Equipment", "Fabrication & Metalworking",
    "Food Production & Catering Equipment", "Heavy Industrial Equipment",
    "Industrial Pumps", "Air Compressors", "Safety & Security Equipment",
    "Office Equipment & Supplies", "Other Commercial Equipment",
  ]);

  const allCats = await db.select().from(categoriesTable);
  logger.info({ count: allCats.length }, "Categories seeded");

  // ── Demo users ─────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  await db.insert(usersTable).values({
    email: "admin@coastaq.com",
    passwordHash: adminHash,
    name: "Admin User",
    role: "ADMIN",
  });

  const sellerHash = await bcrypt.hash("seller123", 10);
  const [seller] = await db.insert(usersTable).values({
    email: "seller@coastaq.com",
    passwordHash: sellerHash,
    name: "Demo Seller",
    role: "SELLER",
  }).returning();

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);
  const [shop] = await db.insert(shopsTable).values({
    name: "TechHaven Store",
    description: "Your one-stop shop for the latest tech gadgets and accessories.",
    logo: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop",
    phone: "+234 801 234 5678",
    whatsapp: "+234 801 234 5678",
    userId: seller.id,
    isApproved: true,
    subscriptionStatus: "TRIAL",
    trialEndsAt,
  }).returning();

  const buyerHash = await bcrypt.hash("buyer123", 10);
  await db.insert(usersTable).values({
    email: "buyer@coastaq.com",
    passwordHash: buyerHash,
    name: "Demo Buyer",
    role: "BUYER",
  });

  // ── Sample products (shuffled for home page variety) ───────────
  const findCat = (name: string) => allCats.find(c => c.name === name)?.id ?? null;
  const products = getSeedProducts(findCat, shop.id);
  for (let i = products.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [products[i], products[j]] = [products[j], products[i]];
  }
  for (let i = 0; i < products.length; i += 50) {
    await db.insert(productsTable).values(products.slice(i, i + 50));
  }

  logger.info({ count: products.length }, "Sample products seeded");
  logger.info("Bootstrap complete");
}
