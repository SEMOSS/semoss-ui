import MuiChip from "@mui/material/Chip";
import { SxProps } from "@mui/system";

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
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'default'
     */
    color?:
        | "default"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";

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
    onDelete?: React.EventHandler<any>;

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
}

export const Chip = (props: ChipProps) => {
    const { sx } = props;
    return <MuiChip sx={sx} {...props} />;
};
