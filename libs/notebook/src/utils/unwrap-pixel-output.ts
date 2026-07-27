/**
 * Each Pixel operationType stores its user-facing payload in a different
 * slot of the response envelope; pick the right slot so notebook output
 * mapping renders the actual value instead of the wrapper. Mirrors the
 * terminal REPL's unwrap (terminal-console.tsx / cell.state.ts).
 */
export const unwrapPixelOutput = (last: {
	operationType?: string[];
	output?: unknown;
}): unknown => {
	if (!last) return undefined;
	const op = last.operationType ?? [];
	const out = last.output as
		| Record<string, unknown>
		| Array<Record<string, unknown>>
		| unknown;

	if (op.indexOf("CUSTOM_DATA_STRUCTURE") > -1) return out;
	if (op.indexOf("FORMATTED_DATA_SET") > -1)
		return (out as Array<unknown>)?.[0];
	if (op.indexOf("CODE_EXECUTION") > -1)
		return (out as Array<{ output?: unknown }>)?.[0]?.output;
	if (op.indexOf("CODE") > -1)
		return (out as Array<{ value?: unknown[] }>)?.[0]?.value?.[0];
	if (op.indexOf("ERROR") > -1) return (out as Array<unknown>)?.[0];
	if (op.indexOf("CONST_STRING") > -1) return (out as Array<unknown>)?.[0];
	if (op.indexOf("INVALID_SYNTAX") > -1) return (out as Array<unknown>)?.[0];
	if (op.indexOf("VECTOR") > -1) return (out as Array<unknown>)?.[0];
	return out;
};
