import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { KnowledgeLibrary } from "@/features/knowledge/knowledge-library";

/** The stubs the mocked modules call, reset before each test. */
const mocks = vi.hoisted(() => ({
	listKnowledgeEngines: vi.fn(),
	setEngineFavorite: vi.fn(),
	navigate: vi.fn(),
	closeNewKnowledge: null as ((knowledge?: unknown) => void) | null,
	// stable, as the session's own insight is
	insight: {
		withInsight: (task: (insightId: string) => Promise<unknown>) =>
			task("insight-1"),
	},
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-router", async (original) => ({
	...(await original<typeof import("react-router")>()),
	useNavigate: () => mocks.navigate,
}));
vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	listKnowledgeEngines: mocks.listKnowledgeEngines,
	setEngineFavorite: mocks.setEngineFavorite,
}));
vi.mock("@semoss/sdk/react", () => ({
	useSessionInsight: () => mocks.insight,
}));
vi.mock("@/features/knowledge/new-knowledge-overlay", () => ({
	NewKnowledgeOverlay: ({
		onClose,
	}: {
		onClose: (knowledge?: unknown) => void;
	}) => {
		mocks.closeNewKnowledge = onClose;
		return null;
	},
}));

const SOURCES = [
	{
		engine_id: "kb-1",
		engine_name: "policies",
		engine_display_name: "Policies",
		tag: ["FDA", "CDER"],
		engine_date_created: "2026-01-02 03:04:05",
		engine_favorite: 1,
	},
	{
		engine_id: "kb-2",
		engine_name: "notes",
		tag: "Personal",
		engine_date_created: "2026-03-01 00:00:00",
	},
	{ engine_id: "kb-3", engine_name: "" },
];

/** Renders the library in a router. */
const renderLibrary = () =>
	render(
		<MemoryRouter>
			<KnowledgeLibrary />
		</MemoryRouter>,
	);

/** The names of the sources listed, in order. */
const listedNames = () =>
	screen
		.queryAllByRole("link")
		.map((link) => link.textContent)
		.filter(Boolean);

beforeEach(() => {
	vi.clearAllMocks();
	mocks.listKnowledgeEngines.mockResolvedValue(SOURCES);
	mocks.setEngineFavorite.mockResolvedValue(undefined);
});

test("lists every source with its tags, and links each to its page", async () => {
	renderLibrary();

	expect(
		await screen.findByRole("link", { name: "Policies" }),
	).toHaveAttribute("href", "/knowledge/kb-1");
	expect(mocks.listKnowledgeEngines).toHaveBeenCalledWith("insight-1", {
		engineId: undefined,
	});
	expect(listedNames()).toEqual([
		"knowledge:messages.untitled",
		"notes",
		"Policies",
	]);
	// one tag or several read the same way
	expect(screen.getAllByText("Personal").length).toBeGreaterThan(0);
	expect(screen.getAllByText("CDER").length).toBeGreaterThan(0);
});

test("opens a new chat on a source", async () => {
	renderLibrary();
	await screen.findByRole("link", { name: "Policies" });

	const row = screen
		.getByRole("link", { name: "Policies" })
		.closest("div.group") as HTMLElement;
	await userEvent.click(
		within(row).getByRole("button", { name: "knowledge:actions.newChat" }),
	);

	expect(mocks.navigate).toHaveBeenCalledWith("/new?knowledgeId=kb-1");
});

test("filters by search, scope and favorites, and sorts by date", async () => {
	const user = userEvent.setup();
	renderLibrary();
	await screen.findByRole("link", { name: "Policies" });

	await user.type(
		screen.getByRole("textbox", { name: "common:buttons.search" }),
		"cder",
	);
	expect(listedNames()).toEqual(["Policies"]);
	await user.clear(
		screen.getByRole("textbox", { name: "common:buttons.search" }),
	);

	// every known tag counts as a center, so only untagged sources are "mine"
	await user.click(screen.getByRole("tab", { name: "knowledge:tabs.mine" }));
	expect(listedNames()).toEqual(["knowledge:messages.untitled"]);
	await user.click(
		screen.getByRole("tab", { name: "knowledge:tabs.global" }),
	);
	expect(listedNames()).toEqual(["notes", "Policies"]);
	await user.click(screen.getByRole("tab", { name: "knowledge:tabs.all" }));

	await user.click(
		screen.getByRole("button", { name: "knowledge:studio.favorites" }),
	);
	expect(listedNames()).toEqual(["Policies"]);
	await user.click(
		screen.getByRole("button", { name: "knowledge:studio.favorites" }),
	);

	await user.click(
		screen.getByRole("button", { name: /knowledge:studio.sortName/ }),
	);
	await user.click(
		screen.getByRole("button", { name: "knowledge:studio.sortDate" }),
	);
	expect(listedNames()).toEqual([
		"notes",
		"Policies",
		"knowledge:messages.untitled",
	]);
});

test("favorites a source, and takes it back when the save fails", async () => {
	const user = userEvent.setup();
	renderLibrary();
	await screen.findByRole("link", { name: "Policies" });

	const favoriteOf = (name: string) =>
		within(
			screen
				.getByRole("link", { name })
				.closest("div.group") as HTMLElement,
		).getByRole("button", { name: "knowledge:studio.favorite" });

	expect(favoriteOf("notes")).toHaveAttribute("aria-pressed", "false");
	await user.click(favoriteOf("notes"));
	expect(mocks.setEngineFavorite).toHaveBeenCalledWith("kb-2", true);
	expect(favoriteOf("notes")).toHaveAttribute("aria-pressed", "true");

	mocks.setEngineFavorite.mockRejectedValueOnce(new Error("Forbidden"));
	await user.click(favoriteOf("Policies"));
	expect(mocks.setEngineFavorite).toHaveBeenCalledWith("kb-1", false);
	await waitFor(() =>
		expect(favoriteOf("Policies")).toHaveAttribute("aria-pressed", "true"),
	);
});

test("reads the sources again on Retry after a failure", async () => {
	vi.spyOn(console, "error").mockImplementation(() => undefined);
	mocks.listKnowledgeEngines.mockRejectedValueOnce(new Error("Down"));
	renderLibrary();

	await userEvent.click(
		await screen.findByRole("button", { name: "knowledge:studio.retry" }),
	);

	expect(
		await screen.findByRole("link", { name: "Policies" }),
	).toBeInTheDocument();
	expect(mocks.listKnowledgeEngines).toHaveBeenCalledTimes(2);
});

test("reads the sources by the known tags once one is created", async () => {
	renderLibrary();
	await screen.findByRole("link", { name: "Policies" });

	mocks.closeNewKnowledge?.({ id: "kb-4" });

	await waitFor(() =>
		expect(mocks.listKnowledgeEngines).toHaveBeenLastCalledWith(
			"insight-1",
			{ tags: ["FDA", "CDER", "FDA", "Personal"] },
		),
	);
});
