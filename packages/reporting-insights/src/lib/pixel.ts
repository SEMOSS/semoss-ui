/**
 * Wrap a SQL string for embedding in a SEMOSS pixel `Query("...")`.
 *
 * SEMOSS's pixel parser runs `URLDecoder.decode(...)` on the Query reactor's
 * string argument, which throws on a literal `%` ("URLDecoder: Illegal hex
 * characters") and mangles `+` → space. SEMOSS's own SDK avoids this by wrapping
 * the SQL in `<encode>...</encode>` tags — the parser then treats the content as
 * a literal block and does NOT URL-decode it, so the SQL reaches the engine
 * exactly as written. The content is intentionally left RAW (no `"`/`\` escaping)
 * because `<encode>` reads everything up to the closing tag verbatim.
 *
 * (The transport layer still percent-encodes the WHOLE pixel as
 * x-www-form-urlencoded — see runPixel — which handles the servlet-level decode;
 * this `<encode>` wrapper handles the separate parser-level decode.)
 */
export function escapeSqlForPixel(sql: string): string {
	return `<encode>${String(sql)}</encode>`;
}
