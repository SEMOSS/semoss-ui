import { Accordion as MuiAccordion } from "@mui/material/";
import { SxProps } from "@mui/system";

export type AccordionProps = {
    /**
     * The content of the component.
     */
    children: NonNullable<React.ReactNode>;

    /**
     * If `true`, expands the accordion by default.
     * @default false
     */
    defaultExpanded?: boolean;

    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;

    /**
     * If `true`, it removes the margin between two expanded accordion items and the increase of height.
     * @default false
     */
    disableGutters?: boolean;

    /**
     * If `true`, expands the accordion, otherwise collapse it.
     * Setting this prop enables control over the accordion.
     */
    expanded?: boolean;

    /**
     * Callback fired when the expand/collapse state is changed.
     *
     * @param {React.SyntheticEvent} event The event source of the callback. **Warning**: This is a generic event not a change event.
     * @param {boolean} expanded The `expanded` state of the accordion.
     */
    onChange?: (event: React.SyntheticEvent, expanded: boolean) => void;
    /** custom style object */
    sx?: SxProps;
};

export const Accordion = (props: AccordionProps) => {
    return <MuiAccordion {...props}>{props.children}</MuiAccordion>;
};
