import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FILE_PANEL_COMPONENTS, FILE_PANEL_TYPES } from "@semoss/panels";
import type { FileItem } from "@semoss/shared";
import {
	useWorkbench,
	useWorkbenchPanel,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { RoutineDocuments } from "./routine-documents";
import { RoutineDocumentsDock } from "./routine-documents-dock";

const api = vi.hoisted(() => ({
	open: vi.fn<
		() => Promise<{
			path: string;
			documents: { name: string; size: number; updatedAt: string }[];
		}>
	>(),
}));
// one stable insight, as the SDK context gives; a new object per render would re-arm the load effect
const insight = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	insightId: "insight-1",
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => insight,
}));
vi.mock("./custom-routine-api", () => ({
	openRoutineDocuments: api.open,
}));

// the real explorer talks to SEMOSS; the dock around it is what this tests. The
// stub publishes an explorer api the way the real pane does, so the dock's own
// upload button has something to open, and says what files it was opened on.
const openNewFile = vi.fn();
function StubExplorer({ id }: WorkbenchPanelProps) {
	const { config, setValue } = useWorkbenchPanel(id);
	const selectPanel = useWorkbench((s) => s.layout.actions.selectPanel);
	useEffect(
		() =>
			setValue({
				capabilities: { upload: true },
				commands: { openNewFile },
				tree: {
					selectItem: (item: FileItem) =>
						selectPanel(
							"preview",
							{ path: item.path },
							{ name: item.name },
						),
				},
			}),
		[selectPanel, setValue],
	);
	return (
		<>
			<p>Routine files</p>
			<p>Opened on {JSON.stringify(config)}</p>
		</>
	);
}
const components = {
	preview: { content: () => <p>File preview</p> },
	[FILE_PANEL_TYPES.FILE_EXPLORER]: {
		...FILE_PANEL_COMPONENTS[FILE_PANEL_TYPES.FILE_EXPLORER],
		content: StubExplorer,
	},
};

beforeEach(() => {
	api.open.mockReset();
	openNewFile.mockClear();
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	});
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("RoutineDocuments", () => {
	it("opens the routine's folder, then shows the file dock rooted there", async () => {
		api.open.mockResolvedValue({
			path: "/collaboration/routines/r1",
			documents: [],
		});
		render(<RoutineDocuments routineId="r1" components={components} />);
		expect(screen.getByText("Opening documents...")).toBeInTheDocument();
		expect(await screen.findByText("Routine files")).toBeInTheDocument();
		expect(api.open).toHaveBeenCalledWith(expect.anything(), "r1");
		// the owner's own files, starting in the routine's folder
		expect(
			screen.getByText(
				'Opened on {"mode":{"type":"USER"},"initialPath":"/collaboration/routines/r1"}',
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Opening documents..."),
		).not.toBeInTheDocument();
	});

	it("offers upload above the files and opens the explorer's upload form", async () => {
		const user = userEvent.setup();
		api.open.mockResolvedValue({
			path: "/collaboration/routines/r1",
			documents: [],
		});
		render(<RoutineDocuments routineId="r1" components={components} />);
		await user.click(
			await screen.findByRole("button", { name: "Upload documents" }),
		);
		expect(openNewFile).toHaveBeenCalledExactlyOnceWith(
			undefined,
			"upload",
		);
	});

	it("opens its explorer on the files it is given, such as an agent's folder it is kept to", async () => {
		render(
			<RoutineDocumentsDock
				config={{
					mode: { type: "APP", app: "twin-1" },
					rootPath: "/public",
				}}
				components={components}
			/>,
		);
		expect(
			await screen.findByText(
				'Opened on {"mode":{"type":"APP","app":"twin-1"},"rootPath":"/public"}',
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Upload documents" }),
		).toBeInTheDocument();
	});

	it("reports when the folder cannot be opened", async () => {
		api.open.mockRejectedValue(new Error("Routine not found"));
		render(<RoutineDocuments routineId="r1" components={components} />);
		expect(
			await screen.findByText("Routine not found"),
		).toBeInTheDocument();
		expect(screen.queryByText("Routine files")).not.toBeInTheDocument();
	});

	it.each([1024, 450])(
		"opens files from Library at %i px, then returns there when the preview closes",
		async (width) => {
			vi.spyOn(
				HTMLElement.prototype,
				"getBoundingClientRect",
			).mockReturnValue(new DOMRect(0, 0, width, 600));
			const user = userEvent.setup();
			render(
				<RoutineDocumentsDock
					config={{
						mode: { type: "APP", app: "twin-1" },
						rootPath: "/public",
					}}
					components={components}
					renderOverview={(explorer) => (
						<button
							type="button"
							disabled={!explorer}
							onClick={() =>
								explorer?.tree.selectItem({
									name: "Plans.md",
									path: "/Plans.md",
								})
							}
						>
							Open plans
						</button>
					)}
				/>,
			);
			const library = await screen.findByRole("tab", { name: "Library" });
			const documents = screen.getByRole("tab", { name: "Documents" });
			expect(library).toHaveAttribute("aria-selected", "true");
			expect(documents).toHaveAttribute("aria-selected", "false");
			if (width >= 768) {
				expect(documents).toHaveAttribute("tabindex", "0");
				documents.focus();
				await user.keyboard("{Enter}");
				expect(documents).toHaveAttribute("aria-selected", "true");
				await user.keyboard("{Enter}");
				expect(documents).toHaveAttribute("aria-selected", "false");
			}
			await user.click(
				screen.getByRole("button", { name: "Upload documents" }),
			);
			expect(openNewFile).toHaveBeenCalledExactlyOnceWith(
				undefined,
				"upload",
			);
			await user.click(
				await screen.findByRole("button", { name: "Open plans" }),
			);
			const preview = screen.getByRole("tab", { name: /Plans\.md/ });
			expect(preview).toHaveAttribute("aria-selected", "true");
			expect(await screen.findByText("File preview")).toBeVisible();
			preview.focus();
			await user.keyboard("{Delete}");
			expect(library).toHaveAttribute("aria-selected", "true");
			expect(
				await screen.findByRole("button", { name: "Open plans" }),
			).toBeVisible();
		},
	);
});
