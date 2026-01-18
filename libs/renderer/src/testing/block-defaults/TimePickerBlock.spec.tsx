import { waitFor } from "@testing-library/react";
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
			value: "2025-04-29T14:25:01.579Z",
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
			expect(inputElement.querySelector("[value='']")).toBeNull();
			expect(screen.getByText("Select Time")).toBeInTheDocument();
		});
	});

	// it("renders time value correctly", async () => {
	// 	const { container } = render(
	// 		<TimePickerBlock id={blocks["time-picker2"].id} />,
	// 		{
	// 			blocks: blocks,
	// 		},
	// 	);

	// 	const element = container.querySelector("[data-block='time-picker2']");
	// 	const inputElement = container.querySelector("input");
	// 	const buttonElement = container.querySelector("button");

	// 	expect(element).toBeInTheDocument();
	// 	expect(inputElement).toBeInTheDocument();
	// 	expect(inputElement.querySelector("[value='09:25 am']")).toBeNull();
	// 	expect(screen.getByText("Select Time 2")).toBeInTheDocument();
	// 	// fireEvent.click(buttonElement);

	// 	const timePickerElement = screen.getByRole("dialog");
	// 	for (let i = 1; i < 13; i++) {
	// 		const hourValue = i < 10 ? `0${i}` : `${i}`;
	// 		if (i === 5 || i === 10) {
	// 			const textElements = screen.getAllByText(hourValue);
	// 			expect(textElements).not.toBeNull();
	// 			expect(textElements.length).equals(2);
	// 		} else {
	// 			expect(screen.getByText(hourValue)).toBeInTheDocument();
	// 		}
	// 		const minuteValue = (i - 1) * 5;
	// 		if (i > 3) {
	// 			expect(screen.getByText(minuteValue)).toBeInTheDocument();
	// 		}
	// 	}
	// 	expect(screen.getByText("00")).toBeInTheDocument();
	// 	expect(screen.getByText("AM")).toBeInTheDocument();
	// 	expect(screen.getByText("PM")).toBeInTheDocument();
	// 	expect(screen.getByText("OK")).toBeInTheDocument();
	// 	let selectedElements = timePickerElement.querySelectorAll(
	// 		"[aria-selected='true']",
	// 	);
	// 	// Not checking for value because time entered depends on timezone
	// 	expect(selectedElements[0].textContent).not.toBeNull();
	// 	expect(selectedElements[1].textContent).equal("25");
	// 	// Not checking for value because time entered depends on timezone
	// 	expect(selectedElements[2].textContent).not.toBeNull();

	// 	// fireEvent.click(screen.getByText("06"));
	// 	// fireEvent.click(screen.getByText("30"));
	// 	// fireEvent.click(screen.getByText("PM"));
	// 	// selectedElements = timePickerElement.querySelectorAll(
	// 	// 	"[aria-selected='true']",
	// 	// );
	// 	// expect(selectedElements[0].textContent).equal("06");
	// 	// expect(selectedElements[1].textContent).equal("30");
	// 	// expect(selectedElements[2].textContent).equal("PM");
	// });
});
