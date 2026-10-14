import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@semoss/sdk";
import type { Project } from "@semoss/shared";
import { ProjectContext } from "@/contexts/project-context";
import { AppSettingsPage } from "./app-settings-page";

vi.mock("./app-detail-tabs/settings-tab", () => ({
	SettingsTab: () => <div>App publishing settings</div>,
}));

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
			}}
		>
			<AppSettingsPage />
		</ProjectContext.Provider>,
	);
}

afterEach(cleanup);

describe("AppSettingsPage catalog images", () => {
	it.each(["WORKSPACE", "SKILL", "NOTEBOOK"] as const)(
		"shows image settings for editable %s projects",
		(type) => {
			renderPage(type, "EDIT");
			expect(
				screen.getByRole("button", { name: "Upload image" }),
			).toBeEnabled();
			expect(
				screen.queryByText("App publishing settings"),
			).not.toBeInTheDocument();
		},
	);

	it("keeps existing app publishing settings for owners", () => {
		renderPage("CODE", "OWNER");
		expect(
			screen.getByRole("button", { name: "Upload image" }),
		).toBeEnabled();
		expect(screen.getByText("App publishing settings")).toBeInTheDocument();
	});

	it("limits editors to the image controls", () => {
		renderPage("CODE", "EDIT");
		expect(
			screen.getByRole("button", { name: "Upload image" }),
		).toBeEnabled();
		expect(
			screen.queryByText("App publishing settings"),
		).not.toBeInTheDocument();
	});

	it("does not expose uploads to readers", () => {
		renderPage("WORKSPACE", "READ_ONLY");
		expect(
			screen.queryByRole("button", { name: "Upload image" }),
		).not.toBeInTheDocument();
	});
});
