import {
	XCircle as Cancel,
	CheckCircle as CheckCircleIcon,
	ChevronLeft,
	ChevronRight,
	X as ClearIcon,
	Filter as FilterListIcon,
	Search as SearchIcon,
} from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import {
	Button,
	Checkbox,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Sheet,
	SheetContent,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { TimeDateFormatter } from "@/pages/AuditLogsDashboard";
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

interface PopoverState {
	column: keyof FilterState | null;
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
	const [popoverState, setPopoverState] = useState<PopoverState>({
		column: null,
	});

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

			// If all values are the same
			if (minLatency === maxLatency) {
				return [
					{
						label: `${minLatency}ms`,
						value: `${minLatency}-${minLatency}`,
					},
				];
			}

			// Get unique latency values to determine bucket boundaries
			const uniqueLatencies = [...new Set(latencies)].sort(
				(a, b) => a - b,
			);

			// If there are only 2 unique values
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

			// If there are only 3 unique values
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

			// For more than 3 unique values, use percentile-based bucketing
			if (maxLatency < 1000) {
				// Calculate percentile-based buckets
				const p33Index = Math.floor(uniqueLatencies.length * 0.33);
				const p66Index = Math.floor(uniqueLatencies.length * 0.66);

				const bucket1End = uniqueLatencies[p33Index];
				const bucket2Start =
					uniqueLatencies[p33Index + 1] || bucket1End + 1;
				const bucket2End = uniqueLatencies[p66Index];
				const bucket3Start =
					uniqueLatencies[p66Index + 1] || bucket2End + 1;

				// Ensure no overlapping ranges
				if (bucket1End >= bucket2Start || bucket2End >= bucket3Start) {
					// Fall back to equal distribution
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

			// For larger latencies (≥ 1000ms), use second-based ranges
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

		// Apply search query
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

		// Apply engine type filter
		if (appliedFilters.engineType.length > 0) {
			filtered = filtered.filter((log) =>
				appliedFilters.engineType.includes(log.engineType),
			);
		}

		// Apply engine name filter
		if (appliedFilters.engineName.length > 0) {
			filtered = filtered.filter((log) =>
				appliedFilters.engineName.includes(log.engineName),
			);
		}

		// Apply status filter
		if (appliedFilters.status.length > 0) {
			filtered = filtered.filter((log) =>
				appliedFilters.status.includes(String(log.status)),
			);
		}

		// Apply latency range filter
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

		// Apply token range filter
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
	const handleFilterOpen = useCallback(
		(column: keyof FilterState) => {
			setTempFilters({ ...appliedFilters });
			setPopoverState({ column });
		},
		[appliedFilters],
	);

	const handlePopoverClose = useCallback(() => {
		setPopoverState({ column: null });
		setTempFilters({ ...appliedFilters });
	}, [appliedFilters]);

	const handleApplyFilters = useCallback(() => {
		setAppliedFilters({ ...tempFilters });
		setPopoverState({ column: null });
	}, [tempFilters]);

	const handleClearFilterPopover = useCallback(() => {
		if (popoverState.column) {
			setTempFilters((prev) => ({
				...prev,
				[popoverState.column as string]: [],
			}));
		}
	}, [popoverState.column]);

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
		(newPage: number) => {
			onPaginationChange(newPage, rowsPerPage);
		},
		[onPaginationChange, rowsPerPage],
	);

	const handleChangeRowsPerPage = useCallback(
		(value: string) => {
			const newRowsPerPage = parseInt(value, 10);
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

	// Render Filter Popover Content
	const renderFilterPopover = useCallback(() => {
		const { column } = popoverState;
		if (!column) return null;

		const options = filterOptions[column];
		const optionValues =
			column === "latencyRange" || column === "tokenRange"
				? (options as FilterOption[]).map((opt) => opt.value)
				: (options as string[]);

		const allSelected = tempFilters[column].length === optionValues.length;

		return (
			<>
				<div className="max-h-[300px] overflow-y-auto">
					<div>
						<button
							type="button"
							className="flex w-full items-center px-4 py-2 hover:bg-muted/50"
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
								className="mr-3"
							/>
							<span className="text-sm font-medium">
								Select All
							</span>
						</button>
						{column === "latencyRange" || column === "tokenRange"
							? (options as FilterOption[]).map((option) => (
									<button
										type="button"
										key={option.value}
										className="flex w-full items-center px-4 py-2 hover:bg-muted/50"
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
											className="mr-3"
										/>
										<span
											className={`text-sm ${
												tempFilters[column].includes(
													option.value,
												)
													? "font-medium"
													: ""
											}`}
										>
											{option.label}
										</span>
									</button>
								))
							: (options as string[]).map((value) => {
									const displayValue =
										column === "status"
											? value === "true"
												? "Success"
												: "Failed"
											: value;

									return (
										<button
											type="button"
											key={value}
											className="flex w-full items-center px-4 py-2 hover:bg-muted/50"
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
												className="mr-3"
											/>
											<span
												className={`text-sm ${
													tempFilters[
														column
													].includes(value)
														? "font-medium"
														: ""
												}`}
											>
												{displayValue}
											</span>
										</button>
									);
								})}
					</div>
				</div>
				<div className="flex justify-between gap-3 border-t bg-muted/30 p-3">
					<Button
						variant="ghost"
						className="flex-1 h-8 text-sm"
						onClick={handleClearFilterPopover}
					>
						Clear
					</Button>
					<Button
						variant="default"
						className="flex-1 h-8 text-sm"
						onClick={handleApplyFilters}
					>
						Apply
					</Button>
				</div>
			</>
		);
	}, [
		popoverState,
		filterOptions,
		tempFilters,
		handleSelectAll,
		handleMultiSelectFilter,
		handleClearFilterPopover,
		handleApplyFilters,
	]);

	// Empty State
	if (!logs || logs.length === 0) {
		return (
			<div className="mt-4 rounded-lg border bg-white">
				<div className="flex items-center justify-between p-4">
					<h6 className="text-lg font-semibold">
						Prompt & Response Timeline
					</h6>
				</div>
				<div className="flex items-center justify-center border-b p-4">
					<span className="text-sm text-muted-foreground">
						No logs available.
					</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mt-4 rounded-lg border bg-white">
				<div className="flex items-center justify-between p-4">
					<h6 className="text-lg font-semibold">
						Prompt & Response Timeline
					</h6>
					<div className="flex items-center gap-2">
						{totalActiveFilters > 0 && (
							<Button
								variant="outline"
								onClick={handleClearAllFilters}
							>
								<ClearIcon className="mr-2 h-4 w-4" />
								Clear Filters
							</Button>
						)}
						<div className="relative min-w-[400px]">
							<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search logs..."
								value={searchQuery}
								onChange={(e) =>
									setSearchQuery(e.target.value)
								}
								className="h-10 pl-10 pr-10"
							/>
							{searchQuery && (
								<button
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2"
									onClick={() => setSearchQuery("")}
								>
									<ClearIcon className="h-4 w-4 text-muted-foreground" />
								</button>
							)}
						</div>
					</div>
				</div>
				<div className="bg-white p-4">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									<span className="text-sm font-semibold">
										User Id
									</span>
								</TableHead>
								<TableHead>
									<span className="text-sm font-semibold">
										Session Id
									</span>
								</TableHead>
								<TableHead>
									<span className="text-sm font-semibold">
										Request
									</span>
								</TableHead>
								<TableHead>
									<span className="text-sm font-semibold">
										Response
									</span>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="text-sm font-semibold">
											Engine Type
										</span>
										<Popover
											open={
												popoverState.column ===
												"engineType"
											}
											onOpenChange={(open) => {
												if (open) {
													handleFilterOpen(
														"engineType",
													);
												} else {
													handlePopoverClose();
												}
											}}
										>
											<PopoverTrigger asChild>
												<button
													type="button"
													className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50"
												>
													<span className="relative inline-flex">
														<FilterListIcon className="h-5 w-5" />
														{getActiveFiltersCount(
															"engineType",
														) > 0 && (
															<span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
																{getActiveFiltersCount(
																	"engineType",
																)}
															</span>
														)}
													</span>
												</button>
											</PopoverTrigger>
											<PopoverContent
												align="start"
												className="min-w-[250px] max-w-[350px] p-0"
											>
												{popoverState.column ===
													"engineType" &&
													renderFilterPopover()}
											</PopoverContent>
										</Popover>
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="text-sm font-semibold">
											Engine Name
										</span>
										<Popover
											open={
												popoverState.column ===
												"engineName"
											}
											onOpenChange={(open) => {
												if (open) {
													handleFilterOpen(
														"engineName",
													);
												} else {
													handlePopoverClose();
												}
											}}
										>
											<PopoverTrigger asChild>
												<button
													type="button"
													className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50"
												>
													<span className="relative inline-flex">
														<FilterListIcon className="h-5 w-5" />
														{getActiveFiltersCount(
															"engineName",
														) > 0 && (
															<span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
																{getActiveFiltersCount(
																	"engineName",
																)}
															</span>
														)}
													</span>
												</button>
											</PopoverTrigger>
											<PopoverContent
												align="start"
												className="min-w-[250px] max-w-[350px] p-0"
											>
												{popoverState.column ===
													"engineName" &&
													renderFilterPopover()}
											</PopoverContent>
										</Popover>
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="text-sm font-semibold">
											Latency
										</span>
										<Popover
											open={
												popoverState.column ===
												"latencyRange"
											}
											onOpenChange={(open) => {
												if (open) {
													handleFilterOpen(
														"latencyRange",
													);
												} else {
													handlePopoverClose();
												}
											}}
										>
											<PopoverTrigger asChild>
												<button
													type="button"
													className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50"
												>
													<span className="relative inline-flex">
														<FilterListIcon className="h-5 w-5" />
														{getActiveFiltersCount(
															"latencyRange",
														) > 0 && (
															<span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
																{getActiveFiltersCount(
																	"latencyRange",
																)}
															</span>
														)}
													</span>
												</button>
											</PopoverTrigger>
											<PopoverContent
												align="start"
												className="min-w-[250px] max-w-[350px] p-0"
											>
												{popoverState.column ===
													"latencyRange" &&
													renderFilterPopover()}
											</PopoverContent>
										</Popover>
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="text-sm font-semibold">
											Tokens
										</span>
										<Popover
											open={
												popoverState.column ===
												"tokenRange"
											}
											onOpenChange={(open) => {
												if (open) {
													handleFilterOpen(
														"tokenRange",
													);
												} else {
													handlePopoverClose();
												}
											}}
										>
											<PopoverTrigger asChild>
												<button
													type="button"
													className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50"
												>
													<span className="relative inline-flex">
														<FilterListIcon className="h-5 w-5" />
														{getActiveFiltersCount(
															"tokenRange",
														) > 0 && (
															<span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
																{getActiveFiltersCount(
																	"tokenRange",
																)}
															</span>
														)}
													</span>
												</button>
											</PopoverTrigger>
											<PopoverContent
												align="start"
												className="min-w-[250px] max-w-[350px] p-0"
											>
												{popoverState.column ===
													"tokenRange" &&
													renderFilterPopover()}
											</PopoverContent>
										</Popover>
									</div>
								</TableHead>
								<TableHead>
									<span className="text-sm font-semibold">
										Timestamp
									</span>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="text-sm font-semibold">
											Status
										</span>
										<Popover
											open={
												popoverState.column ===
												"status"
											}
											onOpenChange={(open) => {
												if (open) {
													handleFilterOpen("status");
												} else {
													handlePopoverClose();
												}
											}}
										>
											<PopoverTrigger asChild>
												<button
													type="button"
													className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50"
												>
													<span className="relative inline-flex">
														<FilterListIcon className="h-5 w-5" />
														{getActiveFiltersCount(
															"status",
														) > 0 && (
															<span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
																{getActiveFiltersCount(
																	"status",
																)}
															</span>
														)}
													</span>
												</button>
											</PopoverTrigger>
											<PopoverContent
												align="start"
												className="min-w-[250px] max-w-[350px] p-0"
											>
												{popoverState.column ===
													"status" &&
													renderFilterPopover()}
											</PopoverContent>
										</Popover>
									</div>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredLogs.map((event, index) => (
								<TableRow
									key={`Log-${event.endTime}-${index}`}
									data-testid={`log-row-${index}`}
									className="cursor-pointer"
									onClick={() => handleRowClick(event)}
								>
									<TableCell className="text-sm">
										<span title={event.userId}>
											{ellipsed(event.userId, 23)}
										</span>
									</TableCell>
									<TableCell className="text-sm">
										<span title={event.sessionId}>
											{ellipsed(event.sessionId, 23)}
										</span>
									</TableCell>
									<TableCell className="max-w-[15%] text-sm">
										<span title={event.request}>
											{ellipsed(event.request)}
										</span>
									</TableCell>
									<TableCell className="max-w-[15%] text-sm">
										<span title={event.response}>
											{ellipsed(event.response)}
										</span>
									</TableCell>
									<TableCell className="text-sm">
										{event.engineType}
									</TableCell>
									<TableCell className="text-sm">
										{event.engineName}
									</TableCell>
									<TableCell className="text-sm">
										{event.latency}ms
									</TableCell>
									<TableCell className="text-sm">
										{event.tokens}
									</TableCell>
									<TableCell className="text-xs">
										{`${TimeDateFormatter(event.startTime).time} - ${
											TimeDateFormatter(event.endTime)
												.time
										}`}
									</TableCell>
									<TableCell className="text-center">
										{event.status ? (
											<CheckCircleIcon className="text-green-600" />
										) : (
											<Cancel className="text-red-600" />
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				<div className="flex items-center justify-end border-t bg-white px-4 py-2">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2 text-sm">
							<span>Rows per page:</span>
							<select
								value={rowsPerPage}
								onChange={(e) =>
									handleChangeRowsPerPage(e.target.value)
								}
								className="h-8 rounded border px-2 text-sm"
								disabled={totalActiveFilters > 0}
							>
								{[5, 10, 25, 50].map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</div>
						<span className="text-sm text-muted-foreground">
							{page * rowsPerPage + 1}–
							{Math.min(
								(page + 1) * rowsPerPage,
								totalCount,
							)}{" "}
							of {totalCount}
						</span>
						<div className="flex gap-1">
							<button
								type="button"
								className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50 disabled:opacity-50"
								disabled={
									page === 0 || totalActiveFilters > 0
								}
								onClick={() => handleChangePage(page - 1)}
							>
								<ChevronLeft className="h-5 w-5" />
							</button>
							<button
								type="button"
								className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50 disabled:opacity-50"
								disabled={
									(page + 1) * rowsPerPage >= totalCount ||
									totalActiveFilters > 0
								}
								onClick={() => handleChangePage(page + 1)}
							>
								<ChevronRight className="h-5 w-5" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between border-b bg-accent/50 px-4 py-2">
				<span className="text-sm text-muted-foreground">
					Showing {filteredLogs.length} of {totalCount} results
					{totalActiveFilters > 0 &&
						` (${totalActiveFilters} filter${
							totalActiveFilters > 1 ? "s" : ""
						} applied)`}
				</span>
				{filteredLogs.length === 0 && logs.length > 0 && (
					<span className="text-sm text-destructive">
						No results found. Try adjusting your filters.
					</span>
				)}
			</div>

			<Sheet
				open={drawerOpen}
				onOpenChange={(open) => {
					if (!open) handleDrawerClose();
				}}
			>
				<SheetContent
					side="right"
					className="w-auto max-w-none p-0 sm:max-w-none"
				>
					<AuditLogsDetailDrawer
						logDetails={selectedEvent}
						handleDrawerClose={handleDrawerClose}
					/>
				</SheetContent>
			</Sheet>
		</>
	);
};
