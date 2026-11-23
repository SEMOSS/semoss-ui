import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomRoutineCard } from "./custom-routine-card";
import type { CustomRoutine } from "./custom-routine-schema";

// one actions object, as the provider gives
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const api = vi.hoisted(() => ({
	manageCustomRoutine: vi.fn(),
	saveCustomRoutine: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
vi.mock("./custom-routine-api", () => ({
	manageCustomRoutine: api.manageCustomRoutine,
	saveCustomRoutine: api.saveCustomRoutine,
}));

const routine: CustomRoutine = {
	id: "routine-1",
	enabled: true,
	name: "Client asks digest",
	prompt: "Summarize what my clients asked for.",
	time: "08:00",
	days: ["MON", "TUE", "WED", "THU", "FRI"],
	timezone: "America/New_York",
	delivery: "email",
	skills: [],
	tools: [],
	agentId: "",
	configured: true,
	nextRunAt: "2026-11-05T13:00:00Z",
	schedulerAvailable: true,
	assistantAvailable: true,
	mailboxAvailable: true,
	availabilityMessage: null,
	lastRun: null,
};

afterEach(cleanup);
beforeEach(() => {
	api.manageCustomRoutine.mockReset();
	api.saveCustomRoutine.mockReset();
});

function renderCard(record: CustomRoutine = routine) {
	const onChange = vi.fn();
	const onRefresh = vi.fn();
	render(
		<MemoryRouter>
			<CustomRoutineCard
				routine={record}
				skills={[]}
				onChange={onChange}
				onRefresh={onRefresh}
			/>
		</MemoryRouter>,
	);
	return { onChange, onRefresh, user: userEvent.setup() };
}

/** Opens the routine's "..." menu and chooses Delete routine. */
async function chooseDelete(user: ReturnType<typeof userEvent.setup>) {
	const trigger = screen.getByRole("button", {
		name: "More actions for Client asks digest",
	});
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	await user.click(
		await screen.findByRole("menuitem", { name: "Delete routine" }),
	);
	return screen.findByRole("dialog", { name: "Delete Client asks digest?" });
}

describe("A custom routine", () => {
	it("leads with its result and says when it runs in one line", () => {
		renderCard();
		expect(
			screen.getByRole("heading", { name: "Client asks digest" }),
		).toBeVisible();
		expect(
			screen.getByText(
				/^Weekdays at 8:00\sAM, New York time · Next run Thu, Nov 5, 8:00\sAM · Emails you$/,
			),
		).toBeVisible();
		expect(
			screen.getByRole("tab", { name: "Latest result" }),
		).toHaveAttribute("aria-selected", "true");
		expect(
			screen.getByText("The first result will appear here"),
		).toBeVisible();
	});

	it("runs now and rereads the list", async () => {
		const { onRefresh, user } = renderCard();
		api.manageCustomRoutine.mockResolvedValue(undefined);
		await user.click(screen.getByRole("button", { name: "Run now" }));
		expect(api.manageCustomRoutine).toHaveBeenCalledWith(
			insight.actions,
			"routine-1",
			"run",
		);
		expect(onRefresh).toHaveBeenCalled();
	});

	it("saves an edit still waiting to save before it runs now", async () => {
		const { user } = renderCard();
		api.saveCustomRoutine.mockImplementation(
			async (_actions: unknown, settings: object) => ({
				...routine,
				...settings,
			}),
		);
		api.manageCustomRoutine.mockResolvedValue(undefined);
		// Setup stays mounted behind the result tab
		const name = screen.getByLabelText("Name (required)");
		await user.clear(name);
		await user.type(name, "Client asks");
		await user.click(screen.getByRole("button", { name: "Run now" }));
		await waitFor(() =>
			expect(api.manageCustomRoutine).toHaveBeenCalledWith(
				insight.actions,
				"routine-1",
				"run",
			),
		);
		expect(api.saveCustomRoutine).toHaveBeenCalledExactlyOnceWith(
			insight.actions,
			expect.objectContaining({ name: "Client asks" }),
			"routine-1",
		);
		expect(api.saveCustomRoutine.mock.invocationCallOrder[0]).toBeLessThan(
			api.manageCustomRoutine.mock.invocationCallOrder[0] ?? 0,
		);
	});

	it("says when it is off, and cannot run now then", () => {
		renderCard({ ...routine, enabled: false, nextRunAt: null });
		expect(
			screen.getByText(
				/^Off · Weekdays at 8:00\sAM, New York time · Emails you$/,
			),
		).toBeVisible();
		expect(screen.getByRole("button", { name: "Run now" })).toBeDisabled();
		expect(
			screen.getByRole("switch", { name: "Routine on" }),
		).not.toBeChecked();
	});

	it("says a section of the daily brief runs with the brief, on no schedule of its own", () => {
		renderCard({ ...routine, delivery: "brief", nextRunAt: null });
		expect(
			screen.getByText(
				/^Runs with your daily brief · Shown as a section of the brief$/,
			),
		).toBeVisible();
	});

	it("deletes only after confirming, and keeps the dialog open with the reason when it cannot", async () => {
		const { onChange, user } = renderCard();
		api.manageCustomRoutine.mockRejectedValueOnce(
			new Error("Routine not found"),
		);
		let dialog = await chooseDelete(user);
		expect(api.manageCustomRoutine).not.toHaveBeenCalled();
		await user.click(
			within(dialog).getByRole("button", { name: "Delete routine" }),
		);
		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Routine not found",
		);
		expect(onChange).not.toHaveBeenCalled();

		await user.click(
			within(dialog).getByRole("button", { name: "Cancel" }),
		);
		api.manageCustomRoutine.mockResolvedValueOnce(undefined);
		dialog = await chooseDelete(user);
		await user.click(
			within(dialog).getByRole("button", { name: "Delete routine" }),
		);
		expect(api.manageCustomRoutine).toHaveBeenLastCalledWith(
			insight.actions,
			"routine-1",
			"delete",
		);
		expect(onChange).toHaveBeenCalledWith(null);
	});
});
