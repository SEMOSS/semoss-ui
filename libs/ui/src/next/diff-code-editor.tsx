import * as React from "react";
import { type DiffOnMount, LazyMonacoDiffEditor, type monaco } from "../lib/";
import type { CodeEditorMenuItem } from "./code-editor";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "./context-menu";
import { Kbd } from "./kbd";
import { Spinner } from "./spinner";
import { useTheme } from "./theme-provider";

export interface DiffCodeEditorProps {
	className?: string;
	/** Left/reference side (Monaco's `original`). */
	original: string;
	/** Right/editable side (Monaco's `modified`). */
	modified: string;
	/** Renders the modified side read-only (Monaco's `options.readOnly`). */
	disabled?: boolean;
	/**
	 * Fired when the modified side's content changes. `@monaco-editor/react`'s
	 * `DiffEditor` has no native `onChange` prop, so this is wired manually via
	 * the modified editor's `onDidChangeModelContent`.
	 */
	onChange?: (
		value: string | undefined,
		event: monaco.editor.IModelContentChangedEvent,
	) => void;
	/** Monaco language id, shared by both sides. */
	language?: string;
	/**
	 * Rendered as a `ContextMenu` on the modified editor's right-click,
	 * replacing Monaco's own. When omitted (or empty), no context menu is
	 * shown at all. The original side is the read-only reference and isn't
	 * actionable.
	 */
	menuItems?: CodeEditorMenuItem[];
	/**
	 * Registered via `monaco.languages.registerCompletionItemProvider()` for
	 * `language` on mount. Applies to both sides since they share a language.
	 */
	completion?:
		| monaco.languages.CompletionItemProvider
		| monaco.languages.CompletionItemProvider[];
}

const OPTIONS: monaco.editor.IDiffEditorConstructionOptions = {
	automaticLayout: true,
	scrollBeyondLastLine: false,
	// off so the right-click reaches our ContextMenu instead of Monaco's own
	contextmenu: false,
};

/**
 * Standardized, lazy-loaded Monaco diff editor tied to the app's light/dark
 * theme. For a single editor, use `CodeEditor` instead.
 */
export const DiffCodeEditor = React.forwardRef<
	monaco.editor.IStandaloneDiffEditor,
	DiffCodeEditorProps
>(
	(
		{
			className,
			original,
			modified,
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
		const modifiedEditorRef =
			React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
		const menuItemsRef = React.useRef(menuItems);
		menuItemsRef.current = menuItems;

		// completion is registered once, on mount, rather than kept in sync with
		// a dependency array — matches how @monaco-editor/react itself treats
		// `onMount` (invoked once when the editor is created).
		const handleMount: DiffOnMount = (editor, monacoInstance) => {
			if (typeof ref === "function") {
				ref(editor);
			} else if (ref) {
				ref.current = editor;
			}

			const modifiedEditor = editor.getModifiedEditor();
			modifiedEditorRef.current = modifiedEditor;

			// F1 has no built-in "off" option — rebinding it to a no-op is how
			// Monaco's command palette gets disabled.
			modifiedEditor.addCommand(monacoInstance.KeyCode.F1, () => {});
			editor
				.getOriginalEditor()
				.addCommand(monacoInstance.KeyCode.F1, () => {});

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

			if (onChange) {
				disposables.push(
					modifiedEditor.onDidChangeModelContent((event) => {
						onChange(modifiedEditor.getValue(), event);
					}),
				);
			}

			for (const item of menuItems ?? []) {
				if (!item.keybindings) {
					continue;
				}

				disposables.push(
					modifiedEditor.addAction({
						id: `diff-code-editor-menu.${item.id}`,
						label: item.label,
						keybindings: item.keybindings(monacoInstance),
						run: () => {
							const currentItem = menuItemsRef.current?.find(
								(candidate) => candidate.id === item.id,
							);
							if (!currentItem || currentItem.disabled) {
								return;
							}
							currentItem.onSelect(modifiedEditor);
						},
					}),
				);
			}

			modifiedEditor.onDidDispose(() => {
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
				const editor = modifiedEditorRef.current;
				if (!editor) {
					return;
				}
				editor.focus();
				item.onSelect(editor);
			}, 0);
		};

		const editorElement = (
			<LazyMonacoDiffEditor
				className={className}
				language={language}
				theme={theme}
				original={original}
				modified={modified}
				options={{ ...OPTIONS, readOnly: disabled }}
				onMount={handleMount}
			/>
		);

		return (
			<React.Suspense
				fallback={
					<div className="flex size-full items-center justify-center">
						<Spinner />
					</div>
				}
			>
				{menuItems && menuItems.length > 0 ? (
					<ContextMenu>
						<ContextMenuTrigger asChild>
							<div className="size-full">{editorElement}</div>
						</ContextMenuTrigger>
						<ContextMenuContent>
							{menuItems.map((item) => (
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
				) : (
					editorElement
				)}
			</React.Suspense>
		);
	},
);
DiffCodeEditor.displayName = "DiffCodeEditor";
