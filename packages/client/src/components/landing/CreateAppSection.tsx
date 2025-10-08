import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import { Box, Button, styled, Typography } from "@semoss/ui";
import { formatToDataTestId } from "@/utility";
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

const StyledBoxNavCardContainer = styled(Box)(({ theme }) => ({
	margin: 0,
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));

const StyledBoxButtonConatiner = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "space-between",
	gap: theme.spacing(2),
}));

const StyledBoxMainCardWrapper = styled(Box)(({ theme }) => ({
	display: "flex",
	alignSelf: "center",
	gap: theme.spacing(3),
	margin: 0,
}));

const StyledBoxNavCardBodyContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
}));

const StyledBoxImageContainer = styled(Box)(() => ({
	display: "flex",
	alignItems: "flex-end",
	justifyContent: "center",
}));

const StyledButton = styled(Button)(({ theme }) => ({
	"&.app-navigation-buttons": {
		borderColor: theme.palette.common.white,
		borderRadius: "12px",
		padding: theme.spacing(0.5, 1.25),
		alignSelf: "flex-start",
		"> :hover": {
			border: theme.palette.common.white,
		},
	},
}));

const StyledImgTag = styled("img")(() => ({
	width: "100%",
	height: "100%",
	objectFit: "contain",
	display: "block",
}));

const UploadAppButton = styled(Button)(({ theme }) => ({
	borderColor: theme.palette.action.disabled,
	color: theme.palette.text.primary,
	borderRadius: "12px",
	padding: theme.spacing(1.25, 2),
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
		<StyledBoxNavCardBodyContainer>
			<Typography variant="h6" gutterBottom>
				{title}
			</Typography>
			<Typography variant="body2" gutterBottom>
				{description}
			</Typography>
		</StyledBoxNavCardBodyContainer>
		<StyledBoxNavCardBodyContainer>
			<StyledButton
				variant="text"
				color="primary"
				className="app-navigation-buttons"
				data-testid={formatToDataTestId(
					`createAppSection-${testId}-btn`,
				)}
				onClick={() => {
					// Handle button click, e.g., navigate to a specific page
					console.log(`Navigating to ${title}`);
					setApp(type);
				}}
			>
				Get started
			</StyledButton>
			{image && (
				<StyledBoxImageContainer>
					<StyledImgTag src={image} alt={title} />
				</StyledBoxImageContainer>
			)}
		</StyledBoxNavCardBodyContainer>
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
		<StyledBoxNavCardContainer>
			<StyledBoxButtonConatiner>
				<Typography variant="h6" gutterBottom>
					Get started with our tools
				</Typography>
				{uploadApp && (
					<UploadAppButton
						startIcon={<FileUploadOutlined />}
						variant="outlined"
						onClick={uploadApp}
						data-testid={"createAppSection-upload-btn"}
					>
						Upload App
					</UploadAppButton>
				)}
			</StyledBoxButtonConatiner>
			<StyledBoxMainCardWrapper>
				{navCards.map((card) => (
					<NavCard key={card.title} {...card} setApp={setupApp} />
				))}
			</StyledBoxMainCardWrapper>
		</StyledBoxNavCardContainer>
	);
};

export default CreateAppSection;
