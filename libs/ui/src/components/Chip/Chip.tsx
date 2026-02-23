import { Chip as MuiChip, type SxProps, styled } from "@mui/material";

const StyledMuiChip = styled(MuiChip, {
	shouldForwardProp: (prop) => prop !== "chipColor",
})<{ chipColor: ChipProps["color"] }>(({ chipColor, theme }) => {
	return {
		...(chipColor === "default" && {
			backgroundColor: theme.palette.secondary.selected,
			color: "#212121",
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.secondary.dark,
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.text.secondary,
			},
			"&&:hover": {
				backgroundColor: theme.palette.secondary.selected,
			},
		}),
		...(chipColor === "primary" && {
			backgroundColor: theme.palette.primary.main,
			color: theme.palette.text.white,
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.text.white,
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.text.white,
			},
			"&&:hover": {
				backgroundColor: theme.palette.primary.main,
			},
		}),
		...(chipColor === "green" && {
			backgroundColor: theme.palette.green["700"],
			color: theme.palette.text.white,
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.text.white,
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.text.white,
			},
			"&&:hover": {
				backgroundColor: theme.palette.green["700"],
			},
		}),
		...(chipColor === "pink" && {
			backgroundColor: theme.palette.pink["700"],
			color: theme.palette.text.white,
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.text.white,
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.text.white,
			},
			"&&:hover": {
				backgroundColor: theme.palette.pink["700"],
			},
		}),
		...(chipColor === "purple" && {
			backgroundColor: theme.palette.purple["500"],
			color: theme.palette.text.white,
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.text.white,
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.text.white,
			},
			"&&:hover": {
				backgroundColor: theme.palette.purple["500"],
			},
		}),
		...(chipColor === "indigo" && {
			backgroundColor: theme.palette.darkBlue["600"],
			color: theme.palette.text.white,
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.text.white,
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.text.white,
			},
			"&&:hover": {
				backgroundColor: theme.palette.darkBlue["600"],
			},
		}),
		...(chipColor === "lcprimary" && {
			backgroundColor: theme.palette.primaryContrast["50"],
			color: "",
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.text.white,
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.text.white,
			},
			"&&:hover": {
				backgroundColor: theme.palette.primaryContrast["50"],
			},
		}),
		...(chipColor === "turqoise" && {
			backgroundColor: theme.palette.green["50"],
			color: theme.palette.green["900"],
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.green["900"],
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.green["900"],
			},
			"&&:hover": {
				backgroundColor: theme.palette.green["50"],
			},
		}),
		...(chipColor === "lcpink" && {
			backgroundColor: theme.palette.pink["50"],
			color: theme.palette.pink["900"],
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.pink["900"],
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.pink["900"],
			},
			"&&:hover": {
				backgroundColor: theme.palette.pink["50"],
			},
		}),
		...(chipColor === "lcpurple" && {
			backgroundColor: theme.palette.purple["50"],
			color: theme.palette.purple["900"],
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.purple["900"],
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.purple["900"],
			},
			"&&:hover": {
				backgroundColor: theme.palette.purple["50"],
			},
		}),
		...(chipColor === "lcindigo" && {
			backgroundColor: theme.palette.darkBlue["50"],
			color: theme.palette.purple["900"],
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.purple["900"],
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.purple["900"],
			},
			"&&:hover": {
				backgroundColor: theme.palette.darkBlue["50"],
			},
		}),
		...(chipColor === "red" && {
			backgroundColor: theme.palette.error.main,
			color: theme.palette.text.white,
			borderColor: "",
			".MuiSvgIcon-root": {
				color: theme.palette.text.white,
			},
			"& .MuiChip-deleteIcon": {
				color: theme.palette.text.white,
			},
			"&&:hover": {
				backgroundColor: theme.palette.error.main,
			},
		}),
	};
});

export interface ChipProps {
	/**
	 * The Avatar element to display.
	 */
	avatar?: React.ReactElement;

	/**
	 * If `true`, the chip will appear clickable, and will raise when pressed,
	 * even if the onClick prop is not defined.
	 * If `false`, the chip will not appear clickable, even if onClick prop is defined.
	 * This can be used, for example,
	 * along with the component prop to indicate an anchor Chip is clickable.
	 * Note: this controls the UI and does not affect the onClick event.
	 */
	clickable?: boolean;

	/**
	 * Callback fired when the chip is clicked
	 */
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;

	/**
	 * The color of the component.
	 * @default 'default'
	 */
	color?:
		| "default"
		| "primary"
		| "green"
		| "pink"
		| "purple"
		| "indigo"
		| "turqoise"
		| "lcgreen"
		| "lcpink"
		| "lcpurple"
		| "lcindigo"
		| "lcprimary"
		| "red";

	/**
	 * If `true`, the component is disabled.
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * Icon element.
	 */
	icon?: React.ReactElement;

	/**
	 * The content of the component.
	 */
	label?: React.ReactNode;

	/**
	 * Callback fired when the delete icon is clicked.
	 * If set, the delete icon will be shown.
	 */
	onDelete?: (e: React.MouseEvent<HTMLButtonElement>) => void;

	/**
	 * The size of the component.
	 * @default 'medium'
	 */
	size?: "small" | "medium";

	/**
	 * The system prop that allows defining system overrides as well as additional CSS styles.
	 */
	sx?: SxProps;

	/**
	 * The variant to use.
	 * @default 'filled'
	 */
	variant?: "filled" | "outlined";

	/**
	 * Title to add to the component
	 */
	title?: string;
}

export const Chip = (props: ChipProps) => {
	const {
		color = "default",
		variant = "filled",
		sx = {},
		...otherProps
	} = props;

	return (
		<StyledMuiChip
			sx={sx}
			chipColor={color}
			variant={variant}
			{...otherProps}
		/>
	);
};
