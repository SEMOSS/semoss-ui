import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';

export interface TableBlockDef extends BlockDef<'table'> {
    widget: 'table';
    data: {
        style: CSSProperties;
        rows: Array<object>;
    };
}

export const TableBlock: BlockComponent = observer(({ id }) => {
    const { data } = useBlock<TableBlockDef>(id);

    return (
        <TableContainer component={'div'} sx={{ maxWidth: '100%' }}>
            <Table
                sx={{
                    ...data.style,
                }}
            >
                <TableHead>
                    <TableRow>
                        {Array.from(
                            data?.rows?.length ? Object.keys(data.rows[0]) : [],
                            (header) => {
                                return (
                                    <TableCell key={header}>{header}</TableCell>
                                );
                            },
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.from(data?.rows ?? [], (row, i) => {
                        return (
                            <TableRow key={i}>
                                {Array.from(
                                    Object.values(row),
                                    (rowValue, j) => {
                                        return (
                                            <TableCell key={`${i}-${j}`}>
                                                {rowValue}
                                            </TableCell>
                                        );
                                    },
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
});
