import { ChevronDown, ChevronRight, ClipboardCopy } from "lucide-react";
import { useMemo } from "react";
import { toast } from "@semoss/ui/next";

export function OutputPreview({
	value,
	expanded,
	onToggle,
	nodeType,
}: {
	value: string;
	expanded: boolean;
	onToggle: () => void;
	nodeType?: string;
}) {
	const preview = value.length > 180 ? `${value.slice(0, 180)}…` : value;

	const parsed = useMemo(() => {
		try {
			return JSON.parse(value);
		} catch {
			return null;
		}
	}, [value]);

	const renderMode = useMemo(() => {
		if (nodeType === "model-engine") return "markdown";
		if (nodeType === "vector-engine" && Array.isArray(parsed))
			return "vector-results";
		if (
			Array.isArray(parsed) &&
			parsed.length > 0 &&
			typeof parsed[0] === "object"
		)
			return "table";
		return "text";
	}, [nodeType, parsed]);

	const renderExpanded = () => {
		if (renderMode === "markdown") {
			return (
				<div className="prose prose-sm dark:prose-invert max-h-64 max-w-none overflow-auto pr-8 text-[12px]">
					{value.split("\n").map((line, i) => {
						if (line.startsWith("# "))
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
								<h3
									key={i}
									className="mt-2 mb-1 font-bold text-sm"
								>
									{line.slice(2)}
								</h3>
							);
						if (line.startsWith("## "))
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
								<h4
									key={i}
									className="mt-2 mb-1 font-semibold text-xs"
								>
									{line.slice(3)}
								</h4>
							);
						if (line.startsWith("- "))
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
								<li
									key={i}
									className="ml-4 list-disc text-foreground"
								>
									{line.slice(2)}
								</li>
							);
						if (line.startsWith("**") && line.endsWith("**"))
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: static text preview rebuilt whole from `value` each render, never reordered
								<p
									key={i}
									className="font-semibold text-foreground"
								>
									{line.slice(2, -2)}
								</p>
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
							<div
								key={i}
								className="rounded-md border bg-background p-2.5"
							>
								<div className="flex items-center justify-between">
									<span className="font-semibold text-foreground text-xs">
										#{i + 1}{" "}
										{result.Source
											? String(result.Source)
											: ""}
									</span>
									{result.Score != null && (
										<span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
											{Number(result.Score).toFixed(3)}
										</span>
									)}
								</div>
								{result.Content && (
									<p className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">
										{String(result.Content).slice(0, 200)}
									</p>
								)}
							</div>
						),
					)}
				</div>
			);
		}

		if (renderMode === "table" && Array.isArray(parsed)) {
			const keys = Object.keys(parsed[0] as Record<string, unknown>);
			return (
				<div className="max-h-64 overflow-auto pr-8">
					<table className="w-full border-collapse text-[11px]">
						<thead>
							<tr className="border-b bg-muted/50">
								{keys.map((key) => (
									<th
										key={key}
										className="px-2 py-1.5 text-left font-semibold text-foreground"
									>
										{key}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{(parsed as Record<string, unknown>[]).map(
								(row, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: rows are rebuilt whole from a single run's output each render, never reordered
									<tr
										key={i}
										className="border-muted/50 border-b last:border-0"
									>
										{keys.map((key) => (
											<td
												key={key}
												className="px-2 py-1 text-foreground"
											>
												{row[key] != null
													? String(row[key])
													: "—"}
											</td>
										))}
									</tr>
								),
							)}
						</tbody>
					</table>
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
					className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
				>
					{expanded
						? "Hide"
						: renderMode === "table"
							? "Show table"
							: renderMode === "vector-results"
								? "Show results"
								: "Expand"}
					{expanded ? (
						<ChevronDown className="h-3 w-3" />
					) : (
						<ChevronRight className="h-3 w-3" />
					)}
				</button>
			)}
		</div>
	);
}
