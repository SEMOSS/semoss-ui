import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { ToolWorkbenchProvider } from "../tools/components/tool-workbench-provider";
import { openToolWorkbenchFiles } from "../tools/open-tool-workbench-files";
import { useToolWorkbench } from "../tools/tool-workbench.context";
import {
	CALENDAR_BROWSER_PANEL,
	createRoomConnectorLayout,
	EMAIL_BROWSER_PANEL,
} from "./room-connectors.constants";

// The real dock owns the interaction; inert bodies avoid connector/file requests.
const inertPanel = { content: () => null, canClose: false, canDrag: false };
const components = {
	[FILE_PANEL_TYPES.FILE_EXPLORER]: inertPanel,
	[EMAIL_BROWSER_PANEL]: inertPanel,
	[CALENDAR_BROWSER_PANEL]: inertPanel,
};

function ResizeHarness() {
	const workbench = useToolWorkbench();
	return (
		<>
			<button
				type="button"
				onClick={() => openToolWorkbenchFiles(workbench)}
			>
				Open Files
			</button>
			<WorkbenchProvider store={workbench.store}>
				<Workbench snapshot={workbench.snapshot} />
			</WorkbenchProvider>
		</>
	);
}

beforeEach(() => {
	// JSDOM has mouse coordinates but no native pointer-event constructor.
	vi.stubGlobal("PointerEvent", MouseEvent);
	vi.stubGlobal(
		"matchMedia",
		vi.fn((query: string) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
});

afterEach(() => vi.unstubAllGlobals());

function setup(includeFiles: boolean): void {
	render(
		<ToolWorkbenchProvider
			roomId="resize-room"
			insightId="resize-insight"
			components={components}
			createLayout={(id) => createRoomConnectorLayout(id, includeFiles)}
			tools={{}}
			pendingApprovals={[]}
			onApproveTool={vi.fn()}
			onRejectTool={vi.fn()}
			autoReveal={false}
		>
			<ResizeHarness />
		</ToolWorkbenchProvider>,
	);
}

/** Exercise pointer tracking and the rendered separator's live width. */
async function dragBorder(delta: number, expectedWidth: number): Promise<void> {
	const handle = screen.getByRole("separator", { name: "Resize border" });
	// Pointer capture is a browser capability not implemented by JSDOM.
	Object.defineProperty(handle, "setPointerCapture", {
		configurable: true,
		value: vi.fn(),
	});
	fireEvent.pointerDown(handle, { button: 0, clientX: 400 });
	try {
		fireEvent.pointerMove(window, { clientX: 400 + delta });
		await waitFor(() =>
			expect(handle).toHaveAttribute(
				"aria-valuenow",
				String(expectedWidth),
			),
		);
	} finally {
		fireEvent.pointerUp(window);
	}
}

it.each([
	["seeded Files", "Files", true],
	["Emails", "Emails", true],
	["Calendar", "Calendar", true],
	["deferred Files", "Files", false],
] as const)(
	"resizes %s within its limits and retains the width when reopened",
	async (_scenario, name, includeFiles) => {
		setup(includeFiles);
		if (!includeFiles) {
			fireEvent.click(screen.getByRole("button", { name: "Open Files" }));
		} else {
			fireEvent.keyDown(screen.getByRole("tab", { name }), {
				key: "Enter",
			});
		}
		expect(
			screen.getByRole("separator", { name: "Resize border" }),
		).toHaveAttribute("aria-valuenow", "300");
		await dragBorder(120, 420);

		fireEvent.keyDown(screen.getByRole("tab", { name }), { key: "Enter" });
		expect(
			screen.queryByRole("separator", { name: "Resize border" }),
		).not.toBeInTheDocument();
		fireEvent.keyDown(screen.getByRole("tab", { name }), { key: "Enter" });
		expect(
			screen.getByRole("separator", { name: "Resize border" }),
		).toHaveAttribute("aria-valuenow", "420");

		await dragBorder(-1000, 300);
		await dragBorder(1000, 640);
	},
);
