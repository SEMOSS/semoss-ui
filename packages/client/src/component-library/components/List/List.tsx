import { List as MuiList, SxProps } from '@mui/material';

export interface ListProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * If `true`, compact vertical padding designed for keyboard and mouse input is used for
     * the list and list items.
     * The prop is available to descendant components as the `dense` context.
     * @default false
     */
    dense?: boolean;

    /**
     * If `true`, vertical padding is removed from the list.
     * @default false
     */
    disablePadding?: boolean;

    /**
     * The content of the subheader, normally `ListSubheader`.
     */
    subheader?: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * 	String to use a HTML element for root node
     */
    component?: string;
}

export const List = (props: ListProps) => {
    const { sx } = props;
    return <MuiList sx={sx} {...props} />;
};
