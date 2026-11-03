import { describe, expect, it, vi } from "vitest";
import {
	ENGINE_SETTINGS_SECTIONS,
	getEngineSettingsSections,
} from "./engine-settings-sections";

vi.mock("./engine-dangerous-settings-page", () => ({
	EngineDangerousSettingsPage: () => null,
}));
vi.mock("./engine-description-settings-page", () => ({
	EngineDescriptionSettingsPage: () => null,
}));
vi.mock("./engine-export-settings-page", () => ({
	EngineExportSettingsPage: () => null,
}));
vi.mock("./engine-guardrail-settings-page", () => ({
	EngineGuardrailSettingsPage: () => null,
}));
vi.mock("./engine-image-settings-page", () => ({
	EngineImageSettingsPage: () => null,
}));
vi.mock("./engine-model-settings-page", () => ({
	EngineModelSettingsPage: () => null,
}));
vi.mock("./engine-tags-settings-page", () => ({
	EngineTagsSettingsPage: () => null,
}));

type SectionArgs = Parameters<typeof getEngineSettingsSections>;

/** The paths of the sections a viewer has, in nav order */
const pathsFor = (type: SectionArgs[0], permission: SectionArgs[1]): string[] =>
	getEngineSettingsSections(type, permission, "Database").map(
		(section) => section.path,
	);

describe("ENGINE_SETTINGS_SECTIONS", () => {
	it("lists the sections alphabetically, with Dangerous last", () => {
		const names = ENGINE_SETTINGS_SECTIONS.map((section) => section.name);
		const [last] = names.slice(-1);
		expect(last).toBe("Dangerous");
		const rest = names.slice(0, -1);
		expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
	});
});

describe("getEngineSettingsSections", () => {
	it("gives the owners of a model every section", () => {
		expect(pathsFor("MODEL", "OWNER")).toEqual([
			"description",
			"export",
			"guardrails",
			"image",
			"model",
			"tags",
			"dangerous",
		]);
	});

	it.each(["DATABASE", "STORAGE", "VECTOR", "FUNCTION"] as const)(
		"gives the owners of a %s the shared sections and guardrails",
		(type) => {
			expect(pathsFor(type, "OWNER")).toEqual([
				"description",
				"export",
				"guardrails",
				"image",
				"tags",
				"dangerous",
			]);
		},
	);

	it("gives the owners of a guardrail no guardrails of its own", () => {
		expect(pathsFor("GUARDRAIL", "OWNER")).toEqual([
			"description",
			"export",
			"image",
			"tags",
			"dangerous",
		]);
	});

	it("leaves export and the Dangerous section to owners", () => {
		expect(pathsFor("MODEL", "EDIT")).toEqual([
			"description",
			"guardrails",
			"image",
			"model",
			"tags",
		]);
		expect(pathsFor("DATABASE", "EDIT")).toEqual([
			"description",
			"guardrails",
			"image",
			"tags",
		]);
	});

	it("names the engine's kind in the export and Dangerous descriptions", () => {
		const descriptions = Object.fromEntries(
			getEngineSettingsSections("DATABASE", "OWNER", "Database").map(
				(section) => [section.path, section.description],
			),
		);
		expect(descriptions.export).toBe("Download the database as a zip");
		expect(descriptions.dangerous).toBe("Delete the database");
		expect(descriptions.tags).toBe("Tags, classification, and domain");
	});
});
