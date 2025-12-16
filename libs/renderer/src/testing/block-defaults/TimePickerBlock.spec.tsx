import { fireEvent, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { TimePickerBlock } from "../../components/block-defaults/time-picker-block/TimePickerBlock";
import { render, screen } from "../utils";

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
		const { container } = render(
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
			expect(inputElement?.querySelector("[value='']")).toBeNull();
			expect(screen.getByText("Select Time")).toBeInTheDocument();
		});
	});

	it("renders time value correctly", async () => {
		const { container } = render(
			<TimePickerBlock id={blocks["time-picker2"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='time-picker2']");
		const inputElement = container.querySelector("input");
		const buttonElement = container.querySelector("button");

		expect(element).toBeInTheDocument();
		expect(screen.getByText("Select Time 2")).toBeInTheDocument();
		expect(inputElement).toBeInTheDocument();
		expect(buttonElement).toBeInTheDocument();

		if (buttonElement) {
			fireEvent.click(buttonElement);
		}

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		const timePickerElement = screen.getByRole("dialog");

		const testCases = [
			{ hour: "03", minute: "15", period: "AM" },
			{ hour: "06", minute: "30", period: "PM" },
			{ hour: "11", minute: "45", period: "PM" },
		];

		for (const testCase of testCases) {
			const { hour, minute, period } = testCase;

			const hourElement = screen.getByText(hour);
			fireEvent.click(hourElement);

			screen.debug();

			const minuteElement = screen.getByText(minute);
			fireEvent.click(minuteElement);

			const periodElement = screen.getByText(period);
			fireEvent.click(periodElement);

			const selectedElements = timePickerElement.querySelectorAll(
				"[aria-selected='true']",
			);

			// await waitFor(() => {
			expect(selectedElements).toHaveLength(3);
			expect(selectedElements[0].textContent).toBe(hour);
			console.log(
				"Selected Elements[0]:",
				selectedElements[0].textContent,
			);
			expect(selectedElements[1].textContent).toBe(minute);
			expect(selectedElements[2].textContent).toBe(period);

			// });

			expect(screen.getByText("OK")).toBeInTheDocument();
			expect(inputElement).toHaveValue(
				`${hour}:${minute} ${period.toLowerCase()}`,
			);
		}
	});
});
