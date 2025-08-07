import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { observer } from "mobx-react-lite";
import { Button, Chip, Link, styled, Typography } from "@semoss/ui";

const StyledOuterContainer = styled("div")(() => ({
	display: "flex",
	borderRadius: "12px",
	background: "#FFF",
	boxShadow: "0px 5px 8px 0px rgba(0, 0, 0, 0.08)",
}));

const StyledInnerContainer = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	padding: theme.spacing(2),
	justifyContent: "space-between",
	flexDirection: "column",
	width: "100%",
}));

const StyledContainerTitleSection = styled("div")(() => ({
	display: "flex",
	width: "100%",
	justifyContent: "space-between",
}));

const StyledContainerContentSection = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	justifyContent: "space-between",
	padding: theme.spacing(2, 0),
}));

const StyledContainerImageSection = styled("div")<{ backgroundImage: string }>(
	({ backgroundImage }) => ({
		display: "flex",
		backgroundImage: `${backgroundImage}`,
		backgroundSize: "100% 100%",
		backgroundRepeat: "no-repeat",
		borderRadius: "12px",
		minWidth: "204px",
	}),
);

const StyledContainerButtonSection = styled("div")(() => ({
	display: "flex",
	justifyContent: "flex-start",
	width: "100%",
}));

const StyledChip = styled(Chip)<{ chipColor?: string }>(() => ({
	borderRadius: "4px",
	background: "#FDF0E5",
	"& .MuiChip-label": {
		color: "var(--Primary-Main, #5F2B01)",
		fontFeatureSettings: "'liga' off, 'clig' off",
		fontFamily: "Inter",
		fontSize: "13px",
		fontStyle: "normal",
		fontWeight: "400",
		lineHeight: "18px",
		letterSpacing: "0.16px",
	},
}));

const StyledTagline = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.primary,
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: "500",
	lineHeight: "150%",
	letterSpacing: "0.15px",
}));

const StyledDescription = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.primary,
	fontFeatureSettings: "'liga' off, 'clig' off",
}));

const StyledButton = styled(Button)(({ theme }) => ({
	"& .MuiButton-endIcon": {
		color: theme.palette.primary.main,
	},
}));

const StyledDisabledButton = styled(Button)(({ theme }) => ({
	"& .MuiButton-endIcon": {
		color: theme.palette.text.disabled,
	},
}));

const StyledLink = styled(Link)(() => ({
	textDecoration: "none",
	color: "inherit",
}));

interface FeaturedAppCardProps {
	/**
	 * Where to navigate
	 */
	href?: string | undefined;
	/**
	 * Tagline
	 */
	tagline: string;

	/**
	 * the chip to display
	 */
	chip: {
		label: string;
		color: string;
	};

	/**
	 * description
	 */
	description: string;

	/**
	 * image
	 */
	imageUrl: string;
}

export const FeaturedAppCard = observer((props: FeaturedAppCardProps) => {
	const { tagline, imageUrl, description, chip, href } = props;
	return (
		<StyledOuterContainer>
			<StyledInnerContainer>
				<StyledContainerTitleSection>
					<StyledTagline variant={"body1"}>{tagline}</StyledTagline>
					<StyledChip
						variant="filled"
						size="small"
						label={chip.label}
					/>
				</StyledContainerTitleSection>
				<StyledContainerContentSection>
					<StyledDescription variant="body2">
						{description}
					</StyledDescription>
				</StyledContainerContentSection>
				<StyledContainerButtonSection>
					{!href ? (
						<StyledDisabledButton
							variant="text"
							disabled={true}
							endIcon={<ArrowForwardIcon />}
						>
							Try it out
						</StyledDisabledButton>
					) : (
						<StyledLink
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							underline="none"
						>
							<StyledButton
								variant="text"
								endIcon={<ArrowForwardIcon />}
							>
								Try it out
							</StyledButton>
						</StyledLink>
					)}
				</StyledContainerButtonSection>
			</StyledInnerContainer>
			<StyledContainerImageSection backgroundImage={`url(${imageUrl})`}>
				&nbsp;
			</StyledContainerImageSection>
		</StyledOuterContainer>
	);
});
