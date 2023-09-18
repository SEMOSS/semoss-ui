import { SyntheticEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PlayArrow, Edit, Delete, Menu, Add } from '@mui/icons-material';
import {
    Button,
    Checkbox,
    Modal,
    styled,
    Table,
    Tabs,
    Box,
    Icon,
    Accordion,
    Search,
    Collapse,
    Chip,
    Grid,
    Card,
    Popover,
    IconButton,
    useNotification,
    Divider,
} from '@semoss/ui';

import { useAPI, useRootStore, useSettings } from '@/hooks';
import {
    buildBackupDatabaseQuery,
    buildETLQuery,
    buildSyncDatabaseQuery,
    convertDeltaToRuntimeString,
    convertTimeToCron,
    convertTimetoDate,
    convertTimeToFrequencyString,
    convertTimeToLastRunString,
    daysOfWeek,
    frequencyOpts,
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
} from '@mui/icons-material';

const StyledPopover = styled(Popover)(() => ({
    display: 'flex',
    flexDirection: 'column',
}));

const StyledJobActionsContainer = styled('div')({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    gap: '24px',
});

const StyledKpiCardContent = styled(Card.Content)({
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: '1px',
});

const StyledKpiIcon = styled(Icon)({
    borderRadius: '5px',
    verticalAlign: 'middle',
});

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
                        size="small"
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
                        variant="filled"
                        color={row.success ? 'green' : 'pink'}
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

    // columns selector
    const [searchColumnType, setSearchColumnType] = useState<string>('');
    const [jobColumns, setJobColumns] = useState([
        {
            renderHeader: () => {
                return (
                    <Checkbox
                        value={allChecked}
                        onChange={(e, checked) => {
                            setAllChecked(checked);
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
                            onChange={(e, checked) => {
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
            hideable: false,
            columnType: '',
            sx: null,
        },
        {
            renderHeader: () => {
                return (
                    <Button
                        color="inherit"
                        variant="text"
                        endIcon={<ArrowDownward />}
                    >
                        Name
                    </Button>
                );
            },
            showColumn: true,
            renderData: (job) => {
                return job.jobName;
            },
            hideable: true,
            columnType: 'Name',
            sx: null,
        },
        {
            renderHeader: () => {
                return 'Type';
            },
            showColumn: true,
            renderData: (job) => {
                return job.jobType;
            },
            hideable: true,
            columnType: 'Type',
            sx: null,
        },
        {
            renderHeader: () => {
                return 'Frequency';
            },
            showColumn: true,
            renderData: (job) => {
                return convertTimeToFrequencyString(job);
            },
            hideable: true,
            columnType: 'Frequency',
            sx: null,
        },
        {
            renderHeader: () => {
                return 'Time Zone';
            },
            showColumn: true,
            renderData: (job) => {
                return 'N/A'; // be needs to include time zone in ListAllJobs()
            },
            hideable: true,
            columnType: 'Time Zone',
            sx: null,
        },
        {
            renderHeader: () => {
                return 'Tags';
            },
            showColumn: true,
            renderData: (job) => {
                return (
                    job.jobTags &&
                    job.jobTags.split(',').map((tag, idx) => {
                        return <Chip key={idx} label={tag} avatar={null} />;
                    })
                );
            },
            hideable: true,
            columnType: 'Tags',
            sx: null,
        },
        {
            renderHeader: () => {
                return 'Last Run';
            },
            showColumn: true,
            renderData: (job) => {
                return convertTimeToLastRunString(job);
            },
            hideable: true,
            columnType: 'Last Run',
            sx: null,
        },
        {
            renderHeader: () => {
                return 'Created By';
            },
            showColumn: true,
            renderData: (job) => {
                return 'N/A';
            },
            hideable: true,
            columnType: 'Created By',
            sx: null,
        },
        {
            renderHeader: () => {
                return 'Modified By';
            },
            showColumn: true,
            renderData: (job) => {
                return job.USER_ID;
            },
            hideable: true,
            columnType: 'Modified By',
            sx: null,
        },
        {
            renderHeader: () => {
                return 'Last Run By';
            },
            showColumn: true,
            renderData: (job) => {
                return 'N/A';
            },
            hideable: true,
            columnType: 'Last Run By',
            sx: null,
        },
        {
            renderHeader: () => {
                return 'Modified Date';
            },
            showColumn: true,
            renderData: (job) => {
                return 'N/A';
            },
            hideable: true,
            columnType: 'Modified Date',
            sx: null,
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
                            color="info"
                            size="medium"
                            onClick={() => {
                                executeJob(job.jobId, job.jobGroup);
                            }}
                        >
                            <PlayArrow />
                        </IconButton>
                        <IconButton
                            color="info"
                            size="medium"
                            onClick={() => {
                                setSelectedJob(job);
                                setShowJobModal(true);
                            }}
                            disabled // enable when edit page is built out
                        >
                            <Edit />
                        </IconButton>
                        <IconButton
                            color="info"
                            size="medium"
                            onClick={() => {
                                setSelectedJob(job);
                                setShowDeleteModal(true);
                            }}
                        >
                            <Delete />
                        </IconButton>
                    </>
                );
            },
            hideable: true,
            columnType: 'Actions',
            sx: { whiteSpace: 'nowrap' },
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

    // const scheduleJob = handleSubmit((data) => {
    //     const job = { ...data };

    //     const editingJob = selectedJob !== null;

    //     // change frequency tag to respective object for backend
    //     job.frequency = frequencyOpts.find((f) => f.human === job.frequency);

    //     if (job.selectedApp.length > 0) {
    //         job.selectedApp = projectsList.find(
    //             (p) => p.project_name === job.selectedApp,
    //         ).project_id;
    //     }

    //     if (!job.customCron) {
    //         job.cronExpression = convertTimeToCron(job);
    //     }

    //     if (job.jobTags && !Array.isArray(job.jobTags)) {
    //         job.jobTags = job.jobTags.split(',');
    //     }

    //     if (job?.jobType !== 'Custom Job') {
    //         job.recipe = jobTypeTemplate['templatePixelQuery'];
    //         // if run insight and there is a paramjson, we will build the param pixel
    //         if (
    //             job.jobType === 'Run Insight' &&
    //             jobTypeTemplate['paramJson']?.length > 0
    //         ) {
    //             job.recipeParameters = buildInsightParamsRecipe(job);
    //             // if there is json but no pixel is generated, we have a problem. probably no value selected, so alert them.
    //             if (!job.recipeParameters) {
    //                 notification.add({
    //                     color: 'warning',
    //                     message:
    //                         'Please fill in all parameter fields before continuing.',
    //                 });
    //                 // we don't want to continue any further processing, so return
    //                 return;
    //             }
    //         } else {
    //             // normal insight--no params
    //             job.recipeParameters = '';
    //         }
    //     }

    //     // manually add export
    //     if (job.openExport) {
    //         job.recipe = addExportToRecipe(job, job.recipe);
    //     }

    //     job.jobGroup = jobTypeTemplate['app'];
    //     job.jobTypeTemplate = jobTypeTemplate;
    //     job.placeholderData = placeholderData;

    //     if (editingJob) {
    //         job.curJobId = selectedJob.jobId;
    //         job.curJobName = selectedJob.jobName;
    //         job.curJobGroup = selectedJob.jobGroup;
    //         job.curJobTags = selectedJob.jobTags;

    //         const pixel = buildEditJobPixel(
    //             selectedJob.jobId,
    //             job.jobName,
    //             job.jobGroup,
    //             job.cronExpression,
    //             job.recipe,
    //             job.recipeParameters,
    //             job.jobTags,
    //             job.onLoad,
    //             JSON.stringify(job).replace(/"/g, '\\"'),
    //             selectedJob.jobName,
    //             selectedJob.jobGroup,
    //         );
    //         monolithStore.runQuery(pixel).then((response) => {
    //             const type = response.pixelReturn[0].operationType[0];
    //             if (type.indexOf('ERROR') > -1) {
    //                 notification.add({
    //                     color: 'error',
    //                     message:
    //                         'Something went wrong. Job could not be edited.',
    //                 });
    //             } else {
    //                 notification.add({
    //                     color: 'success',
    //                     message: 'Job was successfully edited.',
    //                 });
    //                 getJobs(true, []);
    //             }
    //         });
    //     } else {
    //         // if this jobname already exists, notify user and exit out of function
    //         if (
    //             jobs.some(
    //                 (j) =>
    //                     j.jobName?.toLowerCase().trim() ===
    //                     job.jobName?.toLowerCase().trim(),
    //             )
    //         ) {
    //             notification.add({
    //                 color: 'error',
    //                 message: 'Job name must be unique',
    //             });
    //             return;
    //         }
    //         // running the query
    //         const pixel = buildScheduleJobPixel(
    //             job.jobName,
    //             job.jobGroup,
    //             job.cronExpression,
    //             job.recipe,
    //             job.recipeParameters,
    //             job.jobTags,
    //             job.onLoad,
    //             JSON.stringify(job).replace(/"/g, '\\"'),
    //         );

    //         // run the job
    //         monolithStore.runQuery(pixel).then((response) => {
    //             const type = response.pixelReturn[0].operationType[0];
    //             if (type.indexOf('ERROR') > -1) {
    //                 notification.add({
    //                     color: 'error',
    //                     message:
    //                         'Something went wrong. Job could not be scheduled.',
    //                 });
    //                 return;
    //             } else {
    //                 notification.add({
    //                     color: 'success',
    //                     message: 'Job was successfully scheduled.',
    //                 });
    //                 getJobs(true, []);
    //             }
    //         });
    //     }
    //     // TODO create a reset function???
    //     setSelectedTags([]);
    //     reset({
    //         jobType: 'Custom Job',
    //         ...jobDefaultValues,
    //         ...customJobDefaultValues,
    //     });
    //     setSelectedJob(null);
    //     setPlaceholderData([]);
    //     setJobTypeTemplate({});
    // });

    // const buildInsightParamsRecipe = (job) => {
    //     const params = {};
    //     let queryIdx;
    //     let queryLen;
    //     let paramIdx;
    //     let paramLen;
    //     const json = job.jobTypeTemplate.paramJson;
    //     let pixel = '';

    //     for (
    //         queryIdx = 0, queryLen = json.length;
    //         queryIdx < queryLen;
    //         queryIdx++
    //     ) {
    //         for (
    //             paramIdx = 0, paramLen = json[queryIdx].params.length;
    //             paramIdx < paramLen;
    //             paramIdx++
    //         ) {
    //             if (
    //                 json[queryIdx].params[paramIdx].required &&
    //                 ((typeof json[queryIdx].params[paramIdx].model
    //                     .defaultValue === 'number' &&
    //                     isNaN(
    //                         json[queryIdx].params[paramIdx].model.defaultValue,
    //                     )) ||
    //                     (typeof json[queryIdx].params[paramIdx].model
    //                         .defaultValue === 'string' &&
    //                         !json[queryIdx].params[paramIdx].model
    //                             .defaultValue) ||
    //                     (Array.isArray(
    //                         json[queryIdx].params[paramIdx].model.defaultValue,
    //                     ) &&
    //                         json[queryIdx].params[paramIdx].model.defaultValue
    //                             .length === 0 &&
    //                         !json[queryIdx].params[paramIdx].selectAll) ||
    //                     typeof json[queryIdx].params[paramIdx].model
    //                         .defaultValue === 'undefined' ||
    //                     json[queryIdx].params[paramIdx].model.defaultValue ===
    //                         null)
    //             ) {
    //                 // can't build a proper param pixel so will return empty string
    //                 return '';
    //             } else if (
    //                 json[queryIdx].params[paramIdx].model.defaultValue ||
    //                 json[queryIdx].params[paramIdx].model.defaultValue === 0
    //             ) {
    //                 params[json[queryIdx].params[paramIdx].paramName] =
    //                     json[queryIdx].params[paramIdx].model.defaultValue;
    //             }
    //         }
    //     }

    //     jobTypeTemplate['insightParameters'] = params;

    //     // use params to build pixel

    //     if (Object.keys(params).length > 0) {
    //         pixel += 'SetOpenInsightParamValue({';
    //         for (const key in params) {
    //             if (params.hasOwnProperty(key)) {
    //                 pixel += '"' + key + '": ';
    //                 pixel += JSON.stringify(params[key]);
    //                 pixel += ', ';
    //             }
    //         }
    //         // Remove last comma space (, )
    //         pixel = pixel.slice(0, -2);
    //         pixel += '})';
    //     }

    //     return pixel;
    // };

    // const addExportToRecipe = (job: Job, recipe: string) => {
    //     if (!recipe) {
    //         return '';
    //     }

    //     // TODO: get rid of this and build the full pixel on submit (instead of doing string manipulation)
    //     let updated = recipe;

    //     // build the pixel to export
    //     const exportPixel = buildExportPixel(
    //         job.fileName,
    //         job.filePath,
    //         job.exportTemplate,
    //         job.exportAudit,
    //         placeholderData,
    //         [],
    //         job.selectedApp,
    //     );

    //     if (job.jobType === 'Run Insight') {
    //         // open it
    //         updated = updated.slice(0, -2);

    //         // add the additional pixels
    //         updated += ", additionalPixels=['" + exportPixel + "']";

    //         // close it
    //         updated += ');';
    //     } else {
    //         // add to the end
    //         updated += exportPixel;
    //     }

    //     return updated;
    // };

    // const buildExportPixel = (
    //     fileName: string,
    //     filePath: string,
    //     exportTemplate: string,
    //     exportAudit: boolean,
    //     templateData: any[],
    //     panelOrderIds: any[],
    //     appId: string,
    // ) => {
    //     let pixel = '';

    //     const pixelValues = {};
    //     let keys = [];
    //     if (fileName.length > 0) {
    //         pixelValues['fileName'] = fileName;
    //     }
    //     if (filePath.length > 0) {
    //         pixelValues['filePath'] = filePath;
    //     }
    //     if (exportTemplate?.length > 0) {
    //         pixelValues['export_template'] = exportTemplate;
    //         pixelValues['placeHolderData'] = templateData;
    //         pixelValues['project'] = appId;
    //     }
    //     pixelValues['exportAudit'] = `${exportAudit}`;

    //     if (panelOrderIds?.length > 0) {
    //         pixelValues['panelOrderIds'] = panelOrderIds;
    //     }
    //     keys = Object.keys(pixelValues);

    //     pixel += 'ExportToExcel(';

    //     for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    //         if (keyIdx !== 0) {
    //             // Add a comma before each query parameter except the first one
    //             pixel += ', ';
    //         }
    //         pixel += `${keys[keyIdx]}=[${JSON.stringify(
    //             pixelValues[keys[keyIdx]],
    //         )}]`;
    //     }
    //     pixel += ')';

    //     return pixel;
    // };

    // const buildScheduleJobPixel = (
    //     jobName: string,
    //     jobGroup: string,
    //     cronExpression: string,
    //     recipe: string,
    //     recipeParameters: string,
    //     jobTags: string[],
    //     onLoad: boolean, // boolean or string?
    //     uiState: string,
    // ) => {
    //     let query = '';

    //     query += 'ScheduleJob(';
    //     query += 'jobName=["' + jobName + '"], ';
    //     query += 'jobGroup=["' + jobGroup + '"], ';
    //     query += 'cronExpression=["' + cronExpression + '"], ';
    //     query += 'recipe=["<encode>' + recipe + '</encode>"], ';
    //     if (recipeParameters) {
    //         query +=
    //             'recipeParameters=["<encode>' +
    //             recipeParameters +
    //             '</encode>"], ';
    //     }

    //     if (jobTags && jobTags.length > 0) {
    //         query += 'jobTags=["';
    //         for (let i = 0; i < jobTags.length; i++) {
    //             if (i === jobTags.length - 1) {
    //                 query += jobTags[i] + '"], ';
    //             } else {
    //                 query += jobTags[i] + '", "';
    //             }
    //         }
    //     }
    //     query += 'uiState=["' + uiState + '"], ';
    //     query += 'triggerOnLoad=[' + onLoad + '], triggerNow=[false]';
    //     query += ')';

    //     return query;
    // };

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
                    message: 'Placeholder Data could not be retrieved.',
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
                    message: `Something went wrong. Insights for project ID ${projectId} could not be retrieved.`,
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
                    message: `Job was executed`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
                getHistory(selectedTags);
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
                    message: response.pixelReturn[0].output,
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
                    message: `Jobs are resumed`,
                });
                getJobs(false, []);
                setJobsToResume([]);
                setSelectedTags([]);
                setAllChecked(false);
            } else {
                notification.add({
                    color: 'error',
                    message: output,
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
                    message: `Jobs are paused`,
                });
                getJobs(false, []);
                setJobsToPause([]);
                setSelectedTags([]);
                setAllChecked(false);
            } else {
                notification.add({
                    color: 'error',
                    message: output,
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
                    message:
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
                    message:
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
        const currentPageJobs = filterJobs(jobs).slice(
            jobsStartIndex,
            jobsEndIndex,
        );
        if (allChecked) {
            // add all these jobs to resume jobs
            console.log('is this gonna work??');
            console.log(currentPageJobs);
            console.log(
                // to resume
                currentPageJobs.filter((j) => j.NEXT_FIRE_TIME === 'INACTIVE'),
            );
            console.log(
                // to pause
                currentPageJobs.filter((j) => j.NEXT_FIRE_TIME !== 'INACTIVE'),
            );
            setJobsToResume(
                currentPageJobs.filter((j) => j.NEXT_FIRE_TIME === 'INACTIVE'),
            );
            // add all these jobs to pause jobs
            setJobsToPause(
                currentPageJobs.filter((j) => j.NEXT_FIRE_TIME !== 'INACTIVE'),
            );
        } else {
            // remove all these jobs to resume jobs
            const removeFromResume = currentPageJobs.filter(
                (j) => j.NEXT_FIRE_TIME === 'INACTIVE',
            );
            setJobsToResume((prev) =>
                prev.filter(
                    (p) => !removeFromResume.some((e) => e.jobId !== p.jobId),
                ),
            );

            // remove all these jobs to pause jobs
            const removeFromPause = currentPageJobs.filter(
                (j) => j.NEXT_FIRE_TIME !== 'INACTIVE',
            );

            setJobsToPause((prev) =>
                prev.filter(
                    (p) => !removeFromPause.some((e) => e.jobId !== p.jobId),
                ),
            );
        }
        // if (allChecked) {
        //     console.log('trying useefect approach. checked');
        //     console.log(filterJobs(jobs));
        // } else {
        //     console.log('trying useefect approach. unchecked');
        //     console.log(filterJobs(jobs));
        // }
    }, [allChecked, setAllChecked]);

    useEffect(() => {
        // initial render to get all jobs
        getJobs(true, selectedTags);
    }, []);

    useEffect(() => {
        getHistory(selectedTags);
    }, []);

    console.log(jobsToResume);
    console.log(jobsToPause);

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
            if (jobType === 'Custom Job') {
                // noop;
            } else if (jobType === 'Backup Database') {
                setJobTypeTemplate({
                    app: databaseList[0].app_id,
                    templatePixelQuery: buildBackupDatabaseQuery(
                        databaseList[0].app_id,
                    ),
                });
            } else if (jobType === 'Sync Database') {
                let syncAppQuery = 'SyncApp(';

                syncAppQuery += "app=['" + projectsList[0].project_id + "'], ";
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
        <>
            <Grid container spacing={3}>
                <Grid item>
                    <Card>
                        <StyledKpiCardContent>
                            <StyledKpiIcon
                                fontSize="large"
                                color="info"
                                sx={{
                                    backgroundColor: '#87CEFA',
                                }}
                                children={
                                    <AvTimer sx={{ verticalAlign: 'middle' }} />
                                }
                            />
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
                        </StyledKpiCardContent>
                    </Card>
                </Grid>
                <Grid item>
                    <Card>
                        <StyledKpiCardContent>
                            <StyledKpiIcon
                                fontSize="large"
                                color="secondary"
                                sx={{
                                    backgroundColor: '#CBC3E3',
                                }}
                                children={
                                    <DarkMode
                                        sx={{ verticalAlign: 'middle' }}
                                    />
                                }
                            />
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
                        </StyledKpiCardContent>
                    </Card>
                </Grid>
                <Grid item>
                    <Card>
                        <StyledKpiCardContent>
                            <StyledKpiIcon
                                color="success"
                                fontSize="large"
                                sx={{
                                    backgroundColor: '#ddffdd',
                                }}
                                children={
                                    <Error sx={{ verticalAlign: 'middle' }} />
                                }
                            />
                            <Card.Header
                                title="Failed Jobs"
                                subheader={
                                    history.filter((row) => {
                                        return !row.success;
                                    }).length
                                }
                            />
                        </StyledKpiCardContent>
                    </Card>
                </Grid>
            </Grid>
            <StyledJobActionsContainer>
                <Tabs
                    value={tabs.indexOf(selectedTab)}
                    onChange={(event: SyntheticEvent, value: number) => {
                        setSelectedTab(tabs[value]);
                    }}
                    textColor="secondary"
                    indicatorColor="secondary"
                >
                    <Tabs.Item label="All" />
                    <Tabs.Item label="Active" />
                    <Tabs.Item label="Inactive" />
                </Tabs>

                <Search
                    sx={{ width: '60%' }}
                    placeholder="Search"
                    size="small"
                    onChange={(e) => setSearchValue(e.target.value)}
                />

                {/* <Table.Cell>
                            <Icon>
                                <FilterAltIcon />
                            </Icon>
                        </Table.Cell> */}

                <Button
                    variant="outlined"
                    onClick={(event) => {
                        setColumnSelectorAnchorEl(event.currentTarget);
                    }}
                    size="medium"
                    startIcon={<Menu />}
                    color="info"
                >
                    Columns
                </Button>
                <StyledPopover
                    id={'column-selector'}
                    open={Boolean(columnSelectorAnchorEl)}
                    anchorEl={columnSelectorAnchorEl}
                    onClose={() => {
                        setColumnSelectorAnchorEl(null);
                        setSearchColumnType('');
                    }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Search
                        placeholder="Search Column Type"
                        size="small"
                        onChange={(e) => {
                            setSearchColumnType(
                                e.target.value.toLocaleLowerCase().trim(),
                            );
                        }}
                    />
                    <div>
                        <Checkbox
                            label="Select All"
                            checked={jobColumns.every((col) => col.showColumn)}
                            onChange={(e, checked) => {
                                setJobColumns(
                                    jobColumns.map((col) => {
                                        return {
                                            ...col,
                                            showColumn: checked,
                                        };
                                    }),
                                );
                            }}
                        />
                    </div>
                    {/* checklist of column names here */}
                    {jobColumns.map((col, i) => {
                        return (
                            col.hideable &&
                            col.columnType
                                .toLocaleLowerCase()
                                .includes(searchColumnType) && (
                                <div>
                                    <Checkbox
                                        key={i}
                                        label={col.columnType}
                                        checked={col.showColumn}
                                        onChange={(e, checked) => {
                                            // find obejct matching col.columnType and switch col.showColumn
                                            const n = [];
                                            jobColumns.forEach((jc) => {
                                                if (
                                                    jc.columnType ===
                                                    col.columnType
                                                ) {
                                                    n.push({
                                                        ...jc,
                                                        showColumn: checked,
                                                    });
                                                } else {
                                                    n.push(jc);
                                                }
                                            });
                                            setJobColumns(n);
                                        }}
                                    />
                                </div>
                            )
                        );
                    })}
                </StyledPopover>

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    size="medium"
                    sx={{ whiteSpace: 'nowrap' }}
                    color="info"
                >
                    Add New
                </Button>
            </StyledJobActionsContainer>
            <Divider />
            <Table aria-label="collapsible table">
                <Table.Head>
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
                </Table.Head>
                <Table.Body>
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
                                setAllChecked(false);
                                setJobsToResume([]);
                                setJobsToPause([]);
                            }}
                            page={jobsPage}
                            rowsPerPage={jobsRowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setJobsRowsPerPage(Number(e.target.value));
                            }}
                            count={filterJobs(jobs).length}
                        />
                    </Table.Row>
                </Table.Footer>
            </Table>

            <Accordion
                expanded={historyExpanded}
                onChange={(e) => {
                    setHistoryExpanded(!historyExpanded);
                    //getHistory(selectedTags);
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
                        fullWidth={true}
                        placeholder="Search"
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
        </>
    );
}
