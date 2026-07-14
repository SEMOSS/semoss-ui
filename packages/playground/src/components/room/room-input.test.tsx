import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { RoomInput } from "./room-input";

// ---------------------------------------------------------------------------
// Fake editor state shared between mocks
// ---------------------------------------------------------------------------
let fakeEditorText = "";
let triggerOnChange: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@semoss/i18n", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/i18n")>();
	return {
		...actual,
		useTranslation: () => ({
			t: (key: string) => {
				const map: Record<string, string> = {
					"input.ariaPlaceholder": "Enter text",
					"input.askLabel": "Ask the AI",
					"input.thinking": "Thinking...",
					"input.menuPrompt": "What do you want to do today?",
				};
				return map[key] ?? key;
			},
			i18n: { language: "en" },
		}),
	};
});

vi.mock("@/contexts", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/contexts")>();
	return {
		...actual,
		useFileDrag: () => ({
			isDragging: false,
			setIsDragging: vi.fn(),
			shouldStayOpen: false,
			setShouldStayOpen: vi.fn(),
			files: [],
			addFiles: vi.fn(),
			removeFile: vi.fn(),
			clearFiles: vi.fn(),
			fileInputRef: { current: null },
			containerRef: { current: null },
		}),
	};
});

vi.mock("@/hooks", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/hooks")>();
	return {
		...actual,
		useRoot: () => ({ root: { theme: { featureFlags: {} } } }),
		useGracefulErrors: () => ({
			getGracefulErrorMessage: vi.fn((msg: string) => msg),
		}),
	};
});

// Mock $getRoot so promptModel can read fakeEditorText
vi.mock("lexical", async (importOriginal) => {
	const actual = await importOriginal<typeof import("lexical")>();
	return {
		...actual,
		$getRoot: vi.fn(() => ({
			getTextContent: () => fakeEditorText,
			getChildren: () =>
				fakeEditorText
					? [
							{
								getTextContent: () => fakeEditorText,
								getChildren: () => [
									{ getTextContent: () => fakeEditorText },
								],
							},
						]
					: [],
			clear: vi.fn(() => {
				fakeEditorText = "";
			}),
			append: vi.fn(),
		})),
		$createParagraphNode: vi.fn(() => ({ append: vi.fn() })),
		$createTextNode: vi.fn(),
		$isElementNode: vi.fn(() => true),
		$isSlashCommandNode: vi.fn(() => false),
	};
});

// Mock EditorRefPlugin to inject a fake editor that uses fakeEditorText
vi.mock("@lexical/react/LexicalEditorRefPlugin", () => ({
	EditorRefPlugin: ({
		editorRef,
	}: {
		editorRef: React.MutableRefObject<unknown>;
	}) => {
		React.useEffect(() => {
			editorRef.current = {
				getEditorState: () => ({ read: (cb: () => void) => cb() }),
				update: (cb: () => void) => cb(),
				focus: vi.fn(),
			};
		});
		return null;
	},
}));

// Mock OnChangePlugin to expose a trigger so tests can update isEmpty state
vi.mock("@lexical/react/LexicalOnChangePlugin", () => ({
	OnChangePlugin: ({
		onChange,
	}: {
		onChange: (state: { read: (cb: () => void) => void }) => void;
	}) => {
		triggerOnChange = () => onChange({ read: (cb) => cb() });
		React.useEffect(() => {
			triggerOnChange?.();
		}, []);
		return null;
	},
}));

// Mock EnterPlugin to listen for keydown directly (bypasses Lexical command system)
vi.mock("@/components/common/lexical/enter-plugin", () => ({
	EnterPlugin: ({ onEnter }: { onEnter: () => void }) => {
		React.useEffect(() => {
			const handler = (e: KeyboardEvent) => {
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					onEnter();
				}
			};
			document.addEventListener("keydown", handler);
			return () => document.removeEventListener("keydown", handler);
		}, [onEnter]);
		return null;
	},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
	isLoading: false,
	onPrompt: vi.fn(() => Promise.resolve(true)),
	model: null,
	setModel: vi.fn(),
	MenuComponent: () => React.createElement("div", null),
	options: {
		instructions: "",
		mcp: [],
		tokenLength: 4096,
		temperature: 0.5,
		workspace: null,
		predefinedPrompts: [],
	},
	// RoomInput only forwards `room` to a child; a minimal stub satisfies the type.
	room: {} as unknown as RoomStore,
};

/** Set fake editor text and trigger the OnChangePlugin callback to update isEmpty */
function setEditorText(text: string) {
	fakeEditorText = text;
	act(() => triggerOnChange?.());
}

beforeEach(() => {
	fakeEditorText = "";
	triggerOnChange = null;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("pressing Enter calls onPrompt with editor content", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));
	render(<RoomInput {...defaultProps} onPrompt={onPrompt} />);

	setEditorText("Hello world");

	fireEvent.keyDown(document, { key: "Enter", code: "Enter", bubbles: true });

	await vi.waitFor(() => expect(onPrompt).toHaveBeenCalledTimes(1));
	expect(onPrompt).toHaveBeenCalledWith("Hello world", []);
});

test("clicking send button calls onPrompt", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));
	render(<RoomInput {...defaultProps} onPrompt={onPrompt} />);

	setEditorText("Click send");

	const sendButton = screen.getByLabelText("Ask the AI");
	fireEvent.click(sendButton);

	await vi.waitFor(() => expect(onPrompt).toHaveBeenCalledTimes(1));
	expect(onPrompt).toHaveBeenCalledWith("Click send", []);
});

test("does not call onPrompt when loading", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));
	render(
		<RoomInput {...defaultProps} isLoading={true} onPrompt={onPrompt} />,
	);

	setEditorText("Should not send");

	fireEvent.keyDown(document, { key: "Enter", code: "Enter", bubbles: true });

	await new Promise((r) => setTimeout(r, 50));
	expect(onPrompt).not.toHaveBeenCalled();
});

test("shows toast when onPrompt returns false", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(false));
	toast.error = vi.fn();

	render(<RoomInput {...defaultProps} onPrompt={onPrompt} />);

	setEditorText("Will fail");

	const sendButton = screen.getByLabelText("Ask the AI");
	fireEvent.click(sendButton);

	await vi.waitFor(() => expect(toast.error).toHaveBeenCalled());
	expect(onPrompt).toHaveBeenCalledTimes(1);
});
