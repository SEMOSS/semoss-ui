import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomTopic } from "../api/room-topics";
import { useRoomTopics } from "../use-room-topics";
import { RoomTopics } from "./room-topics";
import { RoomTopicsContext } from "./room-topics.context";
import { OldRoomTopics } from "./room-topics.old";

const insight = vi.hoisted(() => ({
	/** What BrainListRoomTopics answers; a string makes it fail. */
	listed: [] as unknown,
	/** What BrainLinkRoomTopic answers. */
	linked: [] as unknown,
	actions: {
		run: vi.fn(async (statement: string) => {
			const answer = statement.startsWith("BrainLinkRoomTopic")
				? insight.linked
				: insight.listed;
			if (typeof answer === "string")
				return {
					pixelReturn: [{ output: answer, operationType: ["ERROR"] }],
				};
			return {
				pixelReturn: [
					{
						output: { roomId: "room-1", topics: answer },
						operationType: ["OPERATION"],
					},
				],
			};
		}),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

const pageTopic = (id: string, name: string, status = "active") => ({
	id,
	name,
	short: name.split(" ")[0],
	status,
});
vi.mock("@/features/collaboration/state/collaboration-session.context", () => ({
	useOptionalCollaborationSession: () => ({
		state: {
			topics: [
				pageTopic("t-linked", "Northwind Migration"),
				pageTopic("t-suggested", "Quarterly Release"),
				pageTopic("t-dormant", "Hiring Plan", "dormant"),
				pageTopic("t-archived", "Old Thing", "archived"),
				pageTopic("t-dismissed", "Dismissed Topic"),
			],
		},
	}),
}));

const roomTopic = (
	topicId: string,
	state: RoomTopic["state"],
	origin?: string,
): RoomTopic => ({ topicId, name: topicId, state, origin });

const CHAT_TOPICS = [
	roomTopic("t-linked", "linked"),
	roomTopic("t-suggested", "suggested", "brain"),
	roomTopic("t-dismissed", "dismissed"),
	roomTopic("t-unknown-to-the-page", "linked"),
];

/** The component as it was, reading its own topics. */
function Old({ isRunning }: { isRunning: boolean }) {
	return <OldRoomTopics roomId="room-1" isRunning={isRunning} />;
}

/** The component now: the topics are read by the hook RoomView calls, and shared through context. */
function Now({ isRunning }: { isRunning: boolean }) {
	const topics = useRoomTopics("room-1", isRunning);
	return (
		<RoomTopicsContext.Provider value={topics}>
			<RoomTopics />
		</RoomTopicsContext.Provider>
	);
}

beforeEach(() => {
	insight.listed = CHAT_TOPICS;
	insight.linked = CHAT_TOPICS;
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	vi.useRealTimers();
});

describe.each([
	["the component as it was", Old],
	["the component now", Now],
])("%s", (_name, Topics) => {
	const renderTopics = (isRunning = false) =>
		render(
			<MemoryRouter>
				<Topics isRunning={isRunning} />
			</MemoryRouter>,
		);

	it("shows linked and suggested topics the page knows, and not dismissed ones or ones the page has never heard of", async () => {
		renderTopics();
		const chips = await screen.findByRole("group", { name: "Chat topics" });
		expect(chips).toHaveTextContent("Northwind");
		expect(chips).toHaveTextContent("Quarterly?");
		expect(chips).not.toHaveTextContent("Dismissed");
		expect(chips.querySelectorAll("a")).toHaveLength(2);
		// the plus loses its "Topic" word once there is a chip
		expect(
			screen.getByRole("button", { name: "Add a topic to this chat" }),
		).not.toHaveTextContent("Topic");
	});

	it("removes a linked topic, dismisses a suggested one and accepts it, each by the right call", async () => {
		const user = userEvent.setup();
		renderTopics();
		await screen.findByRole("group", { name: "Chat topics" });
		insight.actions.run.mockClear();

		insight.linked = [roomTopic("t-suggested", "suggested")];
		await user.click(
			screen.getByRole("button", {
				name: "Remove Northwind from this chat",
			}),
		);
		expect(insight.actions.run).toHaveBeenCalledTimes(1);
		const [removal] = insight.actions.run.mock.calls[0];
		expect(removal).toContain("t-linked");
		expect(removal).toContain("remove");
		expect(removal).toMatch(/true/);
		// the chips show what the call answered
		const chips = await screen.findByRole("group", { name: "Chat topics" });
		await vi.waitFor(() =>
			expect(chips).not.toHaveTextContent("Northwind"),
		);
		expect(chips).toHaveTextContent("Quarterly?");

		insight.actions.run.mockClear();
		insight.linked = [roomTopic("t-suggested", "linked")];
		await user.click(
			screen.getByRole("button", { name: "Accept Quarterly" }),
		);
		const [acceptance] = insight.actions.run.mock.calls[0];
		expect(acceptance).toContain("t-suggested");
		expect(acceptance).toMatch(/false/);
		await vi.waitFor(() => expect(chips).toHaveTextContent("Quarterly"));
		expect(chips).not.toHaveTextContent("Quarterly?");
		expect(
			screen.queryByRole("button", { name: "Accept Quarterly" }),
		).toBeNull();

		insight.actions.run.mockClear();
		insight.linked = [];
		await user.click(
			screen.getByRole("button", {
				name: "Remove Quarterly from this chat",
			}),
		);
		expect(insight.actions.run.mock.calls[0][0]).toContain("t-suggested");
	});

	it("offers the active and dormant topics not already on the chat, links the one picked and closes the picker", async () => {
		const user = userEvent.setup();
		renderTopics();
		await screen.findByRole("group", { name: "Chat topics" });
		await user.click(
			screen.getByRole("button", { name: "Add a topic to this chat" }),
		);
		const picker = await screen.findByLabelText("Add a topic");
		const offered = within(picker)
			.getAllByRole("button")
			.map((button) => button.textContent);
		// not the linked, suggested or archived ones; the dismissed one may be picked again
		expect(offered).toEqual(["Hiring Plan", "Dismissed Topic"]);

		insight.actions.run.mockClear();
		insight.linked = [...CHAT_TOPICS, roomTopic("t-dormant", "linked")];
		await user.click(
			within(picker).getByRole("button", { name: "Hiring Plan" }),
		);
		expect(insight.actions.run.mock.calls[0][0]).toContain("t-dormant");
		expect(screen.queryByLabelText("Add a topic")).toBeNull();
	});

	it("says there are no other topics when every topic is on the chat", async () => {
		const user = userEvent.setup();
		insight.listed = [
			roomTopic("t-linked", "linked"),
			roomTopic("t-suggested", "linked"),
			roomTopic("t-dormant", "linked"),
			roomTopic("t-dismissed", "linked"),
		];
		renderTopics();
		await screen.findByRole("group", { name: "Chat topics" });
		await user.click(
			screen.getByRole("button", { name: "Add a topic to this chat" }),
		);
		expect(await screen.findByText("No other topics")).toBeVisible();
	});

	it("shows nothing for a chat whose topics cannot be read", async () => {
		insight.listed = "Not your chat";
		const { container } = renderTopics();
		await vi.waitFor(() => expect(insight.actions.run).toHaveBeenCalled());
		await act(async () => undefined);
		expect(container).toBeEmptyDOMElement();
	});

	it("reads once on opening, and again a few seconds after a turn ends", async () => {
		vi.useFakeTimers();
		const view = renderTopics(true);
		await act(async () => undefined);
		expect(insight.actions.run).toHaveBeenCalledTimes(1);

		view.rerender(
			<MemoryRouter>
				<Topics isRunning={false} />
			</MemoryRouter>,
		);
		await act(async () => undefined);
		expect(insight.actions.run).toHaveBeenCalledTimes(1);
		for (const [elapsed, reads] of [
			[5000, 1],
			[1000, 2],
			[9000, 3],
			[15000, 4],
		] as const) {
			await act(async () => {
				await vi.advanceTimersByTimeAsync(elapsed);
			});
			expect(insight.actions.run).toHaveBeenCalledTimes(reads);
		}
	});

	it("does not read again while a turn is still running", async () => {
		vi.useFakeTimers();
		renderTopics(true);
		await act(async () => undefined);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(60000);
		});
		expect(insight.actions.run).toHaveBeenCalledTimes(1);
	});
});
