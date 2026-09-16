import {
	Copy as CopyIcon,
	Minus as MinusIcon,
	Plus as PlusIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { JsonViewer, PopoutModal, SandpackHtmlPreview } from "@semoss/shared";
import {
	Markdown,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { isTabularArray } from "@semoss/utility/json";
import {
	looksLikeHtmlDocument,
	looksLikeMarkdown,
	normalizeForMarkdown,
} from "@semoss/utility/string/markdown";

interface AutomationOutputModalProps {
	output: string | null;
	onClose: () => void;
}

export function AutomationOutputModal({
	output,
	onClose,
}: AutomationOutputModalProps) {
	if (output === null) return null;

	return <AutomationOutputModalContent output={output} onClose={onClose} />;
}

function AutomationOutputModalContent({
	output,
	onClose,
}: AutomationOutputModalProps) {
	const [raw, setRaw] = useState(false);
	const [expandVersion, setExpandVersion] = useState(0);
	const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);
	const value = output ?? "";
	const parsed = useMemo(() => {
		try {
			return JSON.parse(value);
		} catch {
			return null;
		}
	}, [value]);
	const formatted = parsed === null ? value : JSON.stringify(parsed, null, 2);
	const isObjectOutput = parsed !== null && typeof parsed === "object";
	const isTable = isObjectOutput && isTabularArray(parsed);
	const isMarkdown = !isObjectOutput && !raw && looksLikeMarkdown(value);
	const markdownText = isMarkdown ? normalizeForMarkdown(value) : "";
	const htmlText = !isObjectOutput ? normalizeForMarkdown(value) : "";
	const isHtml = !raw && looksLikeHtmlDocument(htmlText);

	return (
		<PopoutModal
			title="Result"
			meta={`${formatted.split("\n").length} lines`}
			actions={
				<div className="inline-flex items-center gap-1">
					<div className="inline-flex overflow-hidden rounded border border-current/30 font-medium text-[10px]">
						<button
							type="button"
							className={`px-1.5 py-0 ${!raw ? "bg-current/15" : "hover:bg-current/10"}`}
							onClick={() => setRaw(false)}
						>
							FORMATTED
						</button>
						<button
							type="button"
							className={`border-current/30 border-l px-1.5 py-0 ${raw ? "bg-current/15" : "hover:bg-current/10"}`}
							onClick={() => setRaw(true)}
						>
							RAW
						</button>
					</div>
					{!raw && isObjectOutput && (
						<div className="inline-flex overflow-hidden rounded border border-current/30">
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="flex items-center px-1 py-0.5"
										onClick={() => {
											setExpandAll(true);
											setExpandVersion(
												(version) => version + 1,
											);
										}}
										aria-label="Expand all"
									>
										<PlusIcon className="size-3" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Expand all</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="flex items-center border-current/30 border-l px-1 py-0.5"
										onClick={() => {
											setExpandAll(false);
											setExpandVersion(
												(version) => version + 1,
											);
										}}
										aria-label="Collapse all"
									>
										<MinusIcon className="size-3" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Collapse all</TooltipContent>
							</Tooltip>
						</div>
					)}
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								onClick={() =>
									void navigator.clipboard.writeText(
										raw ? value : formatted,
									)
								}
								aria-label="Copy output"
							>
								<CopyIcon className="size-3.5" />
							</button>
						</TooltipTrigger>
						<TooltipContent>Copy output</TooltipContent>
					</Tooltip>
				</div>
			}
			onClose={onClose}
		>
			{!raw && isTable ? (
				<DataTable rows={parsed as Record<string, unknown>[]} />
			) : !raw && isObjectOutput ? (
				<JsonViewer
					value={parsed}
					forceVersion={expandVersion}
					forceOpen={expandAll}
				/>
			) : !raw && isMarkdown ? (
				<div className="prose prose-sm dark:prose-invert max-w-none">
					<Markdown>{markdownText}</Markdown>
				</div>
			) : isHtml ? (
				<div className="h-[70vh] min-h-0">
					<SandpackHtmlPreview html={htmlText} forceFullHeight />
				</div>
			) : (
				<pre className="whitespace-pre-wrap break-all font-mono text-foreground text-sm">
					{raw ? value : formatted}
				</pre>
			)}
		</PopoutModal>
	);
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
	const columns = Object.keys(rows[0]);
	return (
		<div className="overflow-auto">
			<table className="w-full border-collapse text-xs">
				<thead>
					<tr className="border-b bg-muted/50">
						{columns.map((column) => (
							<th
								key={column}
								className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-muted-foreground"
							>
								{column}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						<tr
							key={`row-${index}-${String(row[columns[0]] ?? index)}`}
							className="border-b last:border-0 hover:bg-muted/30"
						>
							{columns.map((column) => (
								<td
									key={column}
									className="whitespace-nowrap px-2 py-1 text-foreground"
								>
									{String(row[column] ?? "")}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
