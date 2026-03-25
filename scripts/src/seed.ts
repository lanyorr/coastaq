import { db } from "@workspace/db";
import {
  usersTable,
  shopsTable,
  categoriesTable,
  productsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear in correct order
  await db.delete(productsTable);
  await db.delete(shopsTable);
  await db.delete(categoriesTable);
  await db.delete(usersTable);

  // Create categories
  const [electronics] = await db.insert(categoriesTable).values({ name: "Electronics" }).returning();
  const [fashion] = await db.insert(categoriesTable).values({ name: "Fashion" }).returning();
  const [homeGarden] = await db.insert(categoriesTable).values({ name: "Home & Garden" }).returning();
  const [vehicles] = await db.insert(categoriesTable).values({ name: "Vehicles" }).returning();
  const [sports] = await db.insert(categoriesTable).values({ name: "Sports" }).returning();

  await db.insert(categoriesTable).values([
    { name: "Smartphones", parentId: electronics.id },
    { name: "Laptops", parentId: electronics.id },
    { name: "Headphones", parentId: electronics.id },
    { name: "Men's Clothing", parentId: fashion.id },
    { name: "Women's Clothing", parentId: fashion.id },
    { name: "Shoes", parentId: fashion.id },
    { name: "Furniture", parentId: homeGarden.id },
    { name: "Garden Tools", parentId: homeGarden.id },
    { name: "Cars", parentId: vehicles.id },
    { name: "Motorcycles", parentId: vehicles.id },
    { name: "Fitness Equipment", parentId: sports.id },
    { name: "Outdoor Sports", parentId: sports.id },
  ]);

  console.log("✅ Categories created");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  await db.insert(usersTable).values({
    email: "admin@coastaq.com",
    passwordHash: adminHash,
    name: "Admin User",
    role: "ADMIN",
  });

  // Create approved seller
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

  console.log("✅ Users and shop created");

  // Get electronics subcategory IDs
  const allCategories = await db.select().from(categoriesTable);
  const smartphonesId = allCategories.find(c => c.name === "Smartphones")?.id;
  const laptopsId = allCategories.find(c => c.name === "Laptops")?.id;
  const fitnessId = allCategories.find(c => c.name === "Fitness Equipment")?.id;
  const furnitureId = allCategories.find(c => c.name === "Furniture")?.id;

  // Create sample products
  await db.insert(productsTable).values([
    {
      title: "iPhone 15 Pro Max - 256GB Natural Titanium",
      description: "The latest iPhone with A17 Pro chip, 48MP camera system, and titanium design. Includes USB-C charging and enhanced battery life.",
      price: "1199.00",
      stock: 15,
      condition: "NEW",
      location: "San Francisco, CA",
      images: [
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop",
      ],
      categoryId: smartphonesId || null,
      shopId: shop.id,
    },
    {
      title: "MacBook Pro 14-inch M3 Pro - Space Black",
      description: "Supercharged by M3 Pro chip with 12-core CPU and 18-core GPU. Up to 22 hours battery life. Brilliant Liquid Retina XDR display.",
      price: "1999.00",
      stock: 8,
      condition: "NEW",
      location: "San Francisco, CA",
      images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop",
      ],
      categoryId: laptopsId || null,
      shopId: shop.id,
    },
    {
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      description: "Industry-leading noise cancellation. 30 hours battery. Crystal clear hands-free calling. Auto Noise Canceling Optimizer.",
      price: "348.00",
      stock: 25,
      condition: "NEW",
      location: "New York, NY",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      ],
      categoryId: allCategories.find(c => c.name === "Headphones")?.id || null,
      shopId: shop.id,
    },
    {
      title: "Samsung Galaxy S24 Ultra - Titanium Black",
      description: "100x Space Zoom. Built-in S Pen. 200MP Camera. 5000mAh battery. AI-powered features.",
      price: "1299.00",
      stock: 12,
      condition: "NEW",
      location: "Austin, TX",
      images: [
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=600&fit=crop",
      ],
      categoryId: smartphonesId || null,
      shopId: shop.id,
    },
    {
      title: "Peloton Bike+ - Black",
      description: "The ultimate at-home cycling experience. Auto-Follow resistance, rotating touchscreen, immersive classes.",
      price: "2495.00",
      stock: 5,
      condition: "USED",
      location: "Chicago, IL",
      images: [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop",
      ],
      categoryId: fitnessId || null,
      shopId: shop.id,
    },
    {
      title: "Mid-Century Modern Sofa - Walnut & Gray",
      description: "Solid wood legs, premium upholstery. Seats 3 comfortably. Easy assembly. Available in multiple colors.",
      price: "899.00",
      stock: 4,
      condition: "NEW",
      location: "Los Angeles, CA",
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop",
      ],
      categoryId: furnitureId || null,
      shopId: shop.id,
    },
  ]);

  // Create a buyer user
  const buyerHash = await bcrypt.hash("buyer123", 10);
  await db.insert(usersTable).values({
    email: "buyer@coastaq.com",
    passwordHash: buyerHash,
    name: "Demo Buyer",
    role: "BUYER",
  });

  console.log("✅ Products created");
  console.log("\n🎉 Seed complete!");
  console.log("\nDemo accounts:");
  console.log("  Admin:  admin@coastaq.com  / admin123");
  console.log("  Seller: seller@coastaq.com / seller123");
  console.log("  Buyer:  buyer@coastaq.com  / buyer123");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
