import { ChevronRight } from "lucide-react";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { HistoryRow } from "./history-row";
import type { HistoryJob } from "./job.types";

export const JobHistory = (props: {
	history: HistoryJob[];
	historyLoading: boolean;
	historyCount: number;
	historyPage: number;
	historyRowsPerPage: number;
	onPageChange?: (page: number) => void;
	onRowsPerPageChange?: (rowsPerPage: number) => void;
	expandedIndices: Set<number>;
	onToggleExpanded: (idx: number) => void;
}) => {
	const {
		history,
		historyLoading,
		historyCount,
		historyPage,
		historyRowsPerPage,
		onPageChange,
		onRowsPerPageChange,
		expandedIndices,
		onToggleExpanded,
	} = props;

	const startRow = historyPage * historyRowsPerPage + 1;
	const endRow = Math.min(
		(historyPage + 1) * historyRowsPerPage,
		historyCount >= 0
			? historyCount
			: (historyPage + 1) * historyRowsPerPage,
	);
	const isLastPage =
		historyCount >= 0 &&
		(historyPage + 1) * historyRowsPerPage >= historyCount;

	return (
		<div className="flex flex-col gap-2">
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-8" />
							<TableHead>Name</TableHead>
							<TableHead className="hidden sm:table-cell">
								Run Date
							</TableHead>
							<TableHead className="hidden md:table-cell">
								Duration
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{historyLoading && (
							<TableRow>
								<TableCell colSpan={4}>
									<div className="flex justify-center py-4">
										<Spinner />
									</div>
								</TableCell>
							</TableRow>
						)}
						{!historyLoading && history.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-6 text-center text-muted-foreground"
								>
									No job history.
								</TableCell>
							</TableRow>
						)}
						{!historyLoading &&
							history.map((h, i) => (
								<HistoryRow
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									key={i}
									row={h}
									open={expandedIndices.has(i)}
									onToggle={() => onToggleExpanded(i)}
								/>
							))}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between text-muted-foreground text-sm">
				<div className="flex items-center gap-2">
					<span>Rows per page:</span>
					<Select
						value={String(historyRowsPerPage)}
						onValueChange={(val) =>
							onRowsPerPageChange?.(Number(val))
						}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[50, 100, 200].map((n) => (
								<SelectItem key={n} value={String(n)}>
									{n}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span>
						{startRow}–{endRow}
						{historyCount >= 0 ? ` of ${historyCount}` : ""}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						disabled={historyPage === 0}
						onClick={() => onPageChange?.(historyPage - 1)}
					>
						<ChevronRight className="size-4 rotate-180" />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon"
						disabled={isLastPage || history.length === 0}
						onClick={() => onPageChange?.(historyPage + 1)}
					>
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
};
