import { ReactElement, useEffect, useMemo, useState } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
    Add,
    Bedtime,
    Delete,
    Edit,
    ErrorRounded,
    PlayArrow,
} from '@mui/icons-material';
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
    Chip,
    IconButton,
    Typography,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { AvTimer } from '@mui/icons-material';
import { JobCard } from './JobCard';
import { JobHistory } from './JobHistory';
import { Job, JobUIState, PixelReturnJob } from './jobs.types';
import { convertTimeToFrequencyString } from './job.utils';
import { JobsTable } from './JobsTable';

export function JobsPage() {
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const tabs = ['All', 'Active', 'Inactive'];

    const [searchValue, setSearchValue] = useState('');
    const [selectedTab, setSelectedTab] = useState(tabs[0]);

    const [failedJobCount, setFailedJobCount] = useState<number>(0);

    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobsLoading, setJobsLoading] = useState<boolean>(false);

    const [jobToDelete, setJobToDelete] = useState<Job>(null);

    const getJobs = () => {
        setJobsLoading(true);
        let pixel = 'META|ListAllJobs()';
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
                        let jobUIState: JobUIState;
                        try {
                            jobUIState = JSON.parse(
                                job.uiState.replace(/\\"/g, "'"),
                            );
                        } catch (e) {
                            return {
                                id: job.jobId,
                                name: job.jobName,
                                type: 'Custom',
                                frequencyString: job.cronExpression,
                                timeZone: job.cronTz,
                                tags: job.jobTags.split(','),
                                lastRun: job.PREV_FIRE_TIME,
                                nextRun: job.NEXT_FIRE_TIME,
                                ownerId: job.USER_ID,
                                isActive: job.NEXT_FIRE_TIME !== 'INACTIVE',
                                group: job.jobGroup,
                            };
                        }

                        return {
                            id: job.jobId,
                            name: job.jobName,
                            type: jobUIState.jobType,
                            frequencyString:
                                convertTimeToFrequencyString(jobUIState),
                            timeZone: jobUIState.cronTimeZone,
                            tags: job.jobTags.split(','),
                            lastRun: job.PREV_FIRE_TIME,
                            nextRun: job.NEXT_FIRE_TIME,
                            ownerId: job.USER_ID,
                            isActive: job.NEXT_FIRE_TIME !== 'INACTIVE',
                            group: job.jobGroup,
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

    const filteredJobs = useMemo(() => {
        const searchJobs = jobs.filter((job) => job.name.includes(searchValue));
        if (selectedTab === 'Active') {
            return searchJobs.filter((job) => job.isActive);
        } else if (selectedTab === 'Inactive') {
            return searchJobs.filter((job) => !job.isActive);
        }
        return searchJobs;
    }, [jobs, searchValue, selectedTab]);

    useEffect(() => {
        // initial render to get all jobs
        getJobs();
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
                        <Button variant="contained" startIcon={<Add />}>
                            Add New
                        </Button>
                    </span>
                </Stack>
            </Stack>
            <JobsTable
                jobs={filteredJobs}
                jobsLoading={jobsLoading}
                showDeleteJobModal={(job: Job) => setJobToDelete(job)}
            />
            <JobHistory setFailedJobCount={setFailedJobCount} />
            <Modal
                onClose={() => {
                    setJobToDelete(null);
                }}
                open={jobToDelete !== null}
            >
                <Modal.Content>
                    <Modal.Title>Delete Job</Modal.Title>
                    <Modal.Content>
                        {JSON.stringify(jobToDelete)}
                        <Typography variant="body1">
                            Are you sure you want to delete {jobToDelete?.name}?
                            This action is permanent.
                        </Typography>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            variant="text"
                            onClick={() => {
                                setJobToDelete(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => {
                                deleteJob(jobToDelete.id, jobToDelete.group);
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
