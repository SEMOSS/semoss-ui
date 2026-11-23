import { describe, expect, it } from "vitest";
import {
	getCatalogDependenciesPixel,
	getCatalogDependentsPixel,
	getValidateCatalogDependenciesPixel,
} from "./catalog-dependencies";

describe("the catalog dependency pixels", () => {
	it("escape the id they are given, so it cannot end the string early", () => {
		const id = 'odd"id\\';
		expect(getCatalogDependenciesPixel(id, "MODEL")).toBe(
			'GetCatalogDependencies(catalogId="odd\\"id\\\\", catalogType="MODEL");',
		);
		expect(getCatalogDependentsPixel(id, "MODEL", true)).toBe(
			'GetCatalogDependents(catalogId="odd\\"id\\\\", catalogType="MODEL", recursive=[true]);',
		);
		expect(getValidateCatalogDependenciesPixel(id, "CODE")).toBe(
			'ValidateCatalogDependencies(catalogId="odd\\"id\\\\", catalogType="CODE");',
		);
	});

	it("read the same as before for an ordinary id", () => {
		expect(getCatalogDependenciesPixel("fn-1", "FUNCTION")).toBe(
			'GetCatalogDependencies(catalogId="fn-1", catalogType="FUNCTION");',
		);
		expect(getCatalogDependentsPixel("fn-1", "FUNCTION", false)).toBe(
			'GetCatalogDependents(catalogId="fn-1", catalogType="FUNCTION", recursive=[false]);',
		);
	});
});
