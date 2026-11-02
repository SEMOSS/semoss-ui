import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import strings from "../../../../i18n/src/resources/locales/en/connectors/connectors.json";
import { runConnectorPixel } from "../../core/connector-pixel";
import { TeamsChannelPicker } from "./teams-channel-picker";
import { useTeamsChannelChoice } from "./use-teams-channel-choice";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "origin" }),
}));
vi.mock("../../core/connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../core/connector-pixel")>()),
	runConnectorPixel: vi.fn(),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, values?: Record<string, unknown>) => {
			const template = key
				.split(".")
				.reduce<unknown>(
					(value, field) =>
						value && typeof value === "object" && field in value
							? (value as Record<string, unknown>)[field]
							: undefined,
					strings,
				);
			return (typeof template === "string" ? template : key).replace(
				/{{(\w+)}}/g,
				(_, field: string) => String(values?.[field] ?? ""),
			);
		},
	}),
}));

const teams = [
	{ id: "alpha", displayName: "Alpha team" },
	...Array.from({ length: 120 }, (_, index) => ({
		id: `team-${index}`,
		displayName: `Project ${String(index).padStart(3, "0")}`,
	})),
	{ id: "zulu", displayName: "Zulu team", description: "Research workspace" },
];
const channels = [
	{ id: "general", displayName: "General" },
	{
		id: "planning",
		displayName: "Planning",
		description: "Roadmap and milestones",
	},
];
const read = vi.mocked(runConnectorPixel);
let root: Root;
let container: HTMLDivElement;

/** Exercises the picker with its real selection and async query hooks. */
const Harness = () => <TeamsChannelPicker choice={useTeamsChannelChoice()} />;
const render = async () => {
	await act(async () => root.render(<Harness />));
};
const button = (name: string) => {
	const found = Array.from(document.querySelectorAll("button")).find(
		(element) =>
			(
				element.getAttribute("aria-label") ?? element.textContent
			)?.includes(name),
	);
	if (!found) throw new Error(`Missing button: ${name}`);
	return found;
};
const click = async (element: HTMLElement) => {
	await act(async () => element.click());
};
const option = (name: string) => {
	const found = Array.from(
		document.querySelectorAll<HTMLElement>('[role="option"]'),
	).find((element) => element.textContent?.includes(name));
	if (!found) throw new Error(`Missing option: ${name}`);
	return found;
};
const search = async (value: string) => {
	const input = document.querySelector<HTMLInputElement>(
		'input[role="combobox"]',
	);
	if (!input) throw new Error("Missing search input");
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			"value",
		)?.set?.call(input, value);
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
	return input;
};
const openTeams = async () => {
	await click(button("Change team or channel"));
	await click(button("All teams"));
};

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	Element.prototype.scrollIntoView = vi.fn();
	read.mockReset().mockImplementation(async (pixel) =>
		pixel.includes("ListTeams") ? teams : channels,
	);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("searches the whole directory, pages results, and commits a team/channel together with the keyboard", async () => {
	await render();
	await openTeams();
	expect(document.querySelectorAll('[role="option"]')).toHaveLength(50);
	await click(button("Show More"));
	expect(document.querySelectorAll('[role="option"]')).toHaveLength(100);
	await search("  RESEARCH  zulu ");
	expect(document.querySelectorAll('[role="option"]')).toHaveLength(1);
	await click(option("Zulu team"));
	expect(button("Change team or channel").textContent).toContain(
		"Alpha team",
	);
	const input = await search("milestones");
	expect(document.activeElement).toBe(input);
	expect(document.querySelectorAll('[role="option"]')).toHaveLength(1);
	await act(async () =>
		input.dispatchEvent(
			new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
		),
	);
	await act(async () =>
		input.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
		),
	);
	expect(document.querySelector('[role="dialog"]')).toBeNull();
	expect(button("Change team or channel").textContent).toContain(
		"Zulu teamPlanning",
	);
	await new Promise((resolve) => setTimeout(resolve, 0));
	expect(document.activeElement).toBe(button("Change team or channel"));
});

it("keeps the location on Escape and ignores channels arriving after leaving a team", async () => {
	let resolveChannels: (value: unknown) => void = () => undefined;
	read.mockImplementation(async (pixel) => {
		if (pixel.includes("ListTeams")) return teams;
		if (pixel.includes('"zulu"'))
			return new Promise((resolve) => {
				resolveChannels = resolve;
			});
		return channels;
	});
	await render();
	await openTeams();
	await search("Zulu");
	await click(option("Zulu team"));
	expect(document.querySelector("output")?.textContent).toBe("Loading");
	await click(button("All teams"));
	await click(option("Alpha team"));
	await act(async () =>
		resolveChannels([{ id: "late", displayName: "Late channel" }]),
	);
	expect(document.body.textContent).not.toContain("Late channel");
	await act(async () =>
		document.activeElement?.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
		),
	);
	expect(document.querySelector('[role="dialog"]')).toBeNull();
	expect(button("Change team or channel").textContent).toContain(
		"Alpha teamGeneral",
	);
});

it("clears an unmatched search and distinguishes a team with no channels", async () => {
	read.mockImplementation(async (pixel) =>
		pixel.includes("ListTeams")
			? teams
			: pixel.includes('"zulu"')
				? []
				: channels,
	);
	await render();
	await openTeams();
	await search("nonexistent");
	expect(document.body.textContent).toContain("Nothing matches nonexistent");
	await click(button("Clear Search"));
	expect(document.querySelectorAll('[role="option"]')).toHaveLength(50);
	expect(document.activeElement?.getAttribute("role")).toBe("combobox");
	await search("Zulu");
	await click(option("Zulu team"));
	expect(document.body.textContent).toContain(
		"This team has no channels you can see",
	);
	expect(button("Change team or channel").textContent).toContain(
		"Alpha teamGeneral",
	);
});

it("retries a failed channel read within the picker", async () => {
	read.mockImplementation(async (pixel) => {
		if (pixel.includes("ListTeams")) return teams;
		if (pixel.includes('"zulu"')) throw new Error("Temporary failure");
		return channels;
	});
	await render();
	await openTeams();
	await search("Zulu");
	await click(option("Zulu team"));
	expect(document.querySelector('[role="alert"]')?.textContent).toContain(
		"Temporary failure",
	);
	read.mockResolvedValue(channels);
	await click(button("Try Again"));
	expect(option("Planning")).toBeTruthy();
	await click(option("Planning"));
	expect(button("Change team or channel").textContent).toContain(
		"Zulu teamPlanning",
	);
});
