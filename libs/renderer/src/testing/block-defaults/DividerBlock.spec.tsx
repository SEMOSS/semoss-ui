import { expect } from "vitest";
import { DividerBlock } from "../../components/block-defaults/divider-block";
import { render, screen } from "../utils";

const blocks = {
	divider: {
		data: {
			style: {},
			variant: "fullWidth",
			orientation: "horizontal",
			textAlign: "center",
			flexItem: false,
			light: false,
			text: "",
			showText: false,
			show: "true",
		},
		id: "divider",
		widget: "divider",
		slots: {},
		listeners: {},
	},
	divider2: {
		data: {
			style: {},
			variant: "inset",
			orientation: "vertical",
			textAlign: "right",
			flexItem: false,
			light: false,
			text: "Hello World!",
			showText: true,
			show: "true",
		},
		id: "divider2",
		widget: "divider",
		slots: {},
		listeners: {},
	},
};

describe("divider block", () => {
	it("renders default divider", async () => {
		const { container } = render(<DividerBlock id={blocks.divider.id} />, {
			blocks: blocks,
		});

		const dividerBlock = container.querySelector("[data-block='divider']");
		expect(dividerBlock).toBeInTheDocument();
	});

	it("displays label text", async () => {
		render(<DividerBlock id={blocks.divider2.id} />, {
			blocks: blocks,
		});

		expect(screen.getByText("Hello World!")).toBeVisible();
	});

	it("displays correct orientation and variant 1", async () => {
		const { container } = render(<DividerBlock id={blocks.divider.id} />, {
			blocks: blocks,
		});

		const dividerBlock = container.querySelector(
			"[data-block='divider']",
		) as HTMLElement;
		expect(
			dividerBlock.querySelector("[data-orientation='vertical']"),
		).not.toBeInTheDocument();
		expect(
			dividerBlock.querySelector("[data-orientation='horizontal']"),
		).toBeInTheDocument();
	});

	it("displays correct orientation and variant 2", async () => {
		const { container } = render(<DividerBlock id={blocks.divider2.id} />, {
			blocks: blocks,
		});

		const dividerBlock = container.querySelector(
			"[data-block='divider2']",
		) as HTMLElement;
		expect(
			dividerBlock.querySelector("[data-orientation='vertical']"),
		).toBeInTheDocument();
	});
});
