import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Add, Bedtime, ErrorRounded } from '@mui/icons-material';
import {
    Button,
    Modal,
    styled,
    Table,
    Tabs,
    Box,
    Icon,
    Search,
    Grid,
    Card,
    Popover,
    useNotification,
    Stack,
} from '@semoss/ui';

import { useAPI, useRootStore, useSettings } from '@/hooks';
import {
    buildBackupDatabaseQuery,
    buildETLQuery,
    buildSyncDatabaseQuery,
    convertDeltaToRuntimeString,
    convertTimetoDate
} from './JobsFunctions';
import { JobData, Insight } from './JobsFunctions';
import {
    AvTimer
} from '@mui/icons-material';
import { JobCard } from './JobCard';
import { JobHistory } from './JobHistory';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box
                    sx={{
                        p: 3,
                    }}
                >
                    <div>{children}</div>
                </Box>
            )}
        </div>
    );
}

const defaultJob = {
    // jobName: '',
    // jobTags: '',
    // onLoad: false,
    // customCron: false,
    // cronExpression: '',
    // frequency: 'Daily',
    // dayOfWeek: daysOfWeek[new Date().getDay()] as Day,
    // hour: '12',
    // minute: '00',
    // ampm: 'PM',
    // monthOfYear: monthsOfYear[new Date().getMonth()] as Month,
    // dayOfMonth: new Date().getDate(),
    // // export stuff
    // openExport: false,
    // fileName: '',
    // filePathChecked: false,
    // filePath: '',
    // selectedApp: '',
    // exportTemplate: '',
    // exportAudit: false,
};

const JobTypes: {
    title: string,
    icon: ReactElement,
    avatarColor: string,
    iconColor: string,
    countFunction: (array: any[]) => number; // TODO: better typescript
}[] = [
    {
        title: "Active Jobs",
        icon: <AvTimer fontSize="medium" />,
        avatarColor: "#E2F2FF",
        iconColor: "#0471F0",
        countFunction: (jobs) => jobs.filter((job) => {
            return (
                job.NEXT_FIRE_TIME !== 'INACTIVE'
            );
        }).length
    },
    {
        title: "Inactive Jobs",
        icon: <Bedtime fontSize="medium" />,
        avatarColor: "#F1E9FB",
        iconColor: "#8340DE",
        countFunction: (jobs) => jobs.filter((job) => {
            return (
                job.NEXT_FIRE_TIME === 'INACTIVE'
            );
        }).length
    },
    {
        title: "Failed Jobs",
        icon: <ErrorRounded fontSize="medium" />,
        avatarColor: "#DEF4F3",
        iconColor: "#00A593",
        countFunction: (history) => history.filter((row) => {
            return !row.success;
        }).length
    }
];

export function JobsPage() {
    const { adminMode } = useSettings();
    const { configStore, monolithStore } = useRootStore();
    const notification = useNotification();

    const tabs = ['All', 'Active', 'Inactive'];

    const [searchValue, setSearchValue] = useState('');
    const [selectedTab, setSelectedTab] = useState(tabs[0]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showJobModal, setShowJobModal] = useState(false);
    const [allChecked, setAllChecked] = useState(false);

    const [jobs, setJobs] = useState([]);

    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [jobsToPause, setJobsToPause] = useState([]);
    const [jobsToResume, setJobsToResume] = useState([]);

    const [jobTypeTemplate, setJobTypeTemplate] = useState({});
    const [placeholderData, setPlaceholderData] = useState([]);

    // pagination for jobs table
    const [jobsPage, setJobsPage] = useState<number>(0);
    const [jobsRowsPerPage, setJobsRowsPerPage] = useState<number>(5);
    const jobsStartIndex = jobsPage * jobsRowsPerPage;
    const jobsEndIndex = jobsStartIndex + jobsRowsPerPage;

    const getJobs = () => {
        let pixel = 'META|ListAllJobs()';
        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType[0];

            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message:
                        'Something went wrong. Jobs could not be retrieved.',
                });
            } else {
                // jobs is a map or maps
                // where the jobId is a unique id of the job inputs
                const jobs = response.pixelReturn[0].output;

                const allJobs = [];
                const allTags = [];
                for (const jobId in jobs as any) {
                    if (Object.hasOwnProperty.call(jobs, jobId)) {
                        const job = jobs[jobId];
                        if (
                            Object.prototype.hasOwnProperty.call(job, 'uiState')
                        ) {
                            // Parse the job back from the stringified version
                            const jobJson = JSON.parse(
                                job.uiState.replace(/\\"/g, "'"),
                            );

                            // Also, need to decode the recipe again
                            // jobJson.recipe = decodeURIComponent(jobJson.recipe);
                            jobJson.checked = false;
                            Object.prototype.hasOwnProperty.call(
                                job,
                                'PREV_FIRE_TIME',
                            )
                                ? (jobJson.PREV_FIRE_TIME = job.PREV_FIRE_TIME)
                                : (jobJson.PREV_FIRE_TIME = '');
                            Object.prototype.hasOwnProperty.call(
                                job,
                                'NEXT_FIRE_TIME',
                            )
                                ? (jobJson.NEXT_FIRE_TIME = job.NEXT_FIRE_TIME)
                                : (jobJson.NEXT_FIRE_TIME = '');
                            Object.prototype.hasOwnProperty.call(job, 'USER_ID')
                                ? (jobJson.USER_ID = job.USER_ID)
                                : (jobJson.USER_ID = '');
                            Object.prototype.hasOwnProperty.call(job, 'jobId')
                                ? (jobJson.jobId = job.jobId)
                                : (jobJson.jobId = '');

                            // Temporary fix while we wait for the backend to update jobType from 'Sync App'/'Sync Project'/'Backup App'/'Backup Project' to 'Sync Database'/'Backup Database'.
                            // TODO: Remove this if / else if section once backend is updated
                            if (jobJson.jobType.startsWith('Backup')) {
                                jobJson.jobType = 'Backup Database';
                            } else if (jobJson.jobType.startsWith('Sync')) {
                                jobJson.jobType = 'Sync Database';
                            }

                            if (
                                job.jobGroup === 'undefined' &&
                                jobJson.jobType !== 'Custom Job' &&
                                jobJson.jobType !== 'Send Email'
                            ) {
                                // legacy database-related job
                                if (
                                    jobJson.jobTypeTemplate.hasOwnProperty(
                                        'app',
                                    )
                                ) {
                                    jobJson.jobGroup =
                                        jobJson.jobTypeTemplate.app; // grab db name from jobJson
                                }
                            }

                            jobJson.jobTags = '';
                            if (
                                Object.prototype.hasOwnProperty.call(
                                    job,
                                    'jobTags',
                                ) &&
                                job.jobTags.length > 0
                            ) {
                                jobJson.jobTags = job.jobTags;
                            }

                            allJobs.push(jobJson);
                        } else {
                            job.checked = false;
                            allJobs.push(job);
                        }
                    }
                }

                setJobs(allJobs);
            }
        });
    };

    const getHistory = (jobTags: string[]) => {
        let pixel = 'META|SchedulerHistory(';
        if (jobTags.length > 0) {
            pixel += 'jobTags=["';
            for (let i = 0; i < jobTags.length; i++) {
                pixel +=
                    i === jobTags.length - 1
                        ? jobTags[i] + '"] '
                        : jobTags[i] + '", "';
            }
        }
        pixel += ')';
        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType[0];
            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message:
                        'Something went wrong. Job history could not be retrieved.',
                });
            } else {
                // map the headers
                const historyData = [];
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
                            // Success will have 2 types of values True means passed and False means failed.
                            success: Object.prototype.hasOwnProperty.call(
                                headers,
                                'SUCCESS',
                            )
                                ? output['data'].values[valueIdx][
                                      headers['SUCCESS']
                                  ]
                                : '',
                            // appName: Object.prototype.hasOwnProperty.call(headers, 'APP_NAME') ? output['data'].values[valueIdx][headers.APP_NAME] : '',
                            jobTags: Object.prototype.hasOwnProperty.call(
                                headers,
                                'JOB_TAG',
                            )
                                ? output['data'].values[valueIdx][
                                      headers['JOB_TAG']
                                  ]
                                : '',
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

    const deleteJob = (jobId, jobGroup) => {
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
                setShowDeleteModal(false);
                setSelectedJob(null);
                getJobs(true, []);
                setSelectedTags([]);
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }
        });
    };

    function fillExistingParameters(json) {
        if (Object.keys(jobTypeTemplate['insightParameters']).length > 0) {
            let queryIdx, queryLen, paramIdx, paramLen;
            for (
                queryIdx = 0, queryLen = json.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                for (
                    paramIdx = 0, paramLen = json[queryIdx].params.length;
                    paramIdx < paramLen;
                    paramIdx++
                ) {
                    if (
                        jobTypeTemplate['insightParameters'].hasOwnProperty(
                            json[queryIdx].params[paramIdx].paramName,
                        )
                    ) {
                        // updating the default value with previously selected values during edit
                        json[queryIdx].params[paramIdx].model.defaultValue =
                            jobTypeTemplate['insightParameters'][
                                json[queryIdx].params[paramIdx].paramName
                            ];
                    }
                }
            }
        }
    }

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => job.jobName.includes(searchValue))
    }, [jobs]);

    useEffect(() => {
        // initial render to get all jobs
        getJobs();
    }, []);

    useEffect(() => {
        getHistory(selectedTags);
    }, []);

    useEffect(() => {
        setJobsToResume([]);
        setJobsToPause([]);
        setAllChecked(false);
    }, [selectedTab]);

    return (
        <Stack spacing={2}>
            <Grid container spacing={3}>
                {
                    JobTypes.map((jobType, index) => {
                        return (
                            <Grid key={index} item>
                                <JobCard
                                    title={jobType.title}
                                    icon={jobType.icon}
                                    count={[].filter((job) => {
                                        return (
                                            job.NEXT_FIRE_TIME !== 'INACTIVE'
                                        );
                                    }).length}
                                    avatarColor={jobType.avatarColor}
                                    iconColor={jobType.iconColor}
                                />
                            </Grid>
                        )
                    })
                }
            </Grid>
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
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                    <span>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                        >
                            Add New
                        </Button>
                    </span>
                </Stack>
            </Stack>
            <Table>
                <Table.Head>
                    <Table.Row>
                        {[].map((col) => {
                            return (
                                col.showColumn && (
                                    <Table.Cell align="left">
                                        {col.renderHeader()}
                                    </Table.Cell>
                                )
                            );
                        })}
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {
                        filteredJobs.map((job, index) => {
                            return (
                                <Table.Row key={index}>
                                    {[].map((col) => {
                                        return (
                                            col.showColumn && (
                                                <Table.Cell
                                                    align="left"
                                                    sx={col.sx}
                                                >
                                                    {col.renderData(job)}
                                                </Table.Cell>
                                            )
                                        );
                                    })}
                                </Table.Row>
                            )
                        })
                    }
                </Table.Body>
                <Table.Footer>
                    <Table.Row>
                        <Table.Pagination
                            rowsPerPageOptions={[5, 10, 25]}
                            onPageChange={(e, v) => {
                                setJobsPage(v);
                                setAllChecked(false);
                                setJobsToResume([]);
                                setJobsToPause([]);
                            }}
                            page={jobsPage}
                            rowsPerPage={jobsRowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setJobsRowsPerPage(Number(e.target.value));
                            }}
                            count={.length}
                        />
                    </Table.Row>
                </Table.Footer>
            </Table>
            <JobHistory />
            <Modal
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedJob(null);
                }}
                open={showDeleteModal}
            >
                <Modal.Content>
                    <Modal.Title>
                        Delete Job ({selectedJob?.jobName})
                    </Modal.Title>
                    <Modal.Content>
                        <p>
                            Confirm Delete.{' '}
                            <span
                                style={{
                                    color: 'red',
                                }}
                            >
                                Warning: Action is Permanent
                            </span>
                        </p>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            variant="text"
                            onClick={() => {
                                setShowDeleteModal(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => {
                                deleteJob(
                                    selectedJob.jobId,
                                    selectedJob.jobGroup,
                                );
                            }}
                        >
                            Delete
                        </Button>
                    </Modal.Actions>
                </Modal.Content>
            </Modal>
        </Stack>
    );
}
