import * as React from "react";
import {
	LazyMonacoEditor,
	type monaco,
	type OnChange,
	type OnMount,
} from "../lib/";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "./context-menu";
import { Kbd } from "./kbd";
import { toast } from "./sonner";
import { Spinner } from "./spinner";
import { useTheme } from "./theme-provider";

export interface CodeEditorMenuItem {
	/** Unique identifier for the menu item. */
	id: string;
	/** label shown in the context menu */
	label: string;
	/** Called with the live editor instance when the item is selected. */
	onSelect: (editor: monaco.editor.IStandaloneCodeEditor) => void;
	/** Whether the item is disabled. */
	disabled?: boolean;
	/** Text shown at the end of the context-menu row. */
	shortcut?: string;
	/** Render a separator after this item. */
	separator?: boolean;
	/** Monaco keybindings scoped to this editor instance. */
	keybindings?: (monacoInstance: typeof import("monaco-editor")) => number[];
}

export interface CodeEditorProps {
	className?: string;
	/** Editor contents (Monaco's `value`). */
	code: string;
	/** Renders the editor read-only (Monaco's `options.readOnly`). */
	disabled?: boolean;
	/** Fired on every content change (Monaco's `onChange` signature). */
	onChange?: OnChange;
	/** Monaco language id. */
	language?: string;
	/**
	 * Rendered as a `ContextMenu` on right-click, replacing Monaco's own. When
	 * omitted (or empty), no context menu is shown at all.
	 */
	menuItems?: CodeEditorMenuItem[];
	/**
	 * Registered via `monaco.languages.registerCompletionItemProvider()` for
	 * `language` on mount. Accepts one or more providers.
	 */
	completion?:
		| monaco.languages.CompletionItemProvider
		| monaco.languages.CompletionItemProvider[];
}

/** What Cut/Copy act on: the selection, or the whole line (newline included)
 *  when there is no selection — the way an editor is expected to behave. */
const getCopyRange = (
	editor: monaco.editor.IStandaloneCodeEditor,
): monaco.IRange | null => {
	const model = editor.getModel();
	const selection = editor.getSelection();
	if (!model || !selection) {
		return null;
	}
	if (!selection.isEmpty()) {
		return selection;
	}

	const line = selection.startLineNumber;
	const isLastLine = line >= model.getLineCount();
	return {
		startLineNumber: line,
		startColumn: 1,
		endLineNumber: isLastLine ? line : line + 1,
		endColumn: isLastLine ? model.getLineMaxColumn(line) : 1,
	};
};

const copySelection = (
	editor: monaco.editor.IStandaloneCodeEditor,
	cut: boolean,
) => {
	const model = editor.getModel();
	const range = getCopyRange(editor);
	if (!model || !range) {
		return;
	}

	const text = model.getValueInRange(range);
	if (!text) {
		return;
	}

	navigator.clipboard
		.writeText(text)
		.then(() => {
			if (cut) {
				editor.executeEdits("code-editor-menu", [{ range, text: "" }]);
			}
		})
		.catch(() => {
			toast.error("The browser blocked clipboard access");
		});
};

const pasteFromClipboard = (editor: monaco.editor.IStandaloneCodeEditor) => {
	navigator.clipboard
		.readText()
		.then((text) => {
			if (text) {
				editor.trigger("code-editor-menu", "paste", { text });
			}
		})
		.catch(() => {
			// e.g. Firefox does not expose clipboard reads to the page at all
			toast.error(
				"The browser blocked clipboard access — use Ctrl/Cmd+V",
			);
		});
};

/** Undo/Redo/Cut/Copy/Paste/Find/Replace — pass this (or spread it) as `menuItems`. */
export const DEFAULT_CODE_EDITOR_MENU_ITEMS: CodeEditorMenuItem[] = [
	{
		id: "find",
		label: "Find",
		onSelect: (editor) => editor.getAction("actions.find")?.run(),
	},
	{
		id: "replace",
		label: "Replace",
		separator: true,
		onSelect: (editor) =>
			editor.getAction("editor.action.startFindReplaceAction")?.run(),
	},
	{
		id: "undo",
		label: "Undo",
		onSelect: (editor) => editor.trigger("code-editor-menu", "undo", null),
	},
	{
		id: "redo",
		label: "Redo",
		separator: true,
		onSelect: (editor) => editor.trigger("code-editor-menu", "redo", null),
	},
	{
		id: "cut",
		label: "Cut",
		onSelect: (editor) => copySelection(editor, true),
	},
	{
		id: "copy",
		label: "Copy",
		onSelect: (editor) => copySelection(editor, false),
	},
	{
		id: "paste",
		label: "Paste",
		onSelect: pasteFromClipboard,
	},
];

/**
 * Standardized, lazy-loaded Monaco code editor tied to the app's light/dark
 * theme. For a side-by-side diff view, use `DiffCodeEditor` instead.
 */
export const CodeEditor = React.forwardRef<
	monaco.editor.IStandaloneCodeEditor,
	CodeEditorProps
>(
	(
		{
			className,
			code,
			disabled = false,
			onChange,
			language = "plaintext",
			menuItems,
			completion,
		},
		ref,
	) => {
		const { resolvedTheme } = useTheme();
		const theme = resolvedTheme === "dark" ? "vs-dark" : "light";
		const editorRef =
			React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
		const menuItemsRef = React.useRef(menuItems);
		menuItemsRef.current = menuItems;

		// completion is registered once, on mount, rather than kept in sync with
		// a dependency array — matches how @monaco-editor/react itself treats
		// `onMount` (invoked once when the editor is created).
		const onMount: OnMount = (editor, monacoInstance) => {
			editorRef.current = editor;
			if (typeof ref === "function") {
				ref(editor);
			} else if (ref) {
				ref.current = editor;
			}

			// F1 has no built-in "off" option — rebinding it to a no-op is how
			// Monaco's command palette gets disabled.
			editor.addCommand(monacoInstance.KeyCode.F1, () => {});

			const disposables: monaco.IDisposable[] = [];

			const completionProviders = completion
				? Array.isArray(completion)
					? completion
					: [completion]
				: [];
			for (const provider of completionProviders) {
				disposables.push(
					monacoInstance.languages.registerCompletionItemProvider(
						language,
						provider,
					),
				);
			}

			for (const item of menuItems ?? []) {
				if (!item.keybindings) {
					continue;
				}

				disposables.push(
					editor.addAction({
						id: `code-editor-menu.${item.id}`,
						label: item.label,
						keybindings: item.keybindings(monacoInstance),
						run: () => {
							const currentItem = menuItemsRef.current?.find(
								(candidate) => candidate.id === item.id,
							);
							if (!currentItem || currentItem.disabled) {
								return;
							}
							currentItem.onSelect(editor);
						},
					}),
				);
			}

			editor.onDidDispose(() => {
				for (const disposable of disposables) {
					disposable.dispose();
				}
			});
		};

		// Radix hands focus back to the trigger as the menu closes, so the
		// editor has to be refocused a tick later or the command lands on a
		// blurred editor and the cursor/selection is lost.
		const selectMenuItem = (item: CodeEditorMenuItem) => {
			window.setTimeout(() => {
				const editor = editorRef.current;
				if (!editor) {
					return;
				}
				editor.focus();
				item.onSelect(editor);
			}, 0);
		};

		return (
			<React.Suspense
				fallback={
					<div className="flex size-full items-center justify-center">
						<Spinner />
					</div>
				}
			>
				<ContextMenu>
					<ContextMenuTrigger asChild>
						<div className="size-full">
							<LazyMonacoEditor
								className={className}
								language={language}
								theme={theme}
								value={code}
								options={{
									readOnly: disabled,
									automaticLayout: true,
									scrollBeyondLastLine: false,
									// off so the right-click reaches our ContextMenu instead of Monaco's own
									contextmenu: false,
								}}
								onChange={onChange}
								onMount={onMount}
							/>
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent className="min-w-48">
						{menuItems?.map((item) => (
							<React.Fragment key={item.id}>
								<ContextMenuItem
									disabled={item.disabled}
									onSelect={() => selectMenuItem(item)}
								>
									{item.label}
									{item.shortcut && (
										<ContextMenuShortcut>
											<Kbd className="tracking-normal">
												{item.shortcut}
											</Kbd>
										</ContextMenuShortcut>
									)}
								</ContextMenuItem>
								{item.separator && <ContextMenuSeparator />}
							</React.Fragment>
						))}
					</ContextMenuContent>
				</ContextMenu>
			</React.Suspense>
		);
	},
);
CodeEditor.displayName = "CodeEditor";
