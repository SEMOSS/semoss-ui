import { TableFooter as MuiTableFooter, SxProps } from '@mui/material';

export interface TableFooterProps {
    /**
     * The content of the component, normally `TableRow`.
     */
    children?: React.ReactNode;
    /** custom style object */
    sx?: SxProps;
}

export const TableFooter = (props: TableFooterProps) => {
    const { sx } = props;
    return (
        <MuiTableFooter sx={sx} {...props}>
            {props.children}
        </MuiTableFooter>
    );
};
