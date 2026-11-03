import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RouterConfigFormValue } from "./model-import.constants";
import {
	RouterConfigField,
	routerConfigFromJson,
	routerConfigToJson,
} from "./router-config-field";

const mocks = vi.hoisted(() => ({ usePixel: vi.fn() }));

vi.mock("@semoss/sdk/react", () => ({
	usePixel: mocks.usePixel,
	// the model pickers list the models the editor read, so they read no pages
	useIteratorPixel: () => ({
		data: [],
		isLoading: false,
		hasMore: false,
		next: vi.fn(),
	}),
}));

const ENGINES = [
	{ engine_id: "gpt-id", engine_name: "GPT-4o", engine_subtype: "OPEN_AI" },
	{ engine_id: "claude-id", engine_name: "Claude", engine_subtype: "CLAUDE" },
];

/** Props for {@link RouterHarness}. */
interface RouterHarnessProps {
	/** The router.json the editor starts from. */
	config: Record<string, unknown>;
	/** Receives each value the editor changes to. */
	onChange?: (value: RouterConfigFormValue) => void;
}

/** The router editor, keeping its value as the import form and settings page do. */
const RouterHarness = ({ config, onChange }: RouterHarnessProps) => {
	const [value, setValue] = useState(() => routerConfigFromJson(config));
	return (
		<RouterConfigField
			value={value}
			onChange={(next) => {
				setValue(next);
				onChange?.(next);
			}}
		/>
	);
};

const KEYWORD_CONFIG = {
	mode: "keyword",
	routes: [
		{ name: "coding", engine_id: "gpt-id", keywords: ["code"] },
		{ name: "sports", engine_id: "claude-id", keywords: ["nba"] },
		{ name: "travel", engine_id: "claude-id", keywords: ["flight"] },
	],
};

/**
 * Reads the routes' names in the order the editor lists them.
 *
 * @returns Each route's name.
 */
const routeNames = () =>
	screen
		.getAllByRole("textbox", { name: "Intent / route name" })
		.map((input) => (input as HTMLInputElement).value);

beforeEach(() => {
	mocks.usePixel.mockReturnValue({
		status: "SUCCESS",
		data: ENGINES,
		refresh: vi.fn(),
	});
});
afterEach(cleanup);

describe("Model Router routes", () => {
	it("shows each route as a card named by its place and its name", () => {
		render(<RouterHarness config={KEYWORD_CONFIG} />);

		expect(
			screen.getByRole("group", { name: "Route 1: coding" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("group", { name: "Route 3: travel" }),
		).toBeInTheDocument();
	});

	it("moves a route down and up, and keeps the order it saves", () => {
		const onChange = vi.fn();
		render(<RouterHarness config={KEYWORD_CONFIG} onChange={onChange} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Move route 1 down" }),
		);
		expect(routeNames()).toEqual(["sports", "coding", "travel"]);

		fireEvent.click(
			screen.getByRole("button", { name: "Move route 3 up" }),
		);
		expect(routeNames()).toEqual(["sports", "travel", "coding"]);

		const saved = JSON.parse(
			routerConfigToJson(onChange.mock.lastCall?.[0]),
		);
		expect(
			saved.routes.map((route: { name: string }) => route.name),
		).toEqual(["sports", "travel", "coding"]);
	});

	it("keeps focus on the route's other move button once it reaches the top or the bottom", () => {
		render(<RouterHarness config={KEYWORD_CONFIG} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Move route 2 up" }),
		);
		expect(
			screen.getByRole("button", { name: "Move route 1 up" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Move route 1 down" }),
		).toHaveFocus();

		fireEvent.click(
			screen.getByRole("button", { name: "Move route 2 down" }),
		);
		expect(
			screen.getByRole("button", { name: "Move route 3 up" }),
		).toHaveFocus();
	});

	it("moves focus to the route that takes a removed one's place", () => {
		render(<RouterHarness config={KEYWORD_CONFIG} />);

		fireEvent.click(screen.getByRole("button", { name: "Remove route 1" }));
		expect(routeNames()).toEqual(["sports", "travel"]);
		expect(
			screen.getAllByRole("textbox", { name: "Intent / route name" })[0],
		).toHaveFocus();

		fireEvent.click(screen.getByRole("button", { name: "Remove route 2" }));
		expect(routeNames()).toEqual(["sports"]);
		expect(
			screen.getByRole("textbox", { name: "Intent / route name" }),
		).toHaveFocus();
		expect(
			screen.getByRole("button", { name: "Remove route 1" }),
		).toBeDisabled();
	});

	it("shows each route's share of traffic in weighted mode", () => {
		render(
			<RouterHarness
				config={{
					mode: "weighted",
					routes: [
						{ name: "fast", engine_id: "gpt-id", weight: 30 },
						{ name: "deep", engine_id: "claude-id", weight: 60 },
					],
				}}
			/>,
		);

		expect(screen.getByText("30% of traffic")).toBeInTheDocument();
		expect(
			screen.getByText("Total 90%: must add up to 100%"),
		).toBeInTheDocument();

		fireEvent.change(screen.getAllByRole("spinbutton")[1], {
			target: { value: "70" },
		});
		expect(screen.getByText("70% of traffic")).toBeInTheDocument();
		expect(
			screen.getByText("Total 100%: ready to save"),
		).toBeInTheDocument();
	});
});
