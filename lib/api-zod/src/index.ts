export * from "./generated/api";
export * from "./generated/types";
// Resolve TS2308: both ./generated/api and ./generated/types export UploadImageResponse.
// Explicitly pick the Zod schema version (from api.ts) so tsc can resolve the ambiguity.
export { UploadImageResponse } from "./generated/api";
