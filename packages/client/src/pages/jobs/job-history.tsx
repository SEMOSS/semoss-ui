import { ChevronRight, Search } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
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
	onSearchChange?: (search: string) => void;
}) => {
	const {
		history,
		historyLoading,
		historyCount,
		historyPage,
		historyRowsPerPage,
		onPageChange,
		onRowsPerPageChange,
		onSearchChange,
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
		<Accordion
			type="single"
			collapsible
			className="w-full rounded-md border"
		>
			<AccordionItem value="history" className="border-0">
				<AccordionTrigger className="px-4">
					<div className="flex items-center gap-2">
						<ChevronRight className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/accordion:rotate-90" />
						History
					</div>
				</AccordionTrigger>
				<AccordionContent className="px-4 pb-4">
					<InputGroup className="mb-3 w-full">
						<InputGroupAddon>
							<Search className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							placeholder="Search history..."
							onChange={(e) => onSearchChange?.(e.target.value)}
						/>
					</InputGroup>
					<div className="overflow-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/50">
								<tr>
									<th className="w-8 px-2 py-2" />
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">
										Name
									</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">
										Run Date
									</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">
										Time
									</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">
										Status
									</th>
								</tr>
							</thead>
							<tbody>
								{historyLoading && (
									<tr>
										<td colSpan={5} className="p-0">
											<div className="h-1 w-full animate-pulse bg-primary/30" />
										</td>
									</tr>
								)}
								{!historyLoading && history.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="py-6 text-center text-muted-foreground"
										>
											No job history, please try again.
										</td>
									</tr>
								) : (
									history.map((h, i) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										<HistoryRow key={i} row={h} />
									))
								)}
							</tbody>
						</table>
					</div>
					<div className="mt-2 flex items-center justify-between text-muted-foreground text-sm">
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
									{[5, 10, 25].map((n) => (
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
								variant="outline"
								size="icon"
								disabled={historyPage === 0}
								onClick={() => onPageChange?.(historyPage - 1)}
							>
								<ChevronRight className="size-4 rotate-180" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								disabled={isLastPage || history.length === 0}
								onClick={() => onPageChange?.(historyPage + 1)}
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
};
