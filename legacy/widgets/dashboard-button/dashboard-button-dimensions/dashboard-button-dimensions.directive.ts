'use strict';

import angular from 'angular';
import './dashboard-button-dimensions.scss';
import { EVENT_TYPE, FILE_TYPE, options } from '../types';
import variables from '@/style/src/variables.scss';
export default angular
    .module('app.dashboard-button.dashboard-button-dimensions', [])
    .directive('dashboardButtonDimensions', dashboardButtonDimensionsDirective);

dashboardButtonDimensionsDirective.$inject = ['semossCoreService', '$location'];

function dashboardButtonDimensionsDirective(
    semossCoreService: SemossCoreService,
    $location
) {
    dashboardButtonDimensionsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight', '^widget'],
        controllerAs: 'dashboardButtonDimensions',
        bindToController: {},
        template: require('./dashboard-button-dimensions.directive.html'),
        controller: dashboardButtonDimensionsCtrl,
        link: dashboardButtonDimensionsLink,
    };

    function dashboardButtonDimensionsCtrl() {}

    function dashboardButtonDimensionsLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        const DEFAULT_OPTIONS: options = {
            label: '',
            event: EVENT_TYPE.EXPORT_FILE,
            eventScript: '',
            eventOptions: {
                file: 'CSV',
                delimiter: '',
                dashboard: 'Excel Native',
                // dashboard: 'Powerpoint Native',
                imageType: 'Sheet',
                imageId: '',
                url: '',
                appId: '',
                insightId: '',
                script: '',
            },
            style: {
                background: variables.defaultPrimary,
                border: {
                    width: {
                        size: 0,
                        unit: 'px',
                    },
                    style: 'none',
                    color: '',
                },
                height: {
                    size: 2,
                    unit: 'em',
                },
                width: {
                    size: 100,
                    unit: '%',
                },
                color: '#FFFFFF',
                fontSize: {
                    size: 1,
                    unit: 'em',
                },
                alignment: {
                    horizontal: 'left',
                },
            },
        };
        let savedInsightListener;
        scope.dashboardButtonDimensions.options = DEFAULT_OPTIONS;
        scope.dashboardButtonDimensions.highlightedPanel = '';
        scope.dashboardButtonDimensions.eventOptions =
            Object.values(EVENT_TYPE);
        scope.dashboardButtonDimensions.page = 'Button';
        scope.dashboardButtonDimensions.cssUnits = ['px', 'em', '%'];
        scope.dashboardButtonDimensions.borderUnits = ['px', 'em'];
        scope.dashboardButtonDimensions.borderStyles = [
            'none',
            'dotted',
            'dashed',
            'solid',
            'double',
        ];

        // Export to File
        scope.dashboardButtonDimensions.fileOptions = [
            'CSV',
            'TSV',
            'Excel',
            'Text',
        ];

        // Export Dashboard
        //scope.dashboardButtonDimensions.dashboardOptions = ['PowerPoint Native', 'PowerPoint Non-Native', 'Excel Native', 'Excel Non-Native'];
        scope.dashboardButtonDimensions.dashboardOptions = [
            'Excel Native',
            'Excel Non-Native',
            'PowerPoint Non-Native',
        ];

        // Export Image
        scope.dashboardButtonDimensions.image = {
            panelOptions: [],
            sheetOptions: [],
        };

        // Open Insight
        scope.dashboardButtonDimensions.appOptions = [];
        scope.dashboardButtonDimensions.insightOptions = [];

        // Functions
        scope.dashboardButtonDimensions.eventUpdated = eventUpdated;
        scope.dashboardButtonDimensions.createButton = createButton;
        scope.dashboardButtonDimensions.getInsights = getInsights;
        scope.dashboardButtonDimensions.mouseoverPanel = mouseoverPanel;
        scope.dashboardButtonDimensions.mouseleavePanel = mouseleavePanel;
        scope.dashboardButtonDimensions.resetStyle = resetStyle;
        scope.dashboardButtonDimensions.disableButton = disableButton;
        scope.dashboardButtonDimensions.getInitialScript = getInitialScript;

        /**
         * @name eventUpdated
         * @desc called whenever a user changes the click event type
         */
        function eventUpdated(): void {
            const selected = scope.dashboardButtonDimensions.options.event;
            reset();

            if (selected === EVENT_TYPE.OPEN_INSIGHT) {
                getApps();
            } else if (selected === EVENT_TYPE.EXPORT_IMAGE) {
                getPanels();
                getSheets();
            }
            getInitialScript();
        }
        /**
         * @name reset
         * @desc when a different click event is chosen, reset the additional fields to their defaults
         */
        function reset(): void {
            scope.dashboardButtonDimensions.options.eventOptions.file = 'CSV';
            (scope.dashboardButtonDimensions.options.eventOptions.delimiter =
                ''),
                // scope.dashboardButtonDimensions.options.eventOptions.dashboard = 'PowerPoint Native';
                (scope.dashboardButtonDimensions.options.eventOptions.dashboard =
                    'Excel Native');
            scope.dashboardButtonDimensions.options.eventOptions.imageType =
                'Sheet';
            scope.dashboardButtonDimensions.options.eventOptions.imageId = '';
            scope.dashboardButtonDimensions.options.eventOptions.url = '';
            scope.dashboardButtonDimensions.options.eventOptions.appId = '';
            scope.dashboardButtonDimensions.options.eventOptions.insightId = '';
            scope.dashboardButtonDimensions.options.eventOptions.script = '';
            scope.dashboardButtonDimensions.options.eventScript = '';
            scope.dashboardButtonDimensions.options.showScript = false;
        }

        /**
         * @name resetStyle
         * @desc resets the styles to the defaults
         */
        function resetStyle(): void {
            scope.dashboardButtonDimensions.options.style =
                DEFAULT_OPTIONS.style;
        }

        /**
         * @name getApps
         * @desc gets a list of apps
         */
        function getApps(): void {
            let components: PixelCommand[] = [],
                callback;

            components.push({
                meta: true,
                type: 'getProjectList',
                components: [],
                terminal: true,
            });

            callback = function (response) {
                const output = response.pixelReturn[0].output;
                scope.dashboardButtonDimensions.appOptions = output;

                if (output.length > 0) {
                    if (
                        !scope.dashboardButtonDimensions.options.eventOptions
                            .appId
                    ) {
                        scope.dashboardButtonDimensions.options.eventOptions.appId =
                            output[0].project_id;
                        getInsights();
                    } else {
                        getInsights(true);
                    }
                }
            };

            scope.widgetCtrl.meta(components, callback);
        }
        /**
         * @name getInsights
         * @desc gets a list of insights
         */
        function getInsights(edit?: boolean): void {
            let components: PixelCommand[] = [],
                callback;

            components.push({
                meta: true,
                type: 'getInsights',
                components: [
                    scope.dashboardButtonDimensions.options.eventOptions.appId,
                ],
                terminal: true,
            });

            callback = function (response) {
                const output = response.pixelReturn[0].output;
                scope.dashboardButtonDimensions.insightOptions = output;
                if (output.length > 0 && !edit) {
                    scope.dashboardButtonDimensions.options.eventOptions.insightId =
                        output[0].app_insight_id;
                }
            };

            scope.widgetCtrl.meta(components, callback);
        }

        /**
         * @name getSheets
         * @desc get the sheets in the workbook
         */
        function getSheets(): void {
            const sheets = scope.insightCtrl.getWorkbook('worksheets') || [];
            scope.dashboardButtonDimensions.image.sheetOptions = [];
            for (const sheet in sheets) {
                scope.dashboardButtonDimensions.image.sheetOptions.push({
                    sheetId: sheets[sheet].sheetId,
                    sheetLabel: sheets[sheet].sheetLabel,
                });
            }
        }

        /**
         * @name getPanels
         * @desc get the panels in the workbook
         */
        function getPanels(): void {
            const panels = scope.insightCtrl.getShared('panels') || [];
            scope.dashboardButtonDimensions.image.panelOptions = [];
            for (let i = 0; i < panels.length; i++) {
                scope.dashboardButtonDimensions.image.panelOptions.push(
                    panels[i].panelId
                );
            }
        }

        /**
         * @name mouseoverPanel
         * @desc Called when a user mouseover an option, will highlight the panel.
         * @param option - the panelId to highlight
         */
        function mouseoverPanel(option: any): void {
            scope.dashboardButtonDimensions.highlightedPanel = option;
            scope.insightCtrl.emit('highlight-panel', {
                insightID: scope.insightCtrl.insightID,
                panelId: option,
                highlight: true,
            });
        }

        /**
         * @name mouseleavePanel
         * @desc Called when a user's mouse leaves an option, will remove the highlight from the panel.
         * @param option - the panelId to remove the highlight from
         */
        function mouseleavePanel(option: any): void {
            scope.dashboardButtonDimensions.highlightedPanel = '';
            scope.insightCtrl.emit('highlight-panel', {
                insightID: scope.insightCtrl.insightID,
                panelId: option,
                highlight: false,
            });
        }

        /**
         * @name buildFileQuery
         * @desc builds the command list for "Export to File"
         */
        function buildFileQuery(): PixelCommand[] {
            let active = scope.widgetCtrl.getWidget('active'),
                layout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.' + layout
                ),
                components: PixelCommand[] = [],
                delimiter = '',
                frame = scope.widgetCtrl.getFrame(),
                fileType =
                    FILE_TYPE[
                        scope.dashboardButtonDimensions.options.eventOptions
                            .file
                    ];

            if (
                scope.dashboardButtonDimensions.options.eventOptions.file ===
                    'Text' &&
                scope.dashboardButtonDimensions.options.eventOptions.delimiter
            ) {
                delimiter =
                    scope.dashboardButtonDimensions.options.eventOptions
                        .delimiter;
            }

            if (keys && keys.length > 0) {
                let layerIndex = 0,
                    sortOptions = scope.widgetCtrl.getWidget(
                        'view.' + active + '.tasks.' + layerIndex + '.sortInfo'
                    ),
                    selectComponent: any[] = [],
                    groupComponent: any[] = [];

                for (
                    let keyIdx = 0, keyLen = keys.length;
                    keyIdx < keyLen;
                    keyIdx++
                ) {
                    if (keys[keyIdx].math) {
                        if (groupComponent.length === 0) {
                            groupComponent = keys[keyIdx].groupBy;
                        }
                    }

                    if (keys[keyIdx].calculatedBy) {
                        selectComponent.push({
                            calculatedBy: keys[keyIdx].calculatedBy,
                            math: keys[keyIdx].math,
                            alias: keys[keyIdx].alias,
                        });
                    } else {
                        selectComponent.push({
                            alias: keys[keyIdx].alias,
                            selector: keys[keyIdx].header,
                        });
                    }
                }
                components.push(
                    {
                        type: 'frame',
                        components: [frame.name],
                        meta: true,
                    },
                    {
                        type: 'select2',
                        components: [selectComponent],
                    },
                    {
                        type: 'group',
                        components: [groupComponent],
                    },
                    {
                        type: 'sortOptions',
                        components: [sortOptions],
                    }
                );
            } else {
                components.push(
                    {
                        type: 'frame',
                        components: [frame.name],
                        meta: true,
                    },
                    {
                        type: 'queryAll',
                        components: [],
                    }
                );
            }

            components.push(
                {
                    type: 'with',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: fileType,
                    components: ['<DELIMITER>'],
                    terminal: true,
                }
            );
            return components;
        }
        /**
         * @name getInitialScript
         * @desc sets an initial script for each event type
         */
        function getInitialScript(): void {
            let script = '';
            switch (scope.dashboardButtonDimensions.options.event) {
                case EVENT_TYPE.EXPORT_FILE:
                    const components: PixelCommand[] = buildFileQuery();
                    script = semossCoreService.pixel.build(components);
                    break;
                case EVENT_TYPE.EXPORT_DASHBOARD:
                    let type = '';
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .dashboard === 'Excel Native'
                    ) {
                        type = 'exportToExcel';
                    } else if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .dashboard === 'Excel Non-Native'
                    ) {
                        type = 'exportToExcelNN';
                    } else if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .dashboard === 'PowerPoint Native'
                    ) {
                        type = 'exportToPPT';
                    } else if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .dashboard === 'PowerPoint Non-Native'
                    ) {
                        type = 'exportToPPTNN';
                    }
                    script = semossCoreService.pixel.build([
                        {
                            type: type,
                            components: [],
                            meta: true,
                            terminal: true,
                        },
                    ]);
                    break;
                case EVENT_TYPE.EXPORT_IMAGE:
                    script = semossCoreService.pixel.build([
                        {
                            type: 'exportImage',
                            components: ['<BASE_URL>', '<URL>'],
                            meta: true,
                            terminal: true,
                        },
                    ]);
                    break;
                case EVENT_TYPE.OPEN_INSIGHT:
                    script = semossCoreService.pixel.build([
                        {
                            type: 'openInsight',
                            components: ['<APP_ID>', '<INSIGHT_ID>'],
                            meta: true,
                            terminal: true,
                        },
                    ]);
                    break;
                case EVENT_TYPE.OPEN_URL:
                    script = semossCoreService.pixel.build([
                        {
                            type: 'openTab',
                            components: ['<URL>'],
                            meta: true,
                            terminal: true,
                        },
                    ]);
                    break;
                case EVENT_TYPE.CUSTOM_SCRIPT:
                    break;
                default:
                    break;
            }
            scope.dashboardButtonDimensions.options.eventScript = script;
        }
        /**
         * @name buildEventScript
         * @desc builds the actual script for the click event
         */
        function buildEventScript(): string {
            let script: string =
                scope.dashboardButtonDimensions.options.eventScript;
            switch (scope.dashboardButtonDimensions.options.event) {
                case EVENT_TYPE.EXPORT_FILE:
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .file === 'Text'
                    ) {
                        script = script.replace(
                            '<DELIMITER>',
                            scope.dashboardButtonDimensions.options.eventOptions
                                .delimiter
                        );
                    }
                    break;
                case EVENT_TYPE.EXPORT_DASHBOARD:
                    break;
                case EVENT_TYPE.EXPORT_IMAGE:
                    let appId = scope.insightCtrl.getShared('insight.app_id'),
                        appInsightId = scope.insightCtrl.getShared(
                            'insight.app_insight_id'
                        ),
                        baseUrl = $location.absUrl().split('#')[0],
                        fullUrl = baseUrl;

                    fullUrl += `#!/insight?engine=${appId}&id=${appInsightId}`;

                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .imageType === 'Panel'
                    ) {
                        fullUrl += `&panel=${scope.dashboardButtonDimensions.options.eventOptions.imageId}`;
                    } else if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .imageType === 'Sheet'
                    ) {
                        fullUrl += `&sheet=${scope.dashboardButtonDimensions.options.eventOptions.imageId}`;
                    }

                    script = script.replace('<BASE_URL>', baseUrl);
                    script = script.replace('<URL>', fullUrl);
                    break;
                case EVENT_TYPE.OPEN_INSIGHT:
                    script = script.replace(
                        '<APP_ID>',
                        scope.dashboardButtonDimensions.options.eventOptions
                            .appId
                    );
                    script = script.replace(
                        '<INSIGHT_ID>',
                        scope.dashboardButtonDimensions.options.eventOptions
                            .insightId
                    );
                    break;
                case EVENT_TYPE.OPEN_URL:
                    script = script.replace(
                        '<URL>',
                        scope.dashboardButtonDimensions.options.eventOptions.url
                    );
                    break;
                case EVENT_TYPE.CUSTOM_SCRIPT:
                    script =
                        scope.dashboardButtonDimensions.options.eventOptions
                            .script;
                    break;
                default:
                    break;
            }
            return script;
        }
        /**
         * @name createButton
         * @desc creates the button as a new panel in the dashboard
         */
        function createButton(): void {
            const components: PixelCommand[] = [],
                script = buildEventScript();
            const options: options = {
                label: scope.dashboardButtonDimensions.options.label,
                event: scope.dashboardButtonDimensions.options.event,
                style: {
                    background:
                        scope.dashboardButtonDimensions.options.style
                            .background,
                    color: scope.dashboardButtonDimensions.options.style.color,
                    border: {
                        width: {
                            size: scope.dashboardButtonDimensions.options.style
                                .border.width.size,
                            unit: scope.dashboardButtonDimensions.options.style
                                .border.width.unit,
                        },
                        style: scope.dashboardButtonDimensions.options.style
                            .border.style,
                        color: scope.dashboardButtonDimensions.options.style
                            .border.color,
                    },
                    height: {
                        size: scope.dashboardButtonDimensions.options.style
                            .height.size,
                        unit: scope.dashboardButtonDimensions.options.style
                            .height.unit,
                    },
                    width: {
                        size: scope.dashboardButtonDimensions.options.style
                            .width.size,
                        unit: scope.dashboardButtonDimensions.options.style
                            .width.unit,
                    },
                    fontSize: {
                        size: scope.dashboardButtonDimensions.options.style
                            .fontSize.size,
                        unit: scope.dashboardButtonDimensions.options.style
                            .fontSize.unit,
                    },
                    alignment: {
                        horizontal:
                            scope.dashboardButtonDimensions.options.style
                                .alignment.horizontal,
                    },
                },
                eventOptions: {},
                eventScript: script,
            };

            if (scope.dashboardButtonDimensions.highlightedPanel.length > 0) {
                mouseleavePanel(
                    scope.dashboardButtonDimensions.highlightedPanel
                );
            }

            switch (scope.dashboardButtonDimensions.options.event) {
                case EVENT_TYPE.EXPORT_FILE:
                    options.eventOptions.file =
                        scope.dashboardButtonDimensions.options.eventOptions.file;
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .delimiter
                    ) {
                        options.eventOptions.delimiter =
                            scope.dashboardButtonDimensions.options.eventOptions.delimiter;
                    }
                    break;
                case EVENT_TYPE.EXPORT_DASHBOARD:
                    options.eventOptions.dashboard =
                        scope.dashboardButtonDimensions.options.eventOptions.dashboard;
                    break;
                case EVENT_TYPE.EXPORT_IMAGE:
                    options.eventOptions.imageType =
                        scope.dashboardButtonDimensions.options.eventOptions.imageType;
                    options.eventOptions.imageId =
                        scope.dashboardButtonDimensions.options.eventOptions.imageId;
                    break;
                case EVENT_TYPE.OPEN_INSIGHT:
                    options.eventOptions.appId =
                        scope.dashboardButtonDimensions.options.eventOptions.appId;
                    options.eventOptions.insightId =
                        scope.dashboardButtonDimensions.options.eventOptions.insightId;
                    break;
                case EVENT_TYPE.OPEN_URL:
                    options.eventOptions.url =
                        scope.dashboardButtonDimensions.options.eventOptions.url;
                    break;
                case EVENT_TYPE.CUSTOM_SCRIPT:
                    options.eventOptions.script =
                        scope.dashboardButtonDimensions.options.eventOptions.script;
                    break;
            }

            components.push(
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'setPanelView',
                    components: ['dashboard-button', options],
                    terminal: true,
                }
            );

            if (components.length > 1) {
                scope.insightCtrl.execute(components);
            }
        }

        /**
         * @name disableButton
         * @desc disable the button if the required fields are not filled out
         */
        function disableButton(): boolean {
            if (scope.dashboardButtonDimensions.options.label.length === 0) {
                return true;
            }

            if (scope.dashboardButtonDimensions.options.event.length === 0) {
                return true;
            }

            switch (scope.dashboardButtonDimensions.options.event) {
                case EVENT_TYPE.EXPORT_FILE:
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .file.length === 0
                    ) {
                        return true;
                    }
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .file === 'Text' &&
                        scope.dashboardButtonDimensions.options.eventOptions
                            .delimiter.length === 0
                    ) {
                        return true;
                    }
                    break;
                case EVENT_TYPE.EXPORT_DASHBOARD:
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .dashboard.length === 0
                    ) {
                        return true;
                    }
                    break;
                case EVENT_TYPE.EXPORT_IMAGE:
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .imageType.length === 0 ||
                        scope.dashboardButtonDimensions.options.eventOptions
                            .imageId.length === 0
                    ) {
                        return true;
                    }
                    break;
                case EVENT_TYPE.OPEN_INSIGHT:
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .appId.length === 0 ||
                        scope.dashboardButtonDimensions.options.eventOptions
                            .insightId.length === 0
                    ) {
                        return true;
                    }
                    break;
                case EVENT_TYPE.OPEN_URL:
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions.url
                            .length === 0
                    ) {
                        return true;
                    }
                    break;
                case EVENT_TYPE.CUSTOM_SCRIPT:
                    if (
                        scope.dashboardButtonDimensions.options.eventOptions
                            .script.length === 0
                    ) {
                        return true;
                    }
                    break;
            }
            return false;
        }

        /**
         * @name setEventOptions
         * @desc set the options for the click event
         */
        function setEventOptions() {
            const defaultEvents = Object.values(EVENT_TYPE);
            if (
                !scope.widgetCtrl.getShared('insight.app_id') &&
                !scope.widgetCtrl.getShared('insight.app_insight_id')
            ) {
                const events: string[] = [];
                for (let i = 0; i < defaultEvents.length; i++) {
                    if (defaultEvents[i] !== EVENT_TYPE.EXPORT_IMAGE) {
                        events.push(defaultEvents[i]);
                    }
                }
                scope.dashboardButtonDimensions.eventOptions = events;
            } else {
                scope.dashboardButtonDimensions.eventOptions = defaultEvents;
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         */
        function initialize(): void {
            let options: options =
                scope.widgetCtrl.getWidget('view.dashboard-button.options') ||
                {};
            options = angular.merge({}, DEFAULT_OPTIONS, options);
            scope.dashboardButtonDimensions.options = options;
            setEventOptions();
            if (options.eventScript.length === 0) {
                getInitialScript();
            }

            if (
                scope.dashboardButtonDimensions.options.event ===
                EVENT_TYPE.OPEN_INSIGHT
            ) {
                getApps();
            } else if (
                scope.dashboardButtonDimensions.options.event ===
                EVENT_TYPE.EXPORT_IMAGE
            ) {
                getPanels();
                getSheets();
            }

            savedInsightListener = scope.insightCtrl.on(
                'saved-insight',
                setEventOptions
            );

            scope.$on('$destroy', function () {
                savedInsightListener();
            });
        }

        initialize();
    }
}
