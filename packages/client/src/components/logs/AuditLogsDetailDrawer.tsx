import {
	Cancel,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
} from "@mui/icons-material";
import { Box, IconButton, styled, Typography } from "@semoss/ui";

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

const TimeDateFormatter = (timeStamp: string | number) => {
	const tempDate = new Date(timeStamp);
	const formattedDate = tempDate.toISOString().split('.')[0];
    const date = formattedDate.split("T")[0];
    const time = formattedDate.split("T")[1];
    return { date, time };
};
export const AuditLogsDetailDrawer = (props) => {
	const { logDetails, handleDrawerClose } = props;
	if (!logDetails)
		return <Typography variant="body2">No details available</Typography>;
	return (
		<DrawerContainer>
			<DrawerHeader>
				<Typography variant="body1" color="primary">
					Audit Details
				</Typography>
				<IconButton onClick={handleDrawerClose} size="small">
					<CloseIcon />
				</IconButton>
			</DrawerHeader>

			{logDetails && (
				<DrawerContent>
					<SummarySection>
						<SummaryTitle variant="subtitle2">
							Event Summary
						</SummaryTitle>
						<ContentTitle variant="subtitle2">Prompt</ContentTitle>
						<ContentBox>
							<ContentText variant="body2">
								{logDetails.payload}
							</ContentText>
						</ContentBox>

						<ContentTitle variant="subtitle2">
							Response
						</ContentTitle>
						<ContentBox>
							<ContentText variant="body2">
								{logDetails.response}
							</ContentText>
						</ContentBox>
					</SummarySection>

					<SummaryGrid>
						<SummaryItem>
							<SummaryLabel variant="caption">
								Engine Type
							</SummaryLabel>
							<SummaryValue variant="body2">
								{logDetails.engineType}
							</SummaryValue>
						</SummaryItem>
						<SummaryItem>
							<SummaryLabel variant="caption">
								Engine Name
							</SummaryLabel>
							<SummaryValue variant="body2">
								{logDetails.engineName}
							</SummaryValue>
						</SummaryItem>
						<SummaryItem>
							<SummaryLabel variant="caption">
								Latency
							</SummaryLabel>
							<SummaryValue variant="body2">
								{logDetails.latency}ms
							</SummaryValue>
						</SummaryItem>
						<SummaryItem>
							<SummaryLabel variant="caption">
								Tokens
							</SummaryLabel>
							<SummaryValue variant="body2">
								{logDetails.tokens}
							</SummaryValue>
						</SummaryItem>
						<SummaryItem>
							<SummaryLabel variant="caption">
								Timestamp
							</SummaryLabel>
							<SummaryValue variant="body2">
								{`${TimeDateFormatter(logDetails.startTime).time} - ${
									TimeDateFormatter(logDetails.endTime).time
								}`}
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
									{logDetails.status === "Success" ? (
										<CheckCircleIcon color="success" />
									) : (
										<Cancel color="error" />
									)}
									<Typography variant="body2">
										{logDetails.status}
									</Typography>
								</Box>
							</SummaryValue>
						</SummaryItem>
					</SummaryGrid>
				</DrawerContent>
			)}
		</DrawerContainer>
	);
};
