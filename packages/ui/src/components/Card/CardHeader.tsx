import {
    CardHeader,
    TypographyProps,
    TitleTypographyComponent,
} from "@mui/material";
import { SxProps } from "@mui/system";
import { styled } from "../../";

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

    /**
     * These props will be forwarded to the title
     * (as long as disableTypography is not `true`).
     */
    titleTypographyProps?: TypographyProps<
        TitleTypographyComponent,
        { component?: TitleTypographyComponent }
    >;
}

export const _CardHeader = (props: _CardHeaderProps) => {
    const { sx } = props;
    return (
        <CardHeader
            sx={sx}
            subheaderTypographyProps={{ variant: "caption" }}
            titleTypographyProps={{ variant: "body1" }}
            {...props}
        />
    );
};
