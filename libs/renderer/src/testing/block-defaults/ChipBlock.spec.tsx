import { describe, expect } from "vitest";
import { ChipBlock } from "../../components/block-defaults/chip-block/ChipBlock";
import { render } from "../utils/index";

const blocks = {
	chip: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			src: "",
			title: "",
			show: true,
		},
		id: "chip",
		widget: "chip",
		slots: {},
		listeners: {},
	},
	"icon-chip": {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			src: "",
			title: "",
			show: true,
			type: "Icon",
		},
		id: "icon-chip",
		widget: "chip",
		slots: {},
		listeners: {},
	},
	"appearance-chip": {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			src: "",
			title: "",
			show: true,
			variant: "outlined",
		},
		id: "appearance-chip",
		widget: "chip",
		slots: {},
		listeners: {},
	},
};

describe("chip block", () => {
	it("should render correctly with mocked provider", async () => {
		const { container } = render(<ChipBlock id={blocks.chip.id} />, {
			blocks: blocks,
		});

		const chip = container.querySelector("[data-block='chip']");
		expect(chip).toBeInTheDocument();
	});

	it("should show correct variant", async () => {
		const { container } = render(
			<ChipBlock id={blocks["icon-chip"].id} />,
			{
				blocks: blocks,
			},
		);

		const chip = container.querySelector(
			"[data-block='icon-chip']",
		) as HTMLElement;
		const icon = chip.querySelector("svg");
		expect(chip).toBeInTheDocument();
		expect(icon).toBeInTheDocument();
	});

	it("should render correct appearance variants", async () => {
		const { container } = render(
			<ChipBlock id={blocks["appearance-chip"].id} />,
			{
				blocks: blocks,
			},
		);

		const chip = container.querySelector(
			"[data-block='appearance-chip']",
		) as HTMLElement;
		const span = chip.querySelector("span");
		expect(span).toBeInTheDocument();
		expect(span).toHaveClass("bg-transparent");
	});
});
