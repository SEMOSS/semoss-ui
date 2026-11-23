import { describe, expect, it } from "vitest";
import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogDependencyRow,
} from "@semoss/shared";
import {
	addToDraft,
	applyDraftToGraph,
	countDraftChanges,
	createDependencyDraft,
	type DraftLink,
	getOwnDraftLink,
	getTakenNames,
	NAME_TAKEN,
	removeFromDraft,
	restoreInDraft,
	toDraftPayload,
	updateDraftLink,
	validateDependencyDraft,
} from "./catalog-dependency-draft";

const row = (
	id: string,
	fields: Partial<CatalogDependencyRow> = {},
): CatalogDependencyRow => ({
	catalog_id: id,
	catalog_type: "DATABASE",
	catalog_name: id.toUpperCase(),
	permission_name: "READ_ONLY",
	is_private: false,
	is_automatic: false,
	role: "MANUAL",
	dependency_name: null,
	dependency_description: null,
	...fields,
});

const SAVED = [
	row("sales", {
		dependency_name: "SALES_DB",
		dependency_description: "Orders",
	}),
	row("payroll", { is_private: true, catalog_name: undefined }),
	row("model", {
		catalog_type: "MODEL",
		is_automatic: true,
		role: "AGENT_MODEL",
	}),
];

describe("dependency draft", () => {
	it("starts from the manual rows only, a private one named by its type", () => {
		const draft = createDependencyDraft(SAVED);
		expect(draft.links.map((link) => link.catalog_id)).toEqual([
			"sales",
			"payroll",
		]);
		expect(draft.links[1]?.catalog_name).toBe("Private Database");
		expect(countDraftChanges(draft, SAVED)).toBe(0);
	});

	it("adds a target once, and brings back one marked for removal", () => {
		let draft = createDependencyDraft(SAVED);
		draft = addToDraft(draft, {
			catalog_id: "ledger",
			catalog_type: "DATABASE",
			catalog_name: "Ledger",
		});
		draft = addToDraft(draft, {
			catalog_id: "ledger",
			catalog_type: "DATABASE",
			catalog_name: "Ledger",
		});
		expect(
			draft.links.filter((link) => link.catalog_id === "ledger"),
		).toHaveLength(1);
		expect(draft.links.at(-1)?.isNew).toBe(true);
		draft = removeFromDraft(draft, "sales");
		draft = addToDraft(draft, {
			catalog_id: "sales",
			catalog_type: "DATABASE",
			catalog_name: "Sales",
		});
		expect(
			draft.links.find((link) => link.catalog_id === "sales")?.isRemoved,
		).toBe(false);
	});

	it("drops a new link at once, and keeps a saved one marked until undone", () => {
		let draft = addToDraft(createDependencyDraft(SAVED), {
			catalog_id: "ledger",
			catalog_type: "DATABASE",
			catalog_name: "Ledger",
		});
		draft = removeFromDraft(draft, "ledger");
		expect(draft.links.some((link) => link.catalog_id === "ledger")).toBe(
			false,
		);
		draft = removeFromDraft(draft, "sales");
		expect(
			draft.links.find((link) => link.catalog_id === "sales")?.isRemoved,
		).toBe(true);
		expect(countDraftChanges(draft, SAVED)).toBe(1);
		draft = restoreInDraft(draft, "sales");
		expect(countDraftChanges(draft, SAVED)).toBe(0);
	});

	it("counts a renamed link, and a rename back to the saved name as none", () => {
		let draft = updateDraftLink(createDependencyDraft(SAVED), "sales", {
			dependency_name: "WAREHOUSE",
		});
		expect(countDraftChanges(draft, SAVED)).toBe(1);
		draft = updateDraftLink(draft, "sales", {
			dependency_name: " SALES_DB ",
		});
		expect(countDraftChanges(draft, SAVED)).toBe(0);
	});

	it("flags a name used twice, ignoring case, but not on a removed link", () => {
		let draft = updateDraftLink(createDependencyDraft(SAVED), "payroll", {
			dependency_name: "sales_db",
		});
		const problems = validateDependencyDraft(draft);
		expect(problems.get("sales")).toBe(NAME_TAKEN);
		expect(problems.get("payroll")).toBe(NAME_TAKEN);
		draft = removeFromDraft(draft, "sales");
		expect(validateDependencyDraft(draft).size).toBe(0);
	});

	it("flags a name that is too long", () => {
		const draft = updateDraftLink(createDependencyDraft(SAVED), "sales", {
			dependency_name: "x".repeat(256),
		});
		expect(validateDependencyDraft(draft).get("sales")).toMatch(/255/);
	});

	it("saves every link not removed, trimmed, a private one by its id", () => {
		let draft = updateDraftLink(createDependencyDraft(SAVED), "sales", {
			dependency_description: "  Orders and accounts ",
		});
		draft = addToDraft(draft, {
			catalog_id: "ledger",
			catalog_type: "DATABASE",
			catalog_name: "Ledger",
		});
		draft = removeFromDraft(draft, "payroll");
		expect(toDraftPayload(draft)).toEqual([
			{
				id: "sales",
				type: "DATABASE",
				name: "SALES_DB",
				description: "Orders and accounts",
			},
			{ id: "ledger", type: "DATABASE" },
		]);
		expect(toDraftPayload(restoreInDraft(draft, "payroll"))).toContainEqual(
			{
				id: "payroll",
				type: "DATABASE",
			},
		);
	});

	it("lists the other links' names, trimmed and in lower case", () => {
		let draft = updateDraftLink(createDependencyDraft(SAVED), "payroll", {
			dependency_name: " Payroll ",
		});
		expect(getTakenNames(draft.links, "sales")).toEqual(["payroll"]);
		expect(getTakenNames(draft.links, "payroll")).toEqual(["sales_db"]);
		draft = removeFromDraft(draft, "sales");
		expect(getTakenNames(draft.links, "payroll")).toEqual([]);
	});
});

const byId = (links: readonly DraftLink[]): ReadonlyMap<string, DraftLink> =>
	new Map(links.map((link) => [link.catalog_id, link]));

describe("getOwnDraftLink", () => {
	it("finds the owner's own link only", () => {
		const links = byId(createDependencyDraft(SAVED).links);
		expect(
			getOwnDraftLink({ id: "sales", side: "USES", depth: 1 }, links)
				?.catalog_id,
		).toBe("sales");
		expect(
			getOwnDraftLink({ id: "sales", side: "USES", depth: 2 }, links),
		).toBeUndefined();
		expect(
			getOwnDraftLink({ id: "sales", side: "USED_BY", depth: 1 }, links),
		).toBeUndefined();
		expect(
			getOwnDraftLink({ id: "sales", side: "USES", depth: 1 }, null),
		).toBeUndefined();
	});
});

describe("applyDraftToGraph", () => {
	const nodes: CatalogDependency[] = SAVED.map(
		({
			is_automatic: _a,
			role: _r,
			dependency_name: _n,
			dependency_description: _d,
			...node
		}) => node,
	);
	const links: CatalogDependencyLink[] = [
		...SAVED.map(({ catalog_id, is_automatic, role }) => ({
			parent_id: "owner",
			catalog_id,
			is_automatic,
			role,
			dependency_name: null,
			dependency_description: null,
		})),
		{
			parent_id: "sales",
			catalog_id: "payroll",
			is_automatic: false,
			role: "MANUAL",
			dependency_name: null,
			dependency_description: null,
		},
	];

	it("leaves the graph as read when not editing", () => {
		const applied = applyDraftToGraph({ nodes, links }, null, "owner");
		expect(applied.nodes).toBe(nodes);
		expect(applied.links).toBe(links);
		expect(applied.addedIds.size).toBe(0);
	});

	it("puts the draft in place of the owner's manual links", () => {
		let draft = updateDraftLink(createDependencyDraft(SAVED), "sales", {
			dependency_name: " WAREHOUSE ",
		});
		draft = removeFromDraft(draft, "payroll");
		draft = addToDraft(draft, {
			catalog_id: "ledger",
			catalog_type: "DATABASE",
			catalog_name: "Ledger",
		});
		const applied = applyDraftToGraph(
			{ nodes, links },
			byId(draft.links),
			"owner",
		);
		// the new target is drawn from the picker, as one the user can see
		expect(applied.nodes.at(-1)).toEqual({
			catalog_id: "ledger",
			catalog_type: "DATABASE",
			catalog_name: "Ledger",
			catalog_subtype: undefined,
			is_private: false,
		});
		expect(applied.addedIds).toEqual(new Set(["ledger"]));
		// the automatic link and a dependency's own link stay as they were;
		// the removed link stays, so it can be undone
		expect(
			applied.links.map((link) => [
				link.parent_id,
				link.catalog_id,
				link.dependency_name,
			]),
		).toEqual([
			["owner", "model", null],
			["sales", "payroll", null],
			["owner", "sales", "WAREHOUSE"],
			["owner", "payroll", null],
			["owner", "ledger", null],
		]);
	});
});
