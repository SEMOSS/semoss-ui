import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { copyTextToClipboard } from "@semoss/utility";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import type { ConversationMessage } from "../types/message";
import { presentMessages } from "../utils/message-presentation";
import { MessageTimelineEntry } from "./message-timeline-entry";

vi.mock("@semoss/utility", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/utility")>()),
	copyTextToClipboard: vi.fn().mockResolvedValue(undefined),
}));

const agent: AgentConfiguration = {
	name: "Research agent",
	description: "",
	system_prompt: "",
	mcp: [],
	skills: [],
	prompts: [],
};
const sources: ConversationMessage[] = [
	{
		id: "first",
		role: "assistant",
		createdAt: "2026-09-24T16:00:00Z",
		parts: [
			{ type: "text", text: "First answer" },
			{ type: "thinking", text: "Reasoning privately" },
		],
	},
	{
		id: "second",
		role: "assistant",
		createdAt: "2026-09-24T16:01:00Z",
		parts: [
			{ type: "text", text: "Second answer", renderKey: "stable-answer" },
		],
	},
];

it.each(["chat", "bubbles"] as const)(
	"keeps one copy action after all visible answer parts in %s layout",
	async (layout) => {
		const [entry] = presentMessages(sources);
		const { container } = render(
			<MessageTimelineEntry {...entry} agent={agent} layout={layout} />,
		);
		expect(screen.getAllByText(agent.name)).toHaveLength(1);
		expect(container.querySelectorAll("time")).toHaveLength(
			layout === "bubbles" ? 0 : 1,
		);
		if (layout === "chat")
			expect(container.querySelector("time")).toHaveAttribute(
				"datetime",
				sources[0].createdAt,
			);
		expect(
			screen.queryByRole("button", { name: "Response actions" }),
		).toBeNull();
		const copy = screen.getByRole("button", { name: "Copy response" });
		expect(copy).toBeVisible();
		expect(screen.getByRole("article")).toContainElement(copy);
		expect(screen.getByRole("article")).not.toHaveAttribute("tabindex");
		expect(
			screen.getByText("Second answer").compareDocumentPosition(copy) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		fireEvent.pointerEnter(screen.getByRole("article"), {
			pointerType: "mouse",
		});
		expect(screen.queryByRole("dialog")).toBeNull();
		fireEvent.click(copy);
		await waitFor(() =>
			expect(copyTextToClipboard).toHaveBeenLastCalledWith(
				"First answer\n\nSecond answer",
			),
		);
		expect(
			screen.queryByRole("button", { name: "Copy thinking" }),
		).toBeNull();
		expect(screen.queryByRole("button", { name: "Copy text" })).toBeNull();
	},
);

it.each(["flat", "bubbles"] as const)(
	"labels %s prompts without a copy action and keeps the direct-room layout",
	(layout) => {
		const message: ConversationMessage = {
			id: "prompt",
			role: "user",
			createdAt: sources[0].createdAt,
			parts: [{ type: "text", text: "My request" }],
		};
		const { container, rerender } = render(
			<MessageTimelineEntry
				message={message}
				agent={agent}
				layout={layout}
			/>,
		);
		if (layout === "bubbles") expect(screen.queryByText("You")).toBeNull();
		else expect(screen.getByText("You")).toBeVisible();
		expect(
			screen.getByRole("article", { name: "Your message" }),
		).toBeVisible();
		expect(container.querySelectorAll("time")).toHaveLength(
			layout === "bubbles" ? 0 : 1,
		);
		expect(screen.queryByRole("button", { name: /copy/i })).toBeNull();
		expect(screen.getByRole("article")).not.toHaveAttribute("tabindex");
		expect(screen.getByRole("article")).not.toHaveClass("items-end");
		rerender(<MessageTimelineEntry message={message} agent={agent} />);
		expect(screen.getByRole("article")).toHaveClass("items-end");
		expect(container.querySelectorAll("time")).toHaveLength(1);
	},
);

it.each(["chat", "bubbles"] as const)(
	"keeps expanded reasoning and text nodes when %s history is restored",
	(layout) => {
		const [entry] = presentMessages(sources);
		const { container, rerender } = render(
			<MessageTimelineEntry {...entry} agent={agent} layout={layout} />,
		);
		const thinking = screen.getByRole("button", { name: "Thinking" });
		fireEvent.click(thinking);
		const text = screen.getByText("Second answer");
		const restored = sources.map((source) => ({
			...source,
			parts: source.parts.map((part) => ({ ...part })),
		}));
		const [next] = presentMessages([
			...restored,
			{
				id: "third",
				role: "assistant",
				parts: [{ type: "text", text: "More content" }],
			},
		]);
		rerender(
			<MessageTimelineEntry {...next} agent={agent} layout={layout} />,
		);
		expect(screen.getByText("Second answer")).toBe(text);
		expect(screen.getByRole("button", { name: "Thinking" })).toBe(thinking);
		expect(thinking).toHaveAttribute("aria-expanded", "true");
		expect(container.querySelectorAll("time")).toHaveLength(
			layout === "bubbles" ? 0 : 1,
		);
	},
);

it.each(["flat", "bubbles"] as const)(
	"uses a decorative Work identity in %s layout and preserves response actions",
	(layout) => {
		const [entry] = presentMessages(sources);
		const identity = <span aria-hidden="true">Work identity</span>;
		const { rerender } = render(
			<MessageTimelineEntry
				{...entry}
				agent={agent}
				layout={layout}
				leadingVisual={identity}
			/>,
		);
		expect(screen.getByText("Work identity")).toHaveAttribute(
			"aria-hidden",
			"true",
		);
		expect(
			screen.getByRole("article", { name: `${agent.name}'s message` }),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Copy response" }),
		).toBeVisible();
		rerender(
			<MessageTimelineEntry
				{...entry}
				agent={agent}
				leadingVisual={identity}
			/>,
		);
		expect(screen.queryByText("Work identity")).toBeNull();
		expect(
			screen.getByRole("button", { name: "Copy response" }),
		).toBeVisible();
	},
);
