import { CSSProperties, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';

export interface TableBlockDef extends BlockDef<'table'> {
    widget: 'table';
    data: {
        style: CSSProperties;
        content: Array<object> | string;
        headers: Array<{ display: string; value: string }>;
    };
}

export const TableBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<TableBlockDef>(id);

    const content = useMemo(() => {
        if (!data?.content) {
            return [];
        }

        if (typeof data?.content === 'string') {
            // try to parse as an array, if not return empty array
            try {
                if (Array.isArray(JSON.parse(data.content))) {
                    return JSON.parse(data.content);
                }
            } catch (e) {
                return [];
            }
        }

        return data.content;
    }, [data?.content]);

    const headerDisplay = useMemo(() => {
        if (!data?.headers || data?.headers?.length === 0) {
            return content?.length ? Object.keys(content[0]) : [];
        }

        return data.headers.map((header) => header.display);
    }, [data?.headers]);

    const headerValues = useMemo(() => {
        if (!data?.headers || data?.headers?.length === 0) {
            return content?.length ? Object.keys(content[0]) : [];
        }

        return data.headers.map((header) => header.value);
    }, [data?.headers]);

    return (
        <div
            style={{ maxWidth: '1200px', overflow: 'scroll', ...data.style }}
            {...attrs}
        >
            <Table
                sx={{
                    display: 'table',
                }}
            >
                <TableHead>
                    <TableRow>
                        {Array.from(headerDisplay, (header) => {
                            return (
                                <TableCell
                                    sx={{ textTransform: 'capitalize' }}
                                    key={header}
                                >
                                    {header.replaceAll('_', ' ')}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.from(content, (row, i) => {
                        return (
                            <TableRow key={i}>
                                {Array.from(headerValues, (headerValue, j) => {
                                    return (
                                        <TableCell key={`${i}-${j}`}>
                                            {row[headerValue] ?? ''}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
});
