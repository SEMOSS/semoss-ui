('use strict');

import angular from 'angular';

import './document-query.scss';

export default angular
    .module('app.document-query.directive', [])
    .directive('documentQuery', documentQueryDirective);

documentQueryDirective.$inject = [
    '$timeout',
    'semossCoreService',
    'monolithService',
    'messageService'
];

function documentQueryDirective(
    $timeout: ng.ITimeoutService,
    semossCoreService: SemossCoreService,
    monolithService: MonolithService,
    messageService
) {
    documentQueryCtrl.$inject = ['$scope'];
    documentQueryLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'AE',
        template: require('./document-query.directive.html'),
        scope: {},
        require: ['^widget'],
        controllerAs: 'documentQuery',
        replace: true,
        link: documentQueryLink,
        controller: documentQueryCtrl,
    };

    function documentQueryCtrl() {}

    function documentQueryLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // General
        scope.documentQuery.selectedModel = 'siamese';
        scope.documentQuery.folder = '';
        scope.documentQuery.search = '';
        scope.documentQuery.threshold = 20;
        scope.documentQuery.rowCount = 3;
        scope.documentQuery.source = true;
        scope.documentQuery.folderError = '';
        scope.documentQuery.searchError = '';
        scope.documentQuery.thresholdError = '';
        scope.documentQuery.modelError = '';
        scope.documentQuery.model = '';
        scope.documentQuery.page = 'QUERY';
        scope.documentQuery.selectedTab = 'Manage';
        scope.documentQuery.helpOverlay = false;
        scope.documentQuery.advancedSettings = false;
        scope.documentQuery.modelOptions = ['', 'siamese', 'haystack', 'faiss'];
        scope.documentQuery.tabs = ['Ask', 'Manage'];
        scope.documentQuery.collapsible = { folders: true, editor: true };

        // Results
        scope.documentQuery.results = { data: [], complete: false };
        scope.documentQuery.loading = false;

        scope.documentQuery.space = {
            selected: 'Project',
            options: ['Project'],
            app: {
                options: [],
                selected: '',
            },
        };

        // Browser
        scope.documentQuery.setWorkspace = setWorkspace;
        scope.documentQuery.changeWorkspace = changeWorkspace;
        scope.documentQuery.onRender = onRender;
        scope.documentQuery.onSearch = onSearch;
        scope.documentQuery.onUpload = onUpload;
        scope.documentQuery.onNew = onNew;

        // Functions
        scope.documentQuery.isValidQuery = isValidQuery;
        scope.documentQuery.clearQuery = clearQuery;
        scope.documentQuery.changePage = changePage;
        scope.documentQuery.runQuery = runQuery;
        scope.documentQuery.clearModels = clearModels;
        scope.documentQuery.preprocess = preprocess;
        scope.documentQuery.createModel = createModel;
        scope.documentQuery.setFieldsForAIAssistant = setFieldsForAIAssistant
        scope.documentQuery.changeModel = changeModel

        // Tabs
        scope.documentQuery.toggleTabs = toggleTabs;

        let searchEle;
        scope.documentQuery.scrollToEle = scrollToEle;
        scope.documentQuery.history = [];

        /**
         * @name changePage
         * @desc changes the selected page
         * @param page the page to view (QUERY, RESULT)
         */
        function changePage(page: string): void {
            scope.documentQuery.page = page;
        }

        /**
         * @name round5
         * @desc calculate the closest color breakpoint
         * @param score
         */
        function round5(score: number) {
            return Math.ceil(score / 5) * 5;
        }

        /**
         * @name clearQuery
         * @desc resets the whole query
         */
        function clearQuery(): void {
            scope.documentQuery.search = '';
            scope.documentQuery.threshold = 95;
            scope.documentQuery.rowCount = 3;
            scope.documentQuery.source = false;
            scope.documentQuery.results = { data: [], complete: false };
            scope.documentQuery.disableIndex = 0;
            scope.documentQuery.model = '';
        }

        /**
         * @name runQuery
         * @desc runs the query that the user built and returns insights to build
         */
        function runQuery(): void {
            const message = semossCoreService.utility.random('query-pixel'),
                commands: PixelCommand[] = [];

            scope.documentQuery.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                scope.documentQuery.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                const data = output.data
                    ? output.data
                          .map((a) => ({
                              ...a,
                              answer: a.answer,
                              expanded: false,
                              color:
                                  'anti-gradient-border_' +
                                  round5(a.score * 100),
                          }))
                          .sort((a, b) => b.score - a.score)
                    : [];

                scope.documentQuery.results = {
                    search: scope.documentQuery.search,
                    data: data,
                    complete: true,
                    history: false,
                };

                scope.documentQuery.history.push(scope.documentQuery.results);

                // Scroll to answer
                scope.documentQuery.scrollToEle(scope.documentQuery.history.length - 1);
                scope.documentQuery.search = '';
            });

            commands.push({
                type: 'Pixel',
                components: [
                    `QueryQAModel(filePath=["${scope.documentQuery.folder.path.replace(
                        'version/assets/',
                        ''
                    )}"], model=["${scope.documentQuery.selectedModel}"] ${
                        scope.documentQuery.threshold
                            ? ', threshold="' +
                              scope.documentQuery.threshold +
                              '"'
                            : ''
                    }${
                        scope.documentQuery.rowCount
                            ? ', rowCount="' +
                              scope.documentQuery.rowCount +
                              '"'
                            : ''
                    }${
                        scope.documentQuery.source
                            ? ', source="' + scope.documentQuery.source + '"'
                            : ''
                    } ${
                        scope.documentQuery.space.app.selected
                            ? ', project="' +
                              scope.documentQuery.space.app.selected +
                              '"'
                            : ''
                    } , command=["${scope.documentQuery.search}"])`,
                ],
                terminal: true,
            });
            semossCoreService.emit('query-pixel', {
                commandList: commands,
                listeners: [],
                response: message,
                insightID: scope.widgetCtrl.insightID,
            });
        }

        /**
         * @name clearModels
         * @desc removes the models folder from the selected path
         */
        function clearModels(): void {
            const message = semossCoreService.utility.random('query-pixel'),
                commands: PixelCommand[] = [];

            scope.documentQuery.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                scope.documentQuery.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                scope.$broadcast('browser--render');
            });

            commands.push({
                meta: true,
                type: 'Pixel',
                components: [
                    `ClearModels(filePath=["${scope.documentQuery.folder.path.replace(
                        'version/assets/',
                        ''
                    )}"], model=["${scope.documentQuery.selectedModel}"]  ${
                        scope.documentQuery.space.app.selected
                            ? ', project="' +
                              scope.documentQuery.space.app.selected +
                              '"'
                            : ''
                    } )`,
                ],
                terminal: true,
            });

            semossCoreService.emit('query-pixel', {
                commandList: commands,
                listeners: [],
                response: message,
                insightID: scope.widgetCtrl.insightID,
            });
        }

        /**
         * @name preprocess
         * @desc converts PDFs of selected path to CSV or txt files for building a model
         */
        function preprocess(): void {
            const message = semossCoreService.utility.random('query-pixel'),
                commands: PixelCommand[] = [];

            scope.documentQuery.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                scope.documentQuery.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                scope.$broadcast('browser--render');
            });
            commands.push({
                meta: true,
                type: 'Pixel',
                components: [
                    `PreprocessQA(filePath=["${scope.documentQuery.folder.path.replace(
                        'version/assets/',
                        ''
                    )}"]  ${
                        scope.documentQuery.space.app.selected
                            ? ', project="' +
                              scope.documentQuery.space.app.selected +
                              '"'
                            : ''
                    } )`,
                ],
                terminal: true,
            });

            semossCoreService.emit('query-pixel', {
                commandList: commands,
                listeners: [],
                response: message,
                insightID: scope.widgetCtrl.insightID,
            });
        }

        /**
         * @name createModel
         * @desc build the selected model for the selected folder
         */
        function createModel(): void {
            const message = semossCoreService.utility.random('query-pixel'),
                commands: PixelCommand[] = [];

            scope.documentQuery.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                scope.documentQuery.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                scope.$broadcast('browser--render');
            });
            commands.push({
                meta: true,
                type: 'Pixel',
                components: [
                    `CreateQAModel(filePath=["${scope.documentQuery.folder.path.replace(
                        'version/assets/',
                        ''
                    )}"], model=["${scope.documentQuery.selectedModel}"] ${
                        scope.documentQuery.space.app.selected
                            ? ', project="' +
                              scope.documentQuery.space.app.selected +
                              '"'
                            : ''
                    })`,
                ],
                terminal: true,
            });

            semossCoreService.emit('query-pixel', {
                commandList: commands,
                listeners: [],
                response: message,
                insightID: scope.widgetCtrl.insightID,
            });
        }

        /**
         * @name isValidQuery
         * @desc checks if the query is valid
         */
        function isValidQuery(): boolean {
            if (String(scope.documentQuery.selectedModel).length === 0) {
                scope.documentQuery.modelError = 'You must select a model.';
                return false;
            }

            if (String(scope.documentQuery.search).length === 0) {
                scope.documentQuery.searchError = 'You must ask a question.';
                return false;
            }

            scope.documentQuery.folderError = '';
            scope.documentQuery.searchError = '';
            scope.documentQuery.thresholdError = '';
            return true;
        }

        /**
         * @name setWorkspace
         * @desc setWorkspace the selected directory
         * @param space - space to select
         */
        function setWorkspace(space: string): void {
            scope.documentQuery.space.selected = space;

            const callback = function (payload) {
                let output = payload.pixelReturn[0].output,
                    keepSelected = false;

                scope.documentQuery.space.app.options = [];
                for (
                    let outputIdx = 0, outputLen = output.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    scope.documentQuery.space.app.options.push({
                        display: String(output[outputIdx].project_name).replace(
                            /_/g,
                            ' '
                        ),
                        value: output[outputIdx].project_id,
                        image: semossCoreService.app.generateProjectImageURL(
                            output[outputIdx].project_id
                        ),
                    });

                    if (
                        scope.documentQuery.space.app.selected &&
                        scope.documentQuery.space.app.selected ===
                            output[outputIdx].project_id
                    ) {
                        keepSelected = true;
                    }
                }

                if (
                    !keepSelected &&
                    scope.documentQuery.space.app.options.length > 0
                ) {
                    scope.documentQuery.space.app.selected =
                        scope.documentQuery.space.app.options[0].value;
                }

                changeWorkspace();
            };

            scope.widgetCtrl.query(
                [
                    {
                        meta: true,
                        type: 'getProjectList',
                        components: [],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name changeWorkspace
         * @desc workspace has been changed
         */
        function changeWorkspace(): void {
            if (scope.documentQuery.space.app.selected) {
                scope.documentQuery.folder = {
                    ext: '',
                    name: 'assets',
                    path: 'version/assets/',
                    space: scope.documentQuery.space.app.selected,
                    type: 'directory',
                    split: ['version', 'assets'],
                };
                scope.documentQuery.onOpen({
                    ext: '',
                    name: 'assets',
                    path: 'version/assets/',
                    space: scope.documentQuery.space.app.selected,
                    type: 'directory',
                    split: ['version', 'assets'],
                });
                scope.$broadcast('browser--navigate', {
                    ext: '',
                    name: 'assets',
                    path: 'version/assets/',
                    space: scope.documentQuery.space.app.selected,
                    type: 'directory',
                    split: ['version', 'assets'],
                });
                scope.$broadcast('browser--render', 'version/assets/');
            }
            scope.$broadcast('browser--render');
        }

        /**
         * @name getWorkspace
         * @desc get the value for the selected space
         */
        function getWorkspace(): string {
            return scope.documentQuery.space.app.selected;
        }

        //**Utility */
        /**
         * @name scrollToEle
         * @param
         * @desc scroll to chat element
         */
        function scrollToEle(i:any): void {
         
            $timeout(() => {
                const answerId = "#answer-"+i;
                const element = angular.element(answerId);
                if(element[0]){
                    element[0].scrollIntoView({behavior:"smooth"});
                }
            });
        }

        /** BrowserCallbacks */
        /**
         * @name onRender
         * @desc callback for when the directory is rendered
         * @param path - path to render
         * @param callback - callback function
         */
        function onRender(
            path: string,
            callback: (output: any[], path: string) => {}
        ): void {
            if (!path) {
                path = 'version/assets/';
            }
            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `BrowseAsset(filePath=[${
                                path ? `"${path}"` : ''
                            }], space=[${
                                getWorkspace() ? `"${getWorkspace()}"` : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                ],
                async (response: PixelReturnPayload) => {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];

                    if (type.indexOf('ERROR') > -1) {
                        callback([], '');
                        return;
                    }
                    const split = path.split('/').filter((item) => {
                        return item.length !== 0;
                    });
                    scope.documentQuery.folder = {
                        ext: '',
                        name: split[split.length - 1],
                        path: split.join('/'),
                        space: scope.documentQuery.space.app.selected,
                        type: 'directory',
                        split: split,
                    };

                    const json = await setFieldsForAIAssistant()

                    if(json){
                        semossCoreService.emit('updated-docqa', json)
                    }
                    callback(output, path);


                }
            );
        }

        /**
         * @name onSearch
         * @desc callback for when the directory is searched
         * @param search - search term
         * @param callback - callback function
         */
        function onSearch(search: string, callback: ([]) => {}): void {
            scope.widgetCtrl.execute(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `SearchAsset(search=["${search}"], space=[${
                                getWorkspace() ? `"${getWorkspace()}"` : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                ],
                (response: PixelReturnPayload) => {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];

                    if (type.indexOf('ERROR') > -1) {
                        callback([]);
                        return;
                    }

                    callback(output);
                }
            );
        }

        /**
         * @name onUpload
         * @desc callback for when the an item is uploaded
         * @param path - path to render
         * @param files - files to upload
         * @param comment - comment for the upload
         * @param callback - callback function
         */
        function onUpload(
            path: string,
            files: any,
            comment: string,
            callback: () => {}
        ): void {
            semossCoreService.emit('start-polling', {
                id: scope.widgetCtrl.insightID,
                listeners: [scope.widgetCtrl.insightID],
            });

            monolithService
                .uploadFile(
                    files,
                    scope.widgetCtrl.insightID,
                    getWorkspace(),
                    path
                )
                .then(
                    function (upload) {
                        const components: PixelCommand[] = [];

                        semossCoreService.emit('stop-polling', {
                            id: scope.widgetCtrl.insightID,
                            listeners: [scope.widgetCtrl.insightID],
                        });

                        for (
                            let uploadIdx = 0, uploadLen = upload.length;
                            uploadIdx < uploadLen;
                            uploadIdx++
                        ) {
                            components.push({
                                meta: true,
                                type: 'Pixel',
                                components: [
                                    `CommitAsset(filePath=["${`${path}${upload[uploadIdx].fileName}`}"], comment=["${comment}"], space=[${
                                        getWorkspace()
                                            ? `"${getWorkspace()}"`
                                            : ''
                                    }])`,
                                ],
                                terminal: true,
                            });
                        }

                        if (components.length === 0) {
                            callback();
                            return;
                        }

                        scope.widgetCtrl.execute(components, callback);
                    },
                    function (error) {
                        semossCoreService.emit('stop-polling', {
                            id: scope.widgetCtrl.insightID,
                            listeners: [scope.widgetCtrl.insightID],
                        });
                        scope.widgetCtrl.alert(
                            'error',
                            error.data.errorMessage
                        );
                    }
                );
        }

        /**
         * @name onNew
         * @desc callback for when an item is created
         * @param path - path to render
         * @param name - name of the new item
         * @param type - type of the newly added item
         * @param comment - comment for the upload
         * @param callback - callback function
         */
        function onNew(
            path: string,
            name: string,
            type: string,
            comment: string,
            callback: () => {}
        ) {
            let components: PixelCommand[] = [];

            // it needs to be a string
            path += name;

            if (type === 'file') {
                components = [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `SaveAsset(fileName=["${path}"], content=["<encode></encode>"], space=[${
                                getWorkspace() ? `"${getWorkspace()}"` : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `CommitAsset(filePath=["${path}"], comment=["${comment}"], space=[${
                                getWorkspace() ? `"${getWorkspace()}"` : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                ];
            } else if (type === 'directory') {
                components = [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `MakeDirectory(filePath=["${path}"], space=[${
                                getWorkspace() ? `"${getWorkspace()}"` : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                ];
            }

            if (components.length === 0) {
                return;
            }

            scope.widgetCtrl.execute(components, callback);
        }

        /**
         * @name toggleTabs
         * @param tab - tab being selected
         * @desc switch tabs and update data accordingly
         */
        function toggleTabs(tab: string): void {
            scope.documentQuery.selectedTab = tab;
        }

        /**
         * @name generateSaveJSON
         * @desc forms JSON to be used in ai chatbot
         */
        function generateSaveJSON() {
            if(!scope.documentQuery.folder.path) return false
            if(!scope.documentQuery.space.app.selected) return false
            return {
                filePath: scope.documentQuery.folder.path.replace(
                    'version/assets/',
                    ''
                ),
                project: scope.documentQuery.space.app.selected,
                modelType: scope.documentQuery.selectedModel
            }
        }
        
        /**
         * @name setFieldsForAIAssistant
         * @desc forms JSON to be used in ai chatbot
         */
        function setFieldsForAIAssistant() {
            var pixelComponents = [],
            insightID = scope.widgetCtrl
                ? scope.widgetCtrl.insightID
                : semossCoreService.get('queryInsightID');

            const savedJson = generateSaveJSON();
            if(!savedJson) return false

            const message = semossCoreService.utility.random('query-pixel');
            
            pixelComponents.push({
                type: 'panel',
                components: [scope.widgetCtrl.panelId],
            });
    
            pixelComponents.push({
                type: 'setPanelView',
                components: [
                    'document-query',
                    {
                        json: savedJson
                    },
                ],
                terminal: true,
            });

            semossCoreService.emit('execute-pixel', {
                insightID: insightID,
                commandList: pixelComponents,
                response: message,
            });

            
            return savedJson
        }

        async function changeModel() {
            const json = await setFieldsForAIAssistant()

            if(json){
                semossCoreService.emit('updated-docqa', json)
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize(): void {
            console.log('setting fields')
            setFieldsForAIAssistant()
            let openFn;
            // assign the callback
            scope.$on(
                'browser-asset--get-workspace',
                (event: any, callback: any) => {
                    callback(getWorkspace());
                }
            );

            // capture the onOpen function, we need to have a custom one....
            if (scope.documentQuery.hasOwnProperty('onOpen')) {
                openFn = scope.documentQuery.onOpen;
            }

            scope.documentQuery.onOpen = (item: any) => {
                // add the workspace info
                item.space = getWorkspace();

                // this is the correct model
                scope.documentQuery.model = item;

                // call the onOpen function if it exists
                if (openFn) {
                    openFn({
                        item: item,
                    });
                }
            };

            // set the initial workspace based on the model
            setWorkspace('Project');
            scope.documentQuery.space.app.selected =
                scope.widgetCtrl.getShared('insight.app_id') ||
                scope.documentQuery.model.space ||
                '';

            scope.documentQuery.onOpen({
                ext: '',
                name: 'assets',
                path: 'version/assets/',
                space: scope.documentQuery.space.app.selected,
                type: 'directory',
                split: ['version', 'assets'],
            });
            scope.$broadcast('browser--navigate', {
                ext: '',
                name: 'assets',
                path: 'version/assets/',
                space: scope.documentQuery.space.app.selected,
                type: 'directory',
                split: ['version', 'assets'],
            });

            scope.$broadcast('browser--render');

            // cleanup
            scope.$on('$destroy', function () {});
        }

        initialize();
    }
}
