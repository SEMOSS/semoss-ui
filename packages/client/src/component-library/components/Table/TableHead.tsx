import { ReactNode } from 'react';
import { TableHead as MuiTableHead, SxProps } from '@mui/material';

export interface TableHeadProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const TableHead = (props: TableHeadProps) => {
    const { children, sx } = props;
    return (
        <MuiTableHead sx={sx} {...props}>
            {children}
        </MuiTableHead>
    );
};
