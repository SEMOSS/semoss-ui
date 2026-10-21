import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { roomMessageSchema } from "@/features/messages/api/message-schemas";
import { MessageTimelineEntry } from "@/features/messages/components/message-timeline-entry";
import type { ConversationMessage } from "@/features/messages/types/message";
import { presentMessages } from "@/features/messages/utils/message-presentation";
import { threadFromMessages } from "@/features/messages/utils/thread-items";
import { TopicSourceCitations } from "./topic-source-citations";
import { formatTopicSourceCitations } from "./topic-source-citations.context";
import type { TopicSourceCitation } from "./topic-sources.api";

const citation: TopicSourceCitation = {
	sourceId: "budget",
	topicId: "alpha",
	version: 2,
	title: "Approved budget",
	excerpt: "$50,000",
	locator: "page 2",
	citationId: "budget:v2",
};

it("restores versioned evidence from saved answer ornaments and ignores malformed evidence", () => {
	const messages = threadFromMessages([
		roomMessageSchema.parse({
			messageId: "answer",
			io: "OUTPUT",
			content: "Budget is $50,000.",
			ornaments: { topicSources: [citation] },
		}),
	]);
	expect(messages[0].topicSources).toEqual([citation]);
	const invalid = threadFromMessages([
		roomMessageSchema.parse({
			messageId: "bad",
			io: "OUTPUT",
			content: "Answer",
			ornaments: { topicSources: [{ ...citation, version: "bad" }] },
		}),
	]);
	expect(invalid[0].topicSources).toBeUndefined();
});

it("formats only evidence acknowledged by the server", () => {
	expect(
		formatTopicSourceCitations(
			"See [[source:budget:v2]] and [[source:invented:v1]].",
			[citation],
		),
	).toBe(
		"See [Source 1](#topic-source-budget%3Av2) and [[source:invented:v1]].",
	);
});

it("opens the cited source version rather than the latest source", async () => {
	const onOpen = vi.fn();
	render(<TopicSourceCitations citations={[citation]} onOpen={onOpen} />);
	await userEvent.click(
		screen.getByRole("button", { name: "1. Approved budget" }),
	);
	expect(onOpen).toHaveBeenCalledWith(citation);
});

it("retains citations from a later assistant message when responses share a shell", () => {
	const messages: ConversationMessage[] = [
		{
			id: "first",
			role: "assistant",
			parts: [{ type: "text", text: "I checked the budget." }],
		},
		{
			id: "last",
			role: "assistant",
			parts: [
				{ type: "text", text: "It is $50,000. [[source:budget:v2]]" },
			],
			topicSources: [citation],
		},
	];
	const [entry] = presentMessages(messages);
	render(
		<MessageTimelineEntry
			{...entry}
			agent={{
				name: "Assistant",
				description: "",
				system_prompt: "",
				mcp: [],
				skills: [],
				prompts: [],
			}}
		/>,
	);
	expect(
		screen.getByRole("region", { name: "Sources cited in this answer" }),
	).toBeVisible();
	expect(
		screen.getByRole("button", {
			name: /Source 1: Approved budget, version 2/,
		}),
	).toBeVisible();
});
