import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@semoss/sdk";
import type { CatalogDependency, CatalogType, Project } from "@semoss/shared";
import { ProjectCatalogDependenciesPage } from "@/pages/project/project-dependencies.page";
import { CatalogDependenciesView } from "./catalog-dependencies-view";
import { DEPENDENCY_TYPE_CONFIG } from "./catalog-dependency";

const mocks = vi.hoisted(() => ({
	project: {
		project_type: "CODE",
		permission: "OWNER",
	},
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
		icon: ReactNode;
		actions: ReactNode;
	}) => (
		<li data-path={props.path}>
			{props.icon}
			<span>{props.name}</span>
			{props.actions}
		</li>
	),
}));
vi.mock("./edit-catalog-dependencies-dialog", () => ({
	EditCatalogDependenciesDialog: () => null,
}));
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

afterEach(cleanup);

/** One dependency of every catalog type. */
const EVERY_TYPE: CatalogDependency[] = (
	Object.keys(DEPENDENCY_TYPE_CONFIG) as CatalogType[]
).map((type) => ({
	catalog_id: `${type.toLowerCase()}-1`,
	catalog_type: type,
	catalog_name: `${type} dependency`,
	permission_name: "READ_ONLY",
}));

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
