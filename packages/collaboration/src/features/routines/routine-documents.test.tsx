import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FILE_PANEL_COMPONENTS, FILE_PANEL_TYPES } from "@semoss/panels";
import { useWorkbenchPanel, type WorkbenchPanelProps } from "@semoss/workbench";
import { RoutineDocuments } from "./routine-documents";

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
// upload button has something to open.
const openNewFile = vi.fn();
function StubExplorer({ id }: WorkbenchPanelProps) {
	const { setValue } = useWorkbenchPanel(id);
	useEffect(
		() =>
			setValue({
				capabilities: { upload: true },
				commands: { openNewFile },
			}),
		[setValue],
	);
	return <p>Routine files</p>;
}
const components = {
	[FILE_PANEL_TYPES.FILE_EXPLORER]: {
		...FILE_PANEL_COMPONENTS[FILE_PANEL_TYPES.FILE_EXPLORER],
		content: StubExplorer,
	},
};

beforeEach(() => {
	api.open.mockReset();
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
afterEach(cleanup);

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

	it("reports when the folder cannot be opened", async () => {
		api.open.mockRejectedValue(new Error("Routine not found"));
		render(<RoutineDocuments routineId="r1" components={components} />);
		expect(
			await screen.findByText("Routine not found"),
		).toBeInTheDocument();
		expect(screen.queryByText("Routine files")).not.toBeInTheDocument();
	});
});
