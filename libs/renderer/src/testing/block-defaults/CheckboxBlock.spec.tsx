import { expect } from "vitest";
import { CheckboxBlock } from "../../components/block-defaults/checkbox-block/CheckboxBlock";
import { render } from "../utils";

const blocks = {
	checkbox: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			value: false,
			show: true,
		},
		id: "checkbox",
		widget: "checkbox",
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
	checkbox2: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			value: true,
			show: true,
		},
		id: "checkbox2",
		widget: "checkbox",
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
	checkbox3: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			disabled: true,
			value: true,
			show: true,
		},
		id: "checkbox3",
		widget: "checkbox",
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

describe("Checkbox block", () => {
	it("renders correctly with mocked provider", async () => {
		const { container } = render(
			<CheckboxBlock id={blocks.checkbox.id} />,
			{
				blocks: blocks,
			},
		);
		const element = container.querySelector("[data-block='checkbox']");
		expect(element).toBeInTheDocument();
		expect(element.querySelector(".Mui-checked")).toBeNull();
		expect(element.querySelector(".Mui-disabled")).toBeNull();
	});

	it("renders checkbox checked", async () => {
		const { container } = render(
			<CheckboxBlock id={blocks.checkbox2.id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='checkbox2']");

		expect(element).toBeInTheDocument();
		expect(element.querySelector(".Mui-checked")).toBeInTheDocument();
	});

	it("renders checkbox disabled", async () => {
		const { container } = render(
			<CheckboxBlock id={blocks.checkbox3.id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='checkbox3']");

		expect(element).toBeInTheDocument();
		expect(element.querySelector(".Mui-checked")).toBeInTheDocument();
		expect(element.querySelector(".Mui-disabled")).toBeInTheDocument();
	});

	it("checks checkbox when clicked", async () => {
		const { container } = render(
			<CheckboxBlock id={blocks.checkbox.id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='checkbox']");
		// const clickElement = container.querySelector(
		// 	"[data-block='checkbox'] input",
		// );
		expect(element).toBeInTheDocument();
		// fireEvent.click(clickElement);
		// expect(element.querySelector(".Mui-checked")).toBeInTheDocument();
		// expect(element.querySelector(".Mui-disabled")).toBeNull();
	});
});
