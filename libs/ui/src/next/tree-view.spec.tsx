import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TreeView, TreeViewItem } from "./tree-view";

afterEach(cleanup);

/** The tree's item ids, which are also its expansion keys. */
const FOLDER_ID = "reports";
const FILE_ID = "q3";

/** A folder with one file in it, its expansion held the way a host holds it. */
const Folder = ({
	loading = false,
	onExpandChange,
}: {
	loading?: boolean;
	onExpandChange: (expanded: string[]) => void;
}) => {
	const [expanded, setExpanded] = useState<string[]>([]);
	return (
		<TreeView
			expanded={expanded}
			onExpandChange={(next) => {
				setExpanded(next);
				onExpandChange(next);
			}}
		>
			<TreeViewItem
				id={FOLDER_ID}
				item={FOLDER_ID}
				label="Reports"
				loading={loading}
			>
				<TreeViewItem id={FILE_ID} item={FILE_ID} label="q3.xlsx" />
			</TreeViewItem>
		</TreeView>
	);
};

describe("TreeViewItem", () => {
	it("leaves keyboard focus on the row that was clicked", () => {
		render(<Folder onExpandChange={vi.fn()} />);
		const row = screen.getByRole("button", { name: "Reports" });

		fireEvent.click(row);

		expect(document.activeElement).toBe(row);
	});

	it("toggles once per chevron press, leaving Enter and Space to the native click", () => {
		const onExpandChange = vi.fn();
		render(<Folder onExpandChange={onExpandChange} />);
		const chevron = screen.getByRole("button", { name: "Expand" });

		fireEvent.keyDown(chevron, { key: "Enter" });
		expect(onExpandChange).not.toHaveBeenCalled();

		fireEvent.click(chevron);
		expect(onExpandChange).toHaveBeenCalledTimes(1);
		expect(onExpandChange).toHaveBeenCalledWith([FOLDER_ID]);
	});

	it("keeps focus on a loading item's chevron and ignores its clicks", () => {
		const onExpandChange = vi.fn();
		render(<Folder loading onExpandChange={onExpandChange} />);
		const chevron = screen.getByRole("button", { name: "Expand" });

		expect(chevron.hasAttribute("disabled")).toBe(false);
		expect(chevron.getAttribute("aria-disabled")).toBe("true");

		fireEvent.click(chevron);

		expect(document.activeElement).toBe(chevron);
		expect(onExpandChange).not.toHaveBeenCalled();
	});
});
