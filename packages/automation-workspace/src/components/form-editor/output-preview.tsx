import { ChevronDown, ChevronRight, ClipboardCopy } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { toast } from "@semoss/ui/next";
import { extractDataset } from "../../domain/automation-utils";

export interface OutputPreviewProps {
	/** Raw node output value (JSON string, markdown, or plain text) */
	value: string;
	/** Whether the full/expanded preview is currently shown */
	expanded: boolean;
	/** Called when the expand/collapse toggle is clicked */
	onToggle: () => void;
	/** Node type, used to pick a render mode (markdown, table, vector-results) */
	nodeType?: string;
}

export function OutputPreview({
	value,
	expanded,
	onToggle,
	nodeType,
}: OutputPreviewProps) {
	const preview = value.length > 180 ? `${value.slice(0, 180)}…` : value;
	const [tableView, setTableView] = useState<"table" | "json">("json");

	const parsed = useMemo(() => {
		try {
			return JSON.parse(value);
		} catch {
			return null;
		}
	}, [value]);

	const dbDataset = useMemo(
		() => (parsed ? extractDataset(parsed) : null),
		[parsed],
	);

	const renderMode = useMemo(() => {
		if (nodeType === "model-engine") return "markdown";
		if (nodeType === "vector-engine" && Array.isArray(parsed))
			return "vector-results";
		if (dbDataset) return "table";
		return "text";
	}, [nodeType, parsed, dbDataset]);

	const renderExpanded = () => {
		if (renderMode === "markdown") {
			return (
				<div className="prose prose-sm dark:prose-invert max-h-64 max-w-none overflow-auto pr-8 text-[12px]">
					{value.split("\n").map((line, i) => {
						if (line.startsWith("# "))
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
								<Fragment key={i}>
									<h3 className="mt-2 mb-1 font-bold text-sm">
										{line.slice(2)}
									</h3>
								</Fragment>
							);
						if (line.startsWith("## "))
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
								<Fragment key={i}>
									<h4 className="mt-2 mb-1 font-semibold text-xs">
										{line.slice(3)}
									</h4>
								</Fragment>
							);
						if (line.startsWith("- "))
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
								<Fragment key={i}>
									<li className="ml-4 list-disc text-foreground">
										{line.slice(2)}
									</li>
								</Fragment>
							);
						if (line.startsWith("**") && line.endsWith("**"))
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
								<Fragment key={i}>
									<p className="font-semibold text-foreground">
										{line.slice(2, -2)}
									</p>
								</Fragment>
							);
						if (line.trim() === "")
							// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
							return <br key={i} />;
						return (
							// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
							<p key={i} className="text-foreground">
								{line}
							</p>
						);
					})}
				</div>
			);
		}

		if (renderMode === "vector-results" && Array.isArray(parsed)) {
			return (
				<div className="max-h-64 space-y-2 overflow-auto pr-8">
					{parsed.map(
						(result: Record<string, unknown>, i: number) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: results are rebuilt whole from a single run's output each render, never reordered
							<Fragment key={i}>
								<div className="rounded-md border bg-background p-2.5">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-foreground text-xs">
											#{i + 1}{" "}
											{result.Source
												? String(result.Source)
												: ""}
										</span>
										{result.Score != null && (
											<span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
												{Number(result.Score).toFixed(
													3,
												)}
											</span>
										)}
									</div>
									{result.Content != null && (
										<p className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">
											{String(result.Content).slice(
												0,
												200,
											)}
										</p>
									)}
								</div>
							</Fragment>
						),
					)}
				</div>
			);
		}

		if (renderMode === "table" && dbDataset) {
			const { headers, rows } = dbDataset;
			return (
				<div className="space-y-1.5 pr-8">
					{/* View toggle: JSON / Table */}
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setTableView("json")}
							className={`rounded border px-2 py-0.5 text-[10px] transition-colors ${
								tableView === "json"
									? "border-primary bg-primary/10 font-medium text-primary"
									: "border-border text-muted-foreground hover:border-primary/40"
							}`}
						>
							JSON
						</button>
						<button
							type="button"
							onClick={() => setTableView("table")}
							className={`rounded border px-2 py-0.5 text-[10px] transition-colors ${
								tableView === "table"
									? "border-primary bg-primary/10 font-medium text-primary"
									: "border-border text-muted-foreground hover:border-primary/40"
							}`}
						>
							Table
						</button>
						<span className="ml-auto text-[10px] text-muted-foreground/60">
							{rows.length} row{rows.length !== 1 ? "s" : ""}
						</span>
					</div>

					{tableView === "table" ? (
						<div className="max-h-64 overflow-auto rounded border">
							<table className="w-full border-collapse text-[11px]">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="w-8 px-2 py-1.5 text-center font-semibold text-muted-foreground/60">
											#
										</th>
										{headers.map((h) => (
											<th
												key={h}
												className="px-2 py-1.5 text-left font-semibold text-foreground"
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{rows.map((row, i) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: rows rebuilt from a single run each render
										<Fragment key={i}>
											<tr className="border-muted/50 border-b last:border-0">
												<td className="px-2 py-1 text-center text-[10px] text-muted-foreground/60">
													{i + 1}
												</td>
												{headers.map((h, j) => (
													<td
														key={h}
														className="px-2 py-1 text-foreground"
													>
														{row[j] != null
															? String(row[j])
															: "—"}
													</td>
												))}
											</tr>
										</Fragment>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded border bg-muted/20 p-2 text-[11px] text-foreground">
							{JSON.stringify(parsed, null, 2)}
						</pre>
					)}
				</div>
			);
		}

		return (
			<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all pr-8 text-[11px] text-foreground">
				{value}
			</pre>
		);
	};

	return (
		<div className="space-y-2">
			<div className="relative rounded-md border bg-muted/30 px-3 py-2 font-mono text-[11px] text-muted-foreground">
				<button
					type="button"
					className="absolute top-2 right-2 z-10 rounded-md border bg-background p-1 text-muted-foreground hover:text-foreground"
					onClick={() => {
						navigator.clipboard.writeText(value);
						toast.success("Copied to clipboard");
					}}
				>
					<ClipboardCopy className="h-3 w-3" />
				</button>
				{expanded ? (
					renderExpanded()
				) : (
					<p className="whitespace-pre-wrap break-all pr-8">
						{preview}
					</p>
				)}
			</div>
			{value.length > 180 && (
				<button
					type="button"
					onClick={onToggle}
					className="inline-flex items-center gap-0.5 text-primary leading-none hover:underline"
				>
					<span className="text-[11px]">
						{expanded ? "Hide" : "Expand"}
					</span>
					{expanded ? (
						<ChevronDown className="h-2.5 w-2.5" />
					) : (
						<ChevronRight className="h-2.5 w-2.5" />
					)}
				</button>
			)}
		</div>
	);
}
