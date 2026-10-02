import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Button,
	cn,
	H3,
	Input,
	Muted,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { searchAppLogs } from "@/api";
import { useProject } from "@/hooks";
import {
	APP_LOG_LEVEL_BADGE_CLASSES,
	APP_LOG_LEVEL_CHIP_CLASSES,
	type ParsedAppLogLine,
	parseAppLogLine,
} from "@/utility/parse-app-log-line";

const PAGE_SIZE = 50;

interface SearchCriteria {
	query: string;
	levels: string[];
}

/**
 * Searches this project's app.log (and its rotated siblings) on disk via
 * SearchAppLogsReactor — historical, durable-enough (bounded by rotation),
 * searchable. Deliberately not live — for that, see the Console panel in the
 * code workspace.
 */
export const AppLogsPage = () => {
	const { project } = useProject();
	const appId = project.project_id;

	const [query, setQuery] = useState("");
	const [levels, setLevels] = useState<string[]>([]);
	const [appliedCriteria, setAppliedCriteria] = useState<SearchCriteria>({
		query: "",
		levels: [],
	});
	const [offset, setOffset] = useState(0);
	const [lines, setLines] = useState<ParsedAppLogLine[]>([]);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const requestIdRef = useRef(0);

	const runSearch = useCallback(
		async (searchOffset: number, criteria: SearchCriteria) => {
			const requestId = ++requestIdRef.current;
			setLoading(true);
			setError(null);
			setAppliedCriteria(criteria);
			try {
				const data = await searchAppLogs({
					projectId: appId,
					query: criteria.query.trim() || undefined,
					levels: criteria.levels,
					offset: searchOffset,
					limit: PAGE_SIZE,
				});
				if (requestId !== requestIdRef.current) {
					return;
				}
				setLines(data.lines.map(parseAppLogLine));
				setHasMore(data.hasMore);
				setOffset(searchOffset);
			} catch {
				if (requestId !== requestIdRef.current) {
					return;
				}
				setError("Unable to search application logs.");
				setLines([]);
				setHasMore(false);
			} finally {
				if (requestId === requestIdRef.current) {
					setLoading(false);
				}
			}
		},
		[appId],
	);

	useEffect(() => {
		void runSearch(0, { query: "", levels: [] });
	}, [runSearch]);

	const rangeEnd = offset + lines.length;
	const hasAppliedFilters =
		appliedCriteria.query.trim().length > 0 ||
		appliedCriteria.levels.length > 0;

	return (
		<div
			className="flex h-full flex-col gap-3 p-4"
			data-testid="app-logs-page-container"
		>
			<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<H3>Application logs</H3>
				<Muted>
					Searches bounded runtime history stored outside project
					content. Use Console for live activity.
				</Muted>
			</div>

			<div className="flex flex-wrap items-center gap-2 border-border border-b pb-3">
				<div className="relative min-w-48 flex-1">
					<Search
						aria-hidden="true"
						className="-translate-y-1/2 absolute start-3 top-1/2 size-4 text-muted-foreground"
					/>
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								void runSearch(0, query, levels);
							}
						}}
						aria-label="Search application log text"
						placeholder="Search log text"
						className="ps-9"
						data-testid="app-logs-page-search"
					/>
				</div>
				<ToggleGroup
					type="multiple"
					size="sm"
					variant="outline"
					value={levels}
					onValueChange={setLevels}
					data-testid="app-logs-page-level-filter"
					className="gap-1"
					spacing={2}
				>
					<ToggleGroupItem
						value="INFO"
						aria-label="Toggle INFO"
						data-testid="app-logs-page-level-toggle-info"
						className={cn(
							"font-mono text-xs",
							APP_LOG_LEVEL_CHIP_CLASSES.INFO,
						)}
					>
						INFO
					</ToggleGroupItem>
					<ToggleGroupItem
						value="WARN"
						aria-label="Toggle WARN"
						data-testid="app-logs-page-level-toggle-warn"
						className={cn(
							"font-mono text-xs",
							APP_LOG_LEVEL_CHIP_CLASSES.WARN,
						)}
					>
						WARN
					</ToggleGroupItem>
					<ToggleGroupItem
						value="ERROR"
						aria-label="Toggle ERROR"
						data-testid="app-logs-page-level-toggle-error"
						className={cn(
							"font-mono text-xs",
							APP_LOG_LEVEL_CHIP_CLASSES.ERROR,
						)}
					>
						ERROR
					</ToggleGroupItem>
					<ToggleGroupItem
						value="DEBUG"
						aria-label="Toggle DEBUG"
						data-testid="app-logs-page-level-toggle-debug"
						className={cn(
							"font-mono text-xs",
							APP_LOG_LEVEL_CHIP_CLASSES.DEBUG,
						)}
					>
						DEBUG
					</ToggleGroupItem>
				</ToggleGroup>
				<Button
					size="sm"
					onClick={() => void runSearch(0, { query, levels })}
					disabled={loading}
					data-testid="app-logs-page-search-button"
				>
					{loading ? "Searching…" : "Search"}
				</Button>
			</div>

			{error ? (
				<div
					className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-xs"
					data-testid="app-logs-page-error"
					role="alert"
				>
					{error}
				</div>
			) : null}

			<section
				className="min-h-0 flex-1 overflow-auto rounded-md border border-border focus-visible:outline-2 focus-visible:outline-ring"
				aria-label="Application log search results"
				aria-busy={loading}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users need to scroll the wide results table
				tabIndex={0}
			>
				<table className="w-full min-w-max text-sm">
					<thead className="sticky top-0 bg-muted/60">
						<tr>
							<th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
								Time
							</th>
							<th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
								Level
							</th>
							<th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
								Source
							</th>
							<th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
								Message
							</th>
						</tr>
					</thead>
					<tbody>
						{lines.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="px-3 py-8 text-center text-muted-foreground text-sm"
								>
									{loading
										? "Loading application logs..."
										: hasAppliedFilters
											? "No application logs match the current filters."
											: "No application logs are available yet."}
								</td>
							</tr>
						) : (
							lines.map((line, index) => (
								<tr
									key={`${offset + index}-${line.raw}`}
									className="border-border border-t hover:bg-muted/30"
								>
									<td className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground text-xs">
										{line.timestamp ?? "—"}
									</td>
									<td className="whitespace-nowrap px-3 py-2">
										<span
											className={cn(
												"inline-block rounded px-1.5 py-0.5 font-mono font-semibold text-xs",
												APP_LOG_LEVEL_BADGE_CLASSES[
													line.level
												],
											)}
										>
											{line.level}
										</span>
									</td>
									<td className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground text-xs">
										{line.source ?? "—"}
									</td>
									<td className="px-3 py-2 font-mono text-xs">
										{line.message ?? line.raw}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</section>

			<div className="flex items-center justify-between text-muted-foreground text-xs">
				<output aria-live="polite">
					{loading
						? "Searching application logs..."
						: lines.length > 0
							? `Showing ${offset + 1}-${rangeEnd}${hasMore ? ", with more results available" : ""}`
							: null}
				</output>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={offset === 0 || loading}
						data-testid="app-logs-page-previous-button"
						onClick={() =>
							void runSearch(
								Math.max(0, offset - PAGE_SIZE),
								appliedCriteria,
							)
						}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!hasMore || loading}
						data-testid="app-logs-page-next-button"
						onClick={() =>
							void runSearch(offset + PAGE_SIZE, appliedCriteria)
						}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
};
