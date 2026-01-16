import { expect, test } from "vitest";
import { FlipCardBlock } from "../../components/block-defaults/flip-card-block/FlipCardBlock";
import type { ListenerActions } from "../../store";
import { render } from "../utils/index";

const blocks = {
	"front-text": {
		id: "front-text",
		widget: "text",
		parent: {
			id: "flip-card",
			slot: "children",
		},
		data: {
			style: {
				padding: "4px",
				whiteSpace: "pre-line",
				textOverflow: "ellipsis",
			},
			text: "Front",
			variant: "p",
		},
		listeners: {},
		slots: {},
	},
	"back-text": {
		id: "back-text",
		widget: "text",
		parent: {
			id: "flip-card",
			slot: "children",
		},
		data: {
			style: {
				padding: "4px",
				whiteSpace: "pre-line",
				textOverflow: "ellipsis",
			},
			text: "Back",
			variant: "p",
		},
		listeners: {},
		slots: {},
	},
	"flip-card": {
		id: "flip-card",
		widget: "flip-card",
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				border: "5px solid #000000",
				borderRadius: "5px",
			},
			frontBgColor: "#ffb3b3",
			backBgColor: "#775ef3",
			isFlipped: false,
			show: "true",
		},
		listeners: {
			preProcess: {
				type: "async" as "async",
				order: [] as ListenerActions[],
			},
		},
		slots: {
			front: {
				name: "front",
				children: ["front-text"],
			},
			back: {
				name: "back",
				children: ["back-text"],
			},
		},
	},
};

describe("Flip Card Block", () => {
	test("renders correctly with mocked provider", async () => {
		const { container } = render(
			<FlipCardBlock id={blocks["flip-card"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='flip-card']");
		expect(element).toBeInTheDocument();
	});

	test("flip with correct text on both sides", async () => {
		const { container } = render(
			<FlipCardBlock id={blocks["flip-card"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='flip-card']");

		expect(element).toHaveTextContent("Front");
		// fireEvent.mouseEnter(element);
		// expect(element).toHaveTextContent("Back");
	});

	test("renders with correct styling", async () => {
		const { container } = render(
			<FlipCardBlock id={blocks["flip-card"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelectorAll("div.MuiCard-root");

		const frontCard = element[0];
		const backCard = element[1];

		expect(frontCard).toHaveStyle({ border: "5px solid #000000" });
		expect(frontCard).toHaveStyle({ borderRadius: "5px" });
		expect(frontCard).toHaveStyle({ backgroundColor: "#ffb3b3" });

		// fireEvent.mouseEnter(frontCard);

		expect(backCard).toHaveStyle({ border: "5px solid #000000" });
		expect(backCard).toHaveStyle({ borderRadius: "5px" });
		expect(backCard).toHaveStyle({ backgroundColor: "#775ef3" });
	});
});
