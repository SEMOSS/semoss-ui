'use strict';

import Utility from '../../utility/utility.js';
import angular from 'angular';

/**
 * @name widget.service.js
 * @desc widget service is set up to configure the all of the widgets/handles/visualizations in SEMOSS
 */
export default angular
    .module('app.widget.service', [])
    .factory('widgetService', widgetService);

widgetService.$inject = [
    '$ocLazyLoad',
    '$q',
    '$http',
    'WIDGETS',
    'HIDDEN_WIDGETS',
    'PLAYGROUND',
    'PLAYGROUND_WIDGETS',
    'SHARED_TOOLS',
    'messageService',
    'monolithService',
    'WIDGETS_HIDDEN_FOR_NON_ADMIN',
];

function widgetService(
    $ocLazyLoad,
    $q: ng.IQService,
    $http: ng.IHttpService,
    WIDGETS,
    HIDDEN_WIDGETS,
    PLAYGROUND,
    PLAYGROUND_WIDGETS,
    SHARED_TOOLS,
    messageService: MessageService,
    monolithService,
    WIDGETS_HIDDEN_FOR_NON_ADMIN
) {
    let _state: any = {
            installedPackages: {},
            all: [],
            widgets: {},
        },
        _actions = {
            /**
             * @name update-installed-packages
             * @desc update the installd packages
             * @param {object} payload - {packages}
             * @return {void}
             */
            'update-installed-packages': (payload: { packages: any }): void => {
                _state.installedPackages = payload.packages;
            },
        },
        LOADED_WIDGETS = require('./widgets.js'),
        DEFAULT_WIDGET_CONFIG,
        DEFAULT_VISUALIZATION_CONFIG,
        DEFAULT_PIPELINE_CONFIG;

    DEFAULT_WIDGET_CONFIG = {
        name: '', // name is the displayed name, default will be the ID (Folder)
        icon: '', // image that will be used everywhere
        description: '', // description is the highlevel widget description
        widgetList: {
            // options for population in the list
            pinned: false, // boolean that shows if it is pinned or not on the menu
            tags: [], // tags for the widget (will be used for searching capabilities),
            showOn: 'all', // Array is what the widget list this handle is shown on, "all", "none"
            hideHandles: [], // Array of handles to hide from this widget
        },
        required: {}, // list of required options for the widget R, PY, FRAME
        content: false, // handle content
        view: false, // view content
        dimensions: false, // dimensions content (useful for visualizations)
        tools: {}, // for visualizations
        state: {}, // options that are shared amongst a widget. Uses the current set one (otherwise uses the default),
        lazy: false, // can the widget be lazy loaded?
    };
    DEFAULT_VISUALIZATION_CONFIG = {
        // used when a widget is a visualizations
        group: 'Visualization', // where to load it in
        view: 'visualization', // what 'view to load' this will also determine side dimensions
        layout: '', // which layout to load
        visibleModes: ['default-mode'],
        showOnVisualPanel: false, // true/false is this widget show on the visual-panel?
        tools: [],
        format: '', // data format that the visualization accepts
        fields: [], // fields used to populate a visualization,
        color: {},
    };
    DEFAULT_PIPELINE_CONFIG = {};

    /** *** Top Functions *****/
    /**
     * @name initialize
     * @desc function called when the widgetService is initialized. This grabs all of the existing widget-config.
     */
    function initialize(): void {
        const promises: ng.IPromise<any>[] = [];

        // regeister the messages
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }

        // automatically register the loaded ones
        // loadWidgets(LOADED_WIDGETS);

        // load the new ones
        for (
            let widgetIdx = 0, widgetLen = WIDGETS.length;
            widgetIdx < widgetLen;
            widgetIdx++
        ) {
            if (validateWidget(WIDGETS[widgetIdx])) {
                promises.push(fetchWidget(WIDGETS[widgetIdx]));
            }
        }

        // now create the complete set
        $q.all(promises).then(function () {
            _state.complete = Utility.sort(_state.all, 'name');

            // message out
            messageService.emit('initialize-widgets');
        });

        // listeners to update data for this service
        // this is here because we are not making this call in the login screen. once user is logged in, we will come back here to check the r packages.
        messageService.on('init-login', function () {
            getInstalledPackages();
            if (
                WIDGETS_HIDDEN_FOR_NON_ADMIN &&
                WIDGETS_HIDDEN_FOR_NON_ADMIN.length !== 0
            ) {
                monolithService.isAdmin().then(function (admin) {
                    _state.widgets = {};
                    _state.all = [];
                    if (!admin) {
                        const widgetsToLoad = Object.assign({}, LOADED_WIDGETS);
                        WIDGETS_HIDDEN_FOR_NON_ADMIN.forEach((widgetKey) => {
                            if (widgetsToLoad[widgetKey]) {
                                delete widgetsToLoad[widgetKey];
                            }
                        });
                        loadWidgets(widgetsToLoad);
                    } else {
                        loadWidgets(LOADED_WIDGETS);
                    }
                });
            } else {
                // load all the widgets
                loadWidgets(LOADED_WIDGETS);
            }
        });
    }

    /**
     * Validate and load the widget
     * @param widgets
     */
    function loadWidgets(widgets) {
        for (const widget in widgets) {
            if (widgets.hasOwnProperty(widget) && validateWidget(widget)) {
                configureWidget(widget, widgets[widget]);
            }
        }
    }

    /** *** State Functions *****/
    /**
     * @name getSharedTools
     * @desc gets the default sharedTools
     */
    function getSharedTools(): any {
        return Utility.getter(SHARED_TOOLS);
    }

    /**
     * @name set
     * @param accessor the key to give this value to be stored in _state
     * @param value the value to store
     * @desc store this value in _state
     */
    function set(accessor: string, value: any): void {
        return Utility.setter(_state, accessor, value);
    }

    /**
     * @name get
     * @param accessor what data to grab from _state
     * @desc get data from _state based on accessor
     * @returns the object to return
     */
    function get(accessor?: string): any {
        return Utility.getter(_state, accessor);
    }

    /**
     * @name getIndividualTools
     * @param widget - the widget to grab tools from
     * @desc gets the default individualTools
     * @returns default individualTools
     */
    function getIndividualTools(widget: string): any {
        if (!_state.widgets[widget]) {
            return {};
        }
        return Utility.getter(_state.widgets[widget], 'tools');
    }

    /** *** Widget Functions *****/
    /**
     * @name validateWidget
     * @param widget - ID of the widget
     * @desc validates if the widget can be shown or not
     * @returns is the widget validate?
     */
    function validateWidget(widget: string): boolean {
        if (HIDDEN_WIDGETS.indexOf(widget) > -1) {
            return false;
        }

        if (PLAYGROUND && PLAYGROUND_WIDGETS.indexOf(widget) > -1) {
            return false;
        }

        return true;
    }

    /**
     * @name fetchWidget
     * @param widget - ID of the widget
     * @desc load a widget if necessary, then register it
     * @returns is the widget done registering?
     */
    function fetchWidget(widget: string): ng.IPromise<any> {
        const completed = $q.defer();

        console.warn('Fetching...' + widget);
        $http({
            url: './legacy/widgets/' + widget + '/config.json',
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
            },
        }).then(
            function (response) {
                configureWidget(widget, response.data);
                completed.resolve();
            },
            function () {
                console.error('Widget: ' + widget + ' has an error');
                completed.resolve();
            }
        );

        return completed.promise;
    }

    /**
     * @name configureWidget
     * @param widget - ID of the widget
     * @param config - configuration of a New Widget
     * @desc validates and sets a new widget's config
     */
    function configureWidget(widget: string, config: any): void {
        let mergedConfig: any,
            children = [];

        if (_state.widgets.hasOwnProperty('widget')) {
            console.error('Widget: ' + widget + 'is already registered');
            return;
        }

        // console.log('Widget: Registering ' + widget + '......');
        mergedConfig = angular.merge({}, DEFAULT_WIDGET_CONFIG, config);

        // start configuration
        // id is always the widget
        mergedConfig.id = widget;

        // if there is no name, we use the id as a name
        if (!mergedConfig.hasOwnProperty('name')) {
            mergedConfig.name = widget;
        }

        // if there is a visualization, merge it with default
        if (mergedConfig.hasOwnProperty('visualization')) {
            mergedConfig.visualization = angular.merge(
                {},
                DEFAULT_VISUALIZATION_CONFIG,
                mergedConfig.visualization
            );
        }

        // if there is a pipeline, merge it with default
        if (mergedConfig.hasOwnProperty('pipeline')) {
            mergedConfig.pipeline = angular.merge(
                {},
                DEFAULT_PIPELINE_CONFIG,
                mergedConfig.pipeline
            );
        }

        // check the widget list
        if (mergedConfig.hasOwnProperty('widgetList')) {
            // automatically tag the id
            if (mergedConfig.widgetList.tags.indexOf(mergedConfig.id) === -1) {
                mergedConfig.widgetList.tags.push(mergedConfig.id);
            }
        }

        // if it has a module, register it
        if (
            mergedConfig.hasOwnProperty('content') &&
            mergedConfig.content.hasOwnProperty('template') &&
            mergedConfig.content.template.hasOwnProperty('module')
        ) {
            $ocLazyLoad.inject(mergedConfig.content.template.module);
        }

        // if it has a module, register it
        if (
            mergedConfig.hasOwnProperty('view') &&
            mergedConfig.view.hasOwnProperty('template') &&
            mergedConfig.view.template.hasOwnProperty('module')
        ) {
            $ocLazyLoad.inject(mergedConfig.view.template.module);
        }

        // remove the children, we will save it on its own
        if (mergedConfig.hasOwnProperty('children')) {
            children = JSON.parse(JSON.stringify(mergedConfig.children));
            delete mergedConfig.children;
        }

        // save the merged config
        _state.widgets[widget] = mergedConfig;

        // push it into all
        _state.all.push(_state.widgets[widget]);

        // register all of the 'children'
        for (
            let childIdx = 0, childLen = children.length;
            childIdx < childLen;
            childIdx++
        ) {
            const childConfig = angular.merge(
                {},
                _state.widgets[widget],
                children[childIdx],
                {
                    id:
                        _state.widgets[widget].id +
                        '$' +
                        children[childIdx].name,
                    parent: _state.widgets[widget].id,
                }
            );

            // merge the child in
            _state.widgets[childConfig.id] = childConfig;

            // push it into all
            _state.all.push(childConfig);
        }
    }

    /**
     * @name getSpecificConfig
     * @param widget - ID of the widget
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc returns the a specific config for a widget
     * @returns selected config information
     */
    function getSpecificConfig(widget: string, accessor?: string): any {
        if (!_state.widgets[widget]) {
            return {};
        }

        return Utility.getter(_state.widgets[widget], accessor);
    }

    /**
     * @name loadWidget
     * @param widget - ID of the widget
     * @param type - type of content to load
     * @desc returns the a specific config for a widget
     * @returns is the widget done loading?
     */
    function loadWidget(widget: string, type: string): ng.IPromise<any> {
        const completed = $q.defer(),
            promises: ng.IPromise<any>[] = [];

        if (!_state.widgets.hasOwnProperty(widget)) {
            console.log(widget);
            console.error('Widget not found');
            completed.resolve('');
            return completed.promise;
        }

        if (_state.widgets[widget].lazy) {
            let imported = $q.defer(),
                index;

            promises.push(imported.promise);

            // the index to load is usually the parent one
            if (_state.widgets[widget].parent) {
                index = _state.widgets[widget].parent;
            } else {
                index = widget;
            }

            import(
                /* webpackChunkName: "widgets/[request]"  */
                /* webpackMode: "lazy" */
                `../../../widgets/${index}/index.js`
            )
                .then((module) => {
                    $ocLazyLoad.load(module.default);
                    imported.resolve();
                })
                .catch((err) => {
                    console.error('Error: ', err);
                    imported.resolve();
                });
        }

        if (
            _state.widgets[widget][type].template &&
            _state.widgets[widget][type].template.files &&
            _state.widgets[widget][type].template.files.length > 0
        ) {
            const requested = $q.defer();

            promises.push(requested.promise);

            const files = _state.widgets[widget][type].template.files;
            for (
                let fileIdx = 0, fileLen = files.length;
                fileIdx < fileLen;
                fileIdx++
            ) {
                // does not have a cache property
                if (!files[fileIdx].hasOwnProperty('cache')) {
                    files[fileIdx].cache = false;
                }
            }

            $ocLazyLoad.load(files).then(function () {
                requested.resolve();
            });
        }

        $q.all(promises).then(() => {
            let html = '';

            if (widget === 'param' || _state.widgets[widget][type].json) {
                html = `<default-handle handle="${widget}" style="height: 100%"></default-handle>`;
            } else if (_state.widgets[widget][type].template) {
                const htmlOptions = Object.keys(
                    _state.widgets[widget][type].template.options || {}
                )
                    .map((k) => {
                        const kMatch = k.match(
                            /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
                        );
                        let opt;
                        // convert to kebob case
                        if (kMatch !== null) {
                            opt = kMatch.map((x) => x.toLowerCase()).join('-');
                        } else {
                            opt = k;
                        }

                        return `${opt}="${_state.widgets[widget][type].template.options[k]}"`;
                    })
                    .join(' ');

                html = `<${
                    _state.widgets[widget][type].template.name
                } ${htmlOptions}>${
                    _state.widgets[widget].visualization
                        ? '<div id="chart-container"></div>'
                        : ''
                }</${_state.widgets[widget][type].template.name}>`;
            }

            completed.resolve(html);
        });

        return completed.promise;
    }

    /**
     * @name getInstalledPackages
     * @desc grab all installed packages
     */
    function getInstalledPackages(): void {
        const message = Utility.random('meta-pixel');

        messageService.once(message, (output: PixelReturnPayload) => {
            if (
                !output.pixelReturn ||
                output.pixelReturn[0].operationType[0] === 'ERROR'
            ) {
                return;
            }

            _state.installedPackages = output.pixelReturn[0].output;
        });

        messageService.emit('query-pixel', {
            commandList: [
                {
                    type: 'checkRPackages',
                    components: [false],
                    terminal: true,
                    meta: true,
                },
            ],
            response: message,
        });
    }

    /** *** Mode Functions *****/
    /**
     * @name getModeConfig
     * @desc returns the master modeConfig
     * @returns mode config
     */
    function getModeConfig(): any {
        const modes = {};
        for (const i in _state.widgets) {
            if (_state.widgets.hasOwnProperty(i) && _state.widgets[i].mode) {
                modes[i] = _state.widgets[i];
            }
        }

        return Utility.freeze(modes);
    }

    /** *** Visualization Functions *****/
    /**
     * @name getVisualizationConfig
     * @desc returns the master visualizationConfig
     * @returns visualization config
     */
    function getVisualizationConfig(): any[] {
        const visualizations: any[] = [];

        for (const i in _state.widgets) {
            if (
                _state.widgets.hasOwnProperty(i) &&
                _state.widgets[i].visualization
            ) {
                visualizations.push(_state.widgets[i]);
            }
        }

        return Utility.freeze(visualizations);
    }

    /**
     * @name getActiveVisualizationId
     * @param layout - layout of the visualization to grab
     * @param type - type of the visualization to grab
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc returns the a specific id for a visualization
     * @returns widget config
     */
    function getActiveVisualizationId(layout: string, type: string): string {
        for (const widget in _state.widgets) {
            if (_state.widgets.hasOwnProperty(widget)) {
                if (_state.widgets[widget].visualization) {
                    if (
                        _state.widgets[widget].visualization.type.indexOf(
                            type
                        ) > -1 &&
                        _state.widgets[widget].visualization.layout === layout
                    ) {
                        return widget;
                    }
                }
            }
        }

        return '';
    }

    return {
        /** *** Top Functions *****/
        initialize: initialize,
        /** *** Tool Functions *****/
        getSharedTools: getSharedTools,
        getIndividualTools: getIndividualTools,
        /** *** Widget Functions *****/
        getSpecificConfig: getSpecificConfig,
        loadWidget: loadWidget,
        /** *** Mode Functions *****/
        getModeConfig: getModeConfig,
        /** *** Visualization Functions *****/
        getVisualizationConfig: getVisualizationConfig,
        getActiveVisualizationId: getActiveVisualizationId,
        get: get,
        set: set,
    };
}
