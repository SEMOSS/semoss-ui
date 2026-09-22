import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import { Button, Dialog, DialogContent } from "@semoss/ui/next";
import { PopoutModal } from "../../../../../libs/shared/src/components/cell-output/cell-output-block";
import type {
	FileExplorerApi,
	FileExplorerContextMenuState,
} from "../../../../../libs/shared/src/components/file/file-explorer.types";
import { FileExplorerContextMenu } from "../../../../../libs/shared/src/components/file/file-explorer-context-menu";
import { CatalogGridItem } from "../catalog/catalog-grid-item";
import { LLMSelectDialog } from "../llms/llm-select-dialog";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../../../../../libs/shared/src/components/html", () => ({
	SandpackHtmlPreview: () => null,
}));
vi.mock("@/utility", () => ({
	formatToDataTestId: (text: string) => text,
	getTagBadgeStyle: () => ({}),
}));

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
beforeAll(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});
afterAll(() => {
	vi.unstubAllGlobals();
	HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
});

const catalogId = "example";
const item = { name: "report.csv", path: "/reports/report.csv" };
const menuState: FileExplorerContextMenuState = {
	x: 30,
	y: 40,
	item,
	targetPath: "/reports/",
};
function explorerFixture(selectedItems = [item]) {
	return {
		commands: {
			copyPath: vi.fn().mockResolvedValue(undefined),
			copy: vi.fn(),
			cut: vi.fn(),
			paste: vi.fn(),
			rename: vi.fn(),
			download: vi.fn(),
			remove: vi.fn(),
			openNewFile: vi.fn(),
		},
		capabilities: { mutate: true, download: true, delete: true },
		tree: { selectedItems, clipboard: null, closeContextMenu: vi.fn() },
	};
}
function ExplorerHarness({
	fixture,
	state = menuState,
}: {
	fixture: ReturnType<typeof explorerFixture>;
	state?: FileExplorerContextMenuState;
}) {
	const [open, setOpen] = useState(false);
	const explorer = {
		...fixture,
		tree: {
			...fixture.tree,
			closeContextMenu: () => {
				fixture.tree.closeContextMenu();
				setOpen(false);
			},
		},
	} as unknown as FileExplorerApi;
	return (
		<>
			<Button onClick={() => setOpen(true)}>File actions</Button>
			{open && (
				<FileExplorerContextMenu explorer={explorer} state={state} />
			)}
		</>
	);
}
function openFileMenu() {
	const trigger = screen.getByRole("button", { name: "File actions" });
	act(() => trigger.focus());
	fireEvent.click(trigger);
	return trigger;
}

describe("popup keyboard and action behavior", () => {
	test.each(["LIST", "CARD"] as const)(
		"%s catalog menu has a contextual label and dispatches its action",
		async (variant) => {
			const action = vi.fn();
			render(
				<MemoryRouter>
					<CatalogGridItem
						variant={variant}
						path="/app/example"
						name="Example app"
						description="Description"
						id={catalogId}
						icon={null}
						tags={[]}
						dateCreated="2026-09-01"
						dateLastEdited="2026-09-01"
						actions={null}
						menuItems={[
							{ icon: null, label: "Edit app", onClick: action },
						]}
					/>
				</MemoryRouter>,
			);
			const trigger = screen.getByRole("button", {
				name: "Actions for Example app",
			});
			expect(trigger).not.toHaveAttribute("title");
			act(() => trigger.focus());
			fireEvent.keyDown(trigger, { key: "ArrowDown" });
			const menuItem = await screen.findByRole("menuitem", {
				name: "Edit app",
			});
			await waitFor(() => expect(menuItem).toHaveFocus());
			fireEvent.keyDown(menuItem, { key: "Enter" });
			await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
			await waitFor(() =>
				expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
			);
		},
	);

	test("file menu restores focus on Escape", async () => {
		render(<ExplorerHarness fixture={explorerFixture()} />);
		const trigger = openFileMenu();
		const menu = await screen.findByRole("menu");
		fireEvent.keyDown(menu, { key: "ArrowDown" });
		await waitFor(() =>
			expect(
				screen.getByRole("menuitem", {
					name: "fileExplorer.contextMenu.copyPath",
				}),
			).toHaveFocus(),
		);
		fireEvent.keyDown(document.activeElement as HTMLElement, {
			key: "Escape",
		});
		await waitFor(() =>
			expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	test("bulk menu disables single-file actions and keeps all selected files in copy", async () => {
		const second = { name: "other.csv", path: "/reports/other.csv" };
		const fixture = explorerFixture([item, second]);
		render(<ExplorerHarness fixture={fixture} />);
		openFileMenu();
		const menu = await screen.findByRole("menu");
		expect(
			screen.getByRole("menuitem", {
				name: "fileExplorer.contextMenu.copyPath",
			}),
		).toHaveAttribute("aria-disabled", "true");
		expect(
			screen.getByRole("menuitem", {
				name: "fileExplorer.contextMenu.rename",
			}),
		).toHaveAttribute("aria-disabled", "true");
		fireEvent.keyDown(menu, { key: "ArrowDown" });
		const copy = screen.getByRole("menuitem", {
			name: "fileExplorer.contextMenu.copy",
		});
		await waitFor(() => expect(copy).toHaveFocus());
		fireEvent.keyDown(copy, { key: "Enter" });
		expect(fixture.commands.copy).toHaveBeenCalledWith([item, second]);
	});

	test("file menu copies the requested directory over empty space", async () => {
		const fixture = explorerFixture([]);
		render(
			<ExplorerHarness
				fixture={fixture}
				state={{ ...menuState, item: null }}
			/>,
		);
		openFileMenu();
		fireEvent.click(
			await screen.findByRole("menuitem", {
				name: "fileExplorer.contextMenu.copyPath",
			}),
		);
		expect(fixture.commands.copyPath).toHaveBeenCalledWith("/reports/");
		await waitFor(() =>
			expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
		);
	});

	test("expanded output is named, receives focus and restores focus after dismissal", async () => {
		function OutputHarness() {
			const [open, setOpen] = useState(false);
			return (
				<>
					<Button onClick={() => setOpen(true)}>Expand output</Button>
					{open && (
						<PopoutModal
							title="Output"
							onClose={() => setOpen(false)}
						>
							<Button>Copy output</Button>
						</PopoutModal>
					)}
				</>
			);
		}
		render(<OutputHarness />);
		const trigger = screen.getByRole("button", { name: "Expand output" });
		act(() => trigger.focus());
		fireEvent.click(trigger);
		const dialog = await screen.findByRole("dialog", { name: "Output" });
		await waitFor(() =>
			expect(dialog.contains(document.activeElement)).toBe(true),
		);
		fireEvent.keyDown(document.activeElement as HTMLElement, {
			key: "Escape",
		});
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	test("builder model dialog has one close control and an accessible title", () => {
		const close = vi.fn();
		render(
			<Dialog open>
				<DialogContent showCloseButton={false}>
					<LLMSelectDialog
						llmList={[]}
						selectedLLM=""
						onSelect={vi.fn()}
						onClose={close}
					/>
				</DialogContent>
			</Dialog>,
		);
		expect(
			screen.getByRole("dialog", { name: "Builder model" }),
		).toBeInTheDocument();
		const buttons = screen.getAllByRole("button", { name: /close/i });
		expect(buttons).toHaveLength(1);
		fireEvent.click(buttons[0]);
		expect(close).toHaveBeenCalledTimes(1);
	});
});
