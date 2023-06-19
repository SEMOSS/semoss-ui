import angular from 'angular';

import './panel.scss';

export default angular
    .module('app.panel.directive', [])
    .directive('panel', panelDirective);

panelDirective.$inject = ['$timeout', 'semossCoreService'];

function panelDirective(
    $timeout: ng.ITimeoutService,
    semossCoreService: SemossCoreService
) {
    panelCtrl.$inject = [];
    panelLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./panel.directive.html'),
        scope: {},
        controller: panelCtrl,
        controllerAs: 'panel',
        require: ['^insight', '^worksheet'],
        bindToController: {
            sheetId: '=',
            panelId: '=',
        },
        transclude: true,
        replace: true,
        link: panelLink,
    };

    function panelCtrl() {}

    function panelLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.worksheetCtrl = ctrl[1];

        let panelEle: any, panelContentEle: any;

        scope.panel.maximized = false;
        scope.panel.hidden = false;

        scope.panel.getContent = getContent;
        scope.panel.selectPanel = selectPanel;

        /**
         * @name getContent
         * @desc gets the content of a widget to the layout
         */
        function getContent(): string {
            const widgetId = `SMSSWidget${scope.insightCtrl.insightID}___${scope.panel.panelId}`;

            return `<widget widget-id="${widgetId}"><widget-view></widget-view></widget>`;
        }

        /** Panel */
        /**
         * @name resetPanel
         * @desc reset the panel based on the options
         */
        function resetPanel(): void {
            const config = scope.insightCtrl.getPanel(
                scope.panel.sheetId,
                scope.panel.panelId,
                'config'
            );

            // set the panel status
            scope.panel.maximized = config.panelstatus === 'maximized';

            // check if it is hidden
            scope.panel.hidden = isHidden();

            // if it has a zIndex, use it
            panelEle.style.zIndex = config.zIndex;

            // set the height and width
            panelEle.style.top =
                typeof config.top === 'number' ? `${config.top}%` : config.top;
            panelEle.style.left =
                typeof config.left === 'number'
                    ? `${config.left}%`
                    : config.left;
            panelEle.style.height =
                typeof config.height === 'number'
                    ? `${config.height}%`
                    : config.height;
            panelEle.style.width =
                typeof config.width === 'number'
                    ? `${config.width}%`
                    : config.width;

            // if it has a borderWidth, use it
            if (config.borderWidth) {
                panelEle.style.borderWidth = config.borderWidth;
            } else {
                panelEle.style.borderWidth = '';
            }

            // if it has a borderStyle, use it
            if (config.borderStyle) {
                panelEle.style.borderStyle = config.borderStyle;
            } else {
                panelEle.style.borderStyle = '';
            }

            // if it has a borderColor, use it
            if (config.borderColor) {
                panelEle.style.borderColor = config.borderColor;
            } else {
                panelEle.style.borderColor = '';
            }

            if (config.shadowColor) {
                const boxShadow = `${config.shadowX} ${config.shadowY} ${config.shadowBlur} ${config.shadowSpread} ${config.shadowColor}`;
                panelEle.style.boxShadow = boxShadow;
            } else {
                panelEle.style.boxShadow = '';
            }

            // if it has a backgroundColor, use it
            if (config.backgroundColor) {
                panelEle.style.backgroundColor = config.backgroundColor;
            } else {
                panelEle.style.backgroundColor = '';
            }

            // if it has a backgroundImage, use it
            if (config.backgroundImage) {
                panelEle.style.backgroundImage = config.backgroundImage;
            } else {
                panelEle.style.backgroundImage = '';
            }

            // if it has a backgroundOrigin, use it
            if (config.backgroundOrigin) {
                panelEle.style.backgroundOrigin = config.backgroundOrigin;
            } else {
                panelEle.style.backgroundOrigin = '';
            }

            // if it has a backgroundPosition, use it
            if (config.backgroundPosition) {
                panelEle.style.backgroundPosition = config.backgroundPosition;
            } else {
                panelEle.style.backgroundPosition = '';
            }

            // if it has a backgroundRepeat, use it
            if (config.backgroundRepeat) {
                panelEle.style.backgroundRepeat = config.backgroundRepeat;
            } else {
                panelEle.style.backgroundRepeat = '';
            }

            // if it has a backgroundSize, use it
            if (config.backgroundSize) {
                panelEle.style.backgroundSize = config.backgroundSize;
            } else {
                panelEle.style.backgroundSize = '';
            }

            // update the opacity
            if (config.opacity || config.opacity === 0) {
                panelEle.style.opacity = String((config.opacity || 100) / 100);
            } else {
                panelEle.style.opacity = '';
            }
        }

        /**
         * @name selectPanel
         * @desc select the panel
         * @param mode - mode
         */
        function selectPanel(mode: 'move' | 'edit'): void {
            // is it already selected, if so keep it
            if (scope.panel.selected) {
                return;
            }

            scope.worksheetCtrl.selectPanel(scope.panel.panelId, mode);
        }

        /** Update */
        /**
         * @name updatePanel
         * @desc call to update the panel
         * @param payload - {panelId}
         */
        function updatePanel(payload: { panelId: string }): void {
            if (scope.panel.panelId === payload.panelId) {
                resetPanel();
            }
        }

        /**
         * @name updateHighlight
         * @param payload 9data for checking if widget is correct and if panel should highlight
         * @desc called to update when the layout changes
         * @desc resets and updates panel
         */
        function updateHighlight(payload: {
            panelId: string;
            highlight: boolean;
        }): void {
            if (payload.panelId === scope.panel.panelId) {
                if (payload.highlight) {
                    panelContentEle.style.cssText =
                        'outline: 2px solid #40A0FF;';
                } else {
                    panelContentEle.style.cssText = 'outline: inherit';
                }
            } else {
                panelContentEle.style.cssText = 'outline: inherit';
            }
        }

        /**
         * @name updateSelectedPanel
         * @desc reset the position when the window or container resizes
         */
        function updateSelectedPanel(): void {
            const selectedPanel = scope.insightCtrl.getWorksheet(
                scope.panel.sheetId,
                'selected.panel'
            );

            scope.panel.selected = scope.panel.panelId === selectedPanel;
        }

        /**
         * @name updatePresentation
         * @desc called when the presentation information changes
         */
        function updatePresentation(): void {
            scope.panel.presentation =
                scope.insightCtrl.getWorkspace('presentation');
        }

        /**
         * @name isHidden
         * @desc checks to see if we need to hide the panel
         * @returns {boolean} true/false
         */
        function isHidden(): boolean {
            // assumption is panel is floating and not maximized, so no need to check those
            let hide = false,
                panels = scope.insightCtrl.getWorksheet(
                    scope.panel.sheetId,
                    'panels'
                );

            // look at other panels in the sheet, check to see if any of them are maximized. if so, return return.
            for (const panelId in panels) {
                if (panels.hasOwnProperty(panelId)) {
                    // don't need to look at itself
                    if (panels[panelId].panelId === scope.panel.panelId) {
                        continue;
                    }

                    if (
                        panels[panelId].config &&
                        panels[panelId].config.panelstatus === 'maximized'
                    ) {
                        hide = true;
                        break;
                    }
                }
            }

            return hide;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize(): void {
            // get the variables
            panelEle = ele[0];
            panelContentEle = panelEle.querySelector('#panel__content');

            const updatedWorksheetListener = scope.insightCtrl.on(
                    'updated-worksheet',
                    resetPanel
                ),
                selectedPanelListener = scope.insightCtrl.on(
                    'selected-panel',
                    updateSelectedPanel
                ),
                updatedPanelListener = scope.insightCtrl.on(
                    'updated-panel',
                    updatePanel
                ),
                cachePanelListener = scope.insightCtrl.on(
                    'cache-panel',
                    updatePanel
                ),
                resetPanelListener = scope.insightCtrl.on(
                    'reset-panel',
                    updatePanel
                ),
                highlightPanelListener = semossCoreService.on(
                    'highlight-panel',
                    updateHighlight
                ),
                updatedPresentationListener = scope.insightCtrl.on(
                    'updated-presentation',
                    updatePresentation
                );

            // add the listeners
            scope.$on('$destroy', function () {
                updatedWorksheetListener();
                selectedPanelListener();
                updatedPanelListener();
                cachePanelListener();
                resetPanelListener();
                highlightPanelListener();
                updatedPresentationListener();
            });

            resetPanel();
            updateSelectedPanel();
            updatePresentation();
        }

        initialize();
    }
}
