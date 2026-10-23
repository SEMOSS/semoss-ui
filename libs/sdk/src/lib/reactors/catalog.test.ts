import ts from "typescript";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import collaborationOutputs from "./collaboration-output-evidence.json";
import contractGaps from "./contract-gaps.json";
import implementationOutputs from "./implementation-output-evidence.json";
import { reactorNames } from "./inventory";
import inventory from "./inventory.json";
import queryOutputs from "./query-output-evidence.json";
import resourceOutputs from "./resource-output-evidence.json";
import sourceContracts from "./source-contracts.json";

/** Read internal interface property names without depending on a backend checkout. */
function readContractNames(fileName: string, interfaceName: string): string[] {
	const file = ts.createSourceFile(
		fileName,
		readFileSync(new URL(fileName, import.meta.url), "utf8"),
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);
	const declaration = file.statements.find(
		(statement): statement is ts.InterfaceDeclaration =>
			ts.isInterfaceDeclaration(statement) &&
			statement.name.text === interfaceName,
	);
	if (!declaration) {
		throw new Error(`Missing ${interfaceName} in ${fileName}`);
	}
	return declaration.members.flatMap((member) =>
		ts.isPropertySignature(member) &&
		(ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))
			? [member.name.text]
			: [],
	);
}

describe("built-in reactor catalog coverage", () => {
	it("binds implementation output overrides to catalog names and producer evidence", () => {
		const audits = [
			["collaboration", "CollaborationOutputTypes", collaborationOutputs],
			[
				"implementation",
				"ImplementationOutputTypes",
				implementationOutputs,
			],
			["query", "QueryOutputTypes", queryOutputs],
			["resource", "ResourceOutputTypes", resourceOutputs],
		] as const;
		const overrides: string[] = [];
		for (const [domain, interfaceName, audit] of audits) {
			const names = readContractNames(
				`./${domain}-output-types.ts`,
				interfaceName,
			);
			for (const name of names) {
				expect(inventory.reactors).toHaveProperty(name);
				expect(audit.reactors).toHaveProperty(name);
			}
			for (const [name, evidence] of Object.entries(audit.reactors)) {
				expect(inventory.reactors).toHaveProperty(name);
				const sources =
					"sources" in evidence
						? evidence.sources
						: "implementations" in evidence
							? evidence.implementations
							: [];
				expect(sources.length).toBeGreaterThan(0);
			}
			overrides.push(...names);
		}
		// An accidental overlap would intersect unrelated result types in the catalog.
		expect(new Set(overrides).size).toBe(overrides.length);
		expect(overrides.length).toBe(
			inventory.coverage.implementationOutputNames,
		);
	});

	it("keeps runtime names, the source inventory, and domain contracts identical", () => {
		const names = Object.keys(inventory.reactors).sort();
		expect([...reactorNames]).toEqual(names);
		expect(new Set(reactorNames).size).toBe(reactorNames.length);
		expect(inventory.discovery.catalogNames).toBe(names.length);

		const domains = new Set(
			Object.values(inventory.reactors).map((entry) => entry.domain),
		);
		const domainNames = [...domains].flatMap((domain) =>
			readContractNames(
				`./${domain}.ts`,
				`${domain[0].toUpperCase()}${domain.slice(1)}ReactorCatalog`,
			),
		);
		expect(domainNames.sort()).toEqual(names);
	});

	it("retains source evidence for every effective and shadowed registration", () => {
		const classes = inventory.classes as Record<
			string,
			{ source: string; line: number; sha256: string }
		>;
		expect(Object.keys(classes)).toHaveLength(
			inventory.discovery.concreteReactorClasses,
		);
		for (const entry of Object.values(inventory.reactors)) {
			for (const context of Object.values(entry.contexts)) {
				expect(classes[context.class]).toBeDefined();
				if ("shadowedClasses" in context) {
					for (const shadowed of context.shadowedClasses) {
						expect(classes[shadowed]).toBeDefined();
					}
				}
			}
		}
		expect(Object.keys(sourceContracts.classes).sort()).toEqual(
			Object.keys(classes).sort(),
		);
		for (const source of Object.values(classes)) {
			expect(source.source).toMatch(/^src\/prerna\/.+\.java$/);
			expect(source.line).toBeGreaterThan(0);
			expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);
		}
	});

	it("tracks every unverified contract and every audited override", () => {
		const audited = new Set(
			readContractNames(
				"./verified-contracts.ts",
				"VerifiedReactorCatalog",
			),
		);
		const unresolved = new Set(Object.keys(contractGaps.reactors));
		expect(audited.size).toBe(inventory.coverage.auditedNames);
		expect(unresolved.size).toBe(inventory.coverage.sourceContractNames);
		for (const name of reactorNames) {
			expect(audited.has(name) || unresolved.has(name)).toBe(true);
			if (audited.has(name)) {
				expect(inventory.reactors[name].status).toBe(
					"audited-contract",
				);
			}
		}
		for (const name of audited) {
			expect(inventory.reactors).toHaveProperty(name);
		}
		for (const name of unresolved) {
			expect(inventory.reactors).toHaveProperty(name);
			expect(audited.has(name)).toBe(false);
		}
		expect(
			inventory.coverage.baseNamesWithSourceOutputShape +
				inventory.coverage.baseNamesWithUnknownOutput,
		).toBe(reactorNames.length);
		expect(
			inventory.coverage.finalNamesWithKnownOuterOutput +
				inventory.coverage.finalNamesWithUnknownOutput,
		).toBe(reactorNames.length);
		expect(inventory.auditedDynamicOutputs).toEqual([
			"IF",
			"IFERROR",
			"If",
			"IfError",
		]);
	});

	it("retains independent factory reconciliation and explicit scope limits", () => {
		for (const [context, evidence] of Object.entries(
			inventory.validation.compiledFactoryMaps.contexts,
		)) {
			const entries = Object.entries(inventory.reactors).filter(
				([name, entry]) =>
					context in entry.contexts &&
					(context !== "EXPRESSION" || name === name.toUpperCase()),
			);
			expect(entries).toHaveLength(evidence.sourceEntries);
			expect(evidence.compiledEntries).toBe(evidence.sourceEntries);
			expect(evidence.missing + evidence.extra + evidence.different).toBe(
				0,
			);
		}
		expect(inventory.exclusions.map((entry) => entry.scope)).toEqual(
			expect.arrayContaining([
				"metadata-only frame prefixes",
				"inactive registrations",
				"arbitrary query functions",
				"project and deployment extensions",
			]),
		);
		expect(Object.keys(inventory.auditedLimitations).sort()).toEqual([
			"Filter",
			"Join",
			"Select",
		]);
	});

	it("retains enforced inputs from parameterized and varargs constructor chains", () => {
		const engineGit =
			sourceContracts.classes[
				"prerna.reactor.engine.git.EngineGitCheckoutReactor"
			];
		expect(engineGit.declaredParameters).toEqual(["engine", "branch"]);
		expect(engineGit.requiredGroups).toEqual([["engine"], ["branch"]]);
		expect(engineGit.minimumPositionals).toBe(2);
		expect(engineGit.requirednessEvidence).toBe(
			"organizeKeys-checkOptional",
		);
		const calendar =
			sourceContracts.classes[
				"prerna.io.connector.google.calendar.GoogleCalendarCreateEventReactor"
			];
		expect(calendar.requiredGroups).toEqual([["start"], ["end"]]);
		expect(calendar.minimumPositionals).toBe(3);
		expect(calendar.declaredParameters).toContain("attendees");
	});

	it("requires explicit source parameters unless omission has independent evidence", () => {
		expect(inventory.reactors.CreateProject.parameterOmission).toBe(
			"explicit-argument-required",
		);
		expect(inventory.reactors.UUID.parameterOmission).toBe(
			"proven-no-input-read",
		);
		expect(sourceContracts.parameterOmission.sourceDefault).toBe(false);
		expect(
			Object.keys(
				sourceContracts.parameterOmission.provenZeroInputClasses,
			),
		).toEqual(["prerna.reactor.UUIDReactor"]);
		expect(
			inventory.coverage.sourceNamesWithProvenParameterOmission +
				inventory.coverage.sourceNamesRequiringParameterArgument,
		).toBe(inventory.coverage.sourceContractNames);
	});

	it("models factory aliases, frame dispatch, and deterministic class collisions", () => {
		expect(inventory.reactors.GetAppInsights.contexts.GENERAL.class).toBe(
			inventory.reactors.GetInsights.contexts.GENERAL.class,
		);
		expect(inventory.reactors.AVG.contexts.EXPRESSION.class).toBe(
			inventory.reactors.Average.contexts.EXPRESSION.class,
		);
		expect(inventory.reactors.AND.contexts.EXPRESSION.class).toBe(
			inventory.reactors.And.contexts.EXPRESSION.class,
		);
		expect(
			Object.keys(inventory.reactors.RenameColumn.contexts).sort(),
		).toEqual(["H2", "PYTHON", "R"]);
		expect(inventory.reactors.Filter.contexts.GENERAL.class).toBe(
			"prerna.reactor.qs.filter.FilterReactor",
		);
		expect(
			inventory.reactors.Filter.contexts.GENERAL.shadowedClasses,
		).toEqual(["prerna.reactor.FilterReactor"]);
		expect(inventory.reactors.LLM.parameters).toEqual(
			expect.arrayContaining(["media", "image"]),
		);
		expect(inventory.reactors.CreatePlaygroundRoom.parameters).toContain(
			"mode",
		);
		expect(inventory.reactors.GetCurrentUser.parameters).toContain(
			"includeToken",
		);
		expect(inventory.reactors.API.parameters).toEqual(
			expect.arrayContaining(["api_type", "aliasMap", "headersMap"]),
		);
	});
});
