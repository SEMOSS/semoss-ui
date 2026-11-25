import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";

afterEach(cleanup);

describe("InputGroupAddon", () => {
	it("focuses its input with the caret after the value, so typing adds to it", () => {
		render(
			<InputGroup>
				<InputGroupInput aria-label="Amount" defaultValue="12" />
				<InputGroupAddon align="inline-end">ms</InputGroupAddon>
			</InputGroup>,
		);
		const input = screen.getByRole<HTMLInputElement>("textbox", {
			name: "Amount",
		});
		input.setSelectionRange(0, 0);

		fireEvent.click(screen.getByText("ms"));

		expect(document.activeElement).toBe(input);
		expect(input.selectionStart).toBe(2);
		expect(input.selectionEnd).toBe(2);
	});

	it("focuses an input with no caret, such as a number input", () => {
		render(
			<InputGroup>
				<InputGroupAddon>$</InputGroupAddon>
				<InputGroupInput
					type="number"
					aria-label="Price"
					defaultValue="5"
				/>
			</InputGroup>,
		);

		fireEvent.click(screen.getByText("$"));

		expect(document.activeElement).toBe(
			screen.getByRole("spinbutton", { name: "Price" }),
		);
	});
});
