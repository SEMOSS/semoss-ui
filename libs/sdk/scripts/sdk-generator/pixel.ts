/**
 * Turns `x-semoss-pixels` into the typed Pixel catalog. The catalog is types
 * only, so it adds nothing to a bundle however many reactors there are.
 */
import { byName, sortedEntries } from "./order.ts";
import {
	type OpenApiDocument,
	type PixelReactorObject,
	SpecError,
} from "./spec.ts";
import {
	createContext,
	derefSchema,
	docComment,
	objectMembers,
	tsType,
} from "./types.ts";

const PIXEL_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Writes `pixel/catalog.ts`, or nothing when the document has no reactors.
 *
 * @returns the file path relative to `src/generated/`, mapped to its source
 */
export function emitPixelCatalog(
	doc: OpenApiDocument,
	header: string,
): Map<string, string> {
	const reactors = sortedEntries(doc["x-semoss-pixels"]?.reactors ?? {});
	const files = new Map<string, string>();
	if (reactors.length === 0) {
		return files;
	}

	const ctx = createContext(doc);
	const entries: string[] = [];

	for (const [name, reactor] of reactors) {
		const where = `x-semoss-pixels.reactors.${name}`;
		if (!reactor.inputSchema || !reactor.outputSchema) {
			throw new SpecError(
				`${where}: inputSchema and outputSchema are required`,
			);
		}

		const input = derefSchema(doc, reactor.inputSchema);
		const inputIsObject =
			input.type === "object" ||
			(input.type === undefined && input.properties !== undefined);
		if (!inputIsObject) {
			throw new SpecError(`${where}: inputSchema must be an object`);
		}
		const keys = Object.keys(input.properties ?? {}).sort(byName);
		for (const key of keys) {
			if (!PIXEL_KEY.test(key)) {
				throw new SpecError(
					`${where}: "${key}" is not a valid Pixel key`,
				);
			}
		}
		const inputType =
			keys.length === 0
				? "Record<string, never>"
				: `{\n${objectMembers(input, ctx, "input")}}`;
		const output = derefSchema(doc, reactor.outputSchema);
		const outputType = tsType(reactor.outputSchema, ctx, "output");

		entries.push(
			`${docComment(reactorDoc(reactor))}${name}: {\n` +
				`${docComment(input.description)}input: ${inputType};\n` +
				`${docComment(output.description)}output: ${outputType};\n` +
				"};\n",
		);
	}

	const imports = ctx.usesPixelValue
		? 'import type { PixelValue } from "../../api/pixel";'
		: "";

	const catalog =
		`${docComment("Every reactor the SDK has a typed contract for, with its input and output.")}` +
		`export interface PixelCatalog {\n${entries.join("")}}`;

	files.set(
		"pixel/catalog.ts",
		[header, imports, catalog].filter(Boolean).join("\n\n"),
	);
	return files;
}

/** What a reactor's TSDoc says when the backend inferred part of its contract. */
export const INFERRED_NOTE =
	"Inferred from the reactor's declared keys; annotate it with @PixelInput or @PixelOutput to refine it.";

/**
 * A reactor's TSDoc: its description, a note when its contract is inferred,
 * then `@internal` and its reason when it is internal.
 */
function reactorDoc(reactor: PixelReactorObject): string | undefined {
	const parts = [reactor.description];
	if (reactor["x-semoss-inferred"]) {
		parts.push(INFERRED_NOTE);
	}
	if (reactor["x-internal"]) {
		const reason = reactor["x-internal-reason"];
		parts.push(reason ? `@internal ${reason}` : "@internal");
	}
	return parts.filter(Boolean).join("\n\n");
}
