import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import { Box, Button, styled, Typography } from "@semoss/ui";
import Appagent from "../../assets/img/Appagent.svg";
import Appcode from "../../assets/img/Appcode.svg";
import Appdragdrop from "../../assets/img/Appdragdrop.svg";

const navCards = [
	{
		title: "Drag and drop blocks",
		description:
			"Drag and drop UI components to make your app come to life. Customize the design of your app in this low code environment.",
		image: Appdragdrop,
		type: "blocks",
		testId: "new-app-drag-btn",
	},
	{
		title: "Develop in code",
		description:
			"Choose a framework or start from scratch—code and preview your app seamlessly in our editor!",
		image: Appcode,
		type: "code",
		testId: "new-app-code-btn",
	},
	{
		title: "Construct an agent",
		description:
			"Engineer a prompt to interact with your LLM. Structure the text and design inputs to generate the optimal AI response.",
		image: Appagent,
		type: "agent",
		testId: "new-app-agent-btn",
	},
];

const StyledButton = styled(Button)(({ theme }) => ({
	"&.app-navigation-buttons": {
		borderColor: theme.palette.common.white,
		borderRadius: "12px",
		padding: "4px 10px",
		alignSelf: "flex-start",
		"> :hover": {
			border: theme.palette.common.white,
		},
	},
}));

const UploadAppButton = styled(Button)(({ theme }) => ({
	borderColor: theme.palette.action.disabled,
	color: theme.palette.text.primary,
	borderRadius: "12px",
	padding: "10px 16px",
	alignSelf: "flex-start",
}));

const StyledBox = styled(Box)(({ theme }) => ({
	minWidth: "32%",
	borderRadius: "12px",
	boxShadow: "0px 5px 8px 0px rgba(0, 0, 0, 0.08)",
	padding: theme.spacing(2),
	display: "flex",
	flexDirection: "column",
	justifyContent: "space-between",
	gap: theme.spacing(2),
	backgroundColor: theme.palette.background.paper,
}));

const NavCard = ({ title, description, type, image, setApp, testId }) => (
	<StyledBox>
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
			<Typography variant="h6" gutterBottom>
				{title}
			</Typography>
			<Typography variant="body2" gutterBottom>
				{description}
			</Typography>
		</Box>
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
			<StyledButton
				variant="text"
				color="primary"
				className="app-navigation-buttons"
				data-testid={testId}
				onClick={() => {
					// Handle button click, e.g., navigate to a specific page
					console.log(`Navigating to ${title}`);
					setApp(type);
				}}
			>
				Get started
			</StyledButton>
			{image && (
				<Box
					sx={{
						display: "flex",
						alignItems: "flex-end",
						justifyContent: "center",
					}}
				>
					<img
						src={image}
						alt={title}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "contain",
							display: "block",
						}}
					/>
				</Box>
			)}
		</Box>
	</StyledBox>
);

const CreateAppSection = ({
	setupApp,
	uploadApp,
}: {
	setupApp: (type: "blocks" | "code" | "agent") => void;
	uploadApp?: () => void;
}) => {
	return (
		<Box
			sx={{
				margin: 0,
				display: "flex",
				flexDirection: "column",
				gap: 1,
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 2,
				}}
			>
				<Typography variant="h6" gutterBottom>
					Get started with our tools
				</Typography>
				{uploadApp && (
					<UploadAppButton
						startIcon={<FileUploadOutlined />}
						variant="outlined"
						onClick={uploadApp}
						data-testid={"new-app-upload-btn"}
					>
						Upload App
					</UploadAppButton>
				)}
			</Box>
			<Box
				sx={{
					display: "flex",
					alignSelf: "center",
					gap: 3,
					margin: 0,
				}}
			>
				{navCards.map((card) => (
					<NavCard key={card.title} {...card} setApp={setupApp} />
				))}
			</Box>
		</Box>
	);
};

export default CreateAppSection;
