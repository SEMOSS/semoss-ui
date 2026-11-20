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
	CatalogDependencyRow,
	CatalogType,
	Project,
} from "@semoss/shared";
import { ProjectCatalogDependenciesPage } from "@/pages/project/project-dependencies.page";
import { CatalogDependenciesView } from "./catalog-dependencies-view";
import { DEPENDENCY_TYPE_CONFIG } from "./catalog-dependency";

const mocks = vi.hoisted(() => ({
	project: {
		project_type: "CODE",
		permission: "OWNER",
	},
	/** Whether the edit dialog renders for real, not as the stub */
	isDialogReal: false,
	runPixel: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	runPixel: mocks.runPixel,
	useDebouncedValue: (value: string) => value,
	useIteratorPixel: () => ({
		data: [],
		isLoading: false,
		hasMore: false,
		next: vi.fn(),
	}),
}));

vi.mock("@semoss/shared", () => ({
	AppCatalogAvatar: () => <span data-testid="project-avatar" />,
	EngineSubtypeIcon: () => <span data-testid="engine-icon" />,
}));
vi.mock("@/components/catalog/catalog-grid", () => ({
	CatalogGrid: ({ children }: { children: ReactNode }) => <ul>{children}</ul>,
}));
vi.mock("@/components/catalog/catalog-grid-item", () => ({
	CatalogGridItem: (props: {
		path: string;
		name: string;
		description: string;
		icon: ReactNode;
		actions: ReactNode;
	}) => (
		<li data-path={props.path}>
			{props.icon}
			<span>{props.name}</span>
			<p>{props.description}</p>
			{props.actions}
		</li>
	),
}));
vi.mock("./edit-catalog-dependencies-dialog", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("./edit-catalog-dependencies-dialog")
		>();
	return {
		EditCatalogDependenciesDialog: (
			props: Parameters<typeof actual.EditCatalogDependenciesDialog>[0],
		) =>
			mocks.isDialogReal ? (
				<actual.EditCatalogDependenciesDialog {...props} />
			) : null,
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
		refresh: vi.fn(),
	}),
}));

afterEach(() => {
	cleanup();
	mocks.isDialogReal = false;
	mocks.runPixel.mockReset();
});

/** One dependency of every catalog type. */
const EVERY_TYPE: CatalogDependencyRow[] = (
	Object.keys(DEPENDENCY_TYPE_CONFIG) as CatalogType[]
).map((type) => ({
	catalog_id: `${type.toLowerCase()}-1`,
	catalog_type: type,
	catalog_name: `${type} dependency`,
	permission_name: "READ_ONLY",
	is_automatic: false,
	role: "MANUAL",
	dependency_name: null,
	dependency_description: null,
}));

/** An agent's model, recorded from its configuration. */
const AGENT_MODEL: CatalogDependencyRow = {
	catalog_id: "model-1",
	catalog_type: "MODEL",
	catalog_name: "GPT",
	permission_name: "READ_ONLY",
	description: "The model's own catalog description",
	is_automatic: true,
	role: "AGENT_MODEL",
	dependency_name: null,
	dependency_description: "The agent answers with this model",
};

/** The same model, also added by hand. */
const MANUAL_MODEL: CatalogDependencyRow = {
	...AGENT_MODEL,
	is_automatic: false,
	role: "MANUAL",
	dependency_name: "Drafting",
	dependency_description: "Writes the first draft",
};

/** A skill added by hand, with no name or description. */
const MANUAL_SKILL: CatalogDependencyRow = {
	catalog_id: "skill-1",
	catalog_type: "SKILL",
	catalog_name: "Search",
	permission_name: "READ_ONLY",
	is_automatic: false,
	role: "MANUAL",
	dependency_name: null,
	dependency_description: null,
};

/** Renders the view for an agent owner, with the given rows. */
const renderAgentView = (
	dependencies: CatalogDependencyRow[],
	onRefresh = vi.fn(),
) =>
	render(
		<MemoryRouter>
			<CatalogDependenciesView
				catalogId="agent-1"
				catalogType="WORKSPACE"
				canEdit
				dependencies={dependencies}
				onRefresh={onRefresh}
			/>
		</MemoryRouter>,
	);

describe("CatalogDependenciesView", () => {
	it("renders a routed row with the right icon for every type", () => {
		render(
			<MemoryRouter>
				<CatalogDependenciesView
					catalogId="fn-1"
					catalogType="FUNCTION"
					canEdit={false}
					dependencies={EVERY_TYPE}
					onRefresh={vi.fn()}
				/>
			</MemoryRouter>,
		);

		for (const dep of EVERY_TYPE) {
			const row = screen
				.getByText(`${dep.catalog_type} dependency`)
				.closest("li");
			if (!row) throw new Error(`no row for ${dep.catalog_type}`);
			const config = DEPENDENCY_TYPE_CONFIG[dep.catalog_type];
			expect(row).toHaveAttribute(
				"data-path",
				`${config.route}/${dep.catalog_id}`,
			);
			expect(
				within(row).getByTestId(
					config.kind === "project"
						? "project-avatar"
						: "engine-icon",
				),
			).toBeInTheDocument();
		}
	});

	it("says when there are no dependencies", () => {
		render(
			<CatalogDependenciesView
				catalogId="model-1"
				catalogType="MODEL"
				canEdit
				dependencies={[]}
				onRefresh={vi.fn()}
			/>,
		);
		expect(screen.getByText("No dependencies found")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Edit dependencies" }),
		).toBeInTheDocument();
	});
});

describe("CatalogDependenciesView automatic and manual rows", () => {
	it("shows a target with two roles as two rows", () => {
		renderAgentView([AGENT_MODEL, MANUAL_MODEL]);
		expect(screen.getAllByText("GPT")).toHaveLength(2);
	});

	it("keeps automatic rows read-only, with their role and description", () => {
		renderAgentView([AGENT_MODEL]);
		const row = screen.getByText("GPT").closest("li");
		if (!row) throw new Error("no row for the agent model");
		expect(
			within(row).getByText("The agent answers with this model"),
		).toBeInTheDocument();
		expect(
			within(row).getByRole("button", {
				name: /^Agent model, automatic\. Set by this agent's configuration/,
			}),
		).toBeInTheDocument();
		expect(
			within(row).queryByRole("button", { name: /Remove|Edit/ }),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(/Automatic dependencies come from this agent/),
		).toBeInTheDocument();
	});

	it("shows a manual row's name and description", () => {
		renderAgentView([MANUAL_MODEL]);
		const row = screen.getByText("GPT").closest("li");
		if (!row) throw new Error("no row for the manual model");
		expect(within(row).getByText("Drafting")).toBeInTheDocument();
		expect(
			within(row).getByText("Writes the first draft"),
		).toBeInTheDocument();
		expect(
			within(row).queryByRole("button", { name: /automatic/ }),
		).not.toBeInTheDocument();
	});
});

describe("EditCatalogDependenciesDialog", () => {
	const openDialog = () => {
		fireEvent.click(
			screen.getByRole("button", { name: "Edit dependencies" }),
		);
		return screen.getByRole("dialog");
	};

	it("edits only manual rows and saves them with name and description", async () => {
		mocks.isDialogReal = true;
		mocks.runPixel.mockResolvedValue({ errors: [], pixelReturn: [] });
		const onRefresh = vi.fn();
		renderAgentView([AGENT_MODEL, MANUAL_MODEL, MANUAL_SKILL], onRefresh);

		const dialog = openDialog();
		// the model shows once, for its manual row; the automatic one is kept
		// out of the dialog
		expect(
			within(dialog).getAllByRole("group", { name: "GPT" }),
		).toHaveLength(1);
		expect(
			within(dialog).getByRole("group", { name: "Search" }),
		).toBeInTheDocument();
		const [modelName, skillName] =
			within(dialog).getAllByLabelText("Name (optional)");
		const [, skillDescription] = within(dialog).getAllByLabelText(
			"Description (optional)",
		);
		expect(modelName).toHaveValue("Drafting");
		fireEvent.change(skillName, { target: { value: " Lookup " } });
		fireEvent.change(skillDescription, {
			target: { value: "Finds sources" },
		});
		fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

		await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
		const pixel: string = mocks.runPixel.mock.calls[0]?.[0];
		const payload = JSON.parse(
			pixel.slice(pixel.indexOf("dependencies=") + 13, -2),
		);
		expect(pixel).toContain(
			'SetCatalogDependencies(catalogId="agent-1", catalogType="WORKSPACE"',
		);
		expect(payload).toEqual([
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
	});

	it("flags a repeated name inline and does not save", async () => {
		mocks.isDialogReal = true;
		renderAgentView([MANUAL_MODEL, MANUAL_SKILL]);

		const dialog = openDialog();
		const [, skillName] =
			within(dialog).getAllByLabelText("Name (optional)");
		fireEvent.change(skillName, { target: { value: "drafting" } });
		fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

		expect(
			await within(dialog).findByText(
				"Another dependency already has this name",
			),
		).toBeInTheDocument();
		expect(skillName).toHaveAttribute("aria-invalid", "true");
		expect(mocks.runPixel).not.toHaveBeenCalled();
	});

	it("keeps the edits and shows why when the save fails", async () => {
		mocks.isDialogReal = true;
		mocks.runPixel.mockResolvedValue({
			errors: ["Name already used"],
			pixelReturn: [],
		});
		const onRefresh = vi.fn();
		renderAgentView([MANUAL_SKILL], onRefresh);

		const dialog = openDialog();
		const skillName = within(dialog).getByLabelText("Name (optional)");
		fireEvent.change(skillName, { target: { value: "Lookup" } });
		fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

		expect(
			await within(dialog).findByText("Name already used"),
		).toBeInTheDocument();
		expect(skillName).toHaveValue("Lookup");
		expect(onRefresh).not.toHaveBeenCalled();
	});
});

describe("ProjectCatalogDependenciesPage", () => {
	const renderPage = (type: Project["project_type"], permission: Role) => {
		mocks.project.project_type = type;
		mocks.project.permission = permission;
		render(<ProjectCatalogDependenciesPage />);
	};

	it.each<Project["project_type"]>([
		"CODE",
		"SKILL",
		"NOTEBOOK",
		"AUTOMATION",
	])("lets editors edit a %s's dependencies", (type) => {
		renderPage(type, "EDIT");
		expect(
			screen.getByRole("button", { name: "Edit dependencies" }),
		).toBeInTheDocument();
	});

	it.each<[Project["project_type"], string]>([
		["BLOCKS", "Variables tab"],
		["WORKSPACE", "MCP and Skills settings"],
	])("keeps a %s read-only with a hint", (type, hint) => {
		renderPage(type, "OWNER");
		expect(
			screen.queryByRole("button", { name: "Edit dependencies" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: new RegExp(hint) }),
		).toBeInTheDocument();
	});

	it("keeps viewers read-only", () => {
		renderPage("CODE", "READ_ONLY");
		expect(
			screen.queryByRole("button", { name: "Edit dependencies" }),
		).not.toBeInTheDocument();
	});
});
