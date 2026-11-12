import "@testing-library/jest-dom";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import { AGENT_FILES_PANEL, AGENT_FILES_PATH } from "./agent-files-panel";

/** What the panel's read of the project's top folder answers with. */
interface TopFolderRead {
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	data: unknown[];
	error?: Error;
	refresh: () => void;
}

// one object for each hook across renders: a fresh one per render would look
// like a change on every pass
const mocks = vi.hoisted(() => ({
	run: vi.fn(),
	refresh: vi.fn(),
	toastError: vi.fn(),
	pixel: vi.fn(),
	topFolder: null as unknown as TopFolderRead,
	access: { status: "ready", readOnly: false, refresh: vi.fn() },
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { run: mocks.run } }),
	useInsightPixel: (pixel: string) => {
		mocks.pixel(pixel);
		return mocks.topFolder;
	},
}));
// the explorer is the shared panel; what matters here is when it mounts
vi.mock("@semoss/panels", () => ({
	FILE_PANEL_TYPES: { FILE_EXPLORER: "file-explorer" },
	FILE_PANEL_COMPONENTS: {
		"file-explorer": {
			name: "Files",
			content: () => <div data-testid="agent-files-panel-explorer" />,
		},
	},
	useAccess: () => mocks.access,
}));
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	toast: { error: mocks.toastError },
}));

const PANEL_ID = "agent-files";
const PUBLIC_FOLDER = { name: "public", path: "/public/", type: "directory" };
const OTHER_FOLDER = { name: "portals", path: "/portals/", type: "directory" };
const AgentFiles = AGENT_FILES_PANEL.content;

// the panel reads the agent's project from its own record in the dock
const renderPanel = () => {
	const workbench = createWorkbenchStore({ components: {} });
	workbench.getState().layout.actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [PANEL_ID],
			activeId: PANEL_ID,
		},
		panels: {
			[PANEL_ID]: {
				id: PANEL_ID,
				type: "AGENT_FILES",
				name: "Agent Files",
				config: {
					mode: { type: "APP", app: "agent-1" },
					rootPath: AGENT_FILES_PATH,
				},
			},
		},
	});

	return render(
		<WorkbenchProvider store={workbench}>
			<AgentFiles id={PANEL_ID} />
		</WorkbenchProvider>,
	);
};

describe("the Agent Files panel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.access = { status: "ready", readOnly: false, refresh: vi.fn() };
		mocks.topFolder = {
			status: "SUCCESS",
			data: [OTHER_FOLDER],
			refresh: mocks.refresh,
		};
	});
	afterEach(cleanup);

	it("opens the explorer once the agent has a files folder", () => {
		mocks.topFolder.data = [OTHER_FOLDER, PUBLIC_FOLDER];
		renderPanel();

		expect(
			screen.getByTestId("agent-files-panel-explorer"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Anyone who can use the agent can read them too/),
		).toBeInTheDocument();
		expect(mocks.pixel).toHaveBeenCalledWith(
			'BrowseAppAssets(filePath=["/"], project=["agent-1"]);',
		);
		expect(mocks.run).not.toHaveBeenCalled();
	});

	it("adds the folder only when someone who can edit the agent asks for it", async () => {
		renderPanel();

		expect(screen.queryByTestId("agent-files-panel-explorer")).toBeNull();
		expect(mocks.run).not.toHaveBeenCalled();

		mocks.run.mockResolvedValue({ pixelReturn: [] });
		fireEvent.click(screen.getByRole("button", { name: "Add Files" }));

		await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
		expect(mocks.run.mock.calls).toEqual([
			[
				'NewAppAssetsDirectory(project=["agent-1"], filePath=["/public"]);',
			],
		]);
	});

	it("offers someone who can only view the agent nothing to add", () => {
		mocks.access = { status: "ready", readOnly: true, refresh: vi.fn() };
		renderPanel();

		expect(
			screen.getByText("This agent has no files of its own."),
		).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Add Files" })).toBeNull();
		expect(screen.queryByTestId("agent-files-panel-explorer")).toBeNull();
	});

	it("says why the folder could not be added and lets it be tried again", async () => {
		mocks.run.mockRejectedValue(new Error("Unable to create directory"));
		renderPanel();

		fireEvent.click(screen.getByRole("button", { name: "Add Files" }));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"Unable to create directory",
			),
		);
		expect(mocks.refresh).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Add Files" })).toBeEnabled();
	});

	it("reports a top folder it could not read, with Retry", () => {
		mocks.topFolder = {
			status: "ERROR",
			data: [],
			error: new Error("Project agent-1 does not exist"),
			refresh: mocks.refresh,
		};
		renderPanel();

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Project agent-1 does not exist",
		);
		fireEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});

	it("waits for the top folder before saying anything about files", () => {
		mocks.topFolder = {
			status: "LOADING",
			data: [],
			refresh: mocks.refresh,
		};
		renderPanel();

		expect(
			screen.getByLabelText("Loading agent files"),
		).toBeInTheDocument();
		expect(screen.queryByText("No agent files yet")).toBeNull();
	});
});
