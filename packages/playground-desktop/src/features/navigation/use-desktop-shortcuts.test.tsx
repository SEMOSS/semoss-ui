import { fireEvent, render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import {
	type DesktopShortcuts,
	useDesktopShortcuts,
} from "./use-desktop-shortcuts";

/** Mounts the shortcuts, with a dialog to type into. */
const Harness = (props: DesktopShortcuts) => {
	useDesktopShortcuts(props);
	return (
		<div role="dialog" aria-label="A dialog">
			<input aria-label="In the dialog" />
		</div>
	);
};

// jsdom is no Mac, so the shortcuts take Ctrl
test("Ctrl+N starts a new chat and Ctrl+, opens settings", () => {
	const onNewChat = vi.fn();
	const onOpenSettings = vi.fn();
	render(<Harness onNewChat={onNewChat} onOpenSettings={onOpenSettings} />);

	fireEvent.keyDown(document.body, { key: "n", ctrlKey: true });
	fireEvent.keyDown(document.body, { key: ",", ctrlKey: true });
	expect(onNewChat).toHaveBeenCalledTimes(1);
	expect(onOpenSettings).toHaveBeenCalledTimes(1);
});

test("other chords, held keys and dialogs keep their keys", () => {
	const onNewChat = vi.fn();
	const onOpenSettings = vi.fn();
	const { getByLabelText } = render(
		<Harness onNewChat={onNewChat} onOpenSettings={onOpenSettings} />,
	);

	fireEvent.keyDown(document.body, { key: "n" });
	fireEvent.keyDown(document.body, {
		key: "N",
		ctrlKey: true,
		shiftKey: true,
	});
	fireEvent.keyDown(document.body, { key: "n", ctrlKey: true, repeat: true });
	fireEvent.keyDown(getByLabelText("In the dialog"), {
		key: "n",
		ctrlKey: true,
	});
	expect(onNewChat).not.toHaveBeenCalled();
	expect(onOpenSettings).not.toHaveBeenCalled();
});

test("unmounting stops the shortcuts", () => {
	const onNewChat = vi.fn();
	const { unmount } = render(
		<Harness onNewChat={onNewChat} onOpenSettings={vi.fn()} />,
	);
	unmount();
	fireEvent.keyDown(document.body, { key: "n", ctrlKey: true });
	expect(onNewChat).not.toHaveBeenCalled();
});
