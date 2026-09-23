import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import type { ConversationMessage } from "@/features/messages/types/message";
import { RoomThread } from "./room-thread";

const agent: AgentConfiguration = {
	name: "Research agent",
	description: "Research",
	system_prompt: "Research carefully.",
	mcp: [],
	skills: [],
	prompts: [],
};

function message(id: string, text: string): ConversationMessage {
	return {
		id,
		role: "user",
		parts: [{ type: "text", text }],
	};
}

describe("RoomThread", () => {
	it("follows live updates only while the reader remains near the bottom", () => {
		const scrollIntoView = vi.fn();
		const original = Element.prototype.scrollIntoView;
		Object.defineProperty(Element.prototype, "scrollIntoView", {
			configurable: true,
			value: scrollIntoView,
		});
		const bottomRef = createRef<HTMLDivElement>();
		const { container, rerender } = render(
			<RoomThread
				agent={agent}
				thread={[message("message-1", "First")]}
				isLoadingHistory={false}
				bottomRef={bottomRef}
			/>,
		);
		expect(scrollIntoView).toHaveBeenCalled();

		const scroller = container.querySelector(".overflow-y-auto");
		if (!(scroller instanceof HTMLDivElement)) {
			throw new Error("Expected the thread scroller.");
		}
		Object.defineProperties(scroller, {
			scrollHeight: { configurable: true, value: 1_000 },
			clientHeight: { configurable: true, value: 400 },
			scrollTop: { configurable: true, value: 100 },
		});
		fireEvent.scroll(scroller);
		expect(
			screen.getByRole("button", { name: "Latest activity" }),
		).toBeTruthy();

		scrollIntoView.mockClear();
		rerender(
			<RoomThread
				agent={agent}
				thread={[
					message("message-1", "First"),
					message("message-2", "Second"),
				]}
				isLoadingHistory={false}
				bottomRef={bottomRef}
			/>,
		);
		expect(scrollIntoView).not.toHaveBeenCalled();

		fireEvent.click(
			screen.getByRole("button", { name: "Latest activity" }),
		);
		expect(scrollIntoView).toHaveBeenCalledWith({
			behavior: "smooth",
			block: "end",
		});

		if (original) {
			Object.defineProperty(Element.prototype, "scrollIntoView", {
				configurable: true,
				value: original,
			});
		} else {
			Reflect.deleteProperty(Element.prototype, "scrollIntoView");
		}
	});
});
