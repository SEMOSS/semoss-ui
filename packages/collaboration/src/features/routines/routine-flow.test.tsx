import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgendaRoutineForm } from "./agenda-routine-form";
import {
	type AgendaRoutine,
	agendaRoutineSchema,
} from "./agenda-routine-schema";
import { InboxRoutineForm } from "./inbox-routine-form";
import { type InboxRoutine, inboxRoutineSchema } from "./inbox-routine-schema";
import { routineFlowSchema } from "./routine-flow-schema";
import { RoutineFlowSection } from "./routine-flow-section";

const service = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	usePixel: vi.fn(),
	preview: vi.fn<(props: { workflow: unknown }) => void>(),
	previewLoads: 0,
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: service.actions }),
	usePixel: service.usePixel,
}));
vi.mock("@semoss/automation/flow-preview", () => {
	service.previewLoads += 1;
	return {
		AutomationFlowPreview: (props: { workflow: unknown }) => {
			service.preview(props);
			return <div role="img" aria-label="Routine flow preview" />;
		},
	};
});

const flow: NonNullable<InboxRoutine["flow"]> = {
	nodes: [
		{
			id: "start",
			type: "start",
			label: "Start",
			position: { x: 0, y: 0 },
		},
		{
			id: "routine",
			type: "python",
			label: "Do the routine",
			position: { x: 0, y: 180 },
		},
		{ id: "deliver", type: "email", label: "Deliver to me" },
	],
	edges: [
		{
			source: "start",
			target: "routine",
			sourcePort: "output",
			targetPort: "input",
		},
		{
			source: "routine",
			target: "deliver",
			sourcePort: "output",
			targetPort: "input",
		},
	],
};
const agendaFlow = {
	...flow,
	nodes: flow.nodes.map((node) => ({
		...node,
		label: node.id === "routine" ? "Prepare meeting agendas" : node.label,
	})),
};

const inboxRoutine: InboxRoutine = {
	id: "inbox-daily-brief",
	configured: true,
	enabled: false,
	time: "08:00",
	days: ["MON", "TUE", "WED", "THU", "FRI"],
	timezone: "America/New_York",
	lookbackHours: 24,
	nextRunAt: null,
	schedulerAvailable: true,
	assistantAvailable: true,
	mailboxAvailable: true,
	availabilityMessage: null,
	lastRun: null,
};
const agendaRoutine: AgendaRoutine = {
	...inboxRoutine,
	id: "weekly-meeting-agendas",
	days: ["MON"],
	meetings: ["Board review"],
	ignored: [],
};

beforeEach(() => {
	vi.clearAllMocks();
	service.preview.mockReset();
	service.usePixel.mockReturnValue({
		status: "SUCCESS",
		data: { events: [], hasMore: false },
		error: null,
		refresh: vi.fn(),
		update: vi.fn(),
	});
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("routine flow sections", () => {
	it("expands each card's server flow inline by keyboard without saving or running", async () => {
		const user = userEvent.setup();
		const saveInbox = vi.fn(async () => inboxRoutine);
		const saveAgenda = vi.fn(async () => agendaRoutine);
		render(
			<MemoryRouter>
				<InboxRoutineForm
					routine={{ ...inboxRoutine, flow }}
					onSave={saveInbox}
				/>
				<AgendaRoutineForm
					routine={{ ...agendaRoutine, flow: agendaFlow }}
					onSave={saveAgenda}
				/>
			</MemoryRouter>,
		);
		expect(service.previewLoads).toBe(0);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();

		for (const [title, expectedFlow] of [
			["Inbox daily brief", flow],
			["Weekly meeting agendas", agendaFlow],
		] as const) {
			service.preview.mockClear();
			const trigger = screen.getByRole("button", {
				name: `View flow for ${title}`,
			});
			expect(trigger).toHaveTextContent("View flow");
			expect(trigger).toHaveAttribute("aria-expanded", "false");
			expect(service.preview).not.toHaveBeenCalled();
			act(() => trigger.focus());
			await user.keyboard("{Enter}");
			expect(trigger).toHaveAttribute("aria-expanded", "true");
			const region = await screen.findByRole("region", {
				name: `${title} flow`,
			});
			expect(region).toBeVisible();
			expect(region.closest("form")).toBeNull();
			expect(region.closest('[data-slot="card"]')).toBeNull();
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			expect(screen.queryByRole("menu")).not.toBeInTheDocument();
			expect(
				await screen.findByRole("img", {
					name: "Routine flow preview",
				}),
			).toBeVisible();
			expect(service.preview.mock.lastCall?.[0]).toEqual({
				workflow: expectedFlow,
			});
			expect(service.preview.mock.lastCall?.[0].workflow).toBe(
				expectedFlow,
			);
			expect(trigger).toHaveFocus();
			await user.keyboard("{Enter}");
			expect(trigger).toHaveAttribute("aria-expanded", "false");
			await waitFor(() =>
				expect(
					screen.queryByRole("region", { name: `${title} flow` }),
				).not.toBeInTheDocument(),
			);
			expect(
				screen.queryByRole("img", { name: "Routine flow preview" }),
			).not.toBeInTheDocument();
			expect(trigger).toHaveFocus();
		}
		expect(service.previewLoads).toBe(1);
		await act(
			async () => new Promise((resolve) => setTimeout(resolve, 800)),
		);
		expect(saveInbox).not.toHaveBeenCalled();
		expect(saveAgenda).not.toHaveBeenCalled();
		expect(service.actions.run).not.toHaveBeenCalled();
	});

	it("explains an omitted flow without rendering a preview", async () => {
		const user = userEvent.setup();
		render(<RoutineFlowSection title="Inbox daily brief" />);
		const trigger = screen.getByRole("button", {
			name: "View flow for Inbox daily brief",
		});
		await user.click(trigger);
		expect(
			screen.getByRole("region", { name: "Inbox daily brief flow" }),
		).toHaveTextContent(
			"The flow is unavailable. Refresh the page to try again.",
		);
		await user.click(trigger);
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(
			screen.queryByRole("region", { name: "Inbox daily brief flow" }),
		).not.toBeInTheDocument();
		expect(service.preview).not.toHaveBeenCalled();
	});

	it("keeps a failed preview collapsible and retries when expanded again", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		service.preview.mockImplementation(() => {
			throw new Error("Preview failed");
		});
		const user = userEvent.setup();
		render(<RoutineFlowSection title="Inbox daily brief" flow={flow} />);
		const trigger = screen.getByRole("button", {
			name: "View flow for Inbox daily brief",
		});
		await user.click(trigger);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"The flow could not load. Refresh the page to try again.",
		);
		await user.click(trigger);
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(trigger).toHaveFocus();
		service.preview.mockReset();
		await user.click(trigger);
		expect(
			await screen.findByRole("img", { name: "Routine flow preview" }),
		).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});

describe("routine flow schemas", () => {
	it("keeps only graph display fields, including ports and optional positions", () => {
		expect(
			routineFlowSchema.parse({
				...flow,
				source: "private source code",
				config: { recipient: "owner@example.com" },
				run: { output: "private result" },
				nodes: flow.nodes.map((node) => ({
					...node,
					config: { code: "private source code" },
					data: { credentials: "secret" },
					lastRun: { output: "private result" },
					...(node.position && {
						position: { ...node.position, private: "hidden" },
					}),
				})),
				edges: flow.edges.map((edge) => ({
					...edge,
					id: "private-edge-id",
					label: "private condition",
					config: { expression: "private code" },
				})),
			}),
		).toEqual(flow);
	});

	it.each([
		["inbox", inboxRoutineSchema, inboxRoutine],
		["agenda", agendaRoutineSchema, agendaRoutine],
	] as const)(
		"accepts %s records with a safe flow or an older response without one",
		(_title, schema, routine) => {
			expect(schema.parse({ ...routine, flow }).flow).toEqual(flow);
			expect(schema.parse(routine).flow).toBeUndefined();
		},
	);
});
