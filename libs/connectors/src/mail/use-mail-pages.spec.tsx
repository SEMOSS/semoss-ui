import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runConnectorPixel } from "../core/connector-pixel";
import {
	type MailPageOptions,
	type MailPages,
	useMailPages,
} from "./use-mail-pages";

const insight = vi.hoisted(() => ({ insightId: "origin" }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../core/connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("../core/connector-pixel")>()),
	runConnectorPixel: vi.fn(),
}));
const read = vi.mocked(runConnectorPixel);
const defaults: MailPageOptions = {
	provider: "microsoft",
	folder: "inbox",
	subject: "",
	unreadOnly: false,
	isGrouped: true,
};
let snapshot: MailPages | undefined;
let root: Root;
let container: HTMLDivElement;
const Harness = ({ options }: { options: MailPageOptions }) => {
	snapshot = useMailPages(options);
	return null;
};
const current = (): MailPages => {
	if (!snapshot) throw new Error("Hook has not rendered");
	return snapshot;
};
const render = async (options = defaults) => {
	await act(async () => root.render(<Harness options={options} />));
};
const page = (start: number, count = 25, hasMore = true) => ({
	count,
	hasMore,
	messages: Array.from({ length: count }, (_, index) => ({
		id: String(start + index),
	})),
});
const deferred = () => {
	let resolve: (value: unknown) => void = () => undefined;
	let reject: (reason: unknown) => void = () => undefined;
	const promise = new Promise<unknown>((onResolve, onReject) => {
		resolve = onResolve;
		reject = onReject;
	});
	return { promise, resolve, reject };
};
beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	read.mockReset();
	insight.insightId = "origin";
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("loads more than 100 messages through successive fixed 25-message pages", async () => {
	for (let offset = 0; offset < 125; offset += 25)
		read.mockResolvedValueOnce(page(offset, 25, offset < 100));
	await render();
	for (let index = 0; index < 4; index++)
		await act(async () => current().loadMore());
	expect(current().data).toHaveLength(125);
	expect(current().hasMore).toBe(false);
	expect(
		read.mock.calls.map(([pixel]) => pixel.match(/offset=\[(\d+)\]/)?.[1]),
	).toEqual(["0", "25", "50", "75", "100"]);
	expect(
		read.mock.calls.every(([pixel]) => pixel.includes("limit=[25]")),
	).toBe(true);
});

it("advances by raw count while dropping malformed entries and deduplicating IDs", async () => {
	read.mockResolvedValueOnce({
		count: 3,
		hasMore: true,
		messages: [
			{ id: "a", subject: "original" },
			{},
			{ id: "a", subject: "duplicate" },
		],
	});
	read.mockResolvedValueOnce({
		count: 2,
		hasMore: false,
		messages: [{ id: "a", subject: "new" }, { id: "b" }],
	});
	await render();
	const original = current().data?.[0];
	await act(async () => current().loadMore());
	expect(read.mock.calls[1]?.[0]).toContain("offset=[3]");
	expect(current().data?.map(({ id }) => id)).toEqual(["a", "b"]);
	expect(current().data?.[0]).toBe(original);
	expect(current().data?.[0]?.subject).toBe("original");
});

it("blocks concurrent pages and retains results for retry at the failed offset", async () => {
	const pending = deferred();
	read.mockResolvedValueOnce(page(0))
		.mockReturnValueOnce(pending.promise)
		.mockResolvedValueOnce(page(25, 25, false));
	await render();
	await act(async () => {
		current().loadMore();
		current().loadMore();
	});
	expect(read).toHaveBeenCalledTimes(2);
	await act(async () => pending.reject(new Error("network")));
	expect(current().data).toHaveLength(25);
	expect(current().status).toBe("ready");
	expect(current().pageError?.message).toBe("network");
	await act(async () => current().loadMore());
	expect(read.mock.calls[2]?.[0]).toContain("offset=[25]");
	expect(current().data).toHaveLength(50);
});

it.each([
	{ folder: "sent" },
	{ subject: "hello" },
	{ unreadOnly: true },
	{ isGrouped: false },
	{ provider: "google" as const },
])(
	"restarts pagination and discards stale responses after %j",
	async (changed) => {
		const pending = deferred();
		read.mockResolvedValueOnce(page(0))
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValueOnce(page(200, 1, false));
		await render();
		await act(async () => current().loadMore());
		await render({ ...defaults, ...changed });
		await act(async () => pending.resolve(page(25)));
		expect(current().data?.map(({ id }) => id)).toEqual(["200"]);
		expect(read.mock.calls[2]?.[0]).toContain("offset=[0]");
	},
);

it("refresh and insight changes discard outstanding pages and reset the cursor", async () => {
	const pending = deferred();
	read.mockResolvedValueOnce(page(0))
		.mockReturnValueOnce(pending.promise)
		.mockResolvedValueOnce(page(200, 1, false))
		.mockResolvedValueOnce(page(300, 1, false));
	await render();
	await act(async () => current().loadMore());
	await act(async () => current().reload());
	await act(async () => pending.resolve(page(25)));
	expect(current().data?.[0]?.id).toBe("200");
	insight.insightId = "other";
	await render();
	expect(read.mock.calls[3]).toEqual([
		expect.stringContaining("offset=[0]"),
		"other",
	]);
	expect(current().data?.[0]?.id).toBe("300");
});

it("does not loop or claim completion when a server page is empty but hasMore", async () => {
	read.mockResolvedValueOnce(page(0))
		.mockResolvedValueOnce(page(25, 0, true))
		.mockResolvedValueOnce(page(25, 0, false));
	await render();
	await act(async () => current().loadMore());
	expect(current().data).toHaveLength(25);
	expect(current().hasMore).toBe(true);
	expect(current().pageError).not.toBeNull();
	expect(read).toHaveBeenCalledTimes(2);
	await act(async () => current().loadMore());
	expect(read.mock.calls[2]?.[0]).toContain("offset=[25]");
	expect(current().hasMore).toBe(false);
});
