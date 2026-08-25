import {
	LockIcon,
	RefreshCwIcon,
	UnlockIcon,
	WrapTextIcon,
} from "lucide-react";
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { usePixel } from "@semoss/sdk/react";
import { MonacoEditor, type monaco, type OnMount } from "@semoss/shared";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
	Label,
	Muted,
	Spinner,
	Toggle,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useTheme,
} from "@semoss/ui/next";
import {
	updateDatabaseSmssProperties,
	updateProjectSmssProperties,
} from "@/api";
import { useSettings } from "@/hooks";
import type { ALL_TYPES } from "@/types";

/** Pinned so the measured height and the rendered lines cannot drift apart. */
const EDITOR_LINE_HEIGHT = 18;
const MIN_EDITOR_HEIGHT = 240;
const MAX_EDITOR_HEIGHT = 720;

const clampEditorHeight = (height: number) =>
	Math.min(MAX_EDITOR_HEIGHT, Math.max(MIN_EDITOR_HEIGHT, height));

// The menu below replaces Monaco's own, so the shortcut hints are ours to
// label. Monaco keys replace off alt on a mac and off h everywhere else.
const IS_MAC =
	typeof navigator !== "undefined" && navigator.userAgent.includes("Mac");
const MODIFIER_KEY = IS_MAC ? "Cmd" : "Ctrl";
const REPLACE_SHORTCUT = IS_MAC ? "Cmd+Alt+F" : "Ctrl+H";

interface UpdateSMSSFormProps {
	/**
	 * Type of setting
	 */
	type: ALL_TYPES;

	/**
	 * Id of the setting
	 */
	id: string;
}

export const UpdateSMSS: React.FC<UpdateSMSSFormProps> = ({ type, id }) => {
	const { adminMode } = useSettings();
	const { resolvedTheme } = useTheme();

	const [value, setValue] = useState("");
	const [readOnly, setReadOnly] = useState(true);
	const [wordWrap, setWordWrap] = useState(false);
	const [contentHeight, setContentHeight] = useState<number | null>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

	const getSMSS = usePixel<string>(
		type === "DATABASE" ||
			type === "STORAGE" ||
			type === "MODEL" ||
			type === "VECTOR" ||
			type === "GUARDRAIL" ||
			type === "FUNCTION"
			? adminMode
				? `AdminGetEngineSMSS(engine=['${id}'])`
				: `GetEngineSMSS(engine=['${id}'])`
			: type === "PROJECT"
				? adminMode
					? `AdminGetProjectSMSS(project=['${id}'])`
					: `GetProjectSMSS(project=['${id}'])`
				: "",
	);

	useEffect(() => {
		if (getSMSS.status !== "SUCCESS") {
			return;
		}

		setValue(getSMSS.data);
	}, [getSMSS.status, getSMSS.data]);

	// Sizes the loading and error placeholders, and the editor until it reports
	// what it actually laid out. Counts logical lines, so it undercounts once
	// word wrap splits them - the mounted editor corrects that.
	const estimatedHeight = useMemo(() => {
		const lineCount = Math.max(1, value.split(/\r?\n/).length);
		// Must match the lineHeight passed to Monaco below, or the container is
		// sized for taller lines than are rendered and the difference shows up as
		// blank space under the last line.
		const LINE_HEIGHT = EDITOR_LINE_HEIGHT;
		// Room for the horizontal scrollbar.
		const BASE_PADDING = 24;

		return clampEditorHeight(lineCount * LINE_HEIGHT + BASE_PADDING);
	}, [value]);

	const editorHeight = `${clampEditorHeight(contentHeight ?? estimatedHeight)}px`;

	// Word wrap turns one long property - INIT_MODEL_ENGINE especially - into
	// several visual lines, so the container has to follow what Monaco laid out
	// or the wrapped text hides behind a vertical scrollbar. Monaco's content
	// height already accounts for the horizontal scrollbar when there is one.
	const handleEditorMount = useCallback<OnMount>((editor) => {
		editorRef.current = editor;

		const syncContentHeight = () => {
			setContentHeight(editor.getContentHeight());
		};

		syncContentHeight();
		editor.onDidContentSizeChange(syncContentHeight);
	}, []);

	/**
	 * Radix hands focus back to the trigger as the menu closes, so the editor
	 * has to be refocused a tick later or the command lands on a blurred
	 * editor and the cursor position is lost.
	 */
	const withEditor = (
		run: (editor: monaco.editor.IStandaloneCodeEditor) => void,
	) => {
		window.setTimeout(() => {
			const editor = editorRef.current;
			if (!editor) {
				return;
			}

			editor.focus();
			run(editor);
		}, 0);
	};

	/**
	 * What cut and copy act on: the selection, or the whole line - its newline
	 * included - when there is no selection, the way an editor is expected to
	 * behave. Both share the range so a cut always removes exactly what it put
	 * on the clipboard.
	 */
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

	const copySelection = (cut: boolean) => {
		withEditor(async (editor) => {
			const model = editor.getModel();
			const range = getCopyRange(editor);
			if (!model || !range) {
				return;
			}

			const text = model.getValueInRange(range);
			if (!text) {
				return;
			}

			try {
				await navigator.clipboard.writeText(text);
			} catch {
				toast.error("The browser blocked clipboard access");
				return;
			}

			if (cut) {
				editor.executeEdits("smss-context-menu", [{ range, text: "" }]);
			}
		});
	};

	const pasteFromClipboard = () => {
		withEditor(async (editor) => {
			let text = "";
			try {
				text = await navigator.clipboard.readText();
			} catch {
				// firefox does not expose clipboard reads to the page at all
				toast.error(
					`The browser blocked clipboard access - use ${MODIFIER_KEY}+V to paste`,
				);
				return;
			}

			if (text) {
				editor.trigger("smss-context-menu", "paste", { text });
			}
		});
	};

	const runEditorAction = (actionId: string) => {
		withEditor((editor) => {
			editor.getAction(actionId)?.run();
		});
	};

	/**
	 * @name updateSMSSProperties
	 * @desc hit endpoint to update smss file
	 */
	const updateSMSSProperties = async () => {
		try {
			let response = null;
			if (type === "PROJECT") {
				response = await updateProjectSmssProperties(id, value);
			} else {
				response = await updateDatabaseSmssProperties(id, value);
			}

			if (!response) {
				throw Error("No Response from server");
			}

			if (response.data.success) {
				setReadOnly(true);
				// refresh it
				getSMSS.refresh();

				toast.success("Successfully updated SMSS Properties");
			} else {
				toast.error("Unable to update SMSS Properties");
			}
		} catch (error) {
			toast.error(`${error}: Unable to update SMSS Properties`);
		}
	};

	return (
		<div className="w-full overflow-hidden rounded-md border border-input bg-transparent dark:bg-input/30">
			<div className="flex w-full flex-row items-center gap-1 border-input border-b bg-muted px-4 py-2 text-muted-foreground">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => getSMSS.refresh()}
						>
							<RefreshCwIcon className="size-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Refresh</TooltipContent>
				</Tooltip>
				<Label className="flex-1 truncate">SMSS Editor</Label>
				<Tooltip>
					<TooltipTrigger asChild>
						<Toggle
							aria-label={
								wordWrap
									? "Disable Word Wrap"
									: "Enable Word Wrap"
							}
							size="sm"
							pressed={wordWrap}
							onPressedChange={setWordWrap}
							data-test-id="updateSMSS-wordWrap-btn"
						>
							<WrapTextIcon />
						</Toggle>
					</TooltipTrigger>
					<TooltipContent>Word Wrap</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							aria-label={
								readOnly ? "Unlock Editor" : "Lock Editor"
							}
							variant="ghost"
							size="icon-sm"
							onClick={() => {
								const updated = !readOnly;
								if (updated) {
									setValue(getSMSS.data);
								}
								setReadOnly(!readOnly);
							}}
							data-test-id="updateSMSS-updateSNSS-btn"
						>
							{readOnly ? <LockIcon /> : <UnlockIcon />}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{readOnly ? "Unlock" : "Lock"}
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							aria-label={"Update SMSS Properties"}
							disabled={readOnly || getSMSS.data === value}
							size="sm"
							onClick={() => {
								updateSMSSProperties();
							}}
							data-test-id="updateSMSS-editSNSS-btn"
						>
							Save
						</Button>
					</TooltipTrigger>
					<TooltipContent>Save</TooltipContent>
				</Tooltip>
			</div>

			<Suspense
				fallback={
					<div
						className="flex w-full items-center justify-center"
						style={{ height: editorHeight }}
					>
						<Spinner />
					</div>
				}
			>
				{getSMSS.status === "LOADING" && (
					<div
						className="flex w-full items-center justify-center"
						style={{ height: editorHeight }}
					>
						<Spinner />
					</div>
				)}
				{getSMSS.status === "ERROR" && (
					<div
						className="flex w-full items-center justify-center"
						style={{ height: editorHeight }}
					>
						<Muted className="text-destructive">
							{getSMSS.error?.message || "Failed to load SMSS"}
						</Muted>
					</div>
				)}
				{getSMSS.status === "SUCCESS" && (
					<ContextMenu>
						<ContextMenuTrigger asChild>
							<div className="w-full">
								<MonacoEditor
									width={"100%"}
									height={editorHeight}
									theme={
										resolvedTheme === "dark"
											? "vs-dark"
											: "vs"
									}
									options={{
										lineHeight: EDITOR_LINE_HEIGHT,
										minimap: {
											enabled: false,
										},
										scrollBeyondLastLine: false,
										readOnly: readOnly,
										// off so the right-click reaches the menu
										// below instead. Monaco still moves the
										// cursor to the click, and it leaves the
										// event alone for the trigger to pick up
										contextmenu: false,
										wordWrap: wordWrap ? "on" : "off",
										// the wrap column follows the editor
										// width, so the lines have to be re-laid
										// out when the panel resizes
										automaticLayout: true,
										scrollbar: {
											alwaysConsumeMouseWheel: false,
										},
									}}
									value={value}
									language={"plaintext"}
									onMount={handleEditorMount}
									onChange={(newValue) => {
										setValue(newValue || "");
									}}
									data-test-id="SMSS-editor"
								/>
							</div>
						</ContextMenuTrigger>
						<ContextMenuContent
							className="w-52"
							data-test-id="SMSS-editor-menu"
						>
							{/*
							 * The editing items lead with a lock while the editor
							 * is read-only so their disabled state reads as "unlock
							 * first" rather than as broken, and the items that stay
							 * enabled are inset by the width that lock occupies so
							 * the labels hold one column either way. The inset has
							 * to fall back to undefined rather than false: the kit
							 * renders it as a data attribute, and data-inset="false"
							 * still matches the selector that pads the item.
							 */}
							<ContextMenuItem
								disabled={readOnly}
								onSelect={() => copySelection(true)}
							>
								{readOnly && <LockIcon />}
								Cut
								<ContextMenuShortcut>
									{`${MODIFIER_KEY}+X`}
								</ContextMenuShortcut>
							</ContextMenuItem>
							<ContextMenuItem
								inset={readOnly || undefined}
								onSelect={() => copySelection(false)}
							>
								Copy
								<ContextMenuShortcut>
									{`${MODIFIER_KEY}+C`}
								</ContextMenuShortcut>
							</ContextMenuItem>
							<ContextMenuItem
								disabled={readOnly}
								onSelect={pasteFromClipboard}
							>
								{readOnly && <LockIcon />}
								Paste
								<ContextMenuShortcut>
									{`${MODIFIER_KEY}+V`}
								</ContextMenuShortcut>
							</ContextMenuItem>
							<ContextMenuSeparator />
							<ContextMenuItem
								inset={readOnly || undefined}
								onSelect={() => runEditorAction("actions.find")}
							>
								Find
								<ContextMenuShortcut>
									{`${MODIFIER_KEY}+F`}
								</ContextMenuShortcut>
							</ContextMenuItem>
							<ContextMenuItem
								disabled={readOnly}
								onSelect={() =>
									runEditorAction(
										"editor.action.startFindReplaceAction",
									)
								}
							>
								{readOnly && <LockIcon />}
								Replace
								<ContextMenuShortcut>
									{REPLACE_SHORTCUT}
								</ContextMenuShortcut>
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				)}
			</Suspense>
		</div>
	);
};
