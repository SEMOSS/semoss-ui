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

export interface CodeDiffEditorProps {
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
	/** Additional Monaco diff-editor options merged on top of the defaults. */
	options?: monaco.editor.IDiffEditorConstructionOptions;
}

const DEFAULT_CODE_DIFF_EDITOR_OPTIONS: monaco.editor.IDiffEditorConstructionOptions =
	{
		automaticLayout: true,
		scrollBeyondLastLine: false,
		renderSideBySide: true,
		// off so the right-click reaches our ContextMenu instead of Monaco's own
		contextmenu: false,
	};

/**
 * Standardized, lazy-loaded Monaco diff editor tied to the app's light/dark
 * theme. For a single editor, use `CodeEditor` instead.
 */
export const CodeDiffEditor = React.forwardRef<
	monaco.editor.IStandaloneDiffEditor,
	CodeDiffEditorProps
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
			options,
		},
		ref,
	) => {
		const { resolvedTheme } = useTheme();
		const theme = resolvedTheme === "dark" ? "vs-dark" : "light";
		const modifiedEditorRef =
			React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
		const menuItemsRef = React.useRef(menuItems);
		menuItemsRef.current = menuItems;

		const editorOptions = {
			...DEFAULT_CODE_DIFF_EDITOR_OPTIONS,
			...(options ?? {}),
			readOnly: disabled || options?.readOnly === true,
		};

		const handleMount: DiffOnMount = (editor, monacoInstance) => {
			if (typeof ref === "function") {
				ref(editor);
			} else if (ref) {
				ref.current = editor;
			}

			const modifiedEditor = editor.getModifiedEditor();
			modifiedEditorRef.current = modifiedEditor;

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
						id: `code-diff-editor-menu.${item.id}`,
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
				options={editorOptions}
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
CodeDiffEditor.displayName = "CodeDiffEditor";
