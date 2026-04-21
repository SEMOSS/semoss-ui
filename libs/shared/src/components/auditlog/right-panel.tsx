import {
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Info,
	Loader2,
	XCircle,
} from "lucide-react";
import { Button } from "@semoss/ui/next";
import { type SearchToken, TokenizedSearchBar } from "./events-search-bar";
import {
	type AuditLog,
	latencyBg,
	latencyColor,
	parseArg,
} from "./types/audit";

export interface EventHistoryProps {
	loading: boolean;
	logs: AuditLog[];
	searchFiltered: AuditLog[];
	sessions: [string, AuditLog[]][];
	totalCount: number;
	totalPages: number;

	selected: AuditLog | null;
	hoveredIdx: number | null;

	searchTokens: SearchToken[];
	searchFreeText: string;

	page: number;

	onSelectLog: (log: AuditLog) => void;
	onHoverLog: (idx: number | null) => void;
	onTokensChange: (tokens: SearchToken[]) => void;
	onFreeTextChange: (text: string) => void;
	onSearch: (tokens: SearchToken[], freeText: string) => void;
	onPageChange: (updater: number | ((prev: number) => number)) => void;
}

const ROWS_PER_PAGE = 10;

export const EventHistory = ({
	loading,
	logs,
	searchFiltered,
	sessions,
	totalCount,
	totalPages,
	selected,
	hoveredIdx,
	searchTokens,
	searchFreeText,
	page,
	onSelectLog,
	onHoverLog,
	onTokensChange,
	onFreeTextChange,
	onSearch,
	onPageChange,
}: EventHistoryProps) => {
	return (
		<div className="flex h-[600px] flex-col rounded-lg border border-border bg-card">
			<div className="flex-shrink-0 border-border border-b">
				<div className="flex items-center justify-between px-3 py-2">
					<span className="text-[10px] text-muted-foreground uppercase tracking-widest">
						Event History — {searchFiltered.length}
					</span>

					<div className="group relative">
						<Info className="h-4 w-4 cursor-pointer text-muted-foreground" />

						<div className="absolute right-0 bottom-full z-10 mb-2 w-max max-w-xs whitespace-nowrap rounded-md bg-black px-2 py-1 text-[10px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
							engineType and methodName should be case sensitive
						</div>
					</div>
				</div>

				<TokenizedSearchBar
					tokens={searchTokens}
					freeText={searchFreeText}
					onTokensChange={onTokensChange}
					onFreeTextChange={onFreeTextChange}
					onSearch={onSearch}
				/>
			</div>

			<div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
				{loading ? (
					<div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-xs">
						<Loader2 size={14} className="animate-spin" />
						Loading…
					</div>
				) : (
					<>
						{sessions.map(([sessionId, sessionLogs]) => (
							<div key={sessionId}>
								<div className="sticky top-0 z-10 flex items-center gap-2 border-border/50 border-b bg-card px-3 py-1">
									<div className="h-3 w-1 flex-shrink-0 rounded-full bg-primary text-primary" />
									<span className="font-mono font-semibold text-[9px] text-primary uppercase tracking-widest">
										Session
									</span>
									<span className="inline-block font-mono text-[9px] text-muted-foreground">
										{sessionId}
									</span>
									<span className="ml-auto text-[9px] text-muted-foreground">
										{sessionLogs.length}
									</span>
								</div>

								{sessionLogs.map((log) => {
									const globalIdx =
										searchFiltered.indexOf(log);
									const isHovered = hoveredIdx === globalIdx;
									const isSelected =
										selected?.spanId === log.spanId;

									return (
										<button
											type="button"
											key={log.spanId}
											onClick={() => onSelectLog(log)}
											onMouseEnter={() =>
												onHoverLog(globalIdx)
											}
											onMouseLeave={() =>
												onHoverLog(null)
											}
											className={`flex w-full cursor-pointer items-center gap-2 border-border/30 border-b border-none px-3 py-1.5 text-left transition-colors ${
												isSelected
													? "border-l-2 border-l-primary bg-primary/10"
													: isHovered
														? "bg-secondary"
														: "bg-transparent hover:bg-secondary/50"
											}`}
										>
											{log.status ? (
												<CheckCircle
													size={11}
													className="flex-shrink-0 text-success"
												/>
											) : (
												<XCircle
													size={11}
													className="flex-shrink-0 text-destructive"
												/>
											)}

											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-1.5">
													{parseArg(log.request) && (
														<span className="inline-block max-w-[300px] truncate rounded border border-primary/20 bg-primary/10 px-1 py-0 font-mono text-[8px] text-primary">
															{parseArg(
																log.request,
															)}
														</span>
													)}
													<span className="font-mono text-[10px] text-primary">
														{log.methodName}
													</span>
													<span className="ml-auto rounded bg-secondary px-1 font-mono text-[8px] text-muted-foreground">
														{log.engineType}
													</span>
												</div>
												<span className="font-mono text-[8px] text-muted-foreground">
													{log.logTimestamp} -{" "}
													{log.engineName}
												</span>
											</div>

											<div className="flex w-20 flex-shrink-0 items-center gap-1">
												<div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
													<div
														className={`h-full rounded-full ${latencyBg(log.latency)}`}
														style={{
															width: `${Math.min(
																100,
																(log.latency /
																	10) *
																	100,
															)}%`,
														}}
													/>
												</div>
												<span
													className={`w-8 text-right font-medium font-mono text-[9px] ${latencyColor(log.latency)}`}
												>
													{log.latency}ms
												</span>
											</div>
										</button>
									);
								})}
							</div>
						))}

						{!loading && logs.length === 0 && (
							<div className="flex items-center justify-center py-16 text-muted-foreground text-xs">
								No executions match the current filters
							</div>
						)}
						{!loading &&
							logs.length > 0 &&
							searchFiltered.length === 0 && (
								<div className="flex items-center justify-center py-16 text-muted-foreground text-xs">
									No results match your search
								</div>
							)}
					</>
				)}
			</div>

			<div className="flex flex-shrink-0 items-center justify-between gap-2 border-border border-t px-3 py-1">
				<span className="text-[9px] text-muted-foreground">
					{page * ROWS_PER_PAGE + 1}–
					{Math.min((page + 1) * ROWS_PER_PAGE, totalCount)} of{" "}
					{totalCount}
				</span>

				<div className="flex items-center gap-1">
					<Button
						disabled={page === 0}
						onClick={() => onPageChange((p) => p - 1)}
						variant="ghost"
						className="flex cursor-pointer items-center gap-0.5 rounded border border-border bg-transparent px-1.5 py-0.5 text-[9px] text-muted-foreground transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
					>
						<ChevronLeft size={9} />
						Prev
					</Button>
					<span className="px-1 font-mono text-[9px] text-muted-foreground">
						{page + 1}/{Math.max(1, totalPages)}
					</span>
					<Button
						disabled={page >= totalPages - 1}
						onClick={() => onPageChange((p) => p + 1)}
						variant="ghost"
						className="flex cursor-pointer items-center gap-0.5 rounded border border-border bg-transparent px-1.5 py-0.5 text-[9px] text-muted-foreground transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
					>
						Next
						<ChevronRight size={9} />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default EventHistory;
