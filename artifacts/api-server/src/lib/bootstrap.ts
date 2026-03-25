import { db } from "@workspace/db";
import {
  usersTable,
  shopsTable,
  categoriesTable,
  productsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
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
  const existing = await db.select().from(categoriesTable).limit(1);
  if (existing.length > 0) {
    logger.info("Database already seeded, skipping bootstrap");
    return;
  }

  logger.info("Empty database detected — running initial seed...");

  // ── 1. Electronics ─────────────────────────────────────────────
  const electronics = await insertParent("Electronics");
  await insertChildren(electronics.id, [
    "Mobile Phones",
    "Tablets",
    "Mobile Phone Accessories",
    "Landline Phones",
    "Laptops & Computers",
    "Computer Accessories & Peripherals",
    "Networking Products",
    "Printers & Scanners",
    "Computer Monitors",
    "Audio & Music Equipment",
    "TV & DVD Equipment",
    "Cameras, Photo & Video",
    "Games & Consoles",
    "Generators, UPS & Solar Energy",
    "Electronic Spare Parts & Accessories",
  ]);

  // ── 2. Vehicles ────────────────────────────────────────────────
  const vehicles = await insertParent("Vehicles");
  await insertChildren(vehicles.id, [
    "Cars",
    "Buses & Microbuses",
    "Heavy Equipment",
    "Motorcycles & Bicycles",
    "Trucks & Trailers",
    "Watercraft & Boats",
    "Vehicle Parts & Accessories",
    "Car Rentals",
  ]);

  // ── 3. Property ────────────────────────────────────────────────
  const property = await insertParent("Property");
  await insertChildren(property.id, [
    "Houses & Apartments For Rent",
    "Houses & Apartments For Sale",
    "Land & Plots For Sale",
    "Land & Plots For Rent",
    "Commercial Property For Rent",
    "Commercial Property For Sale",
    "Short Let Property",
    "Real Estate Services",
  ]);

  // ── 4. Fashion ─────────────────────────────────────────────────
  const fashion = await insertParent("Fashion");
  await insertChildren(fashion.id, [
    "Men's Clothing",
    "Women's Clothing",
    "Children's Clothing",
    "Men's Shoes",
    "Women's Shoes",
    "Children's Shoes",
    "Bags",
    "Watches",
    "Jewelry & Accessories",
    "Other Fashion Items",
  ]);

  // ── 5. Home, Furniture & Appliances ────────────────────────────
  const home = await insertParent("Home, Furniture & Appliances");
  await insertChildren(home.id, [
    "Furniture & Decor",
    "Kitchen & Dining",
    "Bedding & Linen",
    "Garden & Outdoor",
    "Home Accessories & Decor",
    "Household Appliances",
    "Household Cleaning Supplies",
    "Arts & Crafts",
    "Other Home Items",
  ]);

  // ── 6. Health & Beauty ─────────────────────────────────────────
  const health = await insertParent("Health & Beauty");
  await insertChildren(health.id, [
    "Personal Care & Hygiene",
    "Hair & Extensions",
    "Fragrance & Deodorant",
    "Vitamins & Supplements",
    "Health Products",
    "Beauty Tools & Accessories",
    "Skin Care",
    "Medical Supplies",
    "Weight Loss Products",
  ]);

  // ── 7. Sports, Arts & Outdoors ─────────────────────────────────
  const sports = await insertParent("Sports, Arts & Outdoors");
  await insertChildren(sports.id, [
    "Exercise & Fitness",
    "Outdoor Recreation & Camping",
    "Sporting Goods",
    "Musical Instruments",
    "Art & Craft Supplies",
    "Bicycles",
    "Water Sports",
  ]);

  // ── 8. Jobs ────────────────────────────────────────────────────
  const jobs = await insertParent("Jobs");
  await insertChildren(jobs.id, [
    "Accounting & Finance",
    "Administrative & Office",
    "Construction & Artisans",
    "Customer Service",
    "Engineering & Technical",
    "Healthcare",
    "Hospitality & Hotel",
    "Human Resources",
    "IT & Telecoms",
    "Legal",
    "Media & Advertising",
    "Sales & Marketing",
    "Teaching & Education",
    "Other Jobs",
  ]);

  // ── 9. Services ────────────────────────────────────────────────
  const services = await insertParent("Services");
  await insertChildren(services.id, [
    "Building & Construction",
    "Cleaning & Fumigation",
    "Computer & Technology",
    "Education & Training",
    "Event Planning & Entertainment",
    "Financial Services",
    "Health & Wellness",
    "Home & Office Maintenance",
    "Moving & Relocation",
    "Photography & Videography",
    "Repair Services",
    "Transport & Freight",
    "Travel & Visa",
    "Other Services",
  ]);

  // ── 10. Animals & Pets ─────────────────────────────────────────
  const animals = await insertParent("Animals & Pets");
  await insertChildren(animals.id, [
    "Dogs",
    "Cats",
    "Birds",
    "Fish & Aquariums",
    "Other Pets",
    "Pet Food & Accessories",
    "Farm Animals",
    "Livestock",
  ]);

  // ── 11. Food & Agriculture ─────────────────────────────────────
  const food = await insertParent("Food & Agriculture");
  await insertChildren(food.id, [
    "Food & Drinks",
    "Farming Equipment & Tools",
    "Farm Produce",
    "Agricultural Land & Farms",
    "Fertilizers & Pesticides",
    "Seeds & Plants",
  ]);

  // ── 12. Kids Items ─────────────────────────────────────────────
  const kids = await insertParent("Kids Items");
  await insertChildren(kids.id, [
    "Baby & Kids Clothes",
    "Baby & Kids Shoes",
    "Baby & Kids Accessories",
    "Strollers & Prams",
    "Toys",
    "Baby Care",
    "Baby Food & Feeding",
    "Car Seats",
  ]);

  // ── 13. Commercial Equipment & Tools ───────────────────────────
  const commercial = await insertParent("Commercial Equipment & Tools");
  await insertChildren(commercial.id, [
    "Generators & Power Equipment",
    "Fabrication & Metalworking",
    "Food Production & Catering Equipment",
    "Heavy Industrial Equipment",
    "Industrial Pumps",
    "Air Compressors",
    "Safety & Security Equipment",
    "Office Equipment & Supplies",
    "Other Commercial Equipment",
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

  const [shop] = await db.insert(shopsTable).values({
    name: "TechHaven Store",
    description: "Your one-stop shop for the latest tech gadgets and accessories.",
    logo: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop",
    userId: seller.id,
    isApproved: true,
  }).returning();

  const buyerHash = await bcrypt.hash("buyer123", 10);
  await db.insert(usersTable).values({
    email: "buyer@coastaq.com",
    passwordHash: buyerHash,
    name: "Demo Buyer",
    role: "BUYER",
  });

  // ── Sample products ────────────────────────────────────────────
  const findCat = (name: string) => allCats.find(c => c.name === name)?.id ?? null;

  await db.insert(productsTable).values([
    {
      title: "iPhone 15 Pro Max 256GB - Natural Titanium",
      description: "A17 Pro chip, 48MP camera system, USB-C charging, titanium design. Battery lasts up to 29 hours.",
      price: "1199.00",
      stock: 15,
      condition: "NEW",
      location: "Lagos Island, Lagos",
      images: ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop"],
      categoryId: findCat("Mobile Phones"),
      shopId: shop.id,
    },
    {
      title: "MacBook Pro 14-inch M3 Pro - Space Black",
      description: "12-core CPU, 18-core GPU, up to 22 hrs battery, Liquid Retina XDR display.",
      price: "1999.00",
      stock: 8,
      condition: "NEW",
      location: "Victoria Island, Lagos",
      images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop"],
      categoryId: findCat("Laptops & Computers"),
      shopId: shop.id,
    },
    {
      title: "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
      description: "Industry-leading noise cancellation, 30-hour battery, multi-device pairing.",
      price: "348.00",
      stock: 25,
      condition: "NEW",
      location: "Ikeja, Lagos",
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"],
      categoryId: findCat("Audio & Music Equipment"),
      shopId: shop.id,
    },
    {
      title: "Samsung Galaxy S24 Ultra - Titanium Black",
      description: "Built-in S Pen, 200MP camera, 100x Space Zoom, 5000mAh battery, AI features.",
      price: "1299.00",
      stock: 12,
      condition: "NEW",
      location: "Abuja, FCT",
      images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=600&fit=crop"],
      categoryId: findCat("Mobile Phones"),
      shopId: shop.id,
    },
    {
      title: "Firman 3.2KVA Generator SPG3800E2",
      description: "100% copper winding, electric start, dual fuel, runs 8 hours on full tank.",
      price: "195.00",
      stock: 20,
      condition: "NEW",
      location: "Trade Fair, Lagos",
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop"],
      categoryId: findCat("Generators, UPS & Solar Energy"),
      shopId: shop.id,
    },
    {
      title: "Modern L-Shaped Sectional Sofa - Smoke Grey",
      description: "Premium fabric upholstery, solid hardwood frame. Seats 5 comfortably.",
      price: "450.00",
      stock: 4,
      condition: "NEW",
      location: "Lekki, Lagos",
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop"],
      categoryId: findCat("Furniture & Decor"),
      shopId: shop.id,
    },
    {
      title: "Toyota Camry 2019 XLE V6 - Excellent Condition",
      description: "Foreign used, full leather interior, sunroof, backup camera. Duty paid.",
      price: "18500.00",
      stock: 1,
      condition: "USED",
      location: "Lekki Phase 1, Lagos",
      images: ["https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&h=600&fit=crop"],
      categoryId: findCat("Cars"),
      shopId: shop.id,
    },
    {
      title: "Nike Air Max 270 - Men's Running Shoes",
      description: "Lightweight mesh upper, Max Air unit in heel. Sizes 40-46. Original Nike.",
      price: "89.00",
      stock: 30,
      condition: "NEW",
      location: "Computer Village, Lagos",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop"],
      categoryId: findCat("Men's Shoes"),
      shopId: shop.id,
    },
  ]);

  logger.info("Bootstrap complete — categories, demo users, and sample products seeded");
}
