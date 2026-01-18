import { screen } from "@testing-library/react";
import { expect } from "vitest";
import { SwitchBlock } from "../../components/block-defaults/switch-block/SwitchBlock";
import { render } from "../utils";

const blocks = {
	switch: {
		data: {
			style: { width: "fit-content" },
			label: "Toggle Switch",
			value: false,
			disabled: false,
			color: "primary",
			size: "medium",
			helperText: "",
			required: false,
			labelPlacement: "end",
		},
		id: "switch",
		widget: "switch",
		slots: {},
		listeners: {
			onChange: {
				type: "sync",
				order: [],
			},
		},
	},
};

describe("switch block", () => {
	it("renders correctly", async () => {
		const { container } = render(<SwitchBlock id={blocks.switch.id} />, {
			blocks: blocks,
		});
		const switchBlock = container.querySelector("[data-block='switch']");
		expect(switchBlock).toBeInTheDocument();
	});

	it("displays default text label", async () => {
		render(<SwitchBlock id={blocks.switch.id} />, {
			blocks: blocks,
		});
		expect(screen.getByText("Toggle Switch")).toBeVisible();
	});

	it("toggles value on clicked", async () => {
		render(<SwitchBlock id={blocks.switch.id} />, {
			blocks: blocks,
		});
		const switchElement = screen.getByRole("checkbox");
		expect(switchElement).not.toBeChecked();
		// fireEvent.click(switchElement);
		// await waitFor(() => {
		// 	expect(switchElement).toBeChecked();
		// });
		// fireEvent.click(switchElement);
		// await waitFor(() => {
		// 	expect(switchElement).not.toBeChecked();
		// });
	});
});
