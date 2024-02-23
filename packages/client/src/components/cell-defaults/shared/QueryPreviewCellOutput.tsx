import { observer } from 'mobx-react-lite';
import { LinearProgress, Table, Typography, styled } from '@semoss/ui';
import { useBlocks, useRootStore } from '@/hooks';
import { useEffect, useState } from 'react';
import { getQueryPreviewPipeline, getQueryCountPipeline } from '../shared';

const StyledTableContainer = styled(Table.Container)(() => ({
    height: '200px',
}));

const StyledLoadingTableCell = styled(Table.Cell)(() => ({
    padding: '0!important',
}));

export const QueryPreviewCellOutput = observer(
    (props: {
        cellOutput: any;
        frameVariableName: string;
        targetCellDatabaseId: string;
        targetCellSelectQuery: string;
    }) => {
        const {
            cellOutput,
            frameVariableName,
            targetCellDatabaseId,
            targetCellSelectQuery,
        } = props;
        const { state } = useBlocks();
        const { monolithStore } = useRootStore();

        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [hasError, setHasError] = useState<boolean>(false);
        const [headers, setHeaders] = useState<string[]>([]);
        const [rows, setRows] = useState([]);
        const [count, setCount] = useState<number>(null);

        useEffect(() => {
            if (cellOutput) {
                setIsLoading(true);
                setHasError(false);
                setCount(null);
                monolithStore
                    .run(
                        state.insightId,
                        getQueryPreviewPipeline(frameVariableName),
                    )
                    .then((response) => {
                        if (!response.errors.length) {
                            const output = response.pixelReturn[0]?.output as {
                                data: {
                                    headers: string[];
                                    values: any;
                                };
                            };
                            setHeaders(output.data.headers);
                            setRows(output.data.values);
                        } else {
                            setHasError(true);
                        }
                    })
                    .catch(() => {
                        setHasError(true);
                    });
                monolithStore
                    .run(
                        state.insightId,
                        getQueryCountPipeline(
                            targetCellDatabaseId,
                            targetCellSelectQuery,
                        ),
                    )
                    .then((response) => {
                        if (!response.errors.length) {
                            const output = response.pixelReturn[0]
                                ?.output as number;
                            setCount(output);
                        }
                    });
                setIsLoading(false);
            }
        }, [cellOutput]);

        return (
            <>
                <StyledTableContainer>
                    <Table stickyHeader>
                        <Table.Head>
                            <Table.Row>
                                {Array.from(headers, (header) => {
                                    return (
                                        <Table.Cell key={header}>
                                            {header}
                                        </Table.Cell>
                                    );
                                })}
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {isLoading && (
                                <StyledLoadingTableCell
                                    colSpan={headers.length}
                                >
                                    <LinearProgress variant="indeterminate" />
                                </StyledLoadingTableCell>
                            )}
                            {hasError && (
                                <Table.Cell colSpan={headers.length}>
                                    There was an issue generating a preview.
                                </Table.Cell>
                            )}
                            {rows.map((row: Array<any>, index) => (
                                <Table.Row key={index}>
                                    {row.map((rowElement, rowIndex) => (
                                        <Table.Cell
                                            key={`${index}-${rowIndex}`}
                                        >
                                            {rowElement}
                                        </Table.Cell>
                                    ))}
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </StyledTableContainer>
                <Typography variant="caption">
                    {count && `Showing ${rows.length} of ${count}. `}
                    This preview is only a subset of your data and may not
                    accurately represent the full result.
                </Typography>
            </>
        );
    },
);
