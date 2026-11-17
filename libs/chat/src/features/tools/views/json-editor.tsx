import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, Textarea } from "@semoss/ui/next";

/** Props for {@link JSONEditor}. */
interface JSONEditorProps {
	/** The JSON value to edit. */
	value: unknown;
	/** Called with the parsed value when the user applies valid JSON. */
	onChange: (v: unknown) => void;
	/** Whether the editor is read-only, which also hides Apply and Reset. */
	disabled?: boolean;
}

/**
 * Edits a JSON value as formatted text. The text is parsed only on Apply, which
 * shows the parse error instead of calling `onChange` when the text is invalid;
 * Reset puts the current value back.
 */
export const JSONEditor = ({ value, onChange, disabled }: JSONEditorProps) => {
	const { t } = useTranslation("mcp");
	// The value as the user is editing it
	const [text, setText] = useState(() => {
		try {
			return JSON.stringify(value ?? {}, null, 2);
		} catch (_) {
			return "";
		}
	});
	// The last Apply's parse error
	const [error, setError] = useState<string | null>(null);

	// A new value from outside replaces the text being edited
	useEffect(() => {
		try {
			setText(JSON.stringify(value ?? {}, null, 2));
			setError(null);
		} catch (_) {
			setText("");
		}
	}, [value]);

	return (
		<div className="space-y-2">
			<Textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				rows={8}
				className="w-full font-mono text-sm"
				disabled={disabled}
			/>
			{error && <p className="text-destructive text-sm">{error}</p>}
			{!disabled && (
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => {
							try {
								const parsed = text.trim()
									? JSON.parse(text)
									: {};
								onChange(parsed);
								setError(null);
							} catch (err) {
								setError((err as Error).message);
							}
						}}
					>
						{t("tools.apply")}
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => {
							try {
								setText(JSON.stringify(value ?? {}, null, 2));
								setError(null);
							} catch (_) {
								setText("");
							}
						}}
					>
						{t("tools.reset")}
					</Button>
				</div>
			)}
		</div>
	);
};
