import { observer } from "mobx-react-lite";
import { Box, styled, Typography } from "@semoss/ui";
import { PlatformSearch } from "@/components/shared";
import BusinessUserImage from "../../assets/img/BusinessUserLanding.svg";
import businessUsercheckgrid from "../../assets/img/businessUsercheckgrid.svg";

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
						{subTitle.map((title) => (
							<GradientText variant="h2" key={title}>
								{title}
							</GradientText>
						))}
					</SliderText>
				</SliderTexts>
			</ContentContainer>
			<Box sx={{ width: "100%", maxWidth: "60%", overflow: "auto" }}>
				<PlatformSearch className="h-15 rounded-3xl border-[rgb(198,191,252)]" />
			</Box>
		</StyledContainer>
	);
});
