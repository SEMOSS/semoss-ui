// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../../../env";
import { get } from "../../../utility/fetch";
import { useAPI } from "./use-api";
import { useIteratorApi } from "./use-iterator-api";

const mockFetch = vi.fn();

/** Calls shaped like generated ones: an async function over `get`. */
const config = async (options: RequestInit = {}) => {
	const response = await get<{ csrf: boolean }>(
		`${Env.MODULE}/api/config`,
		options,
	);
	return response.data;
};

const users = async (
	input: { limit: number; tags?: string[] },
	options: RequestInit = {},
) => {
	const query = new URLSearchParams();
	query.set("limit", String(input.limit));
	if (input.tags !== undefined) {
		query.set("tags", JSON.stringify(input.tags));
	}
	const response = await get<string[]>(
		`${Env.MODULE}/api/auth/users?${query}`,
		options,
	);
	return response.data;
};

/** Answers each request with its body, after the given number of milliseconds. */
function respondWith(body: (url: string) => unknown, delay = 0) {
	mockFetch.mockImplementation(
		(url: string) =>
			new Promise<Response>((resolve) => {
				setTimeout(
					() =>
						resolve(
							new Response(JSON.stringify(body(url)), {
								status: 200,
								headers: { "content-type": "application/json" },
							}),
						),
					delay,
				);
			}),
	);
}

beforeEach(() => {
	vi.stubGlobal("fetch", mockFetch);
	Env.update({ MODULE: "/Monolith" });
});

afterEach(() => {
	vi.unstubAllGlobals();
	mockFetch.mockReset();
});

describe("useAPI", () => {
	it("calls a function without arguments and calls onSuccess", async () => {
		respondWith(() => ({ csrf: true }));
		const onSuccess = vi.fn();
		const onFinal = vi.fn();

		const { result } = renderHook(() =>
			useAPI(config, { onSuccess, onFinal }),
		);

		expect(result.current.status).toBe("LOADING");
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(result.current.data).toEqual({ csrf: true });
		expect(onSuccess).toHaveBeenCalledWith({ csrf: true });
		expect(onFinal).toHaveBeenCalledTimes(1);
	});

	it("calls nothing and shows the initial data while disabled", () => {
		const { result } = renderHook(() =>
			useAPI(config, { enabled: false, data: { csrf: false } }),
		);

		expect(result.current.status).toBe("INITIAL");
		expect(result.current.data).toEqual({ csrf: false });
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("calls again only when the arguments' content changes", async () => {
		respondWith((url) => [url]);
		const { result, rerender } = renderHook(
			({ limit, tags }: { limit: number; tags: string[] }) =>
				useAPI(users, { limit, tags }),
			{ initialProps: { limit: 1, tags: ["a"] } },
		);
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));

		rerender({ limit: 1, tags: ["a"] });
		expect(mockFetch).toHaveBeenCalledTimes(1);

		rerender({ limit: 2, tags: ["a"] });
		await waitFor(() =>
			expect(result.current.data).toEqual([
				"/Monolith/api/auth/users?limit=2&tags=%5B%22a%22%5D",
			]),
		);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it("does not call again when only the callbacks change", async () => {
		respondWith(() => ({ csrf: true }));
		const { result, rerender } = renderHook(
			({ onSuccess }: { onSuccess: () => void }) =>
				useAPI(config, { onSuccess }),
			{ initialProps: { onSuccess: vi.fn() } },
		);
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));

		rerender({ onSuccess: vi.fn() });
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("ignores the result of a call that was replaced", async () => {
		// the first call answers last, so its result would land on top if kept
		mockFetch.mockImplementation((url: string) => {
			const delay = url.includes("limit=1") ? 60 : 0;
			return new Promise<Response>((resolve) =>
				setTimeout(
					() =>
						resolve(
							new Response(JSON.stringify([url]), {
								status: 200,
							}),
						),
					delay,
				),
			);
		});
		const onSuccess = vi.fn();
		const { result, rerender } = renderHook(
			({ limit }: { limit: number }) =>
				useAPI(users, { limit }, { onSuccess }),
			{ initialProps: { limit: 1 } },
		);

		rerender({ limit: 2 });
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		await new Promise((resolve) => setTimeout(resolve, 80));

		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(result.current.data).toEqual([
			"/Monolith/api/auth/users?limit=2",
		]);
	});

	it("ignores the result after the component unmounts", async () => {
		respondWith(() => ({ csrf: true }), 20);
		const onSuccess = vi.fn();
		const { unmount } = renderHook(() => useAPI(config, { onSuccess }));

		unmount();
		await new Promise((resolve) => setTimeout(resolve, 40));

		expect(onSuccess).not.toHaveBeenCalled();
	});

	it("reports one success under Strict Mode", async () => {
		respondWith(() => ({ csrf: true }));
		const onSuccess = vi.fn();
		const { result } = renderHook(() => useAPI(config, { onSuccess }), {
			reactStrictMode: true,
		});

		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(onSuccess).toHaveBeenCalledTimes(1);
	});

	it("reports a failed call and calls onError with the initial data", async () => {
		mockFetch.mockResolvedValue(
			new Response(JSON.stringify({ errorMessage: "No" }), {
				status: 500,
			}),
		);
		const onError = vi.fn();
		const { result } = renderHook(() =>
			useAPI(config, { data: { csrf: false }, onError }),
		);

		await waitFor(() => expect(result.current.status).toBe("ERROR"));
		expect(result.current.error?.message).toBe("No");
		expect(result.current.data).toEqual({ csrf: false });
		expect(onError).toHaveBeenCalledWith(
			{ csrf: false },
			expect.any(Error),
		);
	});

	it("refreshes and updates on request", async () => {
		respondWith(() => ({ csrf: true }));
		const { result } = renderHook(() => useAPI(config));
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));

		act(() => result.current.update({ csrf: false }));
		expect(result.current.data).toEqual({ csrf: false });

		act(() => result.current.refresh());
		await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
		await waitFor(() =>
			expect(result.current.data).toEqual({ csrf: true }),
		);
	});

	it("keeps each hook's state its own", async () => {
		respondWith((url) => [url]);
		const first = renderHook(() => useAPI(users, { limit: 1 }));
		const second = renderHook(() => useAPI(users, { limit: 2 }));

		await waitFor(() =>
			expect(first.result.current.status).toBe("SUCCESS"),
		);
		await waitFor(() =>
			expect(second.result.current.status).toBe("SUCCESS"),
		);
		expect(first.result.current.data).toEqual([
			"/Monolith/api/auth/users?limit=1",
		]);
		expect(second.result.current.data).toEqual([
			"/Monolith/api/auth/users?limit=2",
		]);
	});

	it("passes an AbortSignal and aborts a replaced call and an unmounted one", async () => {
		respondWith((url) => [url], 20);
		const { rerender, unmount } = renderHook(
			({ limit }: { limit: number }) => useAPI(users, { limit }),
			{ initialProps: { limit: 1 } },
		);
		await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
		const first = (mockFetch.mock.calls[0][1] as RequestInit).signal;
		expect(first).toBeInstanceOf(AbortSignal);

		rerender({ limit: 2 });
		await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
		expect(first?.aborted).toBe(true);

		unmount();
		expect(
			(mockFetch.mock.calls[1][1] as RequestInit).signal?.aborted,
		).toBe(true);
	});

	it("passes the signal as the only argument of a call without inputs", async () => {
		// shaped like a generated call: options has a default, so the length is 0
		const call = vi.fn((_options: RequestInit = {}) => Promise.resolve(1));
		renderHook(() => useAPI(call));

		await waitFor(() => expect(call).toHaveBeenCalledTimes(1));
		expect(call.mock.calls[0]).toEqual([
			{ signal: expect.any(AbortSignal) },
		]);
	});

	it("rejects input that is not plain data", () => {
		expect(() =>
			renderHook(() =>
				useAPI(users, {
					limit: 1,
					tags: [new Date()] as unknown as string[],
				}),
			),
		).toThrow("must be plain JSON data");
	});
});

describe("useIteratorApi with a generated call", () => {
	const pagedUsers = async (
		input: { limit: number; offset: number; search?: string },
		options: RequestInit = {},
	) => {
		const query = new URLSearchParams();
		query.set("limit", String(input.limit));
		query.set("offset", String(input.offset));
		if (input.search !== undefined) {
			query.set("search", input.search);
		}
		const response = await get<string[]>(
			`${Env.MODULE}/api/auth/users?${query}`,
			options,
		);
		return response.data;
	};

	it("fills in limit and offset, and pages on next()", async () => {
		respondWith((url) => [url]);
		const { result } = renderHook(() =>
			useIteratorApi(pagedUsers, { search: "an" }, { limit: 1 }),
		);

		await waitFor(() =>
			expect(result.current.data).toEqual([
				"/Monolith/api/auth/users?limit=1&offset=0&search=an",
			]),
		);
		act(() => result.current.next());
		await waitFor(() => expect(result.current.data).toHaveLength(2));
		expect(result.current.data[1]).toBe(
			"/Monolith/api/auth/users?limit=1&offset=1&search=an",
		);
	});

	it("starts again from page 0 when the input changes, but not for an equal input", async () => {
		respondWith((url) => [url]);
		const { result, rerender } = renderHook(
			({ search }: { search: string }) =>
				useIteratorApi(pagedUsers, { search }, { limit: 1 }),
			{ initialProps: { search: "a" } },
		);
		await waitFor(() => expect(result.current.data).toHaveLength(1));
		act(() => result.current.next());
		await waitFor(() => expect(result.current.data).toHaveLength(2));

		rerender({ search: "a" });
		expect(mockFetch).toHaveBeenCalledTimes(2);

		rerender({ search: "b" });
		await waitFor(() =>
			expect(result.current.data).toEqual([
				"/Monolith/api/auth/users?limit=1&offset=0&search=b",
			]),
		);
	});

	it("reads wrapped rows with select", async () => {
		const pagedRooms = async (
			input: { limit: number; offset: number },
			options: RequestInit = {},
		) => {
			const response = await get<{ rooms: string[] }>(
				`${Env.MODULE}/api/rooms?limit=${input.limit}&offset=${input.offset}`,
				options,
			);
			return response.data;
		};
		respondWith(() => ({ rooms: ["r1"] }));
		const { result } = renderHook(() =>
			useIteratorApi(pagedRooms, undefined, {
				select: (response) => response.rooms,
			}),
		);

		await waitFor(() => expect(result.current.data).toEqual(["r1"]));
	});

	it("aborts a page that is replaced", async () => {
		respondWith((url) => [url], 20);
		const { rerender } = renderHook(
			({ search }: { search: string }) =>
				useIteratorApi(pagedUsers, { search }),
			{ initialProps: { search: "a" } },
		);
		await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

		rerender({ search: "b" });
		await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
		expect(
			(mockFetch.mock.calls[0][1] as RequestInit).signal?.aborted,
		).toBe(true);
	});

	it("still takes fetchPage(limit, offset) with a deps array", async () => {
		const fetchPage = vi.fn((limit: number, offset: number) =>
			Promise.resolve([`${limit}-${offset}`]),
		);
		const { result } = renderHook(() =>
			useIteratorApi(fetchPage, { limit: 2 }, []),
		);

		await waitFor(() => expect(result.current.data).toEqual(["2-0"]));
	});
});
