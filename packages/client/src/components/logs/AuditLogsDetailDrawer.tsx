import {
	Cancel,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	KeyboardArrowDown as KeyboardArrowDownIcon,
	KeyboardArrowRight as KeyboardArrowRightIcon,
	UnfoldLess as UnfoldLessIcon,
	UnfoldMore as UnfoldMoreIcon,
} from "@mui/icons-material";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Box,
	Button,
	IconButton,
	styled,
	Typography,
	useTheme,
} from "@semoss/ui";
import { TimeDateFormatter } from "@/pages/AuditLogsDashboard";

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
	left: 0,
	top: 0,
	bottom: 0,
	width: "4px",
	cursor: "ew-resize",
	"&:hover": {
		backgroundColor: theme.palette.action.hover,
	},
	"&:active": {
		backgroundColor: theme.palette.action.selected,
	},
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: "8px 12px",
	borderBottom: `1px solid ${theme.palette.divider}`,
	backgroundColor: theme.palette.primary.hover,
}));

const DrawerContent = styled(Box)(({ theme }) => ({
	flex: 1,
	padding: "0",
	overflowY: "auto",
	backgroundColor: theme.palette.common.white,
}));

const SummarySection = styled(Box)({
	padding: "20px",
	borderBottom: "1px solid #e9ecef",
});

const SummaryTitle = styled(Typography)(({ theme }) => ({
	fontWeight: 600,
	color: theme.palette.text.primary,
	marginBottom: "16px",
}));

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

const SummaryLabel = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontWeight: 500,
}));

const SummaryValue = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.primary,
	fontWeight: 600,
}));

const ContentTitle = styled(Typography)(({ theme }) => ({
	fontWeight: 600,
	color: theme.palette.text.primary,
	display: "flex",
	alignItems: "center",
	gap: "8px",
}));

const ContentTitleWrapper = styled(Box)({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	marginBottom: "8px",
});

const ContentBox = styled(Box)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper2,
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: "6px",
	padding: "4px",
	marginBottom: "16px",
}));

const ContentText = styled(Typography)(({ theme }) => ({
	lineHeight: 1.6,
	color: theme.palette.text.primary,
	wordBreak: "break-word",
	whiteSpace: "pre-wrap",
}));

const JSONTreeContainer = styled(Box)(({ theme }) => ({
	fontSize: "13px",
	fontFamily: "Monaco, monospace",
	lineHeight: "1.4",
	color: theme.palette.text.primary,
	padding: "12px",
	borderRadius: "4px",
	overflowX: "auto",
}));

const JSONKey = styled("span")(({ theme }) => ({
	color: theme.palette.primary.main, // Blue for keys
}));

const JSONString = styled("span")(({ theme }) => ({
	color: theme.palette.error.main, // Red for strings
}));

const JSONNumber = styled("span")(({ theme }) => ({
	color: theme.palette.success.main, // Green for numbers
}));

const JSONBoolean = styled("span")(({ theme }) => ({
	color: theme.palette.info.main, // Blue for booleans
}));

const JSONNull = styled("span")(({ theme }) => ({
	color: theme.palette.info.main, // Blue for null
}));

const ExpandButton = styled(Box)({
	display: "inline-flex",
	alignItems: "center",
	cursor: "pointer",
	padding: "0 4px",
	marginRight: "4px",
	"& svg": {
		fontSize: "16px",
	},
});

interface JSONTreeViewProps {
	data: unknown;
	expandAll?: boolean;
	isChild?: boolean;
}

const JSONTreeView = ({
	data,
	isChild = false,
	expandAll,
}: JSONTreeViewProps) => {
	const [isExpanded, setIsExpanded] = useState(!isChild);
	const hasChildren = data !== null && typeof data === "object";
	const theme = useTheme();

	useEffect(() => {
		if (expandAll !== undefined && hasChildren && isChild) {
			setIsExpanded(expandAll);
		}
	}, [expandAll, hasChildren, isChild]);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	const renderValue = (value: unknown) => {
		if (value === null) return <JSONNull>null</JSONNull>;
		if (typeof value === "string")
			return <JSONString>"{value}"</JSONString>;
		if (typeof value === "number") return <JSONNumber>{value}</JSONNumber>;
		if (typeof value === "boolean")
			return <JSONBoolean>{value.toString()}</JSONBoolean>;
		return null;
	};

	if (!hasChildren) {
		return <Box component="span">{renderValue(data)}</Box>;
	}

	const isArray = Array.isArray(data);

	return (
		<Box sx={{ ml: isChild ? 3 : 0 }}>
			<Box sx={{ display: "flex", alignItems: "center" }}>
				{isChild && (
					<ExpandButton onClick={toggleExpand}>
						{isExpanded ? (
							<KeyboardArrowDownIcon />
						) : (
							<KeyboardArrowRightIcon />
						)}
					</ExpandButton>
				)}
				{isChild && (
					<>
						{isArray ? "" : <JSONKey>"</JSONKey>}
						<Box
							component="span"
							sx={{
								color: () => theme.palette.primary.main,
							}}
						>
							{isArray ? "[" : "{"}
						</Box>
					</>
				)}
			</Box>
			{isExpanded && (
				<Box>
					{Object.entries(data).map(([key, value]) => (
						<Box key={key} sx={{ ml: isChild ? 4 : 0 }}>
							{!isArray && (
								<>
									<JSONKey>"{key}"</JSONKey>:{" "}
								</>
							)}
							<JSONTreeView
								data={value}
								isChild
								expandAll={expandAll}
							/>
						</Box>
					))}
				</Box>
			)}
			{isExpanded && isChild && (
				<Box sx={{ ml: isChild ? 0 : 4 }}>{isArray ? "]" : "}"}</Box>
			)}
		</Box>
	);
};

const hasExpandableContent = (data: unknown): boolean => {
	if (data === null || typeof data !== "object") {
		return false;
	}

	for (const value of Object.values(data)) {
		if (value !== null && typeof value === "object") {
			return true;
		}
	}

	return false;
};

export const AuditLogsDetailDrawer = (props) => {
	const { logDetails, handleDrawerClose } = props;
	const [width, setWidth] = useState(500);
	const [promptExpandAll, setPromptExpandAll] = useState<boolean | undefined>(
		undefined,
	);
	const [responseExpandAll, setResponseExpandAll] = useState<
		boolean | undefined
	>(undefined);
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

	const handlePromptToggle = () => {
		setPromptExpandAll((prev) => (prev === true ? false : true));
	};

	const handleResponseToggle = () => {
		setResponseExpandAll((prev) => (prev === true ? false : true));
	};

	const getPromptData = () => {
		try {
			return JSON.parse(logDetails.request);
		} catch {
			return null;
		}
	};

	const getResponseData = () => {
		try {
			return JSON.parse(logDetails.response);
		} catch {
			return null;
		}
	};

	const promptData = logDetails ? getPromptData() : null;
	const responseData = logDetails ? getResponseData() : null;
	const showPromptExpandButton =
		promptData && hasExpandableContent(promptData);
	const showResponseExpandButton =
		responseData && hasExpandableContent(responseData);

	if (!logDetails)
		return <Typography variant="body2">No details available</Typography>;
	return (
		<DrawerContainer ref={drawerRef} sx={{ width: `${width}px` }}>
			<DragHandle onMouseDown={handleMouseDown} />
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
						<ContentTitleWrapper>
							<ContentTitle variant="subtitle2">
								Request
							</ContentTitle>
							{showPromptExpandButton && (
								<Button
									variant="contained"
									size="small"
									onClick={handlePromptToggle}
									startIcon={
										promptExpandAll ? (
											<UnfoldLessIcon />
										) : (
											<UnfoldMoreIcon />
										)
									}
								>
									{promptExpandAll
										? "Collapse All"
										: "Expand All"}
								</Button>
							)}
						</ContentTitleWrapper>
						<ContentBox>
							{(() => {
								if (promptData) {
									return (
										<JSONTreeContainer>
											<JSONTreeView
												data={promptData}
												expandAll={promptExpandAll}
											/>
										</JSONTreeContainer>
									);
								}
								return (
									<ContentText variant="body2">
										{logDetails.request}
									</ContentText>
								);
							})()}
						</ContentBox>

						<ContentTitleWrapper>
							<ContentTitle variant="subtitle2">
								Response
							</ContentTitle>
							{showResponseExpandButton && (
								<Button
									variant="contained"
									size="small"
									onClick={handleResponseToggle}
									startIcon={
										responseExpandAll ? (
											<UnfoldLessIcon />
										) : (
											<UnfoldMoreIcon />
										)
									}
								>
									{responseExpandAll
										? "Collapse All"
										: "Expand All"}
								</Button>
							)}
						</ContentTitleWrapper>
						<ContentBox>
							{(() => {
								if (responseData) {
									return (
										<JSONTreeContainer>
											<JSONTreeView
												data={responseData}
												expandAll={responseExpandAll}
											/>
										</JSONTreeContainer>
									);
								}
								return (
									<ContentText variant="body2">
										{logDetails.response}
									</ContentText>
								);
							})()}
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
						<SummaryItem>
							<SummaryLabel variant="caption">
								User Id
							</SummaryLabel>
							<SummaryValue variant="body2">
								{logDetails.userId}
							</SummaryValue>
						</SummaryItem>
						<SummaryItem>
							<SummaryLabel variant="caption">
								Session Id
							</SummaryLabel>
							<SummaryValue variant="body2">
								{logDetails.sessionId}
							</SummaryValue>
						</SummaryItem>
						<SummaryItem>
							<SummaryLabel variant="caption">
								Log Timestamp
							</SummaryLabel>
							<SummaryValue variant="body2">
								{
									TimeDateFormatter(logDetails.logTimestamp)
										.time
								}{" "}
								{
									TimeDateFormatter(logDetails.logTimestamp)
										.date
								}
							</SummaryValue>
						</SummaryItem>
					</SummaryGrid>
				</DrawerContent>
			)}
		</DrawerContainer>
	);
};
