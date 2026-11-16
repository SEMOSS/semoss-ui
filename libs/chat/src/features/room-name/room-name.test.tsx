import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { RoomName } from "./room-name";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

/** A name whose owner keeps the editing state, as the sidebar and header do. */
function OwnedName({
	name,
	onRename,
	onStopRename = () => {},
}: {
	name: string;
	onRename: (name: string) => Promise<boolean>;
	onStopRename?: (shouldRefocus: boolean) => void;
}) {
	const [isRenaming, setIsRenaming] = useState(false);
	return (
		<RoomName
			name={name}
			placeholder="Untitled"
			isRenaming={isRenaming}
			onStartRename={() => setIsRenaming(true)}
			onRename={onRename}
			onStopRename={(shouldRefocus) => {
				onStopRename(shouldRefocus);
				setIsRenaming(false);
			}}
		/>
	);
}

test("a blank name shows its placeholder", () => {
	render(<OwnedName name="" onRename={vi.fn()} />);
	expect(screen.getByText("Untitled")).toBeVisible();
});

test("a double-click edits the name in place, and Enter saves it", async () => {
	const user = userEvent.setup();
	const onRename = vi.fn().mockResolvedValue(true);
	const onStopRename = vi.fn();
	render(
		<OwnedName
			name="Quarterly plan"
			onRename={onRename}
			onStopRename={onStopRename}
		/>,
	);
	expect(screen.queryByRole("textbox")).toBeNull();

	await user.dblClick(screen.getByText("Quarterly plan"));
	const field = screen.getByRole("textbox", { name: "header.renameLabel" });
	expect(field).toHaveFocus();
	expect(field).toHaveValue("Quarterly plan");
	await user.clear(field);
	await user.type(field, "Q3 plan{Enter}");

	expect(onRename).toHaveBeenCalledWith("Q3 plan");
	expect(onStopRename).toHaveBeenCalledWith(true);
	expect(screen.queryByRole("textbox")).toBeNull();
});

test("Escape keeps the old name without saving", async () => {
	const user = userEvent.setup();
	const onRename = vi.fn();
	render(<OwnedName name="Quarterly plan" onRename={onRename} />);
	await user.dblClick(screen.getByText("Quarterly plan"));
	await user.type(screen.getByRole("textbox"), " draft{Escape}");
	expect(onRename).not.toHaveBeenCalled();
	expect(screen.getByText("Quarterly plan")).toBeVisible();
});

test("a refused name keeps the field open", async () => {
	const user = userEvent.setup();
	const onRename = vi.fn().mockResolvedValue(false);
	render(<OwnedName name="Quarterly plan" onRename={onRename} />);
	await user.dblClick(screen.getByText("Quarterly plan"));
	const field = screen.getByRole("textbox");
	await user.clear(field);
	await user.type(field, "{Enter}");
	expect(onRename).toHaveBeenCalledWith("");
	expect(field).toBeVisible();
});
