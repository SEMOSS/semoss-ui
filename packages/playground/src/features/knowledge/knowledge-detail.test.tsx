import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { KnowledgeDetail } from "@/features/knowledge/knowledge-detail";

/** The stubs the mocked modules call, reset before each test. */
const mocks = vi.hoisted(() => ({
	listKnowledgeEngines: vi.fn(),
	listVectorDocuments: vi.fn(),
	getEngineAsset: vi.fn(),
	getEngineAssetBase64: vi.fn(),
	downloadVectorFile: vi.fn(),
	ensure: vi.fn(),
	download: vi.fn(),
	membersTable: vi.fn(),
	isDirectoryAvailable: true,
	// stable, as the session's own insight is
	insight: {} as Record<string, unknown>,
}));
mocks.insight = {
	withInsight: (task: (insightId: string) => Promise<unknown>) =>
		task("insight-1"),
	ensure: mocks.ensure,
	download: mocks.download,
};
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { count?: number }) =>
			options?.count === undefined ? key : `${key}:${options.count}`,
	}),
}));
vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	listKnowledgeEngines: mocks.listKnowledgeEngines,
	listVectorDocuments: mocks.listVectorDocuments,
	getEngineAsset: mocks.getEngineAsset,
	getEngineAssetBase64: mocks.getEngineAssetBase64,
	downloadVectorFile: mocks.downloadVectorFile,
}));
vi.mock("@semoss/sdk/react", () => ({
	useSessionInsight: () => mocks.insight,
	useConfig: (
		selector: (state: { config: { msGraphLookup: boolean } }) => unknown,
	) => selector({ config: { msGraphLookup: mocks.isDirectoryAvailable } }),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	MembersTable: (props: Record<string, unknown>) => {
		mocks.membersTable(props);
		return <div>members table</div>;
	},
}));
vi.mock("@/features/knowledge/embed-documents-overlay", () => ({
	EmbedDocumentsOverlay: () => null,
}));

/** Renders the page for the source `kb-1`. */
const renderDetail = () =>
	render(
		<MemoryRouter>
			<KnowledgeDetail knowledgeId="kb-1" />
		</MemoryRouter>,
	);

beforeEach(() => {
	vi.clearAllMocks();
	mocks.isDirectoryAvailable = true;
	mocks.listKnowledgeEngines.mockResolvedValue([
		{
			engine_id: "kb-1",
			engine_name: "policies",
			engine_display_name: "Policies",
			description: "Agency policies",
			tag: "FDA",
		},
	]);
	mocks.listVectorDocuments.mockResolvedValue([
		{
			fileName: "notes.txt",
			fileSize: 2,
			lastModified: "2026-01-02 03:04:05",
		},
		{
			fileName: "chart.png",
			fileSize: 2048,
			lastModified: "2026-02-01 00:00:00",
		},
		{ fileName: "data.xlsx" },
	]);
	URL.createObjectURL = vi.fn(() => "blob:preview");
	URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("shows the source and its documents, with their sizes", async () => {
	renderDetail();

	expect(
		await screen.findByRole("heading", { name: "Policies" }),
	).toBeInTheDocument();
	expect(screen.getByText("Agency policies")).toBeInTheDocument();
	expect(screen.getByText("FDA")).toBeInTheDocument();
	expect(mocks.listKnowledgeEngines).toHaveBeenCalledWith("insight-1", {
		engineId: "kb-1",
	});
	expect(mocks.listVectorDocuments).toHaveBeenCalledWith("insight-1", "kb-1");

	expect(
		await screen.findByText("knowledge:studio.documentCount:3"),
	).toBeInTheDocument();
	// the server sends kilobytes
	expect(screen.getByText("2.0 KB")).toBeInTheDocument();
	expect(screen.getByText("2.0 MB")).toBeInTheDocument();
});

test("sorts the documents by a column, and flips it on a second click", async () => {
	const user = userEvent.setup();
	renderDetail();
	await screen.findByRole("button", { name: "notes.txt" });

	const names = () =>
		screen
			.getAllByRole("button", { name: /^[a-z]+\.(txt|png|xlsx)$/ })
			.map((button) => button.textContent);
	expect(names()).toEqual(["chart.png", "data.xlsx", "notes.txt"]);

	await user.click(
		screen.getByRole("button", { name: "knowledge:studio.size" }),
	);
	expect(names()).toEqual(["data.xlsx", "notes.txt", "chart.png"]);
	await user.click(
		screen.getByRole("button", { name: "knowledge:studio.size" }),
	);
	expect(names()).toEqual(["chart.png", "notes.txt", "data.xlsx"]);
});

test("previews a text document", async () => {
	mocks.getEngineAsset.mockResolvedValue("Hello there");
	renderDetail();

	await userEvent.click(
		await screen.findByRole("button", { name: "notes.txt" }),
	);

	expect(await screen.findByText("Hello there")).toBeInTheDocument();
	expect(mocks.getEngineAsset).toHaveBeenCalledWith(
		"insight-1",
		"kb-1",
		"/schema/default/documents/notes.txt",
	);
});

test("previews an image, and frees it when the preview closes", async () => {
	mocks.getEngineAssetBase64.mockResolvedValue("aGk=");
	renderDetail();

	await userEvent.click(
		await screen.findByRole("button", { name: "chart.png" }),
	);

	expect(
		await screen.findByRole("img", { name: "chart.png" }),
	).toHaveAttribute("src", "blob:preview");
	expect(mocks.getEngineAssetBase64).toHaveBeenCalledWith(
		"insight-1",
		"kb-1",
		"/schema/default/documents/chart.png",
	);

	await userEvent.keyboard("{Escape}");
	await waitFor(() =>
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview"),
	);
});

test("says when a document has no preview, without reading it", async () => {
	renderDetail();

	await userEvent.click(
		await screen.findByRole("button", { name: "data.xlsx" }),
	);

	expect(
		await screen.findByText("knowledge:studio.previewUnavailable"),
	).toBeInTheDocument();
	expect(mocks.getEngineAsset).not.toHaveBeenCalled();
	expect(mocks.getEngineAssetBase64).not.toHaveBeenCalled();
});

test("says when a preview fails to load", async () => {
	mocks.getEngineAsset.mockRejectedValue(new Error("Gone"));
	renderDetail();

	await userEvent.click(
		await screen.findByRole("button", { name: "notes.txt" }),
	);

	expect(
		await screen.findByText("knowledge:studio.previewError"),
	).toBeInTheDocument();
});

test("downloads a document from the session's insight", async () => {
	mocks.downloadVectorFile.mockResolvedValue("file-key");
	renderDetail();

	await userEvent.click(
		await screen.findByRole("button", {
			name: "common:fileExplorer.contextMenu.download: notes.txt",
		}),
	);

	await waitFor(() =>
		expect(mocks.download).toHaveBeenCalledWith("file-key"),
	);
	expect(mocks.ensure).toHaveBeenCalled();
	expect(mocks.downloadVectorFile).toHaveBeenCalledWith(
		"insight-1",
		"kb-1",
		"notes.txt",
	);
});

test("shows the source's members in the shared members table", async () => {
	const user = userEvent.setup();
	renderDetail();
	await screen.findByRole("heading", { name: "Policies" });

	expect(screen.queryByText("members table")).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("tab", { name: "knowledge:studio.permissions" }),
	);

	expect(await screen.findByText("members table")).toBeInTheDocument();
	expect(mocks.membersTable).toHaveBeenLastCalledWith({
		id: "kb-1",
		type: "ENGINE",
		isDirectoryAvailable: true,
	});
});

test("shows the documents' failure", async () => {
	mocks.listVectorDocuments.mockRejectedValue(new Error("No access"));
	renderDetail();

	expect(
		await screen.findByText("knowledge:detail.failedToLoadDocuments"),
	).toBeInTheDocument();
});
