import {
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
} from "@mui/icons-material";
import React, { useState } from "react";
import {
	Box,
	Drawer,
	IconButton,
	Paper,
	styled,
	Table,
	Typography,
} from "@semoss/ui";
import { EventData, TimeDateFormatter } from "../EngineDashboard";

// Styled Components
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

const StyledTableContainer = styled(Table.Container)({
	backgroundColor: "#fff",
	padding: "16px",
	"& .MuiTable-root": {
		borderCollapse: "separate",
		borderSpacing: 0,
	},
});

const StyledTableHead = styled(Table.Head)(({ theme }) => ({
	"& .MuiTableCell-head": {
		backgroundColor: "#f5f9fe",
		fontWeight: 600,
		color: "#0471F0",
		padding: "6px 16px",
		borderBottom: "1px solid #e0e0e0",
		position: "sticky",
		top: 0,
		zIndex: 0,
	},
}));

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
	"&:first-of-type, &:nth-of-type(2), &:nth-of-type(6)": {
		width: "20%",
		maxWidth: "20%",
	},
	"&:nth-of-type(3), &:nth-of-type(4)": {
		width: "10%",
		maxWidth: "10%",
	},
});

// Side Drawer Styled Components
const DrawerContainer = styled(Box)({
	width: 500,
	height: "100%",
	backgroundColor: "#fff",
	display: "flex",
	flexDirection: "column",
});

const DrawerHeader = styled(Box)({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: "8px 12px",
	borderBottom: "1px solid #e6e6e6",
	backgroundColor: "#ebf4fe",
});

const DrawerContent = styled(Box)({
	flex: 1,
	padding: "0",
	overflowY: "auto",
	backgroundColor: "#fff",
});

const SummarySection = styled(Box)({
	padding: "20px",
	borderBottom: "1px solid #e9ecef",
});

const SummaryTitle = styled(Typography)({
	fontWeight: 600,
	color: "#495057",
	marginBottom: "12px",
});

const SummaryGrid = styled(Box)({
	display: "grid",
	gridTemplateColumns: "1fr 1fr",
	gap: "12px",
	padding: "20px",
});

const SummaryItem = styled(Box)({
	display: "flex",
	flexDirection: "column",
	gap: "4px",
});

const SummaryLabel = styled(Typography)({
	color: "#6c757d",
	fontWeight: 500,
});

const SummaryValue = styled(Typography)({
	color: "#212529",
	fontWeight: 600,
});

const ContentTitle = styled(Typography)({
	fontWeight: 600,
	color: "#495057",
	marginBottom: "8px",
	display: "flex",
	alignItems: "center",
	gap: "8px",
});

const ContentBox = styled(Box)({
	backgroundColor: "#f8f9fa",
	border: "1px solid #e9ecef",
	borderRadius: "6px",
	padding: "16px",
	marginBottom: "16px",
});

const ContentText = styled(Typography)({
	lineHeight: 1.6,
	color: "#495057",
	wordBreak: "break-word",
	whiteSpace: "pre-wrap",
});
interface EventDataTableProps {
	logs: EventData[];
}

const EventDataTable: React.FC<EventDataTableProps> = ({ logs = [] }) => {
	const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const handleRowClick = (event: EventData, index: number) => {
		setSelectedEvent(event);
		setDrawerOpen(true);
	};

	const handleDrawerClose = () => {
		setDrawerOpen(false);
		setSelectedEvent(null);
	};

	const formatTimestamp = (startTime: string, endTime: string) => {
		return `${TimeDateFormatter(startTime).time} - ${TimeDateFormatter(endTime).time}`;
	};

	const ellipsed = (text: string | null) => {
		return text?.length > 50 ? `${text.substring(0, 47)}...` : text;
	};

	return (
		<>
			<Container elevation={1}>
				<Header>
					<StyledTitle variant="h6">
						Prompt & Response Timeline
					</StyledTitle>
				</Header>

				<StyledTableContainer>
					<Table stickyHeader>
						<StyledTableHead>
							<Table.Row>
								<Table.Cell>
									<Typography variant="subtitle2">
										Prompt
									</Typography>
								</Table.Cell>
								<Table.Cell>
									<Typography variant="subtitle2">
										Response
									</Typography>
								</Table.Cell>
								<Table.Cell>
									<Typography variant="subtitle2">
										Engine Type
									</Typography>
								</Table.Cell>
								<Table.Cell>
									<Typography variant="subtitle2">
										Latency
									</Typography>
								</Table.Cell>
								<Table.Cell>
									<Typography variant="subtitle2">
										Tokens
									</Typography>
								</Table.Cell>
								<Table.Cell>
									<Typography variant="subtitle2">
										Timestamp
									</Typography>
								</Table.Cell>
								<Table.Cell>
									<Typography variant="subtitle2">
										Status
									</Typography>
								</Table.Cell>
							</Table.Row>
						</StyledTableHead>
						<Table.Body>
							{logs?.map((event, index) => (
								<StyledTableRow
									key={index}
									onClick={() => handleRowClick(event, index)}
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
											{event.latency}ms
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography variant="body2">
											{event.tokens}
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography
											variant="caption"
											sx={{
												fontFamily:
													'Monaco, "Courier New", monospace',
											}}
										>
											{formatTimestamp(
												event.startTime,
												event.endTime,
											)}
										</Typography>
									</StyledTableCell>
									<StyledTableCell>
										<Typography
											variant="body2"
											color={
												event.status === "Success"
													? "#28a745"
													: "#dc3545"
											}
										>
											{event.status.toUpperCase()}
										</Typography>
									</StyledTableCell>
								</StyledTableRow>
							))}
						</Table.Body>
					</Table>
				</StyledTableContainer>
			</Container>

			{/* Side Drawer */}
			<Drawer
				anchor="right"
				open={drawerOpen}
				onClose={handleDrawerClose}
				PaperProps={{
					sx: {
						// boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
						borderRadius: "8px",
					},
				}}
			>
				<DrawerContainer>
					<DrawerHeader>
						<Typography variant="body1" color="primary">
							Audit Details
						</Typography>
						<IconButton onClick={handleDrawerClose} size="small">
							<CloseIcon />
						</IconButton>
					</DrawerHeader>

					{selectedEvent && (
						<DrawerContent>
							{/* Event Summary */}
							<SummarySection>
								<SummaryTitle variant="subtitle2">
									Event Summary
								</SummaryTitle>
								{/* Request & Response */}
								<ContentTitle variant="subtitle2">
									Prompt
								</ContentTitle>
								<ContentBox>
									<ContentText variant="body2">
										{selectedEvent.payload}
									</ContentText>
								</ContentBox>

								<ContentTitle variant="subtitle2">
									Response
								</ContentTitle>
								<ContentBox>
									<ContentText variant="body2">
										{selectedEvent.response}
									</ContentText>
								</ContentBox>
							</SummarySection>

							{/* Summary Grid */}
							<SummaryGrid>
								<SummaryItem>
									<SummaryLabel variant="caption">
										Latency
									</SummaryLabel>
									<SummaryValue variant="body2">
										{selectedEvent.latency}ms
									</SummaryValue>
								</SummaryItem>
								<SummaryItem>
									<SummaryLabel variant="caption">
										Tokens
									</SummaryLabel>
									<SummaryValue variant="body2">
										{selectedEvent.tokens}
									</SummaryValue>
								</SummaryItem>
								<SummaryItem>
									<SummaryLabel variant="caption">
										Timestamp
									</SummaryLabel>
									<SummaryValue variant="body2">
										{formatTimestamp(
											selectedEvent.startTime,
											selectedEvent.endTime,
										)}
									</SummaryValue>
								</SummaryItem>
								<SummaryItem>
									<SummaryLabel variant="caption">
										Request Status
									</SummaryLabel>
									<SummaryValue variant="body2">
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1,
											}}
										>
											<CheckCircleIcon
												color="success"
												fontSize="small"
											/>
											<Typography variant="body2">
												Successfull
											</Typography>
										</Box>
									</SummaryValue>
								</SummaryItem>
							</SummaryGrid>
						</DrawerContent>
					)}
				</DrawerContainer>
			</Drawer>
		</>
	);
};

export default EventDataTable;
