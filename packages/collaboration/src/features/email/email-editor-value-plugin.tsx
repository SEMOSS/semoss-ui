import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useRef } from "react";
import { exportEmailHtml, writeEmailEditor } from "./email-editor-config";

/** Synchronize explicit form resets without replacing the document on every keystroke. */
export function EmailEditorValuePlugin({
	value,
	onChange,
	bodyReplacement = 0,
}: {
	value: string;
	onChange: (value: string) => void;
	bodyReplacement?: number;
}) {
	const [editor] = useLexicalComposerContext();
	const emitted = useRef<string | null>(null);
	const serialized = useRef<string | null>(null);
	const lastReplacement = useRef(bodyReplacement);
	useEffect(() => {
		if (emitted.current === value) return;
		const preserveHistory =
			emitted.current !== null &&
			bodyReplacement !== lastReplacement.current;
		lastReplacement.current = bodyReplacement;
		emitted.current = value;
		writeEmailEditor(editor, value, "html", preserveHistory);
		// Lexical normalizes markup on import; that is not a user body revision.
		serialized.current = exportEmailHtml(editor);
	}, [editor, value, bodyReplacement]);
	useEffect(
		() =>
			editor.registerUpdateListener(({ tags }) => {
				if (tags.has("email-reset")) return;
				const html = exportEmailHtml(editor);
				if (html === serialized.current) return;
				serialized.current = html;
				emitted.current = html;
				onChange(html);
			}),
		[editor, onChange],
	);
	return null;
}
