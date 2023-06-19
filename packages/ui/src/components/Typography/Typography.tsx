import MuiTypography from "@mui/material/Typography";
import { SxProps } from "@mui/system";
import { TypographyProps as MuiTypographyProps } from "@mui/material";

export interface TypographyProps extends MuiTypographyProps {
    /** custom style object */
    sx?: SxProps;
}

export const Typography = (props: TypographyProps) => {
    const { sx } = props;
    return <MuiTypography sx={sx} {...props} />;
};
