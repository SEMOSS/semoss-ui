import { SxProps } from "@mui/system";
import MuiAccordionDetails, {
    AccordionDetailsProps as MuiAccordionDetailsProps,
} from "@mui/material/AccordionDetails";

export type AccordionDetailsProps = {
    /** custom style object */
    sx?: SxProps;
} & MuiAccordionDetailsProps;

export const AccordionDetails = (props: AccordionDetailsProps) => {
    return <MuiAccordionDetails>{props.children}</MuiAccordionDetails>;
};
