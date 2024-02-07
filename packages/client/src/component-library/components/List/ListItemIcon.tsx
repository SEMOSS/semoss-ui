import { ListItemIcon as MuiListItemIcon, SxProps } from '@mui/material';

export interface ListItemIconProps {
    /**
     * The content of the component, normally `Icon`, `SvgIcon`,
     * or a `@mui/icons-material` SVG icon element.
     */
    children?: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}
export const ListItemIcon = (props: ListItemIconProps) => {
    const { sx } = props;
    return <MuiListItemIcon sx={sx} {...props} />;
};
