import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { Button, styled, Typography } from "@semoss/ui";

const StyledBannerTitle = styled(Typography)(({ theme }) => ({
	color: "#212121",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontFamily: "Inter",
	fontSize: "24px",
	fontStyle: "normal",
	fontWeight: "700",
	lineHeight: "133.4%",
}));

const StyledBannerText = styled(Typography)(({ theme }) => ({
	color: "#212121",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: "500",
	lineHeight: "150%" /* 24px */,
	letterSpacing: "0.15px",
	padding: theme.spacing(3, 0),
	width: "50%",
}));

const StyledButton = styled(Button)(({ theme }) => ({
	"&.MuiButtonBase-root": {
		marginTop: "auto",
		borderRadius: "12px",
		background: theme.palette.primary.main,
	},
}));

const StyledBannerSection = styled("div")<{ theme?: any; imageUrl: string }>(
	({ theme, imageUrl }) => ({
		padding: "53px 21px",
		minHeight: "276px",
		width: "100%",
		display: "flex",
		flexDirection: "column",
		alignItems: "flex-start",
		borderRadius: "24px",
		background: `linear-gradient(
                270deg, rgba(255,255,255,0.00) 19.7%, 
                rgba(255,255,255,0.3) 81.54%, rgba(219,214,249,0.6) 106.35%) 100%, 
                url(${imageUrl}) no-repeat;`,

		backgroundSize: "cover, cover, cover",
	}),
);

interface BannerSectionProps {
	/**
	 * Tagline
	 */
	tagline: string;

	/**
	 * description
	 */
	description: string;

	/**
	 * meta for the button to navigate and display
	 */
	link: {
		label: string;
		to: string;
	};

	/**
	 * image
	 */
	imageUrl: string;
}

export const BannerSection = (props: BannerSectionProps) => {
	const { tagline, imageUrl, description, link } = props;
	const navigate = useNavigate();

	return (
		<StyledBannerSection imageUrl={imageUrl}>
			<StyledBannerTitle variant="h5">{tagline}</StyledBannerTitle>
			<StyledBannerText variant="body1">{description}</StyledBannerText>
			<StyledButton
				variant="contained"
				size="large"
				onClick={(e) => navigate(link.to)}
				endIcon={<ArrowForwardIcon style={{ color: "#fff" }} />}
			>
				{link.label}
			</StyledButton>
		</StyledBannerSection>
	);
};
