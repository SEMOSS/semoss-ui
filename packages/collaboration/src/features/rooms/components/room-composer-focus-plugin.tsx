import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

/** Hosts request focus explicitly; restoring an editor does not open a mobile keyboard. */
export function RoomComposerFocusPlugin({
	request,
	isReadOnly,
}: {
	request: number;
	isReadOnly?: boolean;
}) {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		if (!request) return;
		const frame = requestAnimationFrame(() => {
			editor.focus(() => {
				// Selection restoration alone does not always move browser focus.
				editor.getRootElement()?.focus({ preventScroll: true });
			});
		});
		return () => cancelAnimationFrame(frame);
	}, [editor, request]);
	useEffect(() => {
		if (isReadOnly !== undefined) editor.setEditable(!isReadOnly);
	}, [editor, isReadOnly]);
	return null;
}
