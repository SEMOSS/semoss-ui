import { expect } from "vitest";
import {
	RadioBlock,
	type RadioBlockDef,
} from "../../components/block-defaults/radio-block/RadioBlock";
import { useBlock } from "../../hooks";
import { render, renderHook, screen } from "../utils";

const blocks = {
	radio: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			label: "Radio test",
			options: [{ label: "Radio choice 1", value: "radioChoice1" }],
		},
		id: "radio",
		widget: "radio",
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
	radio2: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			label: "Radio 2 test",
			disabled: true,
			options: [{ label: "Radio choice 2", value: "radioChoice2" }],
		},
		id: "radio2",
		widget: "radio",
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
	radio3: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			label: "Radio 3 test",
			required: true,
			options: [{ label: "Radio choice 3", value: "radioChoice3" }],
			value: true,
		},
		id: "radio3",
		widget: "radio",
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

describe("radio block", () => {
	it("renders correctly", async () => {
		const { container } = render(<RadioBlock id={blocks.radio.id} />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='radio']");

		expect(element).toBeInTheDocument();
		expect(screen.getByText("Radio test")).toBeInTheDocument();
		expect(screen.getByText("Radio choice 1")).toBeInTheDocument();
	});

	it("renders disabled correctly", async () => {
		const { result } = renderHook(() => useBlock<RadioBlockDef>("radio2"), {
			blocks,
			renderEngineId: "radio2",
		});

		const radio2Choice = result.current.data;
		expect(radio2Choice.options[0].value).toBe("radioChoice2");
		expect(radio2Choice.disabled).toBe(true);
	});

	it("renders required correctly", async () => {
		const { result } = renderHook(() => useBlock<RadioBlockDef>("radio3"), {
			blocks,
			renderEngineId: "radio3",
		});

		const radio3Choice = result.current.data;
		expect(radio3Choice.options[0].value).toBe("radioChoice3");
		expect(radio3Choice.required).toBe(true);
	});

	it("selects radio choice 3", async () => {
		const { result } = renderHook(() => useBlock<RadioBlockDef>("radio3"), {
			blocks,
			renderEngineId: "radio3",
		});

		const radio3Choice = result.current.data;
		expect(radio3Choice.options[0].value).toBe("radioChoice3");
		expect(radio3Choice.value).toBe(true);
	});
});
