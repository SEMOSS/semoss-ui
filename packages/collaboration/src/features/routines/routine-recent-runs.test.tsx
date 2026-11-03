import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import { ROUTINE_RUNS_CHANGED } from "./api/list-recent-routine-runs";
import { RoutineRecentRuns } from "./routine-recent-runs";

// one actions object, so the reader's effect does not rerun on every render
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const toast = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	toast,
}));

const ago = (minutes: number) =>
	new Date(Date.now() - minutes * 60_000).toISOString();

const routines = [
	{
		routineId: "custom-1",
		name: "Vendor invoice check",
		runs: [
			{
				runId: "vendor-2",
				status: "running",
				startedAt: ago(4),
				roomId: "vendor-room",
			},
			{ runId: "vendor-1", status: "completed", startedAt: ago(60 * 72) },
		],
	},
	{
		routineId: "inbox-daily-brief",
		name: null,
		runs: [
			{ runId: "inbox-2", status: "completed", startedAt: ago(180) },
			{ runId: "inbox-1", status: "failed", startedAt: ago(60 * 27) },
		],
	},
	{
		routineId: "weekly-meeting-agendas",
		name: null,
		runs: [{ runId: "agendas-1", status: "running", startedAt: ago(2) }],
	},
];

function answer(output: unknown) {
	return { pixelReturn: [{ output, operationType: ["OPERATION"] }] };
}

function renderRuns() {
	const onNavigate = vi.fn();
	const router = createMemoryRouter(
		[{ path: "*", element: <RoutineRecentRuns onNavigate={onNavigate} /> }],
		{ initialEntries: ["/"] },
	);
	render(<RouterProvider router={router} />);
	return { onNavigate, router, user: userEvent.setup() };
}

beforeEach(() => {
	vi.clearAllMocks();
	insight.actions.run.mockImplementation(async (statement: string) =>
		statement.startsWith("WorkOpenRoutineRoom")
			? answer({ roomId: "inbox-run-chat" })
			: answer({ routines }),
	);
});
afterEach(cleanup);

describe("RoutineRecentRuns", () => {
	it("lists each routine with its latest runs, named by the client for system routines", async () => {
		renderRuns();
		const list = await screen.findByRole("list", {
			name: "Recent routines",
		});
		expect(insight.actions.run).toHaveBeenCalledWith(
			"WorkListRecentRoutineRuns();",
		);
		expect(
			within(list).getByRole("link", { name: "Vendor invoice check" }),
		).toHaveAttribute("href", "/routines?routine=custom-1");
		expect(
			within(list).getByRole("link", { name: "Inbox daily brief agent" }),
		).toHaveAttribute("href", "/routines?routine=inbox-daily-brief");
		const inboxRuns = within(list).getByRole("list", {
			name: "Inbox daily brief agent runs",
		});
		const [latest, older] = within(inboxRuns).getAllByRole("listitem");
		expect(
			within(latest).getByRole("button", {
				name: /^Open the chat for Inbox daily brief agent from /,
			}),
		).toBeVisible();
		expect(older).toHaveTextContent("Failed");
	});

	it("opens a finished run's chat and lists the new room in Chats", async () => {
		const { onNavigate, router, user } = renderRuns();
		const changed = vi.fn();
		window.addEventListener(ROOM_HISTORY_CHANGED, changed);
		await user.click(
			await screen.findByRole("button", {
				name: /^Open the chat for Inbox daily brief agent from /,
			}),
		);
		expect(insight.actions.run).toHaveBeenCalledWith(
			'WorkOpenRoutineRoom(routineId=["inbox-daily-brief"], runId=["inbox-2"]);',
		);
		expect(router.state.location.pathname).toBe(
			"/thread/room%3Ainbox-run-chat",
		);
		expect(onNavigate).toHaveBeenCalledOnce();
		expect(changed).toHaveBeenCalledOnce();
		window.removeEventListener(ROOM_HISTORY_CHANGED, changed);
	});

	it("says why a run's chat did not open and stays put", async () => {
		insight.actions.run.mockImplementation(async (statement: string) => {
			if (statement.startsWith("WorkOpenRoutineRoom"))
				throw new Error("This run has no output to discuss");
			return answer({ routines });
		});
		const { onNavigate, router, user } = renderRuns();
		await user.click(
			await screen.findByRole("button", {
				name: /^Open the chat for Vendor invoice check from /,
			}),
		);
		expect(toast.error).toHaveBeenCalledWith(
			"This run has no output to discuss",
		);
		expect(router.state.location.pathname).toBe("/");
		expect(onNavigate).not.toHaveBeenCalled();
	});

	it("opens a running run's room when it has one, else its routine, as it does a failed run", async () => {
		renderRuns();
		expect(
			await screen.findByRole("link", {
				name: /^Watch Vendor invoice check, running since /,
			}),
		).toHaveAttribute("href", "/thread/room%3Avendor-room");
		expect(
			screen.getByRole("link", {
				name: /^Open Weekly meeting agendas agent, running since /,
			}),
		).toHaveAttribute("href", "/routines?routine=weekly-meeting-agendas");
		expect(
			screen.getByRole("link", {
				name: /^Open Inbox daily brief agent, failed /,
			}),
		).toHaveAttribute("href", "/routines?routine=inbox-daily-brief");
	});

	it("offers the run menu on finished runs only", async () => {
		renderRuns();
		await screen.findByRole("list", { name: "Recent routines" });
		expect(
			screen.getAllByRole("button", { name: /^More actions for the / }),
		).toHaveLength(3);
		for (const name of [
			"Vendor invoice check",
			"Weekly meeting agendas agent",
		])
			expect(
				screen.queryByRole("button", {
					name: new RegExp(
						`^More actions for the ${name} run from Today`,
					),
				}),
			).toBeNull();
	});

	it("reads again when a routine is run, renamed or removed on this page", async () => {
		renderRuns();
		await screen.findByRole("link", { name: "Vendor invoice check" });
		insight.actions.run.mockResolvedValue(
			answer({ routines: routines.slice(1) }),
		);
		act(() => window.dispatchEvent(new Event(ROUTINE_RUNS_CHANGED)));
		await vi.waitFor(() =>
			expect(
				screen.queryByRole("link", { name: "Vendor invoice check" }),
			).toBeNull(),
		);
	});

	it("shows nothing until a routine has run", async () => {
		insight.actions.run.mockResolvedValue(answer({ routines: [] }));
		const { container } = render(
			<RouterProvider
				router={createMemoryRouter([
					{ path: "*", element: <RoutineRecentRuns /> },
				])}
			/>,
		);
		await vi.waitFor(() =>
			expect(insight.actions.run).toHaveBeenCalledOnce(),
		);
		// let the read settle before checking that it added nothing
		await act(() => Promise.resolve());
		expect(container).toBeEmptyDOMElement();
	});

	it("offers a retry when the first read fails, then shows the runs", async () => {
		insight.actions.run.mockRejectedValueOnce(new Error("Unknown reactor"));
		const { user } = renderRuns();
		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent("Recent runs did not load.");
		await user.click(within(alert).getByRole("button", { name: "Retry" }));
		expect(
			await screen.findByRole("list", { name: "Recent routines" }),
		).toBeVisible();
		expect(screen.queryByRole("alert")).toBeNull();
	});
});
