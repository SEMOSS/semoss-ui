import type { PixelArgument } from "./value-types";

type RequireAlias<Keys extends string> = {
	[Key in Keys]: { [Required in Key]: PixelArgument };
}[Keys];

type RequireGroups<Groups extends readonly string[]> = Groups extends readonly [
	infer First extends string,
	...infer Rest extends string[],
]
	? RequireAlias<First> & RequireGroups<Rest>
	: unknown;

type PositionalArguments<
	Minimum extends number,
	Required extends PixelArgument[] = [],
> = Required["length"] extends Minimum
	? readonly [...Required, ...PixelArgument[]]
	: PositionalArguments<Minimum, [...Required, PixelArgument]>;

/**
 * Finite source-inventoried keys. Required groups and positional minimums come
 * from resolved constructors plus reachable organizeKeys/checkOptional execution,
 * never from MCP's default-required metadata. Aliases satisfy one required group.
 * Value types and further validation remain explicit in contract-gaps.json.
 * Optional named fields do not establish that the parameter argument may be omitted;
 * that permission is separate ReactorContract metadata with a conservative default.
 */
export type SourceParameters<
	Keys extends string,
	Mode extends "named" | "positional" | "both",
	Required extends readonly string[] = [],
	Minimum extends number = 0,
> = Mode extends "positional"
	? PositionalArguments<Minimum>
	:
			| (Mode extends "both" ? PositionalArguments<Minimum> : never)
			| (([Keys] extends [never]
					? Record<string, never>
					: { [Key in Keys]?: PixelArgument }) &
					RequireGroups<Required>);
