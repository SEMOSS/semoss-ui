import { SxProps } from "@mui/system";
import MuiAccordionSummary, {
    AccordionSummaryProps as MuiAccordionSummaryProps,
} from "@mui/material/AccordionSummary";

export type AccordionSummaryProps = {
    /** custom style object */
    sx?: SxProps;
} & MuiAccordionSummaryProps;

export const AccordionSummary = (props: AccordionSummaryProps) => {
    return <MuiAccordionSummary>{props.children}</MuiAccordionSummary>;
};
