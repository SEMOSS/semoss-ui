import {
	Cancel,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	DragIndicator as DragIndicatorIcon,
} from "@mui/icons-material";
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, IconButton, styled, Typography } from "@semoss/ui";

const DrawerContainer = styled(Box)(({ theme }) => ({
	position: "relative",
	minWidth: 500,
	height: "100%",
	backgroundColor: theme.palette.common.white,
	display: "flex",
	flexDirection: "column",
}));

const DragHandle = styled(Box)(({ theme }) => ({
	position: "absolute",
	left: -4,
	top: "50%",
	transform: "translateY(-50%)",
	width: "16px",
	height: "32px",
	cursor: "ew-resize",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	backgroundColor: theme.palette.common.white,
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius / 2,
	zIndex: 1,
	"&:hover": {
		backgroundColor: theme.palette.action.hover,
		borderColor: theme.palette.action.selected,
		".dragIcon": {
			opacity: 1,
			color: theme.palette.primary.main,
		},
	},
	"&:active": {
		backgroundColor: theme.palette.action.selected,
		borderColor: theme.palette.action.selected,
		".dragIcon": {
			opacity: 1,
			color: theme.palette.primary.main,
		},
	},
	".dragIcon": {
		opacity: 0.5,
		transition: theme.transitions.create("all"),
		color: theme.palette.text.secondary,
		pointerEvents: "none",
		fontSize: "16px",
	},
}));

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
	const formattedDate = tempDate.toISOString().split(".")[0];
	const date = formattedDate.split("T")[0];
	const time = formattedDate.split("T")[1];
	return { date, time };
};
export const AuditLogsDetailDrawer = (props) => {
	const { logDetails, handleDrawerClose } = props;
	const [width, setWidth] = useState(500);
	const drawerRef = useRef(null);
	const isDragging = useRef(false);
	const startX = useRef(0);
	const startWidth = useRef(0);

	const handleMouseDown = useCallback(
		(e) => {
			isDragging.current = true;
			startX.current = e.clientX;
			startWidth.current = width;
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[width],
	);

	const handleMouseMove = useCallback((e) => {
		if (!isDragging.current) return;
		const delta = startX.current - e.clientX;
		const newWidth = Math.max(500, startWidth.current + delta);
		setWidth(newWidth);
	}, []);

	const handleMouseUp = useCallback(() => {
		isDragging.current = false;
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
	}, [handleMouseMove]);

	useEffect(() => {
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	if (!logDetails)
		return <Typography variant="body2">No details available</Typography>;
	return (
		<DrawerContainer ref={drawerRef} sx={{ width: `${width}px` }}>
			<DragHandle onMouseDown={handleMouseDown}>
				<DragIndicatorIcon className="dragIcon" fontSize="small" />
			</DragHandle>
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
								{logDetails.latency}s
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
									{logDetails.status ? (
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
