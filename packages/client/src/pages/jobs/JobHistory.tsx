import { useEffect, useState } from 'react';
import {
    Button,
    Table,
    Accordion,
    Search,
    useNotification,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import {
    convertDeltaToRuntimeString,
    convertTimetoDate,
} from './JobsFunctions';
import {
    ArrowDownward,
    KeyboardArrowDown,
    KeyboardArrowUp,
} from '@mui/icons-material';
import { HistoryRow } from './HistoryRow';

interface HistoryJob {
    jobId: string;
    jobName: string;
    jobGroup: string;
    execStart: string;
    execEnd: string;
    execDelta: string;
    success: boolean;
    jobTags: string[];
    isLatest: boolean;
    schedulerOutput: string;
}

export const JobHistory = () => {
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [historySearchValue, setHistorySearchValue] = useState('');

    const [history, setHistory] = useState<HistoryJob[]>([]);

    const [historyExpanded, setHistoryExpanded] = useState(false);

    // pagination for history table
    const [historyPage, setHistoryPage] = useState<number>(0);
    const [historyRowsPerPage, setHistoryRowsPerPage] = useState<number>(5);
    const historyStartIndex = historyPage * historyRowsPerPage;
    const historyEndIndex = historyStartIndex + historyRowsPerPage;

    const getHistory = () => {
        let pixel = 'META|SchedulerHistory()';
        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType[0];
            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message:
                        'Something went wrong. Job history could not be retrieved.',
                });
            } else {
                // TODO: why in the world was this set up this way
                // map the headers
                const historyData: HistoryJob[] = [];
                const output = response.pixelReturn[0].output;
                const headers = {};
                //let uniqueJobNames = []; // list of job names
                for (
                    let headerIdx = 0,
                        headerLen = output['data'].headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    headers[output['data'].headers[headerIdx]] = headerIdx;
                }

                for (
                    let valueIdx = 0, valueLen = output['data'].values.length;
                    valueIdx < valueLen;
                    valueIdx++
                ) {
                    // Excluding the jobs that have not ran even once from history
                    if (
                        output['data'].values[valueIdx][headers['SUCCESS']] !==
                        null
                    ) {
                        const job = {
                            jobId: Object.prototype.hasOwnProperty.call(
                                headers,
                                'JOB_ID',
                            )
                                ? output['data'].values[valueIdx][
                                      headers['JOB_ID']
                                  ]
                                : '',
                            jobName: Object.prototype.hasOwnProperty.call(
                                headers,
                                'JOB_NAME',
                            )
                                ? output['data'].values[valueIdx][
                                      headers['JOB_NAME']
                                  ]
                                : '',
                            jobGroup: Object.prototype.hasOwnProperty.call(
                                headers,
                                'JOB_GROUP',
                            )
                                ? output['data'].values[valueIdx][
                                      headers['JOB_GROUP']
                                  ]
                                : '',
                            execStart:
                                Object.prototype.hasOwnProperty.call(
                                    headers,
                                    'EXECUTION_START',
                                ) &&
                                output['data'].values[valueIdx][
                                    headers['EXECUTION_START']
                                ]
                                    ? convertTimetoDate(
                                          output['data'].values[valueIdx][
                                              headers['EXECUTION_START']
                                          ],
                                      )
                                    : '',
                            execEnd: Object.prototype.hasOwnProperty.call(
                                headers,
                                'EXECUTION_END',
                            )
                                ? output['data'].values[valueIdx][
                                      headers['EXECUTION_END']
                                  ]
                                : '',
                            execDelta: Object.prototype.hasOwnProperty.call(
                                headers,
                                'EXECUTION_DELTA',
                            )
                                ? convertDeltaToRuntimeString(
                                      output['data'].values[valueIdx][
                                          headers['EXECUTION_DELTA']
                                      ],
                                  )
                                : '',
                            // TODO: validate return type/value
                            success: Object.prototype.hasOwnProperty.call(
                                headers,
                                'SUCCESS',
                            ) ?
                                output['data'].values[valueIdx][headers['SUCCESS']] == 'true' ||
                                output['data'].values[valueIdx][headers['SUCCESS']] == 'True' ||
                                output['data'].values[valueIdx][headers['SUCCESS']] == true :
                                false,
                            // appName: Object.prototype.hasOwnProperty.call(headers, 'APP_NAME') ? output['data'].values[valueIdx][headers.APP_NAME] : '',
                            jobTags: Object.prototype.hasOwnProperty.call(
                                headers,
                                'JOB_TAG',
                            )
                                ? output['data'].values[valueIdx][headers['JOB_TAG']].split(',')
                                : [],
                            // capture the latest record based on the IS_LATEST field stored
                            isLatest: Object.prototype.hasOwnProperty.call(
                                headers,
                                'IS_LATEST',
                            )
                                ? output['data'].values[valueIdx][
                                      headers['IS_LATEST']
                                  ]
                                : false,
                            //capture scheduler output
                            schedulerOutput:
                                Object.prototype.hasOwnProperty.call(
                                    headers,
                                    'SCHEDULER_OUTPUT',
                                )
                                    ? output['data'].values[valueIdx][
                                          headers['SCHEDULER_OUTPUT']
                                      ]
                                    : 'No Output.',
                        };

                        historyData.push(job);
                    }
                }
                setHistory(historyData);
            }
        });
    };

    const filterHistory = (historyJobs: HistoryJob[]) => {
        return historyJobs.filter((job) => {
            return historySearchValue.length > 0
                ? job.jobName
                      .toLowerCase()
                      .includes(historySearchValue.toLowerCase())
                : true;
        });
    };

    useEffect(() => {
        getHistory();
    }, []);

    return (
        <Accordion
            expanded={historyExpanded}
            onChange={(e) => {
                setHistoryExpanded(!historyExpanded);
            }}
            square={true}
        >
            <Accordion.Trigger>
                <div>History</div>
                {historyExpanded ? (
                    <KeyboardArrowUp />
                ) : (
                    <KeyboardArrowDown />
                )}
            </Accordion.Trigger>
            <Accordion.Content>
                <Search
                    fullWidth
                    size="small"
                    onChange={(e) => setHistorySearchValue(e.target.value)}
                />
                <Table.Container>
                    <Table aria-label="collapsible table">
                        <Table.Head>
                            <Table.Row>
                                <Table.Cell></Table.Cell>
                                <Table.Cell></Table.Cell>
                                <Table.Cell>Name</Table.Cell>
                                <Table.Cell>
                                    <Button
                                        color="inherit"
                                        variant="text"
                                        endIcon={<ArrowDownward />}
                                    >
                                        Run Date
                                    </Button>
                                </Table.Cell>
                                <Table.Cell>Time</Table.Cell>
                                <Table.Cell>Status</Table.Cell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {filterHistory(history).length === 0 ? (
                                <Table.Row>
                                    <Table.Cell
                                    // style={{ columnSpan: 'all' }}
                                    >
                                        <span>
                                            No job history, please try
                                            again.
                                        </span>
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                filterHistory(history)
                                    .slice(
                                        historyStartIndex,
                                        historyEndIndex,
                                    )
                                    .map((history, i) => {
                                        return (
                                            <HistoryRow
                                                key={i}
                                                row={history}
                                            />
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
        </Accordion>
    );
}
