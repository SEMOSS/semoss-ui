import { expect } from "vitest";
import { LinkBlock } from "../../components/block-defaults/link-block/LinkBlock";
import { render, screen } from "../utils";

const blocks = {
	link: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			href: "http://localhost:9090/SemossWeb/#!",
			text: "Link test",
		},
		id: "link",
		widget: "link",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: [],
		},
	},
};

describe("link block", () => {
	it("renders correctly with mocked provider", async () => {
		const { container } = render(<LinkBlock id={blocks.link.id} />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='link']");

		expect(element).toBeInTheDocument();
		expect(element.tagName).equal("A", "element is type a");
		expect(element.href).equal(
			"http://localhost:9090/SemossWeb/#!",
			"element contain href",
		);
		expect(screen.getByText("Link test")).toBeInTheDocument();
	});
});
