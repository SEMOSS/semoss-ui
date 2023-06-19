export default angular
    .module('app.widget-menu.directive', [])
    .directive('widgetMenu', widgetMenuDirective);

import './widget-menu.scss';

widgetMenuDirective.$inject = [
    'semossCoreService',
    'PLAYGROUND',
    'CONFIG',
    'HIDDEN_WIDGETS',
];

function widgetMenuDirective(
    semossCoreService,
    PLAYGROUND,
    CONFIG,
    HIDDEN_WIDGETS
) {
    widgetMenuCtrl.$inject = [];
    widgetMenuLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        scope: {},
        controller: widgetMenuCtrl,
        link: widgetMenuLink,
        bindToController: {},
        controllerAs: 'widgetMenu',
        template: require('./widget-menu.directive.html'),
    };

    function widgetMenuCtrl() {}

    function widgetMenuLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.HIDDEN_WIDGETS = HIDDEN_WIDGETS;

        // functions
        scope.widgetMenu.closeMenu = closeMenu;
        scope.widgetMenu.changeTab = changeTab;
        scope.widgetMenu.getTab = getTab;

        // variables
        scope.widgetMenu.selectedTab = '';
        scope.widgetMenu.previousTab = '';
        scope.widgetMenu.confirmation = {
            show: false,
            tab: '',
        };
        scope.widgetMenu.cacheConfirmation = {
            show: false,
            tab: '',
        };
        scope.widgetMenu.PLAYGROUND = PLAYGROUND;

        /**
         * @name closeMenu
         * @desc close the side menu
         * @returns {void}
         */
        function closeMenu() {
            let menu = semossCoreService.workspace.getWorkspace(
                scope.widgetCtrl.insightID,
                'menu'
            );

            // already closed
            if (!menu.open) {
                return;
            }

            // close it
            menu.open = false;
            scope.widgetMenu.previousTab = scope.widgetMenu.selectedTab;
            scope.widgetMenu.selectedTab = '';

            semossCoreService.emit('change-workspace-menu', {
                insightID: scope.widgetCtrl.insightID,
                options: menu,
            });
        }

        /**
         * @name changeTab
         * @desc change the tab
         * @param {string} tab - tab to open
         * @param {boolean} force - force through to open clean even if it's native
         * @returns {void}
         */
        function changeTab(tab, force) {
            if (!scope.widgetCtrl.widgetId) {
                return;
            }

            if (scope.widgetMenu.previousTab === tab) {
                scope.widgetMenu.selectedTab = tab;
            }

            var active = scope.widgetCtrl.getWidget('active'),
                panelType = scope.widgetCtrl.getWidget('meta.type'),
                nonPanelViewTabs = ['recipe', 'share', 'menu', 'settings'],
                // these are all active widget types that should not change when user selects widget tab
                validActiveWidgetTypes = [
                    'visualization',
                    'text-widget',
                    'html-widget',
                    'iframe-widget',
                    'text-editor',
                    'legend-panel',
                    'DashboardFilter',
                    'infographic',
                    'default-handle',
                    'param',
                    'dashboard-filter',
                    'dashboard-unfilter',
                    'dashboard-assistant',
                    'dashboard-button',
                ],
                frameCache = scope.widgetCtrl.getShared('frameCache'),
                frameSwapInProgress = scope.widgetCtrl.getShared('frameSwap'),
                menu = semossCoreService.workspace.getWorkspace(
                    scope.widgetCtrl.insightID,
                    'menu'
                );

            if (scope.widgetMenu.selectedTab === tab && menu && menu.open) {
                scope.widgetMenu.closeMenu();
                return;
            }

            if (
                frameSwapInProgress &&
                !force &&
                (tab === 'clean' || tab === 'analytics')
            ) {
                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'frameType',
                            components: [],
                            terminal: true,
                        },
                    ],
                    function (response) {
                        var output = response.pixelReturn[0].output;

                        if (output !== 'NATIVE') {
                            // frame has been swapped already
                            // update the frame type and the change the tab
                            semossCoreService.set(
                                'shared.' +
                                    scope.widgetCtrl.insightID +
                                    '.frames.' +
                                    scope.widgetCtrl.getFrame('name') +
                                    '.type',
                                output
                            );
                            // since frame has been swapped, we will set it to false so we don't do the check again
                            semossCoreService.set(
                                'shared.' +
                                    scope.widgetCtrl.insightID +
                                    '.frameSwap',
                                false
                            );
                            changeTab(tab, true);
                        } else {
                            // frame is in process of swapping so lets show the message to ask for confirmation
                            scope.widgetMenu.cacheConfirmation.show = true;
                            scope.widgetMenu.cacheConfirmation.tab = tab;
                        }
                    }
                );

                return;
            } else if (
                scope.widgetCtrl.getFrame('type') === 'NATIVE' &&
                (tab === 'clean' || tab === 'analytics') &&
                !force
            ) {
                // will pop up to ask user if they're sure to continue
                scope.widgetMenu.confirmation.show = true;
                scope.widgetMenu.confirmation.tab = tab;
                return;
            }

            // CONFIG.xcache = true;

            if (
                CONFIG.xcache &&
                (frameCache || typeof frameCache === 'undefined') &&
                tab === 'clean'
            ) {
                // meta run FrameCache("false");
                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'frameCache',
                            components: [false],
                            terminal: true,
                        },
                    ],
                    function () {
                        semossCoreService.set(
                            'shared.' +
                                scope.widgetCtrl.insightID +
                                '.frameCache',
                            false
                        );
                    }
                );
            } else if (
                CONFIG.xcache &&
                (!frameCache || typeof frameCache === 'undefined') &&
                tab === 'view'
            ) {
                // meta run FrameCache("true");
                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'frameCache',
                            components: [true],
                            terminal: true,
                        },
                    ],
                    function () {
                        semossCoreService.set(
                            'shared.' +
                                scope.widgetCtrl.insightID +
                                '.frameCache',
                            true
                        );
                    }
                );
            }

            if (tab === 'enrich' && active !== 'pipeline') {
                scope.widgetCtrl.execute([
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'setPanelView',
                        components: ['pipeline'],
                        terminal: true,
                    },
                ]);
            } else if (
                tab !== 'enrich' &&
                validActiveWidgetTypes.indexOf(active) === -1 &&
                nonPanelViewTabs.indexOf(tab) === -1
            ) {
                console.warn('TODO: Check this');
                scope.widgetCtrl.execute([
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'setPanelView',
                        components: ['visualization'],
                        terminal: true,
                    },
                ]);
            }
            console.log('here');
            scope.widgetCtrl.open('widget-tab', tab);
        }

        /**
         * @name getTab
         * @desc gets the content to populate the view
         * @returns {string} HTML
         */
        function getTab() {
            if (!scope.widgetCtrl.panelId) {
                return '<div class="smss-caption--center">No panel selected. Please click on a panel to use the menu.</div>';
            } else if (!scope.widgetMenu.selectedTab) {
                return '';
            } else if (scope.widgetMenu.selectedTab === 'view') {
                if (scope.widgetMenu.view === 'text-editor') {
                    return '<text-editor-settings></text-editor-settings>';
                }

                return '<view></view>';
            }

            return `<widget-tab-${scope.widgetMenu.selectedTab} widget-tab></widget-tab-${scope.widgetMenu.selectedTab}>`;
        }

        /**
         * @name updateTab
         * @desc updates the tab content
         * @returns {void}
         */
        function updateTab() {
            scope.widgetMenu.selectedTab =
                scope.widgetCtrl.getWidgetTab('selected');
            scope.widgetMenu.frameType = scope.widgetCtrl.getFrame('type');

            if (scope.widgetMenu.frameType === 'GRAPH') {
                scope.widgetMenu.disableMessage =
                    'Current frame does not support this feature.';
            }
        }

        /**
         * @name updateView
         * @desc updates the tab content
         * @returns {void}
         */
        function updateView() {
            scope.widgetMenu.view = scope.widgetCtrl.getWidget('active');
            if (scope.widgetMenu.view === 'pipeline') {
                semossCoreService.emit('change-widget-tab', {
                    widgetId: scope.widgetCtrl.widgetId,
                    tab: 'enrich',
                });
            }
        }

        /**
         * @name initialize
         * @desc function called when the widget-tab is initialized.
         * @returns {void}
         */
        function initialize() {
            let updateTabListener = scope.widgetCtrl.on(
                    'update-widget-tab',
                    updateTab
                ),
                updateFrameListener = scope.widgetCtrl.on(
                    'update-frame',
                    updateTab
                ),
                updateViewListener = scope.widgetCtrl.on(
                    'update-view',
                    updateView
                ),
                updateTaskListener = scope.widgetCtrl.on(
                    'update-task',
                    updateView
                ),
                changeMenuListener = semossCoreService.on(
                    'change-workspace-menu',
                    updateTab
                );

            semossCoreService.getBEConfig().then(function (data) {
                scope.widgetMenu.config = data;

                if (
                    !scope.widgetMenu.config.r &&
                    !scope.widgetMenu.config.python
                ) {
                    scope.widgetMenu.disableMessage =
                        'R or Python is required to run clean routines.';
                }
            });

            // cleanup
            scope.$on('$destroy', function () {
                updateTabListener();
                updateFrameListener();
                updateViewListener();
                updateTaskListener();
                changeMenuListener();
            });

            updateTab();
            updateView();
        }

        initialize();
    }
}
