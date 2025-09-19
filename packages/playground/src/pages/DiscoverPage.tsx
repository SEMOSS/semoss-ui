import { AccessTimeOutlined, Add } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Button,
	Grid,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";

const StyledCaption = styled(Typography)(() => ({
	color: "var(--Text-Primary, #212121)",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontFamily: "Roboto",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "166%" /* 24px */,
	letterSpacing: "0.4px",
	display: "-webkit-box",
	"-webkit-line-clamp": "2",
	"-webkit-box-orient": "vertical",
	height: "40px",
	overflow: "hidden",
}));

const StyledCardItem = styled(Stack)(({ theme }) => ({
	display: "flex",
	width: "100%",
	backgroundColor: theme.palette.background.paper,
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: "rgba(64, 160, 255, 0.50)",
	borderRadius: theme.shape.borderRadius,
	cursor: "pointer",
	padding: theme.spacing(3),
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(1),
	minWidth: "0",
}));

const StyledGridCard = styled(Grid)(({ theme }) => ({
	background: theme.palette.background.paper,
	paddingLeft: "0",
	paddingTop: "0",
}));

const StyledBox = styled(Box)(() => ({
	maxHeight: "640px",
	overflowY: "scroll",
}));

const StyledTitle = styled(Typography)(() => ({
	color: "var(--Text-Primary, #212121)",
	fontFeatureSettings: "'liga' off, 'clig' off",
	/* Typography/H6 */
	fontFamily: "Inter",
	fontSize: "20px",
	fontStyle: "normal",
	fontWeight: "700",
	lineHeight: "160%" /* 32px */,
	letterSpacing: "0.15px",
}));

const StyledOuterContainer = styled(Stack)(({ theme }) => ({
	padding: theme.spacing(2),
}));

// TODO: Pull from backend
const ALL_AGENTS = [
	{
		NAME: "Weather Forecaster",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Create Meeting Minutes",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Plan Your Next Vacation",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Financial Analyst",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Weather Forecaster",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Create Meeting Minutes",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Plan Your Next Vacation",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Financial Analyst",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
];

export const DiscoverPage = observer(() => {
	const navigate = useNavigate();

	const [search, setSearch] = useState("");
	return (
		<StyledOuterContainer
			direction={"column"}
			spacing={3}
			justifyContent={"space-evenly"}
			alignItems={"center"}
		>
			<Stack
				direction={"row"}
				width={"100%"}
				spacing={2}
				justifyContent={"space-between"}
				alignItems={"center"}
			>
				<StyledTitle variant={"h6"}>Discover</StyledTitle>
				<Button
					variant="outlined"
					startIcon={<Add />}
					onClick={() => {
						navigate("/discover/new");
					}}
				>
					Create Agent
				</Button>
			</Stack>
			<Stack direction={"row"} width={"100%"} spacing={2}>
				<TextField
					color="primary"
					variant={"outlined"}
					size="small"
					fullWidth={true}
					placeholder="Search"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</Stack>
			<StyledBox>
				<Grid container spacing={2} alignItems={"flex-start"}>
					{ALL_AGENTS.filter((agent) => {
						const searchText = search ? search.toLowerCase() : null;
						if (searchText) {
							return agent.NAME.toLowerCase().includes(
								searchText,
							);
						} else {
							return false;
						}
					}).map((p) => {
						return (
							<StyledGridCard
								key={p.NAME}
								item
								xs={3}
								onClick={() => {
									//To Do
								}}
							>
								<StyledCardItem
									direction={"column"}
									spacing={1}
									justifyContent={"center"}
									alignItems={"center"}
								>
									<StyledCaption variant={"body1"}>
										{p.NAME}
									</StyledCaption>
									<Stack
										direction={"row"}
										spacing={1}
										alignItems={"center"}
									>
										<AccessTimeOutlined />
										<Typography variant={"body1"}>
											{`Published: ${p.PUBLISH_DATE}`}
										</Typography>
									</Stack>
								</StyledCardItem>
							</StyledGridCard>
						);
					})}
				</Grid>
			</StyledBox>
		</StyledOuterContainer>
	);
});
