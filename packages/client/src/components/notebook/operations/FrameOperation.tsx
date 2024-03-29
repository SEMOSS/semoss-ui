import { observer } from 'mobx-react-lite';
import { LinearProgress, Table, Typography, styled } from '@semoss/ui';

import { useBlocksPixel } from '@/hooks/useBlocksPixel';

const StyledTableContainer = styled(Table.Container)(() => ({
    height: '200px',
}));

const StyledLoadingTableCell = styled(Table.Cell)(() => ({
    padding: '0!important',
}));

export interface FrameOperationProps {
    /** Output returned that can render a preview of the frame */
    output: {
        /** Name of the frame  */
        name: string;

        /** Type of the frame */
        type: 'NATIVE' | 'PY' | 'GRID' | 'R';
    };
}

export const FrameOperation = observer((props: FrameOperationProps) => {
    const { output } = props;

    // get the data from the frame
    const getData = useBlocksPixel<{
        data: {
            values: (string | number | boolean)[][];
            headers: string[];
        };
    }>(`Frame(frame=[${output.name}] )|QueryAll()|Limit(20)|CollectAll();`);

    // get the count of data in the frame
    const getCount = useBlocksPixel<number>(
        `Frame(frame=[${output.name}] )|QueryAll()|QueryRowCount();`,
    );

    // get the statuses
    const isLoading =
        getData.status === 'LOADING' || getCount.status === 'LOADING';
    const isError = getData.status === 'ERROR' || getCount.status === 'ERROR';
    const isSuccess =
        getData.status === 'SUCCESS' && getCount.status === 'SUCCESS';

    return (
        <>
            <StyledTableContainer>
                <Table stickyHeader>
                    <Table.Head>
                        <Table.Row>
                            {getData.status === 'SUCCESS' &&
                                getData.data.data.headers.map((h, hIdx) => (
                                    <Table.Cell key={hIdx}>{h}</Table.Cell>
                                ))}
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {isLoading && (
                            <StyledLoadingTableCell>
                                <LinearProgress variant="indeterminate" />
                            </StyledLoadingTableCell>
                        )}
                        {isError && (
                            <Table.Cell>
                                There was an issue generating a preview.
                            </Table.Cell>
                        )}
                        {getData.status === 'SUCCESS' &&
                            getData.data.data.values.map((r, rIdx) => (
                                <Table.Row key={rIdx}>
                                    {r.map((v, vIdx) => (
                                        <Table.Cell key={`${rIdx}-${vIdx}`}>
                                            {v}
                                        </Table.Cell>
                                    ))}
                                </Table.Row>
                            ))}
                    </Table.Body>
                </Table>
            </StyledTableContainer>
            <Typography variant="caption">
                {isSuccess &&
                    `Showing ${getData.data.data.values.length} of ${getCount.data}. This is a preview of ingested data`}
            </Typography>
        </>
    );
});
