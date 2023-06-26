import { SxProps } from "@mui/system";
import MuiAccordionSummary from "@mui/material/AccordionSummary";

export type AccordionSummaryProps = {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * The icon to display as the expand indicator.
     */
    expandIcon?: React.ReactNode;

    /** custom style object */
    sx?: SxProps;
};

export const AccordionSummary = (props: AccordionSummaryProps) => {
    return <MuiAccordionSummary>{props.children}</MuiAccordionSummary>;
};
