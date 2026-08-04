import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import { Button, ToggleGroup, ToggleGroupItem } from "@semoss/ui/next";
import { useProject, useRootStore } from "@/hooks";
import {
	APP_LOG_LEVEL_BADGE_CLASSES,
	APP_LOG_LEVEL_CHIP_CLASSES,
	type ParsedAppLogLine,
	parseAppLogLine,
} from "@/utility/parse-app-log-line";

const PAGE_SIZE = 50;

interface SearchAppLogsResult {
	lines: string[];
	totalMatches: number;
	hasMore: boolean;
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
	const { monolithStore } = useRootStore();

	const [query, setQuery] = useState("");
	const [levels, setLevels] = useState<string[]>([]);
	const [offset, setOffset] = useState(0);
	const [lines, setLines] = useState<ParsedAppLogLine[]>([]);
	const [totalMatches, setTotalMatches] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const runSearch = useCallback(
		async (searchOffset: number) => {
			setLoading(true);
			setError(null);
			try {
				const params: Record<string, string> = {
					projectId: appId,
					offset: String(searchOffset),
					limit: String(PAGE_SIZE),
				};
				if (query.trim()) {
					params.query = query.trim();
				}
				if (levels.length > 0) {
					params.levels = levels.join(",");
				}
				const paramValues = Object.entries(params)
					.map(
						([key, value]) =>
							`"${key}": "${value.replace(/"/g, '\\"')}"`,
					)
					.join(", ");
				const res = await monolithStore.runQuery<[SearchAppLogsResult]>(
					`SearchAppLogs(paramValues=[{${paramValues}}]);`,
				);
				const { operationType, output } = res.pixelReturn[0];
				if (operationType.includes("ERROR")) {
					throw new Error("Search failed");
				}
				const data = output as unknown as SearchAppLogsResult;
				setLines(data.lines.map(parseAppLogLine));
				setTotalMatches(data.totalMatches);
				setHasMore(data.hasMore);
				setOffset(searchOffset);
			} catch {
				setError(
					"Only project owners can search app logs, or the search itself failed.",
				);
				setLines([]);
				setTotalMatches(0);
				setHasMore(false);
			} finally {
				setLoading(false);
			}
		},
		[appId, query, levels, monolithStore],
	);

	const rangeEnd = Math.min(offset + lines.length, totalMatches);

	return (
		<div
			className="flex h-full flex-col gap-3 p-4"
			data-testid="app-logs-page-container"
		>
			<div className="flex items-center justify-between gap-2">
				<h3 className="font-semibold text-lg">Logs</h3>
				<span className="text-muted-foreground text-xs">
					Searches app.log and its rotated history on disk — not a
					live view
				</span>
			</div>

			<div className="flex flex-wrap items-center gap-2 border-border border-b pb-3">
				<div className="flex flex-1 items-center gap-1.5 rounded border border-border bg-background px-2 py-1.5">
					<Search className="size-3.5 text-muted-foreground" />
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") runSearch(0);
						}}
						placeholder="Search log text…"
						className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
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
						className={`font-mono text-[10px] ${APP_LOG_LEVEL_CHIP_CLASSES.INFO}`}
					>
						INFO
					</ToggleGroupItem>
					<ToggleGroupItem
						value="WARN"
						aria-label="Toggle WARN"
						data-testid="app-logs-page-level-toggle-warn"
						className={`font-mono text-[10px] ${APP_LOG_LEVEL_CHIP_CLASSES.WARN}`}
					>
						WARN
					</ToggleGroupItem>
					<ToggleGroupItem
						value="ERROR"
						aria-label="Toggle ERROR"
						data-testid="app-logs-page-level-toggle-error"
						className={`font-mono text-[10px] ${APP_LOG_LEVEL_CHIP_CLASSES.ERROR}`}
					>
						ERROR
					</ToggleGroupItem>
					<ToggleGroupItem
						value="DEBUG"
						aria-label="Toggle DEBUG"
						data-testid="app-logs-page-level-toggle-debug"
						className={`font-mono text-[10px] ${APP_LOG_LEVEL_CHIP_CLASSES.DEBUG}`}
					>
						DEBUG
					</ToggleGroupItem>
				</ToggleGroup>
				<Button
					size="sm"
					onClick={() => runSearch(0)}
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
				>
					{error}
				</div>
			) : null}

			<div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border">
				<table className="w-full text-sm">
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
										? "Searching…"
										: "No results yet — run a search above."}
								</td>
							</tr>
						) : (
							lines.map((line) => (
								<tr
									key={`${offset}-${line.raw}`}
									className="border-border border-t hover:bg-muted/30"
								>
									<td className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground text-xs">
										{line.timestamp ?? "—"}
									</td>
									<td className="whitespace-nowrap px-3 py-2">
										<span
											className={`inline-block rounded px-1.5 py-0.5 font-mono font-semibold text-[10px] ${APP_LOG_LEVEL_BADGE_CLASSES[line.level]}`}
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
			</div>

			<div className="flex items-center justify-between text-muted-foreground text-xs">
				<span>
					{totalMatches > 0
						? `Showing ${offset + 1}–${rangeEnd} of ${totalMatches} matching lines`
						: null}
				</span>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={offset === 0 || loading}
						data-testid="app-logs-page-previous-button"
						onClick={() =>
							runSearch(Math.max(0, offset - PAGE_SIZE))
						}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!hasMore || loading}
						data-testid="app-logs-page-next-button"
						onClick={() => runSearch(offset + PAGE_SIZE)}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
};
