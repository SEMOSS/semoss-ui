import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { InputSettings } from "./InputSettings";

const mocks = vi.hoisted(() => ({
	data: { activeTab: 0 },
	setData: vi.fn(),
}));

vi.mock("@/hooks/useBlockSettings", () => ({
	useBlockSettings: () => mocks,
}));

test("enforces a numeric minimum without requiring a maximum", async () => {
	const blockId = "tabs";
	render(
		<InputSettings
			id={blockId}
			label="Active Tab"
			path="activeTab"
			type="number"
			min={0}
		/>,
	);

	const input = screen.getByRole("spinbutton", { name: "Active Tab" });
	expect(input).toHaveAttribute("min", "0");
	fireEvent.change(input, { target: { value: "-1" } });
	expect(input).toHaveValue(0);
	expect(mocks.setData).not.toHaveBeenCalled();

	fireEvent.change(input, { target: { value: "2" } });
	await waitFor(() =>
		expect(mocks.setData).toHaveBeenCalledWith("activeTab", 2),
	);
});
