import { describe, expect, it, vi } from "vitest";
import {
	getProjectSettingsSections,
	PROJECT_SETTINGS_SECTIONS,
} from "./project-settings-sections";

vi.mock("../app/app-import-export-settings-page", () => ({
	AppImportExportSettingsPage: () => null,
}));
vi.mock("../app/app-portal-settings-page", () => ({
	AppPortalSettingsPage: () => null,
}));
vi.mock("../app/app-python-reactors-settings-page", () => ({
	AppPythonReactorsSettingsPage: () => null,
}));
vi.mock("./project-dangerous-settings-page", () => ({
	ProjectDangerousSettingsPage: () => null,
}));
vi.mock("./project-description-settings-page", () => ({
	ProjectDescriptionSettingsPage: () => null,
}));
vi.mock("./project-image-settings-page", () => ({
	ProjectImageSettingsPage: () => null,
}));
vi.mock("./project-tags-settings-page", () => ({
	ProjectTagsSettingsPage: () => null,
}));

type SectionArgs = Parameters<typeof getProjectSettingsSections>;

/** The paths of the sections a viewer has, in nav order */
const pathsFor = (
	projectType: SectionArgs[0],
	permission: SectionArgs[1],
): string[] =>
	getProjectSettingsSections(projectType, permission, "App").map(
		(section) => section.path,
	);

const CATALOG_SECTIONS = ["description", "image", "tags"];

describe("PROJECT_SETTINGS_SECTIONS", () => {
	it("lists the sections alphabetically, with Dangerous last", () => {
		const names = PROJECT_SETTINGS_SECTIONS.map((section) => section.name);
		const [last] = names.slice(-1);
		expect(last).toBe("Dangerous");
		const rest = names.slice(0, -1);
		expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
	});
});

describe("getProjectSettingsSections", () => {
	it.each(["CODE", "BLOCKS", "AUTOMATION", "INSIGHT"] as const)(
		"gives the owners of a %s app its own sections and Dangerous",
		(type) => {
			expect(pathsFor(type, "OWNER")).toEqual([
				"description",
				"image",
				"import-export",
				"portal",
				"python",
				"tags",
				"dangerous",
			]);
		},
	);

	it("limits editors of an app to the catalog sections", () => {
		expect(pathsFor("CODE", "EDIT")).toEqual(CATALOG_SECTIONS);
	});

	it.each(["WORKSPACE", "SKILL", "NOTEBOOK"] as const)(
		"gives the owners of a %s the catalog sections and Dangerous",
		(type) => {
			expect(pathsFor(type, "OWNER")).toEqual([
				...CATALOG_SECTIONS,
				"dangerous",
			]);
		},
	);

	it("still lists the catalog sections for readers", () => {
		expect(pathsFor("WORKSPACE", "READ_ONLY")).toEqual(CATALOG_SECTIONS);
	});

	it.each([
		["SKILL", "Skill", "Delete the skill"],
		["WORKSPACE", "Agent", "Delete the agent"],
		["CODE", "App", "Delete the app"],
	] as const)(
		"names a %s in its Dangerous description",
		(type, catalogName, description) => {
			const dangerous = getProjectSettingsSections(
				type,
				"OWNER",
				catalogName,
			).find((section) => section.path === "dangerous");
			expect(dangerous?.description).toBe(description);
		},
	);
});
