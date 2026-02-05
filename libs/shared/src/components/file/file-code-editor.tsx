import type { OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { Suspense, useRef, useState } from "react";
import { download, useInsight, usePixel } from "@semoss/sdk/react";
import { Muted, Spinner, toast } from "@semoss/ui/next";
import {
	MONACO_CONFIG,
	MONACO_EXT_LANGUAGE_MAPPING,
	MonacoEditor,
} from "../monaco";
import type { FileMode } from "./file.types";

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
}

export const FileCodeEditor: React.FC<FileCodeEditorProps> = ({
	mode,
	path,
	onChange = () => null,
}) => {
	const insight = useInsight();
	const [isLoading, setIsLoading] = useState(false);

	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const wordWrapRef = useRef<boolean>(false);

	let getFilePixel = "";
	if (mode.type === "APP") {
		getFilePixel = `GetAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
	} else if (mode.type === "ENGINE") {
		getFilePixel = `GetEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
	} else if (mode.type === "INSIGHT") {
		getFilePixel = `GetInsightAssets(filePath=["${path}"]);`;
	}

	const getFile = usePixel<string>(getFilePixel, {}, insight.insightId);

	// get the language
	const ext = path.split(".").pop()?.toLowerCase() || "";
	const language = MONACO_EXT_LANGUAGE_MAPPING[ext] || "plaintext";

	/**
	 * Handler called when the editor is mounted
	 */
	const onMount: OnMount = (editor, monaco) => {
		// save the ref
		editorRef.current = editor;

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

			// set the theme
			if (config.theme) {
				monaco.editor.defineTheme(
					`${language}-smss-theme`,
					config.theme,
				);
				monaco.editor.setTheme(`${language}-smss-theme`);
			} else {
				monaco.editor.setTheme("light");
			}
		} else {
			monaco.editor.setTheme("light");
		}

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
	};

	/**
	 * Save the File
	 */
	const saveFile = async () => {
		try {
			setIsLoading(true);

			const content = editorRef.current.getValue();

			let pixel = "";
			if (mode.type === "APP") {
				pixel = `SaveAppAssets(project=["${mode.app}"], filePath=["${path}"], content=["<encode>${content}</encode>"]);`;
			} else if (mode.type === "ENGINE") {
				pixel = `SaveEngineAssets(engine=["${mode.engine}"], filePath=["${path}"], content=["<encode>${content}</encode>"]);`;
			} else if (mode.type === "INSIGHT") {
				pixel = `SaveInsightAssets(filePath=["${path}"], content=["<encode>${content}</encode>"]);`;
			}

			if (!pixel) {
				throw new Error("Error missing pixel to save file");
			}

			// save it
			await insight.actions.run(pixel);

			// refresh after save
			getFile.refresh();

			// trigger onChange
			onChange(content, false);

			toast.success("Successfully saved file");
		} catch (e) {
			toast.error("Error saving file");

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

			let pixel = "";
			if (mode.type === "APP") {
				pixel = `DownloadAppAsset(project=["${mode.app}"], filePath=["${path}"]);`;
			} else if (mode.type === "ENGINE") {
				pixel = `DownloadEngineAsset(engine=["${mode.engine}"], filePath=["${path}"]);`;
			} else if (mode.type === "INSIGHT") {
				pixel = `DownloadInsightAsset(filePath=["${path}"]);`;
			}

			if (!pixel) {
				throw new Error("Error missing pixel to download file");
			}

			// save it
			const { pixelReturn } = await insight.actions.run<[string]>(pixel);

			// get the file key
			const fileKey = pixelReturn[0].output;

			// download the file
			await download(insight.insightId, fileKey);
		} catch (e) {
			toast.error("Error downloading file");

			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative flex h-full w-full flex-col items-center bg-background [&_.quick-input-widget]:mx-0!">
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
							{getFile.error?.message || "Failed to load files"}
						</Muted>
					</div>
				)}
				{getFile.status === "SUCCESS" && (
					<MonacoEditor
						width={"100%"}
						height={"100%"}
						value={getFile.status === "SUCCESS" ? getFile.data : ""}
						language={language}
						options={{
							readOnly: getFile.status !== "SUCCESS",
						}}
						onChange={(value) => {
							onChange(value, value !== getFile.data);
						}}
						onMount={onMount}
					/>
				)}
			</Suspense>
		</div>
	);
};
