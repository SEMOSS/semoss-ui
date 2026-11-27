import { expect, test } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const FEATURES = resolve(import.meta.dirname, "features");

/** Every source file under a directory, tests left out. */
const listSources = (directory: string): string[] =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return listSources(path);
		return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
			? [path]
			: [];
	});

/** The module specifiers a source file imports or re-exports. */
const readImports = (source: string): string[] =>
	[...source.matchAll(/\bfrom\s+"([^"]+)"|\bimport\s+"([^"]+)"/g)].map(
		(match) => match[1] ?? match[2],
	);

/** Whether a path is in a `store/` or `turns/` folder: state and turn logic. */
const isLogicFile = (path: string): boolean =>
	/\/(store|turns)\//.test(path.replaceAll("\\", "/"));

/** A `use-*.ts` hook is how React reads a store, so it may import React. */
const isHook = (path: string): boolean => /\/use-[^/]+\.ts$/.test(path);

test("store/ and turns/ folders hold no components", () => {
	const components = listSources(FEATURES)
		.filter((path) => isLogicFile(path) && path.endsWith(".tsx"))
		.map((path) => relative(FEATURES, path));
	expect(components).toEqual([]);
});

test("store/ and turns/ files import no React and no component file", () => {
	const violations = listSources(FEATURES)
		.filter((path) => isLogicFile(path) && !isHook(path))
		.flatMap((path) =>
			readImports(readFileSync(path, "utf8"))
				.filter(
					(specifier) =>
						specifier === "react" ||
						specifier === "react-dom" ||
						(specifier.startsWith(".") &&
							existsSync(
								`${resolve(dirname(path), specifier)}.tsx`,
							)),
				)
				.map(
					(specifier) =>
						`${relative(FEATURES, path)} -> ${specifier}`,
				),
		);
	// A store that needs something from chat UI takes it as an argument (as
	// `ChatStore` takes its panel blueprints) instead of importing it.
	expect(violations).toEqual([]);
});

test("chat source never reads the deployment's theme", () => {
	// The host owns its theme and hands the chat typed options and pieces
	// (`ChatConfig`), so no chat source names the theme's shape or helpers.
	const readers = listSources(FEATURES)
		.filter((path) =>
			/\b(ThemeMap|PlaygroundTheme|DEFAULT_PLAYGROUND_THEME|mergePlaygroundTheme|usePlaygroundServerTheme)\b/.test(
				readFileSync(path, "utf8"),
			),
		)
		.map((path) => relative(FEATURES, path));
	expect(readers).toEqual([]);
});

/**
 * Names the chat's glossary replaced (AGENTS.md, Naming), so the old word for
 * a concept does not come back beside the new one.
 */
const RETIRED_NAMES =
	/\b(newRoomPanels|isNewChat|panelComponents|useDefaultSettingsPages|RoomSearchDialog|RoomLayout|RailItem|ROOM_CONFIGURATION_PANEL|ROOM_AUDIT_LOG_PANEL|NewChatPreferences|CompactStrategyPicker)\b/;

test("chat source uses one word per concept", () => {
	const users = listSources(FEATURES)
		.filter((path) => RETIRED_NAMES.test(readFileSync(path, "utf8")))
		.map((path) => relative(FEATURES, path));
	expect(users).toEqual([]);
});
