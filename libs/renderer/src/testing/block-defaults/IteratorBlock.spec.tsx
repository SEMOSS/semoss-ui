import "@testing-library/jest-dom";
import {
	IterationBlock,
	type IterationBlockDef,
} from "../../components/block-defaults/iteration-block/IterationBlock";
import { useBlock } from "../../hooks";
import { render, renderHook, screen } from "../utils";

const blocks = {
	iterationBlock: {
		id: "iterationBlock",
		widget: "iteration",
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
			},
			source: [1, 2, 3, 4, 5],
			child: {
				id: "button--1",
				widget: "button",
				parent: {
					id: "iterationBlock",
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
			id: "iterationBlock",
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
};

describe("Iterator block component", () => {
	const id = crypto.randomUUID();

	it("should use useBlock hook", async () => {
		const { result } = renderHook(
			() => useBlock<IterationBlockDef>("iterationBlock"),
			{
				blocks: blocks,
				renderEngineId: "iterationBlock",
			},
		);

		expect(result.current).toBeDefined();
	});
	it("should render iterator block", async () => {
		const { container } = render(<IterationBlock id={id} />, {
			blocks: blocks,
		});

		const iterator = container.querySelector(`[data-block='${id}']`);
		expect(iterator).toBeInTheDocument();
	});

	it("should render 5 buttons", async () => {
		render(<IterationBlock id={id} />, {
			blocks: blocks,
		});

		// screen.debug();
		const buttons = screen.getAllByRole("button", { name: /Submit/i });

		expect(buttons).toHaveLength(5);
	});
});
