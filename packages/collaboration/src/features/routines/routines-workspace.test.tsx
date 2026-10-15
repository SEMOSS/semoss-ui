import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InboxRoutineBrief } from "./inbox-routine-brief";
import { InboxRoutineForm } from "./inbox-routine-form";
import type {
	InboxRoutine,
	InboxRoutineSettings,
} from "./inbox-routine-schema";
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
	return { user: userEvent.setup(), onSave };
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
	it("starts off and requires a save after choosing to enable the brief", async () => {
		const { user, onSave } = renderForm();
		const toggle = screen.getByRole("switch", {
			name: "Enable daily brief",
		});
		expect(toggle).not.toBeChecked();
		expect(toggle).toHaveAccessibleDescription(
			"Runs automatically after you enable it and save your schedule.",
		);
		expect(screen.getByText("Not enabled")).toBeVisible();
		expect(onSave).not.toHaveBeenCalled();
		await user.click(toggle);
		expect(toggle).toBeChecked();
		expect(onSave).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Save schedule" }));
		await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ enabled: true, emailCount: 25 }),
		);
	});

	it("saves selected days, time zone, time, and the numeric thread limit", async () => {
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
		const timezone = screen.getByLabelText("Time zone (required)");
		await user.clear(timezone);
		await user.type(timezone, "America/Chicago");
		const count = screen.getByRole("spinbutton", {
			name: "Recent threads to include (required)",
		});
		await user.clear(count);
		await user.type(count, "40");
		await user.click(screen.getByRole("button", { name: "Save schedule" }));
		await waitFor(() =>
			expect(onSave).toHaveBeenCalledExactlyOnceWith({
				enabled: true,
				time: "09:15",
				days: ["TUE", "THU"],
				timezone: "America/Chicago",
				emailCount: 40,
			}),
		);
		expect(
			screen.queryByText("You have unsaved changes."),
		).not.toBeInTheDocument();
	});

	it.each([
		[
			"Recent threads to include (required)",
			"101",
			"Choose between 1 and 100 threads.",
		],
		[
			"Recent threads to include (required)",
			"",
			"Choose a whole number of threads.",
		],
		["Run time (required)", "", "Choose a valid run time."],
		[
			"Time zone (required)",
			"Unknown/Zone",
			"Enter a valid time zone, such as America/New_York.",
		],
	])(
		"associates the invalid %s value %s with its correction",
		async (label, value, message) => {
			const { user, onSave } = renderForm();
			const field = screen.getByLabelText(label);
			fireEvent.change(field, { target: { value } });
			await user.click(
				screen.getByRole("button", { name: "Save preferences" }),
			);
			expect(await screen.findByRole("alert")).toHaveTextContent(message);
			expect(field).toHaveAttribute("aria-invalid", "true");
			expect(field).toHaveAccessibleDescription(
				expect.stringContaining(message),
			);
			expect(field).toHaveFocus();
			expect(onSave).not.toHaveBeenCalled();
		},
	);

	it("requires at least one day and returns focus to the day controls", async () => {
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
		await user.click(
			screen.getByRole("button", { name: "Save preferences" }),
		);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Choose at least one day.",
		);
		const days = screen.getByRole("group", { name: "Run on (required)" });
		expect(days).toHaveAttribute("aria-invalid", "true");
		expect(days).toHaveAccessibleDescription("Choose at least one day.");
		expect(screen.getByRole("button", { name: "Monday" })).toHaveFocus();
		expect(onSave).not.toHaveBeenCalled();
	});

	it("retains the draft after a rejected save and allows retry", async () => {
		const { user, onSave } = renderForm();
		onSave.mockRejectedValueOnce(
			new Error("Scheduler could not save this schedule"),
		);
		const count = screen.getByRole("spinbutton", {
			name: "Recent threads to include (required)",
		});
		await user.clear(count);
		await user.type(count, "60");
		const save = screen.getByRole("button", { name: "Save preferences" });
		await user.click(save);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Scheduler could not save this schedule",
		);
		expect(count).toHaveValue(60);
		expect(screen.getByRole("status")).toHaveTextContent(
			"You have unsaved changes.",
		);
		await user.click(save);
		await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
		expect(count).toHaveValue(60);
	});

	it("disables changes and duplicate submissions until the save completes", async () => {
		const { user, onSave } = renderForm();
		let completeSave: (value: InboxRoutine) => void;
		onSave.mockImplementationOnce(
			() =>
				new Promise<InboxRoutine>((resolve) => {
					completeSave = resolve;
				}),
		);
		await user.dblClick(
			screen.getByRole("button", { name: "Save preferences" }),
		);
		expect(onSave).toHaveBeenCalledOnce();
		expect(screen.getByRole("button", { name: /Saving/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(
			screen.getByRole("switch", { name: "Enable daily brief" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: "Monday" })).toBeDisabled();
		expect(screen.getByLabelText("Run time (required)")).toBeDisabled();
		expect(screen.getByLabelText("Time zone (required)")).toBeDisabled();
		expect(
			screen.getByLabelText("Recent threads to include (required)"),
		).toBeDisabled();
		await act(async () => completeSave({ ...routine, configured: true }));
		expect(
			screen.getByRole("button", { name: "Save preferences" }),
		).toBeEnabled();
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
		await user.click(
			screen.getByRole("button", { name: "Save preferences" }),
		);
		await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
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
		await user.click(screen.getByRole("button", { name: "Save schedule" }));
		await waitFor(() =>
			expect(screen.getAllByRole("alert")).toHaveLength(2),
		);
		expect(screen.getAllByRole("alert")[1]).toHaveTextContent(
			"The scheduler is unavailable.",
		);
		expect(onSave).not.toHaveBeenCalled();
	});
});

describe("RoutinesWorkspace", () => {
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
		await user.click(screen.getByRole("button", { name: "Save schedule" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Schedule save failed",
		);
		expect(service.result.update).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Save schedule" }));
		await waitFor(() =>
			expect(service.result.update).toHaveBeenCalledOnce(),
		);
		expect(service.result.update).toHaveBeenCalledWith(
			expect.objectContaining({ configured: true, enabled: true }),
		);
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
				expect(
					screen.getByRole("link", { name: "Open session" }),
				).toHaveAttribute("href", "/thread/room%3Abrief-room");
			} else {
				expect(
					screen.getByText("Reply to Dana before Thursday."),
				).toBeVisible();
				expect(
					screen.getByRole("link", { name: "Open session" }),
				).toHaveAttribute("href", "/thread/room%3Abrief-room");
			}
			expect(service.save).not.toHaveBeenCalled();
		},
	);
});

describe("InboxRoutineBrief", () => {
	it("renders useful Markdown without remote images, embedded HTML, or scripts", () => {
		const { container } = render(
			<MemoryRouter>
				<InboxRoutineBrief
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
			screen.getByRole("link", { name: "Open session" }),
		).toHaveAttribute("href", "/thread/room%3Abrief%2Fwith%20spaces");
	});

	it("warns on a completed brief whose email could not be sent", () => {
		render(
			<MemoryRouter>
				<InboxRoutineBrief
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
