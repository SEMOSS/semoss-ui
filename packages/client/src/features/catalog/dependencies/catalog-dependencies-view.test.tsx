import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@semoss/sdk";
import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogDependencyRow,
	Project,
} from "@semoss/shared";
import type { GraphMenuTarget } from "@/features/dependency-map/dependency-flow-canvas";
import { ProjectCatalogDependenciesPage } from "@/pages/project/project-dependencies.page";
import { CatalogDependenciesView } from "./catalog-dependencies-view";
import type { CanvasEditState } from "./catalog-dependency-canvas";
import type {
	CatalogDependent,
	DependencyGraphView,
} from "./catalog-dependency-graph";

// the dialog's checkboxes and radios measure themselves; jsdom has no ResizeObserver
globalThis.ResizeObserver ??= class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
};

const mocks = vi.hoisted(() => ({
	project: {
		project_type: "CODE",
		permission: "OWNER",
	},
	runPixel: vi.fn(),
	/** The project context's full refresh, which reloads the whole page */
	refreshProject: vi.fn(),
	/** The project context's refresh of the dependencies only */
	refreshDependencies: vi.fn(),
	/** What Add Dependency's search lists */
	options: [] as {
		engine_id: string;
		engine_name: string;
		engine_type: string;
		engine_user_permission?: number;
	}[],
	dependents: {
		dependents: [] as CatalogDependent[],
		hiddenCount: 0,
	},
	dependentsError: undefined as Error | undefined,
}));

vi.mock("@semoss/sdk/react", () => ({
	runPixel: mocks.runPixel,
	usePixel: () => ({
		status: mocks.dependentsError ? "ERROR" : "SUCCESS",
		data: mocks.dependents,
		error: mocks.dependentsError,
		refresh: vi.fn(),
	}),
	useSessionInsight: () => ({ insightId: "insight-1" }),
	useDebouncedValue: (value: string) => value,
	useIteratorPixel: (
		_pixel: unknown,
		_next: unknown,
		map: (response: unknown) => unknown[],
	) => ({
		data: map(mocks.options),
		isLoading: false,
		hasMore: false,
		next: vi.fn(),
	}),
}));

// the drawer sits beside the canvas on a wide screen
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	useIsMobile: () => false,
}));

vi.mock("@semoss/shared", () => ({
	AppCatalogAvatar: () => <span data-testid="project-avatar" />,
	EngineSubtypeIcon: () => <span data-testid="engine-icon" />,
	useCatalogImageUrl: () => "",
}));

// a canvas overlay, such as the edit bar, outside React Flow's store
vi.mock("@xyflow/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@xyflow/react")>()),
	Panel: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

// the canvas is React Flow, which jsdom cannot lay out: draw each item it is
// handed as a button, with its badge and its "+N"
vi.mock("./catalog-dependency-canvas", async () => {
	const { useState } = await import("react");
	const { ContextMenu, ContextMenuContent, ContextMenuTrigger } =
		await import("@semoss/ui/next");
	return {
		CatalogDependencyCanvas: (props: {
			view: DependencyGraphView;
			onSelect: (id: string) => void;
			onExpand: (id: string) => void;
			renderMenu: (target: GraphMenuTarget) => ReactNode;
			edit?: CanvasEditState;
			children?: ReactNode;
		}) => {
			const [target, setTarget] = useState<GraphMenuTarget>({
				kind: "pane",
			});
			const items = props.renderMenu(target);
			return (
				<ContextMenu>
					<ContextMenuTrigger asChild disabled={!items}>
						<div>
							<ul aria-label="Dependency graph">
								{props.view.nodes.map((node) => (
									<li
										key={node.id}
										data-testid={`node-${node.id}`}
									>
										<button
											type="button"
											onClick={() =>
												props.onSelect(node.id)
											}
											onContextMenu={() =>
												setTarget({
													kind: "node",
													id: node.id,
												})
											}
										>
											{node.name}
										</button>
										{props.edit?.links.has(node.id) ? (
											props.edit.links.get(node.id)
												?.isRemoved ? (
												<button
													type="button"
													onClick={() =>
														props.edit?.onRestore(
															node.id,
														)
													}
												>
													{`Undo ${node.name}`}
												</button>
											) : (
												<button
													type="button"
													onClick={() =>
														props.edit?.onRemove(
															node.id,
														)
													}
												>
													{`Remove ${node.name}`}
												</button>
											)
										) : null}
										{node.hiddenChildren > 0 ? (
											<button
												type="button"
												onClick={() =>
													props.onExpand(node.id)
												}
											>
												+{node.hiddenChildren}
											</button>
										) : null}
									</li>
								))}
							</ul>
							{props.children}
						</div>
					</ContextMenuTrigger>
					{items ? (
						<ContextMenuContent className="w-56">
							{items}
						</ContextMenuContent>
					) : null}
				</ContextMenu>
			);
		},
	};
});

vi.mock("@/hooks/use-project", () => ({
	useProject: () => ({
		project: {
			project_id: "owner-1",
			project_name: "Owner",
			project_type: mocks.project.project_type,
		},
		permission: mocks.project.permission,
		dependencies: [],
		dependencyGraph: { nodes: [], links: [] },
		refresh: mocks.refreshProject,
		refreshDependencies: mocks.refreshDependencies,
	}),
}));

afterEach(() => {
	cleanup();
	mocks.runPixel.mockReset();
	mocks.refreshProject.mockReset();
	mocks.refreshDependencies.mockReset();
	mocks.options = [];
	mocks.dependents = { dependents: [], hiddenCount: 0 };
	mocks.dependentsError = undefined;
});

const MODEL: CatalogDependency = {
	catalog_id: "model-1",
	catalog_type: "MODEL",
	catalog_name: "GPT",
	permission_name: "READ_ONLY",
	description: "The model's own catalog description",
	is_private: false,
	can_view_dependencies: false,
};
const VECTOR: CatalogDependency = {
	catalog_id: "vector-1",
	catalog_type: "VECTOR",
	catalog_name: "Policies",
	catalog_discoverable: true,
	is_private: false,
};
const SKILL: CatalogDependency = {
	catalog_id: "skill-1",
	catalog_type: "SKILL",
	catalog_name: "Search",
	catalog_discoverable: true,
	is_private: false,
};
/** A database the user cannot see: the backend sends no name */
const DATABASE: CatalogDependency = {
	catalog_id: "db-1",
	catalog_type: "DATABASE",
	is_private: true,
};
const EMBEDDER: CatalogDependency = {
	catalog_id: "embedder-1",
	catalog_type: "MODEL",
	catalog_name: "Embedder",
	permission_name: "OWNER",
	is_private: false,
};

const link = (
	parent: string,
	target: string,
	fields: Partial<CatalogDependencyLink> = {},
): CatalogDependencyLink => ({
	parent_id: parent,
	catalog_id: target,
	is_automatic: true,
	role: "AGENT_MODEL",
	dependency_name: null,
	dependency_description: null,
	...fields,
});

const LINKS: CatalogDependencyLink[] = [
	link("agent-1", "model-1", {
		dependency_description: "The agent answers with this model",
	}),
	link("agent-1", "model-1", {
		is_automatic: false,
		role: "MANUAL",
		dependency_name: "Drafting",
		dependency_description: "Writes the first draft",
	}),
	link("agent-1", "vector-1", { role: "KNOWLEDGE" }),
	link("agent-1", "skill-1", {
		is_automatic: false,
		role: "MANUAL",
		dependency_name: null,
	}),
	link("agent-1", "db-1", { is_automatic: false, role: "MANUAL" }),
	link("vector-1", "embedder-1", { role: "EMBEDDER" }),
];
const NODES = [MODEL, VECTOR, SKILL, DATABASE, EMBEDDER];

/** The owner's own rows, as `useCatalogDependencies` joins them */
const toRows = (
	links: CatalogDependencyLink[],
	nodes: CatalogDependency[],
): CatalogDependencyRow[] =>
	links
		.filter((l) => l.parent_id === "agent-1")
		.flatMap(({ parent_id: _, ...l }) => {
			const node = nodes.find((n) => n.catalog_id === l.catalog_id);
			return node ? [{ ...node, ...l }] : [];
		});

/** Renders the view for an agent owner. */
const renderAgentView = ({
	nodes = NODES,
	links = LINKS,
	canEdit = true,
	onRefresh = vi.fn(),
}: {
	nodes?: CatalogDependency[];
	links?: CatalogDependencyLink[];
	canEdit?: boolean;
	onRefresh?: () => void;
} = {}) =>
	render(
		<MemoryRouter>
			<CatalogDependenciesView
				catalogId="agent-1"
				catalogType="WORKSPACE"
				catalogName="Helpdesk"
				canEdit={canEdit}
				dependencies={toRows(links, nodes)}
				graph={{ nodes, links }}
				onRefresh={onRefresh}
			/>
		</MemoryRouter>,
	);

/** The toolbar's Save, named by what it would do or why it is off. */
const saveButton = () => screen.getByTestId("catalogDependenciesView-save-btn");

const openNode = (name: string) => {
	fireEvent.click(
		within(
			screen.getByRole("list", { name: "Dependency graph" }),
		).getByRole("button", { name }),
	);
	// the drawer opens beside the canvas
	return screen.getByRole("complementary");
};

describe("CatalogDependenciesView", () => {
	it("draws the owner and what it uses, a private one by its type only", () => {
		renderAgentView();
		const graph = screen.getByRole("list", { name: "Dependency graph" });
		for (const name of ["Helpdesk", "GPT", "Policies", "Search"]) {
			expect(
				within(graph).getByRole("button", { name }),
			).toBeInTheDocument();
		}
		expect(
			within(graph).getByRole("button", { name: "Private Database" }),
		).toBeInTheDocument();
	});

	it("opens on the direct links, and shows the next level on request", () => {
		renderAgentView();
		// the embedder is two links away, beyond the vector database
		expect(screen.queryByTestId("node-embedder-1")).toBeNull();
		fireEvent.click(
			within(screen.getByTestId("node-vector-1")).getByRole("button", {
				name: "+1",
			}),
		);
		expect(screen.getByTestId("node-embedder-1")).toBeInTheDocument();
	});

	it("walks further, and back, from an item's right-click menu", async () => {
		renderAgentView();
		const rightClick = (name: string) =>
			fireEvent.contextMenu(
				within(
					screen.getByRole("list", { name: "Dependency graph" }),
				).getByRole("button", { name }),
			);
		rightClick("Policies");
		fireEvent.click(
			await screen.findByRole("menuitem", {
				name: "Show Next Level (1)",
			}),
		);
		expect(screen.getByTestId("node-embedder-1")).toBeInTheDocument();
		rightClick("Policies");
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "Hide Next Level" }),
		);
		expect(screen.queryByTestId("node-embedder-1")).toBeNull();
	});

	it("offers what fits the item in its right-click menu", async () => {
		renderAgentView();
		const graph = screen.getByRole("list", { name: "Dependency graph" });
		fireEvent.contextMenu(
			within(graph).getByRole("button", { name: "Search" }),
		);
		const menu = await screen.findByRole("menu");
		expect(
			within(menu).getByRole("menuitem", { name: /Open in Catalog/ }),
		).toHaveAttribute("href", "/skill/skill-1");
		fireEvent.click(
			within(menu).getByRole("menuitem", { name: "Request Access" }),
		);
		expect(
			await screen.findByRole("dialog", {
				name: "Request Access to Search",
			}),
		).toBeInTheDocument();
	});

	it("finds an item beyond the direct links and opens it in the drawer", () => {
		renderAgentView();
		expect(screen.queryByTestId("node-embedder-1")).toBeNull();
		const search = screen.getByRole("searchbox", {
			name: "Search the ontology by name or id",
		});
		fireEvent.change(search, { target: { value: "Embedder" } });
		fireEvent.keyDown(search, { key: "Enter" });
		// every level up to it is shown, and it opens beside the canvas
		expect(screen.getByTestId("node-embedder-1")).toBeInTheDocument();
		expect(
			within(screen.getByRole("complementary")).getByRole("heading", {
				name: "Embedder",
			}),
		).toBeInTheDocument();
	});

	it("expands to fill the window, drawer included", () => {
		renderAgentView();
		openNode("GPT");
		fireEvent.click(
			screen.getByRole("button", { name: "Expand the ontology" }),
		);
		const expanded = screen.getByRole("dialog", {
			name: "Helpdesk's ontology",
		});
		expect(
			within(expanded).getByRole("complementary", { name: "GPT" }),
		).toBeInTheDocument();
		fireEvent.click(
			within(expanded).getByRole("button", {
				name: "Collapse the ontology",
			}),
		);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("offers only the details of a private item", async () => {
		renderAgentView();
		const graph = screen.getByRole("list", { name: "Dependency graph" });
		fireEvent.contextMenu(
			within(graph).getByRole("button", { name: "Private Database" }),
		);
		const menu = await screen.findByRole("menu");
		expect(
			within(menu).getByRole("menuitem", { name: "Open Details" }),
		).toBeInTheDocument();
		expect(
			within(menu).queryByRole("menuitem", { name: /Request/ }),
		).toBeNull();
		expect(
			within(menu).queryByRole("menuitem", { name: /Catalog/ }),
		).toBeNull();
	});

	it("shows the item's role, automatic note, manual name and missing-access warning", () => {
		renderAgentView();
		const sheet = openNode("GPT");
		expect(
			within(sheet).getByRole("heading", { name: "GPT" }),
		).toBeInTheDocument();
		expect(
			within(sheet).getByText("The model's own catalog description"),
		).toBeInTheDocument();
		expect(within(sheet).getByText("Read-only")).toBeInTheDocument();
		// one target in two roles: the manual link's name and description
		// are in Code, the automatic one's role and where to change it in
		// Configuration, both open from the start
		const code = within(sheet)
			.getByRole("button", { name: /^Code/ })
			.closest("[data-slot='accordion-item']");
		expect(code).not.toBeNull();
		const codeSection = within(code as HTMLElement);
		expect(codeSection.getByText("Manual")).toBeInTheDocument();
		expect(codeSection.getByText("Drafting").tagName).toBe("CODE");
		expect(
			codeSection.getByText("Writes the first draft"),
		).toBeInTheDocument();
		const configuration = within(sheet)
			.getByRole("button", { name: /^Configuration/ })
			.closest("[data-slot='accordion-item']");
		expect(configuration).not.toBeNull();
		const configurationSection = within(configuration as HTMLElement);
		expect(configurationSection.getByText("Automatic")).toBeInTheDocument();
		expect(
			configurationSection.getByText("Agent model"),
		).toBeInTheDocument();
		expect(
			configurationSection.getByText("The agent answers with this model"),
		).toBeInTheDocument();
		expect(
			configurationSection.getByText(
				/Read-only here\. Change it in Helpdesk's/,
			),
		).toBeInTheDocument();
		expect(
			configurationSection.getByRole("link", { name: "editor" }),
		).toHaveAttribute("href", expect.stringContaining("agent-1"));
		// Lineage, which starts folded, says each link's kind too
		fireEvent.click(
			within(sheet).getByRole("button", { name: /^Lineage/ }),
		);
		// the agent's two links to the model come into it, so Downstream
		const downstream = within(
			within(sheet).getByRole("region", { name: "Downstream" }),
		);
		expect(downstream.getByText("Automatic")).toBeInTheDocument();
		expect(downstream.getByText("Manual")).toBeInTheDocument();
		expect(downstream.getByText("Drafting").tagName).toBe("CODE");
		expect(
			within(sheet).getByText(
				/You don't have access to all dependencies/,
			),
		).toBeInTheDocument();
		expect(
			within(sheet).queryByRole("button", { name: /Request Access/ }),
		).not.toBeInTheDocument();
		expect(
			within(sheet).getByRole("link", { name: /View Its Ontology/ }),
		).toHaveAttribute("href", "/model/model-1/ontology");
	});

	it("re-syncs the automatic dependencies from the configuration and reads them again", async () => {
		mocks.runPixel.mockResolvedValue({
			errors: [],
			pixelReturn: [{ output: { automatic: 3 } }],
		});
		const onRefresh = vi.fn();
		renderAgentView({ onRefresh });
		fireEvent.click(screen.getByRole("button", { name: "Re-sync" }));

		await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'SyncCatalogDependencies(catalogId="agent-1", catalogType="WORKSPACE");',
		);
		expect(screen.getByRole("button", { name: "Re-sync" })).toBeEnabled();
	});

	it("keeps the dependencies as read when a re-sync is refused", async () => {
		mocks.runPixel.mockResolvedValue({
			errors: ["You cannot edit this agent"],
			pixelReturn: [],
		});
		const onRefresh = vi.fn();
		renderAgentView({ onRefresh });
		fireEvent.click(screen.getByRole("button", { name: "Re-sync" }));

		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Re-sync" }),
			).toBeEnabled(),
		);
		expect(mocks.runPixel).toHaveBeenCalledOnce();
		expect(onRefresh).not.toHaveBeenCalled();
	});

	it("offers no Re-sync to viewers", () => {
		renderAgentView({ canEdit: false });
		expect(
			screen.queryByRole("button", { name: "Re-sync" }),
		).not.toBeInTheDocument();
	});

	it("tells nothing about a private item, and offers no request", () => {
		renderAgentView();
		const sheet = openNode("Private Database");
		expect(
			within(sheet).getByRole("heading", { name: "Private Database" }),
		).toBeInTheDocument();
		expect(
			within(sheet).getByText(/You can't see this database/),
		).toBeInTheDocument();
		expect(
			within(sheet).queryByRole("button", { name: /Request Access/ }),
		).not.toBeInTheDocument();
		expect(within(sheet).queryByRole("link", { name: /Open/ })).toBeNull();
	});

	it("walks to another item from the drawer", () => {
		renderAgentView();
		const sheet = openNode("Policies");
		fireEvent.click(
			within(sheet).getByRole("button", { name: /^Lineage/ }),
		);
		fireEvent.click(
			within(sheet).getByRole("button", { name: /Embedder/ }),
		);
		expect(
			within(screen.getByRole("complementary")).getByRole("heading", {
				name: "Embedder",
			}),
		).toBeInTheDocument();
	});

	it("requests one item with the pixel its kind takes", async () => {
		mocks.runPixel.mockResolvedValue({
			errors: [],
			pixelReturn: [{ output: "Requested", operationType: ["SUCCESS"] }],
		});
		const onRefresh = vi.fn();
		renderAgentView({ onRefresh });
		const sheet = openNode("Search");
		fireEvent.click(
			within(sheet).getByRole("button", { name: /Request Access/ }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Request Access to Search",
		});
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Request Access" }),
		);
		await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
		const pixel: string = mocks.runPixel.mock.calls[0]?.[0];
		expect(pixel).toContain(
			'RequestProject(project=["skill-1"], permission=["READ_ONLY"]',
		);
	});

	it("keeps the dialog open with the reason when a request is refused", async () => {
		mocks.runPixel.mockResolvedValue({
			errors: ["Engine 'vector-1' is not requestable"],
			pixelReturn: [],
		});
		const onRefresh = vi.fn();
		renderAgentView({ onRefresh });
		// requests are made one item at a time, from the drawer or the menu
		expect(
			screen.queryByRole("button", { name: /Request Access \(/ }),
		).not.toBeInTheDocument();
		const sheet = openNode("Policies");
		fireEvent.click(
			within(sheet).getByRole("button", { name: /Request Access/ }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Request Access to Policies",
		});
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Request Access" }),
		);

		expect(
			await within(dialog).findByText(
				"Engine 'vector-1' is not requestable",
			),
		).toBeInTheDocument();
		expect(
			within(dialog).getByRole("button", { name: "Try Again" }),
		).toBeInTheDocument();
		expect(String(mocks.runPixel.mock.calls[0]?.[0])).toContain(
			'RequestEngine(engine=["vector-1"]',
		);
		fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
		expect(onRefresh).not.toHaveBeenCalled();
	});

	it("shows what uses it, and one node for the ones the user cannot view", () => {
		mocks.dependents = {
			dependents: [
				{
					dependency_id: "agent-1",
					catalog_id: "app-1",
					catalog_type: "CODE",
					catalog_name: "Portal",
					is_automatic: false,
					role: "MANUAL",
					dependency_name: "helpdesk",
					dependency_description: "Answers questions",
				},
			],
			hiddenCount: 2,
		};
		renderAgentView();
		const graph = screen.getByRole("list", { name: "Dependency graph" });
		expect(
			within(graph).getByRole("button", { name: "Portal" }),
		).toBeInTheDocument();
		const sheet = openNode("2 hidden items");
		expect(
			within(sheet).getByText(/2 items that use Helpdesk are hidden/),
		).toBeInTheDocument();
	});

	it("says why what uses it could not be read, with Retry", () => {
		mocks.dependentsError = new Error("Timed out");
		renderAgentView();
		expect(
			screen.getByText(/Couldn't read what uses this agent: Timed out/),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Retry" }),
		).toBeInTheDocument();
	});

	it("says when there are no dependencies, and offers the edit", () => {
		render(
			<MemoryRouter>
				<CatalogDependenciesView
					catalogId="model-1"
					catalogType="MODEL"
					catalogName="GPT"
					canEdit
					dependencies={[]}
					graph={{ nodes: [], links: [] }}
					onRefresh={vi.fn()}
				/>
			</MemoryRouter>,
		);
		expect(screen.getByText("No dependencies yet")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Edit Dependencies" }),
		).toBeInTheDocument();
	});

	it("notes that automatic dependencies come from the configuration", () => {
		renderAgentView();
		expect(
			screen.getByText(/Automatic dependencies come from this agent/),
		).toBeInTheDocument();
	});
});

describe("editing dependencies on the canvas", () => {
	const startEditing = () => {
		fireEvent.click(
			screen.getByRole("button", { name: "Edit Dependencies" }),
		);
	};

	/** The `dependencies` the last `SetCatalogDependencies` sent */
	const sentPayload = (): unknown => {
		const pixel: string = mocks.runPixel.mock.calls[0]?.[0];
		expect(pixel).toContain(
			'SetCatalogDependencies(catalogId="agent-1", catalogType="WORKSPACE"',
		);
		return JSON.parse(pixel.slice(pixel.indexOf("dependencies=") + 13, -2));
	};

	it("turns the canvas into a draft with an edit bar, and leaves it with nothing changed", () => {
		renderAgentView();
		startEditing();
		expect(screen.getByText("Editing dependencies")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Edit Dependencies" }),
		).not.toBeInTheDocument();
		// Save waits for a change, and says so
		expect(saveButton()).toHaveAttribute("aria-disabled", "true");
		expect(saveButton()).toHaveAccessibleName("Save");
		expect(saveButton()).toHaveAccessibleDescription("No changes to save");
		expect(
			screen.queryByText("Save changes or they will be lost."),
		).not.toBeInTheDocument();
		// only the manual links can be removed
		expect(
			screen.getByRole("button", { name: "Remove Search" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Remove Policies" }),
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Done" }));
		expect(
			screen.queryByText("Editing dependencies"),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	/** Opens a manual link's Edit Dependency dialog from its drawer. */
	const openLinkDialog = (name: string) => {
		const drawer = openNode(name);
		fireEvent.click(
			within(drawer).getByRole("button", { name: "Edit Dependency" }),
		);
		return screen.getByRole("dialog", { name: "Edit Dependency" });
	};

	it("names and describes a manual link in the Edit Dependency dialog and saves every manual link at once", async () => {
		mocks.runPixel.mockResolvedValue({ errors: [], pixelReturn: [] });
		const onRefresh = vi.fn();
		renderAgentView({
			links: [LINKS[0], LINKS[1], LINKS[3]] as CatalogDependencyLink[],
			onRefresh,
		});
		startEditing();

		const dialog = openLinkDialog("Search");
		fireEvent.change(within(dialog).getByLabelText(/^Name/), {
			target: { value: " Lookup " },
		});
		fireEvent.change(
			within(dialog).getByLabelText("Description (Optional)"),
			{ target: { value: "Finds sources" } },
		);
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Update Dependency" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(screen.getByText("1 change")).toBeInTheDocument();
		fireEvent.click(saveButton());

		await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
		expect(mocks.runPixel).toHaveBeenCalledOnce();
		// the automatic link to the model is kept by the backend, never sent
		expect(sentPayload()).toEqual([
			{
				id: "model-1",
				type: "MODEL",
				name: "Drafting",
				description: "Writes the first draft",
			},
			{
				id: "skill-1",
				type: "SKILL",
				name: "Lookup",
				description: "Finds sources",
			},
		]);
		expect(
			screen.queryByText("Editing dependencies"),
		).not.toBeInTheDocument();
	});

	it("adds a named dependency in the Add Dependency dialog, and shows it as any other", async () => {
		mocks.runPixel.mockResolvedValue({ errors: [], pixelReturn: [] });
		mocks.options = [
			{
				engine_id: "skill-1",
				engine_name: "Search",
				engine_type: "SKILL",
			},
			{
				engine_id: "db-2",
				engine_name: "Ledger",
				engine_type: "DATABASE",
				engine_user_permission: 2,
			},
		];
		renderAgentView({ links: [LINKS[3]] as CatalogDependencyLink[] });
		startEditing();
		fireEvent.click(screen.getByRole("button", { name: "Add Dependency" }));

		const dialog = screen.getByRole("dialog", { name: "Add Dependency" });
		// nothing picked yet
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Add Dependency" }),
		);
		expect(
			await within(dialog).findByText("Pick an engine or project"),
		).toBeInTheDocument();
		// a target already linked is listed as Added, and cannot be picked
		expect(
			within(dialog).getByRole("button", { name: /Search/ }),
		).toBeDisabled();
		fireEvent.click(within(dialog).getByRole("button", { name: /Ledger/ }));
		// the name starts as the target's, and cannot be left empty
		const name = within(dialog).getByLabelText(/^Name/);
		expect(name).toHaveValue("Ledger");
		fireEvent.change(name, { target: { value: "  " } });
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Add Dependency" }),
		);
		expect(
			await within(dialog).findByText("Enter a name"),
		).toBeInTheDocument();
		expect(screen.queryByTestId("node-db-2")).not.toBeInTheDocument();

		fireEvent.change(name, { target: { value: "LEDGER" } });
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Add Dependency" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);

		// drawn as any other dependency: nothing opens on its own, and its
		// drawer has the user's access and the same Edit and Remove
		expect(screen.getByTestId("node-db-2")).toBeInTheDocument();
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
		expect(screen.getByText("1 change")).toBeInTheDocument();
		const drawer = openNode("Ledger");
		expect(within(drawer).getAllByText("Editor").length).toBeGreaterThan(0);
		expect(
			within(drawer).getByRole("button", { name: "Edit Dependency" }),
		).toBeInTheDocument();

		fireEvent.click(saveButton());
		await waitFor(() => expect(mocks.runPixel).toHaveBeenCalledOnce());
		expect(sentPayload()).toEqual([
			{ id: "skill-1", type: "SKILL" },
			{ id: "db-2", type: "DATABASE", name: "LEDGER" },
		]);
	});

	it("removes a link until it is undone, and keeps a private one by its id", async () => {
		mocks.runPixel.mockResolvedValue({ errors: [], pixelReturn: [] });
		renderAgentView({
			links: [LINKS[3], LINKS[4]] as CatalogDependencyLink[],
		});
		startEditing();

		fireEvent.click(screen.getByRole("button", { name: "Remove Search" }));
		expect(screen.getByText("1 change")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Undo Search" }));
		expect(screen.queryByText("1 change")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Remove Search" }));
		fireEvent.click(saveButton());
		await waitFor(() => expect(mocks.runPixel).toHaveBeenCalledOnce());
		expect(sentPayload()).toEqual([{ id: "db-1", type: "DATABASE" }]);
	});

	it("refuses a repeated name in the dialog and changes nothing", async () => {
		renderAgentView({
			links: [LINKS[1], LINKS[3]] as CatalogDependencyLink[],
		});
		startEditing();

		const dialog = openLinkDialog("Search");
		const name = within(dialog).getByLabelText(/^Name/);
		fireEvent.change(name, { target: { value: " drafting " } });
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Update Dependency" }),
		);

		expect(
			await within(dialog).findByText(
				"Another dependency already has this name",
			),
		).toBeInTheDocument();
		expect(name).toHaveAttribute("aria-invalid", "true");
		expect(screen.queryByText("1 change")).not.toBeInTheDocument();
		expect(mocks.runPixel).not.toHaveBeenCalled();
	});

	it("keeps the draft and shows why when the save is refused", async () => {
		mocks.runPixel.mockResolvedValue({
			errors: ["Name already used"],
			pixelReturn: [],
		});
		const onRefresh = vi.fn();
		renderAgentView({
			links: [LINKS[3]] as CatalogDependencyLink[],
			onRefresh,
		});
		startEditing();

		const dialog = openLinkDialog("Search");
		fireEvent.change(within(dialog).getByLabelText(/^Name/), {
			target: { value: "Lookup" },
		});
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Update Dependency" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		fireEvent.click(saveButton());

		expect(
			await screen.findByText("Name already used"),
		).toBeInTheDocument();
		expect(screen.getByText("Editing dependencies")).toBeInTheDocument();
		fireEvent.click(
			within(screen.getByRole("complementary")).getByRole("button", {
				name: "Edit Dependency",
			}),
		);
		expect(
			within(
				screen.getByRole("dialog", { name: "Edit Dependency" }),
			).getByLabelText(/^Name/),
		).toHaveValue("Lookup");
		expect(onRefresh).not.toHaveBeenCalled();
	});

	it("closes Add Dependency on Escape in the expanded view, and stays expanded", async () => {
		renderAgentView();
		startEditing();
		fireEvent.click(
			screen.getByRole("button", { name: "Expand the ontology" }),
		);
		const expanded = screen.getByRole("dialog", {
			name: "Helpdesk's ontology",
		});
		fireEvent.click(
			within(expanded).getByRole("button", { name: "Add Dependency" }),
		);
		const search = within(
			screen.getByRole("dialog", { name: "Add Dependency" }),
		).getByRole("searchbox", { name: "Search engines" });
		fireEvent.keyDown(search, { key: "Escape" });
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", { name: "Add Dependency" }),
			).not.toBeInTheDocument(),
		);
		expect(
			screen.getByRole("dialog", { name: "Helpdesk's ontology" }),
		).toBeInTheDocument();
		expect(screen.getByText("Editing dependencies")).toBeInTheDocument();
	});

	it("reminds to save while changes wait, and Reset drops them and keeps editing", () => {
		renderAgentView({ links: [LINKS[3]] as CatalogDependencyLink[] });
		startEditing();
		fireEvent.click(screen.getByRole("button", { name: "Remove Search" }));

		expect(
			screen.getByText("Save changes or they will be lost."),
		).toBeInTheDocument();
		expect(saveButton()).toHaveAttribute("aria-disabled", "false");
		expect(saveButton()).toHaveAccessibleDescription(
			"Save changes to the dependencies",
		);

		fireEvent.click(
			screen.getByTestId("catalogDependenciesView-reset-btn"),
		);
		expect(screen.queryByText("1 change")).not.toBeInTheDocument();
		expect(
			screen.queryByText("Save changes or they will be lost."),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("catalogDependenciesView-reset-btn"),
		).not.toBeInTheDocument();
		expect(screen.getByText("Editing dependencies")).toBeInTheDocument();
		expect(saveButton()).toHaveAttribute("aria-disabled", "true");
	});

	it("saves from the expanded view's toolbar", async () => {
		mocks.runPixel.mockResolvedValue({ errors: [], pixelReturn: [] });
		renderAgentView({
			links: [LINKS[3], LINKS[4]] as CatalogDependencyLink[],
		});
		startEditing();
		fireEvent.click(
			screen.getByRole("button", { name: "Expand the ontology" }),
		);
		const expanded = screen.getByRole("dialog", {
			name: "Helpdesk's ontology",
		});
		fireEvent.click(
			within(expanded).getByRole("button", { name: "Remove Search" }),
		);
		fireEvent.click(
			within(expanded).getByTestId("catalogDependenciesView-save-btn"),
		);
		await waitFor(() => expect(mocks.runPixel).toHaveBeenCalledOnce());
		expect(sentPayload()).toEqual([{ id: "db-1", type: "DATABASE" }]);
	});

	it("names a link after each target picked, until a name is typed", () => {
		mocks.options = [
			{
				engine_id: "db-2",
				engine_name: "Ledger",
				engine_type: "DATABASE",
			},
			{
				engine_id: "db-3",
				engine_name: "Payroll",
				engine_type: "DATABASE",
			},
		];
		renderAgentView({ links: [LINKS[3]] as CatalogDependencyLink[] });
		startEditing();
		fireEvent.click(screen.getByRole("button", { name: "Add Dependency" }));
		const dialog = screen.getByRole("dialog", { name: "Add Dependency" });
		const name = within(dialog).getByLabelText(/^Name/);

		fireEvent.click(within(dialog).getByRole("button", { name: /Ledger/ }));
		expect(name).toHaveValue("Ledger");
		// a new pick replaces the name the last pick gave
		fireEvent.click(
			within(dialog).getByRole("button", { name: /Payroll/ }),
		);
		expect(name).toHaveValue("Payroll");
		// a name the user typed stays
		fireEvent.change(name, { target: { value: "Pay" } });
		fireEvent.click(within(dialog).getByRole("button", { name: /Ledger/ }));
		expect(name).toHaveValue("Pay");
	});

	it("marks the links whose names clash, and keeps Save off until one changes", async () => {
		renderAgentView({
			links: [LINKS[1], LINKS[3]] as CatalogDependencyLink[],
		});
		startEditing();
		// a removed link's name is free, so Search can take "Drafting"
		fireEvent.click(screen.getByRole("button", { name: "Remove GPT" }));
		let dialog = openLinkDialog("Search");
		fireEvent.change(within(dialog).getByLabelText(/^Name/), {
			target: { value: "Drafting" },
		});
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Update Dependency" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		// bringing the removed one back makes both names clash
		fireEvent.click(screen.getByRole("button", { name: "Undo GPT" }));

		expect(saveButton()).toHaveAttribute("aria-disabled", "true");
		expect(saveButton()).toHaveAccessibleDescription(
			"Fix the names marked in red before saving",
		);
		const drawer = screen.getByRole("complementary");
		expect(
			within(drawer).getByText(
				"Another dependency already has this name",
			),
		).toBeInTheDocument();
		// the edit dialog opens on the problem, and clears it once renamed
		fireEvent.click(
			within(drawer).getByRole("button", { name: "Edit Dependency" }),
		);
		dialog = screen.getByRole("dialog", { name: "Edit Dependency" });
		const name = within(dialog).getByLabelText(/^Name/);
		expect(name).toHaveAttribute("aria-invalid", "true");
		fireEvent.change(name, { target: { value: "Lookup" } });
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Update Dependency" }),
		);
		await waitFor(() =>
			expect(saveButton()).toHaveAttribute("aria-disabled", "false"),
		);
	});

	it("asks before discarding changes", () => {
		renderAgentView({ links: [LINKS[3]] as CatalogDependencyLink[] });
		startEditing();
		fireEvent.click(screen.getByRole("button", { name: "Remove Search" }));
		fireEvent.click(screen.getByRole("button", { name: "Done" }));

		const dialog = screen.getByRole("dialog", { name: "Discard Changes?" });
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Keep Changes" }),
		);
		expect(screen.getByText("1 change")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Done" }));
		fireEvent.click(
			within(
				screen.getByRole("dialog", { name: "Discard Changes?" }),
			).getByRole("button", { name: /Discard/ }),
		);
		expect(
			screen.queryByText("Editing dependencies"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Remove Search" }),
		).not.toBeInTheDocument();
	});
});

describe("ProjectCatalogDependenciesPage", () => {
	const renderPage = (type: Project["project_type"], permission: Role) => {
		mocks.project.project_type = type;
		mocks.project.permission = permission;
		render(
			<MemoryRouter>
				<ProjectCatalogDependenciesPage />
			</MemoryRouter>,
		);
	};

	it.each<Project["project_type"]>([
		"CODE",
		"SKILL",
		"NOTEBOOK",
		"AUTOMATION",
	])("lets editors edit a %s's dependencies", (type) => {
		renderPage(type, "EDIT");
		expect(
			screen.getByRole("button", { name: "Edit Dependencies" }),
		).toBeInTheDocument();
	});

	it.each<[Project["project_type"], string]>([
		["BLOCKS", "Variables tab"],
		["WORKSPACE", "MCP and Skills settings"],
	])("keeps a %s read-only with a hint", (type, hint) => {
		renderPage(type, "OWNER");
		expect(
			screen.queryByRole("button", { name: "Edit Dependencies" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: new RegExp(hint) }),
		).toBeInTheDocument();
	});

	it("lets an agent's editors re-sync, though its manual dependencies are set elsewhere", () => {
		renderPage("WORKSPACE", "EDIT");
		expect(
			screen.queryByRole("button", { name: "Edit Dependencies" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Re-sync" }),
		).toBeInTheDocument();
	});

	it.each<Project["project_type"]>(["SKILL", "NOTEBOOK"])(
		"offers no Re-sync for a %s, whose configuration records none",
		(type) => {
			renderPage(type, "OWNER");
			expect(
				screen.queryByRole("button", { name: "Re-sync" }),
			).not.toBeInTheDocument();
		},
	);

	it("tells editors how to edit", () => {
		renderPage("CODE", "OWNER");
		expect(
			screen.getByRole("button", {
				name: "Add or remove dependencies using the edit button",
			}),
		).toBeInTheDocument();
	});

	it("keeps viewers read-only", () => {
		renderPage("CODE", "READ_ONLY");
		expect(
			screen.queryByRole("button", { name: "Edit Dependencies" }),
		).not.toBeInTheDocument();
	});

	it("reads only the dependencies again after a save, so the page stays", async () => {
		mocks.runPixel.mockResolvedValue({ errors: [], pixelReturn: [] });
		mocks.options = [
			{
				engine_id: "db-2",
				engine_name: "Ledger",
				engine_type: "DATABASE",
			},
		];
		renderPage("CODE", "OWNER");
		fireEvent.click(
			screen.getByRole("button", { name: "Edit Dependencies" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Add Dependency" }));
		const dialog = screen.getByRole("dialog", { name: "Add Dependency" });
		fireEvent.click(within(dialog).getByRole("button", { name: /Ledger/ }));
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Add Dependency" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		fireEvent.click(saveButton());

		await waitFor(() =>
			expect(mocks.refreshDependencies).toHaveBeenCalledOnce(),
		);
		expect(mocks.refreshProject).not.toHaveBeenCalled();
	});
});
