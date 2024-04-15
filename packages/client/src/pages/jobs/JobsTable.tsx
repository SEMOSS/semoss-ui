import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
    DataGrid,
    GridColDef,
    GridRowSelectionModel,
    GridSlots,
} from '@mui/x-data-grid';
import {
    Chip,
    IconButton,
    Stack,
    styled,
    LinearProgress,
    CircularProgress,
    useNotification,
} from '@semoss/ui';
import { Delete, Edit, PlayArrow } from '@mui/icons-material';
import { Job } from './jobs.types';
import { runPixel } from '@/api';

const StyledDataGrid = styled(DataGrid)(() => ({
    '.MuiDataGrid-overlayWrapper': {
        height: '48px',
    },
    '.MuiDataGrid-overlayWrapperInner': {
        height: '48px',
    },
    '.MuiDataGrid-cell': {
        whiteSpace: 'normal!important',
        wordWrap: 'break-word!important',
    },
}));

export const JobsTable = (props: {
    jobs: Job[];
    jobsLoading: boolean;
    rowSelectionModel: GridRowSelectionModel;
    setRowSelectionModel: (value: GridRowSelectionModel) => void;
    getHistory: () => void;
    showDeleteJobModal: (job: Job) => void;
}) => {
    const {
        jobs,
        jobsLoading,
        rowSelectionModel,
        setRowSelectionModel,
        getHistory,
        showDeleteJobModal,
    } = props;
    const notification = useNotification();

    const [runJobLoading, setRunJobLoading] = useState<boolean>(false);

    const runJob = async (job: Job) => {
        setRunJobLoading(true);
        try {
            await runPixel(
                `META | ExecuteScheduledJob ( jobId = [ \"${job.id}\" ] , jobGroup = [ \"${job.group}\" ] ) ;`,
            );
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Job could not be executed.',
            });
        }
        try {
            await getHistory();
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Could not retrieve job history.',
            });
        }
        setRunJobLoading(false);
    };

    const JobColumns: GridColDef[] = [
        {
            headerName: 'Name',
            field: 'name',
            flex: 1,
        },
        {
            headerName: 'Type',
            field: 'type',
            flex: 1,
        },
        {
            headerName: 'Frequency',
            field: 'frequencyString',
            flex: 1,
        },
        {
            headerName: 'Time Zone',
            field: 'timeZone',
            flex: 1,
        },
        {
            headerName: 'Tags',
            field: 'tags',
            flex: 1,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                return (
                    <Stack
                        height="100%"
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >
                        {params.value.map((tag, idx) => {
                            return (
                                <Chip
                                    key={idx}
                                    variant="outlined"
                                    label={tag}
                                />
                            );
                        })}
                    </Stack>
                );
            },
        },
        {
            headerName: 'Last Run',
            field: 'lastRun',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => {
                let time = '';
                if (
                    !(
                        !params.value ||
                        params.value === 'N/A' ||
                        params.value === 'INACTIVE'
                    )
                ) {
                    time = dayjs(params.value).format('MM/DD/YYYY HH:MMA');
                }
                return <>{time}</>;
            },
        },
        {
            headerName: 'Status',
            field: 'isActive',
            flex: 1,
            renderCell: (params) => {
                return params.value ? 'Active' : 'Paused';
            },
        },
        {
            headerName: 'Modified By',
            field: 'ownerId',
            flex: 1,
        },
        {
            headerName: 'Actions',
            field: 'id',
            flex: 1,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                return (
                    <>
                        <IconButton
                            disabled={runJobLoading}
                            color="primary"
                            size="medium"
                            onClick={() => {
                                const job = jobs.find(
                                    (job) => (job.id = params.value),
                                );
                                runJob(job);
                            }}
                        >
                            {runJobLoading ? (
                                <CircularProgress
                                    size="0.75em"
                                    variant="indeterminate"
                                />
                            ) : (
                                <PlayArrow />
                            )}
                        </IconButton>
                        {/* <IconButton color="primary" size="medium" disabled>
                            <Edit />
                        </IconButton> */}
                        <IconButton
                            disabled={runJobLoading}
                            color="error"
                            size="medium"
                            onClick={() => {
                                const job = jobs.find(
                                    (job) => (job.id = params.value),
                                );
                                showDeleteJobModal(job);
                            }}
                        >
                            <Delete />
                        </IconButton>
                    </>
                );
            },
        },
    ];

    // reset selections when jobs change
    useEffect(() => {
        setRowSelectionModel([]);
    }, [jobs]);

    return (
        <StyledDataGrid
            columns={JobColumns}
            rows={jobs}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(value) => setRowSelectionModel(value)}
            slots={{
                loadingOverlay: LinearProgress as GridSlots['loadingOverlay'],
                noRowsOverlay: () => (
                    <Stack
                        height="100%"
                        alignItems="center"
                        justifyContent="center"
                    >
                        No jobs found
                    </Stack>
                ),
            }}
            loading={jobsLoading}
        />
    );
};
