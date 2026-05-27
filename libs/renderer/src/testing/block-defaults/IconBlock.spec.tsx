import { expect } from "vitest";
import { IconBlock } from "../../components/block-defaults/icon-block";
import { render } from "../utils";

const blocks = {
	icon: {
		data: {
			style: {
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				height: "200px",
				color: "black",
			},
			icon: "Icon",
			src: "",
			title: "",
			show: "true",
		},
		listeners: {},
		slots: {},
		id: "icon",
		widget: "icon",
	},
};

describe("icon block", () => {
	it("renders correctly", async () => {
		const { container } = render(<IconBlock id={blocks.icon.id} />, {
			blocks: blocks,
		});

		const icon = container.querySelector("[data-block='icon']");
		expect(icon).toBeInTheDocument();
	});

	it("shows default icon", async () => {
		const { container } = render(<IconBlock id={blocks.icon.id} />, {
			blocks: blocks,
		});

		const icon = container.querySelector(
			"[data-block='icon']",
		) as HTMLElement;
		const svgIcon = icon.querySelector("svg");

		expect(svgIcon).toBeInTheDocument();
	});
});
