import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { HashRouter } from "react-router";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ProjectNavbar } from "./project-navbar";

const mocks = vi.hoisted(() => ({ useProject: vi.fn() }));

vi.mock("@/hooks/use-project", () => ({ useProject: mocks.useProject }));
vi.mock("../shared/navbar-header", () => ({ NavbarHeader: () => null }));
vi.mock("../shared/navbar-left", () => ({
	NavbarLeft: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../shared/navbar-right", () => ({
	NavbarRight: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const initialUrl = window.location.href;

afterEach(() => {
	cleanup();
	window.history.replaceState(null, "", initialUrl);
	vi.clearAllMocks();
});

describe("app editor navigation", () => {
	test.each(["BLOCKS", "CODE"])(
		"opens the current %s app's view page while keeping the editor open",
		(type) => {
			window.history.replaceState(
				null,
				"",
				"/semoss-ui/#/app/app-1/edit",
			);
			const project = {
				type,
				catalog: { path: "/app", name: "App" },
				project: { project_id: "app-1", project_name: "First app" },
			};
			mocks.useProject.mockReturnValue(project);
			const view = render(
				<HashRouter>
					<ProjectNavbar actions={<span>Editor actions</span>} />
				</HashRouter>,
			);
			const open = screen.getByRole("link", { name: /^Open app/ });
			expect(open).toHaveTextContent("Open");
			expect(open).toHaveAttribute("href", "#/app/app-1/view");
			expect(open).toHaveAttribute("target", "_blank");
			expect(open).toHaveAttribute("rel", "noopener noreferrer");
			expect(screen.getByText("Editor actions")).toBeInTheDocument();

			// Reusing the navbar for another project must not retain the old URL.
			mocks.useProject.mockReturnValue({
				...project,
				project: { project_id: "app-2", project_name: "Second app" },
			});
			view.rerender(
				<HashRouter>
					<ProjectNavbar />
				</HashRouter>,
			);
			expect(
				screen.getByRole("link", { name: /^Open app/ }),
			).toHaveAttribute("href", "#/app/app-2/view");
		},
	);

	test.each(["SKILL", "WORKSPACE", "NOTEBOOK", "AUTOMATION"])(
		"keeps the app-only action out of %s editors",
		(type) => {
			mocks.useProject.mockReturnValue({
				type,
				catalog: { path: "/skill", name: "Skill" },
				project: { project_id: "project-1", project_name: "Project" },
			});
			render(
				<HashRouter>
					<ProjectNavbar />
				</HashRouter>,
			);
			expect(
				screen.queryByRole("link", { name: /^Open app/ }),
			).toBeNull();
		},
	);
});
