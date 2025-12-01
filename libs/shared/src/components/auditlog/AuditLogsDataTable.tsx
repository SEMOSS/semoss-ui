import {
	CircleX as Cancel,
	CircleCheck as CircleCheckIcon,
	Filter,
	Search,
	X,
} from "lucide-react"; // Example icons
import { useCallback, useMemo, useState } from "react";
import {
	Badge,
	Button,
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
	SheetClose,
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
	const [_tempFilters, setTempFilters] = useState<FilterState>({
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
				...new Set(logs.map((log) => log.engineType).filter(Boolean)),
			],
			engineName: [
				...new Set(logs.map((log) => log.engineName).filter(Boolean)),
			],
			status: [...new Set(logs.map((log) => log.status))].filter(
				(status) => status !== undefined && status !== null,
			),
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

	// Filter Logs (same logic as before)
	const filteredLogs = useMemo(() => {
		// ...existing filteredLogs logic...
		// (copy from your original code)
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
		// ...apply filters...
		return filtered;
	}, [logs, searchQuery]);

	// Event Handlers (same logic as before)
	const handleFilterClick = useCallback(
		(column: keyof FilterState) => {
			setTempFilters({ ...appliedFilters });
			setPopoverColumn(column);
			setPopoverOpen(true);
		},
		[appliedFilters],
	);

	/*const handlePopoverClose = useCallback(() => {
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
	);*/

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
								Clear Filters
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
				<div className="p-4">
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
										<Popover
											open={
												popoverOpen &&
												popoverColumn === "engineType"
											}
											onOpenChange={setPopoverOpen}
										>
											<PopoverTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleFilterClick(
															"engineType",
														)
													}
												>
													<Badge>
														{getActiveFiltersCount(
															"engineType",
														)}
													</Badge>
													<Filter className="h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-64">
												{/* Render filter options for engineType */}
												{/* ...custom filter UI... */}
												<div>
													{filterOptions?.engineType?.map(
														(filtered) => (
															<span
																key={`${filtered}`}
															>
																{filtered}
															</span>
														),
													)}
												</div>
											</PopoverContent>
										</Popover>
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
											Engine Name
										</span>
										<Popover
											open={
												popoverOpen &&
												popoverColumn === "engineName"
											}
											onOpenChange={setPopoverOpen}
										>
											<PopoverTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleFilterClick(
															"engineName",
														)
													}
												>
													<Badge>
														{getActiveFiltersCount(
															"engineName",
														)}
													</Badge>
													<Filter className="h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-64">
												{/* Render filter options for engineName */}
											</PopoverContent>
										</Popover>
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
											Latency
										</span>
										<Popover
											open={
												popoverOpen &&
												popoverColumn === "latencyRange"
											}
											onOpenChange={setPopoverOpen}
										>
											<PopoverTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleFilterClick(
															"latencyRange",
														)
													}
												>
													<Badge>
														{getActiveFiltersCount(
															"latencyRange",
														)}
													</Badge>
													<Filter className="h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-64">
												{/* Render filter options for latencyRange */}
											</PopoverContent>
										</Popover>
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-1">
										<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
											Tokens
										</span>
										<Popover
											open={
												popoverOpen &&
												popoverColumn === "tokenRange"
											}
											onOpenChange={setPopoverOpen}
										>
											<PopoverTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleFilterClick(
															"tokenRange",
														)
													}
												>
													<Badge>
														{getActiveFiltersCount(
															"tokenRange",
														)}
													</Badge>
													<Filter className="h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-64">
												{/* Render filter options for tokenRange */}
											</PopoverContent>
										</Popover>
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
										<Popover
											open={
												popoverOpen &&
												popoverColumn === "status"
											}
											onOpenChange={setPopoverOpen}
										>
											<PopoverTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleFilterClick(
															"status",
														)
													}
												>
													<Badge>
														{getActiveFiltersCount(
															"status",
														)}
													</Badge>
													<Filter className="h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-64">
												{/* Render filter options for status */}
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
									className="cursor-pointer hover:bg-gray-50"
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
				<div className="flex items-center justify-end border-t bg-white p-2">
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
							className="w-[80px]"
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
						{page + 1} - {Math.ceil(totalCount / rowsPerPage)} of{" "}
						{Math.ceil(totalCount / rowsPerPage)}
					</span>
					<Button
						variant="outline"
						className="border-b"
						disabled={page === 0}
						onClick={() =>
							onPaginationChange(page - 1, rowsPerPage)
						}
					>
						Prev
					</Button>
					<Button
						variant="outline"
						className="border-b"
						disabled={
							page + 1 >= Math.ceil(totalCount / rowsPerPage)
						}
						onClick={() =>
							onPaginationChange(page + 1, rowsPerPage)
						}
					>
						Next
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

			{/* Filter Popover content should be implemented inside PopoverContent above */}

			{/* <SheetContent open={drawerOpen} onOpenChange={setDrawerOpen}>
				<AuditLogsDetailDrawer
					logDetails={selectedEvent}
					handleDrawerClose={handleDrawerClose}
				/>
			</SheetContent> */}
			<Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
				<SheetContent side="right">
					<AuditLogsDetailDrawer
						logDetails={selectedEvent}
						handleDrawerClose={handleDrawerClose}
					/>
				</SheetContent>
				<SheetClose />
			</Sheet>
		</>
	);
};
