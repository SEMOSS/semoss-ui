import { describe, expect, test } from "vitest";
import "@testing-library/jest-dom";
import { act, fireEvent, waitFor } from "@testing-library/react";
import { SelectBlock } from "../../components/block-defaults/select-block/SelectBlock.tsx";
import { render, screen } from "../utils";

const blockIds = {
	select: "select",
	multiSelect: "multiSelect",
};

const blocks = {
	select: {
		data: {
			multiple: false,
			style: {},
			label: "Select an option",
			value: "option 1",
			required: false,
			disabled: false,
			options: [],
			hint: "this is a hint",
			loading: false,
			show: true,
		},
		id: "select",
		widget: "select",
		slots: {},
		listeners: {},
	},
	multiSelect: {
		data: {
			multiple: true,
			style: {},
			label: "Select an option",
			required: false,
			disabled: false,
			options: ["option 1", "option 2", "option 3"],
			hint: "",
			loading: false,
			show: true,
		},
		id: "multiSelect",
		widget: "select",
		slots: {},
		listeners: {},
	},
};

describe("Select block", () => {
	test("renders correctly with mocked data", async () => {
		const { container } = render(<SelectBlock id={blockIds.select} />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='select']");
		expect(element).toBeInTheDocument();

		const label = screen.getByLabelText("Select an option");
		expect(label).toBeInTheDocument();

		const hint = screen.getByText("this is a hint");
		expect(hint).toBeInTheDocument();

		const input = screen.getByRole("combobox");
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute("value", "option 1");
	});

	test("value if multiple is true", async () => {
		const { container } = render(
			<SelectBlock id={blockIds.multiSelect} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='multiSelect']");
		expect(element).toBeInTheDocument();

		const dropdown = screen.getByRole("button", { name: /open/i });
		expect(dropdown).toBeInTheDocument();

		await act(async () => {
			fireEvent.click(dropdown);
		});

		await waitFor(() => {
			const input = screen.getByRole("combobox");
			expect(input).toHaveAttribute("aria-expanded", "true");
		});

		expect(screen.getByText("option 1")).toBeInTheDocument();
		expect(screen.getByText("option 2")).toBeInTheDocument();
		expect(screen.getByText("option 3")).toBeInTheDocument();
	});
});
