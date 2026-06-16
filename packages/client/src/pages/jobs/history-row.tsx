import {
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Copy,
	Maximize2,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	TableCell,
	TableRow,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@/utility";

const formatOutput = (raw: string | undefined) => {
	if (raw === undefined || raw === null || raw === "") {
		return "No Output.";
	}
	const trimmed = raw.trim();
	if (
		(trimmed.startsWith("{") && trimmed.endsWith("}")) ||
		(trimmed.startsWith("[") && trimmed.endsWith("]"))
	) {
		try {
			return JSON.stringify(JSON.parse(trimmed), null, 2);
		} catch {
			return raw;
		}
	}
	return raw;
};

export const HistoryRow = (props: {
	row: {
		jobId: string;
		jobName: string;
		execStart: string;
		execDelta: string;
		success: boolean;
		schedulerOutput: string;
	};
	open: boolean;
	onToggle: () => void;
}) => {
	const { row, open, onToggle } = props;
	const [fullscreenOpen, setFullscreenOpen] = useState(false);

	const formattedOutput = useMemo(
		() => formatOutput(row.schedulerOutput),
		[row.schedulerOutput],
	);

	return (
		<>
			<TableRow>
				<TableCell className="w-8">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onToggle}
						data-testid="historyRow-table-toggle-btn"
					>
						{open ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</Button>
				</TableCell>

				<TableCell className="max-w-[280px] text-sm">
					<div className="flex items-center gap-2">
						{row.success ? (
							<CheckCircle2
								className="size-4 shrink-0 text-success"
								aria-label="Success"
							/>
						) : (
							<XCircle
								className="size-4 shrink-0 text-destructive"
								aria-label="Failed"
							/>
						)}
						<div className="flex min-w-0 flex-col">
							<div className="group flex min-w-0 items-center gap-1">
								<span className="truncate">{row.jobName}</span>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										copyTextToClipboard(row.jobName);
									}}
									className="shrink-0 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
									title="Copy name"
									aria-label="Copy name"
								>
									<Copy className="size-3 text-muted-foreground" />
								</button>
							</div>
							<div className="group flex min-w-0 items-center gap-1">
								<span
									className="truncate text-muted-foreground text-xs"
									title={row.jobId}
								>
									jobId: {row.jobId}
								</span>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										copyTextToClipboard(row.jobId);
									}}
									className="shrink-0 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
									title="Copy job ID"
									aria-label="Copy job ID"
								>
									<Copy className="size-3 text-muted-foreground" />
								</button>
							</div>
						</div>
					</div>
				</TableCell>
				<TableCell className="hidden text-xs sm:table-cell">
					{row.execStart}
				</TableCell>
				<TableCell className="hidden text-xs md:table-cell">
					{row.execDelta}
				</TableCell>
			</TableRow>

			{open && (
				<TableRow>
					<TableCell colSpan={4} className="bg-muted/20 p-0">
						<div className="flex w-full min-w-0 max-w-full flex-col gap-2 p-4">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-xs">
									Output
								</span>
								<div className="flex items-center gap-1">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-7 px-2 text-muted-foreground text-xs"
										onClick={() => setFullscreenOpen(true)}
										title="Expand"
									>
										<Maximize2 className="size-3" /> Expand
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-7 px-2 text-muted-foreground text-xs"
										onClick={() =>
											copyTextToClipboard(formattedOutput)
										}
									>
										<Copy className="size-3" /> Copy
									</Button>
								</div>
							</div>
							<pre className="max-h-[300px] w-full min-w-0 max-w-full overflow-y-auto whitespace-pre-wrap break-all rounded bg-muted/30 px-2 py-1 font-mono text-xs">
								{formattedOutput}
							</pre>
						</div>
					</TableCell>
				</TableRow>
			)}

			<Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
				<DialogContent className="flex h-[85vh] w-[90vw] max-w-[90vw] flex-col gap-3 p-6 sm:max-w-[90vw]">
					<DialogHeader className="shrink-0">
						<DialogTitle className="flex items-center gap-2 pr-8">
							<span className="truncate">{row.jobName}</span>
							<span className="font-normal text-muted-foreground text-xs">
								{row.execStart}
							</span>
						</DialogTitle>
					</DialogHeader>
					<div className="flex shrink-0 items-center justify-between">
						<span className="text-muted-foreground text-xs">
							Output
						</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-muted-foreground text-xs"
							onClick={() => copyTextToClipboard(formattedOutput)}
						>
							<Copy className="size-3" /> Copy
						</Button>
					</div>
					<pre className="min-h-0 w-full max-w-full flex-1 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/30 p-3 font-mono text-xs">
						{formattedOutput}
					</pre>
				</DialogContent>
			</Dialog>
		</>
	);
};
