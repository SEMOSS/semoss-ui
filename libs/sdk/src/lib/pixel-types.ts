import type { ReactorCatalog } from "./reactors/catalog";

declare const pixelReactor: unique symbol;

/** Names generated from selected backend contracts; not a public SDK export. */
export type ReactorName = keyof ReactorCatalog;

/** Runtime primitive string whose type remembers the reactor that built it. */
export type BuiltPixel<N extends ReactorName> = string & {
	readonly [pixelReactor]: N;
};

/** Distribute the whole argument tuple so names and parameters stay correlated. */
export type BuildPixelArguments<N extends ReactorName> = N extends ReactorName
	? ReactorCatalog[N]["canOmitParameters"] extends true
		? [reactor: N, parameters?: ReactorCatalog[N]["parameters"]]
		: [reactor: N, parameters: ReactorCatalog[N]["parameters"]]
	: never;

/**
 * Resolve a built string's expected successful output, preserving legacy generics.
 * Only the hook's empty-string disable sentinel can accompany branded inputs.
 * Other raw-string alternatives deliberately retain the caller's fallback type.
 */
export type ResolvePixelOutput<P extends string, Fallback> = [
	Exclude<P, "">,
] extends [never]
	? Fallback
	: Exclude<P, ""> extends BuiltPixel<infer N>
		? ReactorCatalog[N]["output"]
		: Fallback;
