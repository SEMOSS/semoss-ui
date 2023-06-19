'use strict';

import angular from 'angular';

import './view-layout.scss';

export default angular
    .module('app.view.view-layout', [])
    .directive('viewLayout', viewLayoutDirective);

viewLayoutDirective.$inject = ['CONFIG', 'semossCoreService'];

function viewLayoutDirective(
    CONFIG: any,
    semossCoreService: SemossCoreService
) {
    viewLayoutCtrl.$inject = [];
    viewLayoutLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '^view'],
        controllerAs: 'viewLayout',
        bindToController: {},
        template: require('./view-layout.directive.html'),
        controller: viewLayoutCtrl,
        link: viewLayoutLink,
    };

    function viewLayoutCtrl() {}

    function viewLayoutLink(scope, ele, attrs, ctrl) {
        const SORT_TYPES = {
            USE: [
                'Comparison',
                'Trends',
                'Metrics',
                'Map',
                'Part-to-whole',
                'Distribution',
                'Report Widgets',
                'Connections',
                'Pipeline',
                'Words',
                'External Library',
            ],
        };
        scope.widgetCtrl = ctrl[0];
        scope.viewCtrl = ctrl[1];

        scope.viewLayout.layer = {};

        scope.viewLayout.layout = {
            raw: {},
            selected: {
                view: '',
                layout: '',
            },
            searched: {},
            search: '',
        };

        scope.viewLayout.sort = {
            selected: {
                display: 'Usage',
                value: 'USE',
                groupings: SORT_TYPES.USE,
            },
            options: [
                {
                    display: 'Usage',
                    value: 'USE',
                    groupings: SORT_TYPES.USE,
                },
            ],
        };
        scope.viewLayout.isLayoutFilteredEmpty = false;
        scope.viewLayout.colNum = 4;
        let viewLayoutEle: HTMLElement;

        scope.viewLayout.searchLayout = searchLayout;
        scope.viewLayout.changeLayout = changeLayout;
        scope.viewLayout.isLayoutRecommended = isLayoutRecommended;
        scope.viewLayout.isLayoutDisabled = isLayoutDisabled;

        /**
         * @name initializeLayout
         * @desc set the layout options
         */
        function initializeLayout(): void {
            // get the options
            const configs = semossCoreService.getVisualizationConfig();

            for (
                let sortId = 0;
                sortId < scope.viewLayout.sort.options.length;
                sortId++
            ) {
                const sortType = scope.viewLayout.sort.options[sortId];
                scope.viewLayout.layout.raw[sortType.value] = {};
            }

            for (let i = 0, len = configs.length; i < len; i++) {
                if (
                    configs[i] &&
                    configs[i].visualization &&
                    configs[i].visualization.showOnVisualPanel
                ) {
                    const message = checkRequirements(configs[i]);
                    const sortGroup = configs[i].visualization.visualPanelMenu;

                    const config = {
                        id: configs[i].id,
                        name: configs[i].name,
                        icon: configs[i].icon,
                        title: message ? message : configs[i].name,
                        disabled: !!message,
                        group: configs[i].visualization.group,
                        view: configs[i].visualization.view,
                        layout: configs[i].visualization.layout,
                        type: configs[i].visualization.type
                            ? configs[i].visualization.type[0]
                            : undefined,
                        sortGroup: sortGroup,
                    };

                    for (const group in sortGroup) {
                        const grouping = sortGroup[group];
                        if (
                            scope.viewLayout.layout.raw[group].hasOwnProperty([
                                grouping,
                            ])
                        ) {
                            scope.viewLayout.layout.raw[group][grouping].push(
                                config
                            );
                        } else {
                            scope.viewLayout.layout.raw[group][grouping] = [
                                config,
                            ];
                        }
                    }
                }
            }
        }

        /**
         * @name resetLayout
         * @desc reset the layout
         */
        function resetLayout(): void {
            // set the new layer
            scope.viewLayout.layer = scope.viewCtrl.getLayer();

            // change the new layout
            let layout = '',
                type = '',
                active = '',
                id = '';
            const view = scope.viewCtrl.getActive();

            if (Object.keys(view).length > 0) {
                layout = view.layout ? view.layout : '';
                type = view.type ? view.type : '';
                active = view.view ? view.view : '';
                id = view.id ? view.id : '';
            } else {
                active = scope.widgetCtrl.getWidget('active');
                if (active === 'visualization') {
                    const tasks =
                        scope.widgetCtrl.getWidget(
                            'view.visualization.tasks'
                        ) || [];

                    // look throught the tasks, the selected on is the same as the selected layer
                    for (
                        let taskIdx = 0, taskLen = tasks.length;
                        taskIdx < taskLen;
                        taskIdx++
                    ) {
                        const layer = tasks[taskIdx].layer;

                        // default to the first one
                        if (!layout) {
                            layout = tasks[taskIdx].layout;
                        }

                        // this is the one
                        if (layer && layer.id === scope.viewLayout.layer.id) {
                            layout = tasks[taskIdx].layout;
                            break;
                        }
                    }

                    type = scope.widgetCtrl.getWidget(
                        'view.visualization.options.type'
                    );
                }
            }

            // set the new layout
            changeLayout(active, layout, type, false, id);

            // reset the search
            scope.viewLayout.layout.search = '';
            searchLayout();
        }

        /**
         * @name searchLayout
         * @desc search layouts based on a term
         */
        function searchLayout(): void {
            const cleaned = String(scope.viewLayout.layout.search)
                .replace(/ /g, '_')
                .toUpperCase();

            if (!cleaned) {
                scope.viewLayout.layout.searched =
                    scope.viewLayout.layout.raw[
                        scope.viewLayout.sort.selected.value
                    ];
                return;
            }

            // clear it out
            scope.viewLayout.layout.searched = {};
            let options =
                    scope.viewLayout.layout.raw[
                        scope.viewLayout.sort.selected.value
                    ],
                isFilteredEmpty = true;

            for (const groupId in options) {
                const groupConfig: any = [],
                    group = options[groupId];
                for (let configId = 0; configId < group.length; configId++) {
                    const config = group[configId];
                    if (config.name.toUpperCase().indexOf(cleaned) > -1) {
                        groupConfig.push(config);
                        isFilteredEmpty = false;
                    }
                }
                scope.viewLayout.layout.searched[groupId] = groupConfig;
                scope.viewLayout.isLayoutFilteredEmpty = isFilteredEmpty;
            }
        }

        /**
         * @name changeLayout
         * @param layout - layout
         * @desc set the new layout
         */
        function changeLayout(
            view: string,
            layout: string,
            type: string,
            paint: boolean,
            id?: string
        ): void {
            scope.viewLayout.layout.selected = {
                view: view,
                layout: layout,
                type: type,
                id: id,
            };

            scope.viewCtrl.updatedActive(
                paint,
                scope.viewLayout.layout.selected
            );
        }

        /**
         * @name isLayoutRecommended
         * @param  config - config for the layout
         * @desc used by the view to determine if the visualization is recommended for the current frame headers
         * @return true if it is recommended
         */
        function isLayoutRecommended(config: any): boolean {
            if (scope.widgetCtrl.getShared('frame.recommendations')) {
                return (
                    Object.keys(
                        scope.widgetCtrl.getShared('frame.recommendations')
                    ).indexOf(config.name) > -1
                );
            }

            return false;
        }

        /**
         * @name isLayoutDisabled
         * @param  config - config for the layout
         * @desc check to see if this visual needs to be disabled
         * @returns disabled true/false
         */
        function isLayoutDisabled(config: any): boolean {
            if (
                !scope.viewLayout.layer ||
                Object.keys(scope.viewLayout.layer).length === 0
            ) {
                return false;
            }

            // we only disable for none base layers
            if (scope.viewLayout.layer.taskIdx !== 0) {
                const layout = scope.widgetCtrl.getWidget(
                        'view.visualization.tasks.0.layout'
                    ),
                    type = scope.widgetCtrl.getWidget(
                        'view.visualization.options.type'
                    ),
                    widget =
                        semossCoreService.getActiveVisualizationId(
                            layout,
                            type
                        ) || '',
                    layers =
                        semossCoreService.getSpecificConfig(
                            widget,
                            'visualization.layers'
                        ) || [];

                if (!layers || layers.indexOf(config.layout) === -1) {
                    return true;
                }
            }

            return false;
        }

        /** Helpers */
        /**
         * @name checkRequirements
         * @param  config - config for the layout
         * @desc validate the visualization and see if it is hidden or disabled. Send a message. Based on the requirements
         * @returns message
         */
        function checkRequirements(config): string {
            let message = '';
            // if it is a frame then look at specifics
            message = checkRRequirements(config);
            if (message) {
                return message;
            }

            message = checkPyRequirements(config);
            if (message) {
                return message;
            }

            return '';
        }

        /**
         * @name checkRRequirements
         * @param config - config for the layout
         * @desc validate the visualization and see if it is hidden or disabled. Send a message. Based on the r requirements
         * @returns message
         */
        function checkRRequirements(config: any): string {
            if (config.required.R) {
                if (!CONFIG.r) {
                    return 'R is missing. Please install it.';
                }

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
         * @param config - config for the layout
         * @desc validate the visualization and see if it is hidden or disabled. Send a message. Based on the py requirements
         * @returns message
         */
        function checkPyRequirements(config: any): string {
            if (config.required.PY) {
                if (!CONFIG.python) {
                    return 'Python is missing. Please install it.';
                }

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
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // register messages
            scope.$on('view--layer-updated', function () {
                resetLayout();
            });

            viewLayoutEle = ele[0].querySelector('div.view-layout');

            scope.$watch(
                function () {
                    return viewLayoutEle.offsetWidth;
                },
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        scope.viewLayout.colNum = Math.floor(
                            (newValue + 96) / 120
                        ); // calculate the number of columns based on the breakpoints defined
                        if (scope.viewLayout.colNum > 7) {
                            scope.viewLayout.colNum = 7;
                        }
                    }
                }
            );

            // sync with other instances of view-layout
            scope.$on('view--active-updated', (event, paint) => {
                scope.viewLayout.layout.selected = scope.viewCtrl.getActive();
            });

            // get the initial options (only needs to be called once)
            initializeLayout();

            // set the layout
            resetLayout();
        }

        initialize();
    }
}
