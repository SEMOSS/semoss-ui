import { useEffect, useState } from 'react';
import { Table, Accordion, Search, styled, LinearProgress } from '@semoss/ui';
import { ChevronRight } from '@mui/icons-material';
import { HistoryRow } from './HistoryRow';
import { HistoryJob } from './jobs.types';

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
}) => {
    const { history, historyLoading } = props;
    const [historySearchValue, setHistorySearchValue] = useState('');

    const [historyExpanded, setHistoryExpanded] = useState(false);

    // pagination for history table
    const [historyPage, setHistoryPage] = useState<number>(0);
    const [historyRowsPerPage, setHistoryRowsPerPage] = useState<number>(5);
    const historyStartIndex = historyPage * historyRowsPerPage;
    const historyEndIndex = historyStartIndex + historyRowsPerPage;

    const filterHistory = (historyJobs: HistoryJob[]) => {
        return historyJobs.filter((job) => {
            return historySearchValue.length > 0
                ? job.jobName
                      .toLowerCase()
                      .includes(historySearchValue.toLowerCase())
                : true;
        });
    };

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
                    onChange={(e) => setHistorySearchValue(e.target.value)}
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
                            {filterHistory(history).length === 0 &&
                            !historyLoading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5}>
                                        No job history, please try again.
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                filterHistory(history)
                                    .slice(historyStartIndex, historyEndIndex)
                                    .map((history, i) => {
                                        return (
                                            <HistoryRow key={i} row={history} />
                                        );
                                    })
                            )}
                        </Table.Body>
                        <Table.Footer>
                            <Table.Row>
                                <Table.Pagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    onPageChange={(e, v) => {
                                        setHistoryPage(v);
                                    }}
                                    page={historyPage}
                                    rowsPerPage={historyRowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setHistoryRowsPerPage(
                                            Number(e.target.value),
                                        );
                                    }}
                                    count={filterHistory(history).length}
                                />
                            </Table.Row>
                        </Table.Footer>
                    </Table>
                </Table.Container>
            </Accordion.Content>
        </StyledAccordion>
    );
};
