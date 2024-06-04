import { useEffect, useMemo, useState } from 'react';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import {
    Add,
    Bedtime,
    ErrorRounded,
    NotStartedOutlined,
    Pause,
} from '@mui/icons-material';
import { Button, Tabs, Search, useNotification, Stack } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { AvTimer } from '@mui/icons-material';
import { JobCard } from './JobCard';
import { JobHistory } from './JobHistory';
import { HistoryJob, Job, JobBuilder, PixelReturnJob } from './job.types';
import { convertDeltaToRuntimeString, convertTimetoDate } from './job.utils';
import { JobsTable } from './JobsTable';
import { runPixel } from '@/api';
import { JobBuilderModal } from './JobBuilderModal';
import { DeleteJobModal } from './DeleteJobModal';

export function JobsPage() {
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const tabs = ['All', 'Active', 'Inactive'];

    const [searchValue, setSearchValue] = useState('');
    const [selectedTab, setSelectedTab] = useState(tabs[0]);

    const [failedJobCount, setFailedJobCount] = useState<number>(0);

    const [initalBuilderState, setInitialBuilderState] =
        useState<JobBuilder>(null);

    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobsLoading, setJobsLoading] = useState<boolean>(false);

    const [jobToDelete, setJobToDelete] = useState<Job>(null);

    const [rowSelectionModel, setRowSelectionModel] =
        useState<GridRowSelectionModel>([]);

    const [history, setHistory] = useState<HistoryJob[]>([]);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);

    const getJobs = () => {
        setJobsLoading(true);
        const pixel = 'META|ListAllJobs()';
        monolithStore
            .runQuery<[Record<string, PixelReturnJob>]>(pixel)
            .then((response) => {
                const type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message:
                            'Something went wrong. Jobs could not be retrieved.',
                    });
                } else {
                    const pixelJobs: Record<string, PixelReturnJob> =
                        response.pixelReturn[0].output;
                    const jobs: Job[] = Object.values(pixelJobs).map((job) => {
                        return {
                            id: job.jobId,
                            name: job.jobName,
                            type: 'Custom',
                            cronExpression: job.cronExpression,
                            timeZone: job.cronTz,
                            tags: (job?.jobTags ?? '')
                                .split(',')
                                .filter((tag) => !!tag),
                            lastRun: job.PREV_FIRE_TIME,
                            nextRun: job.NEXT_FIRE_TIME,
                            ownerId: job.USER_ID,
                            isActive: job.NEXT_FIRE_TIME !== 'INACTIVE',
                            group: job.jobGroup,
                            pixel: job.recipe,
                        };
                    });

                    setJobs(jobs);
                }
            })
            .finally(() => {
                setJobsLoading(false);
            });
    };

    const deleteJob = (jobId: string, jobGroup: string) => {
        let pixel = 'META | RemoveJobFromDB(';
        pixel += 'jobId=["' + jobId + '"], ';
        pixel += 'jobGroup=["' + jobGroup + '"]) ';
        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;
            if (type.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: `Successfully deleted ${type}`,
                });
                setJobToDelete(null);
                getJobs();
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }
        });
    };

    const pauseJobs = async () => {
        let pixel = ``;
        selectedPausedJobs.forEach((job) => {
            pixel += `PauseJobTrigger(jobId=["${job.id}"], jobGroup=["${job.group}"]);`;
        });
        try {
            await runPixel(pixel);
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to paused jobs.',
            });
        } finally {
            getJobs();
        }
    };

    const getHistory = () => {
        setHistoryLoading(true);
        const pixel = 'META|SchedulerHistory()';
        monolithStore
            .runQuery<
                [
                    {
                        data: {
                            values: string[][];
                            headers: string[];
                        };
                    },
                ]
            >(pixel)
            .then((response) => {
                const type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message:
                            'Something went wrong. Job history could not be retrieved.',
                    });
                } else {
                    // map the headers
                    const historyData: HistoryJob[] = [];
                    const output = response.pixelReturn[0].output;
                    const headers = {};
                    for (
                        let headerIdx = 0,
                            headerLen = output['data'].headers.length;
                        headerIdx < headerLen;
                        headerIdx++
                    ) {
                        headers[output['data'].headers[headerIdx]] = headerIdx;
                    }

                    for (
                        let valueIdx = 0,
                            valueLen = output['data'].values.length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        // Excluding the jobs that have not ran even once from history
                        if (
                            output['data'].values[valueIdx][
                                headers['SUCCESS']
                            ] !== null
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
                                )
                                    ? JSON.stringify(
                                          output['data'].values[valueIdx][
                                              headers['SUCCESS']
                                          ],
                                      ) == 'true'
                                    : false,
                                // appName: Object.prototype.hasOwnProperty.call(headers, 'APP_NAME') ? output['data'].values[valueIdx][headers.APP_NAME] : '',
                                jobTags: Object.prototype.hasOwnProperty.call(
                                    headers,
                                    'JOB_TAG',
                                )
                                    ? output['data'].values[valueIdx][
                                          headers['JOB_TAG']
                                      ].split(',')
                                    : [],
                                // capture the latest record based on the IS_LATEST field stored
                                isLatest: Object.prototype.hasOwnProperty.call(
                                    headers,
                                    'IS_LATEST',
                                )
                                    ? JSON.stringify(
                                          output['data'].values[valueIdx][
                                              headers['IS_LATEST']
                                          ],
                                      ) == 'true'
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
                    setFailedJobCount(
                        historyData.filter((job) => !job.success).length,
                    );
                    setHistory(historyData);
                }
            });
        setHistoryLoading(false);
    };

    const filteredJobs = useMemo(() => {
        const searchJobs = jobs.filter((job) => job.name.includes(searchValue));
        if (selectedTab === 'Active') {
            return searchJobs.filter((job) => job.isActive);
        } else if (selectedTab === 'Inactive') {
            return searchJobs.filter((job) => !job.isActive);
        }
        return searchJobs;
    }, [jobs, searchValue, selectedTab]);

    const selectedPausedJobs = useMemo(() => {
        return jobs.filter((job) => {
            return !job.isActive && rowSelectionModel.includes(job.id);
        });
    }, [rowSelectionModel]);

    const selectedActiveJobs = useMemo(() => {
        return jobs.filter((job) => {
            return job.isActive && rowSelectionModel.includes(job.id);
        });
    }, [rowSelectionModel]);

    useEffect(() => {
        // initial render to get all jobs/history
        getJobs();
        getHistory();
    }, []);

    return (
        <Stack spacing={2}>
            <Stack direction="row" spacing={3}>
                <JobCard
                    title="Active Jobs"
                    icon={<AvTimer fontSize="medium" />}
                    count={
                        jobs.filter((job) => {
                            return job.isActive;
                        }).length
                    }
                    avatarColor="#E2F2FF"
                    iconColor="#0471F0"
                />
                <JobCard
                    title="Inactive Jobs"
                    icon={<Bedtime fontSize="medium" />}
                    count={
                        jobs.filter((job) => {
                            return !job.isActive;
                        }).length
                    }
                    avatarColor="#F1E9FB"
                    iconColor="#8340DE"
                />
                <JobCard
                    title="Failed Jobs"
                    icon={<ErrorRounded fontSize="medium" />}
                    count={failedJobCount}
                    avatarColor="#DEF4F3"
                    iconColor="#00A593"
                />
            </Stack>
            <Stack direction="row" width="100%" justifyContent="space-between">
                <Tabs
                    value={selectedTab}
                    onChange={(_, value: string) => {
                        setSelectedTab(value);
                    }}
                    color="primary"
                >
                    <Tabs.Item value="All" label="All" />
                    <Tabs.Item value="Active" label="Active" />
                    <Tabs.Item value="Inactive" label="Inactive" />
                </Tabs>
                <Stack direction="row" spacing={2}>
                    <Search
                        size="small"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                    <span>
                        <Button
                            disabled={selectedActiveJobs.length === 0}
                            variant="outlined"
                            startIcon={<Pause />}
                            size="medium"
                            onClick={() => pauseJobs()}
                        >
                            Pause
                        </Button>
                    </span>
                    <span>
                        <Button
                            disabled={selectedPausedJobs.length === 0}
                            variant="outlined"
                            startIcon={<NotStartedOutlined />}
                            size="medium"
                        >
                            Resume
                        </Button>
                    </span>
                    <span>
                        <Button
                            size="medium"
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() =>
                                setInitialBuilderState({
                                    id: null,
                                    name: '',
                                    pixel: '',
                                    tags: [],
                                    cronExpression: '0 0 12 * * *',
                                    cronTz: 'Eastern Standard Time',
                                })
                            }
                        >
                            Add
                        </Button>
                    </span>
                </Stack>
            </Stack>
            <JobsTable
                jobs={filteredJobs}
                jobsLoading={jobsLoading}
                rowSelectionModel={rowSelectionModel}
                setRowSelectionModel={setRowSelectionModel}
                getHistory={getHistory}
                setInitialBuilderState={setInitialBuilderState}
                showDeleteJobModal={(job: Job) => setJobToDelete(job)}
            />
            <JobHistory history={history} historyLoading={historyLoading} />
            <DeleteJobModal
                job={jobToDelete}
                isOpen={jobToDelete !== null}
                close={() => setJobToDelete(null)}
                deleteJob={deleteJob}
            />
            <JobBuilderModal
                isOpen={initalBuilderState !== null}
                initialBuilder={initalBuilderState}
                close={() => setInitialBuilderState(null)}
                getJobs={getJobs}
            />
        </Stack>
    );
}
