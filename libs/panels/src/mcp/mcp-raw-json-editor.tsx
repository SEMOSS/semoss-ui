import { AlertCircle, CheckCircle2, Wand2 } from "lucide-react";
import { useMemo } from "react";
import { Button, Textarea } from "@semoss/ui/next";
import { locateJsonError } from "./mcp-json-utils";

export interface MCPRawJsonEditorProps {
	value: string;

	/** Parse error for the current text, if any */
	error?: string;

	/** Message shown when the file on disk could not be parsed on load */
	loadError?: string;

	readOnly?: boolean;

	onChange: (text: string) => void;
	onFormat: () => void;
}

/**
 * Whole-file text surface. This is the escape hatch for anything the form does
 * not model, and the only usable view when the file on disk is malformed.
 */
export const MCPRawJsonEditor = ({
	value,
	error,
	loadError,
	readOnly = false,
	onChange,
	onFormat,
}: MCPRawJsonEditorProps) => {
	const errorLocation = useMemo(
		() => (error ? locateJsonError(error, value) : null),
		[error, value],
	);

	return (
		<div className="flex h-full min-h-0 flex-col gap-2 p-3">
			{loadError && (
				<div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
					<AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
					<span>
						This file could not be parsed, so the form editor is
						unavailable and saving is blocked. Fix the JSON below to
						recover it. Original error: {loadError}
					</span>
				</div>
			)}

			<div className="flex items-center justify-between gap-2">
				<div className="min-w-0 text-xs">
					{error ? (
						<span className="flex items-start gap-1 text-destructive">
							<AlertCircle
								size={12}
								className="mt-0.5 flex-shrink-0"
							/>
							<span>
								{errorLocation
									? `Line ${errorLocation.line}, column ${errorLocation.col}: ${error}`
									: error}
							</span>
						</span>
					) : (
						<span className="flex items-center gap-1 text-[color:var(--chart-2)]">
							<CheckCircle2 size={12} className="flex-shrink-0" />
							Valid JSON
						</span>
					)}
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={onFormat}
					disabled={readOnly || Boolean(error)}
					className="flex items-center gap-1.5"
				>
					<Wand2 size={14} />
					Format
				</Button>
			</div>

			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={readOnly}
				spellCheck={false}
				aria-label="Raw MCP JSON"
				className={`min-h-0 flex-1 resize-none font-mono text-foreground text-xs leading-relaxed ${
					error ? "border-destructive ring-destructive/20" : ""
				}`}
			/>
		</div>
	);
};
