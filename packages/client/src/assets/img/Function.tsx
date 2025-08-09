import { SwitchAccessShortcutOutlined } from "@mui/icons-material";
import React from "react";
import { CustomPaletteOptions, styled } from "@semoss/ui";

const StyledContainer = styled("div")(({ theme }) => {
	return {
		// width: '50px', height: '50px',
		".MuiIcon-fontSizeLarge": {
			width: "2em",
			height: "2em",
		},
	};
});

const StyledIcon = styled(SwitchAccessShortcutOutlined)(({ theme }) => {
	return {
		color: theme.palette.pink["300"],
	};
});

export const Function = () => {
	return (
		<StyledContainer>
			<StyledIcon fontSize="large" />
		</StyledContainer>
	);
};
