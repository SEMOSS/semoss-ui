import { Chip as MuiChip, SxProps } from "@mui/material";

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

    // /**
    //  * The color of the component.
    //  * It supports both default and custom theme colors, which can be added as shown in the
    //  * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
    //  * @default 'default'
    //  */
    // color?: "green";

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

    variantColor?:
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
}

export const Chip = (props: ChipProps) => {
    const { variantColor = "default", variant = "filled" } = props;

    const styledChips = {
        default: {
            backgroundColor: variant !== "outlined" ? "rgba(0, 0, 0, 0.2)" : "",
            color: "rgba(0, 0, 0, 0.8)",
            borderColor: variant === "outlined" ? "rgba(0, 0, 0, 0.2)" : "",
            "& .MuiChip-deleteIcon": {
                color: "#000",
                opacity: 0.5,
            },
        },
        primary: {
            backgroundColor: variant !== "outlined" ? "#0471F0" : "",
            color: variant === "outlined" ? "#0471F0" : "#fff",
            borderColor: variant === "outlined" ? "#0471F0" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#0471F0" : "#fff",
            },
        },
        green: {
            backgroundColor: variant !== "outlined" ? "#008674" : "",
            color: variant === "outlined" ? "#008674" : "#fff",
            borderColor: variant === "outlined" ? "#008674" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#008674" : "#fff",
            },
        },
        pink: {
            backgroundColor: variant !== "outlined" ? "#D62C71" : "",
            color: variant === "outlined" ? "#D62C71" : "#fff",
            borderColor: variant === "outlined" ? "#D62C71" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#D62C71" : "#fff",
            },
        },
        purple: {
            backgroundColor: variant !== "outlined" ? "#8340DE" : "",
            color: variant === "outlined" ? "#8340DE" : "#fff",
            borderColor: variant === "outlined" ? "#8340DE" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#8340DE" : "#fff",
            },
        },
        indigo: {
            backgroundColor: variant !== "outlined" ? "#471F96" : "",
            color: variant === "outlined" ? "#471F96" : "#fff",
            borderColor: variant === "outlined" ? "#471F96" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#471F96" : "#fff",
            },
        },
        lcprimary: {
            backgroundColor: variant !== "outlined" ? "#E2F2FF" : "",
            color: variant === "outlined" ? "#0471F0" : "",
            borderColor: variant === "outlined" ? "#40A0FF" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#0471F0" : "#1C3FBE",
                opacity: 0.5,
            },
        },
        turqoise: {
            backgroundColor: variant !== "outlined" ? "#DEF4F3" : "",
            color: variant === "outlined" ? "#008674" : "#005946",
            borderColor: variant === "outlined" ? "#DEF4F3" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#008674" : "#005946",
                opacity: 0.5,
            },
        },
        lcpink: {
            backgroundColor: variant !== "outlined" ? "#FFE6F0" : "",
            color: variant === "outlined" ? "#D62C71" : "#992263",
            borderColor: variant === "outlined" ? "#FFE6F0" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#D62C71" : "#992263",
                opacity: 0.5,
            },
        },
        lcpurple: {
            backgroundColor: variant !== "outlined" ? "#F1E9FB" : "",
            color: variant === "outlined" ? "#8340DE" : "#481EB8",
            borderColor: variant === "outlined" ? "#F1E9FB" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#8340DE" : "#5D2BC7",
                opacity: 0.5,
            },
        },
        lcindigo: {
            backgroundColor: variant !== "outlined" ? "#EAE4F2" : "",
            color: variant === "outlined" ? "#150578" : "#481EB8",
            borderColor: variant === "outlined" ? "#EAE4F2" : "",
            "& .MuiChip-deleteIcon": {
                color: variant === "outlined" ? "#150578" : "#150578",
                opacity: 0.5,
            },
        },
    };

    return <MuiChip {...props} sx={styledChips[variantColor]} />;
};
