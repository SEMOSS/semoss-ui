import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { topicColor } from "../topic-color";
import { TopicDot } from "./topic-dot";

describe("TopicDot", () => {
	const mockTopic = {
		id: "test-topic-123",
		name: "Test Topic",
		color: "",
	};

	it("renders nothing if topic is undefined", () => {
		const { container } = render(<TopicDot topic={undefined} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders a span with aria-hidden when topic is provided as object", () => {
		const { container } = render(<TopicDot topic={mockTopic} />);
		const span = container.querySelector("span");
		expect(span).toHaveAttribute("aria-hidden", "true");
	});

	it("renders a span with aria-hidden when topic is provided as minimal object", () => {
		const { container } = render(
			<TopicDot topic={{ id: "test-topic-123" }} />,
		);
		const span = container.querySelector("span");
		expect(span).toHaveAttribute("aria-hidden", "true");
	});

	it("applies default size class when not specified", () => {
		const { container } = render(<TopicDot topic={mockTopic} />);
		const span = container.querySelector("span");
		expect(span).toHaveClass("size-2");
	});

	it("applies custom size class when specified", () => {
		const { container } = render(
			<TopicDot topic={mockTopic} size="size-3" />,
		);
		const span = container.querySelector("span");
		expect(span).toHaveClass("size-3");
		expect(span).not.toHaveClass("size-2");
	});

	it("applies rounded-full class", () => {
		const { container } = render(<TopicDot topic={mockTopic} />);
		const span = container.querySelector("span");
		expect(span).toHaveClass("rounded-full");
	});

	it("applies shrink-0 class", () => {
		const { container } = render(<TopicDot topic={mockTopic} />);
		const span = container.querySelector("span");
		expect(span).toHaveClass("shrink-0");
	});

	it("applies additional className when provided", () => {
		const { container } = render(
			<TopicDot topic={mockTopic} className="custom-class" />,
		);
		const span = container.querySelector("span");
		expect(span).toHaveClass("custom-class");
	});

	it("sets inline backgroundColor style using topicColor utility", () => {
		const { container } = render(<TopicDot topic={mockTopic} />);
		const span = container.querySelector("span");
		const { backgroundColor } = topicColor({
			id: mockTopic.id,
			color: "",
		});
		expect(span).toHaveStyle({ backgroundColor });
	});

	it("uses custom color when topic has color set", () => {
		const topicWithColor = {
			...mockTopic,
			color: "#FF5733",
		};
		const { container } = render(<TopicDot topic={topicWithColor} />);
		const span = container.querySelector("span");
		const { backgroundColor } = topicColor({
			id: topicWithColor.id,
			color: topicWithColor.color,
		});
		expect(span).toHaveStyle({ backgroundColor });
	});

	it("uses automatic color when topic has empty color string", () => {
		const topicWithoutColor = {
			...mockTopic,
			color: "",
		};
		const { container } = render(<TopicDot topic={topicWithoutColor} />);
		const span = container.querySelector("span");
		const { backgroundColor } = topicColor({
			id: topicWithoutColor.id,
			color: "",
		});
		expect(span).toHaveStyle({ backgroundColor });
	});

	it("uses automatic color when topic lacks color property", () => {
		const minimalTopic = { id: "another-topic-id" };
		const { container } = render(<TopicDot topic={minimalTopic} />);
		const span = container.querySelector("span");
		const { backgroundColor } = topicColor({
			id: minimalTopic.id,
			color: "",
		});
		expect(span).toHaveStyle({ backgroundColor });
	});

	it("combines size, shrink, and rounded-full classes correctly", () => {
		const { container } = render(
			<TopicDot topic={mockTopic} size="size-2.5" />,
		);
		const span = container.querySelector("span");
		expect(span).toHaveClass("size-2.5", "shrink-0", "rounded-full");
	});
});
