import { CellComponent } from '@/stores';
import { QueryImportCellDef } from './config';
import { Table, Typography, styled } from '@semoss/ui';
import { useBlocks, useRootStore } from '@/hooks';
import { useEffect, useState } from 'react';
import { getQueryImportPreviewPipeline } from './query-import-pipeline-utils';

const StyledTableContainer = styled(Table.Container)(() => ({
    maxHeight: '200px',
}));

export const QueryImportCellOutput: CellComponent<QueryImportCellDef> = (
    props,
) => {
    const { cell } = props;
    const { state } = useBlocks();
    const { monolithStore } = useRootStore();

    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState([]);

    useEffect(() => {
        if (cell.query.output) {
            monolithStore
                .run(
                    state.insightId,
                    getQueryImportPreviewPipeline(
                        cell.parameters.frameVariableName,
                    ),
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
                    }
                });
        }
    }, [cell.query.output]);

    return (
        <>
            <StyledTableContainer>
                <Table stickyHeader>
                    <Table.Head>
                        <Table.Row>
                            {Array.from(headers, (header) => {
                                return <Table.Cell>{header}</Table.Cell>;
                            })}
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {rows.map((row: Array<any>, index) => (
                            <Table.Row key={index}>
                                {row.map((rowElement) => (
                                    <Table.Cell>{rowElement}</Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </StyledTableContainer>
            <Typography variant="caption">
                This preview is only a subset of your data and may not
                accurately represent the full result.
            </Typography>
        </>
    );
};
