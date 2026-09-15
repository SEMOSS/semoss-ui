import { Code } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Suspense, useEffect, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { MonacoDiffEditor, MonacoEditor } from "@semoss/shared";
import {
	Button,
	Markdown,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	toast,
} from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
	type Variable,
} from "../../../store";
import { MarkdownIcon, PythonIcon, RIcon } from "./icons";

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500; // ~25 lines

interface EDITOR_TYPES {
	py: { name: string; value: string; language: string };
	r: { name: string; value: string; language: string };
	pixel: { name: string; value: string; language: string };
	markdown: { name: string; value: string; language: string };
}
const EDITOR_TYPE: EDITOR_TYPES = {
	py: { name: "Python", value: "py", language: "python" },
	r: { name: "R", value: "r", language: "r" },
	pixel: { name: "Pixel", value: "pixel", language: "pixel" },
	markdown: { name: "Markdown", value: "markdown", language: "Markdown" },
} as const;

export interface CodeCellDef extends CellDef<"code"> {
	widget: "code";
	parameters: {
		type: "r" | "py" | "pixel" | "markdown";
		code: string | string[];
		marked?: boolean;
	};
}

const StyledContent = ({ children }: { children: React.ReactNode }) => (
	<div className="relative w-full">{children}</div>
);

let completionItemProviders = {};
const EditorLanguages = { py: "python", pixel: "pixel", r: "r" };
const EditorLineHeight = 19;

export const CodeCell: CellComponent<CodeCellDef> = observer((props) => {
	const editorRef = useRef(null);
	const monacoRef = useRef(null);
	const selectionRef = useRef(null);
	const LLMReturnRef = useRef("");
	const diffEditorRef = useRef(null);

	const { cell, isExpanded, agentModelEngine } = props;
	const { state } = useBlocks();

	const [editorHeight, setEditorHeight] = useState<number>(null);
	const [LLMLoading, setLLMLoading] = useState(false);
	const [diffEditMode, setDiffEditMode] = useState(false);
	const wordWrapRef = useRef(true);
	const [oldContentDiffEdit, setOldContentDiffEdit] = useState("");
	const [newContentDiffEdit, setNewContentDiffEdit] = useState("");
	const [isLLMRejected, setIsLLMRejected] = useState(false);
	const [count, setCount] = useState(0);
	const [allFunctions, setAllFunctions] = useState([]);
	const [modelId, setModelId] = useState(agentModelEngine);

	useEffect(() => {
		async function fetchData() {
			const response = await runPixel(`HelpJson();`);
			const outputKeys = Object.keys(response.pixelReturn[0].output);
			const allOutputs = outputKeys.map((key) => ({
				key,
				value: response.pixelReturn[0].output[key],
			}));
			setAllFunctions(allOutputs);
		}
		fetchData();
	}, []);

	const promptLLM = async (prompt: string) => {
		try {
			setLLMLoading(true);
			if (!modelId) throw new Error("No Agent Model Engine");

			const res = await runPixel(
				`LLM(engine = "${modelId}", command = "${prompt}", paramValues = [ {"max_completion_tokens": 2000, "temperature": 0.3} ] );`,
			);

			// biome-ignore lint/suspicious/noExplicitAny: pixel response output type is unknown
			const LLMResponse = (res.pixelReturn[0].output as any).response;
			let trimmedStarterCode = LLMResponse;
			trimmedStarterCode = LLMResponse.replace(/^```|```$/g, "");
			trimmedStarterCode = trimmedStarterCode.substring(
				trimmedStarterCode.indexOf("\n") + 1,
			);
			return trimmedStarterCode;
		} catch {
			console.error("Failed response from AI Code Generator");
			return "";
		} finally {
			setLLMLoading(false);
		}
	};

	const handleDiffEditorMount = (editor, monaco) => {
		diffEditorRef.current = editor;

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
		resizeDiffEditor();
	};

	const resizeDiffEditor = () => {
		let height = Math.min(
			Math.max(
				diffEditorRef.current.getModifiedEditor().getContentHeight(),
				diffEditorRef.current.getOriginalEditor().getContentHeight(),
			),
			EDITOR_MAX_HEIGHT,
		);
		height += EDITOR_LINE_HEIGHT;
		diffEditorRef.current.layout({
			width: diffEditorRef.current.getContainerDomNode().clientWidth,
			height,
		});
	};

	const handleMount = (editor, monaco) => {
		if (isLLMRejected) {
			editor.getModel().setValue(oldContentDiffEdit);
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.code",
					value: oldContentDiffEdit,
				},
			});
			setIsLLMRejected(false);
		}

		editorRef.current = editor;
		monacoRef.current = monaco;
		const contentHeight = editor.getContentHeight();
		setEditorHeight(contentHeight);

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

		editor.addAction({
			id: "run",
			label: "Run",
			keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
			run: (editor) => {
				const newValue = editor.getValue();
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: cell.query.id,
						cellId: cell.id,
						path: "parameters.code",
						value: newValue,
					},
				});
				state.dispatch({
					message: ActionMessages.RUN_CELL,
					payload: { queryId: cell.query.id, cellId: cell.id },
				});
			},
		});

		editor.addAction({
			contextMenuGroupId: "1_modification",
			contextMenuOrder: 1,
			id: "prompt-LLM",
			label: "Generate Code",
			keybindings: [
				monaco.KeyMod.CtrlCmd |
					monaco.KeyMod.Shift |
					monaco.KeyCode.KeyG,
			],
			run: async (editor) => {
				if (!modelId) {
					console.error("No Agent Model Engine");
					toast.error(
						"No Agent Model Engine selected. Please select a model.",
					);
					return;
				}
				const selection = editor.getSelection();
				selectionRef.current = selection;
				const selectedText = editor
					.getModel()
					.getValueInRange(selection);
				const originalContent = editor.getModel().getValue();
				setOldContentDiffEdit(originalContent);

				const language = EditorLanguages[cell.parameters.type];
				const commentSymbol =
					{ pixel: "//", python: "#", r: "#" }[language] || "//";

				const commentedText = selectedText
					.split("\n")
					.map((line) => `${commentSymbol} ${line}`)
					.join("\n");

				const LLMReturnText = await promptLLM(
					`Write me code that does ${selectedText} in ${language}`,
				);
				LLMReturnRef.current = LLMReturnText;
				setOldContentDiffEdit(editor.getModel().getValue());
				editor.executeEdits("custom-action", [
					{
						range: selection,
						text: commentedText,
						forceMoveMarkers: true,
					},
					{
						range: new monaco.Range(
							selection.endLineNumber + 2,
							1,
							selection.endLineNumber + 2,
							1,
						),
						text: `\n\n${LLMReturnText}\n`,
						forceMoveMarkers: true,
					},
				]);
				setNewContentDiffEdit(editor.getModel().getValue());
				setDiffEditMode(true);
			},
		});

		const _exposedQueryParameterDescription = (
			exposedParameter: string,
			queryId: string,
		): string => {
			switch (exposedParameter) {
				case "id":
				case "mode":
					return `Returns the ${exposedParameter} of query ${queryId}`;
				case "isExecuted":
					return `Returns whether query ${queryId} has executed`;
				case "isLoading":
					return `Returns the loading state for query ${queryId}`;
				case "isError":
					return `Returns whether query ${queryId} has an error`;
				case "error":
					return `Returns the error for query ${queryId} if it exists`;
				case "list":
					return `Returns an ordered list of cell IDs for query ${queryId}`;
				default:
					return `Reference the ${exposedParameter} parameter of query ${queryId}`;
			}
		};

		const generateSuggestions = (range) => {
			const suggestions = [];
			Object.entries(state.variables).forEach((keyValue) => {
				const id = keyValue[0];
				const variable = keyValue[1] as Variable;
				suggestions.push({
					label: {
						label: `{{${id}}}`,
						description: `${state.getVariable(variable.to, variable.type)}`,
					},
					kind: monaco.languages.CompletionItemKind.Variable,
					documentation: `This returns the value of ${id}, which is a ${variable.type}.  Feel free to change reference value in the variables panel on the left.`,
					insertText: `{{${id}}}`,
					range,
				});
			});
			return suggestions;
		};

		monaco.languages.register({ id: "pixel" });

		Object.values(EditorLanguages).forEach((language) => {
			if (completionItemProviders[language]) {
				completionItemProviders[language].dispose();
			}

			if (language === "pixel") {
				completionItemProviders = {
					...completionItemProviders,
					pixel: monaco.languages.registerCompletionItemProvider(
						language,
						{
							provideCompletionItems: async (model, position) => {
								const word =
									model.getWordUntilPosition(position);
								const languageFunctions =
									allFunctions.find(
										(f) =>
											f.key.toLowerCase() ===
											"General".toLowerCase(),
									)?.value || [];

								if (word.word !== "") {
									const suggestions = languageFunctions.map(
										(reactor) => ({
											label: {
												label: reactor,
												description: "Reactor",
											},
											kind: monaco.languages
												.CompletionItemKind.Function,
											insertText: `${reactor}();`,
											range: {
												startLineNumber:
													position.lineNumber,
												endLineNumber:
													position.lineNumber,
												startColumn: word.startColumn,
												endColumn: word.endColumn,
											},
										}),
									);
									return { suggestions };
								}

								const specialCharacterStartRange = {
									startLineNumber: position.lineNumber,
									endLineNumber: position.lineNumber,
									startColumn: word.startColumn - 2,
									endColumn: word.startColumn,
								};
								const preceedingTwoCharacters =
									model.getValueInRange(
										specialCharacterStartRange,
									);
								const replaceRangeStartBuffer =
									preceedingTwoCharacters === "{{" ? 2 : 1;

								const specialCharacterEndRange = {
									startLineNumber: position.lineNumber,
									endLineNumber: position.lineNumber,
									startColumn: word.endColumn,
									endColumn: word.endColumn + 2,
								};
								const followingTwoCharacters =
									model.getValueInRange(
										specialCharacterEndRange,
									);
								const replaceRangeEndBuffer =
									followingTwoCharacters === "}}"
										? 2
										: followingTwoCharacters === "} " ||
												followingTwoCharacters === "}"
											? 1
											: 0;

								const replaceRange = {
									startLineNumber: position.lineNumber,
									endLineNumber: position.lineNumber,
									startColumn:
										word.startColumn -
										replaceRangeStartBuffer,
									endColumn:
										word.endColumn + replaceRangeEndBuffer,
								};
								return {
									suggestions:
										generateSuggestions(replaceRange),
								};
							},
							triggerCharacters: ["{"],
						},
					),
				};
			} else {
				completionItemProviders = {
					...completionItemProviders,
					[language]: monaco.languages.registerCompletionItemProvider(
						language,
						{
							provideCompletionItems: async (model, position) => {
								const word =
									model.getWordUntilPosition(position);
								const languageFunctions =
									allFunctions.find(
										(f) =>
											f.key.toLowerCase() ===
											language.toLowerCase(),
									)?.value || [];

								if (word.word !== "") {
									const suggestions = languageFunctions.map(
										(fn) => ({
											label: {
												label: fn,
												description: "Function",
											},
											kind: monaco.languages
												.CompletionItemKind.Function,
											insertText: `${fn}()`,
											range: {
												startLineNumber:
													position.lineNumber,
												endLineNumber:
													position.lineNumber,
												startColumn: word.startColumn,
												endColumn: word.endColumn,
											},
										}),
									);
									return { suggestions };
								}

								const specialCharacterStartRange = {
									startLineNumber: position.lineNumber,
									endLineNumber: position.lineNumber,
									startColumn: word.startColumn - 2,
									endColumn: word.startColumn,
								};
								const preceedingTwoCharacters =
									model.getValueInRange(
										specialCharacterStartRange,
									);
								const replaceRangeStartBuffer =
									preceedingTwoCharacters === "{{" ? 2 : 1;

								const specialCharacterEndRange = {
									startLineNumber: position.lineNumber,
									endLineNumber: position.lineNumber,
									startColumn: word.endColumn,
									endColumn: word.endColumn + 2,
								};
								const followingTwoCharacters =
									model.getValueInRange(
										specialCharacterEndRange,
									);
								const replaceRangeEndBuffer =
									followingTwoCharacters === "}}"
										? 2
										: followingTwoCharacters === "} " ||
												followingTwoCharacters === "}"
											? 1
											: 0;

								const replaceRange = {
									startLineNumber: position.lineNumber,
									endLineNumber: position.lineNumber,
									startColumn:
										word.startColumn -
										replaceRangeStartBuffer,
									endColumn:
										word.endColumn + replaceRangeEndBuffer,
								};

								const variableSuggestions =
									generateSuggestions(replaceRange);
								return { suggestions: variableSuggestions };
							},
							triggerCharacters: [
								"{",
								..."abcdefghijklmnopqrstuvwxyz".split(""),
							],
						},
					),
				};
			}
		});

		const newHeight = Math.min(
			Math.max(editor.getContentHeight(), EditorLineHeight),
			EDITOR_MAX_HEIGHT,
		);
		setEditorHeight(newHeight);

		editor.onDidContentSizeChange(() => {
			setEditorHeight(
				Math.min(
					Math.max(editor.getContentHeight(), EditorLineHeight),
					EDITOR_MAX_HEIGHT,
				),
			);
		});
	};

	const handleChange = (newValue: string) => {
		const maxHeight = 25 * EditorLineHeight;
		setEditorHeight(
			Math.min(editorRef.current.getContentHeight(), maxHeight),
		);
		if (cell.isLoading) return;
		state.dispatch({
			message: ActionMessages.UPDATE_CELL,
			payload: {
				queryId: cell.query.id,
				cellId: cell.id,
				path: "parameters.code",
				value: newValue,
			},
		});
	};

	const acceptDiffEditHandler = () => setDiffEditMode(false);
	const rejectDiffEditHandler = () => {
		setIsLLMRejected(true);
		setDiffEditMode(false);
	};

	const getHeight = () => (isExpanded ? editorHeight : EditorLineHeight);

	useEffect(() => {
		setModelId(agentModelEngine);
		setCount((count) => count + 1);
	}, [agentModelEngine]);

	const codeValue =
		typeof cell.parameters.code === "string"
			? cell.parameters.code
			: cell.parameters.code.join("\n");

	return (
		<StyledContent>
			{LLMLoading && <div>Loading...</div>}

			<div className="flex flex-row gap-2">
				{allFunctions.length > 0 && (
					<div className="min-w-0 flex-1">
						{!isExpanded ? (
							<Suspense fallback={<>...</>}>
								{EDITOR_TYPE[cell.parameters.type].language ===
									"Markdown" && cell.isExecuted ? (
									<Markdown>{codeValue}</Markdown>
								) : (
									<MonacoEditor
										width="100%"
										height={getHeight()}
										language={
											EDITOR_TYPE[cell.parameters.type]
												.language
										}
										value={codeValue}
										options={{
											scrollbar: {
												alwaysConsumeMouseWheel: false,
												horizontal: "hidden",
											},
											lineNumbers: "on",
											readOnly: false,
											minimap: { enabled: false },
											automaticLayout: true,
											scrollBeyondLastLine: false,
											lineHeight: EDITOR_LINE_HEIGHT,
											overviewRulerBorder: false,
											wordWrap: "on",
											glyphMargin: false,
											folding: false,
											lineNumbersMinChars: 2,
										}}
										onChange={handleChange}
										onMount={handleMount}
									/>
								)}
							</Suspense>
						) : diffEditMode ? (
							<>
								<Suspense fallback={<>...</>}>
									<MonacoDiffEditor
										width="100%"
										height={getHeight()}
										original={oldContentDiffEdit}
										modified={newContentDiffEdit}
										language={
											EDITOR_TYPE[cell.parameters.type]
												.value
										}
										options={{
											readOnly: true,
											minimap: { enabled: false },
											automaticLayout: true,
											scrollBeyondLastLine: false,
											lineHeight: EDITOR_LINE_HEIGHT,
											overviewRulerBorder: false,
											wordWrap: "on",
										}}
										onMount={handleDiffEditorMount}
									/>
								</Suspense>
								<div className="m-2 flex flex-row items-center justify-center gap-2">
									<Button
										title="Accept changes"
										size="sm"
										onClick={acceptDiffEditHandler}
									>
										Keep
									</Button>
									<Button
										title="Reject changes"
										size="sm"
										variant="ghost"
										onClick={rejectDiffEditHandler}
									>
										Reject
									</Button>
								</div>
							</>
						) : (
							<Suspense fallback={<>...</>}>
								{EDITOR_TYPE[cell.parameters.type].language ===
									"Markdown" && cell.isExecuted ? (
									<Markdown>{codeValue}</Markdown>
								) : (
									<MonacoEditor
										key={count}
										width="100%"
										height={getHeight()}
										language={
											EDITOR_TYPE[cell.parameters.type]
												.language
										}
										value={codeValue}
										options={{
											scrollbar: {
												alwaysConsumeMouseWheel: false,
												horizontal: "hidden",
											},
											lineNumbers: "on",
											readOnly: false,
											minimap: { enabled: false },
											automaticLayout: true,
											scrollBeyondLastLine: false,
											lineHeight: EDITOR_LINE_HEIGHT,
											overviewRulerBorder: false,
											wordWrap: "on",
											glyphMargin: false,
											folding: false,
											lineNumbersMinChars: 2,
										}}
										onChange={handleChange}
										onMount={handleMount}
									/>
								)}
							</Suspense>
						)}
					</div>
				)}
				<div className="flex flex-row pl-1">
					<Select
						value={EDITOR_TYPE[cell.parameters.type].value}
						onValueChange={(value) => {
							if (
								value !==
								EDITOR_TYPE[cell.parameters.type].value
							) {
								state.dispatch({
									message: ActionMessages.UPDATE_CELL,
									payload: {
										queryId: cell.query.id,
										cellId: cell.id,
										path: "parameters.type",
										value,
									},
								});
								setCount(count + 1);
							}
						}}
					>
						<SelectTrigger className="h-7 w-9 border-0 px-1 shadow-none">
							{cell.parameters.type === "py" ? (
								<PythonIcon fontSize="small" />
							) : cell.parameters.type === "r" ? (
								<RIcon fontSize="small" />
							) : cell.parameters.type === "markdown" ? (
								<MarkdownIcon fontSize="small" />
							) : (
								<Code className="size-4" />
							)}
						</SelectTrigger>
						<SelectContent>
							{Array.from(
								Object.values(EDITOR_TYPE),
								(language, i) => (
									<SelectItem
										key={`${i}-${cell.id}-${language.name}`}
										value={language.value}
										title={language.name}
									>
										<div className="flex items-center gap-2">
											{language.value === "py" ? (
												<PythonIcon fontSize="small" />
											) : language.value === "r" ? (
												<RIcon fontSize="small" />
											) : language.value ===
												"markdown" ? (
												<MarkdownIcon fontSize="small" />
											) : (
												<Code className="size-4" />
											)}
											<span>{language.name}</span>
										</div>
									</SelectItem>
								),
							)}
						</SelectContent>
					</Select>
				</div>
			</div>
		</StyledContent>
	);
});
