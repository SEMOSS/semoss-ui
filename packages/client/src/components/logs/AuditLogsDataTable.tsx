import { CircleCheck, ListFilter, Search, X, XCircle } from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import {
	Button,
	Checkbox,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Sheet,
	SheetContent,
	SheetTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { TimeDateFormatter } from "@/pages/audit-logs-dashboard";
import type { EventData } from "@/types";
import { AuditLogsDetailDrawer } from "./AuditLogsDetailDrawer";

// Types
interface FilterState {
	engineType: string[];
	engineName: string[];
	status: string[];
	latencyRange: string[];
	tokenRange: string[];
}

interface AuditLogsDataTableProps {
	logs: EventData[];
	totalCount?: number;
	page: number;
	rowsPerPage: number;
	onPaginationChange: (page: number, rowsPerPage: number) => void;
}

interface FilterOption {
	label: string;
	value: string;
}

const ellipsed = (text: string | null, maxLength = 50) => {
	if (!text) return "";
	return text.length > maxLength
		? `${text.substring(0, maxLength - 3)}...`
		: text;
};

// Main Component
export const AuditLogsDataTable: React.FC<AuditLogsDataTableProps> = ({
	logs = [],
	totalCount = 0,
	page,
	rowsPerPage,
	onPaginationChange,
}) => {
	// State Management
	const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [appliedFilters, setAppliedFilters] = useState<FilterState>({
		engineType: [],
		engineName: [],
		status: [],
		latencyRange: [],
		tokenRange: [],
	});
	const [tempFilters, setTempFilters] = useState<FilterState>({
		engineType: [],
		engineName: [],
		status: [],
		latencyRange: [],
		tokenRange: [],
	});
	const [openColumn, setOpenColumn] = useState<keyof FilterState | null>(
		null,
	);

	// Generate Filter Options
	const filterOptions = useMemo(() => {
		const engineTypes = [
			...new Set(logs.map((log) => log.engineType).filter(Boolean)),
		];
		const engineNames = [
			...new Set(logs.map((log) => log.engineName).filter(Boolean)),
		];
		const statuses = [...new Set(logs.map((log) => log.status))].filter(
			(status) => status !== undefined && status !== null,
		);

		const generateDynamicLatencyRanges = (): FilterOption[] => {
			const latencies = logs
				.map((log) => Number(log.latency))
				.filter((latency) => !Number.isNaN(latency) && latency >= 0)
				.sort((a, b) => a - b);

			if (latencies.length === 0) {
				return [
					{ label: "Fast (≤ 5ms)", value: "0-5" },
					{ label: "Medium (5-50ms)", value: "6-50" },
					{ label: "Slow (> 50ms)", value: "51-999999" },
				];
			}

			const minLatency = latencies[0];
			const maxLatency = latencies[latencies.length - 1];

			if (minLatency === maxLatency) {
				return [
					{
						label: `${minLatency}ms`,
						value: `${minLatency}-${minLatency}`,
					},
				];
			}

			const uniqueLatencies = [...new Set(latencies)].sort(
				(a, b) => a - b,
			);

			if (uniqueLatencies.length === 2) {
				return [
					{
						label: `Fast (≤ ${uniqueLatencies[0]}ms)`,
						value: `${uniqueLatencies[0]}-${uniqueLatencies[0]}`,
					},
					{
						label: `Slow (≥ ${uniqueLatencies[1]}ms)`,
						value: `${uniqueLatencies[1]}-${maxLatency}`,
					},
				];
			}

			if (uniqueLatencies.length === 3) {
				return [
					{
						label: `Fast (${uniqueLatencies[0]}ms)`,
						value: `${uniqueLatencies[0]}-${uniqueLatencies[0]}`,
					},
					{
						label: `Medium (${uniqueLatencies[1]}ms)`,
						value: `${uniqueLatencies[1]}-${uniqueLatencies[1]}`,
					},
					{
						label: `Slow (${uniqueLatencies[2]}ms)`,
						value: `${uniqueLatencies[2]}-${uniqueLatencies[2]}`,
					},
				];
			}

			if (maxLatency < 1000) {
				const p33Index = Math.floor(uniqueLatencies.length * 0.33);
				const p66Index = Math.floor(uniqueLatencies.length * 0.66);

				const bucket1End = uniqueLatencies[p33Index];
				const bucket2Start =
					uniqueLatencies[p33Index + 1] || bucket1End + 1;
				const bucket2End = uniqueLatencies[p66Index];
				const bucket3Start =
					uniqueLatencies[p66Index + 1] || bucket2End + 1;

				if (bucket1End >= bucket2Start || bucket2End >= bucket3Start) {
					const range = maxLatency - minLatency;
					const step = Math.ceil(range / 3);

					return [
						{
							label: `Fast (≤ ${minLatency + step}ms)`,
							value: `${minLatency}-${minLatency + step}`,
						},
						{
							label: `Medium (${minLatency + step + 1}ms - ${minLatency + step * 2}ms)`,
							value: `${minLatency + step + 1}-${minLatency + step * 2}`,
						},
						{
							label: `Slow (> ${minLatency + step * 2}ms)`,
							value: `${minLatency + step * 2 + 1}-${maxLatency}`,
						},
					];
				}

				return [
					{
						label: `Fast (≤ ${bucket1End}ms)`,
						value: `${minLatency}-${bucket1End}`,
					},
					{
						label: `Medium (${bucket2Start}ms - ${bucket2End}ms)`,
						value: `${bucket2Start}-${bucket2End}`,
					},
					{
						label: `Slow (> ${bucket2End}ms)`,
						value: `${bucket3Start}-${maxLatency}`,
					},
				];
			}

			const range = maxLatency - minLatency;
			const bucketSize = Math.ceil(range / 3);

			const bucket1End = minLatency + bucketSize;
			const bucket2End = minLatency + bucketSize * 2;

			return [
				{
					label: `Fast (≤ ${(bucket1End / 1000).toFixed(1)}s)`,
					value: `${minLatency}-${bucket1End}`,
				},
				{
					label: `Medium (${((bucket1End + 1) / 1000).toFixed(1)}s - ${(bucket2End / 1000).toFixed(1)}s)`,
					value: `${bucket1End + 1}-${bucket2End}`,
				},
				{
					label: `Slow (> ${(bucket2End / 1000).toFixed(1)}s)`,
					value: `${bucket2End + 1}-${maxLatency}`,
				},
			];
		};

		const generateDynamicTokenRanges = (): FilterOption[] => {
			const tokens = logs
				.map((log) => {
					const parsed = parseInt(log.tokens, 10);
					return Number.isNaN(parsed) ? 0 : parsed;
				})
				.filter((token) => token > 0)
				.sort((a, b) => a - b);

			if (tokens.length === 0) {
				return [
					{ label: "Short (< 100)", value: "0-100" },
					{ label: "Medium (100-500)", value: "100-500" },
					{ label: "Long (> 500)", value: "500-999999" },
				];
			}

			const minTokens = tokens[0];
			const maxTokens = tokens[tokens.length - 1];

			if (minTokens === maxTokens) {
				return [
					{
						label: `${minTokens} tokens`,
						value: `${minTokens}-${minTokens}`,
					},
				];
			}

			const range = maxTokens - minTokens;
			const bucketSize = Math.ceil(range / 3);

			const bucket1End = minTokens + bucketSize;
			const bucket2End = minTokens + bucketSize * 2;

			return [
				{
					label: `Short (≤ ${bucket1End})`,
					value: `${minTokens}-${bucket1End}`,
				},
				{
					label: `Medium (${bucket1End + 1} - ${bucket2End})`,
					value: `${bucket1End + 1}-${bucket2End}`,
				},
				{
					label: `Long (> ${bucket2End})`,
					value: `${bucket2End + 1}-${maxTokens}`,
				},
			];
		};

		return {
			engineType: engineTypes,
			engineName: engineNames,
			status: statuses.map(String),
			latencyRange: generateDynamicLatencyRanges(),
			tokenRange: generateDynamicTokenRanges(),
		};
	}, [logs]);

	// Filter Logs
	const filteredLogs = useMemo(() => {
		let filtered = [...logs];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(
				(log) =>
					log.engineName?.toLowerCase().includes(query) ||
					log.engineType?.toLowerCase().includes(query) ||
					log.userId?.toLowerCase().includes(query) ||
					log.sessionId?.toLowerCase().includes(query) ||
					log.request?.toLowerCase().includes(query) ||
					log.response?.toLowerCase().includes(query) ||
					log.latency?.toString().toLowerCase().includes(query) ||
					log.tokens?.toString().toLowerCase().includes(query),
			);
		}

		if (appliedFilters.engineType.length > 0) {
			filtered = filtered.filter((log) =>
				appliedFilters.engineType.includes(log.engineType),
			);
		}

		if (appliedFilters.engineName.length > 0) {
			filtered = filtered.filter((log) =>
				appliedFilters.engineName.includes(log.engineName),
			);
		}

		if (appliedFilters.status.length > 0) {
			filtered = filtered.filter((log) =>
				appliedFilters.status.includes(String(log.status)),
			);
		}

		if (appliedFilters.latencyRange.length > 0) {
			filtered = filtered.filter((log) => {
				const logLatency = Number(log.latency);
				if (Number.isNaN(logLatency)) return false;

				return appliedFilters.latencyRange.some((range) => {
					const [min, max] = range.split("-").map(Number);
					return logLatency >= min && logLatency <= max;
				});
			});
		}

		if (appliedFilters.tokenRange.length > 0) {
			filtered = filtered.filter((log) => {
				const logTokens = parseInt(log.tokens, 10);
				if (Number.isNaN(logTokens)) return false;

				return appliedFilters.tokenRange.some((range) => {
					const [min, max] = range.split("-").map(Number);
					return logTokens >= min && logTokens <= max;
				});
			});
		}

		return filtered;
	}, [logs, searchQuery, appliedFilters]);

	// Event Handlers
	const handleOpenColumn = useCallback(
		(column: keyof FilterState) => {
			setTempFilters({ ...appliedFilters });
			setOpenColumn(column);
		},
		[appliedFilters],
	);

	const handleCloseColumn = useCallback(() => {
		setOpenColumn(null);
		setTempFilters({ ...appliedFilters });
	}, [appliedFilters]);

	const handleApplyFilters = useCallback(() => {
		setAppliedFilters({ ...tempFilters });
		setOpenColumn(null);
	}, [tempFilters]);

	const handleClearFilterPopover = useCallback(() => {
		if (openColumn) {
			setTempFilters((prev) => ({
				...prev,
				[openColumn]: [],
			}));
		}
	}, [openColumn]);

	const handleMultiSelectFilter = useCallback(
		(filterType: keyof FilterState, value: string) => {
			setTempFilters((prev) => ({
				...prev,
				[filterType]: prev[filterType].includes(value)
					? prev[filterType].filter((item) => item !== value)
					: [...prev[filterType], value],
			}));
		},
		[],
	);

	const handleSelectAll = useCallback(
		(filterType: keyof FilterState, allOptions: string[]) => {
			setTempFilters((prev) => {
				const isAllSelected =
					prev[filterType].length === allOptions.length;
				return {
					...prev,
					[filterType]: isAllSelected ? [] : [...allOptions],
				};
			});
		},
		[],
	);

	const handleClearAllFilters = useCallback(() => {
		setSearchQuery("");
		const clearedFilters: FilterState = {
			engineType: [],
			engineName: [],
			status: [],
			latencyRange: [],
			tokenRange: [],
		};
		setAppliedFilters(clearedFilters);
		setTempFilters(clearedFilters);
	}, []);

	const handleRowClick = useCallback((event: EventData) => {
		setSelectedEvent(event);
		setDrawerOpen(true);
	}, []);

	const handleDrawerClose = useCallback(() => {
		setDrawerOpen(false);
		setTimeout(() => {
			setSelectedEvent(null);
		}, 300);
	}, []);

	const handleChangePage = useCallback(
		(_event: unknown, newPage: number) => {
			onPaginationChange(newPage, rowsPerPage);
		},
		[onPaginationChange, rowsPerPage],
	);

	const handleChangeRowsPerPage = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			const newRowsPerPage = parseInt(event.target.value, 10);
			onPaginationChange(0, newRowsPerPage);
		},
		[onPaginationChange],
	);

	// Get Active Filters Count
	const getActiveFiltersCount = useCallback(
		(column?: keyof FilterState) => {
			if (column) {
				return appliedFilters[column].length;
			}
			return (
				appliedFilters.engineType.length +
				appliedFilters.engineName.length +
				appliedFilters.latencyRange.length +
				appliedFilters.tokenRange.length +
				appliedFilters.status.length
			);
		},
		[appliedFilters],
	);

	const totalActiveFilters = getActiveFiltersCount() + (searchQuery ? 1 : 0);

	// Render filter popover content for a column
	const renderFilterContent = useCallback(
		(column: keyof FilterState) => {
			const options = filterOptions[column];
			const optionValues =
				column === "latencyRange" || column === "tokenRange"
					? (options as FilterOption[]).map((opt) => opt.value)
					: (options as string[]);

			const allSelected =
				tempFilters[column].length === optionValues.length;

			return (
				<>
					<div className="max-h-[300px] overflow-y-auto">
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: filter option list items use click to toggle */}
						{/* biome-ignore lint/a11y/noStaticElementInteractions: filter list uses click handlers */}
						<div
							className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-accent"
							onClick={() =>
								handleSelectAll(column, optionValues)
							}
						>
							<Checkbox
								checked={
									allSelected
										? true
										: tempFilters[column].length > 0
											? "indeterminate"
											: false
								}
								onCheckedChange={() =>
									handleSelectAll(column, optionValues)
								}
							/>
							<span className="font-medium text-sm">
								Select All
							</span>
						</div>
						{column === "latencyRange" || column === "tokenRange"
							? (options as FilterOption[]).map((option) => (
									// biome-ignore lint/a11y/useKeyWithClickEvents: filter option list items use click to toggle
									// biome-ignore lint/a11y/noStaticElementInteractions: filter list uses click handlers
									<div
										key={option.value}
										className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-accent"
										onClick={() =>
											handleMultiSelectFilter(
												column,
												option.value,
											)
										}
									>
										<Checkbox
											checked={tempFilters[
												column
											].includes(option.value)}
											onCheckedChange={() =>
												handleMultiSelectFilter(
													column,
													option.value,
												)
											}
										/>
										<span
											className={`text-sm ${
												tempFilters[column].includes(
													option.value,
												)
													? "font-medium"
													: "font-normal"
											}`}
										>
											{option.label}
										</span>
									</div>
								))
							: (options as string[]).map((value) => {
									const displayValue =
										column === "status"
											? value === "true"
												? "Success"
												: "Failed"
											: value;

									return (
										// biome-ignore lint/a11y/useKeyWithClickEvents: filter option list items use click to toggle
										// biome-ignore lint/a11y/noStaticElementInteractions: filter list uses click handlers
										<div
											key={value}
											className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-accent"
											onClick={() =>
												handleMultiSelectFilter(
													column,
													value,
												)
											}
										>
											<Checkbox
												checked={tempFilters[
													column
												].includes(value)}
												onCheckedChange={() =>
													handleMultiSelectFilter(
														column,
														value,
													)
												}
											/>
											<span
												className={`text-sm ${
													tempFilters[
														column
													].includes(value)
														? "font-medium"
														: "font-normal"
												}`}
											>
												{displayValue}
											</span>
										</div>
									);
								})}
					</div>
					<div className="flex justify-between gap-3 border-t bg-[#fafafa] p-3">
						<Button
							variant="ghost"
							className="h-8 flex-1 text-sm"
							onClick={handleClearFilterPopover}
						>
							Clear
						</Button>
						<Button
							className="h-8 flex-1 text-sm"
							onClick={handleApplyFilters}
						>
							Apply
						</Button>
					</div>
				</>
			);
		},
		[
			filterOptions,
			tempFilters,
			handleSelectAll,
			handleMultiSelectFilter,
			handleClearFilterPopover,
			handleApplyFilters,
		],
	);

	// Filter column header helper
	// biome-ignore lint/correctness/noNestedComponentDefinitions: collocated helper component
	const FilterColumnHeader = ({
		column,
		label,
	}: {
		column: keyof FilterState;
		label: string;
	}) => {
		const count = getActiveFiltersCount(column);
		return (
			<div className="flex items-center gap-1">
				<span>{label}</span>
				<Popover
					open={openColumn === column}
					onOpenChange={(o) => {
						if (o) handleOpenColumn(column);
						else handleCloseColumn();
					}}
				>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="relative inline-flex items-center justify-center rounded p-1 hover:bg-accent"
						>
							<ListFilter className="size-3.5" />
							{count > 0 && (
								<span className="-top-1 -right-1 absolute flex size-3.5 items-center justify-center rounded-full bg-primary font-medium text-[9px] text-primary-foreground">
									{count}
								</span>
							)}
						</button>
					</PopoverTrigger>
					<PopoverContent
						className="w-[250px] max-w-[350px] p-0"
						align="start"
					>
						{renderFilterContent(column)}
					</PopoverContent>
				</Popover>
			</div>
		);
	};

	// Empty State
	if (!logs || logs.length === 0) {
		return (
			<div className="mt-4 rounded-lg border border-border bg-white">
				<div className="flex items-center justify-between p-4">
					<span className="font-semibold text-foreground text-lg">
						Prompt &amp; Response Timeline
					</span>
				</div>
				<div className="flex items-center justify-center px-4 py-4">
					<p className="text-muted-foreground text-sm">
						No logs available.
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mt-4 rounded-lg border border-border bg-white">
				<div className="flex items-center justify-between p-4">
					<span className="font-semibold text-foreground text-lg">
						Prompt &amp; Response Timeline
					</span>
					<div className="flex items-center gap-2">
						{totalActiveFilters > 0 && (
							<Button
								variant="outline"
								onClick={handleClearAllFilters}
							>
								<X className="size-4" />
								Clear Filters
							</Button>
						)}
						<InputGroup className="min-w-[400px]">
							<InputGroupAddon align="inline-start">
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search logs..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							{searchQuery && (
								<InputGroupAddon align="inline-end">
									<InputGroupButton
										size="icon-sm"
										onClick={() => setSearchQuery("")}
									>
										<X className="size-3.5" />
									</InputGroupButton>
								</InputGroupAddon>
							)}
						</InputGroup>
					</div>
				</div>
				<div className="overflow-auto p-4">
					<Table>
						<TableHeader>
							<TableRow className="bg-primary/5">
								<TableHead className="font-semibold text-primary">
									User Id
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Session Id
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Request
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Response
								</TableHead>
								<TableHead className="font-semibold text-primary">
									<FilterColumnHeader
										column="engineType"
										label="Engine Type"
									/>
								</TableHead>
								<TableHead className="font-semibold text-primary">
									<FilterColumnHeader
										column="engineName"
										label="Engine Name"
									/>
								</TableHead>
								<TableHead className="font-semibold text-primary">
									<FilterColumnHeader
										column="latencyRange"
										label="Latency"
									/>
								</TableHead>
								<TableHead className="font-semibold text-primary">
									<FilterColumnHeader
										column="tokenRange"
										label="Tokens"
									/>
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Timestamp
								</TableHead>
								<TableHead className="font-semibold text-primary">
									<FilterColumnHeader
										column="status"
										label="Status"
									/>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredLogs.map((event, index) => (
								<TableRow
									key={`Log-${event.endTime}-${index}`}
									data-testid={`log-row-${index}`}
									className="cursor-pointer hover:bg-primary/5"
									onClick={() => handleRowClick(event)}
								>
									<TableCell>
										<span
											className="text-sm"
											title={event.userId}
										>
											{ellipsed(event.userId, 23)}
										</span>
									</TableCell>
									<TableCell>
										<span
											className="text-sm"
											title={event.sessionId}
										>
											{ellipsed(event.sessionId, 23)}
										</span>
									</TableCell>
									<TableCell>
										<span
											className="text-sm"
											title={event.request}
										>
											{ellipsed(event.request)}
										</span>
									</TableCell>
									<TableCell>
										<span
											className="text-sm"
											title={event.response}
										>
											{ellipsed(event.response)}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{event.engineType}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{event.engineName}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{event.latency}ms
										</span>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{event.tokens}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-xs">
											{`${TimeDateFormatter(event.startTime).time} - ${
												TimeDateFormatter(event.endTime)
													.time
											}`}
										</span>
									</TableCell>
									<TableCell className="text-center">
										{event.status ? (
											<CircleCheck className="size-4 text-green-500" />
										) : (
											<XCircle className="size-4 text-destructive" />
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				<div className="flex items-center justify-end gap-4 border-t bg-white px-4 py-2">
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<span>Rows per page:</span>
						<select
							value={rowsPerPage}
							onChange={handleChangeRowsPerPage}
							disabled={totalActiveFilters > 0}
							className="rounded border border-border px-1.5 py-1 text-sm"
						>
							{[5, 10, 25, 50].map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>
					<span className="text-muted-foreground text-sm">
						{page * rowsPerPage + 1}–
						{Math.min((page + 1) * rowsPerPage, totalCount)} of{" "}
						{totalCount}
					</span>
					<div className="flex gap-1">
						<button
							type="button"
							disabled={page === 0 || totalActiveFilters > 0}
							onClick={(e) => handleChangePage(e, page - 1)}
							className="rounded border border-border px-2 py-1 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
						>
							Previous
						</button>
						<button
							type="button"
							disabled={
								(page + 1) * rowsPerPage >= totalCount ||
								totalActiveFilters > 0
							}
							onClick={(e) => handleChangePage(e, page + 1)}
							className="rounded border border-border px-2 py-1 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
						>
							Next
						</button>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between border-b bg-primary/5 px-4 py-2">
				<p className="text-muted-foreground text-sm">
					Showing {filteredLogs.length} of {totalCount} results
					{totalActiveFilters > 0 &&
						` (${totalActiveFilters} filter${
							totalActiveFilters > 1 ? "s" : ""
						} applied)`}
				</p>
				{filteredLogs.length === 0 && logs.length > 0 && (
					<p className="text-destructive text-sm">
						No results found. Try adjusting your filters.
					</p>
				)}
			</div>

			<Sheet
				open={drawerOpen}
				onOpenChange={(o) => {
					if (!o) handleDrawerClose();
				}}
			>
				<SheetContent
					side="right"
					className="w-auto max-w-none p-0 sm:max-w-none [&>button:last-child]:hidden"
				>
					<SheetTitle className="sr-only">Audit Details</SheetTitle>
					<AuditLogsDetailDrawer
						logDetails={selectedEvent}
						handleDrawerClose={handleDrawerClose}
					/>
				</SheetContent>
			</Sheet>
		</>
	);
};
