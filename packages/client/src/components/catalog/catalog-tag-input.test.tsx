import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogTagInput } from "./catalog-tag-input";

const OPTIONS = ["Confidential Allowed", "FOUO Allowed", "PII Allowed"];

beforeEach(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	// jsdom does not scroll
	Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

/** Renders the field with the given tags already picked. */
const renderInput = (value: string[] = []) => {
	const onChange = vi.fn();
	render(
		<CatalogTagInput
			value={value}
			onChange={onChange}
			placeholder="Press enter to add data restrictions"
			options={OPTIONS}
		/>,
	);
	return { onChange, input: screen.getByRole("combobox") };
};

describe("CatalogTagInput", () => {
	it("suggests the options not picked yet that match what is typed", () => {
		const { input } = renderInput(["Confidential Allowed"]);
		fireEvent.change(input, { target: { value: "allowed" } });
		expect(
			screen.getAllByRole("option").map((option) => option.textContent),
		).toEqual(["FOUO Allowed", "PII Allowed"]);
	});

	it("adds the suggestion picked with the arrow keys, or else the text typed", () => {
		const { input, onChange } = renderInput();
		fireEvent.change(input, { target: { value: "pii" } });
		fireEvent.keyDown(input, { key: "ArrowDown" });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onChange).toHaveBeenLastCalledWith(["PII Allowed"]);

		fireEvent.change(input, { target: { value: "Secret" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onChange).toHaveBeenLastCalledWith(["Secret"]);
	});

	it("adds a suggestion that is clicked", () => {
		const { input, onChange } = renderInput();
		fireEvent.click(input);
		fireEvent.click(screen.getByRole("option", { name: "FOUO Allowed" }));
		expect(onChange).toHaveBeenCalledWith(["FOUO Allowed"]);
	});

	it("removes a tag with its remove button", () => {
		const { onChange } = renderInput(["Confidential Allowed"]);
		fireEvent.click(
			screen.getByRole("button", { name: "Remove Confidential Allowed" }),
		);
		expect(onChange).toHaveBeenCalledWith([]);
	});
});
