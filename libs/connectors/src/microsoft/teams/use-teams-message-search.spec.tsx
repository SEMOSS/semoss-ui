import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runConnectorPixel } from "../../core/connector-pixel";
import {
	type TeamsMessageSearch,
	useTeamsMessageSearch,
} from "./use-teams-message-search";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "origin" }),
}));
vi.mock("../../core/connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../core/connector-pixel")>()),
	runConnectorPixel: vi.fn(),
}));
const read = vi.mocked(runConnectorPixel);
let snapshot: TeamsMessageSearch | undefined;
let root: Root;
let container: HTMLDivElement;
const Harness = ({ search }: { search: string }) => {
	snapshot = useTeamsMessageSearch(search);
	return null;
};
const current = (): TeamsMessageSearch => {
	if (!snapshot) {
		throw new Error("Hook has not rendered");
	}
	return snapshot;
};
const render = async (search: string) => {
	await act(async () => root.render(<Harness search={search} />));
};
const ids = (): string[] =>
	current().query.data?.hits.map((hit) => hit.id) ?? [];
const page = (
	names: string[],
	nextOffset: number,
	hasMore: boolean,
	day = 20,
) => ({
	hasMore: hasMore,
	nextOffset: nextOffset,
	messages: names.map((name, index) => ({
		id: name,
		kind: "chat",
		chatId: `19:${name}`,
		createdDateTime: `2026-10-${String(day - index).padStart(2, "0")}T00:00:00Z`,
		summary: name,
	})),
});

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	read.mockReset();
	snapshot = undefined;
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("reads nothing while nothing is searched", async () => {
	await render("");
	expect(read).not.toHaveBeenCalled();
	expect(current().query.status).toBe("idle");
	expect(current().onShowMore).toBeUndefined();
});

it("adds each next page below the ones read, from where the last one stopped", async () => {
	read.mockResolvedValueOnce(page(["a", "b"], 31, true));
	await render("budget");
	expect(read.mock.calls[0]?.[0]).not.toContain("offset");
	expect(ids()).toEqual(["a", "b"]);

	// a match the page before showed is not listed twice, and the rows
	// already shown keep their places
	read.mockResolvedValueOnce(page(["b", "c", "new"], 56, false, 25));
	await act(async () => current().onShowMore?.());
	expect(read.mock.calls[1]?.[0]).toContain("offset=[31]");
	expect(ids()).toEqual(["a", "b", "c", "new"]);
	expect(current().onShowMore).toBeUndefined();
});

it("has no Show More past the 100 a single read used to stop at", async () => {
	for (let pageIndex = 0; pageIndex < 5; pageIndex++) {
		read.mockResolvedValueOnce(
			page([`m${pageIndex}`], (pageIndex + 1) * 25, pageIndex < 4),
		);
	}
	await render("budget");
	for (let more = 0; more < 4; more++) {
		await act(async () => current().onShowMore?.());
	}
	expect(read).toHaveBeenCalledTimes(5);
	expect(read.mock.calls[4]?.[0]).toContain("offset=[100]");
	expect(ids()).toHaveLength(5);
});

it("starts a new search from its first page, even one searched before", async () => {
	read.mockResolvedValueOnce(page(["a"], 25, true));
	await render("budget");
	read.mockResolvedValueOnce(page(["b"], 50, true));
	await act(async () => current().onShowMore?.());
	expect(ids()).toEqual(["a", "b"]);

	read.mockResolvedValueOnce(page(["x"], 25, false));
	await render("invoice");
	expect(ids()).toEqual(["x"]);

	read.mockResolvedValueOnce(page(["a"], 25, true));
	await render("budget");
	expect(read.mock.calls[3]?.[0]).not.toContain("offset");
	expect(ids()).toEqual(["a"]);
});

it("keeps what was found when a further page fails, and reads it again", async () => {
	read.mockResolvedValueOnce(page(["a"], 25, true));
	await render("budget");
	read.mockRejectedValueOnce(new Error("network"));
	await act(async () => current().onShowMore?.());
	expect(ids()).toEqual(["a"]);
	expect(current().pageError?.message).toBe("network");

	read.mockResolvedValueOnce(page(["b"], 50, false));
	await act(async () => current().onShowMore?.());
	expect(read.mock.calls[2]?.[0]).toContain("offset=[25]");
	expect(ids()).toEqual(["a", "b"]);
	expect(current().pageError).toBeNull();
});

it("drops a page that arrives after the search changed", async () => {
	let resolveOld: (value: unknown) => void = () => undefined;
	read.mockReturnValueOnce(
		new Promise((resolve) => {
			resolveOld = resolve;
		}),
	);
	await render("budget");
	read.mockResolvedValueOnce(page(["x"], 25, false));
	await render("invoice");
	await act(async () => resolveOld(page(["old"], 25, true)));
	expect(ids()).toEqual(["x"]);
});
