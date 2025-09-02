import { useCallback, useState } from "react";
import { blue, Chip, green, styled } from "@semoss/ui";
import { THEME } from "@/constants";

interface ChipRootProps {
	isChipSelected: boolean;
	disableHover: boolean;
	hovered: boolean;
}
export const StyledPromptTokenChip = styled(Chip, {
	shouldForwardProp: (prop) =>
		prop !== "isChipSelected" &&
		prop !== "disableHover" &&
		prop !== "hovered",
})<ChipRootProps>(({ theme, isChipSelected, disableHover, hovered }) => ({
	cursor: disableHover ? "default" : "pointer",
	fontWeight: "600",
	margin: "0 1px 2px",

	...((!hovered || disableHover) && {
		backgroundColor: isChipSelected ? theme.palette.primary.main : blue[50],
		color: isChipSelected ? blue[50] : theme.palette.primary.main,
	}),
}));

export const PromptTokenChip = (props) => {
	const { disableHover, ...rest } = props;
	const { mouseOver, mouseOut, hovered } = useHover();

	function useHover() {
		const [hovered, setHovered] = useState(false);

		const mouseOver = useCallback(() => {
			setHovered(true);
		}, []);

		const mouseOut = useCallback(() => {
			setHovered(false);
		}, []);

		return { mouseOver, mouseOut, hovered };
	}

	return (
		<StyledPromptTokenChip
			onMouseOver={mouseOver}
			onMouseOut={mouseOut}
			color={hovered && !disableHover ? "secondary" : null}
			hovered={hovered}
			disableHover={disableHover}
			{...rest}
		/>
	);
};
