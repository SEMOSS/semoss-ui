import React from "react";
import { SxProps, styled } from "@mui/material";
import { Box, BoxProps } from "../Box";
import { Drawer } from "./";

const StyledContainer = styled(Box)({
    width: "100%",
    height: 50,
    justifyContent: "center",
    position: "absolute", //Here is the trick
    bottom: 0, //Here is the trick
});

const StyledBox = styled(Box)({
    padding: "16px",
});

export interface DrawerFooterProps extends BoxProps {
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const DrawerFooter = (props: DrawerFooterProps) => {
    const { sx } = props;
    return (
        <StyledContainer sx={sx} {...props}>
            <Drawer.Divider />
            <StyledBox>{props.children}</StyledBox>
        </StyledContainer>
    );
};
