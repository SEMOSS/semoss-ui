import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InboxRoutineForm } from "./inbox-routine-form";
import type {
	InboxRoutine,
	InboxRoutineSettings,
} from "./inbox-routine-schema";
import { INBOX_RESULT_COPY } from "./routine-copy";
import { RoutineResult } from "./routine-result";
import { RoutinesWorkspace } from "./routines-workspace";

const service = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	save: vi.fn<(settings: InboxRoutineSettings) => Promise<InboxRoutine>>(),
	usePixel: vi.fn(),
	result: {
		status: "SUCCESS",
		data: null as unknown,
		error: null as Error | null,
		refresh: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: service.actions }),
	usePixel: service.usePixel,
}));
vi.mock("./inbox-routine-api", () => ({
	saveInboxRoutine: (_actions: unknown, settings: InboxRoutineSettings) =>
		service.save(settings),
}));

const routine: InboxRoutine = {
	id: "inbox-daily-brief",
	configured: false,
	enabled: false,
	time: "08:00",
	days: ["MON", "TUE", "WED", "THU", "FRI"],
	timezone: "America/New_York",
	emailCount: 25,
	nextRunAt: null,
	schedulerAvailable: true,
	assistantAvailable: true,
	mailboxAvailable: true,
	availabilityMessage: null,
	lastRun: null,
};

/** Exercise the actual shared form controls without issuing scheduler writes. */
function renderForm(record: InboxRoutine = routine) {
	const onSave = vi.fn(async (settings: InboxRoutineSettings) => ({
		...record,
		...settings,
		configured: true,
	}));
	render(
		<MemoryRouter>
			<InboxRoutineForm routine={record} onSave={onSave} />
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
	service.result.status = "SUCCESS";
	service.result.data = routine;
	service.result.error = null;
	service.usePixel.mockReturnValue(service.result);
	service.save.mockImplementation(async (settings) => ({
		...routine,
		...settings,
		configured: true,
	}));
});
afterEach(cleanup);

describe("InboxRoutineForm", () => {
	it("starts off without saving and autosaves after enabling the brief", async () => {
		const { user, onSave } = renderForm();
		const toggle = screen.getByRole("switch", {
			name: "Enable daily brief",
		});
		expect(toggle).not.toBeChecked();
		expect(toggle).toHaveAccessibleDescription(/automatically/i);
		expect(screen.getByText("Not enabled")).toBeVisible();
		const status = screen.getByRole("status", { name: "Save status" });
		expect(status).toBeEmptyDOMElement();
		expect(
			screen.queryByRole("button", {
				name: /Save schedule|Save preferences|Cancel/,
			}),
		).not.toBeInTheDocument();
		await autosave();
		expect(onSave).not.toHaveBeenCalled();
		await user.click(toggle);
		expect(toggle).toBeChecked();
		expect(onSave).not.toHaveBeenCalled();
		await autosave();
		expect(onSave).toHaveBeenCalledOnce();
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ enabled: true, emailCount: 25 }),
		);
		expect(screen.getByRole("status", { name: "Save status" })).toBe(
			status,
		);
		expect(status).toHaveTextContent("Saved");
	});

	it("saves selected days, time zone, time, and the numeric email limit", async () => {
		const { user, onSave } = renderForm({ ...routine, configured: true });
		await user.click(
			screen.getByRole("switch", { name: "Enable daily brief" }),
		);
		for (const name of ["Monday", "Wednesday", "Friday"]) {
			await user.click(screen.getByRole("button", { name }));
		}
		fireEvent.change(screen.getByLabelText("Run time (required)"), {
			target: { value: "09:15" },
		});
		const timezone = screen.getByRole("combobox", {
			name: "Time zone (required)",
		});
		timezone.focus();
		await user.keyboard("{Enter}");
		await user.click(
			screen.getByRole("option", { name: "America/Chicago" }),
		);
		const count = screen.getByRole("spinbutton", {
			name: "Emails to review for replies (required)",
		});
		await user.clear(count);
		await user.type(count, "40");
		await autosave();
		expect(onSave).toHaveBeenCalledExactlyOnceWith({
			enabled: true,
			time: "09:15",
			days: ["TUE", "THU"],
			timezone: "America/Chicago",
			emailCount: 40,
		});
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Saved");
	});

	it.each([
		[
			"Emails to review for replies (required)",
			"101",
			"Choose between 1 and 100 emails.",
		],
		[
			"Emails to review for replies (required)",
			"",
			"Choose a whole number of emails.",
		],
		["Run time (required)", "", "Choose a valid run time."],
	])(
		"associates the invalid %s value %s with its correction",
		async (label, value, message) => {
			const { onSave } = renderForm();
			const field = screen.getByLabelText(label);
			fireEvent.change(field, { target: { value } });
			const focused = screen.getByRole("switch", {
				name: "Enable daily brief",
			});
			focused.focus();
			await autosave();
			expect(screen.getByRole("alert")).toHaveTextContent(message);
			expect(field).toHaveAttribute("aria-invalid", "true");
			expect(field).toHaveAccessibleDescription(
				expect.stringContaining(message),
			);
			expect(focused).toHaveFocus();
			expect(
				screen.getByRole("status", { name: "Save status" }),
			).toHaveTextContent("Check fields");
			expect(onSave).not.toHaveBeenCalled();
		},
	);

	it("requires at least one day without moving focus after autosave validation", async () => {
		const { user, onSave } = renderForm();
		for (const name of [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
		]) {
			await user.click(screen.getByRole("button", { name }));
		}
		await autosave();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Choose at least one day.",
		);
		const days = screen.getByRole("group", { name: "Run on (required)" });
		expect(days).toHaveAttribute("aria-invalid", "true");
		expect(days).toHaveAccessibleDescription("Choose at least one day.");
		expect(screen.getByRole("button", { name: "Friday" })).toHaveFocus();
		expect(onSave).not.toHaveBeenCalled();
	});

	it("retains the draft after a rejected save and allows retry", async () => {
		const { user, onSave } = renderForm();
		onSave.mockRejectedValueOnce(
			new Error("Scheduler could not save this schedule"),
		);
		const count = screen.getByRole("spinbutton", {
			name: "Emails to review for replies (required)",
		});
		await user.clear(count);
		await user.type(count, "60");
		await autosave();
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Scheduler could not save this schedule");
		expect(count).toHaveValue(60);
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Not saved");
		await user.click(screen.getByRole("button", { name: "Retry save" }));
		await autosave(0);
		expect(onSave).toHaveBeenCalledTimes(2);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(count).toHaveValue(60);
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Saved");
	});

	it("keeps fields editable and saves newer changes after the pending write", async () => {
		const { user, onSave } = renderForm();
		let completeSave: (value: InboxRoutine) => void;
		onSave.mockImplementationOnce(
			() =>
				new Promise<InboxRoutine>((resolve) => {
					completeSave = resolve;
				}),
		);
		const count = screen.getByLabelText(
			"Emails to review for replies (required)",
		);
		await user.clear(count);
		await user.type(count, "30");
		await autosave();
		expect(onSave).toHaveBeenCalledOnce();
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Saving…");
		expect(
			screen.getByRole("switch", { name: "Enable daily brief" }),
		).toBeEnabled();
		expect(screen.getByRole("button", { name: "Monday" })).toBeEnabled();
		expect(screen.getByLabelText("Run time (required)")).toBeEnabled();
		expect(screen.getByLabelText("Time zone (required)")).toBeEnabled();
		expect(count).toBeEnabled();
		await user.clear(count);
		await user.type(count, "40");
		await autosave();
		expect(onSave).toHaveBeenCalledOnce();
		await act(async () =>
			completeSave({
				...routine,
				...onSave.mock.calls[0][0],
				configured: true,
			}),
		);
		expect(count).toHaveValue(40);
		await autosave();
		expect(onSave).toHaveBeenCalledTimes(2);
		expect(onSave).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({ emailCount: 30 }),
		);
		expect(onSave).toHaveBeenLastCalledWith(
			expect.objectContaining({ emailCount: 40 }),
		);
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Saved");
	});

	it("allows an enabled routine to be paused when its inbox connection is unavailable", async () => {
		const { user, onSave } = renderForm({
			...routine,
			configured: true,
			enabled: true,
			mailboxAvailable: false,
			availabilityMessage: "Reconnect Microsoft to resume inbox briefs.",
		});
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Reconnect Microsoft",
		);
		expect(
			screen.getByRole("link", { name: "Manage inbox connection" }),
		).toHaveAttribute("href", "/brain/sources");
		await user.click(
			screen.getByRole("switch", { name: "Enable daily brief" }),
		);
		await autosave();
		expect(onSave).toHaveBeenCalledOnce();
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ enabled: false }),
		);
	});

	it("does not enable a routine until its required services are available", async () => {
		const { user, onSave } = renderForm({
			...routine,
			schedulerAvailable: false,
			availabilityMessage: "The scheduler is unavailable.",
		});
		await user.click(
			screen.getByRole("switch", { name: "Enable daily brief" }),
		);
		await autosave();
		expect(screen.getAllByRole("alert")).toHaveLength(1);
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("The scheduler is unavailable.");
		expect(onSave).not.toHaveBeenCalled();
	});
});

describe("RoutinesWorkspace", () => {
	it("shows one HTML result beside the settings and opens chat without submitting the form", async () => {
		service.result.data = {
			...routine,
			lastRun: {
				status: "completed",
				startedAt: "2026-10-15T12:00:00Z",
				finishedAt: "2026-10-15T12:01:00Z",
				roomId: "brief-room",
				summary: "Reply to Dana before Thursday.",
				html: "<h2>Suggested priorities</h2><p>Reply to Dana before Thursday.</p>",
				error: null,
			},
		};
		service.actions.run.mockResolvedValue({
			pixelReturn: [
				{ output: { roomId: "brief-chat" }, operationType: [] },
			],
		});
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<RoutinesWorkspace />
			</MemoryRouter>,
		);
		const result = screen.getByRole("region", { name: "Latest brief" });
		expect(result.closest("form")).toContainElement(
			screen.getByRole("switch", { name: "Enable daily brief" }),
		);
		expect(
			screen.getAllByRole("heading", { name: "Latest brief" }),
		).toHaveLength(1);
		expect(screen.getByTitle("Latest brief email")).toHaveAttribute(
			"srcdoc",
			expect.stringContaining("Suggested priorities"),
		);
		await user.click(screen.getByRole("button", { name: "Ask Assistant" }));
		await autosave();
		expect(service.actions.run).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining("WorkOpenRoutineRoom"),
		);
		expect(service.save).not.toHaveBeenCalled();
	});

	it("loads the owner routine and shows the first-run empty state without enabling it", () => {
		render(
			<MemoryRouter>
				<RoutinesWorkspace />
			</MemoryRouter>,
		);
		expect(service.usePixel).toHaveBeenCalledWith("WorkGetInboxRoutine();");
		expect(screen.getByRole("heading", { name: "Routines" })).toBeVisible();
		expect(
			screen.getByText("Your first brief will appear here"),
		).toBeVisible();
		expect(
			screen.getByRole("switch", { name: "Enable daily brief" }),
		).not.toBeChecked();
		expect(service.save).not.toHaveBeenCalled();
	});

	it.each(["INITIAL", "LOADING"])(
		"keeps the form unavailable while %s",
		(status) => {
			service.result.status = status;
			service.result.data = undefined;
			render(
				<MemoryRouter>
					<RoutinesWorkspace />
				</MemoryRouter>,
			);
			expect(screen.getByRole("status")).toHaveTextContent(
				"Loading routines…",
			);
			expect(screen.queryByRole("switch")).not.toBeInTheDocument();
		},
	);

	it.each(["error", "malformed"])(
		"requires a valid response after a %s read",
		async (problem) => {
			const user = userEvent.setup();
			service.result.status = problem === "error" ? "ERROR" : "SUCCESS";
			service.result.data = { enabled: false };
			service.result.error =
				problem === "error"
					? new Error("Connection interrupted")
					: null;
			render(
				<MemoryRouter>
					<RoutinesWorkspace />
				</MemoryRouter>,
			);
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Could not load routines",
			);
			expect(screen.queryByRole("switch")).not.toBeInTheDocument();
			await user.click(screen.getByRole("button", { name: "Try again" }));
			expect(service.result.refresh).toHaveBeenCalledOnce();
			expect(service.save).not.toHaveBeenCalled();
		},
	);

	it("updates the loaded record only after the scheduler save succeeds", async () => {
		const user = userEvent.setup();
		service.save.mockRejectedValueOnce(new Error("Schedule save failed"));
		render(
			<MemoryRouter>
				<RoutinesWorkspace />
			</MemoryRouter>,
		);
		await user.click(
			screen.getByRole("switch", { name: "Enable daily brief" }),
		);
		await autosave();
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Schedule save failed");
		expect(service.result.update).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Retry save" }));
		await autosave(0);
		expect(service.result.update).toHaveBeenCalledOnce();
		expect(service.result.update).toHaveBeenCalledWith(
			expect.objectContaining({ configured: true, enabled: true }),
		);
	});

	it("keeps a pending inbox autosave when switching routine tabs", async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<RoutinesWorkspace />
			</MemoryRouter>,
		);
		const count = screen.getByLabelText(
			"Emails to review for replies (required)",
		);
		await user.clear(count);
		await user.type(count, "45");
		await user.click(
			screen.getByRole("tab", { name: "Weekly meeting agendas" }),
		);
		expect(service.save).not.toHaveBeenCalled();
		await autosave();
		expect(service.save).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ emailCount: 45 }),
		);
		await user.click(
			screen.getByRole("tab", { name: "Inbox daily brief" }),
		);
		expect(
			screen.getByLabelText("Emails to review for replies (required)"),
		).toBe(count);
		expect(count).toHaveValue(45);
		expect(
			screen.getByRole("status", { name: "Save status" }),
		).toHaveTextContent("Saved");
	});

	it.each(["running", "failed", "completed"] as const)(
		"shows the latest brief's %s result without changing the schedule",
		(status) => {
			service.result.data = {
				...routine,
				lastRun: {
					status,
					startedAt: "2026-10-12T12:00:00Z",
					finishedAt:
						status === "running" ? null : "2026-10-12T12:01:00Z",
					roomId: status === "running" ? null : "brief-room",
					summary:
						status === "completed"
							? "Reply to Dana before Thursday."
							: null,
					error:
						status === "failed"
							? "Reconnect your Microsoft inbox."
							: null,
				},
			};
			render(
				<MemoryRouter>
					<RoutinesWorkspace />
				</MemoryRouter>,
			);
			if (status === "running") {
				expect(
					screen.getByText(/Your inbox brief is being prepared/),
				).toBeVisible();
			} else if (status === "failed") {
				expect(screen.getByRole("alert")).toHaveTextContent(
					"Reconnect your Microsoft inbox.",
				);
				expect(
					screen.getByRole("link", {
						name: "Manage inbox connection",
					}),
				).toHaveAttribute("href", "/brain/sources");
			} else {
				expect(
					screen.getByText("Reply to Dana before Thursday."),
				).toBeVisible();
			}
			expect(
				screen.queryByRole("link", { name: "Open session" }),
			).not.toBeInTheDocument();
			expect(service.save).not.toHaveBeenCalled();
		},
	);
});

describe("RoutineResult", () => {
	it("renders useful Markdown without remote images, embedded HTML, or scripts", () => {
		const { container } = render(
			<MemoryRouter>
				<RoutineResult
					copy={INBOX_RESULT_COPY}
					routine={{
						...routine,
						lastRun: {
							status: "completed",
							startedAt: "2026-10-12T12:00:00Z",
							finishedAt: "2026-10-12T12:01:00Z",
							roomId: "brief/with spaces",
							error: null,
							summary: [
								"## Decisions to make",
								"- **Reply to Dana** by Thursday.",
								"![Tracking image](https://tracking.example/image.png)",
								'<img src="https://tracking.example/raw.png" onerror="alert(1)">',
								'<iframe src="https://tracking.example/embed"></iframe>',
								'<script>alert("untrusted email")</script>',
							].join("\n\n"),
						},
					}}
				/>
			</MemoryRouter>,
		);
		expect(
			screen.getByRole("heading", { name: "Decisions to make" }),
		).toBeVisible();
		expect(screen.getByText("Reply to Dana")).toBeVisible();
		expect(container.querySelectorAll("img, iframe, script")).toHaveLength(
			0,
		);
		expect(screen.queryByText(/untrusted email/)).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Open session" }),
		).not.toBeInTheDocument();
	});

	it("warns on a completed brief whose email could not be sent", () => {
		render(
			<MemoryRouter>
				<RoutineResult
					copy={INBOX_RESULT_COPY}
					routine={{
						...routine,
						lastRun: {
							status: "completed",
							startedAt: "2026-10-12T12:00:00Z",
							finishedAt: "2026-10-12T12:01:00Z",
							roomId: null,
							summary: "Reply to Dana before Thursday.",
							error: "The brief was saved but the email could not be sent.",
						},
					}}
				/>
			</MemoryRouter>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"The brief was saved but the email could not be sent.",
		);
		expect(
			screen.getByText("Reply to Dana before Thursday."),
		).toBeVisible();
	});
});
