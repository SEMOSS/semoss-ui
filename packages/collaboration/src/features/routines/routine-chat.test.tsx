import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import { RoutineChatButton } from "./routine-chat-button";
import { AGENDA_RESULT_COPY, INBOX_RESULT_COPY } from "./routine-copy";
import { RoutineResult } from "./routine-result";
import type { RoutineStatus } from "./routine-schema";

const service = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	open: vi.fn(),
	navigate: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: service.actions }),
}));
vi.mock("./api/open-routine-room", () => ({
	openRoutineRoom: service.open,
}));
vi.mock("react-router", async (original) => ({
	...(await original<typeof import("react-router")>()),
	useNavigate: () => service.navigate,
}));

const startedAt = "2026-10-15T12:00:00.123Z";
const completedRun = {
	status: "completed",
	startedAt,
	finishedAt: "2026-10-15T12:01:00Z",
	roomId: "original/session",
	summary: "Reply to Dana before Thursday.",
	error: null,
} satisfies NonNullable<RoutineStatus["lastRun"]>;
const historyChanged = vi.fn();

/** Keep a room-opening request pending until the test completes it. */
function pendingRoom(): {
	promise: Promise<string>;
	resolve: (roomId: string) => void;
} {
	let resolve: (roomId: string) => void = () => undefined;
	const promise = new Promise<string>((complete) => {
		resolve = complete;
	});
	return { promise, resolve };
}

beforeEach(() => {
	vi.clearAllMocks();
	service.open.mockReset();
	service.open.mockResolvedValue("routine-chat");
	window.addEventListener(ROOM_HISTORY_CHANGED, historyChanged);
});
afterEach(() => {
	cleanup();
	window.removeEventListener(ROOM_HISTORY_CHANGED, historyChanged);
});

describe("RoutineChatButton", () => {
	it.each(["inbox-daily-brief", "weekly-meeting-agendas"] as const)(
		"opens %s once while pending, then navigates and refreshes history",
		async (routineId) => {
			const user = userEvent.setup();
			const pending = pendingRoom();
			service.open.mockReturnValueOnce(pending.promise);
			render(
				<RoutineChatButton
					routineId={routineId}
					startedAt={startedAt}
				/>,
			);
			await user.dblClick(
				screen.getByRole("button", { name: "Ask Assistant" }),
			);
			expect(
				screen.getByRole("button", { name: "Opening chat…" }),
			).toBeDisabled();
			expect(screen.getByRole("status")).toHaveTextContent(
				"Opening chat…",
			);
			expect(service.open).toHaveBeenCalledExactlyOnceWith(
				service.actions,
				routineId,
				startedAt,
				undefined,
			);
			expect(service.navigate).not.toHaveBeenCalled();
			expect(historyChanged).not.toHaveBeenCalled();
			await act(async () => pending.resolve("chat/with spaces"));
			expect(service.navigate).toHaveBeenCalledExactlyOnceWith(
				"/thread/room%3Achat%2Fwith%20spaces",
			);
			expect(historyChanged).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					detail: { roomId: "chat/with spaces" },
				}),
			);
		},
	);

	it("shows an open failure and retries the same saved output", async () => {
		const user = userEvent.setup();
		service.open.mockRejectedValueOnce(new Error("Connection interrupted"));
		render(
			<RoutineChatButton
				routineId="inbox-daily-brief"
				startedAt={startedAt}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Ask Assistant" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Connection interrupted",
		);
		expect(service.navigate).not.toHaveBeenCalled();
		expect(historyChanged).not.toHaveBeenCalled();
		expect(
			screen.getByRole("button", { name: "Ask Assistant" }),
		).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Ask Assistant" }));
		await waitFor(() => expect(service.navigate).toHaveBeenCalledOnce());
		expect(service.open).toHaveBeenNthCalledWith(
			2,
			service.actions,
			"inbox-daily-brief",
			startedAt,
			undefined,
		);
		expect(historyChanged).toHaveBeenCalledOnce();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("does not navigate away after its view unmounts", async () => {
		const user = userEvent.setup();
		const pending = pendingRoom();
		service.open.mockReturnValueOnce(pending.promise);
		const view = render(
			<RoutineChatButton
				routineId="inbox-daily-brief"
				startedAt={startedAt}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Ask Assistant" }));
		view.unmount();
		await act(async () => pending.resolve("routine-chat"));
		expect(service.navigate).not.toHaveBeenCalled();
		expect(historyChanged).toHaveBeenCalledOnce();
	});
});

describe("RoutineResult chat availability", () => {
	it.each([
		["inbox-daily-brief", INBOX_RESULT_COPY],
		["weekly-meeting-agendas", AGENDA_RESULT_COPY],
	] as const)(
		"opens the displayed %s output with only Ask Assistant",
		async (id, copy) => {
			const user = userEvent.setup();
			render(
				<MemoryRouter>
					<RoutineResult
						copy={copy}
						routine={{
							id,
							enabled: true,
							timezone: "UTC",
							lastRun: completedRun,
						}}
					/>
				</MemoryRouter>,
			);
			expect(
				screen.queryByRole("link", { name: "Open session" }),
			).not.toBeInTheDocument();
			expect(screen.getByText(completedRun.summary)).toBeVisible();
			await user.click(
				screen.getByRole("button", { name: "Ask Assistant" }),
			);
			expect(service.open).toHaveBeenCalledExactlyOnceWith(
				service.actions,
				id,
				startedAt,
				undefined,
			);
		},
	);

	it("allows chat from a completed output without an original session or active schedule", () => {
		render(
			<MemoryRouter>
				<RoutineResult
					copy={INBOX_RESULT_COPY}
					routine={{
						id: "inbox-daily-brief",
						enabled: false,
						timezone: "UTC",
						lastRun: {
							...completedRun,
							roomId: null,
							error: "The output was saved but its email could not be sent.",
						},
					}}
				/>
			</MemoryRouter>,
		);
		expect(
			screen.getByRole("button", { name: "Ask Assistant" }),
		).toBeEnabled();
		expect(screen.queryByRole("link", { name: "Open session" })).toBeNull();
	});

	it.each([
		["no run", null],
		["running", { ...completedRun, status: "running" }],
		["failed", { ...completedRun, status: "failed" }],
		["missing summary", { ...completedRun, summary: null }],
		["empty summary", { ...completedRun, summary: "" }],
		["blank summary", { ...completedRun, summary: " \n\t " }],
	] satisfies [string, RoutineStatus["lastRun"]][])(
		"offers no chat when there is %s",
		(_label, lastRun) => {
			render(
				<MemoryRouter>
					<RoutineResult
						copy={INBOX_RESULT_COPY}
						routine={{
							id: "inbox-daily-brief",
							enabled: true,
							timezone: "UTC",
							lastRun,
						}}
					/>
				</MemoryRouter>,
			);
			expect(
				screen.queryByRole("button", { name: "Ask Assistant" }),
			).toBeNull();
			expect(
				screen.queryByRole("link", { name: "Open session" }),
			).not.toBeInTheDocument();
			expect(service.open).not.toHaveBeenCalled();
		},
	);
});
