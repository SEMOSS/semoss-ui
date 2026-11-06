// @vitest-environment node

import { expect, test } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = import.meta.dirname;

/** The core's sources: everything but the subpaths, test fixtures and tests. */
const coreSources = (directory: string): string[] =>
	readdirSync(directory).flatMap((name) => {
		const path = join(directory, name);
		const rel = relative(SRC, path);
		if (statSync(path).isDirectory()) {
			return ["connectors", "panels", "testing"].includes(rel)
				? []
				: coreSources(path);
		}
		return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)
			? [path]
			: [];
	});

/** The specifiers a source imports, statically or dynamically. */
const importsOf = (source: string): string[] =>
	[...source.matchAll(/(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g)].map(
		(match) => match[1],
	);

test("the core never imports connectors, file panels or a router", () => {
	const offenders = coreSources(SRC).flatMap((path) =>
		importsOf(readFileSync(path, "utf8"))
			.filter(
				(specifier) =>
					specifier.startsWith("@semoss/connectors") ||
					specifier.startsWith("@semoss/panels") ||
					specifier.startsWith("react-router") ||
					/(^|\/)connectors\//.test(specifier) ||
					/(^|\/)panels\/(index|file-panels)/.test(specifier),
			)
			.map((specifier) => `${relative(SRC, path)} → ${specifier}`),
	);
	expect(offenders).toEqual([]);
});

test("nothing imports the package's own entry points from inside", () => {
	const offenders = coreSources(SRC).flatMap((path) =>
		importsOf(readFileSync(path, "utf8"))
			.filter((specifier) => specifier.startsWith("@semoss/chat"))
			.map((specifier) => `${relative(SRC, path)} → ${specifier}`),
	);
	expect(offenders).toEqual([]);
});
