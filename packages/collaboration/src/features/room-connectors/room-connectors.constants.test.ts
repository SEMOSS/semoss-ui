import { expect, it } from "vitest";
import {
	createRoomConnectorLayout,
	ROOM_TASK_PANEL_TYPE,
	TOPIC_WORK_PANEL_TYPE,
} from "./room-connectors.constants";

it("leaves the starting rail as it was for a chat with no topic", () => {
	const layout = createRoomConnectorLayout("insight-1");
	expect(layout.borders.left.panelIds).not.toContain(TOPIC_WORK_PANEL_TYPE);
	expect(layout.panels[TOPIC_WORK_PANEL_TYPE]).toBeUndefined();
});

it("adds the topic's work last in the rail, and keeps the rest and the open tab as they were", () => {
	const without = createRoomConnectorLayout("insight-1");
	const withTopic = createRoomConnectorLayout("insight-1", true, false, true);
	const ids = withTopic.borders.left.panelIds;
	expect(ids.at(-1)).toBe(TOPIC_WORK_PANEL_TYPE);
	expect(ids.slice(0, -1)).toEqual(without.borders.left.panelIds);
	expect(withTopic.borders.left.activeId).toBe(without.borders.left.activeId);
	expect(withTopic.borders.left.size).toBe(without.borders.left.size);
	expect(withTopic.panels[TOPIC_WORK_PANEL_TYPE]).toMatchObject({
		type: TOPIC_WORK_PANEL_TYPE,
		name: "Topic Work",
	});
});

it("keeps the task first and open when a chat has a work item and a topic", () => {
	const layout = createRoomConnectorLayout("insight-1", true, true, true);
	expect(layout.borders.left.panelIds[0]).toBe(ROOM_TASK_PANEL_TYPE);
	expect(layout.borders.left.activeId).toBe(ROOM_TASK_PANEL_TYPE);
	expect(layout.borders.left.panelIds).toContain(TOPIC_WORK_PANEL_TYPE);
});

it("does not add the topic panel to the new chat dock, which has no files either", () => {
	const layout = createRoomConnectorLayout("insight-1", false);
	expect(layout.borders.left.panelIds).not.toContain(TOPIC_WORK_PANEL_TYPE);
});
