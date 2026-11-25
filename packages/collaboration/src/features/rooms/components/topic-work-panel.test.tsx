import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { TOPIC_WORK_PANEL_TYPE } from "@/features/room-connectors/room-connectors.constants";
import type { RoomTopic } from "../api/room-topics";
import { RoomTopicsContext } from "./room-topics.context";
import { ROOM_TOPIC_WORK_PANEL_COMPONENTS } from "./topic-work-panel";

// one actions object, since the read reruns when it changes
const insight = vi.hoisted(() => ({
	actions: {
		run: vi.fn(async (_statement: string) => ({
			pixelReturn: [
				{
					output: {
						selfId: "me",
						workItems: [
							{
								id: "a",
								title: "Validate the rollback plan",
								state: "active",
								status: "active",
								mine: true,
								openSteps: [
									{
										id: "s1",
										text: "Attend the call",
										status: "open",
									},
								],
							},
						],
					},
					operationType: ["OPERATION"],
				},
				{ output: { workItems: [] }, operationType: ["OPERATION"] },
			],
		})),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const Panel = ROOM_TOPIC_WORK_PANEL_COMPONENTS[TOPIC_WORK_PANEL_TYPE].content;

const topic = (
	topicId: string,
	state: RoomTopic["state"] = "linked",
	name = `Topic ${topicId}`,
): RoomTopic => ({ topicId, name, state });

function renderPanel(topics: RoomTopic[] | null) {
	return render(
		<MemoryRouter>
			<RoomTopicsContext.Provider value={{ topics, change: vi.fn() }}>
				<Panel id={TOPIC_WORK_PANEL_TYPE} />
			</RoomTopicsContext.Provider>
		</MemoryRouter>,
	);
}

it("shows the work under the topic the chat is linked to, with the topic's name", async () => {
	renderPanel([topic("t1", "linked", "Northwind Migration")]);
	const panel = screen.getByRole("region", { name: "Topic Work" });
	expect(panel).toHaveTextContent("Northwind Migration");
	expect(
		await screen.findByRole("region", { name: "Yours to Do" }),
	).toHaveTextContent("Validate the rollback plan");
	expect(insight.actions.run.mock.calls[0][0]).toContain("t1");
});

it("lists the work of every linked topic, each under its own name, and ignores topics that are only suggested or dismissed", async () => {
	renderPanel([
		topic("t1", "suggested", "Suggested one"),
		topic("t2", "dismissed", "Dismissed one"),
		topic("t3", "linked", "Northwind Migration"),
		topic("t4", "linked", "Quarterly Release"),
	]);
	const northwind = await screen.findByRole("region", {
		name: "Northwind Migration",
	});
	const quarterly = await screen.findByRole("region", {
		name: "Quarterly Release",
	});
	expect(
		await within(northwind).findByRole("region", { name: "Yours to Do" }),
	).toBeInTheDocument();
	expect(
		await within(quarterly).findByRole("region", { name: "Yours to Do" }),
	).toBeInTheDocument();
	const text = screen.getByRole("region", { name: "Topic Work" }).textContent;
	expect(text?.indexOf("Northwind Migration")).toBeLessThan(
		text?.indexOf("Quarterly Release") ?? -1,
	);
	const statements = insight.actions.run.mock.calls.map(([sql]) => sql);
	expect(statements).toHaveLength(2);
	expect(statements.some((sql) => sql.includes("t3"))).toBe(true);
	expect(statements.some((sql) => sql.includes("t4"))).toBe(true);
	expect(statements.some((sql) => sql.includes("t1"))).toBe(false);
	expect(statements.some((sql) => sql.includes("t2"))).toBe(false);
	expect(screen.queryByText("Suggested one")).toBeNull();
	expect(screen.queryByText("Dismissed one")).toBeNull();
});

it("names each topic with a level 2 heading above its level 3 group headings", async () => {
	renderPanel([
		topic("t3", "linked", "Northwind Migration"),
		topic("t4", "linked", "Quarterly Release"),
	]);
	await screen.findAllByRole("region", { name: "Yours to Do" });
	const outline = screen
		.getAllByRole("heading")
		.map((heading) => [
			Number(heading.tagName.slice(1)),
			heading.textContent,
		]);
	expect(outline).toEqual([
		[2, "Northwind Migration"],
		[3, "Yours to Do"],
		[2, "Quarterly Release"],
		[3, "Yours to Do"],
	]);
});

it("reads and shows a single linked topic exactly once, as before", async () => {
	renderPanel([topic("t9", "linked", "Only topic")]);
	await screen.findByRole("region", { name: "Yours to Do" });
	expect(insight.actions.run).toHaveBeenCalledTimes(1);
	expect(screen.getAllByRole("region", { name: "Yours to Do" })).toHaveLength(
		1,
	);
});

it("says the chat has no topic when none is linked, and reads no work", () => {
	renderPanel([topic("t1", "suggested")]);
	expect(screen.getByText("This chat has no topic.")).toBeInTheDocument();
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("says the same when the chat's topics could not be read", () => {
	renderPanel(null);
	expect(screen.getByText("This chat has no topic.")).toBeInTheDocument();
});
