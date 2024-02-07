import { ReactNode } from 'react';
import { TableContainer as MuiTableContainer, SxProps } from '@mui/material';

export interface TableContainerProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const TableContainer = (props: TableContainerProps) => {
    const { children, sx } = props;
    return (
        <MuiTableContainer sx={sx} {...props}>
            {children}
        </MuiTableContainer>
    );
};
