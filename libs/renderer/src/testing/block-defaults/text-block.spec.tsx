import { screen } from "@testing-library/react";
import { expect } from "vitest";
import { TextBlock } from "../../components/block-defaults/text-block/text-block";
import { render } from "../utils";

const blocks = {
	text: {
		data: {
			text: "Hello world",
			isStreaming: false,
			show: "true",
		},
		id: "text",
		widget: "text",
		slots: {},
		listeners: {
			onChange: {
				type: "sync",
				order: [],
			},
		},
	},
	text2: {
		data: {
			text: "Hello world",
			isStreaming: false,
			show: "false",
		},
		id: "text",
		widget: "text",
		slots: {},
		listeners: {
			onChange: {
				type: "sync",
				order: [],
			},
		},
	},
};

describe("text block", () => {
	it("renders Hello world", async () => {
		const { container } = render(<TextBlock id={blocks.text.id} />, {
			blocks: blocks,
		});

		const textBlock = container.querySelector("[data-block='text']");
		expect(textBlock).toBeInTheDocument();
		expect(screen.getByText("Hello world")).toBeInTheDocument();
	});

	it("does not show", async () => {
		const { container } = render(<TextBlock id={blocks.text2.id} />, {
			blocks: blocks,
		});

		const textBlock = container.querySelector("[data-block='text2'] p");
		expect(textBlock).not.toBeInTheDocument();
	});

	it("changes text type based on variant", async () => {
		const tagNames = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span"];
		const variantBlock = blocks;
		tagNames.forEach((tag) => {
			(variantBlock.text.data as Record<string, unknown>).variant = tag;
			const { container } = render(<TextBlock id={blocks.text.id} />, {
				blocks: variantBlock,
			});
			const textBlock = container.querySelector(`${tag}`);
			expect(textBlock).not.toBeNull();
		});
	});
});
