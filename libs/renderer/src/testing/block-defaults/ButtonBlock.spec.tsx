import { expect } from "vitest";
import { ButtonBlock } from "../../components/block-defaults/button-block/ButtonBlock";
import { render, screen } from "../utils";

const blocks = {
	button: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			label: "Button Test",
			loading: false,
			disabled: false,
			variant: "contained",
			color: "primary",
		},
		id: "button",
		widget: "button",
		slots: {},
		listeners: {},
	},

	styledButton: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
				width: "30px",
				height: "50px",
			},
			label: "Styled Button Test",
			loading: false,
			disabled: false,
			variant: "outlined",
			color: "secondary",
		},
		id: "styledButton",
		widget: "button",
		slots: {},
		listeners: {},
	},
};

describe("button block", () => {
	it("renders button block with correct label", async () => {
		const { container } = render(<ButtonBlock id={blocks.button.id} />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='button']");

		expect(element).toBeInTheDocument();
		expect(screen.getByText("Button Test")).toBeInTheDocument();
	});

	it("renders button with correct color, variant, dimensions", async () => {
		const { container } = render(
			<ButtonBlock id={blocks.styledButton.id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='styledButton']");
		const buttonElement = container.querySelector("button");

		expect(element).toBeInTheDocument();
		expect(buttonElement).toHaveClass("MuiButton-outlined");
		expect(buttonElement).toHaveClass("MuiButton-outlinedSecondary");
		expect(buttonElement).toHaveStyle({ width: "30px", height: "50px" });
	});
});
