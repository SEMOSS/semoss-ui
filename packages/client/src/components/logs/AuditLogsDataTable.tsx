import {
	Cancel,
	CheckCircle as CheckCircleIcon,
	Clear as ClearIcon,
	FilterList as FilterListIcon,
	Search as SearchIcon,
} from "@mui/icons-material";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { AuditLogsDetailDrawer } from "@semoss/shared/auditlog";
import {
	Badge,
	Box,
	Button,
	Checkbox,
	Drawer,
	IconButton,
	InputAdornment,
	List,
	Paper,
	Popover,
	Stack,
	styled,
	Table,
	TextField,
	Typography,
	useTheme,
} from "@semoss/ui";
import { TimeDateFormatter } from "@/pages/AuditLogsDashboard";
import type { EventData } from "@/types";

// Styled Components
const Container = styled(Paper)(({ theme }) => ({
	padding: 0,
	backgroundColor: theme.palette.common.white,
	borderRadius: 8,
	border: `1px solid ${theme.palette.divider}`,
	marginTop: 16,
}));

const Header = styled(Box)({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: 16,
});

const StyledTitle = styled(Typography)(({ theme }) => ({
	fontWeight: 600,
	color: theme.palette.text.primary,
	fontSize: "18px",
}));

const SearchSection = styled(Box)(({ theme }) => ({
	padding: "16px",
	borderBottom: `1px solid ${theme.palette.divider}`,
	display: "flex",
	alignItems: "center",
	gap: "16px",
	flexWrap: "wrap",
}));

const SearchField = styled(TextField)(({ theme }) => ({
	minWidth: "400px",
	"& .MuiOutlinedInput-root": {
		backgroundColor: theme.palette.common.white,
		height: "40px",
	},
}));

const ResultsInfo = styled(Box)(({ theme }) => ({
	padding: "8px 16px",
	backgroundColor: theme.palette.primary.hover,
	borderBottom: `1px solid ${theme.palette.divider}`,
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
}));

const StyledTableContainer = styled(Table.Container)(({ theme }) => ({
	backgroundColor: theme.palette.common.white,
	padding: "16px",
	"& .MuiTable-root": {
		borderCollapse: "separate",
		borderSpacing: 0,
	},
}));

const StyledTableHead = styled(Table.Head)(({ theme }) => ({
	"& .MuiTableCell-head": {
		backgroundColor: theme.palette.primary.hover,
		fontWeight: 600,
		color: theme.palette.primary.main,
		padding: "6px 16px",
		borderBottom: `1px solid ${theme.palette.divider}`,
		zIndex: 0,
	},
}));

const StyledTableRow = styled(Table.Row)(({ theme }) => ({
	cursor: "pointer",
	transition: "background-color 0.15s ease",
	"&:hover": {
		backgroundColor: theme.palette.primary.hover,
	},
	"& .MuiTableCell-root": {
		borderBottom: `1px solid ${theme.palette.divider}`,
		padding: "12px 16px",
	},
}));

const StyledTableCell = styled(Table.Cell)(({ theme }) => ({
	padding: "12px 16px",
	fontSize: "14px",
	color: theme.palette.text.primary,
	verticalAlign: "middle",
	width: "fit-content",
	maxWidth: "fit-content",
	"&:nth-of-type(3), &:nth-of-type(4)": {
		width: "15%",
		maxWidth: "15%",
	},
}));

const HeaderCellContent = styled(Box)({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	width: "100%",
	gap: "8px",
});

const FilterPopover = styled(Popover)({
	"& .MuiPaper-root": {
		padding: 0,
		boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
		borderRadius: "8px",
		border: "1px solid #e0e0e0",
		minWidth: "250px",
		maxWidth: "350px",
	},
});

const FilterPopoverContent = styled(Box)({
	maxHeight: "300px",
	overflowY: "auto",
});

const FilterOptionsList = styled(List)({
	padding: 0,
	margin: 0,
});

const FilterListItem = styled(List.Item)({
	padding: 0,
	margin: 0,
});

const StyledListItemButton = styled(List.ItemButton)({
	padding: "8px 16px",
	borderRadius: 0,
	margin: 0,
	display: "flex",
	alignItems: "center",
	"&:hover": {
		backgroundColor: "#f5f5f5",
	},
	"& .MuiListItemText-primary": {
		fontSize: "14px",
		color: "#333",
		fontWeight: 400,
	},
});

const StyledCheckbox = styled(Checkbox)({
	"& .MuiSvgIcon-root": {
		fontSize: "20px",
	},
});

const FilterActions = styled(Box)({
	padding: "12px 16px",
	borderTop: "1px solid #e0e0e0",
	backgroundColor: "#fafafa",
	display: "flex",
	justifyContent: "space-between",
	gap: "12px",
});

const FilterActionButton = styled(Button)({
	flex: 1,
	height: "32px",
	fontSize: "14px",
	fontWeight: 500,
	textTransform: "none",
});

const PaginationContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "flex-end",
	alignItems: "center",
	borderTop: `1px solid ${theme.palette.divider}`,
	backgroundColor: theme.palette.common.white,
}));

// Types
interface FilterState {
	engineType: string[];
	engineName: string[];
	status: string[];
	latencyRange: string[];
	tokenRange: string[];
}

interface PopoverState {
	anchorEl: HTMLElement | null;
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
	const theme = useTheme();

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
		anchorEl: null,
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
	const handleFilterClick = useCallback(
		(event: React.MouseEvent<HTMLElement>, column: keyof FilterState) => {
			event.stopPropagation();
			setTempFilters({ ...appliedFilters });
			setPopoverState({
				anchorEl: event.currentTarget,
				column,
			});
		},
		[appliedFilters],
	);

	const handlePopoverClose = useCallback(() => {
		setPopoverState({
			anchorEl: null,
			column: null,
		});
		setTempFilters({ ...appliedFilters });
	}, [appliedFilters]);

	const handleApplyFilters = useCallback(() => {
		setAppliedFilters({ ...tempFilters });
		handlePopoverClose();
	}, [tempFilters, handlePopoverClose]);

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
		(_event: unknown, newPage: number) => {
			onPaginationChange(newPage, rowsPerPage);
		},
		[onPaginationChange, rowsPerPage],
	);

	const handleChangeRowsPerPage = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
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
				<FilterPopoverContent>
					<FilterOptionsList>
						<FilterListItem>
							<StyledListItemButton
								onClick={() =>
									handleSelectAll(column, optionValues)
								}
							>
								<StyledCheckbox
									checked={allSelected}
									checkboxProps={{
										indeterminate:
											tempFilters[column].length > 0 &&
											!allSelected,
									}}
								/>
								<List.ItemText
									primary="Select All"
									primaryTypographyProps={{
										fontSize: "14px",
										fontWeight: 500,
									}}
								/>
							</StyledListItemButton>
						</FilterListItem>
						{column === "latencyRange" || column === "tokenRange"
							? (options as FilterOption[]).map((option) => (
									<FilterListItem key={option.value}>
										<StyledListItemButton
											onClick={() =>
												handleMultiSelectFilter(
													column,
													option.value,
												)
											}
										>
											<StyledCheckbox
												checked={tempFilters[
													column
												].includes(option.value)}
											/>
											<List.ItemText
												primary={option.label}
												primaryTypographyProps={{
													fontSize: "14px",
													fontWeight: tempFilters[
														column
													].includes(option.value)
														? 500
														: 400,
												}}
											/>
										</StyledListItemButton>
									</FilterListItem>
								))
							: (options as string[]).map((value) => {
									const displayValue =
										column === "status"
											? value === "true"
												? "Success"
												: "Failed"
											: value;

									return (
										<FilterListItem key={value}>
											<StyledListItemButton
												onClick={() =>
													handleMultiSelectFilter(
														column,
														value,
													)
												}
											>
												<StyledCheckbox
													checked={tempFilters[
														column
													].includes(value)}
												/>
												<List.ItemText
													primary={displayValue}
													primaryTypographyProps={{
														fontSize: "14px",
														fontWeight: tempFilters[
															column
														].includes(value)
															? 500
															: 400,
													}}
												/>
											</StyledListItemButton>
										</FilterListItem>
									);
								})}
					</FilterOptionsList>
				</FilterPopoverContent>
				<FilterActions>
					<FilterActionButton
						variant="text"
						onClick={handleClearFilterPopover}
						color="inherit"
					>
						Clear
					</FilterActionButton>
					<FilterActionButton
						variant="contained"
						onClick={handleApplyFilters}
						color="primary"
					>
						Apply
					</FilterActionButton>
				</FilterActions>
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
			<Container elevation={1}>
				<Header>
					<StyledTitle variant="h6">
						Prompt & Response Timeline
					</StyledTitle>
				</Header>
				<SearchSection sx={{ justifyContent: "center" }}>
					<Typography variant="body2" color="textSecondary">
						No logs available.
					</Typography>
				</SearchSection>
			</Container>
		);
	}

	return (
		<>
			<Container elevation={1}>
				<Header>
					<StyledTitle variant="h6">
						Prompt & Response Timeline
					</StyledTitle>
					<Box display="flex" alignItems="center" gap={2}>
						{totalActiveFilters > 0 && (
							<Button
								variant="outlined"
								// size="small"
								onClick={handleClearAllFilters}
								startIcon={<ClearIcon />}
							>
								Clear Filters
							</Button>
						)}
						<SearchField
							placeholder="Search logs..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon
											sx={{
												color: theme.palette.text
													.secondary,
											}}
										/>
									</InputAdornment>
								),
								endAdornment: searchQuery && (
									<InputAdornment position="end">
										<IconButton
											size="small"
											onClick={() => setSearchQuery("")}
										>
											<ClearIcon fontSize="small" />
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
					</Box>
				</Header>
				<StyledTableContainer>
					<Table stickyHeader>
						<StyledTableHead>
							<Table.Row>
								<Table.Cell>
									<HeaderCellContent>
										<Typography variant="subtitle2">
											User Id
										</Typography>
									</HeaderCellContent>
								</Table.Cell>
								<Table.Cell>
									<HeaderCellContent>
										<Typography variant="subtitle2">
											Session Id
										</Typography>
									</HeaderCellContent>
								</Table.Cell>
								<Table.Cell>
									<HeaderCellContent>
										<Typography variant="subtitle2">
											Request
										</Typography>
									</HeaderCellContent>
								</Table.Cell>
								<Table.Cell>
									<HeaderCellContent>
										<Typography variant="subtitle2">
											Response
										</Typography>
									</HeaderCellContent>
								</Table.Cell>
								<Table.Cell>
									<HeaderCellContent>
										<Stack
											direction="row"
											alignItems="center"
											gap={1}
										>
											<Typography variant="subtitle2">
												Engine Type
											</Typography>
											<IconButton
												size="small"
												onClick={(e) =>
													handleFilterClick(
														e,
														"engineType",
													)
												}
											>
												<Badge
													color="primary"
													badgeContent={getActiveFiltersCount(
														"engineType",
													)}
												>
													<FilterListIcon fontSize="small" />
												</Badge>
											</IconButton>
										</Stack>
									</HeaderCellContent>
								</Table.Cell>
								<Table.Cell>
									<HeaderCellContent>
										<Stack
											direction="row"
											alignItems="center"
											gap={1}
										>
											<Typography variant="subtitle2">
												Engine Name
											</Typography>
											<IconButton
												size="small"
												onClick={(e) =>
													handleFilterClick(
														e,
														"engineName",
													)
												}
											>
												<Badge
													color="primary"
													badgeContent={getActiveFiltersCount(
														"engineName",
													)}
												>
													<FilterListIcon fontSize="small" />
												</Badge>
											</IconButton>
										</Stack>
									</HeaderCellContent>
								</Table.Cell>
								<Table.Cell>
									<HeaderCellContent>
										<Stack
											direction="row"
											alignItems="center"
											gap={1}
										>
											<Typography variant="subtitle2">
												Latency
											</Typography>
											<IconButton
												size="small"
												onClick={(e) =>
													handleFilterClick(
														e,
														"latencyRange",
													)
												}
											>
												<Badge
													color="primary"
													badgeContent={getActiveFiltersCount(
														"latencyRange",
													)}
												>
													<FilterListIcon fontSize="small" />
												</Badge>
											</IconButton>
										</Stack>
									</HeaderCellContent>
								</Table.Cell>
								<Table.Cell>
									<HeaderCellContent>
										<Stack
											direction="row"
											alignItems="center"
											gap={1}
										>
											<Typography variant="subtitle2">
												Tokens
											</Typography>
											<IconButton
												size="small"
												onClick={(e) =>
													handleFilterClick(
														e,
														"tokenRange",
													)
												}
											>
												<Badge
													color="primary"
													badgeContent={getActiveFiltersCount(
														"tokenRange",
													)}
												>
													<FilterListIcon fontSize="small" />
												</Badge>
											</IconButton>
										</Stack>
									</HeaderCellContent>
								</Table.Cell>
								<Table.Cell>
									<HeaderCellContent>
										<Typography variant="subtitle2">
											Timestamp
										</Typography>
									</HeaderCellContent>
								</Table.Cell>
								<Table.Cell>
									<HeaderCellContent>
										<Stack
											direction="row"
											alignItems="center"
											gap={1}
										>
											<Typography variant="subtitle2">
												Status
											</Typography>
											<IconButton
												size="small"
												onClick={(e) =>
													handleFilterClick(
														e,
														"status",
													)
												}
											>
												<Badge
													color="primary"
													badgeContent={getActiveFiltersCount(
														"status",
													)}
												>
													<FilterListIcon fontSize="small" />
												</Badge>
											</IconButton>
										</Stack>
									</HeaderCellContent>
								</Table.Cell>
							</Table.Row>
						</StyledTableHead>
						<Table.Body>
							{filteredLogs.map((event, index) => (
								<StyledTableRow
									key={`Log-${event.endTime}-${index}`}
									data-testid={`log-row-${index}`}
									onClick={() => handleRowClick(event)}
								>
									<StyledTableCell>
										<Typography
											variant="body2"
											title={event.userId}
										>
											{ellipsed(event.userId, 23)}
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography
											variant="body2"
											title={event.sessionId}
										>
											{ellipsed(event.sessionId, 23)}
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography
											variant="body2"
											title={event.request}
										>
											{ellipsed(event.request)}
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography
											variant="body2"
											title={event.response}
										>
											{ellipsed(event.response)}
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography variant="body2">
											{event.engineType}
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography variant="body2">
											{event.engineName}
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography variant="body2">
											{event.latency}ms
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography variant="body2">
											{event.tokens}
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography variant="caption">
											{`${TimeDateFormatter(event.startTime).time} - ${
												TimeDateFormatter(event.endTime)
													.time
											}`}
										</Typography>
									</StyledTableCell>
									<StyledTableCell align="center">
										{event.status ? (
											<CheckCircleIcon color="success" />
										) : (
											<Cancel color="error" />
										)}
									</StyledTableCell>
								</StyledTableRow>
							))}
						</Table.Body>
					</Table>
				</StyledTableContainer>

				<PaginationContainer>
					<Table.Pagination
						count={totalCount}
						page={page}
						onPageChange={handleChangePage}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={handleChangeRowsPerPage}
						rowsPerPageOptions={[5, 10, 25, 50]}
						disabled={totalActiveFilters > 0}
					/>
				</PaginationContainer>
			</Container>

			<ResultsInfo>
				<Typography variant="body2" color="textSecondary">
					Showing {filteredLogs.length} of {totalCount} results
					{totalActiveFilters > 0 &&
						` (${totalActiveFilters} filter${
							totalActiveFilters > 1 ? "s" : ""
						} applied)`}
				</Typography>
				{filteredLogs.length === 0 && logs.length > 0 && (
					<Typography variant="body2" color="error">
						No results found. Try adjusting your filters.
					</Typography>
				)}
			</ResultsInfo>

			<FilterPopover
				id={"filter-popover"}
				open={Boolean(popoverState.anchorEl)}
				anchorEl={popoverState.anchorEl}
				onClose={handlePopoverClose}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "left",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "left",
				}}
			>
				{renderFilterPopover()}
			</FilterPopover>

			<Drawer
				anchor="right"
				open={drawerOpen}
				onClose={handleDrawerClose}
				PaperProps={{
					sx: {
						borderRadius: "8px",
					},
				}}
				transitionDuration={{
					enter: 300,
					exit: 150,
				}}
			>
				<AuditLogsDetailDrawer
					logDetails={selectedEvent}
					handleDrawerClose={handleDrawerClose}
				/>
			</Drawer>
		</>
	);
};
