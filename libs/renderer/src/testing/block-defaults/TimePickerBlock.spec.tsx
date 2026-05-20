import { waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { TimePickerBlock } from "../../components/block-defaults/time-picker-block/TimePickerBlock";
import { render } from "../utils";

const blocks = {
	"time-picker": {
		data: {
			style: {},
			label: "Select Time",
			value: "",
			variant: "picker",
			ampm: true,
			format: "hh:mm a",
			disabled: false,
			required: false,
			fullWidth: true,
			placeholder: "",
			clearable: true,
			size: "small",
			views: ["hours", "minutes"],
		},
		id: "time-picker",
		widget: "timepicker",
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
	"time-picker2": {
		data: {
			style: {},
			label: "Select Time 2",
			value: "",
			variant: "picker",
			ampm: true,
			format: "hh:mm a",
			disabled: false,
			required: false,
			fullWidth: true,
			placeholder: "",
			clearable: true,
			size: "small",
			views: ["hours", "minutes"],
		},
		id: "time-picker2",
		widget: "timepicker",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: {
				type: "sync",
				order: [],
			},
		},
	},
};

describe("time picker block", () => {
	it("renders correctly with mocked provider", async () => {
		const { container, getByText } = render(
			<TimePickerBlock id={blocks["time-picker"].id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const element = container.querySelector(
				"[data-block='time-picker']",
			);
			const inputElement = container.querySelector("input");
			expect(element).toBeInTheDocument();
			expect(inputElement).toBeInTheDocument();
			expect(inputElement).toHaveAttribute("type", "time");
			expect(getByText("Select Time")).toBeInTheDocument();
		});
	});

	it("renders time input with correct attributes", async () => {
		const { container, getByText } = render(
			<TimePickerBlock id={blocks["time-picker2"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='time-picker2']");
		expect(element).toBeInTheDocument();
		expect(getByText("Select Time 2")).toBeInTheDocument();

		const inputElement = container.querySelector(
			"input[type='time']",
		) as HTMLInputElement;
		expect(inputElement).toBeInTheDocument();
		expect(inputElement.value).toBe("");
	});
});
