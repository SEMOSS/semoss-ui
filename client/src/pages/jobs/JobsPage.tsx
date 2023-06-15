export const JobsPage = '';
// import { Field } from '@/components/form';
// import { useAPI, useRootStore, useSettings } from '@/hooks';
// import {
//     mdiArrowDownDropCircle,
//     mdiCalendarMonth,
//     mdiClockOutline,
//     mdiPause,
//     mdiPlay,
//     mdiPlayCircleOutline,
//     mdiSquareEditOutline,
//     mdiTrashCanOutline,
// } from '@mdi/js';
// import Icon from '@mdi/react';
// import {
//     Button,
//     Checkbox,
//     Dropdown,
//     Flex,
//     Form,
//     Input,
//     Modal,
//     Select,
//     styled,
//     Table,
//     Tabs,
//     theme,
//     useNotification,
// } from '@semoss/components';
// import { useEffect, useState } from 'react';
// import { useForm } from 'react-hook-form';
// import {
//     buildBackupDatabaseQuery,
//     buildETLQuery,
//     buildSyncDatabaseQuery,
//     convertDeltaToRuntimeString,
//     convertTimeToCron,
//     convertTimetoDate,
//     convertTimeToFrequencyString,
//     convertTimeToLastRunString,
//     convertTimeToNextRunString,
//     daysOfWeek,
//     frequencyOpts,
//     getDaysOfMonth,
//     monthsOfYear,
// } from './JobsFunctions';
// import { JobData, Job, Insight } from './JobsFunctions';

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

// const jobDefaultValues = {
//     jobName: '',
//     jobTags: '',
//     // frequency stuff
//     onLoad: false,
//     customCron: false,
//     cronExpression: '',
//     frequency: 'Daily',
//     dayOfWeek: daysOfWeek[new Date().getDay()],
//     hour: '12',
//     minute: '00',
//     ampm: 'PM',
//     monthOfYear: monthsOfYear[new Date().getMonth()],
//     dayOfMonth: new Date().getDate(),
//     // export stuff
//     openExport: false,
//     fileName: '',
//     filePathChecked: false,
//     filePath: '',
//     selectedApp: '',
//     exportTemplate: '',
//     exportAudit: false,
// };

// export function JobsPage() {
//     const { adminMode } = useSettings();
//     const { configStore, monolithStore } = useRootStore();
//     const notification = useNotification();
//     const user = configStore.store.user;
//     const config = configStore.store.config;

//     const tabs = [{ value: 'all' }, { value: 'active' }, { value: 'inactive' }];

//     const [searchValue, setSearchValue] = useState('');
//     const [selectedTab, setSelectedTab] = useState('all');
//     const [ownerType, setOwnerType] = useState('All Jobs');
//     const [newJobModalSelectedTab, setNewJobModalSelectedTab] =
//         useState('job-details');
//     const [showDeleteModal, setShowDeleteModal] = useState(false);
//     const [showJobModal, setShowJobModal] = useState(false);
//     const [allChecked, setAllChecked] = useState(false);

//     const [jobs, setJobs] = useState([]);
//     const [history, setHistory] = useState([]);

//     const [allTags, setAllTags] = useState([]);
//     const [selectedJob, setSelectedJob] = useState(null);
//     const [selectedTags, setSelectedTags] = useState([]);
//     const [jobsToPause, setJobsToPause] = useState([]);
//     const [jobsToResume, setJobsToResume] = useState([]);

//     const [jobTypeTemplate, setJobTypeTemplate] = useState({});
//     const [placeholderData, setPlaceholderData] = useState([]);

//     const { data: databaseList } = useAPI(['getDatabases', adminMode]);
//     const { data: projectsList } = useAPI(['getProjects', adminMode]);
//     const [targetAppTables, setTargetAppTables] = useState([]);

//     // default values
//     const customJobDefaultValues = {
//         recipe: '',
//     };

//     const syncDatabaseJobDefaultValues = {
//         app: projectsList?.map((p) => p.project_name)[0],
//         repository: '',
//         username: '',
//         password: '',
//         dual: true,
//         syncDatabase: true,
//     };

//     const backupDatabaseJobDefaultValues = {
//         app: databaseList?.map((db) => db.app_name)[0],
//     };

//     const extractTransformLoadJobDefaultValues = {
//         sourceApp: '',
//         targetApp: '',
//         targetTable: '',
//         query: '',
//     };

//     const sendEmailJobDefaultValues = {
//         smtpHost: '',
//         smtpPort: '',
//         subject: '',
//         to: '',
//         from: '',
//         message: '',
//         username: '',
//         password: '',
//     };

//     const runInsightJobDefaultValues = {
//         app: '',
//         insight: '',
//     };

//     const { control, handleSubmit, watch, setValue, reset } = useForm<JobData>({
//         defaultValues: {
//             jobType: 'Custom Job',
//             ...jobDefaultValues,
//             ...customJobDefaultValues,
//         },
//     });

//     const buildEditJobPixel = (
//         jobId: string,
//         jobName: string,
//         jobGroup: string,
//         cronExpression: string,
//         recipe: string,
//         recipeParameters: string,
//         jobTags: string[],
//         onLoad: boolean,
//         uiState: string,
//         curJobName: string,
//         curJobGroup: string,
//     ) => {
//         let query = '';

//         query += 'EditScheduledJob(';
//         query += 'jobId=["' + jobId + '"], ';
//         query += 'jobName=["' + jobName + '"], ';
//         query += 'jobGroup=["' + jobGroup + '"], ';
//         query += 'cronExpression=["' + cronExpression + '"], ';
//         query += 'recipe=["<encode>' + recipe + '</encode>"], ';
//         if (recipeParameters) {
//             query +=
//                 'recipeParameters=["<encode>' +
//                 recipeParameters +
//                 '</encode>"], ';
//         }

//         if (jobTags && jobTags.length > 0) {
//             query += 'jobTags=["';
//             for (let i = 0; i < jobTags.length; i++) {
//                 if (i === jobTags.length - 1) {
//                     query += jobTags[i] + '"], ';
//                 } else {
//                     query += jobTags[i] + '", "';
//                 }
//             }
//         }
//         query += 'uiState=["' + uiState + '"], ';
//         query += 'triggerOnLoad=[' + onLoad + '], triggerNow=[false],';
//         query += 'curJobName=["' + curJobName + '"], ';
//         query += 'curJobGroup=["' + curJobGroup + '"]';
//         query += ')';

//         return query;
//     };

//     const scheduleJob = handleSubmit((data) => {
//         const job = { ...data };

//         const editingJob = selectedJob !== null;

//         // change frequency tag to respective object for backend
//         job.frequency = frequencyOpts.find((f) => f.human === job.frequency);

//         if (job.selectedApp.length > 0) {
//             job.selectedApp = projectsList.find(
//                 (p) => p.project_name === job.selectedApp,
//             ).project_id;
//         }

//         if (!job.customCron) {
//             job.cronExpression = convertTimeToCron(job);
//         }

//         if (job.jobTags && !Array.isArray(job.jobTags)) {
//             job.jobTags = job.jobTags.split(',');
//         }

//         if (job?.jobType !== 'Custom Job') {
//             job.recipe = jobTypeTemplate['templatePixelQuery'];
//             // if run insight and there is a paramjson, we will build the param pixel
//             if (
//                 job.jobType === 'Run Insight' &&
//                 jobTypeTemplate['paramJson']?.length > 0
//             ) {
//                 job.recipeParameters = buildInsightParamsRecipe(job);
//                 // if there is json but no pixel is generated, we have a problem. probably no value selected, so alert them.
//                 if (!job.recipeParameters) {
//                     notification.add({
//                         color: 'warning',
//                         content:
//                             'Please fill in all parameter fields before continuing.',
//                     });
//                     // we don't want to continue any further processing, so return
//                     return;
//                 }
//             } else {
//                 // normal insight--no params
//                 job.recipeParameters = '';
//             }
//         }

//         // manually add export
//         if (job.openExport) {
//             job.recipe = addExportToRecipe(job, job.recipe);
//         }

//         job.jobGroup = jobTypeTemplate['app'];
//         job.jobTypeTemplate = jobTypeTemplate;
//         job.placeholderData = placeholderData;

//         if (editingJob) {
//             job.curJobId = selectedJob.jobId;
//             job.curJobName = selectedJob.jobName;
//             job.curJobGroup = selectedJob.jobGroup;
//             job.curJobTags = selectedJob.jobTags;

//             const pixel = buildEditJobPixel(
//                 selectedJob.jobId,
//                 job.jobName,
//                 job.jobGroup,
//                 job.cronExpression,
//                 job.recipe,
//                 job.recipeParameters,
//                 job.jobTags,
//                 job.onLoad,
//                 JSON.stringify(job).replace(/"/g, '\\"'),
//                 selectedJob.jobName,
//                 selectedJob.jobGroup,
//             );
//             monolithStore.runQuery(pixel).then((response) => {
//                 const type = response.pixelReturn[0].operationType[0];
//                 if (type.indexOf('ERROR') > -1) {
//                     notification.add({
//                         color: 'error',
//                         content:
//                             'Something went wrong. Job could not be edited.',
//                     });
//                 } else {
//                     notification.add({
//                         color: 'success',
//                         content: 'Job was successfully edited.',
//                     });
//                     getJobs(true, []);
//                 }
//             });
//         } else {
//             // if this jobname already exists, notify user and exit out of function
//             if (
//                 jobs.some(
//                     (j) =>
//                         j.jobName?.toLowerCase().trim() ===
//                         job.jobName?.toLowerCase().trim(),
//                 )
//             ) {
//                 notification.add({
//                     color: 'error',
//                     content: 'Job name must be unique',
//                 });
//                 return;
//             }
//             // running the query
//             const pixel = buildScheduleJobPixel(
//                 job.jobName,
//                 job.jobGroup,
//                 job.cronExpression,
//                 job.recipe,
//                 job.recipeParameters,
//                 job.jobTags,
//                 job.onLoad,
//                 JSON.stringify(job).replace(/"/g, '\\"'),
//             );

//             // run the job
//             monolithStore.runQuery(pixel).then((response) => {
//                 const type = response.pixelReturn[0].operationType[0];
//                 if (type.indexOf('ERROR') > -1) {
//                     notification.add({
//                         color: 'error',
//                         content:
//                             'Something went wrong. Job could not be scheduled.',
//                     });
//                     return;
//                 } else {
//                     notification.add({
//                         color: 'success',
//                         content: 'Job was successfully scheduled.',
//                     });
//                     getJobs(true, []);
//                 }
//             });
//         }
//         // TODO create a reset function???
//         setSelectedTags([]);
//         reset({
//             jobType: 'Custom Job',
//             ...jobDefaultValues,
//             ...customJobDefaultValues,
//         });
//         setSelectedJob(null);
//         setPlaceholderData([]);
//         setJobTypeTemplate({});
//     });

//     const buildInsightParamsRecipe = (job) => {
//         const params = {};
//         let queryIdx;
//         let queryLen;
//         let paramIdx;
//         let paramLen;
//         const json = job.jobTypeTemplate.paramJson;
//         let pixel = '';

//         for (
//             queryIdx = 0, queryLen = json.length;
//             queryIdx < queryLen;
//             queryIdx++
//         ) {
//             for (
//                 paramIdx = 0, paramLen = json[queryIdx].params.length;
//                 paramIdx < paramLen;
//                 paramIdx++
//             ) {
//                 if (
//                     json[queryIdx].params[paramIdx].required &&
//                     ((typeof json[queryIdx].params[paramIdx].model
//                         .defaultValue === 'number' &&
//                         isNaN(
//                             json[queryIdx].params[paramIdx].model.defaultValue,
//                         )) ||
//                         (typeof json[queryIdx].params[paramIdx].model
//                             .defaultValue === 'string' &&
//                             !json[queryIdx].params[paramIdx].model
//                                 .defaultValue) ||
//                         (Array.isArray(
//                             json[queryIdx].params[paramIdx].model.defaultValue,
//                         ) &&
//                             json[queryIdx].params[paramIdx].model.defaultValue
//                                 .length === 0 &&
//                             !json[queryIdx].params[paramIdx].selectAll) ||
//                         typeof json[queryIdx].params[paramIdx].model
//                             .defaultValue === 'undefined' ||
//                         json[queryIdx].params[paramIdx].model.defaultValue ===
//                             null)
//                 ) {
//                     // can't build a proper param pixel so will return empty string
//                     return '';
//                 } else if (
//                     json[queryIdx].params[paramIdx].model.defaultValue ||
//                     json[queryIdx].params[paramIdx].model.defaultValue === 0
//                 ) {
//                     params[json[queryIdx].params[paramIdx].paramName] =
//                         json[queryIdx].params[paramIdx].model.defaultValue;
//                 }
//             }
//         }

//         jobTypeTemplate['insightParameters'] = params;

//         // use params to build pixel

//         if (Object.keys(params).length > 0) {
//             pixel += 'SetOpenInsightParamValue({';
//             for (const key in params) {
//                 if (params.hasOwnProperty(key)) {
//                     pixel += '"' + key + '": ';
//                     pixel += JSON.stringify(params[key]);
//                     pixel += ', ';
//                 }
//             }
//             // Remove last comma space (, )
//             pixel = pixel.slice(0, -2);
//             pixel += '})';
//         }

//         return pixel;
//     };

//     const addExportToRecipe = (job: Job, recipe: string) => {
//         if (!recipe) {
//             return '';
//         }

//         // TODO: get rid of this and build the full pixel on submit (instead of doing string manipulation)
//         let updated = recipe;

//         // build the pixel to export
//         const exportPixel = buildExportPixel(
//             job.fileName,
//             job.filePath,
//             job.exportTemplate,
//             job.exportAudit,
//             placeholderData,
//             [],
//             job.selectedApp,
//         );

//         if (job.jobType === 'Run Insight') {
//             // open it
//             updated = updated.slice(0, -2);

//             // add the additional pixels
//             updated += ", additionalPixels=['" + exportPixel + "']";

//             // close it
//             updated += ');';
//         } else {
//             // add to the end
//             updated += exportPixel;
//         }

//         return updated;
//     };

//     const buildExportPixel = (
//         fileName: string,
//         filePath: string,
//         exportTemplate: string,
//         exportAudit: boolean,
//         templateData: any[],
//         panelOrderIds: any[],
//         appId: string,
//     ) => {
//         let pixel = '';

//         const pixelValues = {};
//         let keys = [];
//         if (fileName.length > 0) {
//             pixelValues['fileName'] = fileName;
//         }
//         if (filePath.length > 0) {
//             pixelValues['filePath'] = filePath;
//         }
//         if (exportTemplate?.length > 0) {
//             pixelValues['export_template'] = exportTemplate;
//             pixelValues['placeHolderData'] = templateData;
//             pixelValues['project'] = appId;
//         }
//         pixelValues['exportAudit'] = `${exportAudit}`;

//         if (panelOrderIds?.length > 0) {
//             pixelValues['panelOrderIds'] = panelOrderIds;
//         }
//         keys = Object.keys(pixelValues);

//         pixel += 'ExportToExcel(';

//         for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
//             if (keyIdx !== 0) {
//                 // Add a comma before each query parameter except the first one
//                 pixel += ', ';
//             }
//             pixel += `${keys[keyIdx]}=[${JSON.stringify(
//                 pixelValues[keys[keyIdx]],
//             )}]`;
//         }
//         pixel += ')';

//         return pixel;
//     };

//     const buildScheduleJobPixel = (
//         jobName: string,
//         jobGroup: string,
//         cronExpression: string,
//         recipe: string,
//         recipeParameters: string,
//         jobTags: string[],
//         onLoad: boolean, // boolean or string?
//         uiState: string,
//     ) => {
//         let query = '';

//         query += 'ScheduleJob(';
//         query += 'jobName=["' + jobName + '"], ';
//         query += 'jobGroup=["' + jobGroup + '"], ';
//         query += 'cronExpression=["' + cronExpression + '"], ';
//         query += 'recipe=["<encode>' + recipe + '</encode>"], ';
//         if (recipeParameters) {
//             query +=
//                 'recipeParameters=["<encode>' +
//                 recipeParameters +
//                 '</encode>"], ';
//         }

//         if (jobTags && jobTags.length > 0) {
//             query += 'jobTags=["';
//             for (let i = 0; i < jobTags.length; i++) {
//                 if (i === jobTags.length - 1) {
//                     query += jobTags[i] + '"], ';
//                 } else {
//                     query += jobTags[i] + '", "';
//                 }
//             }
//         }
//         query += 'uiState=["' + uiState + '"], ';
//         query += 'triggerOnLoad=[' + onLoad + '], triggerNow=[false]';
//         query += ')';

//         return query;
//     };

//     const jobName = watch('jobName');
//     const jobType = watch('jobType');
//     const customCron = watch('customCron');
//     const frequency = watch('frequency');
//     const monthOfYear = watch('monthOfYear');
//     const openExport = watch('openExport');
//     const project = watch('app');
//     const targetApp = watch('targetApp');
//     const selectedApp = watch('selectedApp');
//     const exportTemplate = watch('exportTemplate');

//     const [insights, setInsights] = useState<Insight[]>([]);
//     const [templates, setTemplates] = useState([]);

//     useEffect(() => {
//         if (jobType === 'Run Insight' && project && projectsList) {
//             const projectId = projectsList.find(
//                 (p) => p.project_name === project,
//             )?.project_id;
//             getInsights(projectId);
//         }
//     }, [project, projectsList]);

//     useEffect(() => {
//         if (exportTemplate?.length > 0) {
//             getPlaceholderData(exportTemplate);
//         }
//     }, [exportTemplate]);

//     const getPlaceholderData = (templateName: string) => {
//         let query = '';

//         const projectId = projectsList.find(
//             (p) => p.project_name === selectedApp,
//         )?.project_id;
//         if (projectId && templateName) {
//             query +=
//                 'GetPlaceHolders(project=["' +
//                 projectId +
//                 '"], template_name=["' +
//                 templateName +
//                 '"])';
//         } else if (templateName) {
//             query += 'GetPlaceHolders(template_name=["' + templateName + '"]))';
//         } else {
//             query += 'GetPlaceHolders()';
//         }
//         monolithStore.runQuery(query).then((response) => {
//             const type = response.pixelReturn[0].operationType[0];
//             if (type.indexOf('ERROR') > -1) {
//                 notification.add({
//                     color: 'error',
//                     content: 'Placeholder Data could not be retrieved.',
//                 });
//             } else {
//                 setPlaceholderData(response.pixelReturn[0].output);
//             }
//         });
//     };

//     const getInsights = (projectId: string) => {
//         const pixel = `META|GetInsights(project=["${projectId}"], limit=["50"], offset=["0"])`;
//         monolithStore.runQuery(pixel).then((response) => {
//             const type = response.pixelReturn[0].operationType[0];
//             if (type.indexOf('ERROR') > -1) {
//                 notification.add({
//                     color: 'error',
//                     content: `Something went wrong. Insights for project ID ${projectId} could not be retrieved.`,
//                 });
//             } else {
//                 const insights = response.pixelReturn[0].output;
//                 setInsights(insights as Insight[]);
//             }
//         });
//     };

//     const getJobs = (setTags: boolean, jobTags: string[]) => {
//         let pixel = 'META|ListAllJobs(';
//         if (jobTags.length > 0) {
//             pixel += 'jobTags=["';
//             for (let i = 0; i < jobTags.length; i++) {
//                 pixel +=
//                     i === jobTags.length - 1
//                         ? jobTags[i] + '"] '
//                         : jobTags[i] + '", "';
//             }
//         }
//         pixel += ')';
//         monolithStore.runQuery(pixel).then((response) => {
//             const type = response.pixelReturn[0].operationType[0];

//             if (type.indexOf('ERROR') > -1) {
//                 notification.add({
//                     color: 'error',
//                     content:
//                         'Something went wrong. Jobs could not be retrieved.',
//                 });
//             } else {
//                 // jobs is a map or maps
//                 // where the jobId is a unique id of the job inputs
//                 const jobs = response.pixelReturn[0].output;

//                 const allJobs = [];
//                 const allTags = [];
//                 for (const jobId in jobs as any) {
//                     if (jobs.hasOwnProperty(jobId)) {
//                         const job = jobs[jobId];
//                         if (job.hasOwnProperty('uiState')) {
//                             // Parse the job back from the stringified version
//                             const jobJson = JSON.parse(
//                                 job.uiState.replace(/\\"/g, "'"),
//                             );

//                             // Also, need to decode the recipe again
//                             // jobJson.recipe = decodeURIComponent(jobJson.recipe);
//                             jobJson.checked = false;
//                             job.hasOwnProperty('PREV_FIRE_TIME')
//                                 ? (jobJson.PREV_FIRE_TIME = job.PREV_FIRE_TIME)
//                                 : (jobJson.PREV_FIRE_TIME = '');
//                             job.hasOwnProperty('NEXT_FIRE_TIME')
//                                 ? (jobJson.NEXT_FIRE_TIME = job.NEXT_FIRE_TIME)
//                                 : (jobJson.NEXT_FIRE_TIME = '');
//                             job.hasOwnProperty('USER_ID')
//                                 ? (jobJson.USER_ID = job.USER_ID)
//                                 : (jobJson.USER_ID = '');
//                             job.hasOwnProperty('jobId')
//                                 ? (jobJson.jobId = job.jobId)
//                                 : (jobJson.jobId = '');

//                             // Temporary fix while we wait for the backend to update jobType from 'Sync App'/'Sync Project'/'Backup App'/'Backup Project' to 'Sync Database'/'Backup Database'.
//                             // TODO: Remove this if / else if section once backend is updated
//                             if (jobJson.jobType.startsWith('Backup')) {
//                                 jobJson.jobType = 'Backup Database';
//                             } else if (jobJson.jobType.startsWith('Sync')) {
//                                 jobJson.jobType = 'Sync Database';
//                             }

//                             if (
//                                 job.jobGroup === 'undefined' &&
//                                 jobJson.jobType !== 'Custom Job' &&
//                                 jobJson.jobType !== 'Send Email'
//                             ) {
//                                 // legacy database-related job
//                                 if (
//                                     jobJson.jobTypeTemplate.hasOwnProperty(
//                                         'app',
//                                     )
//                                 ) {
//                                     jobJson.jobGroup =
//                                         jobJson.jobTypeTemplate.app; // grab db name from jobJson
//                                 }
//                             }

//                             jobJson.jobTags = '';
//                             if (
//                                 job.hasOwnProperty('jobTags') &&
//                                 job.jobTags.length > 0
//                             ) {
//                                 jobJson.jobTags = job.jobTags;

//                                 // add the tags
//                                 if (setTags) {
//                                     const tags = jobJson.jobTags.split(',');
//                                     for (
//                                         let tagIdx = 0, tagLen = tags.length;
//                                         tagIdx < tagLen;
//                                         tagIdx++
//                                     ) {
//                                         const tag = tags[tagIdx];

//                                         if (tag && !allTags.includes(tag)) {
//                                             allTags.push(tags[tagIdx]);
//                                         }
//                                     }
//                                 }
//                             }

//                             allJobs.push(jobJson);
//                         } else {
//                             job.checked = false;
//                             allJobs.push(job);
//                         }
//                     }
//                 }

//                 setJobs(allJobs);

//                 if (setTags) {
//                     setAllTags(allTags);
//                 }
//             }
//         });
//     };

//     const getHistory = (jobTags: string[]) => {
//         let pixel = 'META|SchedulerHistory(';
//         if (jobTags.length > 0) {
//             pixel += 'jobTags=["';
//             for (let i = 0; i < jobTags.length; i++) {
//                 pixel +=
//                     i === jobTags.length - 1
//                         ? jobTags[i] + '"] '
//                         : jobTags[i] + '", "';
//             }
//         }
//         pixel += ')';
//         monolithStore.runQuery(pixel).then((response) => {
//             const type = response.pixelReturn[0].operationType[0];
//             if (type.indexOf('ERROR') > -1) {
//                 notification.add({
//                     color: 'error',
//                     content:
//                         'Something went wrong. Job history could not be retrieved.',
//                 });
//             } else {
//                 // map the headers
//                 const historyData = [];
//                 const output = response.pixelReturn[0].output;
//                 const headers = {};
//                 //let uniqueJobNames = []; // list of job names
//                 for (
//                     let headerIdx = 0,
//                         headerLen = output['data'].headers.length;
//                     headerIdx < headerLen;
//                     headerIdx++
//                 ) {
//                     headers[output['data'].headers[headerIdx]] = headerIdx;
//                 }

//                 for (
//                     let valueIdx = 0, valueLen = output['data'].values.length;
//                     valueIdx < valueLen;
//                     valueIdx++
//                 ) {
//                     // Excluding the jobs that have not ran even once from history
//                     if (
//                         output['data'].values[valueIdx][headers['SUCCESS']] !==
//                         null
//                     ) {
//                         const job = {
//                             jobId: headers.hasOwnProperty('JOB_ID')
//                                 ? output['data'].values[valueIdx][
//                                       headers['JOB_ID']
//                                   ]
//                                 : '',
//                             jobName: headers.hasOwnProperty('JOB_NAME')
//                                 ? output['data'].values[valueIdx][
//                                       headers['JOB_NAME']
//                                   ]
//                                 : '',
//                             jobGroup: headers.hasOwnProperty('JOB_GROUP')
//                                 ? output['data'].values[valueIdx][
//                                       headers['JOB_GROUP']
//                                   ]
//                                 : '',
//                             execStart:
//                                 headers.hasOwnProperty('EXECUTION_START') &&
//                                 output['data'].values[valueIdx][
//                                     headers['EXECUTION_START']
//                                 ]
//                                     ? convertTimetoDate(
//                                           output['data'].values[valueIdx][
//                                               headers['EXECUTION_START']
//                                           ],
//                                       )
//                                     : '',
//                             execEnd: headers.hasOwnProperty('EXECUTION_END')
//                                 ? output['data'].values[valueIdx][
//                                       headers['EXECUTION_END']
//                                   ]
//                                 : '',
//                             execDelta: headers.hasOwnProperty('EXECUTION_DELTA')
//                                 ? convertDeltaToRuntimeString(
//                                       output['data'].values[valueIdx][
//                                           headers['EXECUTION_DELTA']
//                                       ],
//                                   )
//                                 : '',
//                             // Success will have 2 types of values True means passed and False means failed.
//                             success: headers.hasOwnProperty('SUCCESS')
//                                 ? output['data'].values[valueIdx][
//                                       headers['SUCCESS']
//                                   ]
//                                 : '',
//                             // appName: headers.hasOwnProperty('APP_NAME') ? output['data'].values[valueIdx][headers.APP_NAME] : '',
//                             jobTags: headers.hasOwnProperty('JOB_TAG')
//                                 ? output['data'].values[valueIdx][
//                                       headers['JOB_TAG']
//                                   ]
//                                 : '',
//                             // capture the latest record based on the IS_LATEST field stored
//                             isLatest: headers.hasOwnProperty('IS_LATEST')
//                                 ? output['data'].values[valueIdx][
//                                       headers['IS_LATEST']
//                                   ]
//                                 : false,
//                         };

//                         historyData.push(job);
//                     }
//                 }
//                 setHistory(historyData);
//             }
//         });
//     };

//     const deleteJob = (jobId, jobGroup) => {
//         let pixel = 'META | RemoveJobFromDB(';
//         pixel += 'jobId=["' + jobId + '"], ';
//         pixel += 'jobGroup=["' + jobGroup + '"]) ';
//         monolithStore.runQuery(pixel).then((response) => {
//             const type = response.pixelReturn[0].operationType;
//             const output = response.pixelReturn[0].output;
//             if (type.indexOf('ERROR') === -1) {
//                 notification.add({
//                     color: 'success',
//                     content: `Successfully deleted ${type}`,
//                 });
//                 setShowDeleteModal(false);
//                 setSelectedJob(null);
//                 getJobs(true, []);
//                 setSelectedTags([]);
//             } else {
//                 notification.add({
//                     color: 'error',
//                     content: output,
//                 });
//             }
//         });
//     };

//     const executeJob = (jobId: string, jobGroup: string) => {
//         let pixel = 'META | ExecuteScheduledJob(';
//         pixel += 'jobId=["' + jobId + '"], ';
//         pixel += 'jobGroup=["' + jobGroup + '"]) ';

//         monolithStore.runQuery(pixel).then((response) => {
//             const type = response.pixelReturn[0].operationType;
//             const output = response.pixelReturn[0].output;
//             if (type.indexOf('ERROR') === -1) {
//                 notification.add({
//                     color: 'success',
//                     content: `Job was executed`,
//                 });
//             } else {
//                 notification.add({
//                     color: 'error',
//                     content: output,
//                 });
//             }
//         });
//     };

//     function setParameterizedInsight(viewOptionsMap) {
//         if (viewOptionsMap.json && viewOptionsMap.json.length > 0) {
//             viewOptionsMap.json[0].execute = '';
//             jobTypeTemplate['paramJson'] = viewOptionsMap.json;
//             fillExistingParameters(viewOptionsMap.json);
//         }
//     }

//     function fillExistingParameters(json) {
//         if (Object.keys(jobTypeTemplate['insightParameters']).length > 0) {
//             let queryIdx, queryLen, paramIdx, paramLen;
//             for (
//                 queryIdx = 0, queryLen = json.length;
//                 queryIdx < queryLen;
//                 queryIdx++
//             ) {
//                 for (
//                     paramIdx = 0, paramLen = json[queryIdx].params.length;
//                     paramIdx < paramLen;
//                     paramIdx++
//                 ) {
//                     if (
//                         jobTypeTemplate['insightParameters'].hasOwnProperty(
//                             json[queryIdx].params[paramIdx].paramName,
//                         )
//                     ) {
//                         // updating the default value with previously selected values during edit
//                         json[queryIdx].params[paramIdx].model.defaultValue =
//                             jobTypeTemplate['insightParameters'][
//                                 json[queryIdx].params[paramIdx].paramName
//                             ];
//                     }
//                 }
//             }
//         }
//     }

//     const setInsightParametersIfExists = (insight: Insight) => {
//         const query = `META|IsInsightParameterized(project=["${insight.app_id}"], id=["${insight.app_insight_id}"]);`;
//         monolithStore.runQuery(query).then((response) => {
//             const type = response.pixelReturn[0].operationType;
//             if (type.indexOf('ERROR') === -1) {
//                 const output = response.pixelReturn[0].output;
//                 if (output['hasParameter']) {
//                     setParameterizedInsight(output['viewOptionsMap']);
//                 } else {
//                     setJobTypeTemplate({
//                         ...jobTypeTemplate,
//                         insight: {
//                             app_insight_id: insight.app_insight_id,
//                             name: insight.name,
//                         },
//                         insightParameters: {},
//                     });
//                 }
//             } else {
//                 notification.add({
//                     color: 'error',
//                     content: response.pixelReturn[0].output,
//                 });
//             }
//         });
//     };

//     const resumeJobs = () => {
//         // iterate through jobsToResume and build pixel string
//         let pixel = '';
//         jobsToResume.forEach(
//             (job) =>
//                 (pixel += `ResumeJobTrigger(jobId=["${job.jobId}"], jobGroup=["${job.jobGroup}"] );`),
//         );
//         // run pixel
//         monolithStore.runQuery(pixel).then((response) => {
//             const type = response.pixelReturn[0].operationType;
//             const output = response.pixelReturn[0].output;
//             if (type.indexOf('ERROR') === -1) {
//                 notification.add({
//                     color: 'success',
//                     content: `Jobs are resumed`,
//                 });
//                 getJobs(false, []);
//                 setJobsToResume([]);
//                 setSelectedTags([]);
//                 setAllChecked(false);
//             } else {
//                 notification.add({
//                     color: 'error',
//                     content: output,
//                 });
//             }
//         });
//     };

//     const pauseJobs = () => {
//         let pixel = '';
//         jobsToPause.forEach(
//             (job) =>
//                 (pixel += `PauseJobTrigger(jobId=["${job.jobId}"], jobGroup=["${job.jobGroup}"] );`),
//         );
//         monolithStore.runQuery(pixel).then((response) => {
//             const type = response.pixelReturn[0].operationType;
//             const output = response.pixelReturn[0].output;
//             if (type.indexOf('ERROR') === -1) {
//                 notification.add({
//                     color: 'success',
//                     content: `Jobs are paused`,
//                 });
//                 getJobs(false, []);
//                 setJobsToPause([]);
//                 setSelectedTags([]);
//                 setAllChecked(false);
//             } else {
//                 notification.add({
//                     color: 'error',
//                     content: output,
//                 });
//             }
//         });
//     };

//     const filterJobs = (jobs: any[]) => {
//         return jobs
//             .filter((job) => {
//                 return searchValue.length > 0
//                     ? job.jobName
//                           .toLowerCase()
//                           .includes(searchValue.toLowerCase())
//                     : true;
//             })
//             .filter((job) => {
//                 switch (selectedTab) {
//                     case 'active':
//                         return job.NEXT_FIRE_TIME !== 'INACTIVE';
//                     case 'inactive':
//                         return job.NEXT_FIRE_TIME === 'INACTIVE';
//                     default:
//                         return true;
//                 }
//             })
//             .filter((job) => {
//                 return ownerType === 'All Jobs'
//                     ? true
//                     : job.USER_ID === user.id;
//             });
//     };

//     const getTargetDatabaseTables = (databaseId: string) => {
//         const query = `GetDatabaseMetamodel ( database = [ '${databaseId}' ] ) ;`;
//         monolithStore.runQuery(query).then((response) => {
//             const type = response.pixelReturn[0].operationType[0];
//             if (type.indexOf('ERROR') > -1) {
//                 notification.add({
//                     color: 'error',
//                     content:
//                         'Something went wrong. Could not retrieve target app tables.',
//                 });
//             } else {
//                 const data = response.pixelReturn[0].output;
//                 setTargetAppTables(
//                     data['nodes'].map((node) => node['conceptualName']),
//                 );
//             }
//         });
//     };

//     const getProjectTemplates = (projectId: string) => {
//         const pixel = `META|GetTemplateList(project=["${projectId}"]);`;
//         monolithStore.runQuery(pixel).then((response) => {
//             const type = response.pixelReturn[0].operationType[0];
//             if (type.indexOf('ERROR') > -1) {
//                 notification.add({
//                     color: 'error',
//                     content:
//                         'Something went wrong. Could not retrieve templates.',
//                 });
//             } else {
//                 const data = response.pixelReturn[0].output;
//                 const templates = [];
//                 for (const templateName in data) {
//                     if (templateName) {
//                         templates.push({
//                             templateType: 'Custom template',
//                             templateName: templateName,
//                             filename: data[templateName],
//                             templateGroup: selectedApp,
//                         });
//                     }
//                 }
//                 setTemplates(templates);
//             }
//         });
//     };

//     useEffect(() => {
//         // initial render to get all jobs
//         getJobs(true, selectedTags);
//     }, []);

//     useEffect(() => {
//         if (showJobModal && !selectedJob) {
//             setJobTypeTemplate({});
//             setPlaceholderData([]);
//             reset({
//                 jobType: 'Custom Job',
//                 ...jobDefaultValues,
//                 ...customJobDefaultValues,
//             });
//         } else if (showJobModal && selectedJob) {
//             // populate the fields with the selected job data
//             setValue('jobName', selectedJob.jobName);
//             setValue('jobType', selectedJob.jobType);
//             setValue('jobTags', selectedJob.jobTags);
//             setValue('onLoad', selectedJob.onLoad);
//             setValue('customCron', selectedJob.customCron);
//             setValue('cronExpression', selectedJob.cronExpression);
//             setValue('frequency', selectedJob.frequency.human);
//             setValue('dayOfWeek', selectedJob.dayOfWeek);
//             setValue('hour', selectedJob.hour);
//             setValue('minute', selectedJob.minute);
//             setValue('ampm', selectedJob.ampm);
//             setValue('monthOfYear', selectedJob.monthOfYear);
//             setValue('dayOfMonth', selectedJob.dayOfMonth);
//             setValue('openExport', selectedJob.openExport);
//             setValue('fileName', selectedJob.fileName);
//             setValue('filePathChecked', selectedJob.filePath?.length > 0);
//             setValue('exportTemplate', selectedJob.exportTemplate);
//             setValue('exportAudit', selectedJob.exportAudit);
//             if (selectedJob.selectedApp) {
//                 setValue(
//                     'selectedApp',
//                     selectedJob.selectedApp.length > 0
//                         ? projectsList.find(
//                               (p) => p.project_id === selectedJob.selectedApp,
//                           )?.project_name
//                         : '',
//                 );
//             }

//             const template = selectedJob.jobTypeTemplate;
//             switch (selectedJob.jobType) {
//                 case 'Custom Job':
//                     setValue('recipe', selectedJob.recipe);
//                     break;
//                 case 'Backup Database':
//                     setValue(
//                         'app',
//                         databaseList.find((db) => db.app_id === template.app)
//                             .app_name,
//                     );
//                     setJobTypeTemplate(template);
//                     break;
//                 case 'Sync Database':
//                     setValue(
//                         'app',
//                         projectsList.find((p) => p.project_id === template.app)
//                             .project_name,
//                     );
//                     setValue('repository', template.repository);
//                     setValue('username', template.username);
//                     setValue('password', template.password);
//                     setValue('dual', template.dual);
//                     setValue('syncDatabase', template.syncDatabase);
//                     setJobTypeTemplate(template);
//                     break;
//                 case 'Extract Transform Load':
//                     setValue(
//                         'sourceApp',
//                         databaseList.find(
//                             (db) => db.app_id === template.sourceApp,
//                         )?.app_name,
//                     );
//                     setValue(
//                         'targetApp',
//                         databaseList.find(
//                             (db) => db.app_id === template.targetApp,
//                         )?.app_name,
//                     );
//                     setValue('targetTable', template.targetTable);
//                     setValue('query', template.query);
//                     setJobTypeTemplate(template);
//                     break;
//                 case 'Send Email':
//                     setValue('smtpHost', selectedJob.smtpHost);
//                     setValue('smtpPort', selectedJob.smtpPort);
//                     setValue('subject', selectedJob.subject);
//                     setValue('to', selectedJob.to);
//                     setValue('from', selectedJob.from);
//                     setValue('message', selectedJob.message);
//                     setValue('username', selectedJob.username);
//                     setValue('password', selectedJob.password);
//                     setJobTypeTemplate(template);
//                     break;
//                 case 'Run Insight':
//                     setValue(
//                         'app',
//                         projectsList.find((p) => p.project_id === template.app)
//                             .project_name,
//                     );
//                     setValue('insight', template.insight.name);
//                     setJobTypeTemplate(template);
//                     break;
//                 default:
//                     break;
//             }
//         }
//     }, [showJobModal]);

//     useEffect(() => {
//         if (selectedTab === 'history') {
//             getHistory(selectedTags);
//         }
//         setJobsToResume([]);
//         setJobsToPause([]);
//         setAllChecked(false);
//     }, [selectedTab]);

//     useEffect(() => {
//         if (targetApp) {
//             getTargetDatabaseTables(
//                 databaseList.find((db) => db.app_name === targetApp).app_id,
//             );
//         }
//     }, [targetApp]);

//     useEffect(() => {
//         if (selectedApp) {
//             getProjectTemplates(
//                 projectsList.find((p) => p.project_name === selectedApp)
//                     .project_id,
//             );
//         }
//     }, [selectedApp]);

//     useEffect(() => {
//         if (!selectedJob) {
//             switch (jobType) {
//                 case 'Custom Job':
//                     // job template doesnt need to be updated
//                     break;
//                 case 'Backup Database':
//                     setJobTypeTemplate({
//                         app: databaseList[0].app_id,
//                         templatePixelQuery: buildBackupDatabaseQuery(
//                             databaseList[0].app_id,
//                         ),
//                     });
//                     break;
//                 case 'Sync Database':
//                     let syncAppQuery = 'SyncApp(';

//                     syncAppQuery +=
//                         "app=['" + projectsList[0].project_id + "'], ";
//                     syncAppQuery += "repository=[''], ";
//                     syncAppQuery += "username=[''], ";
//                     syncAppQuery += "password=[''], ";
//                     syncAppQuery += "dual=['true'], ";
//                     syncAppQuery += "syncDatabase=['true']);";
//                     setJobTypeTemplate({
//                         app: projectsList[0].project_id,
//                         dual: true,
//                         syncDatabase: true,
//                         repository: '',
//                         username: '',
//                         password: '',
//                         templatePixelQuery: syncAppQuery,
//                     });
//                     break;
//                 default:
//                     break;
//             }
//         }
//     }, [jobType]);

//     // build the queries for respective job types
//     useEffect(() => {
//         if (jobType) {
//             switch (jobType) {
//                 case 'Custom Job':
//                     // job template doesnt need to be updated
//                     break;
//                 case 'Backup Database':
//                     jobTypeTemplate['templatePixelQuery'] =
//                         buildBackupDatabaseQuery(jobTypeTemplate['app']);
//                     break;
//                 case 'Sync Database':
//                     jobTypeTemplate['templatePixelQuery'] =
//                         buildSyncDatabaseQuery(
//                             jobTypeTemplate['app'],
//                             jobTypeTemplate['repository'],
//                             jobTypeTemplate['username'],
//                             jobTypeTemplate['password'],
//                             jobTypeTemplate['dual'],
//                             jobTypeTemplate['syncDatabase'],
//                         );
//                     break;
//                 case 'Extract Transform Load':
//                     jobTypeTemplate['templatePixelQuery'] = buildETLQuery(
//                         jobTypeTemplate['sourceApp'],
//                         jobTypeTemplate['query'],
//                         jobTypeTemplate['targetApp'],
//                         jobTypeTemplate['targetTable'],
//                     );
//                     break;
//                 case 'Send Email':
//                     let sendEmailQuery = 'SendEmail(';

//                     const splitTo = jobTypeTemplate['to']?.split(';');

//                     sendEmailQuery +=
//                         "smtpHost=['" + jobTypeTemplate['smtpHost'] + "'], ";
//                     sendEmailQuery +=
//                         "smtpPort=['" + jobTypeTemplate['smtpPort'] + "'], ";
//                     sendEmailQuery +=
//                         "subject=['" + jobTypeTemplate['subject'] + "'], ";
//                     sendEmailQuery += 'to=[';

//                     if (splitTo) {
//                         for (let i = 0; i < splitTo.length; i++) {
//                             sendEmailQuery += "'" + splitTo[i].trim() + "'";

//                             if (i !== jobTypeTemplate['to'].length - 1) {
//                                 sendEmailQuery += ',';
//                             }
//                         }
//                     }

//                     sendEmailQuery += '], ';
//                     sendEmailQuery +=
//                         "from=['" + jobTypeTemplate['from'] + "'], ";
//                     sendEmailQuery +=
//                         "message=['" + jobTypeTemplate['message'] + "'], ";
//                     sendEmailQuery +=
//                         "username=['" + jobTypeTemplate['username'] + "'], ";
//                     sendEmailQuery +=
//                         "password=['" + jobTypeTemplate['password'] + "']);";

//                     jobTypeTemplate['templatePixelQuery'] = sendEmailQuery;
//                     break;
//                 case 'Run Insight':
//                     // TODO insight parameters?
//                     const insightQuery = `OpenInsight(app=['${jobTypeTemplate['app']}'], id=['${jobTypeTemplate['insight']?.['app_insight_id']}']);`;
//                     jobTypeTemplate['templatePixelQuery'] = insightQuery;
//                     break;
//                 default:
//                     break;
//             }
//         }
//     }, [jobTypeTemplate]);

//     return (
//         <StyledContainer>
//             <Flex gap={'$4'}>
//                 <Flex direction={'column'} gap={'$2'} style={{ width: '100%' }}>
//                     <label
//                         style={{
//                             display: 'flex',
//                             flexDirection: 'column',
//                             columnGap: '20px',
//                             width: '100%',
//                         }}
//                     >
//                         Search:
//                     </label>
//                     <Input
//                         onChange={(e) => {
//                             setSearchValue(e);
//                         }}
//                         valid
//                         value={searchValue}
//                         placeholder="Search job name..."
//                     />
//                 </Flex>
//                 <Flex direction={'column'} gap={'$2'} style={{ width: '100%' }}>
//                     <label
//                         style={{
//                             width: '100%',
//                         }}
//                     >
//                         Tags:
//                     </label>
//                     <Select
//                         multiple
//                         onChange={(e: string[]) => {
//                             getJobs(false, e);
//                             setSelectedTags(e);
//                         }}
//                         options={allTags}
//                         placeholder="Select Job Tag"
//                         value={selectedTags}
//                     />
//                 </Flex>
//             </Flex>
//             <Tabs
//                 onChange={(e) => {
//                     setSelectedTab(e);
//                 }}
//                 value={selectedTab}
//             >
//                 <Tabs.List
//                     style={{
//                         justifyContent: 'space-between',
//                         width: '100%',
//                         marginBottom: '5px',
//                     }}
//                 >
//                     <Flex>
//                         <Tabs.Trigger disabled={false} value="all">
//                             All
//                         </Tabs.Trigger>
//                         <Tabs.Trigger disabled={false} value="active">
//                             Active
//                         </Tabs.Trigger>
//                         <Tabs.Trigger disabled={false} value="inactive">
//                             Inactive
//                         </Tabs.Trigger>
//                         <Tabs.Trigger disabled={false} value="history">
//                             History
//                         </Tabs.Trigger>
//                     </Flex>
//                     <Flex gap={'$2'}>
//                         {jobsToResume.length > 0 && (
//                             <Button
//                                 prepend={
//                                     <StyledHeaderIcon
//                                         path={mdiPlayCircleOutline}
//                                     />
//                                 }
//                                 onClick={() => {
//                                     resumeJobs();
//                                 }}
//                             >
//                                 Resume Jobs
//                             </Button>
//                         )}
//                         {jobsToPause.length > 0 && (
//                             <Button
//                                 prepend={<StyledHeaderIcon path={mdiPause} />}
//                                 onClick={() => {
//                                     pauseJobs();
//                                 }}
//                             >
//                                 Pause Jobs
//                             </Button>
//                         )}
//                     </Flex>
//                 </Tabs.List>
//                 {tabs.map((tab, i) => {
//                     return (
//                         <Tabs.Content value={tab.value} key={i}>
//                             <Table>
//                                 <Table.Head>
//                                     <Table.Row>
//                                         <Table.Cell
//                                             title="check-all"
//                                             style={{
//                                                 width: '3rem',
//                                             }}
//                                         >
//                                             <Checkbox
//                                                 value={allChecked}
//                                                 onChange={(e) => {
//                                                     setAllChecked(e);
//                                                     if (e) {
//                                                         // add all these jobs to resume jobs
//                                                         setJobsToResume(
//                                                             filterJobs(
//                                                                 jobs,
//                                                             ).filter(
//                                                                 (j) =>
//                                                                     j.NEXT_FIRE_TIME ===
//                                                                     'INACTIVE',
//                                                             ),
//                                                         );
//                                                         // add all these jobs to pause jobs
//                                                         setJobsToPause(
//                                                             filterJobs(
//                                                                 jobs,
//                                                             ).filter(
//                                                                 (j) =>
//                                                                     j.NEXT_FIRE_TIME !==
//                                                                     'INACTIVE',
//                                                             ),
//                                                         );
//                                                     } else {
//                                                         // remove all these jobs to resume jobs
//                                                         const removeFromResume =
//                                                             filterJobs(
//                                                                 jobs,
//                                                             ).filter(
//                                                                 (j) =>
//                                                                     j.NEXT_FIRE_TIME ===
//                                                                     'INACTIVE',
//                                                             );
//                                                         setJobsToResume(
//                                                             (prev) =>
//                                                                 prev.filter(
//                                                                     (p) =>
//                                                                         !removeFromResume.some(
//                                                                             (
//                                                                                 e,
//                                                                             ) =>
//                                                                                 e.jobId !==
//                                                                                 p.jobId,
//                                                                         ),
//                                                                 ),
//                                                         );

//                                                         // remove all these jobs to pause jobs
//                                                         const removeFromPause =
//                                                             filterJobs(
//                                                                 jobs,
//                                                             ).filter(
//                                                                 (j) =>
//                                                                     j.NEXT_FIRE_TIME !==
//                                                                     'INACTIVE',
//                                                             );

//                                                         setJobsToPause((prev) =>
//                                                             prev.filter(
//                                                                 (p) =>
//                                                                     !removeFromPause.some(
//                                                                         (e) =>
//                                                                             e.jobId !==
//                                                                             p.jobId,
//                                                                     ),
//                                                             ),
//                                                         );
//                                                     }
//                                                 }}
//                                             />
//                                         </Table.Cell>
//                                         <Table.Cell
//                                             title="name"
//                                             style={{
//                                                 width: '15%',
//                                             }}
//                                         >
//                                             Name
//                                         </Table.Cell>
//                                         <Table.Cell
//                                             title="type"
//                                             style={{
//                                                 width: '10%',
//                                             }}
//                                         >
//                                             Type
//                                         </Table.Cell>
//                                         <Table.Cell
//                                             title="frequency"
//                                             style={{
//                                                 width: '20%',
//                                             }}
//                                         >
//                                             Frequency
//                                         </Table.Cell>
//                                         <Table.Cell
//                                             title="job-tags"
//                                             style={{
//                                                 width: '10%',
//                                             }}
//                                         >
//                                             Job Tags
//                                         </Table.Cell>
//                                         <Table.Cell
//                                             title="last-run"
//                                             style={{
//                                                 width: '20%',
//                                             }}
//                                         >
//                                             Last Run
//                                         </Table.Cell>
//                                         <Table.Cell
//                                             title="next-run"
//                                             style={{
//                                                 width: '20%',
//                                             }}
//                                         >
//                                             Next Run
//                                         </Table.Cell>
//                                         <Table.Cell
//                                             title="owner"
//                                             style={{
//                                                 width: '10%',
//                                             }}
//                                         >
//                                             Owner
//                                             <Dropdown>
//                                                 <Dropdown.Trigger>
//                                                     <Button
//                                                         prepend={
//                                                             <StyledHeaderIcon
//                                                                 path={
//                                                                     mdiArrowDownDropCircle
//                                                                 }
//                                                             />
//                                                         }
//                                                         variant="text"
//                                                         size="sm"
//                                                     />
//                                                 </Dropdown.Trigger>
//                                                 <Dropdown.Content>
//                                                     <Dropdown.Item
//                                                         onSelect={() => {
//                                                             setOwnerType(
//                                                                 'All Jobs',
//                                                             );
//                                                         }}
//                                                     >
//                                                         All Jobs
//                                                     </Dropdown.Item>
//                                                     <Dropdown.Item
//                                                         onSelect={() => {
//                                                             setOwnerType(
//                                                                 'My Jobs',
//                                                             );
//                                                         }}
//                                                     >
//                                                         My Jobs
//                                                     </Dropdown.Item>
//                                                 </Dropdown.Content>
//                                             </Dropdown>
//                                         </Table.Cell>
//                                         <Table.Cell
//                                             title="actions"
//                                             style={{
//                                                 width: '6.5rem',
//                                             }}
//                                         />
//                                     </Table.Row>
//                                 </Table.Head>
//                                 <Table.Body>
//                                     {filterJobs(jobs).length === 0 ? (
//                                         <Table.Row
//                                             style={{
//                                                 columnSpan: 'all',
//                                             }}
//                                         >
//                                             <Table.Cell>
//                                                 <span>
//                                                     No jobs, please try again.
//                                                 </span>
//                                             </Table.Cell>
//                                         </Table.Row>
//                                     ) : (
//                                         filterJobs(jobs).map((job, i) => {
//                                             return (
//                                                 <Table.Row key={i}>
//                                                     <Table.Cell>
//                                                         <Checkbox
//                                                             value={
//                                                                 jobsToResume.some(
//                                                                     (x) =>
//                                                                         x.jobId ===
//                                                                         job.jobId,
//                                                                 ) ||
//                                                                 jobsToPause.some(
//                                                                     (x) =>
//                                                                         x.jobId ===
//                                                                         job.jobId,
//                                                                 )
//                                                             }
//                                                             onChange={(e) => {
//                                                                 if (e) {
//                                                                     job.NEXT_FIRE_TIME ===
//                                                                     'INACTIVE'
//                                                                         ? setJobsToResume(
//                                                                               (
//                                                                                   prev,
//                                                                               ) => [
//                                                                                   ...prev,
//                                                                                   job,
//                                                                               ],
//                                                                           )
//                                                                         : setJobsToPause(
//                                                                               (
//                                                                                   prev,
//                                                                               ) => [
//                                                                                   ...prev,
//                                                                                   job,
//                                                                               ],
//                                                                           );
//                                                                 } else {
//                                                                     job.NEXT_FIRE_TIME ===
//                                                                     'INACTIVE'
//                                                                         ? setJobsToResume(
//                                                                               (
//                                                                                   prev,
//                                                                               ) =>
//                                                                                   prev.filter(
//                                                                                       (
//                                                                                           p,
//                                                                                       ) =>
//                                                                                           p.jobId !==
//                                                                                           job.jobId,
//                                                                                   ),
//                                                                           )
//                                                                         : setJobsToPause(
//                                                                               (
//                                                                                   prev,
//                                                                               ) =>
//                                                                                   prev.filter(
//                                                                                       (
//                                                                                           p,
//                                                                                       ) =>
//                                                                                           p.jobId !==
//                                                                                           job.jobId,
//                                                                                   ),
//                                                                           );
//                                                                 }
//                                                             }}
//                                                         />
//                                                     </Table.Cell>
//                                                     <Table.Cell>
//                                                         {job.jobName}
//                                                     </Table.Cell>
//                                                     <Table.Cell>
//                                                         {job.jobType}
//                                                     </Table.Cell>
//                                                     <Table.Cell>
//                                                         {convertTimeToFrequencyString(
//                                                             job,
//                                                         )}
//                                                     </Table.Cell>
//                                                     <Table.Cell>
//                                                         {job.jobTags}
//                                                     </Table.Cell>
//                                                     <Table.Cell>
//                                                         {convertTimeToLastRunString(
//                                                             job,
//                                                         )}
//                                                     </Table.Cell>
//                                                     <Table.Cell>
//                                                         {convertTimeToNextRunString(
//                                                             job,
//                                                         )}
//                                                     </Table.Cell>
//                                                     <Table.Cell>
//                                                         {job.USER_ID}
//                                                     </Table.Cell>
//                                                     <Table.Cell
//                                                         style={{
//                                                             display: 'flex',
//                                                             flexDirection:
//                                                                 'row',
//                                                         }}
//                                                     >
//                                                         <Button
//                                                             prepend={
//                                                                 <StyledHeaderIcon
//                                                                     path={
//                                                                         mdiPlay
//                                                                     }
//                                                                 />
//                                                             }
//                                                             variant="text"
//                                                             size="sm"
//                                                             onClick={() => {
//                                                                 executeJob(
//                                                                     job.jobId,
//                                                                     job.jobGroup,
//                                                                 );
//                                                             }}
//                                                         />
//                                                         <Button
//                                                             prepend={
//                                                                 <StyledHeaderIcon
//                                                                     path={
//                                                                         mdiSquareEditOutline
//                                                                     }
//                                                                 />
//                                                             }
//                                                             variant="text"
//                                                             size="sm"
//                                                             onClick={() => {
//                                                                 setSelectedJob(
//                                                                     job,
//                                                                 );
//                                                                 setShowJobModal(
//                                                                     true,
//                                                                 );
//                                                             }}
//                                                         />
//                                                         <Button
//                                                             prepend={
//                                                                 <StyledHeaderIcon
//                                                                     path={
//                                                                         mdiTrashCanOutline
//                                                                     }
//                                                                 />
//                                                             }
//                                                             variant="text"
//                                                             size="sm"
//                                                             onClick={() => {
//                                                                 setSelectedJob(
//                                                                     job,
//                                                                 );
//                                                                 setShowDeleteModal(
//                                                                     true,
//                                                                 );
//                                                             }}
//                                                         />
//                                                     </Table.Cell>
//                                                 </Table.Row>
//                                             );
//                                         })
//                                     )}
//                                 </Table.Body>
//                             </Table>
//                         </Tabs.Content>
//                     );
//                 })}
//                 <Tabs.Content value="history">
//                     <Table>
//                         <Table.Head>
//                             <Table.Row>
//                                 <Table.Cell
//                                     title="name"
//                                     style={{
//                                         width: '15%',
//                                     }}
//                                 >
//                                     Name
//                                 </Table.Cell>
//                                 <Table.Cell
//                                     title="latest"
//                                     style={{
//                                         width: '10%',
//                                     }}
//                                 />
//                                 <Table.Cell
//                                     title="run-date"
//                                     style={{
//                                         width: '20%',
//                                     }}
//                                 >
//                                     Run Date
//                                 </Table.Cell>
//                                 <Table.Cell
//                                     title="run-time"
//                                     style={{
//                                         width: '10%',
//                                     }}
//                                 >
//                                     Run Time
//                                 </Table.Cell>
//                                 <Table.Cell
//                                     title="status"
//                                     style={{
//                                         width: '10%',
//                                     }}
//                                 >
//                                     Status
//                                 </Table.Cell>
//                             </Table.Row>
//                         </Table.Head>
//                         <Table.Body>
//                             {filterJobs(history).length === 0 ? (
//                                 <Table.Row>
//                                     <Table.Cell style={{ columnSpan: 'all' }}>
//                                         <span>
//                                             No job history, please try again.
//                                         </span>
//                                     </Table.Cell>
//                                 </Table.Row>
//                             ) : (
//                                 filterJobs(history).map((job, i) => {
//                                     return (
//                                         <Table.Row key={i}>
//                                             <Table.Cell>
//                                                 {job.jobName}
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 {job.isLatest ? 'Latest' : null}
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 <Flex>
//                                                     <StyledHeaderIcon
//                                                         path={mdiCalendarMonth}
//                                                     />
//                                                     {job.execStart}
//                                                 </Flex>
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 <Flex>
//                                                     <StyledHeaderIcon
//                                                         path={mdiClockOutline}
//                                                     />
//                                                     {job.execDelta}
//                                                 </Flex>
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 {job.success
//                                                     ? 'Success'
//                                                     : 'Failed'}
//                                             </Table.Cell>
//                                         </Table.Row>
//                                     );
//                                 })
//                             )}
//                         </Table.Body>
//                     </Table>
//                 </Tabs.Content>
//             </Tabs>
//             {selectedTab !== 'history' && (
//                 <Button
//                     size="md"
//                     onClick={() => setShowJobModal(true)}
//                     style={{
//                         width: 'min-content',
//                         alignSelf: 'center',
//                     }}
//                 >
//                     New Job
//                 </Button>
//             )}
//             <Modal
//                 style={{ maxWidth: '75rem' }}
//                 id="schedule-job"
//                 onClose={(open) => {
//                     setShowJobModal(open);
//                     setSelectedJob(null);
//                     setNewJobModalSelectedTab('job-details');
//                 }}
//                 onOpen={(open) => {
//                     setShowJobModal(open);
//                 }}
//                 open={showJobModal}
//             >
//                 <Modal.Content>
//                     <Modal.Header>
//                         {selectedJob ? 'Edit' : 'Add'} Job
//                     </Modal.Header>
//                     <Modal.Body>
//                         <Tabs
//                             onChange={(e) => {
//                                 setNewJobModalSelectedTab(e);
//                             }}
//                             value={newJobModalSelectedTab}
//                         >
//                             <Tabs.List>
//                                 <Tabs.Trigger
//                                     disabled={false}
//                                     value="job-details"
//                                 >
//                                     Job Details
//                                 </Tabs.Trigger>
//                                 <Tabs.Trigger
//                                     disabled={false}
//                                     value="frequency"
//                                 >
//                                     Frequency
//                                 </Tabs.Trigger>
//                                 <Tabs.Trigger
//                                     disabled={false}
//                                     value="additional-settings"
//                                 >
//                                     Additional Settings
//                                 </Tabs.Trigger>
//                             </Tabs.List>
//                             <Tabs.Content
//                                 value="job-details"
//                                 style={{ marginTop: '10px' }}
//                             >
//                                 <Form>
//                                     <Flex direction={'column'} gap={'$4'}>
//                                         <Field
//                                             label={'Job Name'}
//                                             name={'jobName'}
//                                             control={control}
//                                             rules={{ required: true }}
//                                             options={{
//                                                 component: 'input',
//                                                 size: 'md',
//                                             }}
//                                             layout="vertical"
//                                         />
//                                         <Field
//                                             label={'Job Type'}
//                                             name={'jobType'}
//                                             control={control}
//                                             rules={{ required: true }}
//                                             options={{
//                                                 component: 'select',
//                                                 options: [
//                                                     'Custom Job',
//                                                     'Backup Database',
//                                                     'Sync Database',
//                                                     'Extract Transform Load',
//                                                     'Send Email',
//                                                     'Run Insight',
//                                                 ],
//                                             }}
//                                             layout="vertical"
//                                             onChange={(e) => {
//                                                 switch (e) {
//                                                     case 'Custom Job':
//                                                         reset(
//                                                             {
//                                                                 jobType:
//                                                                     'Custom Job',
//                                                                 ...customJobDefaultValues,
//                                                             },
//                                                             {
//                                                                 keepValues:
//                                                                     true,
//                                                             },
//                                                         );
//                                                         break;

//                                                     case 'Backup Database':
//                                                         reset(
//                                                             {
//                                                                 jobType:
//                                                                     'Backup Database',
//                                                                 ...backupDatabaseJobDefaultValues,
//                                                             },
//                                                             {
//                                                                 keepValues:
//                                                                     true,
//                                                             },
//                                                         );
//                                                         break;

//                                                     case 'Sync Database':
//                                                         reset(
//                                                             {
//                                                                 jobType:
//                                                                     'Sync Database',
//                                                                 ...syncDatabaseJobDefaultValues,
//                                                             },
//                                                             {
//                                                                 keepValues:
//                                                                     true,
//                                                             },
//                                                         );
//                                                         break;

//                                                     case 'Extract Transform Load':
//                                                         reset(
//                                                             {
//                                                                 jobType:
//                                                                     'Extract Transform Load',
//                                                                 ...extractTransformLoadJobDefaultValues,
//                                                             },
//                                                             {
//                                                                 keepValues:
//                                                                     true,
//                                                             },
//                                                         );
//                                                         break;
//                                                     case 'Send Email':
//                                                         reset(
//                                                             {
//                                                                 jobType:
//                                                                     'Send Email',
//                                                                 ...sendEmailJobDefaultValues,
//                                                             },
//                                                             {
//                                                                 keepValues:
//                                                                     true,
//                                                             },
//                                                         );
//                                                         break;

//                                                     case 'Run Insight':
//                                                         reset(
//                                                             {
//                                                                 jobType:
//                                                                     'Run Insight',
//                                                                 ...runInsightJobDefaultValues,
//                                                             },
//                                                             {
//                                                                 keepValues:
//                                                                     true,
//                                                             },
//                                                         );
//                                                         break;
//                                                     default:
//                                                         break;
//                                                 }
//                                                 // reset job type template variable
//                                                 setJobTypeTemplate({});
//                                             }}
//                                         />
//                                         {/* show pixel entry if custom job */}
//                                         {jobType === 'Custom Job' && (
//                                             <Field
//                                                 label="Enter Pixel"
//                                                 name={'recipe'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'textarea',
//                                                     placeholder:
//                                                         'Enter pxiel query to run on schedule.',
//                                                     size: 'lg',
//                                                 }}
//                                             />
//                                         )}
//                                         <Field
//                                             label={'Job Tags'}
//                                             name={'jobTags'}
//                                             control={control}
//                                             rules={{}}
//                                             options={{
//                                                 component: 'input',
//                                                 size: 'md',
//                                             }}
//                                             layout="vertical"
//                                         />
//                                         {/* fields for backup database job type */}
//                                         {jobType === 'Backup Database' && (
//                                             <Field
//                                                 label={'Database Name'}
//                                                 name={'app'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'select',
//                                                     options: databaseList.map(
//                                                         (db) => db.app_name,
//                                                     ),
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     const id =
//                                                         databaseList.find(
//                                                             (db) =>
//                                                                 e ===
//                                                                 db.app_name,
//                                                         ).app_id;
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         app: id,
//                                                     });
//                                                 }}
//                                             />
//                                         )}

//                                         {/* sync database fields */}
//                                         {jobType === 'Sync Database' && (
//                                             <Field
//                                                 label={'Project Name'}
//                                                 name={'app'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'select',
//                                                     options: projectsList.map(
//                                                         (p) => p.project_name,
//                                                     ),
//                                                 }}
//                                                 description=""
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     const id =
//                                                         projectsList.find(
//                                                             (p) =>
//                                                                 p.project_name ===
//                                                                 e,
//                                                         ).project_id;
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         app: id,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Sync Database' && (
//                                             <Field
//                                                 label={'Remote Repository'}
//                                                 name={'repository'}
//                                                 control={control}
//                                                 rules={{}}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 description=""
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         repository: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Sync Database' && (
//                                             <Field
//                                                 label={'Username'}
//                                                 name={'username'}
//                                                 control={control}
//                                                 rules={{}}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 description=""
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         username: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Sync Database' && (
//                                             <Field
//                                                 label={'Password'}
//                                                 name={'password'}
//                                                 control={control}
//                                                 rules={{}}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 description=""
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         password: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Sync Database' && (
//                                             <Field
//                                                 name={'dual'}
//                                                 control={control}
//                                                 rules={{}}
//                                                 options={{
//                                                     component: 'checkbox',
//                                                     children:
//                                                         'Sync and Pull Updates (Recommended)',
//                                                 }}
//                                                 description=""
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         dual: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Sync Database' && (
//                                             <Field
//                                                 name={'syncDatabase'}
//                                                 control={control}
//                                                 rules={{}}
//                                                 options={{
//                                                     component: 'checkbox',
//                                                     children: 'Sync Database',
//                                                 }}
//                                                 description=""
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         syncDatabase: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType ===
//                                             'Extract Transform Load' && (
//                                             <Field
//                                                 label={'Source Database'}
//                                                 name={'sourceApp'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'select',
//                                                     options: databaseList.map(
//                                                         (db) => db.app_name,
//                                                     ),
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         sourceApp:
//                                                             databaseList.find(
//                                                                 (db) =>
//                                                                     db.app_name ===
//                                                                     e,
//                                                             ).app_id,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType ===
//                                             'Extract Transform Load' && (
//                                             <Field
//                                                 label={'Target Database'}
//                                                 name={'targetApp'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'select',
//                                                     options: databaseList.map(
//                                                         (db) => db.app_name,
//                                                     ),
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         targetApp:
//                                                             databaseList.find(
//                                                                 (db) =>
//                                                                     db.app_name ===
//                                                                     e,
//                                                             ).app_id,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType ===
//                                             'Extract Transform Load' && (
//                                             <Field
//                                                 label={'Target Table'}
//                                                 name={'targetTable'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'select',
//                                                     options: targetAppTables,
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         targetTable: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType ===
//                                             'Extract Transform Load' && (
//                                             <Field
//                                                 label={'Query'}
//                                                 name={'query'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'textarea',
//                                                     size: 'lg',
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         query: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Send Email' && (
//                                             <Field
//                                                 label={'SMTP Host'}
//                                                 name={'smtpHost'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         smtpHost: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Send Email' && (
//                                             <Field
//                                                 label={'SMTP Port'}
//                                                 name={'smtpPort'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         smtpPort: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Send Email' && (
//                                             <Field
//                                                 label={'Subject'}
//                                                 name={'subject'}
//                                                 control={control}
//                                                 rules={{}}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         subject: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Send Email' && (
//                                             <Field
//                                                 label={'To'}
//                                                 name={'to'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         to: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Send Email' && (
//                                             <Field
//                                                 label={'From'}
//                                                 name={'from'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         from: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Send Email' && (
//                                             <Field
//                                                 label={'Message'}
//                                                 name={'message'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'textarea',
//                                                     size: 'md',
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         message: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Send Email' && (
//                                             <Field
//                                                 label={'Username'}
//                                                 name={'username'}
//                                                 control={control}
//                                                 rules={{}}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 description=""
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         username: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Send Email' && (
//                                             <Field
//                                                 label={'Password'}
//                                                 name={'password'}
//                                                 control={control}
//                                                 rules={{}}
//                                                 options={{
//                                                     component: 'input',
//                                                     size: 'md',
//                                                 }}
//                                                 description=""
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         password: e,
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Run Insight' && (
//                                             <Field
//                                                 label={'Project Name'}
//                                                 name={'app'} // todo change this ?
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'select',
//                                                     options: projectsList.map(
//                                                         (p) => p.project_name,
//                                                     ),
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     setJobTypeTemplate({
//                                                         ...jobTypeTemplate,
//                                                         app: projectsList.find(
//                                                             (p) =>
//                                                                 e ===
//                                                                 p.project_name,
//                                                         ).project_id,
//                                                         insight: {},
//                                                     });
//                                                 }}
//                                             />
//                                         )}
//                                         {jobType === 'Run Insight' && (
//                                             <Field
//                                                 label={'Insight Name'}
//                                                 name={'insight'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'select',
//                                                     options: insights.map(
//                                                         (i) => i.name,
//                                                     ),
//                                                 }}
//                                                 layout="vertical"
//                                                 onChange={(e) => {
//                                                     const insight =
//                                                         insights.find(
//                                                             (i) => i.name === e,
//                                                         );
//                                                     // set insight parameters if it exists
//                                                     setInsightParametersIfExists(
//                                                         insight,
//                                                     );
//                                                 }}
//                                             />
//                                         )}
//                                     </Flex>
//                                 </Form>
//                             </Tabs.Content>
//                             <Tabs.Content
//                                 value="frequency"
//                                 style={{ marginTop: '10px' }}
//                             >
//                                 <Form>
//                                     <Flex direction={'column'} gap={'$4'}>
//                                         <Field
//                                             name={'onLoad'}
//                                             control={control}
//                                             rules={{}}
//                                             options={{
//                                                 component: 'checkbox',
//                                                 children:
//                                                     'Execute Job Each Time Semoss Starts',
//                                             }}
//                                             layout="vertical"
//                                         />
//                                         <Field
//                                             name={'customCron'}
//                                             control={control}
//                                             rules={{}}
//                                             options={{
//                                                 component: 'checkbox',
//                                                 children:
//                                                     'Custom Cron Expression:',
//                                             }}
//                                             layout="vertical"
//                                         />
//                                         {customCron && (
//                                             <Field
//                                                 label={'Cron Expression'}
//                                                 name={'cronExpression'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'textarea',
//                                                     size: 'md',
//                                                 }}
//                                                 layout="vertical"
//                                             />
//                                         )}
//                                         {!customCron && (
//                                             <Field
//                                                 label={'Job Frequency'}
//                                                 name={'frequency'}
//                                                 control={control}
//                                                 rules={{ required: true }}
//                                                 options={{
//                                                     component: 'select',
//                                                     options: frequencyOpts.map(
//                                                         (f) => f.human,
//                                                     ),
//                                                 }}
//                                                 layout="vertical"
//                                             />
//                                         )}
//                                         {!customCron && frequency === 'Weekly' && (
//                                             <Field
//                                                 label={'Day of Week'}
//                                                 name={'dayOfWeek'}
//                                                 control={control}
//                                                 rules={{
//                                                     required: true,
//                                                 }}
//                                                 options={{
//                                                     component: 'select',
//                                                     options: daysOfWeek,
//                                                 }}
//                                                 layout="vertical"
//                                             />
//                                         )}
//                                         {!customCron &&
//                                             (frequency === 'Quarterly' ||
//                                                 frequency === 'Yearly') && (
//                                                 <Field
//                                                     label={'Month'}
//                                                     name={'monthOfYear'}
//                                                     control={control}
//                                                     rules={{
//                                                         required: true,
//                                                     }}
//                                                     options={{
//                                                         component: 'select',
//                                                         options: monthsOfYear,
//                                                     }}
//                                                     layout="vertical"
//                                                 />
//                                             )}
//                                         {!customCron &&
//                                             (frequency === 'Monthly' ||
//                                                 frequency === 'Quarterly' ||
//                                                 frequency === 'Yearly') && (
//                                                 <Field
//                                                     label={'Day of Month'}
//                                                     name={'dayOfMonth'}
//                                                     control={control}
//                                                     rules={{
//                                                         required: true,
//                                                     }}
//                                                     options={{
//                                                         component: 'select',
//                                                         options:
//                                                             frequency ===
//                                                             'Monthly'
//                                                                 ? [
//                                                                       ...Array(
//                                                                           31,
//                                                                       ).keys(),
//                                                                   ].map((x) =>
//                                                                       String(
//                                                                           ++x,
//                                                                       ),
//                                                                   )
//                                                                 : getDaysOfMonth(
//                                                                       monthOfYear,
//                                                                   ),
//                                                     }}
//                                                     layout="vertical"
//                                                 />
//                                             )}
//                                         {!customCron && (
//                                             <Flex direction="column">
//                                                 <label>Time:</label>
//                                                 <Flex direction="row">
//                                                     <Field
//                                                         name={'hour'}
//                                                         control={control}
//                                                         rules={{}}
//                                                         options={{
//                                                             component: 'select',
//                                                             options: [
//                                                                 ...Array(
//                                                                     12,
//                                                                 ).keys(),
//                                                             ].map((x) =>
//                                                                 String(++x),
//                                                             ),
//                                                         }}
//                                                         layout="vertical"
//                                                     />
//                                                     <TimeSpacer>:</TimeSpacer>
//                                                     <Field
//                                                         name={'minute'}
//                                                         control={control}
//                                                         rules={{}}
//                                                         options={{
//                                                             component: 'select',
//                                                             options: [
//                                                                 ...Array(
//                                                                     60,
//                                                                 ).keys(),
//                                                             ].map((x) => {
//                                                                 return x < 10
//                                                                     ? '0' +
//                                                                           String(
//                                                                               x,
//                                                                           )
//                                                                     : String(x);
//                                                             }),
//                                                         }}
//                                                         layout="vertical"
//                                                     />
//                                                     <Field
//                                                         name={'ampm'}
//                                                         control={control}
//                                                         rules={{}}
//                                                         options={{
//                                                             component: 'select',
//                                                             options: [
//                                                                 'AM',
//                                                                 'PM',
//                                                             ],
//                                                         }}
//                                                         layout="vertical"
//                                                     />
//                                                 </Flex>
//                                             </Flex>
//                                         )}
//                                     </Flex>
//                                 </Form>
//                             </Tabs.Content>
//                             <Tabs.Content
//                                 value="additional-settings"
//                                 style={{ marginTop: '10px' }}
//                             >
//                                 <Form>
//                                     <Flex direction={'column'} gap={'$4'}>
//                                         <Field
//                                             name={'openExport'}
//                                             control={control}
//                                             rules={{}}
//                                             options={{
//                                                 component: 'checkbox',
//                                                 children: 'Export',
//                                             }}
//                                             layout="vertical"
//                                         />
//                                         {openExport && (
//                                             <Flex direction={'row'}>
//                                                 <Field
//                                                     label={'File Name'}
//                                                     name={'fileName'}
//                                                     control={control}
//                                                     rules={{}}
//                                                     options={{
//                                                         component: 'input',
//                                                         size: 'md',
//                                                     }}
//                                                     layout="vertical"
//                                                 />
//                                             </Flex>
//                                         )}
//                                         {openExport && (
//                                             <Flex direction={'row'}>
//                                                 <Field
//                                                     name={'exportAudit'}
//                                                     control={control}
//                                                     rules={{}}
//                                                     options={{
//                                                         component: 'checkbox',
//                                                         children:
//                                                             'Export Audit',
//                                                     }}
//                                                     layout="vertical"
//                                                 />
//                                             </Flex>
//                                         )}
//                                         {openExport && config.fileSharedPath && (
//                                             <Flex direction={'row'}>
//                                                 <Field
//                                                     name={'filePathChecked'}
//                                                     control={control}
//                                                     rules={{}}
//                                                     options={{
//                                                         component: 'checkbox',
//                                                         children:
//                                                             'Copy Report to Shared Drive',
//                                                     }}
//                                                     layout="vertical"
//                                                     onChange={(e) => {
//                                                         setValue(
//                                                             'filePath',
//                                                             e
//                                                                 ? String(
//                                                                       config.fileSharedPath,
//                                                                   )
//                                                                 : '',
//                                                         );
//                                                     }}
//                                                 />
//                                             </Flex>
//                                         )}
//                                         {openExport && (
//                                             <Flex direction={'row'}>
//                                                 <Flex direction={'column'}>
//                                                     <Field
//                                                         label={
//                                                             'Select a Project'
//                                                         }
//                                                         name={'selectedApp'}
//                                                         control={control}
//                                                         rules={{}}
//                                                         options={{
//                                                             component: 'select',
//                                                             options:
//                                                                 projectsList.map(
//                                                                     (p) =>
//                                                                         p.project_name,
//                                                                 ),
//                                                         }}
//                                                         layout="vertical"
//                                                     />
//                                                     <Field
//                                                         label={'Template'}
//                                                         name={'exportTemplate'}
//                                                         control={control}
//                                                         rules={{}}
//                                                         options={{
//                                                             component: 'select',
//                                                             options:
//                                                                 templates.map(
//                                                                     (t) =>
//                                                                         t.templateName,
//                                                                 ),
//                                                         }}
//                                                         layout="vertical"
//                                                     />
//                                                 </Flex>
//                                             </Flex>
//                                         )}
//                                     </Flex>
//                                 </Form>
//                             </Tabs.Content>
//                         </Tabs>
//                     </Modal.Body>
//                     <Modal.Footer>
//                         <Modal.Close>
//                             <Button
//                                 type="button"
//                                 onClick={() => {
//                                     scheduleJob();
//                                 }}
//                                 disabled={jobName.trim().length === 0}
//                             >
//                                 {selectedJob ? 'Reschedule' : 'Schedule'} Job
//                             </Button>
//                         </Modal.Close>
//                     </Modal.Footer>
//                 </Modal.Content>
//             </Modal>
//             {/* delete modal */}
//             <Modal
//                 id="delete-job"
//                 onClose={(open) => {
//                     setShowDeleteModal(open);
//                     setSelectedJob(null);
//                 }}
//                 onOpen={(open) => {
//                     setShowDeleteModal(open);
//                 }}
//                 open={showDeleteModal}
//             >
//                 <Modal.Content>
//                     <Modal.Header>Delete Job</Modal.Header>
//                     <Modal.Body>
//                         <p>
//                             Confirm Delete.
//                             <span
//                                 style={{
//                                     color: 'red',
//                                 }}
//                             >
//                                 Warning: Action is Permanent
//                             </span>
//                         </p>
//                     </Modal.Body>
//                     <Modal.Footer>
//                         <Modal.Close>
//                             <Button variant="text">Cancel</Button>
//                         </Modal.Close>
//                         <Button
//                             variant="filled"
//                             color="error"
//                             onClick={() => {
//                                 deleteJob(
//                                     selectedJob.jobId,
//                                     selectedJob.jobGroup,
//                                 );
//                             }}
//                         >
//                             Delete
//                         </Button>
//                     </Modal.Footer>
//                 </Modal.Content>
//             </Modal>
//         </StyledContainer>
//     );
// }
