import { fireEvent, render, screen } from "@testing-library/react";
import { animationClock } from "../test-utils/animation-clock";
import { MessageThinkingPart } from "./message-thinking-part";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("shows live thinking, collapses after the last reveal, and can be reopened", () => {
	const clock = animationClock();
	const { rerender } = render(
		<MessageThinkingPart text="First thought" isStreaming />,
	);
	const trigger = screen.getByRole("button", { name: "Thinking" });
	expect(trigger).toHaveAttribute("aria-expanded", "true");
	rerender(<MessageThinkingPart text="First thought and its conclusion." />);
	clock.advance(200);
	expect(trigger).toHaveAttribute("aria-expanded", "false");
	fireEvent.click(trigger);
	expect(
		screen.getByRole("region", { name: "Thinking details" }),
	).toHaveTextContent("First thought and its conclusion.");
	fireEvent.focus(screen.getByRole("region", { name: "Thinking details" }));
	fireEvent.blur(screen.getByRole("region", { name: "Thinking details" }), {
		relatedTarget: trigger,
	});
	expect(trigger).toHaveAttribute("aria-expanded", "true");
});

it("keeps focused thinking open until focus leaves after completion", () => {
	animationClock();
	const { rerender } = render(
		<MessageThinkingPart
			text="Thinking with a [link](https://example.com)"
			isStreaming
		/>,
	);
	const link = screen.getByRole("link");
	fireEvent.focus(link);
	rerender(
		<MessageThinkingPart text="Thinking with a [link](https://example.com)" />,
	);
	const trigger = screen.getByRole("button", { name: "Thinking" });
	expect(trigger).toHaveAttribute("aria-expanded", "true");
	fireEvent.blur(link, { relatedTarget: trigger });
	expect(trigger).toHaveAttribute("aria-expanded", "false");
});

it("starts persisted thinking collapsed and does not reopen on routine rerenders", () => {
	animationClock();
	const { rerender } = render(
		<MessageThinkingPart text="Completed reasoning" />,
	);
	const trigger = screen.getByRole("button", { name: "Thinking" });
	expect(trigger).toHaveAttribute("aria-expanded", "false");
	fireEvent.click(trigger);
	rerender(<MessageThinkingPart text="Completed reasoning" />);
	expect(trigger).toHaveAttribute("aria-expanded", "true");
});
