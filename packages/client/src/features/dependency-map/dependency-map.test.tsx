import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DependencyMapPage } from "@/pages/settings/dependency-map.page";
import { DependencyMap } from "./dependency-map";

// the drawer's scroll area measures itself; jsdom has no ResizeObserver
globalThis.ResizeObserver ??= class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
};

const GRAPH = {
	nodes: [
		{
			id: "agent",
			kind: "PROJECT",
			type: "WORKSPACE",
			name: "Claims Agent",
			x: 0,
			y: 0,
			dependencyCount: 1,
		},
		{
			id: "model",
			kind: "ENGINE",
			type: "MODEL",
			name: "GPT Model",
			x: 400,
			y: 0,
			dependentCount: 1,
		},
		{
			id: "lonely",
			kind: "ENGINE",
			type: "DATABASE",
			name: "Claims DB",
			x: 0,
			y: 400,
		},
	],
	edges: [
		{
			id: "agent|model|AGENT_MODEL",
			source: "agent",
			target: "model",
			role: "AGENT_MODEL",
			isAutomatic: true,
		},
	],
	stats: {
		nodes: 3,
		edges: 1,
		automatic: 1,
		manual: 0,
		missing: 0,
		isolated: 1,
		cycles: 0,
		components: 2,
	},
	bounds: { width: 640, height: 464 },
};

const mocks = vi.hoisted(() => ({
	pixel: {
		status: "SUCCESS" as "SUCCESS" | "ERROR" | "LOADING",
		error: null as Error | null,
	},
	refresh: vi.fn(),
	runPixel: vi.fn(),
	adminMode: true,
}));

vi.mock("@semoss/sdk/react", () => ({
	runPixel: mocks.runPixel,
	usePixel: (pixel: string) =>
		pixel.startsWith("AdminGetCatalogDependencyGraph")
			? {
					status: mocks.pixel.status,
					data: mocks.pixel.status === "SUCCESS" ? GRAPH : null,
					error: mocks.pixel.error,
					refresh: mocks.refresh,
				}
			: { status: "INITIAL", data: null, error: null, refresh: vi.fn() },
	useSession: () => false,
}));

vi.mock("@semoss/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/shared")>()),
	AppCatalogAvatar: () => <span data-testid="project-image" />,
	EngineSubtypeIcon: () => <span data-testid="engine-logo" />,
	PersonIdentity: ({ name }: { name: string }) => <span>{name}</span>,
	useCatalogImageUrl: () => "",
}));

vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	useIsMobile: () => false,
}));

vi.mock("@/hooks/useSettings", () => ({
	useSettings: () => ({ adminMode: mocks.adminMode }),
}));

// the map's overlays sit in React Flow panels, which need its store
vi.mock("@xyflow/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@xyflow/react")>()),
	Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// React Flow needs layout jsdom lacks; the canvas lists its nodes instead
vi.mock("./dependency-map-canvas", () => ({
	DependencyMapCanvas: ({
		index,
		emphasis,
		onSelectNode,
		children,
	}: {
		index: { graph: { nodes: { id: string; name: string }[] } };
		emphasis: { nodes: Map<string, string> };
		onSelectNode: (id: string) => void;
		children: ReactNode;
	}) => (
		<section aria-label="Canvas">
			<ul aria-label="Items">
				{index.graph.nodes.map((node) => (
					<li
						key={node.id}
						data-emphasis={emphasis.nodes.get(node.id)}
					>
						<button
							type="button"
							onClick={() => onSelectNode(node.id)}
						>
							{node.name}
						</button>
					</li>
				))}
			</ul>
			{children}
		</section>
	),
}));

afterEach(() => {
	cleanup();
	mocks.pixel = { status: "SUCCESS", error: null };
	mocks.refresh.mockReset();
	mocks.runPixel.mockReset();
	mocks.adminMode = true;
});

const renderMap = (path = "/settings/dependencies") =>
	render(
		<MemoryRouter initialEntries={[path]}>
			<Routes>
				<Route
					path="/settings/dependencies"
					element={<DependencyMap />}
				/>
			</Routes>
		</MemoryRouter>,
	);

const canvasItem = (name: string) =>
	within(screen.getByRole("list", { name: "Items" }))
		.getByRole("button", { name })
		.closest("li");

describe("DependencyMap", () => {
	it("shows the counts, and dims the types the filters hide", async () => {
		renderMap();
		expect(screen.getByText("3 items · 1 links")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Filters" }));
		const models = await screen.findByRole("checkbox", { name: "Models" });
		expect(models).toBeChecked();
		// hiding a type dims its items rather than moving anything
		fireEvent.click(models);
		expect(canvasItem("GPT Model")).toHaveAttribute(
			"data-emphasis",
			"dimmed",
		);
		expect(canvasItem("Claims Agent")).toHaveAttribute(
			"data-emphasis",
			"normal",
		);
		expect(
			screen.getByRole("button", { name: "Filters, 1 on" }),
		).toBeInTheDocument();
	});

	it("keeps the legend folded on the canvas until asked", () => {
		renderMap();
		const canvas = screen.getByRole("region", { name: "Canvas" });
		expect(
			within(canvas).queryByRole("list", { name: "Types" }),
		).toBeNull();
		fireEvent.click(
			within(canvas).getByRole("button", { name: "Show the legend" }),
		);
		expect(
			within(canvas).getByRole("list", { name: "Types" }),
		).toHaveTextContent("Models");
	});

	it("highlights search matches and jumps to one", () => {
		renderMap();
		const search = screen.getByRole("searchbox", {
			name: "Search the map by name or id",
		});
		fireEvent.change(search, { target: { value: "claims" } });
		expect(canvasItem("Claims Agent")).toHaveAttribute(
			"data-emphasis",
			"match",
		);
		expect(canvasItem("GPT Model")).toHaveAttribute(
			"data-emphasis",
			"dimmed",
		);
		expect(screen.getByText("2 matches")).toBeInTheDocument();

		fireEvent.keyDown(search, { key: "Enter" });
		expect(screen.getByText("1 of 2")).toBeInTheDocument();
		expect(
			screen.getByRole("complementary", { name: "Claims Agent" }),
		).toBeInTheDocument();
	});

	it("opens a drawer beside the canvas with what an item uses and what uses it", () => {
		renderMap();
		fireEvent.click(screen.getByRole("button", { name: "GPT Model" }));
		const drawer = screen.getByRole("complementary", { name: "GPT Model" });
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(
			within(drawer).getByRole("link", { name: "Open in Catalog" }),
		).toHaveAttribute("href", "/model/model");
		fireEvent.mouseDown(
			within(drawer).getByRole("tab", { name: "Used by 1" }),
		);
		expect(
			within(drawer).getByRole("region", { name: "Used by" }),
		).toHaveTextContent("Claims Agent");
		fireEvent.mouseDown(
			within(drawer).getByRole("tab", { name: "Uses 0" }),
		);
		expect(
			within(drawer).getByRole("region", { name: "Uses" }),
		).toHaveTextContent("None");
	});

	it("links an item to its security and audit views in Resource Governance", () => {
		renderMap();
		fireEvent.click(screen.getByRole("button", { name: "GPT Model" }));
		const drawer = screen.getByRole("complementary", { name: "GPT Model" });
		fireEvent.mouseDown(
			within(drawer).getByRole("tab", { name: "Security" }),
		);
		const audit = within(drawer).getByRole("link", {
			name: /Audit Trail \(opens in a new tab\)/,
		});
		expect(audit).toHaveAttribute(
			"href",
			"/settings/resources/MODEL/model?tab=audit-trail",
		);
		expect(audit).toHaveAttribute("target", "_blank");
		expect(
			within(drawer).getByRole("link", { name: /^Apps/ }),
		).toHaveAttribute("href", "/settings/resources/MODEL/model?tab=apps");
	});

	it("closes the drawer with Close or Escape", () => {
		renderMap();
		fireEvent.click(screen.getByRole("button", { name: "GPT Model" }));
		fireEvent.click(screen.getByRole("button", { name: "Close details" }));
		expect(screen.queryByRole("complementary")).toBeNull();

		fireEvent.click(screen.getByRole("button", { name: "GPT Model" }));
		fireEvent.keyDown(
			screen.getByRole("complementary", { name: "GPT Model" }),
			{
				key: "Escape",
			},
		);
		expect(screen.queryByRole("complementary")).toBeNull();
	});

	it("traces what uses an item from its drawer", () => {
		renderMap();
		fireEvent.click(screen.getByRole("button", { name: "GPT Model" }));
		fireEvent.click(
			screen.getByRole("button", { name: "Trace what uses it" }),
		);
		expect(canvasItem("GPT Model")).toHaveAttribute(
			"data-emphasis",
			"root",
		);
		expect(canvasItem("Claims Agent")).toHaveAttribute(
			"data-emphasis",
			"traced",
		);
		expect(canvasItem("Claims DB")).toHaveAttribute(
			"data-emphasis",
			"dimmed",
		);
		expect(
			screen.getByText("A change affects 1: 1 Agent"),
		).toBeInTheDocument();
	});

	it("traces the item clicked in the Trace view", () => {
		renderMap();
		fireEvent.click(screen.getByRole("radio", { name: "Trace" }));
		expect(
			screen.getByText("Click an item on the map to trace it."),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Claims Agent" }));
		expect(canvasItem("Claims Agent")).toHaveAttribute(
			"data-emphasis",
			"root",
		);
		expect(canvasItem("GPT Model")).toHaveAttribute(
			"data-emphasis",
			"traced",
		);
		fireEvent.click(screen.getByRole("button", { name: "Stop tracing" }));
		expect(canvasItem("GPT Model")).toHaveAttribute(
			"data-emphasis",
			"normal",
		);
	});

	it("opens a trace from a link to an item", () => {
		renderMap(
			"/settings/dependencies?focus=agent&lens=trace&dir=DEPENDENCIES",
		);
		expect(canvasItem("Claims Agent")).toHaveAttribute(
			"data-emphasis",
			"root",
		);
		expect(canvasItem("GPT Model")).toHaveAttribute(
			"data-emphasis",
			"traced",
		);
	});

	it("expands the map into the window, drawer included", async () => {
		renderMap();
		fireEvent.click(screen.getByRole("button", { name: "Expand the map" }));
		const expanded = await screen.findByRole("dialog", {
			name: "Dependency Map",
		});
		fireEvent.click(
			within(expanded).getByRole("button", { name: "GPT Model" }),
		);
		expect(
			within(expanded).getByRole("complementary", { name: "GPT Model" }),
		).toBeInTheDocument();
		fireEvent.click(
			within(expanded).getByRole("button", { name: "Collapse the map" }),
		);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	});

	it("syncs the automatic dependencies and reads the map again", async () => {
		mocks.runPixel.mockResolvedValue({
			pixelReturn: [
				{
					operationType: ["OPERATION"],
					output: {
						engines: 2,
						agents: 1,
						automations: 0,
						blocks: 0,
						code: 0,
						failed: ["model"],
					},
				},
			],
		});
		renderMap();
		fireEvent.click(screen.getByRole("button", { name: "Sync" }));
		const dialog = await screen.findByRole("dialog");
		fireEvent.click(within(dialog).getByRole("button", { name: "Sync" }));
		expect(
			await within(dialog).findByText(
				"Synced. The map shows the new links.",
			),
		).toBeInTheDocument();
		expect(
			within(dialog).getByText("1 could not be read"),
		).toBeInTheDocument();
		expect(
			within(dialog).getByRole("button", { name: "GPT Model" }),
		).toBeInTheDocument();
		expect(mocks.refresh).toHaveBeenCalledTimes(1);
	});

	it("shows why the map could not be read, with Retry", () => {
		mocks.pixel = { status: "ERROR", error: new Error("Not an admin") };
		renderMap();
		expect(screen.getByText("Not an admin")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(mocks.refresh).toHaveBeenCalled();
	});
});

describe("DependencyMapPage", () => {
	it("sends anyone outside admin mode back to Settings", async () => {
		mocks.adminMode = false;
		render(
			<MemoryRouter initialEntries={["/settings/dependencies"]}>
				<Routes>
					<Route path="/settings" element={<p>Settings home</p>} />
					<Route
						path="/settings/dependencies"
						element={<DependencyMapPage />}
					/>
				</Routes>
			</MemoryRouter>,
		);
		await waitFor(() =>
			expect(screen.getByText("Settings home")).toBeInTheDocument(),
		);
	});
});
