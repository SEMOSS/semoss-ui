import { useEffect, useState } from 'react';
import { Table, Accordion, Search, styled, LinearProgress } from '@semoss/ui';
import { ChevronRight } from '@mui/icons-material';
import { HistoryRow } from './HistoryRow';
import { HistoryJob } from './job.types';

const StyledAccordion = styled(Accordion)(() => ({
    '&:before': {
        display: 'none',
    },
}));
const StyledAccordionTrigger = styled(Accordion.Trigger)(() => ({
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)',
    },
}));
const LoadingTableCell = styled(Table.Cell)(() => ({
    padding: 0,
}));

/**
 * TODO: this component is mostly just ported over from the old version - it's functional but pretty crusty
 * Would be good to clean this file up and make it more readable in the future
 */
export const JobHistory = (props: {
    history: HistoryJob[];
    historyLoading: boolean;
    historyCount: number;
    historyPage: number;
    historyRowsPerPage: number;
    onPageChange?: (page: number) => void;
    onRowsPerPageChange?: (rowsPerPage: number) => void;
    onSearchChange?: (search: string) => void;
}) => {
    const {
        history,
        historyLoading,
        historyCount,
        historyPage,
        historyRowsPerPage,
        onPageChange,
        onRowsPerPageChange,
        onSearchChange,
    } = props;

    const [historyExpanded, setHistoryExpanded] = useState(false);

    return (
        <StyledAccordion
            expanded={historyExpanded}
            onChange={(e) => {
                setHistoryExpanded(!historyExpanded);
            }}
        >
            <StyledAccordionTrigger expandIcon={<ChevronRight />}>
                History
            </StyledAccordionTrigger>
            <Accordion.Content>
                <Search
                    fullWidth
                    size="small"
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                <Table.Container>
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Cell></Table.Cell>
                                <Table.Cell>Name</Table.Cell>
                                <Table.Cell>Run Date</Table.Cell>
                                <Table.Cell>Time</Table.Cell>
                                <Table.Cell>Status</Table.Cell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {historyLoading && (
                                <Table.Row>
                                    <LoadingTableCell colSpan={5}>
                                        <LinearProgress variant="indeterminate" />
                                    </LoadingTableCell>
                                </Table.Row>
                            )}
                            {history.length === 0 && !historyLoading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5}>
                                        No job history, please try again.
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                history.map((history, i) => {
                                    return <HistoryRow key={i} row={history} />;
                                })
                            )}
                        </Table.Body>
                        <Table.Footer>
                            <Table.Row>
                                <Table.Pagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    onPageChange={(e, v) => {
                                        onPageChange(v);
                                    }}
                                    page={historyPage}
                                    rowsPerPage={historyRowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        onRowsPerPageChange(
                                            Number(e.target.value),
                                        );
                                    }}
                                    count={historyCount}
                                />
                            </Table.Row>
                        </Table.Footer>
                    </Table>
                </Table.Container>
            </Accordion.Content>
        </StyledAccordion>
    );
};
