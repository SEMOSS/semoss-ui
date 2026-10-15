import { act, render, screen } from "@testing-library/react";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_HIGH,
	createEditor,
	KEY_ARROW_DOWN_COMMAND,
	KEY_ARROW_UP_COMMAND,
	KEY_ESCAPE_COMMAND,
	type LexicalEditor,
} from "lexical";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
	$createSlashCommandNode,
	SlashCommandNode,
} from "@/components/common/lexical/slash-command/node";
import { isAtEditorLineBoundary } from "./editor-line-boundary";
import { RESET_PROMPT_HISTORY_COMMAND } from "./prompt-history";
import { PromptHistoryPlugin } from "./prompt-history-plugin";

let editor: LexicalEditor;
let root: HTMLDivElement;

vi.mock("@lexical/react/LexicalComposerContext", () => ({
	useLexicalComposerContext: () => [editor],
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, values?: { index: number; total: number }) =>
			values ? `${key}: ${values.index}/${values.total}` : key,
	}),
}));
vi.mock("./editor-line-boundary", () => ({
	isAtEditorLineBoundary: vi.fn(() => true),
}));

const entries = [
	{ id: "new", text: "Newest prompt" },
	{ id: "old", text: "Older prompt" },
];

/** Commit an editor change before the next keyboard event. */
async function write(text: string): Promise<void> {
	await act(async () => {
		editor.update(
			() => {
				$getRoot()
					.clear()
					.append(
						$createParagraphNode().append($createTextNode(text)),
					);
				$getRoot().selectEnd();
			},
			{ discrete: true },
		);
	});
}

/** Dispatch through Lexical's real priority/selection handling. */
async function press(
	key: "up" | "down" | "escape",
	init: KeyboardEventInit = {},
): Promise<KeyboardEvent> {
	const event = new KeyboardEvent("keydown", { cancelable: true, ...init });
	await act(async () => {
		editor.dispatchCommand(
			key === "up"
				? KEY_ARROW_UP_COMMAND
				: key === "down"
					? KEY_ARROW_DOWN_COMMAND
					: KEY_ESCAPE_COMMAND,
			event,
		);
	});
	return event;
}

function text(): string {
	return editor.getEditorState().read(() => $getRoot().getTextContent());
}

beforeEach(async () => {
	vi.mocked(isAtEditorLineBoundary).mockReturnValue(true);
	root = document.createElement("div");
	root.contentEditable = "true";
	document.body.append(root);
	editor = createEditor({
		namespace: "history-test",
		nodes: [SlashCommandNode],
		onError: (error) => {
			throw error;
		},
	});
	editor.setRootElement(root);
	await write("Starting draft");
});
afterEach(() => {
	editor.setRootElement(null);
	root.remove();
});

test("replaces text newest-first, preserves edits, stops at oldest, and restores draft", async () => {
	render(<PromptHistoryPlugin entries={entries} />);
	await press("up");
	expect(text()).toBe("Newest prompt");
	expect(screen.getByRole("status")).toHaveTextContent("1/2");
	await write("Edited newest prompt");
	await press("up");
	expect(text()).toBe("Older prompt");
	await press("up");
	expect(text()).toBe("Older prompt");
	await press("down");
	expect(text()).toBe("Edited newest prompt");
	await press("down");
	expect(text()).toBe("Starting draft");
	expect(screen.getByRole("status")).toHaveTextContent("input.draftRestored");
	expect((await press("down")).defaultPrevented).toBe(false);
});

test("Escape restores the complete draft including slash nodes and selection", async () => {
	await act(async () =>
		editor.update(
			() => {
				$getRoot()
					.clear()
					.append(
						$createParagraphNode().append(
							$createSlashCommandNode("toolbox", "Tools"),
							$createTextNode(" draft"),
						),
					);
				$getRoot().selectEnd();
			},
			{ discrete: true },
		),
	);
	const draft = editor.getEditorState().toJSON();
	render(<PromptHistoryPlugin entries={entries} />);
	await press("up");
	await press("escape");
	expect(editor.getEditorState().toJSON()).toEqual(draft);
});

test("retains exact multiline text and places the caret at the end", async () => {
	render(
		<PromptHistoryPlugin
			entries={[{ id: "multiline", text: "one\ntwo\n" }]}
		/>,
	);
	await press("up");
	expect(text()).toBe("one\ntwo\n");
	editor.getEditorState().read(() => {
		const selection = $getSelection();
		expect($isRangeSelection(selection) && selection.isCollapsed()).toBe(
			true,
		);
		expect(selection?.getNodes().at(-1)?.getKey()).toBe(
			$getRoot().getLastDescendant()?.getKey(),
		);
	});
});

test("leaves ordinary cursor movement, selections, modifiers, and composition alone", async () => {
	render(<PromptHistoryPlugin entries={entries} />);
	vi.mocked(isAtEditorLineBoundary).mockReturnValue(false);
	expect((await press("up")).defaultPrevented).toBe(false);
	vi.mocked(isAtEditorLineBoundary).mockReturnValue(true);
	for (const init of [
		{ shiftKey: true },
		{ altKey: true },
		{ metaKey: true },
		{ ctrlKey: true },
		{ isComposing: true },
	]) {
		expect((await press("up", init)).defaultPrevented).toBe(false);
	}
	await act(async () =>
		editor.update(
			() => {
				$getRoot().select(0, 1);
			},
			{ discrete: true },
		),
	);
	expect((await press("up")).defaultPrevented).toBe(false);
	expect(text()).toBe("Starting draft");
});

test("slash suggestions handle arrows and Escape before prompt history", async () => {
	render(<PromptHistoryPlugin entries={entries} />);
	await press("up");
	const stopUp = editor.registerCommand(
		KEY_ARROW_UP_COMMAND,
		() => true,
		COMMAND_PRIORITY_HIGH,
	);
	const stopEscape = editor.registerCommand(
		KEY_ESCAPE_COMMAND,
		() => true,
		COMMAND_PRIORITY_HIGH,
	);
	await press("up");
	await press("escape");
	expect(text()).toBe("Newest prompt");
	stopUp();
	stopEscape();
	await press("escape");
	expect(text()).toBe("Starting draft");
});

test("submission resets browsing without overwriting failed-send recovery", async () => {
	render(<PromptHistoryPlugin entries={entries} />);
	await press("up");
	await act(async () => {
		editor.dispatchCommand(RESET_PROMPT_HISTORY_COMMAND, undefined);
	});
	await write("Failed message\nNew draft typed while waiting");
	await press("escape");
	expect(text()).toBe("Failed message\nNew draft typed while waiting");
});

test("a room or branch change resets history without replacing the visible draft", async () => {
	const { rerender } = render(
		<PromptHistoryPlugin key="room-a" entries={entries} />,
	);
	await press("up");
	const next = [{ id: "other", text: "Other room prompt" }];
	rerender(<PromptHistoryPlugin key="room-b" entries={next} />);
	await press("down");
	expect(text()).toBe("Newest prompt");
	await press("up");
	expect(text()).toBe("Other room prompt");
	await press("escape");
	expect(text()).toBe("Newest prompt");
});

test("empty history never intercepts Up", async () => {
	render(<PromptHistoryPlugin entries={[]} />);
	expect((await press("up")).defaultPrevented).toBe(false);
});
