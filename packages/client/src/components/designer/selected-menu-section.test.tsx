import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { Input } from "@semoss/ui/next";
import { SelectedMenuSection } from "./SelectedMenuSection";

const BLOCK_ID = "input-1";

const menu = [
	{
		name: "Content",
		children: [
			{
				description: "Label",
				render: ({ id }: { id: string }) => (
					<Input aria-label="Label" defaultValue={id} />
				),
			},
		],
	},
	{
		name: "Advanced",
		children: [
			{
				description: "Hint",
				render: () => <Input aria-label="Hint" />,
			},
		],
	},
];

function SettingsMenu() {
	const [accordion, setAccordion] = useState<Record<string, boolean>>({
		"section--0": true,
		"section--1": true,
	});
	return (
		<SelectedMenuSection
			id={BLOCK_ID}
			sectionTitle="Settings"
			menu={menu}
			accordion={accordion}
			setAccordion={setAccordion}
		/>
	);
}

afterEach(cleanup);

describe("settings sections", () => {
	test("collapses one section without resetting another section's draft or focus", () => {
		render(<SettingsMenu />);
		const label = screen.getByRole("textbox", { name: "Label" });
		expect(label).toHaveValue("input-1");
		fireEvent.change(label, { target: { value: "Unsaved label" } });

		const advanced = screen.getByRole("button", { name: "Advanced" });
		advanced.focus();
		fireEvent.click(advanced);
		expect(advanced).toHaveAttribute("aria-expanded", "false");
		expect(advanced).toHaveFocus();
		expect(screen.queryByRole("textbox", { name: "Hint" })).toBeNull();
		expect(screen.getByRole("textbox", { name: "Label" })).toBe(label);
		expect(label).toHaveValue("Unsaved label");

		fireEvent.click(advanced);
		expect(advanced).toHaveAttribute("aria-expanded", "true");
		const contentId = advanced.getAttribute("aria-controls");
		expect(contentId).toBeTruthy();
		expect(document.getElementById(contentId ?? "")).toContainElement(
			screen.getByRole("textbox", { name: "Hint" }),
		);
		expect(label).toHaveValue("Unsaved label");
	});

	test("gives repeated menus independent control IDs", () => {
		render(
			<>
				<SettingsMenu />
				<SettingsMenu />
			</>,
		);
		const buttons = screen.getAllByRole("button");
		const contentIds = buttons.map((button) =>
			button.getAttribute("aria-controls"),
		);
		expect(new Set(contentIds).size).toBe(buttons.length);
		for (const contentId of contentIds) {
			expect(
				document.getElementById(contentId ?? ""),
			).toBeInTheDocument();
		}
	});
});
