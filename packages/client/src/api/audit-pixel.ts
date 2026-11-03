/** Encode audit arguments without exposing Pixel preprocessor markup. */
export function auditPixelLiteral(value: string | number): string {
	return JSON.stringify(value).replace(/</g, "\\u003c");
}
