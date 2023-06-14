import './widget-tab.scss';

import './widget-tab-enrich/widget-tab-enrich.directive.js';
import './widget-tab-clean/widget-tab-clean.directive.js';
import './widget-tab-analytics/widget-tab-analytics.directive.js';
import './widget-tab-share/widget-tab-share.directive.js';
import './widget-tab-settings/widget-tab-settings.directive.js';
import './widget-tab-menu/widget-tab-menu.directive.js';

export default angular
    .module('app.widget-tab.directive', [
        'app.widget-tab.widget-tab-enrich',
        'app.widget-tab.widget-tab-clean',
        'app.widget-tab.widget-tab-analytics',
        'app.widget-tab.widget-tab-share',
        'app.widget-tab.widget-tab-settings',
        'app.widget-tab.widget-tab-menu',
    ])
    .directive('widgetTab', widgetTabDirective);

widgetTabDirective.$inject = ['$q', '$timeout', 'semossCoreService'];

function widgetTabDirective($q, $timeout, semossCoreService) {
    widgetTabCtrl.$inject = [];
    widgetTabLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'A',
        require: ['^widget'],
        scope: {},
        controller: widgetTabCtrl,
        link: widgetTabLink,
        bindToController: {},
        controllerAs: 'widgetTab',
        template: require('./widget-tab.directive.html'),
        priority: -1,
    };

    function widgetTabCtrl() {}

    function widgetTabLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.widgetTab.menu = [];
        scope.widgetTab.rendered = [];
        scope.widgetTab.hidden = '';

        scope.widgetTab.setContent = setContent;
        scope.widgetTab.renderContent = renderContent;
        scope.widgetTab.addContent = addContent;
        scope.widgetTab.hiddenDestroy = hiddenDestroy;
        scope.widgetTab.refreshContent = refreshContent;
        scope.widgetTab.validateHandle = validateHandle;

        function setContent(menu) {
            scope.widgetTab.menu = menu;

            renderContent();
        }

        /**
         * @name renderContent
         * @param {array} menu - menu to render
         * @desc returns the html for the widget content
         * @returns {promise} content promise
         */
        function renderContent() {
            let promise;

            scope.widgetTab.rendered = [];

            for (
                let menuIdx = 0, menuLen = scope.widgetTab.menu.length;
                menuIdx < menuLen;
                menuIdx++
            ) {
                scope.widgetTab.rendered.push({
                    name: scope.widgetTab.menu[menuIdx].name,
                    height: scope.widgetTab.menu[menuIdx].height,
                    content: '',
                    handles: [],
                    search: '',
                    added: false,
                });

                if (scope.widgetTab.menu[menuIdx].widgets.length === 0) {
                    continue;
                }

                let renderedIdx = scope.widgetTab.rendered.length - 1;
                if (scope.widgetTab.menu[menuIdx].widgets.length > 1) {
                    promise = getMultiContent(
                        renderedIdx,
                        scope.widgetTab.menu[menuIdx].widgets
                    );
                } else {
                    promise = getSingleContent(
                        renderedIdx,
                        scope.widgetTab.menu[menuIdx].widgets[0]
                    );
                }

                promise.then((html) => {
                    scope.widgetTab.rendered[renderedIdx].content = html;
                });
            }
        }

        /**
         * @name addContent
         * @param {number} menuIdx - index of the selected content
         * @param {string} handle - selected handle
         * @desc returns the html for the widget content
         * @returns {promise} content promise
         */
        function addContent(menuIdx, handle) {
            let config = semossCoreService.getSpecificConfig(handle),
                addedIdx = -1;

            if (!config || Object.keys(config).length === 0) {
                return;
            }

            if (
                (config.content &&
                    config.content.json &&
                    config.content.json[0].execute === 'auto') ||
                (config.content &&
                    config.content.template &&
                    config.content.template.execute === 'auto')
            ) {
                hiddenDestroy();
                semossCoreService
                    .loadWidget(handle, 'content')
                    .then(function (html) {
                        $timeout(function () {
                            scope.widgetTab.hidden = html;
                        });
                    });

                return;
            }

            if (config.hasOwnProperty('view') && config.view) {
                if (scope.widgetCtrl.getWidget('active') !== handle) {
                    let viewComponents = [
                        {
                            type: 'panel',
                            components: [scope.widgetCtrl.panelId],
                            meta: false,
                        },
                        {
                            type: 'setPanelView',
                            components: [handle],
                            terminal: true,
                        },
                    ];

                    scope.widgetCtrl.execute(viewComponents);
                }

                return;
            }

            // check if the group is already there;
            for (
                let renderedIdx = 0,
                    renderedLen = scope.widgetTab.rendered.length;
                renderedIdx < renderedLen;
                renderedIdx++
            ) {
                if (scope.widgetTab.rendered[renderedIdx].added) {
                    addedIdx = renderedIdx;
                } else {
                    scope.widgetTab.rendered[renderedIdx].height = 0;
                }
            }

            if (addedIdx > -1) {
                scope.widgetTab.rendered[addedIdx].name = config.name;
                scope.widgetTab.rendered[addedIdx].height = 100;

                semossCoreService
                    .loadWidget(handle, 'content')
                    .then(function (html) {
                        scope.widgetTab.rendered[addedIdx].content = html;
                    });
            } else {
                let added = {
                    name: config.name,
                    height: 100,
                    content: '',
                    handles: [],
                    search: '',
                    added: true,
                };

                scope.widgetTab.rendered.splice(menuIdx + 1, 0, added);

                semossCoreService
                    .loadWidget(handle, 'content')
                    .then(function (html) {
                        added.content = html;
                    });
            }
        }

        /**
         * @name hiddenDestroy
         * @desc set the hidden content to null
         * @returns {void}
         */
        function hiddenDestroy() {
            scope.widgetTab.hidden = '';
        }

        /**
         * @name refreshContent
         * @desc returns the html for the widget content
         * @returns {promise} content promise
         */
        function refreshContent() {
            for (
                let renderedIdx = 0,
                    renderedLen = scope.widgetTab.rendered.length;
                renderedIdx < renderedLen;
                renderedIdx++
            ) {
                for (
                    let handleIdx = 0,
                        handleLen =
                            scope.widgetTab.rendered[renderedIdx].handles
                                .length;
                    handleIdx < handleLen;
                    handleIdx++
                ) {
                    let config = semossCoreService.getSpecificConfig(
                            scope.widgetTab.rendered[renderedIdx].handles[
                                handleIdx
                            ].handle
                        ),
                        title,
                        message;

                    if (!config || Object.keys(config).length === 0) {
                        continue;
                    }

                    // intentionally validate + style with the scope one, so we can override if needed
                    message = scope.widgetTab.validateHandle(config);

                    if (message) {
                        title = message;
                    } else if (config.description) {
                        title = config.name + ' - ' + config.description;
                    } else {
                        title = config.name;
                    }

                    scope.widgetTab.rendered[renderedIdx].handles[
                        handleIdx
                    ].title = title;
                    scope.widgetTab.rendered[renderedIdx].handles[
                        handleIdx
                    ].disabled = !!message;
                }
            }
        }

        /**
         * @name getSingleContent
         * @param {number} menuIdx - index of the selected content
         * @param {string} handle - selected handle
         * @desc returns the html for the widget content
         * @returns {promise} content promise
         */
        function getSingleContent(menuIdx, handle) {
            return semossCoreService.loadWidget(handle, 'content');
        }

        /**
         * @name getMultiContent
         * @param {number} menuIdx - index of the selected roup
         * @param {array} handles - selected handles
         * @desc returns the html for the grouped widgets
         * @returns {promise} content promise
         */
        function getMultiContent(menuIdx, handles) {
            let content = '',
                deferred = $q.defer();

            scope.widgetTab.rendered[menuIdx].handles = [];

            for (
                let handleIdx = 0, handleLen = handles.length;
                handleIdx < handleLen;
                handleIdx++
            ) {
                let config = semossCoreService.getSpecificConfig(
                        handles[handleIdx]
                    ),
                    title,
                    message;

                if (!config || Object.keys(config).length === 0) {
                    continue;
                }

                // intentionally validate + style with the scope one, so we can override if needed
                message = scope.widgetTab.validateHandle(config);

                if (message) {
                    title = message;
                } else if (config.description) {
                    title = config.name + ' - ' + config.description;
                } else {
                    title = config.name;
                }

                scope.widgetTab.rendered[menuIdx].handles.push({
                    title: title,
                    name: config.name,
                    description: config.description || '',
                    handle: handles[handleIdx],
                    icon: config.icon,
                    disabled: !!message,
                });
            }

            // sort the handles
            semossCoreService.utility.sort(
                scope.widgetTab.rendered[menuIdx].handles,
                'name'
            );

            content = `
            <div class="widget-tab__accordion__content__search smss-spacing" ng-init="widgetTab.rendered[${menuIdx}].search = ''">
                <smss-search model="widgetTab.rendered[${menuIdx}].search" autofocus></smss-search>
            </div>

            

            <smss-scroll class="smss-spacing widget-tab__accordion__content__scroll" static-x="true">
                <span ng-repeat="handle in widgetTab.rendered[${menuIdx}].handles | filter: {'name': widgetTab.rendered[${menuIdx}].search} as widgetHandeResults"
                    title="{{handle.title}}">
                    <div class="smss-block widget-tab__accordion__content__block"
                        ng-disabled="handle.disabled" 
                        ng-style="handle.style"
                        ng-click="widgetTab.addContent(${menuIdx}, handle.handle)"
                        tabindex="{{handle.disabled ? -1 : 0}}">
                        <div class="smss-block__image">
                            <img ng-src="{{handle.icon}}">
                        </div>
                        <div class="smss-block__text">
                            <div class="smss-block__text__title">
                                <span>{{handle.name}}</span>
                            </div>
                            <div class="smss-block__text__description">
                                <span>{{handle.description}}</span>
                            </div>
                        </div>
                        <div class="smss-block__action" ng-class="{'smss-block__action--warn': handle.disabled}">
                            <i class="fa " ng-class="{'fa-exclamation-triangle': handle.disabled,'fa-info-circle': !handle.disabled}"></i>
                        </div>
                    </div>
                </span>
                <div class="smss-caption--center" ng-if="widgetHandeResults.length === 0">No options matched your search, please try again.</div>
            </smss-scroll>`;

            deferred.resolve(content);

            return deferred.promise;
        }

        /**
         * @name validateHandle
         * @param {object} config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message.
         * @returns {object} {type: 'disabled' or 'hidden', message:''}
         */
        function validateHandle(config) {
            if (config.widgetList.showCondition) {
                let message = checkShowConditions(config);
                if (message) {
                    return message;
                }
            }

            if (config.required) {
                let message = checkRequirements(config);
                if (message) {
                    return message;
                }
            }

            return '';
        }

        /**
         * @name checkShowConditions
         * @param {object} config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the show conditions
         * @returns {string} message
         */
        function checkShowConditions(config) {
            var layerIndex = 0;
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
                    let keys = scope.widgetCtrl.getWidget(
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
                } else if (
                    config.widgetList.showCondition[showIdx] === 'saved-insight'
                ) {
                    if (
                        !scope.widgetCtrl.getShared('insight.app_id') &&
                        !scope.widgetCtrl.getShared('insight.app_insight_id')
                    ) {
                        return 'Not a saved insight. Save before continuing.';
                    }
                } else if (
                    config.widgetList.showCondition[showIdx] === 'param'
                ) {
                    if (!scope.widgetCtrl.getWidget('view.param')) {
                        return 'No parameters found.';
                    }
                } else if (
                    config.widgetList.showCondition[showIdx] === 'form'
                ) {
                    if (
                        scope.widgetCtrl.getWidget('active') !== 'form-builder'
                    ) {
                        return 'Insight is not a form.';
                    }
                }
            }

            return '';
        }

        /**
         * @name checkRequirements
         * @param {object} config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the requirements
         * @returns {string} message
         */
        function checkRequirements(config) {
            let message;
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
         * @param {object} config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the frame requirements
         * @returns {string} message
         */
        function checkFrameRequirements(config) {
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
         * @param {object} config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the r requirements
         * @returns {string} message
         */
        function checkRRequirements(config) {
            if (config.required.R) {
                let installedPackages =
                        semossCoreService.getWidgetState(
                            'installedPackages.R'
                        ) || [],
                    missingPackages = [];

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
         * @param {object} config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the py requirements
         * @returns {string} message
         */
        function checkPyRequirements(config) {
            if (config.required.PY) {
                let installedPackages =
                        semossCoreService.getWidgetState(
                            'installedPackages.PY'
                        ) || [],
                    missingPackages = [];

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
         * @param {object} config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the social requirements
         * @returns {string} message
         */
        function checkSocialRequirements(config) {
            if (config.required.Social) {
                let activeLogins = semossCoreService.getCurrentLogins() || {},
                    missingSocial = [];

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
         * @name initialize
         * @desc function called when the widget-tab is initialized.
         * @returns {void}
         */
        function initialize() {
            let hiddenWidgetDestroyListener, resetAccordionSizeListener;

            hiddenWidgetDestroyListener = scope.widgetCtrl.on(
                'hidden-widget-destroy',
                hiddenDestroy
            );
            resetAccordionSizeListener = scope.widgetCtrl.on(
                'reset-accordion-size',
                renderContent
            );

            // cleanup
            scope.$on('$destroy', function () {
                hiddenWidgetDestroyListener();
                resetAccordionSizeListener();
            });
        }

        initialize();
    }
}
