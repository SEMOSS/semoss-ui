import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	type LexicalEditor,
} from "lexical";
import { type RefObject, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import { RESET_PROMPT_HISTORY_COMMAND } from "./prompt-history";
import { $setRootText, replaceEditorText } from "./replace-editor-text";
import { useGracefulErrors } from "./use-graceful-errors";

/** What {@link useComposerSubmit} needs from the composer. */
interface ComposerSubmitInput {
	/** The composer's editor. */
	readonly editorRef: RefObject<LexicalEditor | null>;
	/** Sends a prompt and its files; false or a throw is a failed send. */
	readonly onPrompt: (prompt: string, files: File[]) => Promise<boolean>;
	/** The files attached to the draft. */
	readonly files: File[];
	/** Attaches files again, after a failed send. */
	readonly addFiles: (files: File[]) => void;
	/** Clears the draft's files as it sends. */
	readonly clearFiles: () => void;
	/** Whether the chat is loading, which holds the draft. */
	readonly isLoading: boolean;
	/** Whether sending waits, such as for a new chat's agent. */
	readonly isSubmitDisabled: boolean;
	/** Whether a tool call waits for the user, which holds the draft. */
	readonly hasOutstandingTools: boolean;
	/** Whether a turn runs or the chat is otherwise busy, which holds prompts. */
	readonly isBusy: boolean;
}

/** What {@link useComposerSubmit} returns. */
interface ComposerSubmit {
	/** Sends the draft: its text, one line per paragraph, and its files. */
	readonly submit: () => Promise<void>;
	/** Sends a predefined prompt as is, leaving the draft alone. */
	readonly runPrompt: (prompt: string) => Promise<void>;
}

/**
 * Sending from the composer. The draft clears as it sends; a failed send puts
 * its files back, and its text before anything typed while it was sending,
 * and says why. One send runs at a time.
 *
 * @param input - The editor, the files, the guards, and how to send.
 * @returns How to send the draft and a predefined prompt.
 */
export const useComposerSubmit = ({
	editorRef,
	onPrompt,
	files,
	addFiles,
	clearFiles,
	isLoading,
	isSubmitDisabled,
	hasOutstandingTools,
	isBusy,
}: ComposerSubmitInput): ComposerSubmit => {
	const { t } = useTranslation("room");
	const { getGracefulErrorMessage } = useGracefulErrors();
	// read and written only in the send itself, never while rendering
	const isSubmittingRef = useRef(false);

	const submit = async (): Promise<void> => {
		if (isSubmittingRef.current) return;
		const editor = editorRef.current;
		let userInput = "";
		editor?.getEditorState().read(() => {
			userInput = $getRoot()
				.getChildren()
				.map((paragraph) => paragraph.getTextContent())
				.join("\n");
		});
		// kept to put back if the send fails
		const userFiles = [...files];
		if (
			!userInput ||
			isLoading ||
			isSubmitDisabled ||
			hasOutstandingTools
		) {
			return;
		}
		try {
			isSubmittingRef.current = true;
			editor?.dispatchCommand(RESET_PROMPT_HISTORY_COMMAND, undefined);
			replaceEditorText(editor, "");
			clearFiles();
			const result = Boolean(await onPrompt(userInput, userFiles));
			if (!result) {
				throw new Error(t("errors.processingChat"));
			}
		} catch (e) {
			toast.error(
				(e as Error)?.name === "UploadError"
					? t("errors.fileInUse")
					: getGracefulErrorMessage(e as Error),
			);
			addFiles(userFiles);
			// Keep anything typed while the request was in flight. The failed
			// message is restored before that draft instead of overwriting it.
			editor?.update(() => {
				const root = $getRoot();
				if (root.getTextContent().trim()) {
					const paragraph = $createParagraphNode();
					paragraph.append($createTextNode(userInput));
					root.getFirstChild()?.insertBefore(paragraph);
				} else {
					$setRootText(userInput);
				}
			});
		} finally {
			isSubmittingRef.current = false;
		}
	};

	const runPrompt = async (prompt: string): Promise<void> => {
		if (isBusy || isSubmitDisabled) return;
		editorRef.current?.dispatchCommand(
			RESET_PROMPT_HISTORY_COMMAND,
			undefined,
		);
		try {
			const success = await onPrompt(prompt, []);
			if (!success) {
				throw new Error(t("errors.processingChat"));
			}
		} catch (e) {
			toast.error(getGracefulErrorMessage(e as Error));
		}
	};

	return { submit, runPrompt };
};
