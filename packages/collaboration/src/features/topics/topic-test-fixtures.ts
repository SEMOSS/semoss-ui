import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type {
	Topic,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";

/** A persisted topic shape for topic feature tests. */
export const savedTopic: Topic = {
	...createInitialCollaborationState().topics[0],
	id: "topic-server",
	name: "India trip",
	short: "India trip",
	isSample: false,
	goals: [],
	people: [],
};

/** A directly associated task intentionally has no source thread. */
export const directItem: WorkItem = {
	...createInitialCollaborationState().items[0],
	id: "task-direct",
	threadId: "",
	channel: "task",
	topicIds: [],
	linkTopicId: savedTopic.id,
	roomId: "room-task",
	assignee: "person-owner",
	isSample: false,
};
