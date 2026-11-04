import { describe, expectTypeOf, it } from "vitest";
import { buildPixel } from "../../../api/pixel";
import { config } from "../../../generated/api/monolith";
import { useAPI } from "./use-api";
import { useIteratorApi } from "./use-iterator-api";
import { useIteratorPixel } from "./use-iterator-pixel";
import { usePixel } from "./usePixel";

// Generated types are inline; this is how a consumer names them.
type ServerConfig = Awaited<ReturnType<typeof config>>;

/** Shaped like a generated call with a required input. */
declare const users: (
	input: { limit: number; search?: string },
	options?: RequestInit,
) => Promise<string[]>;

/** Shaped like a generated call whose inputs are all optional. */
declare const search: (
	input?: { search?: string },
	options?: RequestInit,
) => Promise<string[]>;

/** Shaped like a generated paged call. */
declare const pagedUsers: (
	input: { limit: number; offset: number; search?: string },
	options?: RequestInit,
) => Promise<{ id: string }[]>;

/** A paged call whose response wraps its rows. */
declare const pagedRooms: (
	input: { limit: number; offset: number; team: string },
	options?: RequestInit,
) => Promise<{ rooms: { name: string }[]; total: number }>;

/** Never called: type checks of hook calls, inside a hook so hook rules hold. */
function useTypeChecks() {
	expectTypeOf(useAPI(config).data).toEqualTypeOf<ServerConfig | undefined>();
	expectTypeOf(useAPI(config, { enabled: false }).data).toEqualTypeOf<
		ServerConfig | undefined
	>();
	expectTypeOf(useAPI(users, { limit: 1 }).data).toEqualTypeOf<
		string[] | undefined
	>();
	expectTypeOf(
		useAPI(users, { limit: 1 }, { enabled: true }).data,
	).toEqualTypeOf<string[] | undefined>();
	expectTypeOf(useAPI(search).data).toEqualTypeOf<string[] | undefined>();

	useAPI(config, {
		onSuccess: (data) => expectTypeOf(data).toEqualTypeOf<ServerConfig>(),
	});

	// @ts-expect-error limit is required
	useAPI(users);
	// @ts-expect-error limit is a number
	useAPI(users, { limit: "1" });
	// @ts-expect-error config takes no input
	useAPI(config, { limit: 1 });

	// paging a generated call types the rows; limit and offset are the hook's
	expectTypeOf(useIteratorApi(pagedUsers).data).toEqualTypeOf<
		{ id: string }[]
	>();
	expectTypeOf(
		useIteratorApi(pagedUsers, { search: "a" }, { enabled: false }).data,
	).toEqualTypeOf<{ id: string }[]>();
	// @ts-expect-error limit and offset are filled in by the hook
	useIteratorApi(pagedUsers, { limit: 1 });
	expectTypeOf(
		useIteratorApi(
			pagedRooms,
			{ team: "t" },
			{ select: (response) => response.rooms },
		).data,
	).toEqualTypeOf<{ name: string }[]>();
	// The SDK builds with strict off, so leaving the input out is what fails,
	// rather than passing undefined.
	// @ts-expect-error team is required
	useIteratorApi(pagedRooms);

	// the legacy form still type-checks
	expectTypeOf(
		useIteratorApi(
			(limit, offset) => Promise.resolve([limit, offset]),
			{ limit: 10 },
			[],
		).data,
	).toEqualTypeOf<number[]>();

	expectTypeOf(
		usePixel(buildPixel("GetCurrentInsightId")).data,
	).toEqualTypeOf<string>();
	expectTypeOf(usePixel<number>("1 + 1;").data).toEqualTypeOf<number>();

	// a built Pixel types the response passed to the readers
	useIteratorPixel(
		() => buildPixel("GetCurrentInsightId"),
		(response) => {
			expectTypeOf(response).toEqualTypeOf<string>();
			return 0;
		},
		(response) => [response],
	);
	expectTypeOf(
		useIteratorPixel<{ rows: number[] }, number>(
			() => "Rows();",
			(r) => r.rows.length,
			(r) => r.rows,
		).data,
	).toEqualTypeOf<number[]>();
}

describe("useAPI and usePixel types", () => {
	it("checks hook calls", () => {
		expectTypeOf(useTypeChecks).toBeFunction();
		expectTypeOf(config()).resolves.toEqualTypeOf<ServerConfig>();
		expectTypeOf<ServerConfig["csrf"]>().toEqualTypeOf<boolean>();
		expectTypeOf<Parameters<typeof config>>().toEqualTypeOf<
			[options?: RequestInit]
		>();
		// @ts-expect-error config takes only fetch options
		config({ limit: 1 }, {});
	});
});
