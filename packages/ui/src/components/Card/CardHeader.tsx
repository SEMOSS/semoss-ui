import CardHeader from "@mui/material/CardHeader";
import { SxProps } from "@mui/system";
import { CardHeaderProps } from "@mui/material";

export interface _CardHeaderProps extends CardHeaderProps {
    /** custom style object */
    sx?: SxProps;
}

export const _CardHeader = (props: _CardHeaderProps) => {
    const { sx } = props;
    return <CardHeader sx={sx} {...props} />;
};
