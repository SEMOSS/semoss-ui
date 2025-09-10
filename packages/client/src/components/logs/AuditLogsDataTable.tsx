import {
	Cancel,
	CheckCircle as CheckCircleIcon,
	Clear as ClearIcon,
	FilterList as FilterListIcon,
	Search as SearchIcon,
} from "@mui/icons-material";
import React, { useMemo, useState } from "react";
import {
	Badge,
	Box,
	Button,
	Checkbox,
	Chip,
	Drawer,
	IconButton,
	InputAdornment,
	List,
	ListItemText,
	Paper,
	Popover,
	Stack,
	styled,
	Table,
	TextField,
	Typography,
} from "@semoss/ui";
import type { EventData } from "@/types";
import { AuditLogsDetailDrawer } from "./AuditLogsDetailDrawer";

const Container = styled(Paper)({
	padding: 0,
	backgroundColor: "#fff",
	borderRadius: 8,
	border: "1px solid #e0e0e0",
	marginTop: 16,
});

const Header = styled(Box)({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: 16,
});

const StyledTitle = styled(Typography)({
	fontWeight: 600,
	color: "#333",
	fontSize: "18px",
});

const SearchSection = styled(Box)({
	padding: "16px",
	borderBottom: "1px solid #e0e0e0",
	backgroundColor: "#f8f9fa",
	display: "flex",
	alignItems: "center",
	gap: "16px",
});

const SearchField = styled(TextField)({
	minWidth: "400px",
	flex: "1 1 400px",
	"& .MuiOutlinedInput-root": {
		backgroundColor: "#fff",
		height: "40px",
	},
});

const FilterChipsContainer = styled(Box)({
	display: "flex",
	gap: "8px",
	alignItems: "center",
	flexWrap: "wrap",
});

const ResultsInfo = styled(Box)({
	padding: "8px 16px",
	backgroundColor: "#f0f4f8",
	borderBottom: "1px solid #e0e0e0",
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
});

const StyledTableContainer = styled(Table.Container)({
	backgroundColor: "#fff",
	padding: "16px",
	"& .MuiTable-root": {
		borderCollapse: "separate",
		borderSpacing: 0,
	},
});

const StyledTableHead = styled(Table.Head)({
	"& .MuiTableCell-head": {
		backgroundColor: "#f5f9fe",
		fontWeight: 600,
		color: "#0471F0",
		padding: "6px 16px",
		borderBottom: "1px solid #e0e0e0",
		zIndex: 0,
	},
});

const StyledTableRow = styled(Table.Row)({
	cursor: "pointer",
	transition: "background-color 0.15s ease",
	"&:hover": {
		backgroundColor: "#f8f9fa",
	},
	"& .MuiTableCell-root": {
		borderBottom: "1px solid #f0f0f0",
		padding: "12px 16px",
	},
});

const StyledTableCell = styled(Table.Cell)({
	padding: "12px 16px",
	fontSize: "14px",
	color: "#333",
	verticalAlign: "middle",
	width: "fit-content",
	maxWidth: "fit-content",
	"&:first-of-type, &:nth-of-type(2)": {
		width: "15%",
		maxWidth: "15%",
	},
});

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
	},
});

const FilterPopoverContent = styled(Box)({
	maxHeight: "300px",
	overflowY: "auto",
});

const FilterSection = styled(Box)({
	padding: "0",
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
	padding: "0px 16px",
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

const SelectAllListItemButton = styled(List.ItemButton)({
	padding: "0px 16px",
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
	},
});

const StyledCheckbox = styled(Checkbox)({
	"& .MuiSvgIcon-root": {
		fontSize: "20px",
	},
});

const FilterActions = styled(Box)({
	padding: "8px 16px",
	borderTop: "1px solid #e0e0e0",
	backgroundColor: "#fafafa",
	display: "flex",
	justifyContent: "space-between",
	gap: "12px",
});

const FilterActionButton = styled(Button)({
	flex: 1,
	height: "24px",
	fontSize: "14px",
	fontWeight: 400,
	textTransform: "none",
});

interface FilterState {
	engineType: string[];
	engineName: string[];
	status: string[];
	latencyRange: string[];
	tokenRange: string[];
}

interface PopoverState {
	anchorEl: HTMLElement | null;
	column: string | null;
}

interface AuditLogsDataTableProps {
	logs: EventData[];
}

const TimeDateFormatter = (timeStamp: string | number) => {
	const tempDate = new Date(timeStamp);
	const formattedDate = tempDate.toISOString().split('.')[0];
    const date = formattedDate.split("T")[0];
    const time = formattedDate.split("T")[1];
    return { date, time };
};

export const AuditLogsDataTable: React.FC<AuditLogsDataTableProps> = ({
	logs = [],
}) => {
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

	const filterOptions = useMemo(() => {
		const engineType = [
			...new Set(logs.map((log) => log.engineType)),
		].filter(Boolean);
		const engineName = [
			...new Set(logs.map((log) => log.engineName)),
		].filter(Boolean);
		const status = [...new Set(logs.map((log) => log.status))].filter(
			Boolean,
		);

		const generateDynamicLatencyRanges = () => {
			const latencies = logs
				.map((log) => Number(log.latency))
				.filter((latency) => !Number.isNaN(latency) && latency > 0)
				.sort((a, b) => a - b);

			if (!latencies.length) {
				return [
					{ label: "Fast (≤ 5s)", value: "0-5000" },
					{ label: "Medium (5-15s)", value: "5000-15000" },
					{ label: "Slow (> 15s)", value: "15000-999999" },
				];
			}

			const minLatency = latencies[0];
			const maxLatency = latencies[latencies.length - 1];

			if (minLatency === maxLatency) {
				const latencyInSeconds = (minLatency / 1000).toFixed(1);
				return [
					{
						label: `${latencyInSeconds}s`,
						value: `${minLatency}-${minLatency}`,
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
					label: `Medium (${(bucket1End + 1) / 1000 < 1 ? `${Math.round(bucket1End + 1)}ms` : ((bucket1End + 1) / 1000).toFixed(1)}s - ${(bucket2End / 1000).toFixed(1)}s)`,
					value: `${bucket1End + 1}-${bucket2End}`,
				},
				{
					label: `Slow (> ${(bucket2End / 1000).toFixed(1)}s)`,
					value: `${bucket2End + 1}-${maxLatency}`,
				},
			];
		};

		const generateDynamicTokenRanges = () => {
			const tokens = logs
				.map((log) => parseInt(log.tokens) || 0)
				.filter((token) => token > 0)
				.sort((a, b) => a - b);

			if (!tokens.length) {
				return [
					{ label: "Short (< 10)", value: "0-10" },
					{ label: "Medium (10-50)", value: "10-50" },
					{ label: "Long (> 50)", value: "50-999999" },
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
			engineType,
			engineName,
			status,
			latencyRange: generateDynamicLatencyRanges(),
			tokenRange: generateDynamicTokenRanges(),
		};
	}, [logs]);

	const filteredLogs = useMemo(() => {
		let filtered = logs;

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(
				(log) =>
					log.payload?.toLowerCase().includes(query) ||
					log.response?.toLowerCase().includes(query) ||
					log.engineName?.toLowerCase().includes(query),
			);
		}

		if (appliedFilters.engineType.length > 0) {
			filtered = filtered.filter((log) =>
				appliedFilters.engineType.includes(log.engineType),
			);
		}

		if (appliedFilters.status.length > 0) {
			filtered = filtered.filter((log) =>
				appliedFilters.status.includes(log.status),
			);
		}

		if (appliedFilters.latencyRange.length > 0) {
			filtered = filtered.filter((log) => {
				const logLatency = Number(log.latency);
				return appliedFilters.latencyRange.some((range) => {
					const [min, max] = range.split("-").map(Number);
					return logLatency >= min && logLatency <= max;
				});
			});
		}

		if (appliedFilters.tokenRange.length > 0) {
			filtered = filtered.filter((log) => {
				const logTokens = parseInt(log.tokens) || 0;
				return appliedFilters.tokenRange.some((range) => {
					const [min, max] = range.split("-").map(Number);
					return logTokens >= min && logTokens <= max;
				});
			});
		}

		if (appliedFilters.engineName.length > 0) {
			filtered = filtered.filter((log) =>
				appliedFilters.engineName.includes(log.engineName),
			);
		}

		return filtered;
	}, [logs, searchQuery, appliedFilters]);

	const handleFilterClick = (
		event: React.MouseEvent<unknown, MouseEvent>,
		column: string,
	) => {
		event.stopPropagation();
		setTempFilters({ ...appliedFilters });
		setPopoverState({
			anchorEl: event.currentTarget as HTMLElement,
			column,
		});
	};

	const handlePopoverClose = () => {
		setPopoverState({
			anchorEl: null,
			column: null,
		});
		setTempFilters({ ...appliedFilters });
	};

	const handleApplyFilters = () => {
		setAppliedFilters({ ...tempFilters });
		handlePopoverClose();
	};

	const handleClearAllFilters = () => {
		const clearedFilters = {
			engineType: [],
			engineName: [],
			status: [],
			latencyRange: [],
			tokenRange: [],
		};
		setTempFilters(clearedFilters);
	};

	const handleMultiSelectFilter = (
		filterType: keyof FilterState,
		value: string,
	) => {
		setTempFilters((prev) => ({
			...prev,
			[filterType]: prev[filterType].includes(value)
				? prev[filterType].filter((item) => item !== value)
				: [...prev[filterType], value],
		}));
	};

	const handleSelectAll = (
		filterType: keyof FilterState,
		allOptions: string[],
	) => {
		setTempFilters((prev) => ({
			...prev,
			[filterType]:
				tempFilters[filterType].length === allOptions.length
					? []
					: [...allOptions],
		}));
	};

	const clearFilters = () => {
		setSearchQuery("");
		setAppliedFilters({
			engineType: [],
			engineName: [],
			status: [],
			latencyRange: [],
			tokenRange: [],
		});
		setTempFilters({
			engineType: [],
			engineName: [],
			status: [],
			latencyRange: [],
			tokenRange: [],
		});
	};

	const getActiveFiltersCount = (column?: string) => {
		if (column) {
			return appliedFilters[column].length;
		}
		return (
			appliedFilters.engineType.length +
			appliedFilters.engineName.length +
			appliedFilters.latencyRange.length +
			appliedFilters.tokenRange.length +
			appliedFilters.status.length +
			(searchQuery ? 1 : 0)
		);
	};

	const renderFilterPopover = () => {
		const { column } = popoverState;
		if (!column) return null;

		const renderFilterContent = () => {
			const optionValues = filterOptions[column];
			const allSelected =
				tempFilters[column]?.length === optionValues?.length;
			return (
				<FilterOptionsList>
					<FilterListItem>
						<SelectAllListItemButton
							onClick={() =>
								handleSelectAll(
									column as keyof FilterState,
									optionValues.map((option) =>
										typeof option === "object"
											? option.value
											: option,
									),
								)
							}
						>
							<StyledCheckbox
								checked={allSelected}
								checkboxProps={{
									indeterminate:
										tempFilters[column]?.length > 0 &&
										!allSelected,
								}}
							/>
							<ListItemText
								primary="Select All"
								primaryTypographyProps={{
									fontSize: "14px",
								}}
							/>
						</SelectAllListItemButton>
					</FilterListItem>
					{optionValues.map((optionValue) => {
						const option =
							typeof optionValue === "object"
								? optionValue
								: { value: optionValue, label: optionValue };

						return (
							<FilterListItem key={option.value}>
								<StyledListItemButton
									onClick={() =>
										handleMultiSelectFilter(
											column as keyof FilterState,
											option.value,
										)
									}
								>
									<StyledCheckbox
										checked={tempFilters[column].includes(
											option.value,
										)}
									/>
									<ListItemText
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
						);
					})}
				</FilterOptionsList>
			);
		};

		return (
			<>
				<FilterPopoverContent>
					<FilterSection>{renderFilterContent()}</FilterSection>
				</FilterPopoverContent>

				<FilterActions>
					<FilterActionButton
						variant="text"
						onClick={handleClearAllFilters}
						color="inherit"
					>
						Clear All
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
	};

	const handleRowClick = (event: EventData) => {
		setSelectedEvent(event);
		setDrawerOpen(true);
	};

	const handleDrawerClose = () => {
		setDrawerOpen(false);
		setSelectedEvent(null);
	};

	const ellipsed = (text: string | null) => {
		return text?.length > 50 ? `${text.substring(0, 47)}...` : text;
	};

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
				</Header>

				<SearchSection>
					<SearchField
						placeholder="Search prompts, responses..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ color: "#666" }} />
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
					{getActiveFiltersCount() > 0 && (
						<FilterChipsContainer>
							{Object.entries(appliedFilters).map(
								([key, values]) => (
									<React.Fragment key={key}>
										{values.length > 0 && (
											<Chip
												label={`${
													key
														.slice(0, 1)
														?.toUpperCase() +
													key.slice(1)
												}: ${values.join(", ")}`}
												size="small"
												onDelete={() =>
													setAppliedFilters(
														(prev) => ({
															...prev,
															[key]: [],
														}),
													)
												}
												color="primary"
												variant="outlined"
											/>
										)}
									</React.Fragment>
								),
							)}
							{searchQuery && (
								<Chip
									label={`Search: "${searchQuery}"`}
									size="small"
									onDelete={() => setSearchQuery("")}
									color="primary"
									variant="outlined"
								/>
							)}
							<Button
								variant="outlined"
								size="small"
								onClick={clearFilters}
								startIcon={<ClearIcon />}
							>
								Clear All
							</Button>
						</FilterChipsContainer>
					)}
				</SearchSection>

				<StyledTableContainer>
					<Table stickyHeader>
						<StyledTableHead>
							<Table.Row>
								<Table.Cell>
									<HeaderCellContent>
										<Typography variant="subtitle2">
											Prompt
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
											<Badge
												color="primary"
												badgeContent={getActiveFiltersCount(
													"engineType",
												)}
											>
												<FilterListIcon
													fontSize="small"
													onClick={(e) =>
														handleFilterClick(
															e,
															"engineType",
														)
													}
												/>
											</Badge>
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
											<Badge
												color="primary"
												badgeContent={getActiveFiltersCount(
													"engineName",
												)}
											>
												<FilterListIcon
													fontSize="small"
													onClick={(e) =>
														handleFilterClick(
															e,
															"engineName",
														)
													}
												/>
											</Badge>
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
											<Badge
												color="primary"
												badgeContent={getActiveFiltersCount(
													"latencyRange",
												)}
											>
												<FilterListIcon
													fontSize="small"
													onClick={(e) =>
														handleFilterClick(
															e,
															"latencyRange",
														)
													}
												/>
											</Badge>
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
											<Badge
												color="primary"
												badgeContent={getActiveFiltersCount(
													"tokenRange",
												)}
											>
												<FilterListIcon
													fontSize="small"
													onClick={(e) =>
														handleFilterClick(
															e,
															"tokenRange",
														)
													}
												/>
											</Badge>
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
											<Badge
												color="primary"
												badgeContent={getActiveFiltersCount(
													"status",
												)}
											>
												<FilterListIcon
													fontSize="small"
													onClick={(e) =>
														handleFilterClick(
															e,
															"status",
														)
													}
												/>
											</Badge>
										</Stack>
									</HeaderCellContent>
								</Table.Cell>
							</Table.Row>
						</StyledTableHead>

						<Table.Body>
							{filteredLogs?.map((event, index) => (
								<StyledTableRow
									key={`Log-${event.endTime}`}
									data-testid={`log-row-${index}`}
									onClick={() => handleRowClick(event)}
								>
									<StyledTableCell>
										<Typography
											variant="body2"
											title={event.payload}
										>
											{ellipsed(event.payload)}
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
										{event.status === "Success" ? (
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
			</Container>

			<ResultsInfo>
				<Typography variant="body2" color="#666">
					Showing {filteredLogs.length} of {logs.length} results
					{getActiveFiltersCount() > 0 &&
						` (${getActiveFiltersCount()} filter${
							getActiveFiltersCount() > 1 ? "s" : ""
						} applied)`}
				</Typography>
				{filteredLogs.length === 0 && logs.length > 0 && (
					<Typography variant="body2" color="error">
						No results found. Try adjusting your filters.
					</Typography>
				)}
			</ResultsInfo>

			<FilterPopover
				id="filter-popover"
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
