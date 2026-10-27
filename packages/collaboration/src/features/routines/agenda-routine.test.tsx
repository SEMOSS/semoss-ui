import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { agendaMeetingOptions } from "./agenda-meeting-options";
import { saveAgendaRoutine } from "./agenda-routine-api";
import { AgendaRoutineForm } from "./agenda-routine-form";
import {
	type AgendaRoutine,
	type AgendaRoutineSettings,
	agendaRoutineSettingsSchema,
} from "./agenda-routine-schema";
import { RoutinesWorkspace } from "./routines-workspace";

const service = vi.hoisted(() => ({
	usePixel: vi.fn(),
	actions: { run: vi.fn() },
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: service.actions }),
	usePixel: service.usePixel,
}));

const routine: AgendaRoutine = {
	id: "weekly-meeting-agendas",
	configured: false,
	enabled: false,
	time: "08:00",
	days: ["MON"],
	timezone: "America/New_York",
	meetings: ["Board review"],
	ignored: [],
	preferences: "",
	nextRunAt: null,
	schedulerAvailable: true,
	assistantAvailable: true,
	mailboxAvailable: true,
	availabilityMessage: null,
	lastRun: null,
};

const listing = {
	hasMore: false,
	events: [
		{
			subject: "Weekly  ops sync",
			start: "2026-10-20T14:00:00Z",
			isRecurring: true,
		},
		{ subject: "Holiday", start: "2026-10-21", isAllDay: true },
		{
			subject: "Cancelled sync",
			start: "2026-10-22T14:00:00Z",
			isCancelled: true,
		},
		{
			subject: "weekly ops sync",
			start: "2026-10-27T14:00:00Z",
			isRecurring: true,
		},
		{ subject: "Client kickoff", start: "2026-10-28T15:00:00Z" },
	],
};

function pixelResult(status: string, data: unknown = null) {
	return { status, data, error: null, refresh: vi.fn(), update: vi.fn() };
}

/** Answers the calendar read and the routine read like the SDK hook. */
function answer(calendar: ReturnType<typeof pixelResult>, agenda = routine) {
	service.usePixel.mockImplementation((statement: string) =>
		statement.startsWith("MicrosoftCalendarListEvents")
			? calendar
			: statement === "WorkGetAgendaRoutine();"
				? pixelResult("SUCCESS", agenda)
				: pixelResult("SUCCESS", null),
	);
}

function renderForm(record: AgendaRoutine = routine) {
	const onSave = vi.fn(async (settings: AgendaRoutineSettings) => ({
		...record,
		...settings,
		configured: true,
	}));
	render(
		<MemoryRouter>
			<AgendaRoutineForm routine={record} onSave={onSave} />
		</MemoryRouter>,
	);
	return {
		user: userEvent.setup(),
		onSave,
	};
}

/** Settle the debounce while preserving the real timers used by user-event. */
async function autosave(milliseconds = 800): Promise<void> {
	await act(
		async () => new Promise((resolve) => setTimeout(resolve, milliseconds)),
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	answer(pixelResult("SUCCESS", listing));
});
afterEach(cleanup);

describe("agendaMeetingOptions", () => {
	it("lists each meeting once, soonest first, then saved meetings not on the calendar", () => {
		expect(
			agendaMeetingOptions(listing, ["Board review", "WEEKLY OPS SYNC"]),
		).toEqual([
			{
				title: "Weekly ops sync",
				next: "2026-10-20T14:00:00Z",
				count: 2,
				recurring: true,
			},
			{
				title: "Client kickoff",
				next: "2026-10-28T15:00:00Z",
				count: 1,
				recurring: false,
			},
			{ title: "Board review", next: null, count: 0, recurring: false },
		]);
	});

	it("keeps saved meetings when the calendar answer cannot be read", () => {
		expect(
			agendaMeetingOptions({ events: "nope" }, ["Board review"]),
		).toEqual([
			{ title: "Board review", next: null, count: 0, recurring: false },
		]);
	});
});

describe("agendaRoutineSettingsSchema", () => {
	const settings: AgendaRoutineSettings = {
		enabled: true,
		time: "08:00",
		days: ["FRI"],
		timezone: "UTC",
		meetings: ["Ops"],
		ignored: [],
		preferences: "",
	};

	it.each([
		[{ days: [] }, "Choose a day."],
		[{ days: ["MON", "TUE"] }, "Choose a day."],
		[{ meetings: [] }, "Choose at least one meeting to prepare."],
		[{ meetings: ["Ops", " ops"] }, "Choose each meeting only once."],
		[{ meetings: [" "] }, "A meeting needs a title."],
	])("rejects %j", (change, message) => {
		const parsed = agendaRoutineSettingsSchema.safeParse({
			...settings,
			...change,
		});
		expect(parsed.success).toBe(false);
		expect(parsed.error?.issues[0]?.message).toBe(message);
	});

	it("lets a paused routine keep no meetings", () => {
		expect(
			agendaRoutineSettingsSchema.parse({
				...settings,
				enabled: false,
				meetings: [],
			}).meetings,
		).toEqual([]);
	});

	it("saves through one Pixel argument", async () => {
		const run = vi.fn(async () => ({
			pixelReturn: [
				{
					output: { ...routine, enabled: true, meetings: ["Ops"] },
					operationType: ["OPERATION"],
				},
			],
		}));
		await saveAgendaRoutine({ run } as never, settings);
		expect(run).toHaveBeenCalledWith(
			`WorkSaveAgendaRoutine(settings=[${JSON.stringify(settings)}]);`,
		);
	});
});

describe("AgendaRoutineForm", () => {
	it("puts recurring and one-time meetings in their own tabs", async () => {
		answer(
			pixelResult("SUCCESS", {
				events: [
					{
						subject: "Standup",
						start: "2026-10-16T13:00:00Z",
						isRecurring: true,
					},
					...Array.from({ length: 7 }, (_, index) => ({
						subject: `Client call ${index + 1}`,
						start: `2026-10-2${index}T15:00:00Z`,
					})),
				],
			}),
		);
		const { user } = renderForm({
			...routine,
			meetings: ["Client call 7"],
		});
		const recurringTab = screen.getByRole("tab", { name: "Recurring (1)" });
		expect(recurringTab).toHaveAttribute("aria-selected", "true");
		expect(
			within(
				screen.getByRole("list", { name: "Recurring meetings" }),
			).getAllByRole("checkbox"),
		).toHaveLength(1);
		await user.click(screen.getByRole("tab", { name: "One-time (7)" }));
		// every one-time meeting is listed, the chosen one first
		expect(
			within(screen.getByRole("list", { name: "One-time meetings" }))
				.getAllByRole("checkbox")
				.map((box) => box.getAttribute("aria-checked")),
		).toEqual(["true", ...Array(6).fill("false")]);
		await user.type(
			screen.getByRole("searchbox", { name: "Filter meetings" }),
			"call 3",
		);
		expect(screen.getByRole("tab", { name: "One-time (1)" })).toBeVisible();
		expect(
			screen.getByRole("tab", { name: "Recurring (0)" }),
		).toBeVisible();
		expect(
			within(
				screen.getByRole("list", { name: "One-time meetings" }),
			).getAllByRole("checkbox"),
		).toHaveLength(1);
	});

	it("ignores a meeting into the Ignored tab and restores it", async () => {
		const { user, onSave } = renderForm({
			...routine,
			meetings: ["Client kickoff"],
		});
		await user.click(screen.getByRole("tab", { name: "One-time (1)" }));
		const oneTimePanel = screen.getByRole("tabpanel", {
			name: "One-time (1)",
		});
		await user.click(
			screen.getByRole("button", { name: "Ignore Client kickoff" }),
		);
		expect(
			screen.queryByRole("checkbox", { name: "Client kickoff" }),
		).toBeNull();
		expect(screen.getByText("0 of 20 chosen")).toBeVisible();
		expect(
			screen.getByText("No one-time meetings in the next 3 weeks."),
		).toBeVisible();
		// focus stays in the tab the row left
		expect(oneTimePanel).toContainElement(
			document.activeElement as HTMLElement,
		);
		await user.click(screen.getByRole("tab", { name: "Ignored (1)" }));
		await user.click(
			screen.getByRole("button", { name: "Restore Client kickoff" }),
		);
		expect(screen.getByRole("tab", { name: "Ignored (0)" })).toBeVisible();
		expect(
			screen.getByText(
				"Meetings you ignore are listed here, so you can restore them.",
			),
		).toBeVisible();
		await user.click(screen.getByRole("tab", { name: "One-time (1)" }));
		expect(
			screen.getByRole("checkbox", { name: "Client kickoff" }),
		).not.toBeChecked();
		await user.click(screen.getByRole("tab", { name: "Recurring (1)" }));
		await user.click(
			screen.getByRole("button", { name: "Ignore Weekly ops sync" }),
		);
		await autosave();
		expect(onSave).toHaveBeenCalledOnce();
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				meetings: [],
				ignored: ["Weekly ops sync"],
			}),
		);
	});

	it("keeps an ignored meeting out of the lists after a reload", async () => {
		const { user } = renderForm({
			...routine,
			ignored: ["weekly OPS sync"],
		});
		expect(
			screen.getByRole("tab", { name: "Recurring (0)" }),
		).toBeVisible();
		await user.click(screen.getByRole("tab", { name: "Ignored (1)" }));
		expect(
			within(
				screen.getByRole("list", { name: "Ignored meetings" }),
			).getByText("weekly OPS sync"),
		).toBeVisible();
	});

	it("lists the next 3 weeks of meetings and saves the chosen ones on one day", async () => {
		const { user, onSave } = renderForm();
		await autosave();
		expect(onSave).not.toHaveBeenCalled();
		expect(service.usePixel).toHaveBeenCalledWith(
			"MicrosoftCalendarListEvents(days=[21], limit=[100]);",
		);
		expect(
			screen.getByRole("checkbox", { name: "Board review" }),
		).toBeChecked();
		expect(
			screen.getByText("Not on your calendar in the next 3 weeks"),
		).toBeVisible();
		const ops = screen.getByRole("checkbox", { name: "Weekly ops sync" });
		expect(ops).not.toBeChecked();
		expect(ops).toHaveAccessibleDescription(/in 3 weeks$/);
		expect(screen.queryByRole("checkbox", { name: "Holiday" })).toBeNull();
		await user.click(ops);
		await user.click(
			screen.getByRole("checkbox", { name: "Board review" }),
		);
		await user.click(screen.getByRole("radio", { name: "Thursday" }));
		await user.click(
			screen.getByRole("switch", { name: "Enable weekly agendas" }),
		);
		expect(onSave).not.toHaveBeenCalled();
		await autosave();
		expect(onSave).toHaveBeenCalledOnce();
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				enabled: true,
				days: ["THU"],
				meetings: ["Weekly ops sync"],
			}),
		);
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Saved");
	});

	it("does not enable without a meeting and says why", async () => {
		const { user, onSave } = renderForm({ ...routine, meetings: [] });
		await user.click(
			screen.getByRole("switch", { name: "Enable weekly agendas" }),
		);
		await autosave();
		expect(
			screen.getByText("Choose at least one meeting to prepare."),
		).toBeVisible();
		expect(
			screen.getByRole("switch", { name: "Enable weekly agendas" }),
		).toHaveFocus();
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Check fields");
		expect(onSave).not.toHaveBeenCalled();
	});

	it("keeps saved meetings selectable when the calendar cannot be read", () => {
		answer(pixelResult("ERROR"));
		renderForm();
		expect(
			screen.getByText(/Your calendar could not be read/),
		).toBeVisible();
		expect(
			screen.getByRole("checkbox", { name: "Board review" }),
		).toBeChecked();
	});

	it("shows a save failure, keeps the draft, and allows retry", async () => {
		const { user, onSave } = renderForm();
		onSave.mockRejectedValueOnce(
			new Error("Choose one day of the week for the agendas"),
		);
		await user.click(screen.getByRole("radio", { name: "Thursday" }));
		await autosave();
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Choose one day of the week for the agendas");
		expect(
			screen.getByRole("checkbox", { name: "Board review" }),
		).toBeChecked();
		expect(screen.getByRole("radio", { name: "Thursday" })).toBeChecked();
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Not saved");
		await user.click(screen.getByRole("button", { name: "Retry save" }));
		await autosave(0);
		expect(onSave).toHaveBeenCalledTimes(2);
		expect(onSave).toHaveBeenLastCalledWith(
			expect.objectContaining({
				days: ["THU"],
				meetings: ["Board review"],
			}),
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Saved");
	});
});

describe("RoutinesWorkspace", () => {
	it("shows the weekly agendas when they are picked in the list", async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<RoutinesWorkspace />
			</MemoryRouter>,
		);
		// the list reads every routine's on/off state, but the agenda form waits until it is picked
		expect(
			screen.queryByRole("heading", { name: "Weekly meeting agendas" }),
		).not.toBeInTheDocument();
		await user.click(
			screen.getByRole("button", { name: "Weekly meeting agendas" }),
		);
		expect(service.usePixel).toHaveBeenCalledWith(
			"WorkGetAgendaRoutine();",
		);
		expect(
			screen.getByRole("heading", { name: "Weekly meeting agendas" }),
		).toBeVisible();
		expect(
			screen.getByRole("heading", { name: "Latest agendas" }),
		).toBeVisible();
		expect(
			screen.getByText("Your first agendas will appear here"),
		).toBeVisible();
	});

	it("keeps a pending agenda autosave after picking another routine", async () => {
		const user = userEvent.setup();
		service.actions.run.mockResolvedValue({
			pixelReturn: [
				{
					output: { ...routine, configured: true, days: ["THU"] },
					operationType: ["OPERATION"],
				},
			],
		});
		render(
			<MemoryRouter>
				<RoutinesWorkspace />
			</MemoryRouter>,
		);
		await user.click(
			screen.getByRole("button", { name: "Weekly meeting agendas" }),
		);
		const thursday = screen.getByRole("radio", { name: "Thursday" });
		await user.click(thursday);
		await user.click(
			screen.getByRole("button", { name: "Inbox daily brief" }),
		);
		expect(service.actions.run).not.toHaveBeenCalled();
		await autosave();
		expect(service.actions.run).toHaveBeenCalledOnce();
		expect(service.actions.run).toHaveBeenCalledWith(
			expect.stringContaining('"days":["THU"]'),
		);
		await user.click(
			screen.getByRole("button", { name: "Weekly meeting agendas" }),
		);
		expect(screen.getByRole("radio", { name: "Thursday" })).toBe(thursday);
		expect(thursday).toBeChecked();
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Saved");
	});
});
