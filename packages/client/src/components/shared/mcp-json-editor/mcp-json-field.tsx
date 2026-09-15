import {
	AlertCircle,
	Braces,
	CheckCircle2,
	Copy,
	RotateCcw,
	Wand2,
} from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import {
	Button,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { locateJsonError } from "./mcp-json-utils";

export interface MCPJsonFieldProps {
	/** Current raw text. Not required to be valid JSON while the user types. */
	value: string;

	/** Parse error to surface under the field, if any */
	error?: string;

	/** Disables editing and the reset/format actions */
	disabled?: boolean;

	/** Value the reset action writes, e.g. "[]" or "{}" */
	emptyValue: string;

	placeholder: string;

	/** Optional label rendered to the left of the JSON badge */
	label?: React.ReactNode;

	/** Max rows before the textarea stops growing. Defaults to 12. */
	maxRows?: number;

	onChange: (text: string) => void;
}

/**
 * Textarea for a JSON value with pretty-print, copy, reset, and inline
 * validation that points at the offending line and column.
 */
export const MCPJsonField = ({
	value,
	error,
	disabled,
	emptyValue,
	placeholder,
	label,
	maxRows = 12,
	onChange,
}: MCPJsonFieldProps) => {
	const [copied, setCopied] = useState(false);
	const safeValue = value ?? "";

	const errorLocation = useMemo(
		() => (error ? locateJsonError(error, safeValue) : null),
		[error, safeValue],
	);

	const handleFormat = useCallback(() => {
		try {
			onChange(JSON.stringify(JSON.parse(safeValue), null, 2));
		} catch {
			// invalid JSON: leave as-is and let the error UI guide the user
		}
	}, [safeValue, onChange]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(safeValue);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		} catch {
			// clipboard blocked; ignore silently
		}
	}, [safeValue]);

	const isEmpty = safeValue.trim().length === 0;
	const hasError = Boolean(error);
	const lineCount = safeValue.length === 0 ? 1 : safeValue.split("\n").length;
	const rows = Math.max(3, Math.min(lineCount, maxRows));

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2 text-xs">
					{label && (
						<span className="truncate font-medium text-muted-foreground text-xs">
							{label}
						</span>
					)}
					<span className="flex items-center gap-1.5 text-muted-foreground">
						<Braces size={12} />
						<span className="font-medium">JSON</span>
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={handleFormat}
								disabled={disabled || isEmpty || hasError}
								aria-label="Format JSON"
								className="text-muted-foreground hover:text-foreground"
							>
								<Wand2 size={14} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Format (pretty-print)</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={handleCopy}
								disabled={isEmpty}
								aria-label="Copy JSON"
								className="text-muted-foreground hover:text-foreground"
							>
								<Copy size={14} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{copied ? "Copied" : "Copy"}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => onChange(emptyValue)}
								disabled={disabled}
								aria-label="Reset JSON"
								className="text-muted-foreground hover:text-foreground"
							>
								<RotateCcw size={14} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Reset to {emptyValue}</TooltipContent>
					</Tooltip>
				</div>
			</div>

			<Textarea
				value={safeValue}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				rows={rows}
				spellCheck={false}
				placeholder={placeholder}
				style={{ minHeight: 0 }}
				className={`w-full resize-y px-2 py-1.5 font-mono text-foreground text-xs leading-relaxed ${
					hasError
						? "border-destructive ring-destructive/20 focus:border-destructive"
						: ""
				} ${disabled ? "cursor-not-allowed bg-muted opacity-60" : ""}`}
			/>

			<div className="min-h-[1rem] text-xs">
				{hasError ? (
					<div className="flex items-start gap-1 text-destructive">
						<AlertCircle
							size={12}
							className="mt-0.5 flex-shrink-0"
						/>
						<span>
							{errorLocation
								? `Line ${errorLocation.line}, column ${errorLocation.col}: ${error}`
								: error}
						</span>
					</div>
				) : isEmpty ? (
					<span className="text-muted-foreground">Empty</span>
				) : (
					<div className="flex items-center gap-1 text-[color:var(--chart-2)]">
						<CheckCircle2 size={12} className="flex-shrink-0" />
						<span>Valid JSON</span>
					</div>
				)}
			</div>
		</div>
	);
};
