import {
    AccordionSummary as MuiAccordionSummary,
    SxProps,
} from "@mui/material";

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
    const { children, ...otherProps } = props;

    return (
        <MuiAccordionSummary {...otherProps}>{children}</MuiAccordionSummary>
    );
};
