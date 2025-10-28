import "@testing-library/jest-dom";
import { IterationBlock } from "../../components/block-defaults/iteration-block/IterationBlock";
import { render } from "../utils";

const blocks = {
	blocks: {
		"page-1": {
			slots: {
				content: {
					children: ["container--1"],
					name: "content",
				},
			},
			widget: "page",
			data: {
				route: "{{listArray}}",
				style: {
					padding: "24px",
					fontFamily: "roboto",
					flexDirection: "column",
					display: "flex",
					gap: "8px",
				},
			},
			listeners: {
				onPageLoad: {
					type: "sync",
					order: [],
				},
			},
			id: "page-1",
		},
		"container--1": {
			parent: {
				id: "page-1",
				slot: "content",
			},
			slots: {
				children: {
					children: ["iteration--1"],
					name: "children",
				},
			},
			widget: "container",
			data: {
				style: {
					padding: "4px",
					overflow: "hidden",
					flexWrap: "wrap",
					flexDirection: "column",
					display: "flex",
					gap: "8px",
				},
			},
			listeners: {
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			id: "container--1",
		},
		"iteration--1": {
			id: "iteration--1",
			widget: "iteration",
			parent: {
				id: "container--1",
				slot: "children",
			},
			data: {
				style: {
					display: "flex",
					flexDirection: "column",
				},
				source: " {{listArray}} ",
				child: {
					id: "button--1",
					widget: "button",
					parent: {
						id: "iteration--1",
						slot: "children",
					},
					data: {
						style: {},
						label: "Submit",
						loading: false,
						disabled: false,
						variant: "contained",
						color: "primary",
						show: true,
						type: "button",
					},
					listeners: {
						onClick: {
							type: "sync",
							order: [],
						},
						preProcess: {
							type: "sync",
							order: [],
						},
					},
					slots: {},
					communityBlockMapping: {},
				},
				show: "true",
			},
			listeners: {
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			slots: {
				children: {
					name: "children",
					children: ["button--1"],
				},
			},
			communityBlockMapping: {},
		},
		"button--1": {
			id: "button--1",
			widget: "button",
			parent: {
				id: "iteration--1",
				slot: "children",
			},
			data: {
				style: {},
				label: "Submit",
				loading: false,
				disabled: false,
				variant: "contained",
				color: "primary",
				show: true,
				type: "button",
			},
			listeners: {
				onClick: {
					type: "sync",
					order: [],
				},
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			slots: {},
			communityBlockMapping: {},
		},
	},
	variables: {
		mcp_driver: {
			to: "mcp_driver",
			type: "query",
		},
		"mcp_driver--1": {
			to: "mcp_driver",
			type: "cell",
			cellId: "1",
		},
		listArray: {
			type: "array",
			value: [1, 2, 3, 4, 5],
		},
	},
	executionOrder: ["mcp_driver"],
	version: "1.0.0-alpha.17",
};

describe("iterator block", () => {
	it("render the iterator block", async () => {
		const { container } = render(
			<IterationBlock id={crypto.randomUUID()} />,
			{
				blocks: blocks,
			},
		);

		console.log({ container });
	});
});
