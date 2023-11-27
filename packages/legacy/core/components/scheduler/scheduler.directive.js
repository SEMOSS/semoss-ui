'use strict';

/**
 * @name Scheduler
 * @desc Schedule backend tasks to happen on a daily, weekly, or monthly basis
 *       When adding a jobType to the scheduler, please seperate it out into its
 *       own directive inside of jobTemplates
 *       (don't forget to update components-entry.js, scheduler-entry.js,
 *       and add new directives to the app in index.js!).
 *       The scheduler attaches front end meta data to jobs so the user can go back
 *       and edit them. For job templates, the user's answers to the template form
 *       are stored inside of <job>.jobTypeTemplate. The final pixel query is constructed
 *       inside of the template directive, and is stored inside of
 *       <job>.jobTypeTemplate.templatePixelQuery
 */
export default angular
    .module('app.scheduler.directive', [
        'app.scheduler.sync-app-to-github',
        'app.scheduler.backup-app',
        'app.scheduler.extract-transform-load',
        'app.scheduler.send-email',
        'app.scheduler.run-insight',
    ])
    .directive('scheduler', scheduler);

import './scheduler.scss';
import './jobTemplates/sync-app-to-github/sync-app-to-github.directive';
import './jobTemplates/backup-app/backup-app.directive';
import './jobTemplates/extract-transform-load/extract-transform-load.directive';
import './jobTemplates/send-email/send-email.directive';
import './jobTemplates/run-insight/run-insight.directive';

scheduler.$inject = ['semossCoreService', 'CONFIG'];

function scheduler(semossCoreService, CONFIG) {
    schedulerCtrl.$inject = [];
    schedulerLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {},
        controller: schedulerCtrl,
        link: schedulerLink,
        template: require('./scheduler.directive.html'),
        bindToController: {},
        controllerAs: 'schedule',
    };

    function schedulerCtrl() {
        const JOB_GROUP = 'defaultGroup';

        let schedule = this;
        schedule.jobBeingEditedIdx = -1; // index of job in all jobs to edit
        schedule.jobBeingEdited = {}; // hold data of job being edited
        schedule.templatesList = []; // list of templates from the selected app
        schedule.placeholderData = []; // placeholder data
        schedule.selectedApp = {}; // selected App for template
        schedule.frequencyOpts = [
            {
                computer: 1,
                human: 'Daily',
            },
            {
                computer: 2,
                human: 'Weekly',
            },
            {
                computer: 3,
                human: 'Monthly',
            },
            {
                computer: 4,
                human: 'Quarterly',
            },
            {
                computer: 5,
                human: 'Yearly',
            },
        ];
        // parameters required for export
        schedule.exportParameters = {
            selected: '',
            added: {},
            list: [
                {
                    display: 'File Name',
                    value: 'fileName',
                    component: 'input',
                    defaultValue: '',
                },
                {
                    display: 'Copy Report to Shared Drive',
                    value: 'filePath',
                    component: 'checkbox',
                    defaultValue: false,
                },
                {
                    display: 'Template',
                    value: 'export_template',
                    component: 'template',
                    options: schedule.templatesList,
                    defaultValue: '',
                },
                {
                    display: 'Export Audit',
                    value: 'exportAudit',
                    component: 'checkbox',
                    defaultValue: false,
                    isDisabled: false,
                },
            ],
        };

        schedule.daysOfWeek = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ];
        schedule.monthsOfYear = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        //TODO: react version should handle / show both the short hand and the long form of the timezone
        schedule.cronTimeZones = [
            'Acre Time',
            'Afghanistan Time',
            'Alaska Standard Time',
            'Alma-Ata Time',
            'Amazon Time',
            'Anadyr Time',
            'Aqtau Time',
            'Aqtobe Time',
            'Arabia Standard Time',
            'Argentine Time',
            'Armenia Time',
            'Atlantic Standard Time',
            'Australian Central Standard Time (Northern Territory)',
            'Australian Central Standard Time (South Australia)',
            'Australian Central Standard Time (South Australia/New South Wales)',
            'Australian Central Western Standard Time',
            'Australian Eastern Standard Time (Macquarie)',
            'Australian Eastern Standard Time (New South Wales)',
            'Australian Eastern Standard Time (Queensland)',
            'Australian Eastern Standard Time (Tasmania)',
            'Australian Eastern Standard Time (Victoria)',
            'Australian Western Standard Time',
            'Azerbaijan Time',
            'Azores Time',
            'Bangladesh Time',
            'Bhutan Time',
            'Bolivia Time',
            'Bougainville Standard Time',
            'Brasilia Time',
            'Brunei Time',
            'Cape Verde Time',
            'Central African Time',
            'Central European Time',
            'Central Indonesia Time',
            'Central Standard Time',
            'Chamorro Standard Time',
            'Chatham Standard Time',
            'Chile Time',
            'China Standard Time',
            'Choibalsan Time',
            'Christmas Island Time',
            'Chuuk Time',
            'Cocos Islands Time',
            'Colombia Time',
            'Cook Is. Time',
            'Coordinated Universal Time',
            'Cuba Standard Time',
            'Davis Time',
            "Dumont-d'Urville Time",
            'East Indonesia Time',
            'Easter Is. Time',
            'Eastern African Time',
            'Eastern European Time',
            'Eastern Greenland Time',
            'Eastern Standard Time',
            'Ecuador Time',
            'Falkland Is. Time',
            'Fernando de Noronha Time',
            'Fiji Time',
            'French Guiana Time',
            'French Southern & Antarctic Lands Time',
            'Galapagos Time',
            'Gambier Time',
            'Georgia Time',
            'Ghana Mean Time',
            'Gilbert Is. Time',
            'GMT+01:00',
            'GMT+02:00',
            'GMT+03:00',
            'GMT+04:00',
            'GMT+05:00',
            'GMT+06:00',
            'GMT+07:00',
            'GMT+08:00',
            'GMT+09:00',
            'GMT+10:00',
            'GMT+11:00',
            'GMT+12:00',
            'GMT+13:00',
            'GMT+14:00',
            'GMT-01:00',
            'GMT-02:00',
            'GMT-03:00',
            'GMT-04:00',
            'GMT-05:00',
            'GMT-06:00',
            'GMT-07:00',
            'GMT-08:00',
            'GMT-09:00',
            'GMT-10:00',
            'GMT-11:00',
            'GMT-12:00',
            'Greenwich Mean Time',
            'Gulf Standard Time',
            'Guyana Time',
            'Hawaii Standard Time',
            'Hong Kong Time',
            'Hovd Time',
            'India Standard Time',
            'Indian Ocean Territory Time',
            'Indochina Time',
            'Iran Standard Time',
            'Irkutsk Time',
            'Israel Standard Time',
            'Japan Standard Time',
            'Kirgizstan Time',
            'Korea Standard Time',
            'Kosrae Time',
            'Krasnoyarsk Time',
            'Line Is. Time',
            'Lord Howe Standard Time',
            'Magadan Time',
            'Malaysia Time',
            'Maldives Time',
            'Marquesas Time',
            'Marshall Islands Time',
            'Mauritius Time',
            'Mawson Time',
            'Middle Europe Time',
            'Moscow Standard Time',
            'Mountain Standard Time',
            'Myanmar Time',
            'Nauru Time',
            'Nepal Time',
            'New Caledonia Time',
            'New Zealand Standard Time',
            'Newfoundland Standard Time',
            'Niue Time',
            'Norfolk Time',
            'Novosibirsk Time',
            'Omsk Time',
            'Oral Time',
            'Pacific Standard Time',
            'Pakistan Time',
            'Palau Time',
            'Papua New Guinea Time',
            'Paraguay Time',
            'Peru Time',
            'Petropavlovsk-Kamchatski Time',
            'Philippines Standard Time',
            'Phoenix Is. Time',
            'Pierre & Miquelon Standard Time',
            'Pitcairn Standard Time',
            'Pohnpei Time',
            'Qyzylorda Time',
            'Reunion Time',
            'Rothera Time',
            'Sakhalin Time',
            'Samara Time',
            'Samoa Standard Time',
            'Seychelles Time',
            'Singapore Time',
            'Solomon Is. Time',
            'South Africa Standard Time',
            'South Georgia Standard Time',
            'Srednekolymsk Time',
            'Suriname Time',
            'Syowa Time',
            'Tahiti Time',
            'Tajikistan Time',
            'Timor-Leste Time',
            'Tokelau Time',
            'Tonga Time',
            'Turkmenistan Time',
            'Tuvalu Time',
            'Ulaanbaatar Time',
            'Uruguay Time',
            'Ust-Nera Time',
            'Uzbekistan Time',
            'Vanuatu Time',
            'Venezuela Time',
            'Vladivostok Time',
            'Vostok Time',
            'Wake Time',
            'Wallis & Futuna Time',
            'West Indonesia Time',
            'West Samoa Standard Time',
            'Western African Time',
            'Western European Time',
            'Western Greenland Time',
            'Xinjiang Standard Time',
            'Yakutsk Time',
            'Yekaterinburg Time',
        ];
        schedule.jobTypes = [
            'Custom Job',
            'Backup Database',
            'Sync Database',
            'Extract Transform Load',
            'Send Email',
            'Run Insight',
        ];
        schedule.currentJob = {
            jobType: 'Custom Job',
            jobName: '',
            jobGroup: JOB_GROUP,
            cronExpression: '',
            cronTimeZone: 'Eastern Standard Time',
            recipe: '',
            recipeParameters: '',
            hour: 12,
            minute: '00',
            ampm: 'PM',
            frequency: schedule.frequencyOpts[0],
            dayOfWeek: schedule.daysOfWeek[new Date().getDay()],
            dayOfMonth: new Date().getDate(),
            monthOfYear: schedule.monthsOfYear[new Date().getMonth() - 1],
            jobTypeTemplate: {},
            onLoad: false,
            jobTags: '',
            fileName: '',
            filePath: '',
            export_template: '',
            exportAudit: '',
            placeholderData: [],
            selectedApp: '',
        };

        schedule.tabs = ['All', 'Active', 'Inactive', 'History'];
        schedule.selectedTab = 'All';
        schedule.ownerTypes = ['My Jobs', 'All Jobs'];
        schedule.selectedOwnerType = 'All Jobs';
        schedule.username = '';
        schedule.search = '';

        schedule.view = {
            options: [
                { display: 'Job Details', value: 'DETAIL' },
                { display: 'Frequency', value: 'FREQUENCY' },
                { display: 'Additional Settings', value: 'SETTINGS' },
            ],
            selected: 'DETAIL',
        };

        schedule.hours = [];
        schedule.minutes = [];
        schedule.daysOfMonth = {
            January: [...Array(31).keys()].map((x) => ++x),
            February: [...Array(28).keys()].map((x) => ++x),
            March: [...Array(31).keys()].map((x) => ++x),
            April: [...Array(30).keys()].map((x) => ++x),
            May: [...Array(31).keys()].map((x) => ++x),
            June: [...Array(30).keys()].map((x) => ++x),
            July: [...Array(31).keys()].map((x) => ++x),
            August: [...Array(31).keys()].map((x) => ++x),
            September: [...Array(30).keys()].map((x) => ++x),
            October: [...Array(31).keys()].map((x) => ++x),
            November: [...Array(30).keys()].map((x) => ++x),
            December: [...Array(31).keys()].map((x) => ++x),
        };
        schedule.allJobs = [];
        schedule.allJobTags = {
            options: [],
            selected: [],
        };
        schedule.rowData = [];
        schedule.historyData = [];
        schedule.check_toggle = false;
        schedule.showMarkActive = false;
        schedule.showMarkInactive = false;
        schedule.showJobModal = false;
        schedule.showDeleteModal = false;

        schedule.resetControllerVariables = resetControllerVariables;
        schedule.executeJob = executeJob;
        schedule.scheduleJob = scheduleJob;
        schedule.convertTimeToFrequencyString = convertTimeToFrequencyString;
        schedule.convertTimeToLastRunString = convertTimeToLastRunString;
        schedule.convertTimeToNextRunString = convertTimeToNextRunString;
        schedule.showEditJob = showEditJob;
        schedule.showDeleteJob = showDeleteJob;
        schedule.editJob = editJob;
        schedule.deleteJob = deleteJob;
        schedule.isJobInvalid = isJobInvalid;
        schedule.toggleAllChecked = toggleAllChecked;
        schedule.toggleActionButtons = toggleActionButtons;
        schedule.changeTags = changeTags;
        schedule.toggleTabs = toggleTabs;
        schedule.filterJobs = filterJobs;
        schedule.getUser = getUser;
        schedule.resetNewJob = resetNewJob;
        schedule.markActive = markActive;
        schedule.markInactive = markInactive;
        // schedule.searchJobs = searchJobs;
        schedule.addParameter = addParameter;
        schedule.deleteParameter = deleteParameter;
        schedule.resetParameters = resetParameters;
        schedule.isParametersEmpty = isParametersEmpty;
        schedule.addAllParameters = addAllParameters;
        schedule.paramDropdownChanged = paramDropdownChanged;
        schedule.isPlaceholdersEmpty = isPlaceholdersEmpty;
        schedule.getAllTemplates = getAllTemplates;
        schedule.setApp = setApp;
        schedule.getApp = getApp;
        schedule.addDefaultParameters = addDefaultParameters;
        schedule.getHistory = getHistory;
        /**
         * @name setApp
         * @desc update the App information
         * @returns {void}
         */
        function setApp() {
            let selected = semossCoreService.app.get('selectedApp');

            if (selected && selected !== 'NEWSEMOSSAPP') {
                let app = semossCoreService.app.getApp(selected);
                if (app) {
                    schedule.selectedApp = {
                        display: app.name,
                        image: app.image,
                        value: app.app_id,
                    };
                }
            }
        }
        /**
         * @name getApp
         * @param {string} selected - selected app value
         * @desc update the App information
         * @returns {void}
         */
        function getApp(selected) {
            // let selected = semossCoreService.app.get('selectedApp');

            if (selected && selected !== 'NEWSEMOSSAPP') {
                let app = semossCoreService.app.getApp(selected);
                if (app) {
                    schedule.selectedApp = {
                        display: app.name,
                        image: app.image,
                        value: app.app_id,
                    };
                }
            }
        }
        /**
         * @name isPlaceholdersEmpty
         * @desc checks if placeholders have been added
         * @returns {boolean} - whether the parameters have been added or not
         */
        function isPlaceholdersEmpty() {
            if (
                !schedule.placeholderData ||
                Object.keys(schedule.placeholderData).length === 0
            ) {
                return true;
            }
            return false;
        }

        /**
         * @name paramDropdownChanged
         * @desc this method is called when any dropdown is changed in parameters list
         * @param {string} paramKey - parameter key
         * @param {string} templateName - template Name
         * @returns {void}
         */
        function paramDropdownChanged(paramKey, templateName) {
            if (paramKey === 'export_template') {
                if (templateName) {
                    getPlaceholderData(templateName);
                }
            }
        }

        /**
         * @name addDefaultParameters
         * @desc this method adds all the parameters for the user to edit
         * @returns {void}
         */
        function addDefaultParameters() {
            if (
                schedule.currentJob.openExport ||
                schedule.jobBeingEdited.openExport
            ) {
                // to remove Copy to shared Drive option if sharedPath value is not available
                schedule.exportParameters.list =
                    schedule.exportParameters.list.filter((param) => {
                        return !CONFIG.fileSharedPath
                            ? param.value !== 'filePath'
                            : true;
                    });
                schedule.exportParameters.list.forEach((param) => {
                    if (
                        param.value === 'exportAudit' ||
                        param.value === 'fileName'
                    ) {
                        schedule.addParameter(param);
                    }
                });
            }
        }

        /**
         * @name deleteParameter
         * @desc deletes the parameter
         * @param {string} param - name of param to delete
         * @returns {void}
         */
        function deleteParameter(param) {
            if (schedule.exportParameters.added.hasOwnProperty(param)) {
                delete schedule.exportParameters.added[param];
            }
            if (param === 'export_template') {
                schedule.placeholderData = [];
            }
        }

        /**
         * @name resetParameters
         * @desc reset the parameters when the export type changes
         * @returns {void}
         */
        function resetParameters() {
            schedule.exportParameters.added = {};
            schedule.exportParameters.selected = '';
            schedule.placeholderData = [];
            schedule.addDefaultParameters();
        }

        /**
         * @name isParametersEmpty
         * @desc checks if parameters have been added
         * @returns {boolean} - whether the parameters have been added or not
         */
        function isParametersEmpty() {
            if (Object.keys(schedule.exportParameters.added).length === 0) {
                return true;
            }
            return false;
        }

        /**
         * @name getPlaceholderData
         * @desc get all templates
         * @param {string} templateName - parameter key
         * @returns {void}
         */
        function getPlaceholderData(templateName) {
            const message = semossCoreService.utility.random('query-pixel');
            schedule.placeholderData = [];

            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Placeholder Data could not be retrieved.',
                    });
                } else {
                    let placeholderData = response.pixelReturn[0].output;
                    schedule.placeholderData = placeholderData;
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'GetPlaceHolders',
                        components: [
                            [schedule.selectedApp.value],
                            [templateName],
                        ],
                        meta: true,
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name getAllTemplates
         * @desc get all templates
         * @returns {void}
         */
        function getAllTemplates() {
            const message = semossCoreService.utility.random('query-pixel');
            schedule.templatesList = [];

            if (schedule.exportParameters.added.export_template) {
                schedule.exportParameters.added.export_template.options = [];
            }
            schedule.placeholderData = [];

            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType[0],
                    templates = [];
                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'There are no templates in the Selected Project',
                    });

                    return;
                }
                templates = response.pixelReturn[0].output;
                schedule.templatesList = [];
                if (schedule.exportParameters.added.export_template) {
                    schedule.exportParameters.added.export_template.options =
                        [];
                }
                for (let templateName in templates) {
                    if (templateName) {
                        schedule.templatesList.push({
                            templateType: 'Custom template',
                            templateName: templateName,
                            fileName: templates[templateName],
                            templateGroup: schedule.selectedApp.value,
                        });
                    }
                    if (schedule.exportParameters.added.export_template) {
                        schedule.exportParameters.added.export_template.options.push(
                            templateName
                        );
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'getTemplateList',
                        components: [schedule.selectedApp.value],
                        terminal: true,
                        meta: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name addAllParameters
         * @desc adds all parameters for the export
         * @returns {void}
         */
        function addAllParameters() {
            schedule.exportParameters.list.forEach((param) => {
                schedule.addParameter(param);
            });
        }

        /**
         * @name addParameter
         * @desc adds a parameter for the user to edit
         * @param {string} param - parameter name
         * @returns {void}
         */
        function addParameter(param = schedule.exportParameters.selected) {
            if (!schedule.exportParameters.added.hasOwnProperty(param.value)) {
                schedule.exportParameters.added[param.value] = {
                    value:
                        param.value === 'exportAudit'
                            ? false
                            : param.defaultValue,
                    component: param.component,
                    display: param.display,
                    options: param.options,
                    isDisabled: param.isDisabled,
                };
                if (
                    param.value === 'export_template' &&
                    schedule.selectedApp.value
                ) {
                    setApp();
                    getAllTemplates();
                }
            }
        }

        /**
         * @name getHistory
         * @param {any} jobTags list of the job tags to filter by
         * @desc gets the history of jobs
         * @return {void}
         */
        function getHistory(jobTags) {
            const message = semossCoreService.utility.random('query-pixel');
            let output, headers;

            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Something went wrong. Job history could not be retrieved.',
                    });
                } else {
                    // map the headers
                    schedule.historyData = [];
                    output = response.pixelReturn[0].output;
                    headers = {};
                    // let uniqueJobNames = []; // list of job names
                    for (
                        let headerIdx = 0,
                            headerLen = output.data.headers.length;
                        headerIdx < headerLen;
                        headerIdx++
                    ) {
                        headers[output.data.headers[headerIdx]] = headerIdx;
                    }

                    for (
                        let valueIdx = 0, valueLen = output.data.values.length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        // Excluding the jobs that have not ran even once from history
                        if (
                            output.data.values[valueIdx][headers.SUCCESS] !==
                            null
                        ) {
                            const job = {
                                jobId: headers.hasOwnProperty('JOB_ID')
                                    ? output.data.values[valueIdx][
                                          headers.JOB_ID
                                      ]
                                    : '',
                                jobName: headers.hasOwnProperty('JOB_NAME')
                                    ? output.data.values[valueIdx][
                                          headers.JOB_NAME
                                      ]
                                    : '',
                                jobGroup: headers.hasOwnProperty('JOB_GROUP')
                                    ? output.data.values[valueIdx][
                                          headers.JOB_GROUP
                                      ]
                                    : '',
                                execStart:
                                    headers.hasOwnProperty('EXECUTION_START') &&
                                    output.data.values[valueIdx][
                                        headers.EXECUTION_START
                                    ]
                                        ? convertTimetoDate(
                                              output.data.values[valueIdx][
                                                  headers.EXECUTION_START
                                              ]
                                          )
                                        : '',
                                execEnd: headers.hasOwnProperty('EXECUTION_END')
                                    ? output.data.values[valueIdx][
                                          headers.EXECUTION_END
                                      ]
                                    : '',
                                execDelta: headers.hasOwnProperty(
                                    'EXECUTION_DELTA'
                                )
                                    ? convertDeltaToRuntimeString(
                                          output.data.values[valueIdx][
                                              headers.EXECUTION_DELTA
                                          ]
                                      )
                                    : '',
                                // Success will have 2 types of values True means passed and False means failed.
                                success: headers.hasOwnProperty('SUCCESS')
                                    ? output.data.values[valueIdx][
                                          headers.SUCCESS
                                      ]
                                    : '',
                                // appName: headers.hasOwnProperty('APP_NAME') ? output.data.values[valueIdx][headers.APP_NAME] : '',
                                jobTags: headers.hasOwnProperty('JOB_TAG')
                                    ? output.data.values[valueIdx][
                                          headers.JOB_TAG
                                      ]
                                    : '',
                                // capture the latest record based on the IS_LATEST field stored
                                isLatest: headers.hasOwnProperty('IS_LATEST')
                                    ? output.data.values[valueIdx][
                                          headers.IS_LATEST
                                      ]
                                    : false,
                            };

                            schedule.historyData.push(job);
                        }
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'schedulerHistory',
                        components: ['', jobTags],
                        terminal: true,
                        meta: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name resetNewJob
         * @desc resets all the new job values
         * @returns {void}
         */
        function resetNewJob() {
            schedule.jobBeingEditedIdx = -1;
            schedule.exportParameters.added = {};
            schedule.exportParameters.selected = '';
            schedule.currentJob = {
                jobType: 'Custom Job',
                jobName: '',
                jobGroup: JOB_GROUP,
                cronExpression: '',
                cronTimeZone: 'Eastern Standard Time',
                recipe: '',
                recipeParameters: '',
                hour: 12,
                minute: '00',
                ampm: 'PM',
                frequency: schedule.frequencyOpts[0],
                dayOfWeek: schedule.daysOfWeek[new Date().getDay()],
                dayOfMonth: new Date().getDate(),
                monthOfYear: schedule.monthsOfYear[new Date().getMonth() - 1],
                jobTypeTemplate: {},
                onLoad: false,
                jobTags: '',
                fileName: '',
                filePath: '',
                export_template: '',
                exportAudit: '',
                placeholderData: [],
                selectedApp: '',
            };
        }

        /**
         * @name changeTags
         * @desc move the job tag from the unselected list of tags to the selected list (or vice versa)
         * @return {void}
         */
        function changeTags() {
            // update search results
            schedule.getAllJobs(false, schedule.allJobTags.selected);
        }

        /**
         * @name executeJob
         * @param {number} idx the index of the job
         * @desc executes a job
         * @return {void}
         */
        function executeJob(idx) {
            const message = semossCoreService.utility.random('query-pixel');
            let job;

            job = JSON.parse(JSON.stringify(schedule.allJobs[idx]));

            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Something went wrong. Job was not executed',
                    });
                } else {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Job was executed',
                    });
                }

                // get the list again
                setTimeout(() => {
                    schedule.getAllJobs(true, []);
                }, 1000);
            });
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'executeScheduledJob',
                        components: [job.jobId, job.jobGroup],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name buildInsightParamsRecipe
         * @param {string} job - job to build recipe for
         * @desc to build the insightParamsRecipe pixel query when a parameterized insight is selected
         * @returns {void}
         */
        function buildInsightParamsRecipe(job) {
            var params = {},
                queryIdx,
                queryLen,
                paramIdx,
                paramLen,
                json = job.jobTypeTemplate.paramJson,
                pixel = '';

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
                                json[queryIdx].params[paramIdx].model
                                    .defaultValue
                            )) ||
                            (typeof json[queryIdx].params[paramIdx].model
                                .defaultValue === 'string' &&
                                !json[queryIdx].params[paramIdx].model
                                    .defaultValue) ||
                            (Array.isArray(
                                json[queryIdx].params[paramIdx].model
                                    .defaultValue
                            ) &&
                                json[queryIdx].params[paramIdx].model
                                    .defaultValue.length === 0 &&
                                !json[queryIdx].params[paramIdx].selectAll) ||
                            typeof json[queryIdx].params[paramIdx].model
                                .defaultValue === 'undefined' ||
                            json[queryIdx].params[paramIdx].model
                                .defaultValue === null)
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

            job.jobTypeTemplate.insightParameters = params;

            if (Object.keys(params).length > 0) {
                pixel = semossCoreService.pixel.build([
                    {
                        type: 'setOpenInsightParamValue',
                        components: [params],
                        meta: true,
                        terminal: true,
                    },
                ]);
            }

            // build the pixel
            return pixel;
        }

        /**
         * @name configureParamJson
         * @param {object} job the object to configure
         * @desc configure the json that is to be saved to the BE to save the state
         * @returns {void}
         */
        function configureUIState(job) {
            // here we need to clean up what is saved to the BE. duplicate or unneeded information should be removed.

            if (job.jobTypeTemplate) {
                // this json is not needed to be saved
                delete job.jobTypeTemplate.paramJson;
            }
        }

        /**
         * @name scheduleJob
         * @desc schedules the job
         * @return {void}
         */
        function scheduleJob() {
            const message = semossCoreService.utility.random('query-pixel'),
                required = schedule.exportParameters.list;

            let job, stringifiedJob;
            if (schedule.jobBeingEditedIdx > -1) {
                job = schedule.jobBeingEdited;
            } else {
                job = schedule.currentJob;
            }

            if (required) {
                for (let i = 0; i < required.length; i++) {
                    if (
                        schedule.exportParameters.added.hasOwnProperty(
                            required[i].value
                        )
                    ) {
                        if (required[i].value === 'fileName') {
                            job.fileName =
                                schedule.exportParameters.added[
                                    required[i].value
                                ].value;
                        }
                        if (required[i].value === 'filePath') {
                            if (
                                schedule.exportParameters.added[
                                    required[i].value
                                ].value &&
                                CONFIG.fileSharedPath
                            ) {
                                job.filePath = CONFIG.fileSharedPath;
                            }
                        }
                        if (required[i].value === 'export_template') {
                            job.export_template =
                                schedule.exportParameters.added[
                                    required[i].value
                                ].value;
                        }
                        if (required[i].value === 'exportAudit') {
                            job.exportAudit =
                                schedule.exportParameters.added[
                                    required[i].value
                                ].value;
                        }
                    }
                }

                job.placeholderData = schedule.placeholderData;
            }

            job.selectedApp = schedule.selectedApp.value
                ? schedule.selectedApp.value
                : null;

            if (!job.customCron) {
                job.cronExpression = convertTimeToCron(job);
            }
            if (job.jobTags && !Array.isArray(job.jobTags)) {
                job.jobTags = job.jobTags.split(',');
            }

            semossCoreService.once(message, function (response) {
                const type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Something went wrong. Job was not scheduled',
                    });

                    return;
                }

                // if we aren't editing need to clear current job
                // otherwise we need to delete this old job
                if (schedule.jobBeingEditedIdx === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Job was scheduled',
                    });
                }

                schedule.showJobModal = false;
                schedule.jobBeingEditedIdx = -1;

                schedule.getAllJobs(true, []);
            });

            if (uniqueJob(job.jobId, schedule.allJobs)) {
                if (job.jobType && job.jobType !== 'Custom Job') {
                    job.recipe = job.jobTypeTemplate.templatePixelQuery;
                    // if run insight and there is a paramjson, we will build the param pixel
                    if (
                        job.jobType === 'Run Insight' &&
                        job.jobTypeTemplate.paramJson &&
                        job.jobTypeTemplate.paramJson.length > 0
                    ) {
                        job.recipeParameters = buildInsightParamsRecipe(job);
                        // if there is json but no pixel is generated, we have a problem. probably no value selected, so alert them.
                        if (!job.recipeParameters) {
                            semossCoreService.emit('alert', {
                                color: 'warn',
                                text: 'Please fill in all parameter fields before continuing.',
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
                if (schedule.currentJob.openExport) {
                    job.recipe = addExportToRecipe(job, job.recipe);
                }

                // Encode the recipe
                // Otherwise we have a character escaping dilemma
                // job.recipe = encodeURIComponent(job.recipe);
                job.jobGroup = job.jobTypeTemplate.app;
                configureUIState(job);
                // Stringify the job so that we can edit it later
                stringifiedJob = JSON.stringify(job).replace(/"/g, '\\"');

                semossCoreService.emit('query-pixel', {
                    commandList: [
                        {
                            type: 'scheduleJob',
                            components: [
                                job.jobName,
                                job.jobGroup,
                                job.cronExpression,
                                job.cronTimeZone,
                                job.recipe,
                                job.recipeParameters,
                                job.jobTags,
                                job.onLoad,
                                stringifiedJob,
                            ],
                            terminal: true,
                            meta: true,
                        },
                    ],
                    response: message,
                });

                // Reset the recipe so that it is not encoded on the UI
                // job.recipe = decodeURIComponent(job.recipe);
            } else {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Job name must be unique',
                });
            }
        }

        /**
         * @name uniqueJob
         * @param {string} jobId  name of job to check
         * @param {Array} jobArray array to validate from
         * @desc goes thru all jobs and deterimes if passed job is uniquely named
         * @return {boolean} true if unique, false otherwise
         */
        function uniqueJob(jobId, jobArray) {
            let i;
            for (i = 0; i < jobArray.length; i++) {
                if (jobId === jobArray[i].jobId) {
                    return false;
                }
            }

            return true;
        }

        /**
         * @name resetControllerVariables
         * @desc resets the controllwe variables to their defaults (except all jobs)
         * @return {void}
         */
        function resetControllerVariables() {
            schedule.currentJob = {
                jobType: 'Custom Job',
                jobName: '',
                jobGroup: JOB_GROUP,
                cronExpression: '',
                cronTimeZone: 'Eastern Standard Time',
                recipe: '',
                recipeParameters: '',
                hour: 12,
                minute: '00',
                ampm: 'PM',
                frequency: schedule.frequencyOpts[0],
                dayOfWeek: schedule.daysOfWeek[new Date().getDay()],
                dayOfMonth: new Date().getDate(),
                jobTypeTemplate: {},
                onLoad: false,
                jobTags: '',
                fileName: '',
                filePath: '',
                export_template: '',
                exportAudit: '',
                placeholderData: [],
                selectedApp: '',
            };

            schedule.view.selected = 'DETAIL';
        }
        /**
         * @name showEditJob
         * @param {number} idx - index of job in schedule.rowData
         * @desc allows user to edit a job
         * @return {void}
         */
        function showEditJob(idx) {
            schedule.showJobModal = true;
            schedule.jobBeingEditedIdx = idx;
            schedule.jobBeingEdited = JSON.parse(
                JSON.stringify(schedule.rowData[idx])
            );
            // overwrite
            schedule.jobBeingEdited.curJobId = schedule.jobBeingEdited.jobId;
            schedule.jobBeingEdited.curJobName =
                schedule.jobBeingEdited.jobName;
            schedule.jobBeingEdited.curJobGroup =
                schedule.jobBeingEdited.jobGroup;
            schedule.jobBeingEdited.curJobTags =
                schedule.jobBeingEdited.jobTags;

            if (schedule.jobBeingEdited.openExport) {
                fillExportParametersList();
            }
            // set to custom if values not present
            if (!schedule.jobBeingEdited.jobType) {
                schedule.jobBeingEdited.jobType = 'Custom Job';
                schedule.jobBeingEdited.customCron = true;
            }
            // set default time zone if none is defined
            // we will just assume it is EST even though it could technically be different
            // since it uses the RDF_Map.prop value - but that is EST if not defined
            if (!schedule.jobBeingEdited.cronTimeZone) {
                schedule.jobBeingEdited.cronTimeZone = 'Eastern Standard Time';
            }
        }

        /**
         * @name fillExportParametersList
         * @desc fills the export parameters list for the edit job
         * @return {void}
         */
        function fillExportParametersList() {
            schedule.resetParameters();

            // add all the parameters to the list, then we add the data for which values exists, else we remove it from the list.
            // This is for displaying export paramters under edit job
            schedule.exportParameters.list.forEach((param) => {
                schedule.addParameter(param);
            });

            schedule.exportParameters.added.fileName.value = schedule
                .jobBeingEdited.fileName
                ? schedule.jobBeingEdited.fileName
                : delete schedule.exportParameters.added.fileName;

            if (schedule.exportParameters.added.hasOwnProperty('filePath')) {
                schedule.exportParameters.added.filePath.value = schedule
                    .jobBeingEdited.filePath
                    ? true
                    : delete schedule.exportParameters.added.filePath;
            }

            if (schedule.jobBeingEdited.export_template) {
                schedule.selectedApp.value =
                    schedule.jobBeingEdited.selectedApp;
                getApp(schedule.jobBeingEdited.selectedApp);
                getAllTemplates();
                schedule.exportParameters.added.export_template.value =
                    schedule.jobBeingEdited.export_template;
                // displaying placeholder data to display it in frontend
                schedule.placeholderData =
                    schedule.jobBeingEdited.placeholderData;
            } else {
                delete schedule.exportParameters.added.export_template;
            }
            schedule.exportParameters.added.exportAudit.value = schedule
                .jobBeingEdited.exportAudit
                ? schedule.jobBeingEdited.exportAudit
                : delete schedule.exportParameters.added.exportAudit;
        }

        /**
         * @name showDeleteJob
         * @param {number} idx - index of job in schedule.rowData
         * @desc allows user to delete a job
         * @return {void}
         */
        function showDeleteJob(idx) {
            schedule.showDeleteModal = true;
            schedule.jobBeingEditedIdx = idx;
        }

        /**
         * @name editJob
         * @desc allows user to edit an existing job
         * @return {void}
         */
        function editJob() {
            let job,
                stringifiedJob,
                message = semossCoreService.utility.random('query-pixel');

            job = schedule.jobBeingEdited;
            if (!job.customCron) {
                job.cronExpression = convertTimeToCron(job);
            }

            // resetting all values to default
            job.fileName = '';
            job.filePath = '';
            job.export_template = '';
            job.exportAudit = '';
            job.selectedApp = '';
            job.placeholderData = [];

            const required = schedule.exportParameters.list;
            if (required) {
                for (let i = 0; i < required.length; i++) {
                    if (
                        schedule.exportParameters.added.hasOwnProperty(
                            required[i].value
                        )
                    ) {
                        if (required[i].value === 'fileName') {
                            job.fileName =
                                schedule.exportParameters.added[
                                    required[i].value
                                ].value;
                        }
                        if (required[i].value === 'filePath') {
                            if (
                                schedule.exportParameters.added[
                                    required[i].value
                                ].value &&
                                CONFIG.fileSharedPath
                            ) {
                                job.filePath = CONFIG.fileSharedPath;
                            }
                        }
                        if (required[i].value === 'export_template') {
                            job.export_template =
                                schedule.exportParameters.added[
                                    required[i].value
                                ].value;
                        }
                        if (required[i].value === 'exportAudit') {
                            job.exportAudit =
                                schedule.exportParameters.added[
                                    required[i].value
                                ].value;
                        }
                    }
                }
                job.placeholderData = schedule.placeholderData;
            }
            job.selectedApp = schedule.selectedApp.value
                ? schedule.selectedApp.value
                : null;
            if (job.jobTags && !Array.isArray(job.jobTags)) {
                job.jobTags = job.jobTags.split(',');
            }
            semossCoreService.once(message, function (response) {
                const type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Something went wrong. Job was not scheduled',
                    });
                    return;
                }

                semossCoreService.emit('alert', {
                    color: 'success',
                    text: 'Job successfully modified',
                });

                schedule.showJobModal = false;
                schedule.jobBeingEditedIdx = -1;

                // get the list again
                schedule.getAllJobs(true, []);
            });

            if (job.jobType && job.jobType !== 'Custom Job') {
                job.recipe = job.jobTypeTemplate.templatePixelQuery;
                // if run insight and there is a paramjson, we will build the param pixel
                if (
                    job.jobType === 'Run Insight' &&
                    job.jobTypeTemplate.paramJson &&
                    job.jobTypeTemplate.paramJson.length > 0
                ) {
                    job.recipeParameters = buildInsightParamsRecipe(job);
                    // if there is json but no pixel is generated, we have a problem. probably no value selected, so alert them.
                    if (!job.recipeParameters) {
                        semossCoreService.emit('alert', {
                            color: 'warn',
                            text: 'Please fill in all parameter fields before continuing.',
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
            if (schedule.jobBeingEdited.openExport) {
                job.recipe = addExportToRecipe(job, job.recipe);
            }

            // Encode the recipe
            // Otherwise we have a character escaping dilemma
            // job.recipe = encodeURIComponent(job.recipe);
            job.jobGroup = job.jobTypeTemplate.app;

            configureUIState(job);
            // Stringify the job so that we can edit it later
            stringifiedJob = JSON.stringify(job).replace(/"/g, '\\"');

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'editScheduledJob',
                        components: [
                            job.jobId,
                            job.jobName,
                            job.jobGroup,
                            job.cronExpression,
                            job.cronTimeZone,
                            job.recipe,
                            job.recipeParameters,
                            job.jobTags,
                            job.onLoad,
                            stringifiedJob,
                            job.curJobName,
                            job.curJobGroup,
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
            // Reset the recipe so that it is not encoded on the UI
            // job.recipe = decodeURIComponent(job.recipe);
        }

        /**
         * @name markActive
         * @desc mark the job as active
         * @returns {void}
         */
        function markActive() {
            let components = [],
                message = semossCoreService.utility.random('resume-job');
            for (let i = 0; i < schedule.rowData.length; i++) {
                if (schedule.rowData[i].checked) {
                    components.push({
                        type: 'resumeJobTrigger',
                        components: [
                            schedule.rowData[i].jobId,
                            schedule.rowData[i].jobGroup,
                        ],
                        terminal: true,
                    });
                }
            }

            semossCoreService.on(message, function (response) {
                for (
                    let i = 0;
                    i < response.pixelReturn[0].operationType.length;
                    i++
                ) {
                    let type = response.pixelReturn[0].operationType[i];

                    if (type.indexOf('ERROR') > -1) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: 'Something went wrong. Job could not be marked active.',
                        });
                    }
                }

                schedule.getAllJobs(false, []);
            });

            semossCoreService.emit('query-pixel', {
                commandList: components,
                listeners: [],
                response: message,
            });
        }

        /**
         * @name markInactive
         * @param {*} jobName job name
         * @param {*} jobGroup job group
         * @param {*} cronExpression croExpression
         * @desc mark the job as inactive
         * @returns {void}
         */
        function markInactive() {
            let components = [],
                message = semossCoreService.utility.random('pause-job');
            for (let i = 0; i < schedule.rowData.length; i++) {
                if (schedule.rowData[i].checked) {
                    components.push({
                        type: 'pauseJobTrigger',
                        components: [
                            schedule.rowData[i].jobId,
                            schedule.rowData[i].jobGroup,
                        ],
                        terminal: true,
                    });
                }
            }

            semossCoreService.on(message, function (response) {
                for (
                    let i = 0;
                    i < response.pixelReturn[0].operationType.length;
                    i++
                ) {
                    let type = response.pixelReturn[0].operationType[i];

                    if (type.indexOf('ERROR') > -1) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: 'Something went wrong. Job could not be marked inactive.',
                        });
                    }
                }

                schedule.getAllJobs(false, []);
            });

            semossCoreService.emit('query-pixel', {
                commandList: components,
                listeners: [],
                response: message,
            });
        }

        /**
         * @name deleteJob
         * @param {number} idx - index if deleted from list
         * @desc allows user to delete a job
         * @return {void}
         */
        function deleteJob() {
            schedule.showDeleteModal = false;
            const idx = schedule.jobBeingEditedIdx;
            let job,
                i,
                jobToDelete,
                message = semossCoreService.utility.random('query-pixel');

            if (idx || idx === 0) {
                job = schedule.allJobs[idx];
                jobToDelete = job.jobId;
            } else if (schedule.jobBeingEditedIdx > -1) {
                job = schedule.jobBeingEdited;
                jobToDelete = job.curJobId;
            } else {
                job = schedule.currentJob;
                jobToDelete = job.jobId;
            }
            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Something went wrong. Job could not be removed.',
                    });
                } else {
                    for (i = 0; i < schedule.allJobs.length; i++) {
                        if (schedule.allJobs[i].jobId === job.jobId) {
                            schedule.allJobs.splice(i, 1);
                            break;
                        }
                    }

                    // if (schedule.jobBeingEditedIdx > -1) {
                    //     scheduleJob();
                    //     semossCoreService.emit('alert', {
                    //         color: 'success',
                    //         text: 'Job Resumed'
                    //     });
                    // }
                    // else {
                    // Here only emit job deleted if we are not rescheduling it
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Job Deleted',
                    });
                    // }
                }

                schedule.getAllJobs(true, []);
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'removeJobFromDB',
                        components: [jobToDelete, job.jobGroup],
                        terminal: true,
                        meta: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name convertTimetoDate
         * @param {object} time time to convert
         * @desc converts the time to formatted string
         * @return {string} formatted string with date and hour
         */
        function convertTimetoDate(time) {
            let today = new Date(),
                dd = String(today.getDate()).padStart(2, '0'),
                mm = String(today.getMonth() + 1).padStart(2, '0'),
                yyyy = today.getFullYear(),
                currentDate = yyyy + '-' + mm + '-' + dd,
                runDateString = '',
                jobDate = time.split(' ')[0],
                jobTime = time.split(' ')[1].split(':'),
                jobHour = Number(jobTime[0]),
                jobMin = jobTime[1];

            if (jobDate === currentDate) {
                runDateString += 'Today at ';
            } else {
                runDateString += jobDate + ' at ';
            }

            if (jobHour > 12)
                runDateString +=
                    (jobHour - 12).toString() + ':' + jobMin.toString() + 'pm';
            else if (jobHour === 12)
                runDateString += '12' + ':' + jobMin + 'pm';
            else if (jobHour === 0) runDateString += '12' + ':' + jobMin + 'am';
            else runDateString += jobHour.toString() + ':' + jobMin + 'am';

            return runDateString;
        }

        /**
         * @name convertDeltaToRuntimeString
         * @param {object} duration time to convert
         * @desc converts the execution time delta to formatted string
         * @return {string} formatted string as hh:mm:ss.sss
         */
        function convertDeltaToRuntimeString(duration) {
            // padding for leading zeros
            function _pad(number) {
                let tempNumStr = number + '';

                for (let i = tempNumStr.length; i < 3; i++) {
                    tempNumStr = '0' + tempNumStr;
                }

                return tempNumStr;
            }
            let milliseconds = _pad(parseFloat((duration % 1000) / 100) * 100),
                seconds = Math.floor((duration / 1000) % 60),
                minutes = Math.floor((duration / (1000 * 60)) % 60),
                hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

            hours = hours < 10 ? '0' + hours : hours;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            seconds = seconds < 10 ? '0' + seconds : seconds;

            // always have milliseconds a let size
            while (milliseconds.length < 3) {
                milliseconds = milliseconds + '0';
            }
            milliseconds = milliseconds.substr(0, 3);
            return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
        }

        /**
         * @name convertTimeToCron
         * @param {object} job job to create cron job for
         * @desc converts the time user selected to java compatible cron string
         * @return {void}
         */
        function convertTimeToCron(job) {
            let freq = job.frequency.computer,
                cronPieces = ['00', '*', '*', '*', '*', '?', '*'];

            if (freq >= 1) {
                cronPieces[1] = job.minute;
                if (job.ampm === 'AM') {
                    if (job.hour === 12) {
                        cronPieces[2] = 0;
                    } else {
                        cronPieces[2] = job.hour;
                    }
                } else if (job.hour === 12) {
                    cronPieces[2] = 12;
                } else {
                    cronPieces[2] = job.hour + 12;
                }
            }

            if (freq === 2) {
                cronPieces[3] = '?';
                cronPieces[5] = job.dayOfWeek.substr(0, 3).toUpperCase();
            }

            if (freq === 3) {
                // cronPieces[3] = '1/' + job.dayOfMonth;
                cronPieces[3] = job.dayOfMonth;
            }

            if (freq === 4) {
                cronPieces[3] = job.dayOfMonth;
                cronPieces[4] = `${
                    schedule.monthsOfYear.indexOf(job.monthOfYear) + 1
                }/3`;
            }

            if (freq === 5) {
                cronPieces[3] = job.dayOfMonth;
                cronPieces[4] =
                    schedule.monthsOfYear.indexOf(job.monthOfYear) + 1;
            }

            return cronPieces.join(' ');
        }

        /**
         * @name convertTimeToFrequencyString
         * @param {object} job job to create cron job for
         * @desc converts the job frequency time to a human readable string
         * @return {string} frequency of job run
         */
        function convertTimeToFrequencyString(job) {
            let freq, timeStr;
            if (!job.customCron) {
                freq = job.frequency.computer;
                timeStr = job.frequency.human;

                if (freq === 2) {
                    // weekly
                    timeStr = timeStr + ' on ' + job.dayOfWeek;
                }

                if (freq === 3) {
                    // monthly
                    timeStr = timeStr + ' on the ' + job.dayOfMonth;
                    let monthLastDigit = job.dayOfMonth
                            .toString()
                            .substring(
                                job.dayOfMonth.length - 1,
                                job.dayOfMonth.length
                            ),
                        monthFirstDigit = job.dayOfMonth
                            .toString()
                            .substring(0, 1);
                    if (
                        job.dayOfMonth.toString().length > 1 &&
                        (monthFirstDigit === '1' || monthLastDigit === '0')
                    )
                        timeStr += 'th ';
                    else if (monthLastDigit === '1') timeStr += 'st ';
                    else if (monthLastDigit === '2') timeStr += 'nd ';
                    else if (monthLastDigit === '3') timeStr += 'rd ';
                    else timeStr += 'th ';
                }

                if (freq >= 1) {
                    // daily
                    timeStr =
                        timeStr +
                        ' at ' +
                        job.hour +
                        ':' +
                        job.minute +
                        job.ampm;
                }
            } else {
                timeStr = 'Custom';
            }

            return timeStr;
        }

        /**
         * @name convertTimeToLastRunString
         * @param {object} job job to create cron job for
         * @desc converts date to human readable format
         * @return {string} string
         */
        function convertTimeToLastRunString(job) {
            if (
                !job.PREV_FIRE_TIME ||
                job.PREV_FIRE_TIME === 'N/A' ||
                job.PREV_FIRE_TIME === 'INACTIVE'
            ) {
                return '';
            }

            return convertTimetoDate(job.PREV_FIRE_TIME);
        }

        /**
         * @name convertTimeToNextRunString
         * @param {object} job job to create cron job for
         * @desc determines when the job's next run is based on frequency and converts to human readable format
         * @return {string} string
         */
        function convertTimeToNextRunString(job) {
            if (job.NEXT_FIRE_TIME === 'INACTIVE') {
                return 'Inactive';
            } else if (job.NEXT_FIRE_TIME === 'EXECUTING') {
                return 'Executing';
            }
            return convertTimetoDate(job.NEXT_FIRE_TIME);
        }

        /**
         * @name isJobInvalid
         * @desc determines if job is missing information so submit button can be deactivated
         * @return {boolean} true if job is invalid
         */
        function isJobInvalid() {
            let job;
            if (schedule.jobBeingEditedIdx > -1) {
                job = schedule.jobBeingEdited;
            } else {
                job = schedule.currentJob;
            }

            if (!job.jobName && job.jobName !== 0) {
                return true;
            }

            return false;
        }

        /**
         * @name filterJobs
         * @param {string} jobType - type of job based (tab that is selected)
         * @desc filters the table row data to show all jobs, only active jobs, or only inactive jobs; also filters by owner if selected
         * @return {void}
         */
        function filterJobs(jobType) {
            if (jobType === 'All') {
                if (schedule.selectedOwnerType === 'All Jobs') {
                    schedule.rowData = schedule.allJobs;
                } else {
                    schedule.rowData = [];
                    for (let j of schedule.allJobs) {
                        if (j.USER_ID === schedule.username) {
                            schedule.rowData.push(j);
                        }
                    }
                }
            } else if (jobType === 'Active') {
                schedule.rowData = [];
                for (let j of schedule.allJobs) {
                    if (
                        j.NEXT_FIRE_TIME !== 'INACTIVE' &&
                        (schedule.selectedOwnerType === 'All Jobs' ||
                            j.USER_ID === schedule.username)
                    ) {
                        schedule.rowData.push(j);
                    }
                }
            } else if (jobType === 'Inactive') {
                schedule.rowData = [];
                for (let j of schedule.allJobs) {
                    if (
                        j.NEXT_FIRE_TIME === 'INACTIVE' &&
                        (schedule.selectedOwnerType === 'All Jobs' ||
                            j.USER_ID === schedule.username)
                    ) {
                        schedule.rowData.push(j);
                    }
                }
            }
        }

        /**
         * @name getUser
         * @desc filters the table row data to show all jobs, only active jobs, or only inactive jobs; also filters by owner if selected
         * @return {string} user
         */
        function getUser() {
            let user = '';
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Could not retrieve user information',
                    });
                } else {
                    user = response.pixelReturn[0].output;

                    // TODO: implement other types, should be a UUID per user
                    if (user) {
                        if (user.NATIVE) {
                            schedule.username = user.NATIVE.name;
                        }
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'getUserInfo',
                        components: [],
                        terminal: true,
                        meta: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name toggleAllChecked
         * @desc if header checkbox is checked, select/deselect all checkboxes
         * @return {void}
         */
        function toggleAllChecked() {
            if (schedule.check_toggle) {
                for (let i = 0; i < schedule.rowData.length; i++) {
                    schedule.rowData[i].checked = true;
                }
            } else {
                for (let i = 0; i < schedule.rowData.length; i++) {
                    schedule.rowData[i].checked = false;
                }
            }
            toggleActionButtons();
        }

        /**
         * @name toggleActionButtons
         * @desc show/hide the "Mark Active" and "Mark Inactive" checkboxes
         * @return {void}
         */
        function toggleActionButtons() {
            schedule.showMarkActive = false;
            schedule.showMarkInactive = false;
            for (let i = 0; i < schedule.rowData.length; i++) {
                // check if any jobs are checked
                if (schedule.rowData[i].checked === true) {
                    if (schedule.selectedTab !== 'All') {
                        schedule.showMarkActive =
                            schedule.selectedTab === 'Inactive';
                        schedule.showMarkInactive =
                            schedule.selectedTab === 'Active';
                        return;
                    }
                    if (schedule.rowData[i].NEXT_FIRE_TIME === 'INACTIVE') {
                        schedule.showMarkActive = true;
                    } else {
                        schedule.showMarkInactive = true;
                    }
                    if (schedule.showMarkActive && schedule.showMarkInactive) {
                        return; // no need to continue looping through if both buttons will be shown
                    }
                }
            }
        }

        /**
         * @name toggleTabs
         * @param {string} tab - selected tab (All, Active, Inactive, or History)
         * @desc update the table data displayed
         * @return {void}
         */
        function toggleTabs(tab) {
            schedule.selectedTab = tab;
            if (tab === 'History') {
                getHistory(schedule.allJobTags.selected);
            } else {
                // All, Active, or Inactive
                schedule.filterJobs(tab);
                toggleActionButtons();
            }
        }

        /**
         * @name addExportToRecipe
         * @param {any} job - job to work with
         * @param {string} recipe - recipe to modify
         * @desc add export to the recipe
         * @returns {string} recipe with export added in
         */
        function addExportToRecipe(job, recipe) {
            if (!recipe) {
                return '';
            }

            // TODO: get rid of this and build the full pixel on submit (instead of doing string manipulation)
            let updated = recipe,
                exportPixel;

            // build the pixel to export
            exportPixel = semossCoreService.pixel.build([
                {
                    type: 'exportToExcel',
                    components: [
                        job.fileName,
                        job.filePath,
                        job.export_template,
                        job.exportAudit,
                        job.placeholderData,
                        [],
                        job.selectedApp,
                    ],
                    meta: true,
                    terminal: true,
                },
            ]);

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
        }
    }

    function schedulerLink(scope) {
        scope.schedule.getAllJobs = getAllJobs;

        /**
         * @name getAllJobs
         * @param {boolean} init whether or not this is initial load
         * @param {string} jobTags a list of the tags to be searched
         * @desc get all jobs
         * @returns {void}
         */
        function getAllJobs(init, jobTags) {
            const message = semossCoreService.utility.random('query-pixel');

            // clear all jobs
            scope.schedule.allJobs = [];

            // reset the popover
            scope.schedule.resetControllerVariables();

            // clear the tags if it is the initial one... Ideally, all options should be a seperate call
            if (init) {
                scope.schedule.allJobTags.options = [];
            }

            // update the tags
            scope.schedule.allJobTags.selected = jobTags;

            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Something went wrong. Jobs could not be retrieved.',
                    });
                } else {
                    // jobs is a map or maps
                    // where the jobId is a unique id of the job inputs
                    let jobs = response.pixelReturn[0].output;

                    for (let jobId in jobs) {
                        if (jobs.hasOwnProperty(jobId)) {
                            let job = jobs[jobId];
                            if (job.hasOwnProperty('uiState')) {
                                // Parse the job back from the stringified version
                                let jobJson = JSON.parse(
                                    job.uiState.replace(/\\"/g, "'")
                                );

                                // Also, need to decode the recipe again
                                // jobJson.recipe = decodeURIComponent(jobJson.recipe);
                                jobJson.checked = false;
                                job.hasOwnProperty('PREV_FIRE_TIME')
                                    ? (jobJson.PREV_FIRE_TIME =
                                          job.PREV_FIRE_TIME)
                                    : (jobJson.PREV_FIRE_TIME = '');
                                job.hasOwnProperty('NEXT_FIRE_TIME')
                                    ? (jobJson.NEXT_FIRE_TIME =
                                          job.NEXT_FIRE_TIME)
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

                                // update the recipe to match for custom jobs (this is the original version)
                                if (jobJson.jobType === 'Custom Job') {
                                    jobJson.recipe = job.recipe;
                                }

                                if (
                                    job.jobGroup === 'undefined' &&
                                    jobJson.jobType !== 'Custom Job' &&
                                    jobJson.jobType !== 'Send Email'
                                ) {
                                    // legacy database-related job
                                    if (
                                        jobJson.jobTypeTemplate.hasOwnProperty(
                                            'app'
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
                                    if (init) {
                                        const tags = jobJson.jobTags.split(',');
                                        for (
                                            let tagIdx = 0,
                                                tagLen = tags.length;
                                            tagIdx < tagLen;
                                            tagIdx++
                                        ) {
                                            const tag = tags[tagIdx];

                                            if (
                                                tag &&
                                                !scope.schedule.allJobTags.options.includes(
                                                    tag
                                                )
                                            ) {
                                                scope.schedule.allJobTags.options.push(
                                                    tags[tagIdx]
                                                );
                                            }
                                        }
                                    }
                                }

                                scope.schedule.allJobs.push(jobJson);
                            } else {
                                job.checked = false;
                                scope.schedule.allJobs.push(job);
                            }
                        }
                    }
                    scope.schedule.rowData = scope.schedule.allJobs;
                    scope.schedule.username = scope.schedule.getUser();

                    // update the views
                    scope.schedule.toggleTabs(scope.schedule.selectedTab);
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'listAllJobs',
                        components: [jobTags],
                        meta: true,
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name initialize
         * @desc intialize function
         * @returns {void}
         */
        function initialize() {
            let i = 0,
                iAsString;

            // initialize value for date and time info dropdowns
            while (i < 60) {
                // minutes
                if (i === 0) {
                    scope.schedule.minutes.push('00');
                } else if (i < 10) {
                    iAsString = String(i);
                    scope.schedule.minutes.push('0' + iAsString);
                } else {
                    scope.schedule.minutes.push(i);
                }

                // hours
                if (i < 13 && i !== 0) {
                    scope.schedule.hours.push(i);
                }

                i++;
            }
            getAllJobs(true, []);
        }

        initialize();
    }
}
