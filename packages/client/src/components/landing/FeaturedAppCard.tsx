import { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { Button, Chip, Typography, styled, Link } from "@semoss/ui";

const StyledOuterContainer = styled("div")(({ theme }) => ({
  display: "flex",
  // flex: '1 1.5 50%',
  borderRadius: "12px",
  background: "#FFF",
  boxShadow: "0px 5px 8px 0px rgba(0, 0, 0, 0.08)",
  minHeight: "204px",
}));
const StyledInnerContainer = styled("div")(({ theme }) => ({
  display: "flex",
  // flex: '0.55 1 75%',
  alignItems: "center",
  padding: theme.spacing(2),
  justifyContent: "space-between",
  flexDirection: "column",
  width: "100%",
}));

const StyledContainerTitleSection = styled("div")(({ theme }) => ({
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
  ({ theme, backgroundImage }) => ({
    display: "flex",
    backgroundImage: `${backgroundImage}`,
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    borderRadius: "12px",
    minWidth: "204px",
  })
);

const StyledContainerButtonSection = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  width: "100%",
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: "4px",
  background: "var(--Primary-Selected, #FDF0E5)",
  "&.MuiChip-root > .MuiChip-label": {
    color: "var(--Primary-Main, #5F2B01)",
    fontFeatureSettings: "'liga' off, 'clig' off",
    /* Components/Chip */
    fontFamily: "Inter",
    fontSize: "13px",
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: "18px" /* 138.462% */,
    letterSpacing: "0.16px",
  },
}));

const StyledTagline = styled(Typography)(({ theme }) => ({
  color: "#212121",
  fontFeatureSettings: "'liga' off, 'clig' off",
  fontFamily: "Inter",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: "500",
  lineHeight: "150%" /* 24px */,
  letterSpacing: "0.15px",
}));

const StyledDescription = styled(Typography)(({ theme }) => ({
  color: "#212121",
  fontFeatureSettings: "'liga' off, 'clig' off",
}));

const StyledArrowForwardIcon = styled(ArrowForwardIcon)<{
  theme?: any;
  colorValue?: string;
}>(({ theme, colorValue }) => ({
  color: colorValue ?? theme.palette.primary.main,
}));

interface FeaturedAppCardProps {
  /**
   * Where to navigate
   */
  href?: string | undefined;
  /**
   * Tagline
   */
  tagline: ReactNode;

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
            sx={{
              borderRadius: "4px",
              background: chip.color,
            }}
            label={chip.label}
          />
        </StyledContainerTitleSection>
        <StyledContainerContentSection>
          <StyledDescription variant="body2">{description}</StyledDescription>
        </StyledContainerContentSection>
        <StyledContainerButtonSection>
          {!href ? (
            <Button
              variant="text"
              disabled={true}
              endIcon={
                <StyledArrowForwardIcon colorValue="rgba(0, 0, 0, 0.26)" />
              }
            >
              {" "}
              Try it out{" "}
            </Button>
          ) : (
            <Link
              href={href}
              rel="noopener noreferrer"
              color="inherit"
              underline="none"
            >
              <Button
                variant="text"
                endIcon={<StyledArrowForwardIcon colorValue="#0471F0" />}
              >
                {" "}
                Try it out{" "}
              </Button>
            </Link>
          )}
        </StyledContainerButtonSection>
      </StyledInnerContainer>
      <StyledContainerImageSection backgroundImage={`url(${imageUrl})`}>
        &nbsp;
      </StyledContainerImageSection>
    </StyledOuterContainer>
  );
});
