import { Box, Typography, SxProps, styled } from "@mui/material";

const StyledTypography = styled(Typography)({
    color: "rgba(0, 0, 0, 0.6)",
});

const StyledBox = styled(Box)({
    padding: "6px, 16px, 6px, 16px",
});

export interface DrawerHeaderProps {
    /**
     * Set the text-align on the component.
     * @default 'inherit'
     */
    align?: "inherit" | "left" | "center" | "right" | "justify";
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    fontWeight?: "light" | "regular" | "medium" | "500" | "bold";

    variant?:
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "subtitle1"
        | "subtitle2"
        | "body1"
        | "body2"
        | "caption"
        | "button"
        | "overline";

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const DrawerHeader = (props: DrawerHeaderProps) => {
    const { sx } = props;
    return (
        <StyledBox>
            <StyledTypography sx={sx} variant="subtitle2" {...props} />
        </StyledBox>
    );
};
