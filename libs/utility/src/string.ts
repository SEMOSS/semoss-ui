/** Compatibility exports; prefer the defining category subpath. */
export * from "./identifier";
export * from "./markdown";
export * from "./text";

/** Return a string value, or an empty string for any other type. */
export const asString = (value: unknown): string =>
	typeof value === "string" ? value : "";
