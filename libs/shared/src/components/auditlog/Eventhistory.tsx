/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */

import {
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Loader2,
	XCircle,
} from "lucide-react";
import { Button } from "@semoss/ui/next";
import { type SearchToken, TokenizedSearchBar } from "./TokenizedSearchBar";
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
		<div className="flex h-[700px] flex-col rounded-lg border border-border bg-card">
			{/* ── Header: title + search box ── */}
			<div className="flex-shrink-0 border-border border-b">
				<div className="flex items-center justify-between px-3 py-2">
					<span className="text-[10px] text-muted-foreground uppercase tracking-widest">
						Event History — {searchFiltered.length}
					</span>
				</div>

				<TokenizedSearchBar
					tokens={searchTokens}
					freeText={searchFreeText}
					onTokensChange={onTokensChange}
					onFreeTextChange={onFreeTextChange}
					onSearch={onSearch}
				/>
			</div>

			{/* ── Log list ── */}
			<div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
				{loading ? (
					<div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-xs">
						<Loader2 size={14} className="animate-spin" />
						Loading…
					</div>
				) : (
					<>
						{sessions.map(([sessionId, sessionLogs], si) => (
							<div key={sessionId}>
								{/* Session header */}
								<div className="sticky top-0 z-10 flex items-center gap-2 border-border/50 border-b bg-card px-3 py-1">
									<div className="h-3 w-1 flex-shrink-0 rounded-full bg-primary text-primary" />
									<span className="font-mono font-semibold text-[9px] text-primary uppercase tracking-widest">
										Session {si + 1}
									</span>
									<span
										className="inline-block max-w-[120px] truncate font-mono text-[9px] text-muted-foreground"
										title={sessionId}
									>
										{sessionId}
									</span>
									<span className="ml-auto text-[9px] text-muted-foreground">
										{sessionLogs.length}
									</span>
								</div>

								{/* Log rows */}
								{sessionLogs.map((log) => {
									const globalIdx =
										searchFiltered.indexOf(log);
									const isHovered = hoveredIdx === globalIdx;
									const isSelected =
										selected?.spanId === log.spanId;

									return (
										<div
											key={log.spanId}
											onClick={() => onSelectLog(log)}
											onMouseEnter={() =>
												onHoverLog(globalIdx)
											}
											onMouseLeave={() =>
												onHoverLog(null)
											}
											className={`flex cursor-pointer items-center gap-2 border-border/30 border-b px-3 py-1.5 transition-colors ${
												isSelected
													? "border-l-2 border-l-primary bg-primary/10"
													: isHovered
														? "bg-secondary"
														: "hover:bg-secondary/50"
											}`}
										>
											{/* Status icon */}
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

											{/* Method + engine info */}
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-1.5">
													<span className="font-mono text-[10px] text-primary">
														{log.methodName}
													</span>
													{parseArg(log.request) && (
														<span className="inline-block max-w-[300px] truncate rounded border border-primary/20 bg-primary/10 px-1 py-0 font-mono text-[8px] text-primary">
															{parseArg(
																log.request,
															)}
														</span>
													)}
													<span className="ml-auto rounded bg-secondary px-1 font-mono text-[8px] text-muted-foreground">
														{log.engineType}
													</span>
												</div>
												<span className="font-mono text-[8px] text-muted-foreground">
													{log.logTimestamp} -{" "}
													{log.engineName}
													{log.userId}
												</span>
											</div>

											{/* Latency bar + value */}
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
										</div>
									);
								})}
							</div>
						))}

						{/* Empty states */}
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

			{/* ── Footer: count + pagination ── */}
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
