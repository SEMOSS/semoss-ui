import { ChevronRight, Close, FilterAlt } from "@mui/icons-material";
import { useState } from "react";
import {
	Accordion,
	Box,
	IconButton,
	LinearProgress,
	Menu,
	Popover,
	Search,
	Stack,
	styled,
	Table,
	TextField,
	Tooltip,
} from "@semoss/ui";
import { HistoryRow } from "./HistoryRow";
import type { HistoryJob } from "./job.types";

const StyledAccordion = styled(Accordion)(() => ({
	"&:before": {
		display: "none",
	},
}));
const StyledAccordionTrigger = styled(Accordion.Trigger)(() => ({
	"& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
		transform: "rotate(90deg)",
	},
}));
const LoadingTableCell = styled(Table.Cell)(() => ({
	padding: 0,
}));

const FilterPopover = styled(Popover)({
	"& .MuiPaper-root": {
		padding: 0,
		boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
		borderRadius: "8px",
		border: "1px solid #e0e0e0",
		maxWidth: "350px",
	},
});

const FilterPopoverContent = styled(Box)({
	display: "flex",
	alignItems: "center",
	maxHeight: "300px",
	overflowY: "auto",
	padding: "10px",
});

interface FilterState {
	status: string;
}

/**
 * TODO: this component is mostly just ported over from the old version - it's functional but pretty crusty
 * Would be good to clean this file up and make it more readable in the future
 */
export const JobHistory = (props: {
	history: HistoryJob[];
	historyLoading: boolean;
	historyCount: number;
	historyPage: number;
	historyRowsPerPage: number;
	onPageChange?: (page: number) => void;
	onRowsPerPageChange?: (rowsPerPage: number) => void;
	onSearchChange?: (search: string) => void;
}) => {
	const {
		history,
		historyLoading,
		historyCount,
		historyPage,
		historyRowsPerPage,
		onPageChange,
		onRowsPerPageChange,
		onSearchChange,
	} = props;
	const statusOptions = [
		{ value: "", label: "Any" },
		{ value: "true", label: "Success" },
		{ value: "false", label: "Failed" },
	];
	const defaultFilterState: FilterState = { status: "" };
	const [historyExpanded, setHistoryExpanded] = useState(false);
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const [filters, setFilters] = useState<FilterState>(defaultFilterState);

	const open = Boolean(anchorEl);
	const id = open ? "filter-popover" : undefined;

	const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleFilterChange = (field) => (event) => {
		setFilters({ ...filters, [field]: event.target.value });
	};

	const applyFilters = (data, filters) =>
		data.filter((row) => {
			if (filters.status !== "") {
				const filterValue = filters.status === "true";
				if (row.success !== filterValue) return false;
			}

			return true;
		});

	const filteredRows = applyFilters(history, filters);

	return (
		<StyledAccordion
			expanded={historyExpanded}
			onChange={(e) => {
				setHistoryExpanded(!historyExpanded);
			}}
		>
			<StyledAccordionTrigger expandIcon={<ChevronRight />}>
				History
			</StyledAccordionTrigger>
			<Accordion.Content>
				<Stack direction="row">
					<Search
						fullWidth
						size="small"
						onChange={(e) => onSearchChange(e.target.value)}
					/>
					<Tooltip title="Filter list">
						<IconButton onClick={handleFilterClick}>
							<FilterAlt />
						</IconButton>
					</Tooltip>
					<FilterPopover
						id={id}
						open={open}
						anchorEl={anchorEl}
						onClose={handleClose}
						anchorOrigin={{
							vertical: "bottom",
							horizontal: "left",
						}}
						transformOrigin={{
							vertical: "top",
							horizontal: "center",
						}}
					>
						<FilterPopoverContent>
							<Tooltip title="Reset/Close Filter">
								<IconButton
									onClick={() => {
										setFilters(defaultFilterState);
										handleClose();
									}}
								>
									<Close />
								</IconButton>
							</Tooltip>
							<TextField
								select
								label="Status"
								value={filters.status}
								onChange={handleFilterChange("status")}
								variant="outlined"
								size="small"
								sx={{ minWidth: 100 }}
							>
								{statusOptions.map((option) => (
									<Menu.Item
										key={option.value}
										value={option.value}
									>
										{option.label}
									</Menu.Item>
								))}
							</TextField>
						</FilterPopoverContent>
					</FilterPopover>
				</Stack>
				<Table.Container>
					<Table>
						<Table.Head>
							<Table.Row>
								<Table.Cell></Table.Cell>
								<Table.Cell>Name</Table.Cell>
								<Table.Cell>Run Date</Table.Cell>
								<Table.Cell>Time</Table.Cell>
								<Table.Cell>Status</Table.Cell>
							</Table.Row>
						</Table.Head>
						<Table.Body>
							{historyLoading && (
								<Table.Row>
									<LoadingTableCell colSpan={5}>
										<LinearProgress variant="indeterminate" />
									</LoadingTableCell>
								</Table.Row>
							)}
							{history.length === 0 && !historyLoading ? (
								<Table.Row>
									<Table.Cell colSpan={5}>
										No job history, please try again.
									</Table.Cell>
								</Table.Row>
							) : (
								filteredRows.map((history, i) => {
									return <HistoryRow key={i} row={history} />;
								})
							)}
						</Table.Body>
						<Table.Footer>
							<Table.Row>
								<Table.Pagination
									rowsPerPageOptions={[5, 10, 25]}
									onPageChange={(e, v) => {
										onPageChange(v);
									}}
									page={historyPage}
									rowsPerPage={historyRowsPerPage}
									onRowsPerPageChange={(e) => {
										onRowsPerPageChange(
											Number(e.target.value),
										);
									}}
									count={historyCount}
								/>
							</Table.Row>
						</Table.Footer>
					</Table>
				</Table.Container>
			</Accordion.Content>
		</StyledAccordion>
	);
};
