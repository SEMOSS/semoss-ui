import { useEffect, useState } from "react";
import { Button, Textarea } from "@semoss/ui/next";

export interface JSONEditorProps {
	/** The JSON value to edit */
	value: unknown;
	/** Callback fired when the JSON value changes */
	onChange: (v: unknown) => void;
	/** Whether the editor is disabled */
	disabled?: boolean;
}

/**
 * A JSON editor component with validation and formatting
 *
 * @component
 */
export const JSONEditor = ({ value, onChange, disabled }: JSONEditorProps) => {
	/**
	 * State
	 */
	// Text representation of the JSON value
	const [text, setText] = useState(() => {
		try {
			return JSON.stringify(value ?? {}, null, 2);
		} catch (_) {
			return "";
		}
	});
	// Validation error message
	const [error, setError] = useState<string | null>(null);

	/**
	 * Effects
	 */
	// Sync text state when value prop changes
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
						Apply
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
						Reset
					</Button>
				</div>
			)}
		</div>
	);
};
