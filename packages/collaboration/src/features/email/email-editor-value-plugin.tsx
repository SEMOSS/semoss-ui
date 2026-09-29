import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useRef } from "react";
import { exportEmailHtml, writeEmailEditor } from "./email-editor-config";

/** Synchronize explicit form resets without replacing the document on every keystroke. */
export function EmailEditorValuePlugin({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	const [editor] = useLexicalComposerContext();
	const emitted = useRef<string | null>(null);
	useEffect(() => {
		if (emitted.current === value) return;
		emitted.current = value;
		writeEmailEditor(editor, value, "html");
	}, [editor, value]);
	useEffect(
		() =>
			editor.registerUpdateListener(({ tags }) => {
				if (tags.has("email-reset")) return;
				const html = exportEmailHtml(editor);
				if (html === emitted.current) return;
				emitted.current = html;
				onChange(html);
			}),
		[editor, onChange],
	);
	return null;
}
