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

		const timePickerElement = screen.getByRole("dialog");
		await waitFor(() => {
			expect(timePickerElement).toBeInTheDocument();
		});

		expect(screen.getByLabelText("Choose time")).toBeInTheDocument();
		expect(
			screen.getByRole("listbox", { name: "Select hours" }),
		).toBeInTheDocument();

		const testCases = [
			{ hour: "3", minute: "15", period: "AM" },
			{ hour: "6", minute: "30", period: "PM" },
			{ hour: "11", minute: "45", period: "PM" },
		];

		for (const testCase of testCases) {
			const { hour, minute, period } = testCase;

			// reopen dialog for each test case
			const buttonElement = container.querySelector("button");
			if (buttonElement) {
				fireEvent.click(buttonElement);
			}

			const hourElement = screen.getByRole("option", {
				name: `${hour} hours`,
			});
			fireEvent.click(hourElement);

			const minuteElement = screen.getByRole("option", {
				name: `${minute} minutes`,
			});
			fireEvent.click(minuteElement);

			const periodElement = screen.getByRole("option", { name: period });
			fireEvent.click(periodElement);

			await waitFor(() => {
				expect(hourElement).toHaveAttribute("aria-selected", "true");
				expect(minuteElement).toHaveAttribute("aria-selected", "true");
				expect(periodElement).toHaveAttribute("aria-selected", "true");
			});

			const okButton = screen.getByRole("button", { name: "OK" });
			fireEvent.click(okButton);
		}
	});
});
