import { expect, test } from "vitest";
import { InputBlock } from "../../components/block-defaults/input-block/InputBlock";
import { render, screen } from "../utils/index";

const blocks = {
	"string-input": {
		data: {
			style: {},
			label: "Example Input",
			value: "Example",
			type: "text",
			rows: 1,
			multiline: false,
			disabled: false,
			required: false,
			loading: false,
		},
		id: "string-input",
		widget: "input",
		slots: {},
		listeners: {
			// preProcess: {},
			// onChange: {},
		},
	},

	"multiLine-input": {
		data: {
			style: {},
			label: "Example Input",
			value: "Example #1\nExample #2\nExample #3\n",
			type: "text",
			rows: 3,
			multiline: true,
			disabled: false,
			required: false,
			loading: false,
		},
		id: "multiLine-input",
		widget: "input",
		slots: {},
		listeners: {},
	},

	"rowValue-input": {
		data: {
			style: {},
			label: "Example Input",
			value: "Example #1\nExample #2\nExample #3\n",
			type: "text",
			rows: 1,
			multiline: true,
			disabled: false,
			required: false,
			loading: false,
		},
		id: "rowValue-input",
		widget: "input",
		slots: {},
		listeners: {},
	},

	"number-input": {
		data: {
			style: {},
			label: "Example Input",
			value: 1,
			type: "number",
			rows: 1,
			multiline: false,
			disabled: false,
			required: false,
			loading: false,
		},
		id: "number-input",
		widget: "input",
		slots: {},
		listeners: {},
	},
	"valueType-input": {
		data: {
			style: {},
			label: "Example Input",
			value: "Example",
			type: "number",
			rows: 1,
			multiline: false,
			disabled: false,
			required: false,
			loading: false,
		},
		id: "valueType-input",
		widget: "input",
		slots: {},
		listeners: {},
	},
};

describe("input block", () => {
	test("renders correctly with mocked provider", async () => {
		const { container } = render(
			<InputBlock id={blocks["string-input"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='string-input']");
		expect(element).toBeInTheDocument();
	});

	test("renders correct label, type, and rows", async () => {
		const { container } = render(
			<InputBlock id={blocks["string-input"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("input");
		const label = screen.getByLabelText("Example Input");

		expect(label).toBeTruthy();
		expect(element).toHaveAttribute("rows", "1");
		expect(element).toHaveAttribute("type", "text");
		expect(element).toHaveAttribute("value", "Example");
	});

	test("renders correct rows and value with multiline input", async () => {
		const { container } = render(
			<InputBlock id={blocks["multiLine-input"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			"[data-block='multiLine-input']",
		);

		expect(element).toBeInTheDocument();

		const input = screen.getByRole("textbox");

		expect(input).toHaveAttribute("rows", "3");
		expect(input).toHaveValue("Example #1\nExample #2\nExample #3\n");
	});

	test("does not display multiline if input does not match row number", async () => {
		const { container } = render(
			<InputBlock id={blocks["rowValue-input"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			"[data-block='rowValue-input']",
		);

		expect(element).toBeInTheDocument();

		const input = screen.getByRole("textbox");

		expect(input).toHaveAttribute("rows", "1");
		expect(input).toHaveValue("Example #1Example #2Example #3");
	});

	test("renders input with number type", async () => {
		const { container } = render(
			<InputBlock id={blocks["number-input"].id} />,
			{
				blocks: blocks,
			},
		);

		const input = container.querySelector("[data-block='number-input']");

		expect(input).toBeInTheDocument();

		const element = screen.getByRole("spinbutton");

		expect(element).toHaveAttribute("rows", "1");
		expect(element).toHaveAttribute("type", "number");
		expect(element).toHaveValue(1);
	});

	test("does not display input with mismatch value and type", async () => {
		const { container } = render(
			<InputBlock id={blocks["valueType-input"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("input");
		const input = screen.getByRole("spinbutton");

		expect(element).toHaveAttribute("type", "number");
		expect(element).toHaveAttribute("value", "Example");

		// should not display value if type is mismatched
		expect(input).toHaveValue(null);
	});
});
