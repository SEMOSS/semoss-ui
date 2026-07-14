import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TypingIndicator } from "./typing-indicator";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("TypingIndicator", () => {
	it("has an accessible status role with the first loading message", () => {
		render(<TypingIndicator />);
		expect(
			screen.getByRole("status", { name: "Thinking through it..." }),
		).toBeInTheDocument();
	});

	it("rotates to the next loading message over time", () => {
		render(<TypingIndicator />);
		expect(screen.getByText("Thinking through it...")).toBeInTheDocument();

		act(() => {
			vi.advanceTimersByTime(2000);
		});

		expect(screen.getByText("Working on that...")).toBeInTheDocument();
	});

	it("merges a custom className", () => {
		render(<TypingIndicator className="custom-typing-class" />);
		expect(screen.getByRole("status")).toHaveClass("custom-typing-class");
	});
});
