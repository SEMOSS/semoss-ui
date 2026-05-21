import { expect } from "vitest";
import { CheckboxBlock } from "../../components/block-defaults/checkbox-block/CheckboxBlock";
import { fireEvent, render } from "../utils";

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
			onChange: { type: "sync", order: [] },
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
			onChange: { type: "sync", order: [] },
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
			onChange: { type: "sync", order: [] },
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
		const element = container.querySelector(
			"[data-block='checkbox']",
		) as HTMLElement;
		expect(element).toBeInTheDocument();
		expect(element.querySelector("[data-state='checked']")).toBeNull();
		expect(element.querySelector("[disabled]")).toBeNull();
	});

	it("renders checkbox checked", async () => {
		const { container } = render(
			<CheckboxBlock id={blocks.checkbox2.id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			"[data-block='checkbox2']",
		) as HTMLElement;

		expect(element).toBeInTheDocument();
		expect(
			element.querySelector("[data-state='checked']"),
		).toBeInTheDocument();
	});

	it("renders checkbox disabled", async () => {
		const { container } = render(
			<CheckboxBlock id={blocks.checkbox3.id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			"[data-block='checkbox3']",
		) as HTMLElement;

		expect(element).toBeInTheDocument();
		expect(
			element.querySelector("[data-state='checked']"),
		).toBeInTheDocument();
		expect(element.querySelector("[disabled]")).toBeInTheDocument();
	});

	it("checks checkbox when clicked", async () => {
		const { container } = render(
			<CheckboxBlock id={blocks.checkbox.id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			"[data-block='checkbox']",
		) as HTMLElement;
		const clickElement = container.querySelector(
			"[data-block='checkbox'] button[data-slot='checkbox']",
		) as HTMLElement;
		expect(element).toBeInTheDocument();
		fireEvent.click(clickElement);
		expect(
			element.querySelector("[data-state='checked']"),
		).toBeInTheDocument();
		expect(element.querySelector("[disabled]")).toBeNull();
	});
});
