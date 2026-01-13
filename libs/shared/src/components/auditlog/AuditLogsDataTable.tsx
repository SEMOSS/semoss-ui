import {
	CircleX as Cancel,
	ChevronLeft,
	ChevronRight,
	CircleCheck as CircleCheckIcon,
	Filter,
	Search,
	X,
} from "lucide-react"; // Example icons
import { useCallback, useMemo, useState } from "react";
import {
	Badge,
	Button,
	Checkbox,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { AuditLogsDetailDrawer } from "./AuditLogsDetailDrawer";
import type { EventData } from "./common";
import { TimeDateFormatter } from "./common";

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

const ellipsed = (text: string | null, maxLength = 50) => {
	if (!text) return "";
	return text.length > maxLength
		? `${text.substring(0, maxLength - 3)}...`
		: text;
};
//to convert between true/false to success/failed or viceversa
const STATUS_LABEL_CONVERSION = {
	Success: true,
	Failed: false,
	true: "Success",
	false: "Failed",
};

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
	const [popoverColumn, setPopoverColumn] = useState<
		keyof FilterState | null
	>(null);
	const [popoverOpen, setPopoverOpen] = useState(false);

	// Generate Filter Options (same logic as before)
	const filterOptions = useMemo(() => {
		return {
			engineType: [
				...new Set(
					logs?.map((log) => log.engineType).filter(Boolean) || [],
				),
			],
			engineName: [
				...new Set(
					logs?.map((log) => log.engineName).filter(Boolean) || [],
				),
			],
			status: [
				...new Set(
					logs?.map((log) => STATUS_LABEL_CONVERSION[log.status]),
				),
			].filter((status) => status !== undefined && status !== null) ?? [
				"Success",
				"Failed",
			],
			latencyRange: [
				{ label: "Fast (≤ 5ms)", value: "0-5" },
				{ label: "Medium (5-50ms)", value: "6-50" },
				{ label: "Slow (> 50ms)", value: "51-999999" },
			],
			tokenRange: [
				{ label: "Short (< 100)", value: "0-100" },
				{ label: "Medium (100-500)", value: "100-500" },
				{ label: "Long (> 500)", value: "500-999999" },
			],
		};
	}, [logs]);

	//Check condition for if any filters are applied
	const filtersApplied = useMemo(
		() =>
			Object.values(appliedFilters).some((filter) => filter.length > 0) ||
			false,
		[appliedFilters],
	);

	// Filter Logs (same logic as before)
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
					log.latency
						?.toString()
						.concat("ms")
						.toLowerCase()
						.includes(query) || //additng latency search with milliseconds option
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
				appliedFilters.status.includes(
					STATUS_LABEL_CONVERSION[log.status],
				),
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
		// ...apply filters...
		return filtered;
	}, [logs, searchQuery, appliedFilters]);

	const filteredTotalCount = useMemo(() => {
		return filtersApplied || searchQuery.trim().length > 0
			? filteredLogs.length
			: totalCount;
	}, [filteredLogs, filtersApplied, totalCount, searchQuery]);

	// Event Handlers (same logic as before)
	const handleFilterClick = useCallback(
		(column: keyof FilterState) => {
			setTempFilters({ ...appliedFilters });
			setPopoverColumn(column);
			setPopoverOpen(true);
		},
		[appliedFilters],
	);

	const handlePopoverClose = useCallback(() => {
		setPopoverOpen(false);
		setPopoverColumn(null);
		setTempFilters({ ...appliedFilters });
	}, [appliedFilters]);

	const handleApplyFilters = useCallback(() => {
		setAppliedFilters({ ...tempFilters });
		handlePopoverClose();
	}, [tempFilters, handlePopoverClose]);

	const handleClearFilterPopover = useCallback(() => {
		if (popoverColumn) {
			setTempFilters((prev) => ({
				...prev,
				[popoverColumn as string]: [],
			}));
		}
	}, [popoverColumn]);

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

	/*const handleChangePage = useCallback(
		(_event: unknown, newPage: number) => {
			onPaginationChange(newPage, rowsPerPage);
		},
		[onPaginationChange, rowsPerPage],
	);*/

	const handleChangeRowsPerPage = useCallback(
		(value: string) => {
			const newRowsPerPage = parseInt(value, 10);
			onPaginationChange(0, newRowsPerPage);
		},
		[onPaginationChange],
	);

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
	//biome-ignore lint/correctness/useExhaustiveDependencies : not adding functions as dependencies
	const renderPopoverContent = useCallback(
		(filterName: keyof FilterState) => {
			return (
				<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={() =>
								handleFilterClick(
									filterName as keyof FilterState,
								)
							}
						>
							<Filter className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					{popoverColumn === filterName ? (
						<PopoverContent className="w-56">
							{/* Render filter options for filterType */}
							{/* ...custom filter UI... */}
							<div className="flex flex-col gap-2">
								<div
									key={`${filterName}SelectAll`}
									className="flex flex-row items-center gap-4 overflow-x-auto"
								>
									<Checkbox
										checked={
											tempFilters?.[filterName].length ===
											filterOptions?.[filterName]?.length
												? true
												: tempFilters?.[filterName]
															?.length > 0
													? "indeterminate"
													: false
										}
										onCheckedChange={() => {
											handleSelectAll(
												filterName,
												![
													"latencyRange",
													"tokenRange",
												].includes(filterName)
													? filterOptions?.[
															filterName
														]
													: filterOptions?.[
															filterName
														].map(
															(filtered) =>
																filtered.value,
														),
											);
										}}
									/>
									<span key={`${filterName}SelectAll`}>
										Select All
									</span>
								</div>
								{filterOptions?.[filterName]?.map((filtered) =>
									Object.hasOwn(filtered, "value") ? (
										<div
											key={`${filtered.value}`}
											className="items-cemter flex flex-row gap-4 overflow-x-auto"
										>
											<Checkbox
												checked={tempFilters?.[
													filterName
												]?.includes(filtered.value)}
												onCheckedChange={() => {
													handleMultiSelectFilter(
														filterName,
														filtered.value,
													);
													return;
												}}
											/>
											<span key={`${filtered.value}`}>
												{filtered.label}
											</span>
										</div>
									) : (
										<div
											key={`${filtered}`}
											className="flex flex-row items-center gap-4 overflow-x-auto"
										>
											<Checkbox
												checked={tempFilters?.[
													filterName
												]?.includes(filtered)}
												onCheckedChange={() => {
													handleMultiSelectFilter(
														filterName,
														filtered,
													);
													return;
												}}
											/>
											<span key={`${filtered}`}>
												{filtered}
											</span>
										</div>
									),
								)}
								<div className="flex flex-row items-center justify-between gap-2 border-t py-2">
									<Button
										variant="ghost"
										onClick={() =>
											handleClearFilterPopover()
										}
									>
										Clear
									</Button>
									<Button
										variant="default"
										onClick={handleApplyFilters}
									>
										Apply
									</Button>
								</div>
							</div>
						</PopoverContent>
					) : null}
				</Popover>
			);
		},
		[popoverOpen, popoverColumn, tempFilters, filterOptions],
	);

	// Empty State
	if (!logs || logs.length === 0) {
		return (
			<div className="mt-4 rounded-lg border bg-white shadow">
				<div className="flex items-center justify-between p-4">
					<span className="font-semibold text-lg">
						Prompt & Response Timeline
					</span>
				</div>
				<div className="flex items-center justify-center border-b p-4">
					<span className="text-gray-500">No logs available.</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mt-4 rounded-lg border bg-white shadow">
				<div className="flex items-center justify-between p-4">
					<span className="font-semibold text-lg">
						Prompt & Response Timeline
					</span>
					<div className="flex items-center gap-2">
						{totalActiveFilters > 0 && (
							<Button
								variant="outline"
								onClick={handleClearAllFilters}
							>
								<X className="mr-2 h-4 w-4" />
								Clear All Filters
							</Button>
						)}
						<div className="relative">
							<InputGroup>
								<InputGroupInput
									placeholder="Search logs..."
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className="w-96 pl-10"
								/>
								<InputGroupAddon>
									<Search />
								</InputGroupAddon>
								<InputGroupAddon align="inline-end">
									{searchQuery && (
										<Button
											variant="ghost"
											size="icon"
											className="absolute top-2 right-2"
											onClick={() => setSearchQuery("")}
										>
											<X className="h-4 w-4" />
										</Button>
									)}
								</InputGroupAddon>
							</InputGroup>
						</div>
					</div>
				</div>
				<div className="border-b p-4">
					<Table>
						<TableHeader>
							<TableRow style={{ backgroundColor: "#F5F9FE" }}>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										User Id
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Session Id
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Request
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Response
									</span>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
											Engine Type
										</span>
										{appliedFilters.engineType.length >
										0 ? (
											<Badge variant="outline">
												{getActiveFiltersCount(
													"engineType",
												)}
											</Badge>
										) : null}
										{renderPopoverContent("engineType")}
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
											Engine Name
										</span>
										{appliedFilters.engineName.length >
										0 ? (
											<Badge variant="outline">
												{getActiveFiltersCount(
													"engineName",
												)}
											</Badge>
										) : null}
										{renderPopoverContent("engineName")}
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
											Latency
										</span>
										{appliedFilters.latencyRange.length >
										0 ? (
											<Badge variant="outline">
												{getActiveFiltersCount(
													"latencyRange",
												)}
											</Badge>
										) : null}
										{renderPopoverContent("latencyRange")}
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
											Tokens
										</span>
										{appliedFilters.tokenRange.length >
										0 ? (
											<Badge variant="outline">
												{getActiveFiltersCount(
													"tokenRange",
												)}
											</Badge>
										) : null}
										{renderPopoverContent("tokenRange")}
									</div>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Timestamp
									</span>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
											Status
										</span>
										{appliedFilters.status.length > 0 ? (
											<Badge variant="outline">
												{getActiveFiltersCount(
													"status",
												)}
											</Badge>
										) : null}
										{renderPopoverContent("status")}
									</div>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredLogs.map((event, index) => (
								<TableRow
									key={`Log-${event.endTime}-${index}`}
									className="cursor-pointer hover:[background-color:rgb(245,249,254)!important] [a&]:hover:bg-primary"
									onClick={() => handleRowClick(event)}
								>
									<TableCell>
										<span
											title={event.userId}
											className="text-sm"
										>
											{ellipsed(event.userId, 23)}
										</span>
									</TableCell>
									<TableCell>
										<span
											title={event.sessionId}
											className="text-sm"
										>
											{ellipsed(event.sessionId, 23)}
										</span>
									</TableCell>
									<TableCell>
										<span
											title={event.request}
											className="text-sm"
										>
											{ellipsed(event.request)}
										</span>
									</TableCell>
									<TableCell>
										<span
											title={event.response}
											className="text-sm"
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
										<span className="text-xs">{`${TimeDateFormatter(event.startTime).time} - ${TimeDateFormatter(event.endTime).time}`}</span>
									</TableCell>
									<TableCell className="text-center">
										{event.status ? (
											<CircleCheckIcon
												className="inline-block h-4 w-4"
												color="#2e7d32"
											/>
										) : (
											<Cancel
												className="inline-block h-4 w-4"
												color="#da291c"
											/>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				{/* Pagination: You may need to implement your own or use shadcn/ui's Table.Pagination if available */}
				<div className="flex items-center gap-2 justify-self-end bg-white p-2">
					{/* Simple pagination example */}
					<label
						htmlFor="rows-per-page"
						className="font-medium text-gray-700 text-sm"
					>
						Rows per page:
					</label>
					<Select
						// className="ml-4 rounded border px-2 py-1 text-sm"
						value={rowsPerPage.toString()}
						onValueChange={(value: string) => {
							handleChangeRowsPerPage(value);
							return;
						}}
					>
						<SelectTrigger
							id={"rows-per-page"}
							className="w-[80px] border-transparent text-sm"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{["5", "10", "25", "50"].map((opt) => (
								<SelectItem key={opt} value={opt}>
									{opt}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span className="mx-2 text-sm">
						{/**
							Checking for the case like , if a user searches on 2 or 3rd pages, then the filtered records might not have much records, so 
							checking and resetting page to 1
						*/}
						{page + 1 > Math.ceil(filteredTotalCount / rowsPerPage)
							? Math.ceil(filteredTotalCount / rowsPerPage)
							: page + 1}{" "}
						- {Math.ceil(filteredTotalCount / rowsPerPage)} of{" "}
						{Math.ceil(filteredTotalCount / rowsPerPage)}
					</span>
					<Button
						variant="ghost"
						disabled={page === 0}
						onClick={() =>
							onPaginationChange(page - 1, rowsPerPage)
						}
					>
						<ChevronLeft />
					</Button>
					<Button
						variant="ghost"
						disabled={
							page + 1 >=
							Math.ceil(filteredTotalCount / rowsPerPage)
						}
						onClick={() =>
							onPaginationChange(page + 1, rowsPerPage)
						}
					>
						<ChevronRight />
					</Button>
				</div>
			</div>

			<div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
				<span className="text-gray-500 text-sm">
					Showing {filteredLogs.length} of {totalCount} results
					{totalActiveFilters > 0 &&
						` (${totalActiveFilters} filter${
							totalActiveFilters > 1 ? "s" : ""
						} applied)`}
				</span>
				{filteredLogs.length === 0 && logs.length > 0 && (
					<span className="text-red-600 text-sm">
						No results found. Try adjusting your filters.
					</span>
				)}
			</div>

			<Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
				<SheetContent
					side="right"
					className="min-w-[500px] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
				>
					<AuditLogsDetailDrawer
						logDetails={selectedEvent}
						handleDrawerClose={handleDrawerClose}
					/>
				</SheetContent>
				{/* <SheetClose /> */}
			</Sheet>
		</>
	);
};
