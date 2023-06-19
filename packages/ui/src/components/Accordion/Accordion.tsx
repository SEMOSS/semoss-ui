import MuiAccordion, {
    AccordionProps as MuiAccordionProps,
} from "@mui/material/Accordion";
import { SxProps } from "@mui/system";

export type AccordionProps = {
    /** custom style object */
    sx?: SxProps;
} & MuiAccordionProps;

export const Accordion = (props: AccordionProps) => {
    return <MuiAccordion {...props}>{props.children}</MuiAccordion>;
};
