import { Chip as MuiChip, SxProps, styled } from "@mui/material";

const StyledMuiChip = styled(MuiChip, {
    shouldForwardProp: (prop) => prop !== "chipColor",
})<{ chipColor: ChipProps["color"] }>(({ chipColor, theme }) => {
    const palette = theme.palette as unknown as {
        text: Record<string, string>;
        green: Record<string, string>;
        pink: Record<string, string>;
        purple: Record<string, string>;
        darkBlue: Record<string, string>;
        primaryContrast: Record<string, string>;
    };
    return {
        ...(chipColor === "default" && {
            backgroundColor: theme.palette.secondary.selected,
            color: "#212121",
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: theme.palette.text.secondary,
            },
            "& .MuiChip-deleteIcon": {
                color: theme.palette.text.secondary,
            },
            "&&:hover": {
                backgroundColor: theme.palette.secondary.main,
            },
        }),
        ...(chipColor === "primary" && {
            backgroundColor: theme.palette.primary.main,
            color: palette.text.white,
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.text.white,
            },
            "& .MuiChip-deleteIcon": {
                color: palette.text.white,
            },
            "&&:hover": {
                backgroundColor: theme.palette.primary.main,
            },
        }),
        ...(chipColor === "green" && {
            backgroundColor: palette.green["700"],
            color: palette.text.white,
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.text.white,
            },
            "& .MuiChip-deleteIcon": {
                color: palette.text.white,
            },
            "&&:hover": {
                backgroundColor: palette.green["700"],
            },
        }),
        ...(chipColor === "pink" && {
            backgroundColor: palette.pink["700"],
            color: palette.text.white,
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.text.white,
            },
            "& .MuiChip-deleteIcon": {
                color: palette.text.white,
            },
            "&&:hover": {
                backgroundColor: palette.pink["700"],
            },
        }),
        ...(chipColor === "purple" && {
            backgroundColor: palette.purple["500"],
            color: palette.text.white,
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.text.white,
            },
            "& .MuiChip-deleteIcon": {
                color: palette.text.white,
            },
            "&&:hover": {
                backgroundColor: palette.purple["500"],
            },
        }),
        ...(chipColor === "indigo" && {
            backgroundColor: palette.darkBlue["600"],
            color: palette.text.white,
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.text.white,
            },
            "& .MuiChip-deleteIcon": {
                color: palette.text.white,
            },
            "&&:hover": {
                backgroundColor: palette.darkBlue["600"],
            },
        }),
        ...(chipColor === "lcprimary" && {
            backgroundColor: palette.primaryContrast["50"],
            color: "",
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.text.white,
            },
            "& .MuiChip-deleteIcon": {
                color: palette.text.white,
            },
            "&&:hover": {
                backgroundColor: palette.primaryContrast["50"],
            },
        }),
        ...(chipColor === "turqoise" && {
            backgroundColor: palette.green["50"],
            color: palette.green["900"],
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.green["900"],
            },
            "& .MuiChip-deleteIcon": {
                color: palette.green["900"],
            },
            "&&:hover": {
                backgroundColor: palette.green["50"],
            },
        }),
        ...(chipColor === "lcpink" && {
            backgroundColor: palette.pink["50"],
            color: palette.pink["900"],
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.pink["900"],
            },
            "& .MuiChip-deleteIcon": {
                color: palette.pink["900"],
            },
            "&&:hover": {
                backgroundColor: palette.pink["50"],
            },
        }),
        ...(chipColor === "lcpurple" && {
            backgroundColor: palette.purple["50"],
            color: palette.purple["900"],
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.purple["900"],
            },
            "& .MuiChip-deleteIcon": {
                color: palette.purple["900"],
            },
            "&&:hover": {
                backgroundColor: palette.purple["50"],
            },
        }),
        ...(chipColor === "lcindigo" && {
            backgroundColor: palette.darkBlue["50"],
            color: palette.purple["900"],
            borderColor: "",
            ".MuiSvgIcon-root": {
                color: palette.purple["900"],
            },
            "& .MuiChip-deleteIcon": {
                color: palette.purple["900"],
            },
            "&&:hover": {
                backgroundColor: palette.darkBlue["50"],
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
     * DEV note: only the "filled" variant should be used according to design.
     * @default 'filled'
     */
    variant?: "filled";

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
