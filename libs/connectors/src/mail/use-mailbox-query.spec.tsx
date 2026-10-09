import { Activity, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectorSignInError } from "../core/connector-pixel";
import { type MailboxQuery, useMailboxQuery } from "./use-mailbox-query";

const mocks = vi.hoisted(() => ({ insightId: "room-one", run: vi.fn() }));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: mocks.insightId }),
}));
vi.mock("../core/connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("../core/connector-pixel")>()),
	runConnectorPixel: mocks.run,
}));

type Options = Parameters<typeof useMailboxQuery>[0];
const options: Options = {
	provider: "microsoft",
	folder: "inbox",
	subject: "",
	unreadOnly: false,
};
let root: Root;
let container: HTMLDivElement;
let query: MailboxQuery | undefined;

function Harness(props: Options) {
	query = useMailboxQuery(props);
	return null;
}

function current(): MailboxQuery {
	if (!query) throw new Error("The mailbox has not rendered");
	return query;
}

async function render(
	overrides: Partial<Options> = {},
	mode: "visible" | "hidden" = "visible",
) {
	await act(async () =>
		root.render(
			<Activity mode={mode}>
				<Harness {...options} {...overrides} />
			</Activity>,
		),
	);
}

function page(offset: number, hasMore = true) {
	return {
		messages: Array.from({ length: 25 }, (_, index) => ({
			id: `message-${offset + index}`,
		})),
		hasMore,
	};
}

function deferred() {
	let resolve: (value: unknown) => void = () => undefined;
	const promise = new Promise<unknown>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	mocks.insightId = "room-one";
	mocks.run.mockReset();
	query = undefined;
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

describe("mailbox pagination", () => {
	it.each(["microsoft", "google"] as const)(
		"reads %s beyond 100 messages and stops when the server finishes",
		async (provider) => {
			mocks.run.mockImplementation(async (pixel: string) => {
				const offset = Number(/offset=\[(\d+)\]/.exec(pixel)?.[1]);
				return page(offset, offset < 125);
			});
			await render({ provider });
			for (let index = 0; index < 5; index++) {
				await act(async () => current().loadMore());
			}
			expect(current().data?.messages).toHaveLength(150);
			expect(current().data?.hasMore).toBe(false);
			expect(mocks.run.mock.calls.map(([pixel]) => pixel)).toEqual(
				[0, 25, 50, 75, 100, 125].map((offset) =>
					expect.stringContaining(`limit=[25], offset=[${offset}]`),
				),
			);
			await act(async () => current().loadMore());
			expect(mocks.run).toHaveBeenCalledTimes(6);
		},
	);

	it("advances by raw count while deduplicating overlapping results", async () => {
		mocks.run
			.mockResolvedValueOnce(page(0))
			.mockResolvedValueOnce({
				messages: [{ id: "message-24" }, {}, { id: "message-25" }],
				hasMore: true,
			})
			.mockResolvedValueOnce({ messages: [], hasMore: false });
		await render();
		await act(async () => current().loadMore());
		expect(current().data?.messages).toHaveLength(26);
		await act(async () => current().loadMore());
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining("offset=[28]"),
			"room-one",
		);
	});

	it("advances by server count when the page includes fewer raw entries", async () => {
		mocks.run
			.mockResolvedValueOnce({
				count: 25,
				messages: [{ id: "one" }, {}],
				hasMore: true,
			})
			.mockResolvedValueOnce({ messages: [], hasMore: false });
		await render();
		expect(current().data?.messages).toHaveLength(1);
		await act(async () => current().loadMore());
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining("offset=[25]"),
			"room-one",
		);
	});

	it("keeps rows during an append and ignores repeated clicks while pending", async () => {
		const pending = deferred();
		mocks.run
			.mockResolvedValueOnce(page(0))
			.mockReturnValueOnce(pending.promise);
		await render();
		await act(async () => {
			current().loadMore();
			current().loadMore();
		});
		expect(mocks.run).toHaveBeenCalledTimes(2);
		expect(current().isRefreshing).toBe(true);
		expect(current().data?.messages).toHaveLength(25);
		await act(async () => pending.resolve(page(25, false)));
		expect(current().isRefreshing).toBe(false);
		expect(current().data?.messages).toHaveLength(50);
	});

	it.each([
		new Error("Network unavailable"),
		new ConnectorSignInError("MICROSOFT", "Please sign in"),
	])("retains rows and retries a failed page: %s", async (error) => {
		mocks.run
			.mockResolvedValueOnce(page(0))
			.mockRejectedValueOnce(error)
			.mockResolvedValueOnce(page(25, false));
		await render();
		await act(async () => current().loadMore());
		expect(current().status).toBe("ready");
		expect(current().data?.messages).toHaveLength(25);
		expect(current().loadMoreError?.message).toBe(error.message);
		await act(async () => current().loadMore());
		expect(current().loadMoreError).toBeNull();
		expect(current().data?.messages).toHaveLength(50);
		expect(mocks.run.mock.calls[1]).toEqual(mocks.run.mock.calls[2]);
	});

	it.each([
		{ folder: "sentitems" },
		{ subject: "Budget" },
		{ unreadOnly: true },
		{ provider: "google" as const },
	])(
		"resets offsets and rejects a stale page after filters change: %j",
		async (changed) => {
			const pending = deferred();
			mocks.run
				.mockResolvedValueOnce(page(0))
				.mockReturnValueOnce(pending.promise)
				.mockResolvedValueOnce({
					messages: [{ id: "new-list" }],
					hasMore: false,
				});
			await render();
			await act(async () => current().loadMore());
			await render(changed);
			await act(async () => pending.resolve(page(25)));
			expect(
				current().data?.messages.map((message) => message.id),
			).toEqual(["new-list"]);
			expect(mocks.run).toHaveBeenLastCalledWith(
				expect.stringContaining("offset=[0]"),
				"room-one",
			);
		},
	);

	it.each(["insight", "refresh"])(
		"isolates a late append after %s changes",
		async (change) => {
			const pending = deferred();
			mocks.run
				.mockResolvedValueOnce(page(0))
				.mockReturnValueOnce(pending.promise)
				.mockResolvedValueOnce({
					messages: [{ id: "fresh" }],
					hasMore: false,
				});
			await render();
			await act(async () => current().loadMore());
			if (change === "insight") {
				mocks.insightId = "room-two";
				await render();
			} else {
				await act(async () => current().reload());
			}
			await act(async () => pending.resolve(page(25)));
			expect(
				current().data?.messages.map((message) => message.id),
			).toEqual(["fresh"]);
			expect(mocks.run).toHaveBeenLastCalledWith(
				expect.stringContaining("offset=[0]"),
				change === "insight" ? "room-two" : "room-one",
			);
		},
	);

	it("reports an empty page that claims more instead of looping its offset", async () => {
		mocks.run
			.mockResolvedValueOnce(page(0))
			.mockResolvedValueOnce({ messages: [], hasMore: true });
		await render();
		await act(async () => current().loadMore());
		expect(current().data?.messages).toHaveLength(25);
		expect(current().loadMoreError?.kind).toBe("other");
	});

	it("retains accumulated pages when Activity hides and reveals the viewer", async () => {
		mocks.run
			.mockResolvedValueOnce(page(0))
			.mockResolvedValueOnce(page(25))
			.mockResolvedValueOnce(page(50, false));
		await render();
		await act(async () => current().loadMore());
		await render({}, "hidden");
		await render();
		expect(current().data?.messages).toHaveLength(50);
		expect(current().isRefreshing).toBe(false);
		expect(mocks.run).toHaveBeenCalledTimes(2);
		await act(async () => current().loadMore());
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining("offset=[50]"),
			"room-one",
		);
		expect(current().data?.messages).toHaveLength(75);
	});

	it.each(["hidden", "visible"] as const)(
		"discards an interrupted append that completes while %s and retries its offset",
		async (settlesWhile) => {
			const pending = deferred();
			mocks.run
				.mockResolvedValueOnce(page(0))
				.mockResolvedValueOnce(page(25))
				.mockReturnValueOnce(pending.promise)
				.mockResolvedValueOnce(page(50, false));
			await render();
			await act(async () => current().loadMore());
			await act(async () => current().loadMore());
			await render({}, "hidden");
			if (settlesWhile === "visible") await render();
			await act(async () =>
				pending.resolve({
					messages: [{ id: "stale" }],
					hasMore: false,
				}),
			);
			if (settlesWhile === "hidden") await render();
			expect(current().data?.messages).toHaveLength(50);
			expect(current().isRefreshing).toBe(false);
			expect(mocks.run).toHaveBeenCalledTimes(3);
			await act(async () => current().loadMore());
			expect(mocks.run.mock.calls[2]).toEqual(mocks.run.mock.calls[3]);
			expect(current().data?.messages).toHaveLength(75);
			expect(
				current().data?.messages.some(
					(message) => message.id === "stale",
				),
			).toBe(false);
		},
	);

	it("refreshes a retained list from offset zero and retains only the refreshed pages", async () => {
		mocks.run
			.mockResolvedValueOnce(page(0))
			.mockResolvedValueOnce(page(25))
			.mockResolvedValueOnce({
				messages: [{ id: "fresh" }],
				hasMore: false,
			});
		await render();
		await act(async () => current().loadMore());
		await render({}, "hidden");
		await render();
		await act(async () => current().reload());
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining("offset=[0]"),
			"room-one",
		);
		await render({}, "hidden");
		await render();
		expect(current().data?.messages.map((message) => message.id)).toEqual([
			"fresh",
		]);
		expect(mocks.run).toHaveBeenCalledTimes(3);
	});
});
