import { ReactNode } from "react";
import MuiLink from "@mui/material/Link";
import { SxProps } from "@mui/system";
import { LinkProps as MuiLinkProps } from "@mui/material";

export interface LinkProps extends MuiLinkProps {
    /** custom style object */
    sx?: SxProps;
}

export const Link = (props: LinkProps) => {
    const { sx } = props;
    return <MuiLink sx={sx} {...props} />;
};
