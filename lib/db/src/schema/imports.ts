import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { shopsTable } from "./shops";

export const sellerImportsTable = pgTable("seller_imports", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shopId:       text("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  fileName:     text("file_name").notNull(),
  status:       text("status").notNull().default("COMPLETED"),   // COMPLETED | PARTIAL | FAILED
  mode:         text("mode").notNull().default("CREATE"),         // CREATE | UPDATE | UPSERT
  totalRows:    integer("total_rows").notNull().default(0),
  importedRows: integer("imported_rows").notNull().default(0),
  failedRows:   integer("failed_rows").notNull().default(0),
  errorSummary: text("error_summary"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

export const sellerImportRowsTable = pgTable("seller_import_rows", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  importId:     text("import_id").notNull().references(() => sellerImportsTable.id, { onDelete: "cascade" }),
  rowIndex:     integer("row_index").notNull(),
  status:       text("status").notNull(),   // IMPORTED | FAILED | SKIPPED
  productId:    text("product_id"),
  errorMessage: text("error_message"),
  rowData:      text("row_data").notNull(),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

export const fieldMappingProfilesTable = pgTable("field_mapping_profiles", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shopId:    text("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  mappings:  text("mappings").notNull(),  // JSON: { csvColumn: productField }
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
