import {
	Cancel,
	CheckCircle as CheckCircleIcon,
	Clear as ClearIcon,
	Search as SearchIcon,
} from "@mui/icons-material";
import type React from "react";
import { useMemo, useState } from "react";
import {
	Box,
	Drawer,
	IconButton,
	InputAdornment,
	Paper,
	Stack,
	styled,
	Table,
	TextField,
	Typography,
	useTheme,
} from "@semoss/ui";
import type { EventData } from "@/types";
import { AuditLogsDetailDrawer } from "./AuditLogsDetailDrawer";

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

const PaginationContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "flex-end",
	alignItems: "center",
	borderTop: `1px solid ${theme.palette.divider}`,
	backgroundColor: theme.palette.common.white,
}));

interface AuditLogsDataTableProps {
	logs: EventData[];
	totalCount?: number;
	page: number;
	rowsPerPage: number;
	onPaginationChange: (page: number, rowsPerPage: number) => void;
}

const TimeDateFormatter = (timeStamp: string | number) => {
	const tempDate = new Date(timeStamp);
	const formattedDate = tempDate.toISOString().split(".")[0];
	const date = formattedDate.split("T")[0];
	const time = formattedDate.split("T")[1];
	return { date, time };
};

export const AuditLogsDataTable: React.FC<AuditLogsDataTableProps> = ({
	logs = [],
	totalCount = 0,
	page,
	rowsPerPage,
	onPaginationChange,
}) => {
	const theme = useTheme();
	const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

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
					log.latency?.toString().toLowerCase().includes(query) ||
					log.tokens?.toString().toLowerCase().includes(query),
			);
		}

		return filtered;
	}, [logs, searchQuery]);

	const handleRowClick = (event: EventData) => {
		setSelectedEvent(event);
		setDrawerOpen(true);
	};

	const handleDrawerClose = () => {
		setDrawerOpen(false);
		setTimeout(() => {
			setSelectedEvent(null);
		}, 300);
	};

	const handleChangePage = (event: unknown, newPage: number) => {
		if (onPaginationChange) {
			onPaginationChange(newPage, rowsPerPage);
		}
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const newRowsPerPage = parseInt(event.target.value, 10);
		if (onPaginationChange) {
			onPaginationChange(0, newRowsPerPage);
		}
	};

	const ellipsed = (text: string | null, maxLength = 50) => {
		return text?.length > maxLength
			? `${text.substring(0, maxLength - 3)}...`
			: text;
	};

	const displayedLogs = filteredLogs;

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
					<SearchField
						placeholder="Search prompts, responses..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon
										sx={{
											color: theme.palette.text.secondary,
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
										</Stack>
									</HeaderCellContent>
								</Table.Cell>
							</Table.Row>
						</StyledTableHead>
						<Table.Body>
							{displayedLogs?.map((event, index) => (
								<StyledTableRow
									key={`Log-${event.endTime}`}
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
						// component="div"
						count={totalCount}
						page={page}
						onPageChange={handleChangePage}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={handleChangeRowsPerPage}
						rowsPerPageOptions={[5, 10, 25, 50]}
					/>
				</PaginationContainer>
			</Container>

			<ResultsInfo>
				<Typography variant="body2" color="textSecondary">
					Showing {displayedLogs.length} of {totalCount} results
				</Typography>
				{filteredLogs.length === 0 && logs.length > 0 && (
					<Typography variant="body2" color="error">
						No results found. Try adjusting your filters.
					</Typography>
				)}
			</ResultsInfo>

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
