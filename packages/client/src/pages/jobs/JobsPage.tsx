import { Field } from '@/components/form';
import { useAPI, useRootStore, useSettings } from '@/hooks';
import {
    mdiArrowDownDropCircle,
    mdiCalendarMonth,
    mdiClockOutline,
    mdiFilter,
    mdiPause,
    mdiPlay,
    mdiPlayCircleOutline,
    mdiPlus,
    mdiSquareEditOutline,
    mdiTrashCanOutline,
} from '@mdi/js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
//import Icon from '@mdi/react';
import {
    IconButton,
    //     Button,
    //     Checkbox,
    //     Dropdown,
    //     Flex,
    //     Form,
    //     Input,
    //     Modal,
    //     Select,
    //    styled,
    //     Table,
    //     Tabs,
    //     theme,
    useNotification,
} from '@semoss/components';
import {
    Button,
    Checkbox,
    Modal,
    Select,
    styled,
    Table,
    Tabs,
    Box,
    Icon,
    Tab,
    Accordion,
    Search,
    ToggleTabsGroup,
    Collapse,
    Typography,
    Chip,
    Menu,
    Grid,
    Card,
    Popover,
} from '@semoss/ui';
import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    buildBackupDatabaseQuery,
    buildETLQuery,
    buildSyncDatabaseQuery,
    convertDeltaToRuntimeString,
    convertTimeToCron,
    convertTimetoDate,
    convertTimeToFrequencyString,
    convertTimeToLastRunString,
    convertTimeToNextRunString,
    daysOfWeek,
    frequencyOpts,
    getDaysOfMonth,
    monthsOfYear,
} from './JobsFunctions';
import { JobData, Job, Insight } from './JobsFunctions';
import {
    ArrowDownward,
    AvTimer,
    DarkMode,
    Error,
    KeyboardArrowDown,
    KeyboardArrowUp,
    MenuBookSharp,
    SearchRounded,
} from '@mui/icons-material';

const StyledTableHeader = styled(Table.Head)(({ theme }) => ({
    width: theme.spacing(7.5),
}));

// const StyledContainer = styled('div', {
//     display: 'flex',
//     flexDirection: 'column',
//     rowGap: '20px',
//     margin: '0 auto',
//     paddingLeft: theme.space[8],
//     paddingRight: theme.space[8],
//     paddingBottom: theme.space[8],
//     '@sm': {
//         maxWidth: '640px',
//     },
//     '@md': {
//         maxWidth: '768px',
//     },
//     '@lg': {
//         maxWidth: '1024px',
//     },
//     '@xl': {
//         maxWidth: '1280px',
//     },
//     '@xxl': {
//         maxWidth: '1536px',
//     },
// });

// const StyledHeaderIcon = styled(Icon, {
//     height: '1rem',
//     width: '1rem',
//     marginRight: '.5rem',
//     display: 'flex',
//     alignItems: 'center',
// });

// const TimeSpacer = styled('div', {
//     overflow: 'hidden',
//     textOverflow: 'ellipsis',
//     whiteSpace: 'nowrap',
//     height: '2em',
//     lineHeight: '2em',
//     fontSize: '0.875rem',
//     color: 'var(--color-grey-2)',
//     width: '0.5rem',
//     marginRight: '0.5rem',
//     marginLeft: '0.5rem',
//     textAlign: 'center',
//     float: 'left',
// });
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

function HistoryRow(props) {
    const { row } = props;
    const [open, setOpen] = useState(false);
    return (
        <>
            <Table.Row
                sx={{
                    '& > *': {
                        borderBottom: 'unset',
                    },
                }}
            >
                <Table.Cell>
                    <IconButton
                        aria-label="expand row"
                        size="sm"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </Table.Cell>
                <Table.Cell align="left">{row.name}</Table.Cell>
                <Table.Cell align="left">{row.jobName}</Table.Cell>
                <Table.Cell align="left">{row.execStart}</Table.Cell>
                <Table.Cell align="left">{row.execDelta}</Table.Cell>
                <Table.Cell align="left">
                    <Chip
                        label={row.success ? 'Success' : 'Failed'}
                        avatar={null}
                        color={row.success ? 'success' : 'error'}
                    />
                </Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.Cell
                    sx={{
                        paddingBottom: 0,
                        paddingTop: 0,
                    }}
                    colSpan={6}
                >
                    <Collapse
                        in={open}
                        timeout="auto"
                        //unmountOnExit
                    >
                        Output:
                        <Box
                            sx={{
                                padding: 1,
                                margin: 1,
                                borderRadius: '25px',
                                backgroundColor: '#F0F0F0',
                            }}
                        >
                            {row.schedulerOutput}
                        </Box>
                    </Collapse>
                </Table.Cell>
            </Table.Row>
        </>
    );
}

const jobDefaultValues = {
    jobName: '',
    jobTags: '',
    // frequency stuff
    onLoad: false,
    customCron: false,
    cronExpression: '',
    frequency: 'Daily',
    dayOfWeek: daysOfWeek[new Date().getDay()],
    hour: '12',
    minute: '00',
    ampm: 'PM',
    monthOfYear: monthsOfYear[new Date().getMonth()],
    dayOfMonth: new Date().getDate(),
    // export stuff
    openExport: false,
    fileName: '',
    filePathChecked: false,
    filePath: '',
    selectedApp: '',
    exportTemplate: '',
    exportAudit: false,
};

export function JobsPage() {
    const { adminMode } = useSettings();
    const { configStore, monolithStore } = useRootStore();
    const notification = useNotification();
    const user = configStore.store.user;
    const config = configStore.store.config;

    const tabs = ['All', 'Active', 'Inactive'];

    const [searchValue, setSearchValue] = useState('');
    const [historySearchValue, setHistorySearchValue] = useState('');
    const [selectedTab, setSelectedTab] = useState(tabs[0]);
    const [ownerType, setOwnerType] = useState('All Jobs');
    const [newJobModalSelectedTab, setNewJobModalSelectedTab] =
        useState('job-details');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showJobModal, setShowJobModal] = useState(false);
    const [allChecked, setAllChecked] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState<boolean>(false);

    const [jobs, setJobs] = useState([]);
    const [history, setHistory] = useState([]);

    const [allTags, setAllTags] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [jobsToPause, setJobsToPause] = useState([]);
    const [jobsToResume, setJobsToResume] = useState([]);

    const [jobTypeTemplate, setJobTypeTemplate] = useState({});
    const [placeholderData, setPlaceholderData] = useState([]);

    const { data: databaseList } = useAPI(['getDatabases', adminMode]);
    const { data: projectsList } = useAPI(['getProjects', adminMode]);
    const [targetAppTables, setTargetAppTables] = useState([]);

    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [columnSelectorAnchorEl, setColumnSelectorAnchorEl] =
        useState<HTMLButtonElement | null>(null);

    // pagination for jobs table
    const [jobsPage, setJobsPage] = useState<number>(0);
    const [jobsRowsPerPage, setJobsRowsPerPage] = useState<number>(5);
    const jobsStartIndex = jobsPage * jobsRowsPerPage;
    const jobsEndIndex = jobsStartIndex + jobsRowsPerPage;

    // pagination for history table
    const [historyPage, setHistoryPage] = useState<number>(0);
    const [historyRowsPerPage, setHistoryRowsPerPage] = useState<number>(5);
    const historyStartIndex = historyPage * historyRowsPerPage;
    const historyEndIndex = historyStartIndex + historyRowsPerPage;

    // columns
    const [jobColumns, setJobColumns] = useState([
        // one for checkboxes too ?
        {
            renderHeader: () => {
                return (
                    <Checkbox
                        value={allChecked}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setAllChecked(checked);
                            if (checked) {
                                // add all these jobs to resume jobs
                                setJobsToResume(
                                    filterJobs(jobs).filter(
                                        (j) => j.NEXT_FIRE_TIME === 'INACTIVE',
                                    ),
                                );
                                // add all these jobs to pause jobs
                                setJobsToPause(
                                    filterJobs(jobs).filter(
                                        (j) => j.NEXT_FIRE_TIME !== 'INACTIVE',
                                    ),
                                );
                            } else {
                                // remove all these jobs to resume jobs
                                const removeFromResume = filterJobs(
                                    jobs,
                                ).filter(
                                    (j) => j.NEXT_FIRE_TIME === 'INACTIVE',
                                );
                                setJobsToResume((prev) =>
                                    prev.filter(
                                        (p) =>
                                            !removeFromResume.some(
                                                (e) => e.jobId !== p.jobId,
                                            ),
                                    ),
                                );

                                // remove all these jobs to pause jobs
                                const removeFromPause = filterJobs(jobs).filter(
                                    (j) => j.NEXT_FIRE_TIME !== 'INACTIVE',
                                );

                                setJobsToPause((prev) =>
                                    prev.filter(
                                        (p) =>
                                            !removeFromPause.some(
                                                (e) => e.jobId !== p.jobId,
                                            ),
                                    ),
                                );
                            }
                        }}
                    />
                );
            },
            showColumn: true,
            renderData: (job) => {
                return (
                    <>
                        <Checkbox
                            value={
                                jobsToResume.some(
                                    (x) => x.jobId === job.jobId,
                                ) ||
                                jobsToPause.some((x) => x.jobId === job.jobId)
                            }
                            onChange={(e) => {
                                const checked = e.target.checked;
                                if (checked) {
                                    job.NEXT_FIRE_TIME === 'INACTIVE'
                                        ? setJobsToResume((prev) => [
                                              ...prev,
                                              job,
                                          ])
                                        : setJobsToPause((prev) => [
                                              ...prev,
                                              job,
                                          ]);
                                } else {
                                    job.NEXT_FIRE_TIME === 'INACTIVE'
                                        ? setJobsToResume((prev) =>
                                              prev.filter(
                                                  (p) => p.jobId !== job.jobId,
                                              ),
                                          )
                                        : setJobsToPause((prev) =>
                                              prev.filter(
                                                  (p) => p.jobId !== job.jobId,
                                              ),
                                          );
                                }
                            }}
                        />
                    </>
                );
            },
        },
        {
            renderHeader: () => {
                return (
                    <Button
                        color="inherit"
                        variant="text"
                        children="Name"
                        endIcon={<ArrowDownward />}
                    />
                );
            },
            showColumn: true,
            renderData: (job) => {
                return job.jobName;
            },
        },
        {
            renderHeader: () => {
                return 'Type';
            },
            showColumn: true,
            renderData: (job) => {
                return job.jobType;
            },
        },
        {
            renderHeader: () => {
                return 'Frequency';
            },
            showColumn: true,
            renderData: (job) => {
                return convertTimeToFrequencyString(job);
            },
        },
        {
            renderHeader: () => {
                return 'Time Zone';
            },
            showColumn: true,
            renderData: (job) => {
                return 'how to extract time zone?';
            },
        },
        {
            renderHeader: () => {
                return 'Tags';
            },
            showColumn: true,
            renderData: (job) => {
                return (
                    job.jobTags &&
                    job.jobTags.split(',').map((tag) => {
                        return <Chip label={tag} avatar={null} />;
                    })
                );
            },
        },
        {
            renderHeader: () => {
                return 'Last Run';
            },
            showColumn: true,
            renderData: (job) => {
                return convertTimeToLastRunString(job);
            },
        },
        {
            renderHeader: () => {
                return 'Modified By';
            },
            showColumn: true,
            renderData: (job) => {
                return job.USER_ID;
            },
        },
        {
            renderHeader: () => {
                return 'Actions';
            },
            showColumn: true,
            renderData: (job) => {
                return (
                    <>
                        <IconButton
                            color="primary"
                            size="md"
                            onClick={() => {
                                executeJob(job.jobId, job.jobGroup);
                            }}
                        >
                            <PlayArrowIcon />
                        </IconButton>
                        <IconButton
                            color="primary"
                            size="md"
                            onClick={() => {
                                setSelectedJob(job);
                                setShowJobModal(true);
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            color="primary"
                            size="md"
                            onClick={() => {
                                setSelectedJob(job);
                                setShowDeleteModal(true);
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </>
                );
            },
        },
    ]);

    // default values
    const customJobDefaultValues = {
        recipe: '',
    };

    const syncDatabaseJobDefaultValues = {
        app: projectsList?.map((p) => p.project_name)[0],
        repository: '',
        username: '',
        password: '',
        dual: true,
        syncDatabase: true,
    };

    const backupDatabaseJobDefaultValues = {
        app: databaseList?.map((db) => db.app_name)[0],
    };

    const extractTransformLoadJobDefaultValues = {
        sourceApp: '',
        targetApp: '',
        targetTable: '',
        query: '',
    };

    const sendEmailJobDefaultValues = {
        smtpHost: '',
        smtpPort: '',
        subject: '',
        to: '',
        from: '',
        message: '',
        username: '',
        password: '',
    };

    const runInsightJobDefaultValues = {
        app: '',
        insight: '',
    };

    const { control, handleSubmit, watch, setValue, reset } = useForm<JobData>({
        defaultValues: {
            jobType: 'Custom Job',
            ...jobDefaultValues,
            ...customJobDefaultValues,
        },
    });

    const buildEditJobPixel = (
        jobId: string,
        jobName: string,
        jobGroup: string,
        cronExpression: string,
        recipe: string,
        recipeParameters: string,
        jobTags: string[],
        onLoad: boolean,
        uiState: string,
        curJobName: string,
        curJobGroup: string,
    ) => {
        let query = '';

        query += 'EditScheduledJob(';
        query += 'jobId=["' + jobId + '"], ';
        query += 'jobName=["' + jobName + '"], ';
        query += 'jobGroup=["' + jobGroup + '"], ';
        query += 'cronExpression=["' + cronExpression + '"], ';
        query += 'recipe=["<encode>' + recipe + '</encode>"], ';
        if (recipeParameters) {
            query +=
                'recipeParameters=["<encode>' +
                recipeParameters +
                '</encode>"], ';
        }

        if (jobTags && jobTags.length > 0) {
            query += 'jobTags=["';
            for (let i = 0; i < jobTags.length; i++) {
                if (i === jobTags.length - 1) {
                    query += jobTags[i] + '"], ';
                } else {
                    query += jobTags[i] + '", "';
                }
            }
        }
        query += 'uiState=["' + uiState + '"], ';
        query += 'triggerOnLoad=[' + onLoad + '], triggerNow=[false],';
        query += 'curJobName=["' + curJobName + '"], ';
        query += 'curJobGroup=["' + curJobGroup + '"]';
        query += ')';

        return query;
    };

    const scheduleJob = handleSubmit((data) => {
        const job = { ...data };

        const editingJob = selectedJob !== null;

        // change frequency tag to respective object for backend
        job.frequency = frequencyOpts.find((f) => f.human === job.frequency);

        if (job.selectedApp.length > 0) {
            job.selectedApp = projectsList.find(
                (p) => p.project_name === job.selectedApp,
            ).project_id;
        }

        if (!job.customCron) {
            job.cronExpression = convertTimeToCron(job);
        }

        if (job.jobTags && !Array.isArray(job.jobTags)) {
            job.jobTags = job.jobTags.split(',');
        }

        if (job?.jobType !== 'Custom Job') {
            job.recipe = jobTypeTemplate['templatePixelQuery'];
            // if run insight and there is a paramjson, we will build the param pixel
            if (
                job.jobType === 'Run Insight' &&
                jobTypeTemplate['paramJson']?.length > 0
            ) {
                job.recipeParameters = buildInsightParamsRecipe(job);
                // if there is json but no pixel is generated, we have a problem. probably no value selected, so alert them.
                if (!job.recipeParameters) {
                    notification.add({
                        color: 'warning',
                        content:
                            'Please fill in all parameter fields before continuing.',
                    });
                    // we don't want to continue any further processing, so return
                    return;
                }
            } else {
                // normal insight--no params
                job.recipeParameters = '';
            }
        }

        // manually add export
        if (job.openExport) {
            job.recipe = addExportToRecipe(job, job.recipe);
        }

        job.jobGroup = jobTypeTemplate['app'];
        job.jobTypeTemplate = jobTypeTemplate;
        job.placeholderData = placeholderData;

        if (editingJob) {
            job.curJobId = selectedJob.jobId;
            job.curJobName = selectedJob.jobName;
            job.curJobGroup = selectedJob.jobGroup;
            job.curJobTags = selectedJob.jobTags;

            const pixel = buildEditJobPixel(
                selectedJob.jobId,
                job.jobName,
                job.jobGroup,
                job.cronExpression,
                job.recipe,
                job.recipeParameters,
                job.jobTags,
                job.onLoad,
                JSON.stringify(job).replace(/"/g, '\\"'),
                selectedJob.jobName,
                selectedJob.jobGroup,
            );
            monolithStore.runQuery(pixel).then((response) => {
                const type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        content:
                            'Something went wrong. Job could not be edited.',
                    });
                } else {
                    notification.add({
                        color: 'success',
                        content: 'Job was successfully edited.',
                    });
                    getJobs(true, []);
                }
            });
        } else {
            // if this jobname already exists, notify user and exit out of function
            if (
                jobs.some(
                    (j) =>
                        j.jobName?.toLowerCase().trim() ===
                        job.jobName?.toLowerCase().trim(),
                )
            ) {
                notification.add({
                    color: 'error',
                    content: 'Job name must be unique',
                });
                return;
            }
            // running the query
            const pixel = buildScheduleJobPixel(
                job.jobName,
                job.jobGroup,
                job.cronExpression,
                job.recipe,
                job.recipeParameters,
                job.jobTags,
                job.onLoad,
                JSON.stringify(job).replace(/"/g, '\\"'),
            );

            // run the job
            monolithStore.runQuery(pixel).then((response) => {
                const type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        content:
                            'Something went wrong. Job could not be scheduled.',
                    });
                    return;
                } else {
                    notification.add({
                        color: 'success',
                        content: 'Job was successfully scheduled.',
                    });
                    getJobs(true, []);
                }
            });
        }
        // TODO create a reset function???
        setSelectedTags([]);
        reset({
            jobType: 'Custom Job',
            ...jobDefaultValues,
            ...customJobDefaultValues,
        });
        setSelectedJob(null);
        setPlaceholderData([]);
        setJobTypeTemplate({});
    });

    const buildInsightParamsRecipe = (job) => {
        const params = {};
        let queryIdx;
        let queryLen;
        let paramIdx;
        let paramLen;
        const json = job.jobTypeTemplate.paramJson;
        let pixel = '';

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
                    json[queryIdx].params[paramIdx].required &&
                    ((typeof json[queryIdx].params[paramIdx].model
                        .defaultValue === 'number' &&
                        isNaN(
                            json[queryIdx].params[paramIdx].model.defaultValue,
                        )) ||
                        (typeof json[queryIdx].params[paramIdx].model
                            .defaultValue === 'string' &&
                            !json[queryIdx].params[paramIdx].model
                                .defaultValue) ||
                        (Array.isArray(
                            json[queryIdx].params[paramIdx].model.defaultValue,
                        ) &&
                            json[queryIdx].params[paramIdx].model.defaultValue
                                .length === 0 &&
                            !json[queryIdx].params[paramIdx].selectAll) ||
                        typeof json[queryIdx].params[paramIdx].model
                            .defaultValue === 'undefined' ||
                        json[queryIdx].params[paramIdx].model.defaultValue ===
                            null)
                ) {
                    // can't build a proper param pixel so will return empty string
                    return '';
                } else if (
                    json[queryIdx].params[paramIdx].model.defaultValue ||
                    json[queryIdx].params[paramIdx].model.defaultValue === 0
                ) {
                    params[json[queryIdx].params[paramIdx].paramName] =
                        json[queryIdx].params[paramIdx].model.defaultValue;
                }
            }
        }

        jobTypeTemplate['insightParameters'] = params;

        // use params to build pixel

        if (Object.keys(params).length > 0) {
            pixel += 'SetOpenInsightParamValue({';
            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    pixel += '"' + key + '": ';
                    pixel += JSON.stringify(params[key]);
                    pixel += ', ';
                }
            }
            // Remove last comma space (, )
            pixel = pixel.slice(0, -2);
            pixel += '})';
        }

        return pixel;
    };

    const addExportToRecipe = (job: Job, recipe: string) => {
        if (!recipe) {
            return '';
        }

        // TODO: get rid of this and build the full pixel on submit (instead of doing string manipulation)
        let updated = recipe;

        // build the pixel to export
        const exportPixel = buildExportPixel(
            job.fileName,
            job.filePath,
            job.exportTemplate,
            job.exportAudit,
            placeholderData,
            [],
            job.selectedApp,
        );

        if (job.jobType === 'Run Insight') {
            // open it
            updated = updated.slice(0, -2);

            // add the additional pixels
            updated += ", additionalPixels=['" + exportPixel + "']";

            // close it
            updated += ');';
        } else {
            // add to the end
            updated += exportPixel;
        }

        return updated;
    };

    const buildExportPixel = (
        fileName: string,
        filePath: string,
        exportTemplate: string,
        exportAudit: boolean,
        templateData: any[],
        panelOrderIds: any[],
        appId: string,
    ) => {
        let pixel = '';

        const pixelValues = {};
        let keys = [];
        if (fileName.length > 0) {
            pixelValues['fileName'] = fileName;
        }
        if (filePath.length > 0) {
            pixelValues['filePath'] = filePath;
        }
        if (exportTemplate?.length > 0) {
            pixelValues['export_template'] = exportTemplate;
            pixelValues['placeHolderData'] = templateData;
            pixelValues['project'] = appId;
        }
        pixelValues['exportAudit'] = `${exportAudit}`;

        if (panelOrderIds?.length > 0) {
            pixelValues['panelOrderIds'] = panelOrderIds;
        }
        keys = Object.keys(pixelValues);

        pixel += 'ExportToExcel(';

        for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
            if (keyIdx !== 0) {
                // Add a comma before each query parameter except the first one
                pixel += ', ';
            }
            pixel += `${keys[keyIdx]}=[${JSON.stringify(
                pixelValues[keys[keyIdx]],
            )}]`;
        }
        pixel += ')';

        return pixel;
    };

    const buildScheduleJobPixel = (
        jobName: string,
        jobGroup: string,
        cronExpression: string,
        recipe: string,
        recipeParameters: string,
        jobTags: string[],
        onLoad: boolean, // boolean or string?
        uiState: string,
    ) => {
        let query = '';

        query += 'ScheduleJob(';
        query += 'jobName=["' + jobName + '"], ';
        query += 'jobGroup=["' + jobGroup + '"], ';
        query += 'cronExpression=["' + cronExpression + '"], ';
        query += 'recipe=["<encode>' + recipe + '</encode>"], ';
        if (recipeParameters) {
            query +=
                'recipeParameters=["<encode>' +
                recipeParameters +
                '</encode>"], ';
        }

        if (jobTags && jobTags.length > 0) {
            query += 'jobTags=["';
            for (let i = 0; i < jobTags.length; i++) {
                if (i === jobTags.length - 1) {
                    query += jobTags[i] + '"], ';
                } else {
                    query += jobTags[i] + '", "';
                }
            }
        }
        query += 'uiState=["' + uiState + '"], ';
        query += 'triggerOnLoad=[' + onLoad + '], triggerNow=[false]';
        query += ')';

        return query;
    };

    const jobName = watch('jobName');
    const jobType = watch('jobType');
    const customCron = watch('customCron');
    const frequency = watch('frequency');
    const monthOfYear = watch('monthOfYear');
    const openExport = watch('openExport');
    const project = watch('app');
    const targetApp = watch('targetApp');
    const selectedApp = watch('selectedApp');
    const exportTemplate = watch('exportTemplate');

    const [insights, setInsights] = useState<Insight[]>([]);
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        if (jobType === 'Run Insight' && project && projectsList) {
            const projectId = projectsList.find(
                (p) => p.project_name === project,
            )?.project_id;
            getInsights(projectId);
        }
    }, [project, projectsList]);

    useEffect(() => {
        if (exportTemplate?.length > 0) {
            getPlaceholderData(exportTemplate);
        }
    }, [exportTemplate]);

    const getPlaceholderData = (templateName: string) => {
        let query = '';

        const projectId = projectsList.find(
            (p) => p.project_name === selectedApp,
        )?.project_id;
        if (projectId && templateName) {
            query +=
                'GetPlaceHolders(project=["' +
                projectId +
                '"], template_name=["' +
                templateName +
                '"])';
        } else if (templateName) {
            query += 'GetPlaceHolders(template_name=["' + templateName + '"]))';
        } else {
            query += 'GetPlaceHolders()';
        }
        monolithStore.runQuery(query).then((response) => {
            const type = response.pixelReturn[0].operationType[0];
            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    content: 'Placeholder Data could not be retrieved.',
                });
            } else {
                setPlaceholderData(response.pixelReturn[0].output);
            }
        });
    };

    const getInsights = (projectId: string) => {
        const pixel = `META|GetInsights(project=["${projectId}"], limit=["50"], offset=["0"])`;
        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType[0];
            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    content: `Something went wrong. Insights for project ID ${projectId} could not be retrieved.`,
                });
            } else {
                const insights = response.pixelReturn[0].output;
                setInsights(insights as Insight[]);
            }
        });
    };

    const getJobs = (setTags: boolean, jobTags: string[]) => {
        let pixel = 'META|ListAllJobs(';
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
                    content:
                        'Something went wrong. Jobs could not be retrieved.',
                });
            } else {
                // jobs is a map or maps
                // where the jobId is a unique id of the job inputs
                const jobs = response.pixelReturn[0].output;

                const allJobs = [];
                const allTags = [];
                for (const jobId in jobs as any) {
                    if (jobs.hasOwnProperty(jobId)) {
                        const job = jobs[jobId];
                        if (job.hasOwnProperty('uiState')) {
                            // Parse the job back from the stringified version
                            const jobJson = JSON.parse(
                                job.uiState.replace(/\\"/g, "'"),
                            );

                            // Also, need to decode the recipe again
                            // jobJson.recipe = decodeURIComponent(jobJson.recipe);
                            jobJson.checked = false;
                            job.hasOwnProperty('PREV_FIRE_TIME')
                                ? (jobJson.PREV_FIRE_TIME = job.PREV_FIRE_TIME)
                                : (jobJson.PREV_FIRE_TIME = '');
                            job.hasOwnProperty('NEXT_FIRE_TIME')
                                ? (jobJson.NEXT_FIRE_TIME = job.NEXT_FIRE_TIME)
                                : (jobJson.NEXT_FIRE_TIME = '');
                            job.hasOwnProperty('USER_ID')
                                ? (jobJson.USER_ID = job.USER_ID)
                                : (jobJson.USER_ID = '');
                            job.hasOwnProperty('jobId')
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
                                job.hasOwnProperty('jobTags') &&
                                job.jobTags.length > 0
                            ) {
                                jobJson.jobTags = job.jobTags;

                                // add the tags
                                if (setTags) {
                                    const tags = jobJson.jobTags.split(',');
                                    for (
                                        let tagIdx = 0, tagLen = tags.length;
                                        tagIdx < tagLen;
                                        tagIdx++
                                    ) {
                                        const tag = tags[tagIdx];

                                        if (tag && !allTags.includes(tag)) {
                                            allTags.push(tags[tagIdx]);
                                        }
                                    }
                                }
                            }

                            allJobs.push(jobJson);
                        } else {
                            job.checked = false;
                            allJobs.push(job);
                        }
                    }
                }

                setJobs(allJobs);

                if (setTags) {
                    setAllTags(allTags);
                }
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
                    content:
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
                            jobId: headers.hasOwnProperty('JOB_ID')
                                ? output['data'].values[valueIdx][
                                      headers['JOB_ID']
                                  ]
                                : '',
                            jobName: headers.hasOwnProperty('JOB_NAME')
                                ? output['data'].values[valueIdx][
                                      headers['JOB_NAME']
                                  ]
                                : '',
                            jobGroup: headers.hasOwnProperty('JOB_GROUP')
                                ? output['data'].values[valueIdx][
                                      headers['JOB_GROUP']
                                  ]
                                : '',
                            execStart:
                                headers.hasOwnProperty('EXECUTION_START') &&
                                output['data'].values[valueIdx][
                                    headers['EXECUTION_START']
                                ]
                                    ? convertTimetoDate(
                                          output['data'].values[valueIdx][
                                              headers['EXECUTION_START']
                                          ],
                                      )
                                    : '',
                            execEnd: headers.hasOwnProperty('EXECUTION_END')
                                ? output['data'].values[valueIdx][
                                      headers['EXECUTION_END']
                                  ]
                                : '',
                            execDelta: headers.hasOwnProperty('EXECUTION_DELTA')
                                ? convertDeltaToRuntimeString(
                                      output['data'].values[valueIdx][
                                          headers['EXECUTION_DELTA']
                                      ],
                                  )
                                : '',
                            // Success will have 2 types of values True means passed and False means failed.
                            success: headers.hasOwnProperty('SUCCESS')
                                ? output['data'].values[valueIdx][
                                      headers['SUCCESS']
                                  ]
                                : '',
                            // appName: headers.hasOwnProperty('APP_NAME') ? output['data'].values[valueIdx][headers.APP_NAME] : '',
                            jobTags: headers.hasOwnProperty('JOB_TAG')
                                ? output['data'].values[valueIdx][
                                      headers['JOB_TAG']
                                  ]
                                : '',
                            // capture the latest record based on the IS_LATEST field stored
                            isLatest: headers.hasOwnProperty('IS_LATEST')
                                ? output['data'].values[valueIdx][
                                      headers['IS_LATEST']
                                  ]
                                : false,
                            //capture scheduler output
                            schedulerOutput: headers.hasOwnProperty(
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
                    content: `Successfully deleted ${type}`,
                });
                setShowDeleteModal(false);
                setSelectedJob(null);
                getJobs(true, []);
                setSelectedTags([]);
            } else {
                notification.add({
                    color: 'error',
                    content: output,
                });
            }
        });
    };

    const executeJob = (jobId: string, jobGroup: string) => {
        let pixel = 'META | ExecuteScheduledJob(';
        pixel += 'jobId=["' + jobId + '"], ';
        pixel += 'jobGroup=["' + jobGroup + '"]) ';

        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;
            if (type.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    content: `Job was executed`,
                });
            } else {
                notification.add({
                    color: 'error',
                    content: output,
                });
            }
        });
    };

    function setParameterizedInsight(viewOptionsMap) {
        if (viewOptionsMap.json && viewOptionsMap.json.length > 0) {
            viewOptionsMap.json[0].execute = '';
            jobTypeTemplate['paramJson'] = viewOptionsMap.json;
            fillExistingParameters(viewOptionsMap.json);
        }
    }

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

    const setInsightParametersIfExists = (insight: Insight) => {
        const query = `META|IsInsightParameterized(project=["${insight.app_id}"], id=["${insight.app_insight_id}"]);`;
        monolithStore.runQuery(query).then((response) => {
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                const output = response.pixelReturn[0].output;
                if (output['hasParameter']) {
                    setParameterizedInsight(output['viewOptionsMap']);
                } else {
                    setJobTypeTemplate({
                        ...jobTypeTemplate,
                        insight: {
                            app_insight_id: insight.app_insight_id,
                            name: insight.name,
                        },
                        insightParameters: {},
                    });
                }
            } else {
                notification.add({
                    color: 'error',
                    content: response.pixelReturn[0].output,
                });
            }
        });
    };

    const resumeJobs = () => {
        // iterate through jobsToResume and build pixel string
        let pixel = '';
        jobsToResume.forEach(
            (job) =>
                (pixel += `ResumeJobTrigger(jobId=["${job.jobId}"], jobGroup=["${job.jobGroup}"] );`),
        );
        // run pixel
        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;
            if (type.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    content: `Jobs are resumed`,
                });
                getJobs(false, []);
                setJobsToResume([]);
                setSelectedTags([]);
                setAllChecked(false);
            } else {
                notification.add({
                    color: 'error',
                    content: output,
                });
            }
        });
    };

    const pauseJobs = () => {
        let pixel = '';
        jobsToPause.forEach(
            (job) =>
                (pixel += `PauseJobTrigger(jobId=["${job.jobId}"], jobGroup=["${job.jobGroup}"] );`),
        );
        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;
            if (type.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    content: `Jobs are paused`,
                });
                getJobs(false, []);
                setJobsToPause([]);
                setSelectedTags([]);
                setAllChecked(false);
            } else {
                notification.add({
                    color: 'error',
                    content: output,
                });
            }
        });
    };

    const filterJobs = (jobs: any[]) => {
        return jobs
            .filter((job) => {
                return searchValue.length > 0
                    ? job.jobName
                          .toLowerCase()
                          .includes(searchValue.toLowerCase())
                    : true;
            })
            .filter((job) => {
                switch (selectedTab) {
                    case 'Active':
                        return job.NEXT_FIRE_TIME !== 'INACTIVE';
                    case 'Inactive':
                        return job.NEXT_FIRE_TIME === 'INACTIVE';
                    default:
                        return true;
                }
            });
        // .filter((job) => {
        //     return ownerType === 'All Jobs'
        //         ? true
        //         : job.USER_ID === user.id;
        // });
    };

    const filterHistory = (jobs: any[]) => {
        return jobs.filter((job) => {
            return historySearchValue.length > 0
                ? job.jobName
                      .toLowerCase()
                      .includes(historySearchValue.toLowerCase())
                : true;
        });
    };

    const getTargetDatabaseTables = (databaseId: string) => {
        const query = `GetDatabaseMetamodel ( database = [ '${databaseId}' ] ) ;`;
        monolithStore.runQuery(query).then((response) => {
            const type = response.pixelReturn[0].operationType[0];
            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    content:
                        'Something went wrong. Could not retrieve target app tables.',
                });
            } else {
                const data = response.pixelReturn[0].output;
                setTargetAppTables(
                    data['nodes'].map((node) => node['conceptualName']),
                );
            }
        });
    };

    const getProjectTemplates = (projectId: string) => {
        const pixel = `META|GetTemplateList(project=["${projectId}"]);`;
        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType[0];
            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    content:
                        'Something went wrong. Could not retrieve templates.',
                });
            } else {
                const data = response.pixelReturn[0].output;
                const templates = [];
                for (const templateName in data) {
                    if (templateName) {
                        templates.push({
                            templateType: 'Custom template',
                            templateName: templateName,
                            filename: data[templateName],
                            templateGroup: selectedApp,
                        });
                    }
                }
                setTemplates(templates);
            }
        });
    };

    useEffect(() => {
        // initial render to get all jobs
        getJobs(true, selectedTags);
    }, []);

    useEffect(() => {
        getHistory(selectedTags);
    });

    useEffect(() => {
        if (showJobModal && !selectedJob) {
            setJobTypeTemplate({});
            setPlaceholderData([]);
            reset({
                jobType: 'Custom Job',
                ...jobDefaultValues,
                ...customJobDefaultValues,
            });
        } else if (showJobModal && selectedJob) {
            // populate the fields with the selected job data
            setValue('jobName', selectedJob.jobName);
            setValue('jobType', selectedJob.jobType);
            setValue('jobTags', selectedJob.jobTags);
            setValue('onLoad', selectedJob.onLoad);
            setValue('customCron', selectedJob.customCron);
            setValue('cronExpression', selectedJob.cronExpression);
            setValue('frequency', selectedJob.frequency.human);
            setValue('dayOfWeek', selectedJob.dayOfWeek);
            setValue('hour', selectedJob.hour);
            setValue('minute', selectedJob.minute);
            setValue('ampm', selectedJob.ampm);
            setValue('monthOfYear', selectedJob.monthOfYear);
            setValue('dayOfMonth', selectedJob.dayOfMonth);
            setValue('openExport', selectedJob.openExport);
            setValue('fileName', selectedJob.fileName);
            setValue('filePathChecked', selectedJob.filePath?.length > 0);
            setValue('exportTemplate', selectedJob.exportTemplate);
            setValue('exportAudit', selectedJob.exportAudit);
            if (selectedJob.selectedApp) {
                setValue(
                    'selectedApp',
                    selectedJob.selectedApp.length > 0
                        ? projectsList.find(
                              (p) => p.project_id === selectedJob.selectedApp,
                          )?.project_name
                        : '',
                );
            }

            const template = selectedJob.jobTypeTemplate;
            switch (selectedJob.jobType) {
                case 'Custom Job':
                    setValue('recipe', selectedJob.recipe);
                    break;
                case 'Backup Database':
                    setValue(
                        'app',
                        databaseList.find((db) => db.app_id === template.app)
                            .app_name,
                    );
                    setJobTypeTemplate(template);
                    break;
                case 'Sync Database':
                    setValue(
                        'app',
                        projectsList.find((p) => p.project_id === template.app)
                            .project_name,
                    );
                    setValue('repository', template.repository);
                    setValue('username', template.username);
                    setValue('password', template.password);
                    setValue('dual', template.dual);
                    setValue('syncDatabase', template.syncDatabase);
                    setJobTypeTemplate(template);
                    break;
                case 'Extract Transform Load':
                    setValue(
                        'sourceApp',
                        databaseList.find(
                            (db) => db.app_id === template.sourceApp,
                        )?.app_name,
                    );
                    setValue(
                        'targetApp',
                        databaseList.find(
                            (db) => db.app_id === template.targetApp,
                        )?.app_name,
                    );
                    setValue('targetTable', template.targetTable);
                    setValue('query', template.query);
                    setJobTypeTemplate(template);
                    break;
                case 'Send Email':
                    setValue('smtpHost', selectedJob.smtpHost);
                    setValue('smtpPort', selectedJob.smtpPort);
                    setValue('subject', selectedJob.subject);
                    setValue('to', selectedJob.to);
                    setValue('from', selectedJob.from);
                    setValue('message', selectedJob.message);
                    setValue('username', selectedJob.username);
                    setValue('password', selectedJob.password);
                    setJobTypeTemplate(template);
                    break;
                case 'Run Insight':
                    setValue(
                        'app',
                        projectsList.find((p) => p.project_id === template.app)
                            .project_name,
                    );
                    setValue('insight', template.insight.name);
                    setJobTypeTemplate(template);
                    break;
                default:
                    break;
            }
        }
    }, [showJobModal]);

    useEffect(() => {
        if (selectedTab === 'history') {
            getHistory(selectedTags);
        }
        setJobsToResume([]);
        setJobsToPause([]);
        setAllChecked(false);
    }, [selectedTab]);

    useEffect(() => {
        if (targetApp) {
            getTargetDatabaseTables(
                databaseList.find((db) => db.app_name === targetApp).app_id,
            );
        }
    }, [targetApp]);

    useEffect(() => {
        if (selectedApp) {
            getProjectTemplates(
                projectsList.find((p) => p.project_name === selectedApp)
                    .project_id,
            );
        }
    }, [selectedApp]);

    useEffect(() => {
        if (!selectedJob) {
            switch (jobType) {
                case 'Custom Job':
                    // job template doesnt need to be updated
                    break;
                case 'Backup Database':
                    setJobTypeTemplate({
                        app: databaseList[0].app_id,
                        templatePixelQuery: buildBackupDatabaseQuery(
                            databaseList[0].app_id,
                        ),
                    });
                    break;
                case 'Sync Database':
                    let syncAppQuery = 'SyncApp(';

                    syncAppQuery +=
                        "app=['" + projectsList[0].project_id + "'], ";
                    syncAppQuery += "repository=[''], ";
                    syncAppQuery += "username=[''], ";
                    syncAppQuery += "password=[''], ";
                    syncAppQuery += "dual=['true'], ";
                    syncAppQuery += "syncDatabase=['true']);";
                    setJobTypeTemplate({
                        app: projectsList[0].project_id,
                        dual: true,
                        syncDatabase: true,
                        repository: '',
                        username: '',
                        password: '',
                        templatePixelQuery: syncAppQuery,
                    });
                    break;
                default:
                    break;
            }
        }
    }, [jobType]);

    // build the queries for respective job types
    useEffect(() => {
        if (jobType) {
            switch (jobType) {
                case 'Custom Job':
                    // job template doesnt need to be updated
                    break;
                case 'Backup Database':
                    jobTypeTemplate['templatePixelQuery'] =
                        buildBackupDatabaseQuery(jobTypeTemplate['app']);
                    break;
                case 'Sync Database':
                    jobTypeTemplate['templatePixelQuery'] =
                        buildSyncDatabaseQuery(
                            jobTypeTemplate['app'],
                            jobTypeTemplate['repository'],
                            jobTypeTemplate['username'],
                            jobTypeTemplate['password'],
                            jobTypeTemplate['dual'],
                            jobTypeTemplate['syncDatabase'],
                        );
                    break;
                case 'Extract Transform Load':
                    jobTypeTemplate['templatePixelQuery'] = buildETLQuery(
                        jobTypeTemplate['sourceApp'],
                        jobTypeTemplate['query'],
                        jobTypeTemplate['targetApp'],
                        jobTypeTemplate['targetTable'],
                    );
                    break;
                case 'Send Email':
                    let sendEmailQuery = 'SendEmail(';

                    const splitTo = jobTypeTemplate['to']?.split(';');

                    sendEmailQuery +=
                        "smtpHost=['" + jobTypeTemplate['smtpHost'] + "'], ";
                    sendEmailQuery +=
                        "smtpPort=['" + jobTypeTemplate['smtpPort'] + "'], ";
                    sendEmailQuery +=
                        "subject=['" + jobTypeTemplate['subject'] + "'], ";
                    sendEmailQuery += 'to=[';

                    if (splitTo) {
                        for (let i = 0; i < splitTo.length; i++) {
                            sendEmailQuery += "'" + splitTo[i].trim() + "'";

                            if (i !== jobTypeTemplate['to'].length - 1) {
                                sendEmailQuery += ',';
                            }
                        }
                    }

                    sendEmailQuery += '], ';
                    sendEmailQuery +=
                        "from=['" + jobTypeTemplate['from'] + "'], ";
                    sendEmailQuery +=
                        "message=['" + jobTypeTemplate['message'] + "'], ";
                    sendEmailQuery +=
                        "username=['" + jobTypeTemplate['username'] + "'], ";
                    sendEmailQuery +=
                        "password=['" + jobTypeTemplate['password'] + "']);";

                    jobTypeTemplate['templatePixelQuery'] = sendEmailQuery;
                    break;
                case 'Run Insight':
                    // TODO insight parameters?
                    const insightQuery = `OpenInsight(app=['${jobTypeTemplate['app']}'], id=['${jobTypeTemplate['insight']?.['app_insight_id']}']);`;
                    jobTypeTemplate['templatePixelQuery'] = insightQuery;
                    break;
                default:
                    break;
            }
        }
    }, [jobTypeTemplate]);
    return (
        <div>
            <Grid container spacing={2}>
                <Grid item>
                    <Card>
                        <Card.Content>
                            <Icon children={<AvTimer />} />
                            <Card.Header
                                title="Active Jobs"
                                subheader={
                                    jobs.filter((job) => {
                                        return (
                                            job.NEXT_FIRE_TIME !== 'INACTIVE'
                                        );
                                    }).length
                                }
                            />
                        </Card.Content>
                    </Card>
                </Grid>
                <Grid item>
                    <Card>
                        <Card.Content>
                            <Icon children={<DarkMode />} />
                            <Card.Header
                                title="Inactive Jobs"
                                subheader={
                                    jobs.filter((job) => {
                                        return (
                                            job.NEXT_FIRE_TIME === 'INACTIVE'
                                        );
                                    }).length
                                }
                            />
                        </Card.Content>
                    </Card>
                </Grid>
                <Grid item>
                    <Card>
                        <Card.Content>
                            <Icon children={<Error />} />
                            <Card.Header
                                title="Failed Jobs"
                                subheader={
                                    history.filter((row) => {
                                        return !row.success;
                                    }).length
                                }
                            />
                        </Card.Content>
                    </Card>
                </Grid>
            </Grid>
            <Table.Container>
                <Table aria-label="collapsible table" size="small">
                    {/* <StyledTableHeader></StyledTableHeader> */}
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell align="left">
                                <Tabs
                                    value={tabs.indexOf(selectedTab)}
                                    onChange={(
                                        event: SyntheticEvent,
                                        value: number,
                                    ) => {
                                        setSelectedTab(tabs[value]);
                                    }}
                                    textColor="primary"
                                    indicatorColor="primary"
                                >
                                    <Tabs.Item label="All" />
                                    <Tabs.Item label="Active" />
                                    <Tabs.Item label="Inactive" />
                                </Tabs>
                            </Table.Cell>
                            <Table.Cell>
                                <Search
                                    placeholder="Search"
                                    fullWidth
                                    size="small"
                                    onChange={(e) =>
                                        setSearchValue(e.target.value)
                                    }
                                />
                            </Table.Cell>
                            <Table.Cell>
                                <Icon>
                                    <FilterAltIcon />
                                </Icon>
                            </Table.Cell>
                            <Table.Cell align="right">
                                <Button
                                    variant="outlined"
                                    onClick={(event) => {
                                        setColumnSelectorAnchorEl(
                                            event.currentTarget,
                                        );
                                    }}
                                >
                                    <Icon>
                                        <MenuIcon />
                                    </Icon>
                                    Columns
                                </Button>
                                <Popover
                                    id={'column-selector'}
                                    open={Boolean(columnSelectorAnchorEl)}
                                    anchorEl={columnSelectorAnchorEl}
                                    onClose={() =>
                                        setColumnSelectorAnchorEl(null)
                                    }
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                >
                                    <Search
                                        placeholder="Search Column Type"
                                        size="small"
                                        onChange={(e) => {
                                            // search column types
                                            //setSearchValue(e.target.value)
                                        }}
                                    />
                                    {/* checklist of column names here */}
                                </Popover>
                            </Table.Cell>
                            <Table.Cell align="right">
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    children={'Add New'}
                                ></Button>
                            </Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            {jobColumns.map((col) => {
                                return (
                                    col.showColumn && (
                                        <Table.Cell align="left">
                                            {col.renderHeader()}
                                        </Table.Cell>
                                    )
                                );
                            })}
                        </Table.Row>
                        {filterJobs(jobs).length === 0 ? (
                            <Table.Row
                            // style={{
                            //     columnSpan: 'all',
                            // }}
                            >
                                <Table.Cell>
                                    <span>No jobs, please try again.</span>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            filterJobs(jobs)
                                .slice(jobsStartIndex, jobsEndIndex)
                                .map((job, i) => {
                                    return (
                                        <Table.Row key={i}>
                                            {jobColumns.map((col) => {
                                                return (
                                                    col.showColumn && (
                                                        <Table.Cell>
                                                            {col.renderData(
                                                                job,
                                                            )}
                                                        </Table.Cell>
                                                    )
                                                );
                                            })}
                                        </Table.Row>
                                    );
                                })
                        )}
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.Pagination
                                rowsPerPageOptions={[5, 10, 25]}
                                onPageChange={(e, v) => {
                                    setJobsPage(v);
                                }}
                                page={jobsPage}
                                rowsPerPage={jobsRowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setJobsRowsPerPage(e.target.value);
                                }}
                                count={filterJobs(jobs).length}
                            />
                        </Table.Row>
                    </Table.Footer>
                </Table>
            </Table.Container>
            <Accordion
                expanded={historyExpanded}
                onChange={(e) => {
                    setHistoryExpanded(!historyExpanded);
                    //getHistory(selectedTags);
                }}
                square={true}
            >
                <Accordion.Trigger sx={{ justifyContent: 'space-between' }}>
                    History
                    {historyExpanded ? (
                        <KeyboardArrowUp />
                    ) : (
                        <KeyboardArrowDown />
                    )}
                </Accordion.Trigger>
                <Accordion.Content>
                    <Search
                        fullWidth={true}
                        placeholder="Search"
                        size="small"
                        onChange={(e) => setHistorySearchValue(e.target.value)}
                    />
                    <Table.Container>
                        <Table aria-label="collapsible table">
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell align="left">
                                        <></>
                                    </Table.Cell>
                                    <Table.Cell align="left">
                                        <></>
                                    </Table.Cell>
                                    <Table.Cell align="left">Name</Table.Cell>
                                    <Table.Cell align="left">
                                        <Button
                                            color="inherit"
                                            variant="text"
                                            children="Run Date"
                                            endIcon={<ArrowDownward />}
                                        />
                                    </Table.Cell>
                                    <Table.Cell align="left">Time</Table.Cell>
                                    <Table.Cell align="left">Status</Table.Cell>
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
                                            return <HistoryRow row={history} />;
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
                                                e.target.value,
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
        </div>
    );
}
