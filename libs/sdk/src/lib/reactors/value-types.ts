import type { RawPixel } from "../raw-pixel";

export type { RawPixel } from "../raw-pixel";

/** Values representable by the Pixel literal grammar, including explicit syntax. */
export type PixelValue =
	| string
	| number
	| boolean
	| null
	| RawPixel
	| readonly PixelValue[]
	| { readonly [key: string]: PixelValue | undefined };

/** A typed literal or an explicitly supplied Pixel expression. */
export type PixelArgument<T = PixelValue> = T | RawPixel;

/** Internal input and successful wire-output contract for one callable name. */
export interface ReactorContract<
	P,
	O,
	CanOmitParameters extends boolean = Record<string, never> extends P
		? true
		: [] extends P
			? true
			: false,
> {
	parameters: P;
	output: O;
	/** Omission is explicit for source contracts whose requiredness is unverified. */
	canOmitParameters: CanOmitParameters;
}
