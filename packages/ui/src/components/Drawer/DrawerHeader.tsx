import { Box, Typography, SxProps, styled } from "@mui/material";

const StyledTypography = styled(Typography)({
    color: "rgba(0, 0, 0, 0.6)",
});

const StyledBox = styled(Box)({
    padding: "16px",
});

export interface DrawerHeaderProps {
    //** subheader text */
    text: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const DrawerHeader = (props: DrawerHeaderProps) => {
    const { sx } = props;
    return (
        <StyledBox>
            <StyledTypography sx={sx} variant="subtitle2" {...props}>
                {props.text}
            </StyledTypography>
        </StyledBox>
    );
};
