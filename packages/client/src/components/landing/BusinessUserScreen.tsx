import { Search as SearchIcon } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import {
	Box,
	IconButton,
	InputAdornment,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import BusinessUserImage from "../../assets/img/BusinessUserLanding.svg";
import businessUsercheckgrid from "../../assets/img/businessUsercheckgrid.svg";
import { PlatformSearch } from "../shared";

const StyledContainer = styled("div")(({ theme }) => ({
	position: "absolute",
	inset: 0,
	backgroundImage: ` url(${BusinessUserImage}), linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url(${businessUsercheckgrid})`,
	backgroundRepeat: "no-repeat",
	backgroundSize: "47%, 100%, 100%",
	backgroundPosition: "right bottom, center",
	display: "flex",
	alignItems: "flex-start",
	flexDirection: "column",
	padding: theme.spacing(0, 9),
	gap: theme.spacing(4),
}));

const GradientText = styled(Typography)(() => ({
	background: "linear-gradient(90deg, #6C53FF 0%, #86ECFF 100%)",
	WebkitBackgroundClip: "text",
	WebkitTextFillColor: "transparent",
	backgroundClip: "text",
	color: "transparent",
	fontWeight: 700,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(4),
	background: "transparent",
	borderRadius: theme.shape.borderRadius,
	textAlign: "left",
	marginTop: theme.spacing(6),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
	width: "100%",
	background: theme.palette.common.white,
	borderRadius: theme.shape.borderRadius * 2,
}));

const SliderTexts = styled(Box)(() => ({
	position: "relative",
	width: "100%",
	height: "72px",
	overflow: "hidden",
}));

const SliderText = styled(Box)(() => ({
	position: "absolute",
	display: "flex",
	flexDirection: "column",
	animation: "slide 9s infinite",
	height: "216px", // 72px * 3 (for 3 titles)
	top: 0,
}));

const keyframes = `
  @keyframes slide {
    8% { transform: translateY(0); opacity: 1; }
    25% { opacity: 0; }
    42% { transform: translateY(-72px); opacity: 1; }
    59% { opacity: 0; }
    76% { transform: translateY(-144px); opacity: 1; }
    91% { opacity: 0; }
  }
`;

const subTitle = ["business apps", "the power of models", "knowledge repos"];

export const BusinessUserScreen: React.FC = observer(() => {
	return (
		<StyledContainer>
			<ContentContainer sx={{ width: "100%" }}>
				<Typography
					variant="h2"
					sx={{ fontWeight: 700, lineHeight: 0.9 }}
				>
					Discover
				</Typography>
				<style>{keyframes}</style>
				<SliderTexts>
					<SliderText>
						{subTitle.map((title, idx) => (
							<GradientText variant="h2" key={idx}>
								{title}
							</GradientText>
						))}
					</SliderText>
				</SliderTexts>
			</ContentContainer>
			<Box sx={{ width: "100%", maxWidth: "60%", overflow: "auto" }}>
				<PlatformSearch
					renderInput={(params) => (
						<StyledTextField
							{...params}
							variant="outlined"
							placeholder="Search"
							sx={{
								// Border color
								"& .MuiOutlinedInput-root": {
									"& fieldset": {
										borderColor: "#C6BFFC",
										boxShadow: "0px 0px 0px -1px #8D7BF8",
										borderWidth: "initial",
										borderRadius: "60px",
									},
									// '&:hover fieldset': {
									//     borderColor: '#6C5DD3', // hover color
									// },
									// '&.Mui-focused fieldset': {
									//     borderColor: '#6C5DD3', // focused color
									// },
								},
							}}
							InputProps={{
								...params.InputProps,
								startAdornment: (
									<InputAdornment position="start">
										<IconButton aria-label="Search">
											<SearchIcon />
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
					)}
				/>
			</Box>
		</StyledContainer>
	);
});
