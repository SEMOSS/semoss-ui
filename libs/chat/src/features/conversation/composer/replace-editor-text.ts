import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	type LexicalEditor,
} from "lexical";

/**
 * Replace everything in the editor with one paragraph of text, inside an
 * editor update already running. Empty text leaves one empty paragraph.
 *
 * @param text - The text the editor holds afterwards.
 */
export const $setRootText = (text: string): void => {
	const root = $getRoot();
	root.clear();
	const paragraph = $createParagraphNode();
	if (text) paragraph.append($createTextNode(text));
	root.append(paragraph);
};

/**
 * Replace everything in the editor with one paragraph of text, as a prompt
 * handed in, a transcript, or a cleared draft does.
 *
 * @param editor - The composer's editor, or null before it mounts.
 * @param text - The text the editor holds afterwards.
 */
export const replaceEditorText = (
	editor: LexicalEditor | null,
	text: string,
): void => {
	editor?.update(() => $setRootText(text));
};
