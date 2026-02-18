import { GppGoodRounded } from "@mui/icons-material";
import {styled } from "@semoss/ui";

const StyledContainer = styled("div")(({ theme }) => {
    return {
        ".MuiIcon-fontSizeLarge": {
            width: "2em",
            height: "2em",
        },
    };
});

const StyledIcon = styled(GppGoodRounded)(({ theme }) => {
    return {
        color: "#0471F0",
    };
});

export const GuardrailIcon = () => {
    return (
        <StyledContainer>
            <StyledIcon fontSize="large" />
        </StyledContainer>
    );
};
