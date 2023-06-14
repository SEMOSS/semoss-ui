'use strict';

import './export-dashboard.scss';

export default angular
    .module('app.export-dashboard.directive', [])
    .directive('exportDashboard', exportDashboardDirective);

exportDashboardDirective.$inject = ['semossCoreService', 'CONFIG'];

function exportDashboardDirective(semossCoreService, CONFIG) {
    exportDashboardCtrl.$inject = [];
    exportDashboardLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        template: require('./export-dashboard.directive.html'),
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'exportDashboard',
        bindToController: {},
        controller: exportDashboardCtrl,
        link: exportDashboardLink,
    };

    function exportDashboardCtrl() {}

    function exportDashboardLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.exportDashboard.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.exportDashboard.closeExport = closeExport;
        scope.exportDashboard.runExport = runExport;
        scope.exportDashboard.addParameter = addParameter;
        scope.exportDashboard.deleteParameter = deleteParameter;
        scope.exportDashboard.resetParameters = resetParameters;
        scope.exportDashboard.isParametersEmpty = isParametersEmpty;
        scope.exportDashboard.paramDropdownChanged = paramDropdownChanged;
        scope.exportDashboard.isPlaceholdersEmpty = isPlaceholdersEmpty;
        scope.exportDashboard.addAllParameters = addAllParameters;
        scope.exportDashboard.getAllTemplates = getAllTemplates;
        scope.exportDashboard.setApp = setApp;
        scope.exportDashboard.templateData = [];
        scope.exportDashboard.selectedApp = {};
        scope.exportDashboard.types = {
            selected: 'exportToExcel',
            list: [
                {
                    display: 'Excel Native',
                    value: 'exportToExcel',
                },
                {
                    display: 'Excel Non-Native',
                    value: 'exportToExcelNN',
                },
                {
                    display: 'PowerPoint Non-Native',
                    value: 'exportToPPTNN',
                },
            ],
        };
        scope.exportDashboard.parameters = {
            selected: '',
            added: {},
            filtered: [],
            list: {
                exportToExcel: [
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
                        options: [],
                        defaultValue: '',
                    },
                    {
                        display: 'Export Audit',
                        value: 'exportAudit',
                        component: 'checkbox',
                        defaultValue: false,
                    },
                ],
                exportToExcelNN: [
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
                        display: 'Panels on Separate Sheets',
                        value: 'usePanel',
                        component: 'dropdown',
                        options: [true, false],
                        defaultValue: false,
                    },
                    {
                        display: 'Export Audit',
                        value: 'exportAudit',
                        component: 'checkbox',
                        defaultValue: false,
                    },
                ],
                exportToPPTNN: [
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
                        display: 'Panels on Separate Sheets',
                        value: 'usePanel',
                        component: 'dropdown',
                        options: [true, false],
                        defaultValue: false,
                    },
                    {
                        display: 'Height',
                        value: 'height',
                        component: 'number',
                        defaultValue: '',
                    },
                    {
                        display: 'Width',
                        value: 'width',
                        component: 'number',
                        defaultValue: '',
                    },
                    {
                        display: 'Slide Layout',
                        value: 'slideLayout',
                        component: 'input',
                        defaultValue: '',
                    },
                    {
                        display: 'Shape Index',
                        value: 'shapeIndex',
                        component: 'number',
                        defaultValue: '',
                    },
                ],
            },
        };

        /**
         * @name addParameter
         * @desc adds a parameter for the user to edit
         * @param {String} param - selected app
         * @returns {void}
         */
        function addParameter(
            param = scope.exportDashboard.parameters.selected
        ) {
            if (
                !scope.exportDashboard.parameters.added.hasOwnProperty(
                    param.value
                )
            ) {
                // Add the selected parameter to the list of added parameters
                scope.exportDashboard.parameters.added[param.value] = {
                    value: param.defaultValue,
                    component: param.component,
                    display: param.display,
                    options: param.options,
                    isDisabled: param.isDisabled,
                };
                // if it is a template parameter, get the list of all templates and set the default app in app dropdown
                if (
                    param.value === 'export_template' &&
                    scope.exportDashboard.selectedApp.value
                ) {
                    setApp();
                    getAllTemplates();
                }
            }
        }

        /**
         * @name addAllParameters
         * @desc this method adds all the parameters for the user to edit
         * @returns {void}
         */
        function addAllParameters() {
            scope.exportDashboard.parameters.list[
                scope.exportDashboard.types.selected
            ].forEach((param) => {
                scope.exportDashboard.addParameter(param);
            });
        }

        /**
         * @name deleteParameter
         * @desc deletes the parameter
         * @param {string} param - name of param to delete
         * @returns {void}
         */
        function deleteParameter(param) {
            if (scope.exportDashboard.parameters.added.hasOwnProperty(param)) {
                delete scope.exportDashboard.parameters.added[param];
            }
            // Empty the template data (place holder information) if the template parameter is deleted
            if (param === 'export_template') {
                scope.exportDashboard.templateData = [];
            }
        }

        /**
         * @name resetParameters
         * @desc reset the parameters when the export type changes
         * @returns {void}
         */
        function resetParameters() {
            scope.exportDashboard.parameters.added = {};
            scope.exportDashboard.parameters.selected = '';
            addDefaultParameters();
            filterParametersList();
        }

        /**
         * @name isParametersEmpty
         * @desc checks if parameters have been added
         * @returns {boolean} - whether the parameters have been added or not
         */
        function isParametersEmpty() {
            if (
                Object.keys(scope.exportDashboard.parameters.added).length === 0
            ) {
                return true;
            }
            return false;
        }

        /**
         * @name closeExport
         * @desc close the exportDashboard when the pipeline is closed
         * @returns {void}
         */
        function closeExport() {
            if (scope.exportDashboard.PIPELINE) {
                scope.pipelineComponentCtrl.closeComponent();
            }
        }

        /**
         * @name getPanelOrder
         * @param {*} insightId the insight to get panel order for
         * @desc get the panel order for this insight
         * @returns {array} an array of panel ids
         */
        function getPanelOrder(insightId) {
            function getValues(obj, key) {
                let panels = [];
                for (let i in obj) {
                    if (!obj.hasOwnProperty(i)) {
                        continue;
                    }

                    if (typeof obj[i] === 'object') {
                        panels = panels.concat(getValues(obj[i], key));
                    } else if (i === key) {
                        panels.push(obj[i]);
                    }
                }
                return panels;
            }

            let workbook = {},
                panelIds = [],
                panelOrder = [];

            if (!workbook) {
                return {};
            }

            // need to tell worksheet directive to save the golden layout config so we can process it below
            scope.widgetCtrl.emit('save-worksheet', {
                insightID: scope.widgetCtrl.insightID,
            });

            // grab the updated workbook from save-worksheet message
            workbook = semossCoreService.workbook.getWorkbook(insightId);

            for (let sheetId in workbook.worksheets) {
                if (workbook.worksheets.hasOwnProperty(sheetId)) {
                    panelIds = [];
                    // add the golden layout
                    if (workbook.worksheets[sheetId].hasOwnProperty('golden')) {
                        const json = JSON.parse(
                            JSON.stringify(workbook.worksheets[sheetId].golden)
                        );

                        panelIds = getValues(json, 'panelId');
                    }
                    panelOrder = panelOrder.concat(panelIds);
                }
            }

            return panelOrder;
        }

        /**
         * @name runExport
         * @desc export to the selected export type
         * @returns {void}
         */
        function runExport() {
            let parameters,
                components = [],
                // Config holds the panel alignments
                config = semossCoreService.workspace.saveWorkspace(
                    scope.widgetCtrl.insightID
                );

            const required =
                    scope.exportDashboard.parameters.list[
                        scope.exportDashboard.types.selected
                    ],
                updatedpanelIds = getPanelOrder(scope.widgetCtrl.insightID);

            if (required) {
                for (let i = 0; i < required.length; i++) {
                    if (
                        scope.exportDashboard.parameters.added.hasOwnProperty(
                            required[i].value
                        )
                    ) {
                        // add the parameter value to the array of parameters
                        components.push(
                            required[i].value === 'filePath' &&
                                scope.exportDashboard.parameters.added[
                                    required[i].value
                                ].value
                                ? CONFIG.fileSharedPath
                                : scope.exportDashboard.parameters.added[
                                      required[i].value
                                  ].value
                        );
                    } else {
                        // add the default value if the parameter is not added to the list of current parameters
                        components.push(required[i].defaultValue);
                    }
                }
                // add the place holder information
                components.push([scope.exportDashboard.templateData]);
            }
            // add the panel id list
            components.push(updatedpanelIds);
            // add the app id
            components.push(
                scope.exportDashboard.selectedApp.value
                    ? scope.exportDashboard.selectedApp.value
                    : null
            );
            parameters = buildParameters(components);

            if (scope.exportDashboard.PIPELINE) {
                scope.pipelineComponentCtrl.executeComponent(parameters, {
                    name: 'Export Dashboard',
                });
                return;
            }

            // Adding set insight config here to pass the panel alignments before exporting
            scope.widgetCtrl.execute([
                {
                    type: 'setInsightConfig',
                    components: [config],
                    terminal: true,
                    meta: true,
                },
                {
                    type: scope.exportDashboard.types.selected,
                    components: components,
                    meta: true,
                    terminal: true,
                },
            ]);
        }
        /**
         * @name buildParameters
         * @desc build the parameters for the current module
         * @param {*} components - parameters for export reactors
         * @returns {object} - map of the paramters to value
         */
        function buildParameters(components) {
            let pixel = semossCoreService.pixel.build([
                {
                    type: scope.exportDashboard.types.selected,
                    components: components,
                    terminal: true,
                },
            ]);
            return {
                OPERATION: pixel.substring(0, pixel.length - 1),
            };
        }

        /**
         * @name isPlaceholdersEmpty
         * @desc checks if placeholders have been added
         * @returns {boolean} - whether the parameters have been added or not
         */
        function isPlaceholdersEmpty() {
            if (
                !scope.exportDashboard.templateData ||
                Object.keys(scope.exportDashboard.templateData).length === 0
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
            if (paramKey === 'export_template' && templateName) {
                getTemplateData(templateName);
            }
        }

        /**
         * @name addDefaultParameters
         * @desc this method adds all the parameters for the user to edit
         * @returns {void}
         */
        function addDefaultParameters() {
            scope.exportDashboard.parameters.list[
                scope.exportDashboard.types.selected
            ].forEach((param) => {
                if (
                    param.value === 'exportAudit' ||
                    param.value === 'fileName'
                ) {
                    scope.exportDashboard.addParameter(param);
                }
            });
        }

        /**
         * @name filterParametersList
         * @desc this method removes the Copy Report to Shared Drive option from parameter dropdown if shared path is not present
         * @returns {void}
         */
        function filterParametersList() {
            if (scope.exportDashboard.types.selected) {
                scope.exportDashboard.parameters.filtered =
                    scope.exportDashboard.parameters.list[
                        scope.exportDashboard.types.selected
                    ].filter((param) => {
                        return !CONFIG.fileSharedPath
                            ? param.value !== 'filePath'
                            : true;
                    });
            }
        }

        /**
         * @name getTemplateData
         * @desc get all templates information (ex: place holders)
         * @param {string} templateName - parameter key
         * @returns {void}
         */
        function getTemplateData(templateName) {
            const message = semossCoreService.utility.random('query-pixel');

            scope.exportDashboard.templateData = [];

            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType[0],
                    output = response.pixelReturn[0].output;
                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: output,
                    });
                    return;
                }
                scope.exportDashboard.templateData = output;
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'GetPlaceHolders',
                        components: [
                            [scope.exportDashboard.selectedApp.value],
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
            if (scope.exportDashboard.parameters.added.export_template) {
                scope.exportDashboard.parameters.added.export_template.options =
                    [];
            }
            scope.exportDashboard.templateData = [];
            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType[0],
                    output = response.pixelReturn[0].output;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: output,
                    });
                    return;
                }

                for (let templateName in output) {
                    if (
                        scope.exportDashboard.parameters.added.export_template
                    ) {
                        scope.exportDashboard.parameters.added.export_template.options.push(
                            templateName
                        );
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'getTemplateList',
                        components: [scope.exportDashboard.selectedApp.value],
                        meta: true,
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

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
                    scope.exportDashboard.selectedApp = {
                        display: app.name,
                        image: app.image,
                        value: app.app_id,
                    };
                }
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            if (scope.exportDashboard.PIPELINE) {
                scope.exportDashboard.types.list = [
                    {
                        display: 'Excel Native',
                        value: 'exportToExcel',
                    },
                ];
            }
            setApp();
            filterParametersList();
            addDefaultParameters();
        }

        initialize();
    }
}
