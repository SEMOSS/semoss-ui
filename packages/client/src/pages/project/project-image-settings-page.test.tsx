import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@semoss/sdk";
import type { Project } from "@semoss/shared";
import { ProjectContext } from "@/contexts/project-context";
import { ProjectImageSettingsPage } from "./project-image-settings-page";

/** Supply the same project context as catalog and workbench settings. */
function renderPage(type: Project["project_type"], permission: Role) {
	return render(
		<ProjectContext.Provider
			value={{
				type,
				permission,
				catalog: { name: "Project", path: "/agent" },
				project: {
					project_id: "settings-project",
					project_name: "Example",
					project_type: type,
				},
				dependencies: [],
				refresh: vi.fn(),
				update: vi.fn(),
			}}
		>
			<ProjectImageSettingsPage />
		</ProjectContext.Provider>,
	);
}

afterEach(cleanup);

describe("ProjectImageSettingsPage", () => {
	it.each(["WORKSPACE", "SKILL", "NOTEBOOK", "CODE"] as const)(
		"lets editors of a %s change its image",
		(type) => {
			renderPage(type, "EDIT");
			expect(screen.getByLabelText("Choose image")).toBeEnabled();
		},
	);

	it("does not expose uploads to readers", () => {
		renderPage("WORKSPACE", "READ_ONLY");
		expect(screen.queryByLabelText("Choose image")).not.toBeInTheDocument();
	});
});
