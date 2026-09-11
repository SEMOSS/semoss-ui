import type { FileExplorerApi } from "./file-explorer.types";

/**
 * Every slice of the explorer api, as data.
 *
 * `satisfies` would only catch a typo here. The assertion below is
 * what catches an *omission* — a new slice on `FileExplorerApi` that this list
 * forgets, which is precisely how a decorated explorer silently loses a
 * feature.
 */
const EXPLORER_SLICES = [
	"instanceId",
	"mode",
	"adapter",
	"capabilities",
	"header",
	"tree",
	"dnd",
	"newFile",
	"commands",
] as const;

/** Fails to instantiate unless `T` is `never`. */
type AssertNever<T extends never> = T;

/**
 * Compile error when `FileExplorerApi` grows a slice `EXPLORER_SLICES`
 * does not list. The constraint is what does the work — a bare conditional type
 * alias is computed but never checked, so it would pass silently.
 */
type _SlicesAreExhaustive = AssertNever<
	Exclude<keyof FileExplorerApi, (typeof EXPLORER_SLICES)[number]>
>;

/** One command, wrapped with the live api in hand. */
type CommandOverride<K extends keyof FileExplorerApi["commands"]> = (
	live: FileExplorerApi,
) => FileExplorerApi["commands"][K];

/** Commands to replace, each built from the live api. */
export type FileExplorerCommandOverrides = {
	[K in keyof FileExplorerApi["commands"]]?: CommandOverride<K>;
};

/**
 * Wrap an explorer's commands while keeping the api live.
 *
 * `{ ...explorer }` cannot be used for this: every slice is a *getter* onto
 * the hook's current state, so spreading snapshots each one at the moment of
 * the spread and freezes it. This forwards each slice as a getter instead, and
 * wraps the individual command rather than spreading `commands` — so the fact
 * that `commands` happens to be a stable delegating facade stops being
 * load-bearing.
 *
 * Memoize the result. The explorer api is identity-stable by design, and
 * callers publish it with `useEffect(() => setValue(explorer), [explorer])`;
 * an unmemoized decoration churns that identity every render.
 *
 * @param base - The explorer from `useFileExplorer`.
 * @param overrides - Commands to replace, each given the live api.
 * @return A live view of `base` with those commands swapped.
 */
export const decorateExplorer = (
	base: FileExplorerApi,
	overrides: FileExplorerCommandOverrides,
): FileExplorerApi => {
	const decorated = {} as Record<string, unknown>;

	for (const slice of EXPLORER_SLICES) {
		if (slice === "commands") continue;
		Object.defineProperty(decorated, slice, {
			enumerable: true,
			get: () => base[slice],
		});
	}

	Object.defineProperty(decorated, "commands", {
		enumerable: true,
		get: () => {
			const live = base.commands;
			const wrapped = {} as Record<string, unknown>;
			for (const key of Object.keys(live)) {
				const override = overrides[key as keyof typeof overrides];
				wrapped[key] = override
					? override(base)
					: live[key as keyof typeof live];
			}
			return wrapped;
		},
	});

	return decorated as unknown as FileExplorerApi;
};
