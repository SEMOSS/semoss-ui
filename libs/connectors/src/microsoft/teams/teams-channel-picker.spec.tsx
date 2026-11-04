import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import strings from "../../../../i18n/src/resources/locales/en/connectors/connectors.json";
import { runConnectorPixel } from "../../core/connector-pixel";
import { TeamsChannelPicker } from "./teams-channel-picker";
import { TeamsChannelViewer } from "./teams-channel-viewer";
import { TeamsFilesViewer } from "./teams-files-viewer";
import { useTeamsChannelChoice } from "./use-teams-channel-choice";

const files = vi.hoisted(() => ({
	root: { files: [{ id: "folder", name: "Demo Docs", isFolder: true }] },
	folder: {
		files: [{ id: "report", name: "Report.pdf", driveId: "team-drive" }],
	},
	empty: [],
	refresh: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "origin" }),
	usePixel: (pixel: string) => ({
		status: "SUCCESS",
		data: !pixel
			? files.empty
			: pixel.includes("folderPath")
				? files.folder
				: files.root,
		refresh: files.refresh,
	}),
}));
vi.mock("../../core/connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../core/connector-pixel")>()),
	runConnectorPixel: vi.fn(),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		i18n: { language: "en" },
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
	await click(button("Choose a team"));
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

it.each([
	["Teams Channel Files", TeamsFilesViewer],
	["Teams Channel Posts", TeamsChannelViewer],
])(
	"starts %s at all teams without loading an arbitrary channel",
	async (_, Viewer) => {
		await act(async () => root.render(<Viewer showHeader={false} />));
		expect(button("Choose a team").textContent).toBe("Choose a team");
		expect(document.body.textContent).not.toContain(
			"You are not in any teams",
		);
		expect(read.mock.calls.map(([pixel]) => pixel)).toEqual([
			"MicrosoftTeamsListTeams();",
		]);
		await openTeams();
		expect(document.activeElement?.getAttribute("aria-label")).toBe(
			"Search teams",
		);
		expect(option("Alpha team")).toBeTruthy();
		expect(
			document.querySelector('[role="dialog"]')?.textContent,
		).not.toContain("All teams");
		await click(option("Alpha team"));
		expect(button("Choose a team").textContent).toBe("Choose a team");
		expect(read.mock.calls.map(([pixel]) => pixel)).toEqual([
			"MicrosoftTeamsListTeams();",
			'MicrosoftTeamsListChannels(teamId=["alpha"]);',
		]);
		await act(async () =>
			document.activeElement?.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
			),
		);
		await vi.waitFor(() =>
			expect(document.activeElement).toBe(button("Choose a team")),
		);
		await openTeams();
		expect(document.activeElement?.getAttribute("aria-label")).toBe(
			"Search teams",
		);
	},
);

it("searches the whole directory, pages results, and commits a team/channel together with the keyboard", async () => {
	await render();
	await openTeams();
	expect(document.querySelectorAll('[role="option"]')).toHaveLength(50);
	await click(button("Show More"));
	expect(document.querySelectorAll('[role="option"]')).toHaveLength(100);
	await search("  RESEARCH  zulu ");
	expect(document.querySelectorAll('[role="option"]')).toHaveLength(1);
	await click(option("Zulu team"));
	expect(button("Choose a team").textContent).toBe("Choose a team");
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
	await click(button("Change team or channel"));
	expect(document.activeElement?.getAttribute("aria-label")).toBe(
		"Search channels",
	);
	expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
		"Zulu team",
	);
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
	await click(option("Alpha team"));
	await click(option("General"));
	await click(button("Change team or channel"));
	await click(button("All teams"));
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
	expect(button("Choose a team").textContent).toBe("Choose a team");
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

it("opens a clicked Teams file after fetching it, while folder selection only browses", async () => {
	let finishDownload: (value: unknown) => void = () => undefined;
	read.mockImplementation(async (pixel) => {
		if (pixel.includes("ListTeams")) return teams;
		if (pixel.includes("ListChannels")) return channels;
		if (pixel.includes("BrowseInsightAssets")) return [];
		if (pixel.includes("DownloadFile")) {
			return new Promise((resolve) => {
				finishDownload = resolve;
			});
		}
		throw new Error(`Unexpected pixel: ${pixel}`);
	});
	const onOpenFile = vi.fn();
	const onAddToContext = vi.fn();
	const onSaved = vi.fn();
	await act(async () =>
		root.render(
			<TeamsFilesViewer
				onOpenFile={onOpenFile}
				onAddToContext={onAddToContext}
				onSaved={onSaved}
			/>,
		),
	);
	await openTeams();
	await click(option("Alpha team"));
	await click(option("General"));
	await click(button("Demo Docs"));
	expect(
		read.mock.calls.some(([pixel]) => pixel.includes("DownloadFile")),
	).toBe(false);
	await click(button("Report.pdf"));
	await click(button("Report.pdf"));
	const downloads = read.mock.calls.filter(([pixel]) =>
		pixel.includes("DownloadFile"),
	);
	expect(downloads).toHaveLength(1);
	expect(downloads[0]).toEqual([
		'MicrosoftTeamsDownloadFile(id=["report"], driveId=["team-drive"], fileName=["<encode>Report.pdf</encode>"]);',
		"origin",
	]);
	expect(onOpenFile).not.toHaveBeenCalled();
	await act(async () => finishDownload({ filePath: "Report.pdf" }));
	expect(onOpenFile).toHaveBeenCalledExactlyOnceWith({
		path: "Report.pdf",
		name: "Report.pdf",
		service: "teams-files",
	});
	expect(onAddToContext).not.toHaveBeenCalled();
	expect(onSaved).not.toHaveBeenCalled();
});
