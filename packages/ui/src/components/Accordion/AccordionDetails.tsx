import { SxProps } from "@mui/system";
import MuiAccordionDetails from "@mui/material/AccordionDetails";

export type AccordionDetailsProps = {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /** custom style object */
    sx?: SxProps;
};
export const AccordionDetails = (props: AccordionDetailsProps) => {
    return <MuiAccordionDetails>{props.children}</MuiAccordionDetails>;
};
