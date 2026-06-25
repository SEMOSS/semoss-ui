import type { OnMount } from "@monaco-editor/react";
import {
	AlertCircleIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	DownloadIcon,
	RefreshCwIcon,
	SaveIcon,
} from "lucide-react";
import type * as monaco from "monaco-editor";
import {
	forwardRef,
	Suspense,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import { download, runPixel, useInsight, usePixel } from "@semoss/sdk/react";
import { Button, Muted, Spinner, toast } from "@semoss/ui/next";
import {
	MONACO_CONFIG,
	MONACO_EXT_LANGUAGE_MAPPING,
	MonacoEditor,
} from "../monaco";
import type { FileMode } from "./file.types";
import {
	getFileEditorPathScope,
	useFileEditorPathRef,
} from "./file-editor-path-events";
import { getFileOperationErrorMessage } from "./file-explorer.utils";

export interface FileCodeEditorActions {
	save: () => Promise<void>;
	refresh: () => void;
	download: () => Promise<void>;
}

interface FileCodeEditorProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/**
	 * Calback when the file is changed
	 * @param isModified
	 * @returns
	 */
	onChange?: (content: string, isModified: boolean) => void;

	/** Optional content rendered at the start of the toolbar row */
	leadingToolbar?: React.ReactNode;

	/**
	 * Optional handler invoked when the user runs the file via Ctrl/Cmd+Enter
	 * (or the editor context menu). When omitted, no run keybinding is added.
	 */
	onRun?: () => void;

	/** When true, the built-in toolbar (Refresh/Save/Download) is not rendered.
	 *  Use this when the parent renders its own unified toolbar. */
	hideToolbar?: boolean;
}

export const FileCodeEditor = forwardRef<
	FileCodeEditorActions,
	FileCodeEditorProps
>(
	(
		{
			mode,
			path,
			onChange = () => null,
			leadingToolbar,
			onRun,
			hideToolbar = false,
		},
		actionsRef,
	) => {
		const insight = useInsight();
		const { t } = useTranslation("common");
		const [isLoading, setIsLoading] = useState(false);
		// The Monaco run action is wired once on mount; read the latest onRun
		// through a ref so the keybinding always calls the current handler.
		const onRunRef = useRef(onRun);
		onRunRef.current = onRun;
		const targetInsightId =
			mode.type === "INSIGHT"
				? mode.insightId || insight.insightId
				: insight.insightId;
		const pathScope = getFileEditorPathScope(mode, targetInsightId);

		const currentPathRef = useFileEditorPathRef(path, pathScope);
		const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
			null,
		);
		const monacoRef = useRef<typeof monaco | null>(null);
		const wordWrapRef = useRef<boolean>(false);
		const decorationsRef = useRef<string[]>([]);
		const [jsonErrors, setJsonErrors] = useState<monaco.editor.IMarker[]>(
			[],
		);
		const [errorsExpanded, setErrorsExpanded] = useState(true);

		let getFilePixel = "";
		if (mode.type === "APP") {
			getFilePixel = `GetAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
		} else if (mode.type === "ENGINE") {
			getFilePixel = `GetEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
		} else if (mode.type === "INSIGHT" && targetInsightId) {
			getFilePixel = `GetInsightAssets(filePath=["${path}"]);`;
		} else if (mode.type === "USER") {
			getFilePixel = `GetUserAssets(filePath=["${path}"]);`;
		}

		const getFile = usePixel<string>(getFilePixel, {}, targetInsightId);

		// get the language
		const ext = path.split(".").pop()?.toLowerCase() || "";
		const language = MONACO_EXT_LANGUAGE_MAPPING[ext] || "plaintext";

		/**
		 * Pick the right Monaco theme for the current app theme. Dark mode forces
		 * `vs-dark` so the editor doesn't glow white against a dark UI; in light
		 * mode we fall back to the language-specific `*-smss-theme` if defined,
		 * otherwise plain `light`.
		 */
		const computeMonacoTheme = useCallback(
			(hasLanguageTheme: boolean): string => {
				const isDark =
					typeof document !== "undefined" &&
					document.documentElement.classList.contains("dark");
				if (isDark) return "vs-dark";
				if (hasLanguageTheme) return `${language}-smss-theme`;
				return "light";
			},
			[language],
		);

		// Re-apply the Monaco theme whenever the app theme toggles. We watch
		// the document element's class list since ThemeProvider drives `.dark`
		// there — this catches "system"-mode users whose OS preference flips
		// between light/dark as well as explicit Light/Dark toggles.
		useEffect(() => {
			const root =
				typeof document !== "undefined"
					? document.documentElement
					: null;
			if (!root) return;
			const apply = () => {
				const monacoNs = monacoRef.current;
				if (!monacoNs) return;
				const config = MONACO_CONFIG[language];
				monacoNs.editor.setTheme(computeMonacoTheme(!!config?.theme));
			};
			apply();
			const observer = new MutationObserver(apply);
			observer.observe(root, {
				attributes: true,
				attributeFilter: ["class"],
			});
			return () => observer.disconnect();
		}, [language, computeMonacoTheme]);

		/**
		 * Handler called when the editor is mounted
		 */
		const onMount: OnMount = (editor, monaco) => {
			// save the refs
			editorRef.current = editor;
			monacoRef.current = monaco;

			// update the theme
			const config = MONACO_CONFIG[language];

			if (config) {
				// set the language tokens
				if (config.monarchTokensProvider) {
					monaco.languages.setMonarchTokensProvider(
						language,
						config.monarchTokensProvider,
					);
				}

				// setup intellisense
				if (config.completionItemProvider) {
					monaco.languages.registerCompletionItemProvider(
						language,
						config.completionItemProvider,
					);
				}

				// define the language-specific smss theme so light mode can pick
				// it up; computeMonacoTheme decides whether to use it.
				if (config.theme) {
					monaco.editor.defineTheme(
						`${language}-smss-theme`,
						config.theme,
					);
				}
			}

			monaco.editor.setTheme(computeMonacoTheme(!!config?.theme));

			// editor.addAction({
			// 	contextMenuGroupId: "1_modification",
			// 	contextMenuOrder: 1,
			// 	id: "prompt-LLM",
			// 	label: "Generate Code",
			// 	keybindings: [
			// 		monaco.KeyMod.CtrlCmd |
			// 			monaco.KeyMod.Shift |
			// 			monaco.KeyCode.KeyG,
			// 	],

			// 	run: async (editor) => {
			// 		const selection = editor.getSelection();
			// 		const selectedText = editor
			// 			.getModel()
			// 			.getValueInRange(selection);

			// 		const content = editor.getValue();

			// 		const command = `
			// 			You are a ${ext} assistant. Respond to the user prompt: "${selectedText}"

			// 			Based on the following data:

			// 			file: ${path}
			// 			content: ${content}

			// 			Do not include any explanations, only provide the code.
			// 			`;

			// 		const { pixelReturn } = await insight.actions.run<
			// 			[{ response: string }]
			// 		>(
			// 			`LLM(engine = "", command = "<encode>${command}</encode>", paramValues = [ {} ] );`,
			// 		);

			// 		const response = pixelReturn[0].output.response;

			// 		// adds LLM response after response
			// 		editor.executeEdits("custom-action", [
			// 			{
			// 				range: new monaco.Range(
			// 					selection.endLineNumber + 2,
			// 					1,
			// 					selection.endLineNumber + 2,
			// 					1,
			// 				),
			// 				text: `\n\n${response}\n`,
			// 				forceMoveMarkers: true,
			// 			},
			// 		]);

			// 		// highligts LLM response after response
			// 		editor.setSelection(
			// 			new monaco.Range(
			// 				selection.endLineNumber + 3,
			// 				1,
			// 				selection.endLineNumber +
			// 					3 +
			// 					response.split("\n").length,
			// 				1,
			// 			),
			// 		);
			// 	},
			// });

			// Ctrl/Cmd+Enter → run the file. Only registered when the consumer
			// opts in via onRun (e.g. the terminal's file tab). addAction scopes
			// the keybinding to this editor, so it never leaks to other editors.
			if (onRunRef.current) {
				editor.addAction({
					contextMenuGroupId: "1_modification",
					contextMenuOrder: 0,
					id: "run",
					label: "Run",
					keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
					run: () => {
						onRunRef.current?.();
					},
				});
			}

			editor.addAction({
				contextMenuGroupId: "1_modification",
				contextMenuOrder: 1,
				id: "refresh",
				label: "Refresh",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
				run: async () => {
					getFile.refresh();
				},
			});

			editor.addAction({
				contextMenuGroupId: "1_modification",
				contextMenuOrder: 1,
				id: "save",
				label: "Save",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
				run: async () => {
					saveFile();
				},
			});

			editor.addAction({
				contextMenuGroupId: "1_modification",
				contextMenuOrder: 1,
				id: "download",
				label: "Download",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD],
				run: async () => {
					downloadFile();
				},
			});

			// add the actions
			editor.addAction({
				contextMenuGroupId: "1_modification",
				contextMenuOrder: 2,
				id: "toggle-word-wrap",
				label: "Toggle Word Wrap",
				keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ],
				run: async (editor) => {
					wordWrapRef.current = !wordWrapRef.current;
					editor.updateOptions({
						wordWrap: wordWrapRef.current ? "on" : "off",
					});
				},
			});

			// JSON error highlighting
			if (language === "json") {
				const syncErrors = () => {
					const model = editor.getModel();
					if (!model) return;
					const markers = monaco.editor.getModelMarkers({
						resource: model.uri,
					});
					setJsonErrors(markers);
					decorationsRef.current = editor.deltaDecorations(
						decorationsRef.current,
						markers.map((m) => ({
							range: new monaco.Range(
								m.startLineNumber,
								1,
								m.endLineNumber,
								Number.MAX_SAFE_INTEGER,
							),
							options: {
								isWholeLine: true,
								overviewRuler: {
									color: "rgba(220,38,38,0.8)",
									position:
										monaco.editor.OverviewRulerLane.Right,
								},
								minimap: {
									color: "rgba(220,38,38,0.8)",
									position:
										monaco.editor.MinimapPosition.Inline,
								},
								linesDecorationsClassName:
									"json-error-line-decoration",
							},
						})),
					);
				};

				const disposable = monaco.editor.onDidChangeMarkers((uris) => {
					const model = editor.getModel();
					if (
						model &&
						uris.some(
							(uri) => uri.toString() === model.uri.toString(),
						)
					) {
						syncErrors();
					}
				});

				// initial pass after worker has had time to validate
				setTimeout(syncErrors, 500);
				editor.onDidDispose(() => disposable.dispose());
			}
		};

		/**
		 * Save the File
		 */
		const saveFile = async () => {
			try {
				setIsLoading(true);

				const editor = editorRef.current;
				if (!editor) {
					throw new Error("Error missing editor instance");
				}

				const content = editor.getValue();
				const currentPath = currentPathRef.current;

				let pixel = "";
				if (mode.type === "APP") {
					pixel = `SaveAppAssets(project=["${mode.app}"], filePath=["${currentPath}"], content=["<encode>${content}</encode>"]);`;
				} else if (mode.type === "ENGINE") {
					pixel = `SaveEngineAssets(engine=["${mode.engine}"], filePath=["${currentPath}"], content=["<encode>${content}</encode>"]);`;
				} else if (mode.type === "INSIGHT") {
					pixel = `SaveInsightAssets(filePath=["${currentPath}"], content=["<encode>${content}</encode>"]);`;
				} else if (mode.type === "USER") {
					pixel = `SaveUserAssets(filePath=["${currentPath}"], content=["<encode>${content}</encode>"]);`;
				}

				if (!pixel) {
					throw new Error("Error missing pixel to save file");
				}

				// save it
				if (mode.type === "INSIGHT" && targetInsightId) {
					await runPixel(pixel, targetInsightId);
				} else {
					await insight.actions.run(pixel);
				}

				// Do not refresh the content as it can cause the cursor to jump, instead just trigger onChange with the new content and reset the modified state

				// trigger onChange
				onChange(content, false);

				toast.success(t("fileExplorer.toasts.saveSuccess"));
			} catch (e) {
				toast.error(
					getFileOperationErrorMessage(
						t("fileExplorer.toasts.saveFailed"),
						e,
					),
				);

				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};

		/**
		 * Download the File
		 */
		const downloadFile = async () => {
			try {
				setIsLoading(true);

				const currentPath = currentPathRef.current;

				let pixel = "";
				if (mode.type === "APP") {
					pixel = `DownloadAppAsset(project=["${mode.app}"], filePath=["${currentPath}"]);`;
				} else if (mode.type === "ENGINE") {
					pixel = `DownloadEngineAsset(engine=["${mode.engine}"], filePath=["${currentPath}"]);`;
				} else if (mode.type === "INSIGHT") {
					pixel = `DownloadInsightAsset(filePath=["${currentPath}"]);`;
				} else if (mode.type === "USER") {
					pixel = `DownloadUserAsset(filePath=["${currentPath}"]);`;
				}

				if (!pixel) {
					throw new Error("Error missing pixel to download file");
				}

				// save it
				let pixelReturn: { output: string }[] = [];
				if (mode.type === "INSIGHT" && targetInsightId) {
					const response = await runPixel<[string]>(
						pixel,
						targetInsightId,
					);
					pixelReturn = response.pixelReturn;
				} else {
					const response = await insight.actions.run<[string]>(pixel);
					pixelReturn = response.pixelReturn;
				}

				// get the file key
				const fileKey = pixelReturn[0].output;

				// download the file
				await download(targetInsightId, fileKey);
				toast.success(t("fileExplorer.toasts.downloadFileSuccess"));
			} catch (e) {
				toast.error(
					getFileOperationErrorMessage(
						t("fileExplorer.toasts.downloadFileFailed"),
						e,
					),
				);

				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};

		useImperativeHandle(actionsRef, () => ({
			save: saveFile,
			refresh: () => getFile.refresh(),
			download: downloadFile,
		}));

		return (
			<div className="relative flex h-full w-full flex-col items-center bg-background [&_.quick-input-widget]:mx-0!">
				{/* Toolbar */}
				{!hideToolbar && (
					<div className="flex w-full shrink-0 items-center justify-between gap-2 border-border border-b px-3 pt-1.5 pb-2.25">
						<div className="flex items-center gap-1">
							{leadingToolbar}
							{language === "json" && jsonErrors.length > 0 && (
								<button
									type="button"
									className="flex items-center gap-1 rounded px-1 py-0.5 text-destructive text-xs hover:bg-destructive/10"
									onClick={() => setErrorsExpanded((v) => !v)}
								>
									<AlertCircleIcon className="size-3" />
									{jsonErrors.length} error
									{jsonErrors.length > 1 ? "s" : ""}
									{errorsExpanded ? (
										<ChevronDownIcon className="size-3" />
									) : (
										<ChevronUpIcon className="size-3" />
									)}
								</button>
							)}
							{language === "json" &&
								jsonErrors.length === 0 &&
								getFile.status === "SUCCESS" && (
									<span className="text-success text-xs">
										Valid JSON
									</span>
								)}
						</div>
						<div className="flex items-center gap-1.5">
							<Button
								variant="outline"
								size="sm"
								disabled={
									isLoading || getFile.status !== "SUCCESS"
								}
								onClick={() => getFile.refresh()}
							>
								<RefreshCwIcon className="size-4" />
								Refresh
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={
									isLoading || getFile.status !== "SUCCESS"
								}
								onClick={() => saveFile()}
							>
								<SaveIcon className="size-4" />
								Save
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={
									isLoading || getFile.status !== "SUCCESS"
								}
								onClick={() => downloadFile()}
							>
								<DownloadIcon className="size-4" />
								Download
							</Button>
						</div>
					</div>
				)}
				<Suspense
					fallback={
						<div className="flex h-full w-full items-center justify-center">
							<Spinner />
						</div>
					}
				>
					{getFile.status === "LOADING" && isLoading && (
						<div className="flex h-full w-full items-center justify-center">
							<Spinner />
						</div>
					)}
					{getFile.status === "ERROR" && (
						<div className="flex h-full w-full items-center justify-center">
							<Muted className="text-destructive">
								{getFile.error?.message ||
									t("fileExplorer.failedToLoadFiles")}
							</Muted>
						</div>
					)}
					{getFile.status === "SUCCESS" && (
						<MonacoEditor
							width={"100%"}
							height={"100%"}
							value={
								getFile.status === "SUCCESS" ? getFile.data : ""
							}
							language={language}
							options={{
								readOnly: getFile.status !== "SUCCESS",
								accessibilitySupport: "off",
								padding: { top: 12 },
								scrollBeyondLastLine: false,
							}}
							onChange={(value) => {
								const nextValue = value ?? "";
								onChange(nextValue, nextValue !== getFile.data);
							}}
							onMount={onMount}
						/>
					)}
				</Suspense>
				{language === "json" &&
					jsonErrors.length > 0 &&
					errorsExpanded && (
						<div className="max-h-[140px] w-full shrink-0 overflow-y-auto border-border border-t bg-destructive/5">
							{jsonErrors.map((err) => (
								<button
									key={`${err.startLineNumber}-${err.startColumn}-${err.message}`}
									type="button"
									className="flex w-full items-start gap-2 px-3 py-1 text-start text-xs hover:bg-destructive/10"
									onClick={() => {
										editorRef.current?.revealLineInCenter(
											err.startLineNumber,
										);
										editorRef.current?.setPosition({
											lineNumber: err.startLineNumber,
											column: err.startColumn,
										});
										editorRef.current?.focus();
									}}
								>
									<AlertCircleIcon className="mt-0.5 size-3 shrink-0 text-destructive" />
									<span className="text-destructive">
										Line {err.startLineNumber}, Col{" "}
										{err.startColumn}:
									</span>
									<span className="text-foreground">
										{err.message}
									</span>
								</button>
							))}
						</div>
					)}
			</div>
		);
	},
);

FileCodeEditor.displayName = "FileCodeEditor";
