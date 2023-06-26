import CardHeader from "@mui/material/CardHeader";
import { SxProps } from "@mui/system";

export interface _CardHeaderProps {
    /**
     * The action to display in the card header.
     */
    action?: React.ReactNode;

    /**
     * The Avatar element to display.
     */
    avatar?: React.ReactNode;

    /**
     * The content of the component.
     */
    subheader?: React.ReactNode;

    /**
      * 
    /** custom style object */
    sx?: SxProps;

    /**
     * The content of the component.
     */
    title?: React.ReactNode;
}

export const _CardHeader = (props: _CardHeaderProps) => {
    const { sx } = props;
    return <CardHeader sx={sx} {...props} />;
};
