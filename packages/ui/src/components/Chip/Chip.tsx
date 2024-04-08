import { Chip as MuiChip, SxProps, styled } from "@mui/material";

const StyledMuiChip = styled(MuiChip, {
    shouldForwardProp: (prop) => prop !== "chipColor",
})<{ chipColor: ChipProps["color"]; variant: ChipProps["variant"] }>(
    ({ chipColor, variant, theme }) => ({
        ...(chipColor === "default" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.secondary.main
                    : theme.palette.text.white,
            color: theme.palette.text.secondary,
            borderColor:
                variant === "outlined" ? theme.palette.secondary.main : "",
            "& .MuiChip-deleteIcon": {
                color: theme.palette.text.secondary,
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.secondary.main
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "primary" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.primary.main
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.primary.main
                    : theme.palette.text.white,
            borderColor:
                variant === "outlined" ? theme.palette.primary.main : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.primary.main
                        : theme.palette.text.white,
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.primary.main
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "green" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.green["700"]
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.green["700"]
                    : theme.palette.text.white,
            borderColor:
                variant === "outlined" ? theme.palette.green["700"] : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.green["700"]
                        : theme.palette.text.white,
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.green["700"]
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "pink" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.pink["700"]
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.pink["700"]
                    : theme.palette.text.white,
            borderColor:
                variant === "outlined" ? theme.palette.pink["700"] : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.pink["700"]
                        : theme.palette.text.white,
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.pink["700"]
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "purple" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.purple["500"]
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.purple["500"]
                    : theme.palette.text.white,
            borderColor:
                variant === "outlined" ? theme.palette.purple["500"] : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.purple["500"]
                        : theme.palette.text.white,
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.purple["500"]
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "indigo" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.darkBlue["600"]
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.darkBlue["600"]
                    : theme.palette.text.white,
            borderColor:
                variant === "outlined" ? theme.palette.darkBlue["600"] : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.darkBlue["600"]
                        : theme.palette.text.white,
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.darkBlue["600"]
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "lcprimary" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.primaryContrast["50"]
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.primaryContrast["700"]
                    : "",
            borderColor:
                variant === "outlined"
                    ? theme.palette.primaryContrast["500"]
                    : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.primaryContrast["700"]
                        : theme.palette.text.white,
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.primaryContrast["50"]
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "turqoise" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.green["50"]
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.green["700"]
                    : theme.palette.green["900"],
            borderColor:
                variant === "outlined" ? theme.palette.green["50"] : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.green["700"]
                        : theme.palette.green["900"],
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.green["50"]
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "lcpink" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.pink["50"]
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.pink["700"]
                    : theme.palette.pink["900"],
            borderColor: variant === "outlined" ? theme.palette.pink["50"] : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.pink["700"]
                        : theme.palette.pink["900"],
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.pink["50"]
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "lcpurple" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.purple["50"]
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.purple["500"]
                    : theme.palette.purple["900"],
            borderColor:
                variant === "outlined" ? theme.palette.purple["50"] : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.purple["500"]
                        : theme.palette.purple["900"],
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.purple["50"]
                        : theme.palette.text.white,
            },
        }),

        ...(chipColor === "lcindigo" && {
            backgroundColor:
                variant !== "outlined"
                    ? theme.palette.darkBlue["50"]
                    : theme.palette.text.white,
            color:
                variant === "outlined"
                    ? theme.palette.darkBlue["900"]
                    : theme.palette.purple["900"],
            borderColor:
                variant === "outlined" ? theme.palette.darkBlue["50"] : "",
            "& .MuiChip-deleteIcon": {
                color:
                    variant === "outlined"
                        ? theme.palette.darkBlue["900"]
                        : theme.palette.purple["900"],
            },
            "&&:hover": {
                backgroundColor:
                    variant !== "outlined"
                        ? theme.palette.darkBlue["50"]
                        : theme.palette.text.white,
            },
        }),
    }),
);

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
        | "lcprimary";

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
