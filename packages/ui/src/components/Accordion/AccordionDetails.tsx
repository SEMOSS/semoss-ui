import {
    AccordionDetails as MuiAccordionDetails,
    SxProps,
} from "@mui/material";

export type AccordionDetailsProps = {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /** custom style object */
    sx?: SxProps;
};
export const AccordionDetails = (props: AccordionDetailsProps) => {
    const { children, ...otherProps } = props;

    return (
        <MuiAccordionDetails {...otherProps}>{children}</MuiAccordionDetails>
    );
};
