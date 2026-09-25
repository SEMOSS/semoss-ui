import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
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

it("shows one response timestamp and copies only the selected part", async () => {
	const [entry] = presentMessages(sources);
	const { container } = render(
		<MessageTimelineEntry {...entry} agent={agent} />,
	);
	expect(screen.getAllByText(agent.name)).toHaveLength(1);
	expect(container.querySelectorAll("time")).toHaveLength(1);
	expect(container.querySelector("time")).toHaveAttribute(
		"datetime",
		sources[0].createdAt,
	);
	const copies = screen.getAllByRole("button", { name: "Copy text" });
	fireEvent.click(copies[1]);
	await waitFor(() =>
		expect(copyTextToClipboard).toHaveBeenLastCalledWith("Second answer"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Copy thinking" }));
	await waitFor(() =>
		expect(copyTextToClipboard).toHaveBeenLastCalledWith(
			"Reasoning privately",
		),
	);
	expect(screen.queryByRole("button", { name: "Copy message" })).toBeNull();
});

it("offers per-part copying from the touch menu and returns focus", async () => {
	const [entry] = presentMessages(sources);
	render(<MessageTimelineEntry {...entry} agent={agent} />);
	const more = screen.getAllByRole("button", { name: "Text actions" })[1];
	more.focus();
	fireEvent.keyDown(more, { key: "Enter" });
	const menu = await screen.findByRole("menu");
	fireEvent.click(within(menu).getByRole("menuitem", { name: "Copy text" }));
	await waitFor(() =>
		expect(copyTextToClipboard).toHaveBeenLastCalledWith("Second answer"),
	);
	await waitFor(() => expect(more).toHaveFocus());
});

it("keeps expanded reasoning and text nodes when a continuation becomes restored history", () => {
	const [entry] = presentMessages(sources);
	const { container, rerender } = render(
		<MessageTimelineEntry {...entry} agent={agent} />,
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
	rerender(<MessageTimelineEntry {...next} agent={agent} />);
	expect(screen.getByText("Second answer")).toBe(text);
	expect(screen.getByRole("button", { name: "Thinking" })).toBe(thinking);
	expect(thinking).toHaveAttribute("aria-expanded", "true");
	expect(container.querySelectorAll("time")).toHaveLength(1);
});
