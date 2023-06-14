'use strict';

import angular from 'angular';

import Utility from '../../../utility/utility';

import './view-tools.scss';

export default angular
    .module('app.view.view-tools', [])
    .directive('viewTools', viewToolsDirective);

viewToolsDirective.$inject = [
    'WIDGET_APPLIED_MAPPING',
    'semossCoreService',
    '$timeout',
];

function viewToolsDirective(
    WIDGET_APPLIED_MAPPING,
    semossCoreService: SemossCoreService,
    $timeout
) {
    viewToolsCtrl.$inject = [];
    viewToolsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '^view'],
        controllerAs: 'viewTools',
        bindToController: {},
        template: require('./view-tools.directive.html'),
        controller: viewToolsCtrl,
        link: viewToolsLink,
    };

    function viewToolsCtrl() {}

    function viewToolsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.viewCtrl = ctrl[1];

        scope.viewTools.active = {
            view: '',
            layout: '',
        };
        scope.viewTools.selectedView = 'LIST';
        scope.viewTools.widget = {
            html: '',
            name: '',
        };
        scope.viewTools.hidden = '';
        scope.viewTools.search = '';
        scope.viewTools.tools = [];

        scope.viewTools.openTool = openTool;

        /**
         * @name resetTools
         * @desc reset the tools
         */
        function resetTools(): void {
            // set the new active
            scope.viewTools.active = scope.viewCtrl.getActive();

            // reset the tools
            scope.viewTools.search = '';
            scope.viewTools.tools = [];
            // scope.viewTools.widget = {
            //     html: '',
            //     name: ''
            // };
            scope.viewTools.hidden = '';

            if (Object.keys(scope.viewTools.active).length === 0) {
                return;
            }

            // try to get tools from the layout. If they are not there, resort to the view
            let tools = [];
            if (scope.viewTools.active.layout) {
                const type = scope.widgetCtrl.getWidget(
                    'view.visualization.options.type'
                );
                const widget = semossCoreService.getActiveVisualizationId(
                    scope.viewTools.active.layout,
                    type
                );

                if (widget) {
                    tools =
                        semossCoreService.getSpecificConfig(
                            widget,
                            'visualization.tools'
                        ) || [];
                }
            }

            if (tools.length === 0) {
                tools =
                    semossCoreService.getSpecificConfig(
                        scope.viewTools.active.view,
                        'visualization.tools'
                    ) || [];
            }

            scope.viewTools.tools = [];
            for (
                let toolIdx = 0, toolLen = tools.length;
                toolIdx < toolLen;
                toolIdx++
            ) {
                const config = semossCoreService.getSpecificConfig(
                    tools[toolIdx]
                );

                if (!config || Object.keys(config).length === 0) {
                    continue;
                }

                // intentionally validate + style with the scope one, so we can override if needed
                const message = validateTool(config);

                let title = '';
                if (message) {
                    title = message;
                } else if (config.description) {
                    title = config.name + ' - ' + config.description;
                } else {
                    title = config.name;
                }

                scope.viewTools.tools.push({
                    title: title,
                    name: config.name,
                    description: config.description || '',
                    widget: tools[toolIdx],
                    icon: config.icon,
                    disabled: !!message,
                    active: isToolActive(config),
                });
            }

            // sort
            Utility.sort(scope.viewTools.tools, 'name');
            // only empty out the view if the widget no longer exist in the list
            if (scope.viewTools.widget.name) {
                let widgetExists = false;
                for (
                    let toolIdx = 0;
                    toolIdx < scope.viewTools.tools.length;
                    toolIdx++
                ) {
                    if (
                        scope.viewTools.tools[toolIdx].name ===
                        scope.viewTools.widget.name
                    ) {
                        widgetExists = true;
                        break;
                    }
                }

                if (!widgetExists) {
                    scope.viewTools.selectedView = 'LIST';
                    scope.viewTools.widget = {
                        html: '',
                        name: '',
                    };
                }
            }
        }

        /**
         * @name validateTool
         * @param config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message.
         * @returns message string
         */
        function validateTool(config: any): string {
            if (config.widgetList.showCondition) {
                const message = checkShowConditions(config);
                if (message) {
                    return message;
                }
            }

            if (config.required) {
                const message = checkRequirements(config);
                if (message) {
                    return message;
                }
            }

            return '';
        }

        /**
         * @name openTool
         * @desc open a tool
         * @param {any} widget - widget to add
         */
        function openTool(widget: any): any {
            const widgetName = widget.widget,
                config = semossCoreService.getSpecificConfig(widgetName);

            if (!config || Object.keys(config).length === 0) {
                return;
            }

            // Auto-executed widgets
            if (
                (config.content &&
                    config.content.json &&
                    config.content.json[0].execute === 'auto') ||
                (config.content &&
                    config.content.template &&
                    config.content.template.execute === 'auto')
            ) {
                scope.viewTools.hidden = '';
                semossCoreService
                    .loadWidget(widgetName, 'content')
                    .then((html: string) => {
                        $timeout(function () {
                            scope.viewTools.hidden = html;
                        });
                    });

                return;
            }

            // Widgets that open in a panel
            if (config.hasOwnProperty('view') && config.view) {
                const active = scope.widgetCtrl.getWidget('active');
                if (active !== widgetName) {
                    const viewComponents = [
                        {
                            type: 'panel',
                            components: [scope.widgetCtrl.panelId],
                            meta: false,
                        },
                        {
                            type: 'setPanelView',
                            components: [widgetName],
                            terminal: true,
                        },
                    ];

                    scope.widgetCtrl.execute(viewComponents);
                }

                return;
            }

            // Widgets that open in side menu
            if (scope.viewTools.widget.name !== widget.name) {
                semossCoreService
                    .loadWidget(widgetName, 'content')
                    .then((html: string) => {
                        scope.viewTools.widget.html = html;
                        scope.viewTools.widget.name = widget.name;
                        scope.viewTools.selectedView = 'WIDGET';
                    });
            } else {
                scope.viewTools.selectedView = 'WIDGET';
            }
        }

        /**
         * @name checkShowConditions
         * @param config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the show conditions
         * @returns message
         */
        function checkShowConditions(config: any): string {
            const layerIndex = 0;
            for (
                let showIdx = 0,
                    showLen = config.widgetList.showCondition.length;
                showIdx < showLen;
                showIdx++
            ) {
                if (config.widgetList.showCondition[showIdx] === 'facet-all') {
                    if (
                        scope.widgetCtrl.getWidget(
                            'view.visualization.tasks.' +
                                layerIndex +
                                '.groupByInfo.viewType'
                        ) !== 'All Instances'
                    ) {
                        return 'Not a facet. Facet on All Instances to enable.';
                    }
                } else if (
                    config.widgetList.showCondition[showIdx] ===
                    'multi-value-dimensions'
                ) {
                    const keys = scope.widgetCtrl.getWidget(
                            'view.visualization.keys'
                        ),
                        layout = scope.widgetCtrl.getWidget(
                            'view.visualization.layout'
                        );

                    // if the widget is toggle stack and the visualization is stack, allow it
                    if (config.name === 'Stack/Unstack' && layout === 'Stack') {
                        break;
                    }

                    if (keys && layout) {
                        let headerList = keys[layout],
                            valueCount = 0;

                        for (
                            let headerIdx = 0, headerLen = headerList.length;
                            headerIdx < headerLen;
                            headerIdx++
                        ) {
                            if (headerList[headerIdx].model === 'value') {
                                valueCount++;
                            }
                        }

                        if (valueCount < 2) {
                            return 'Not applicable to current visualization. Increase the number of "value" dimensions to enable.';
                        }
                    }
                }
            }

            return '';
        }

        /**
         * @name checkRequirements
         * @param  config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the requirements
         * @returns message
         */
        function checkRequirements(config: any): string {
            let message = '';
            // if it is a frame then look at specifics
            if (config.required.Frame) {
                message = checkFrameRequirements(config);
                if (message) {
                    return message;
                }
            } else {
                message = checkRRequirements(config);
                if (message) {
                    return message;
                }

                message = checkPyRequirements(config);
                if (message) {
                    return message;
                }
            }

            message = checkSocialRequirements(config);
            if (message) {
                return message;
            }

            return '';
        }

        /**
         * @name checkFrameRequirements
         * @param config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the frame requirements
         * @returns message
         */
        function checkFrameRequirements(config: any): string {
            let frameType = scope.widgetCtrl.getFrame('type'),
                message;

            if (config.required.Frame.indexOf(frameType) === -1) {
                return `${
                    config.name
                } requires the frame to be one of the following ${config.required.Frame.join(
                    ', '
                )}`;
            } else if (frameType === 'R') {
                message = checkRRequirements(config);
                if (message) {
                    return message;
                }
            } else if (frameType === 'PY') {
                message = checkPyRequirements(config);
                if (message) {
                    return message;
                }
            }

            return '';
        }

        /**
         * @name checkRRequirements
         * @param config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the r requirements
         * @returns message
         */
        function checkRRequirements(config: any): string {
            if (config.required.R) {
                let installedPackages =
                        semossCoreService.getWidgetState(
                            'installedPackages.R'
                        ) || [],
                    missingPackages: string[] = [];

                if (installedPackages.length > 0) {
                    for (
                        let requiredPackageIdx = 0,
                            requiredPackageLen = config.required.R.length;
                        requiredPackageIdx < requiredPackageLen;
                        requiredPackageIdx++
                    ) {
                        if (
                            installedPackages.indexOf(
                                config.required.R[requiredPackageIdx]
                            ) === -1
                        ) {
                            missingPackages.push(
                                config.required.R[requiredPackageIdx]
                            );
                        }
                    }
                } else {
                    missingPackages = config.required.R;
                }

                if (missingPackages.length > 0) {
                    return `${config.name} is missing ${missingPackages.join(
                        ', '
                    )}`;
                }
            }

            return '';
        }

        /**
         * @name checkPyRequirements
         * @param config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the py requirements
         * @returns message
         */
        function checkPyRequirements(config: any): string {
            if (config.required.PY) {
                let installedPackages =
                        semossCoreService.getWidgetState(
                            'installedPackages.PY'
                        ) || [],
                    missingPackages: string[] = [];

                if (installedPackages.length > 0) {
                    for (
                        let requiredPackageIdx = 0,
                            requiredPackageLen = config.required.PY.length;
                        requiredPackageIdx < requiredPackageLen;
                        requiredPackageIdx++
                    ) {
                        if (
                            installedPackages.indexOf(
                                config.required.PY[requiredPackageIdx]
                            ) === -1
                        ) {
                            missingPackages.push(
                                config.required.PY[requiredPackageIdx]
                            );
                        }
                    }
                } else {
                    missingPackages = config.required.PY;
                }

                if (missingPackages.length > 0) {
                    return `${config.name} is missing ${missingPackages.join(
                        ', '
                    )}`;
                }
            }

            return '';
        }

        /**
         * @name checkSocialRequirements
         * @param config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the social requirements
         * @returns message
         */
        function checkSocialRequirements(config: any): string {
            if (config.required.Social) {
                let activeLogins = semossCoreService.getCurrentLogins() || {},
                    missingSocial: string[] = [];

                activeLogins = Object.keys(activeLogins);

                if (activeLogins.length > 0) {
                    for (
                        let requiredSocialIdx = 0,
                            requiredSocialLen = config.required.Social.length;
                        requiredSocialIdx < requiredSocialLen;
                        requiredSocialIdx++
                    ) {
                        if (
                            activeLogins.indexOf(
                                config.required.Social[requiredSocialIdx]
                            ) === -1
                        ) {
                            missingSocial.push(
                                config.required.Social[requiredSocialIdx]
                            );
                        }
                    }
                } else {
                    missingSocial = config.required.Social;
                }

                if (missingSocial.length > 0) {
                    return `${config.name} is missing ${missingSocial.join(
                        ', '
                    )}`;
                }
            }

            return '';
        }

        /**
         * @name isToolActive
         * @param config - widget config
         * @desc check if the widget is active
         * @returns boolean
         */
        function isToolActive(config: any): boolean {
            let widget: string;

            if (config.parent) {
                widget = config.parent;
            } else {
                widget = config.id;
            }

            if (WIDGET_APPLIED_MAPPING[widget]) {
                // Grab the paths array
                const paths = semossCoreService.utility.freeze(
                    WIDGET_APPLIED_MAPPING[widget].paths
                );

                // Loop through it
                for (
                    let pathIdx = 0, pathLen = paths.length;
                    pathIdx < pathLen;
                    pathIdx++
                ) {
                    let traversal = semossCoreService.utility.freeze(
                        scope.widgetCtrl.getWidget(paths[pathIdx])
                    );

                    // null is same as false so we will treat it as false for comparison
                    if (traversal === null) {
                        traversal = false;
                    }

                    // TODO should be checking all the values in the object and array to ensure there is/isn't a change from the default
                    if (Array.isArray(traversal)) {
                        if (
                            traversal.length !==
                            WIDGET_APPLIED_MAPPING[widget].defaultValues[
                                pathIdx
                            ].length
                        ) {
                            return true;
                        }
                    } else if (typeof traversal === 'object') {
                        // We have cases where our comparator is an object, can't do {} !== {} b/c that
                        // evaluates to true. So we compare key length instead
                        if (
                            Object.keys(traversal).length !==
                            Object.keys(
                                WIDGET_APPLIED_MAPPING[widget].defaultValues[
                                    pathIdx
                                ]
                            ).length
                        ) {
                            return true;
                        }
                    } else if (typeof traversal === 'boolean') {
                        const layout = scope.widgetCtrl.getWidget(
                            'view.visualization.layout'
                        );
                        // return the opposite for stack visualization because it's default state is stacked
                        if (
                            config.name === 'Stack/Unstack' &&
                            layout === 'Stack'
                        ) {
                            return !traversal;
                        }

                        return traversal;
                    } else if (
                        traversal + '' !==
                        WIDGET_APPLIED_MAPPING[widget].defaultValues[pathIdx] +
                            ''
                    ) {
                        // If the corresponding value found at the path is NOT equal to the default, that means that this widget is
                        // currently being applied so we apply our style and break
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * @name refreshTool
         * @desc update the tools mesage
         */
        function refreshTool(): void {
            for (
                let toolIdx = 0, toolLen = scope.viewTools.tools.length;
                toolIdx < toolLen;
                toolIdx++
            ) {
                const config = semossCoreService.getSpecificConfig(
                    scope.viewTools.tools[toolIdx].widget
                );

                if (!config || Object.keys(config).length === 0) {
                    continue;
                }

                // intentionally validate + style with the scope one, so we can override if needed
                const message = validateTool(config);

                let title = '';
                if (message) {
                    title = message;
                } else if (config.description) {
                    title = config.name + ' - ' + config.description;
                } else {
                    title = config.name;
                }

                scope.viewTools.tools[toolIdx].active = isToolActive(config);
                scope.viewTools.tools[toolIdx].title = title;
                scope.viewTools.tools[toolIdx].disabled = !!message;
            }
        }

        /**
         * @name destroyHiddenTool
         * @desc set the hidden content to null
         */
        function destroyHiddenTool(): void {
            scope.viewTools.hidden = '';
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            let updateOrnamentsListener: () => void,
                updateViewListener: () => void,
                hiddenWidgetDestroyListener: () => void;

            // updates if the ornaments updates
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                refreshTool
            );
            updateViewListener = scope.widgetCtrl.on('update-view', resetTools);
            hiddenWidgetDestroyListener = scope.widgetCtrl.on(
                'hidden-widget-destroy',
                destroyHiddenTool
            );
            scope.$on('view--active-updated', resetTools);

            // visualizationup
            scope.$on('$destroy', function () {
                updateOrnamentsListener();
                updateViewListener();
                hiddenWidgetDestroyListener();
            });

            // this will auto update the builder as well
            resetTools();
        }

        initialize();
    }
}
