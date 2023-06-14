('use strict');

import angular from 'angular';

import './document-qa.scss';

export default angular
    .module('app.document-qa.directive', [])
    .directive('documentQa', documentQaDirective);

documentQaDirective.$inject = ['semossCoreService', 'monolithService'];

function documentQaDirective(
    semossCoreService: SemossCoreService,
    monolithService: MonolithService
) {
    documentQaLink.$inject = ['$scope'];
    documentQaLink.$inject = ['scope'];

    return {
        restrict: 'AE',
        template: require('./document-qa.directive.html'),
        scope: {
            search: '=',
        },
        require: ['^widget'],
        controllerAs: 'documentQa',
        bindToController: {
            search: '=',
        },
        replace: true,
        link: documentQaLink,
        controller: documentQaCtrl,
    };

    function documentQaCtrl() {}

    function documentQaLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // General
        scope.documentQa.selectedModel = 'siamese';
        scope.documentQa.folder = '';
        scope.documentQa.search = scope.search;
        scope.documentQa.threshold = 20;
        scope.documentQa.rowCount = 3;
        scope.documentQa.source = true;
        scope.documentQa.folderError = '';
        scope.documentQa.searchError = '';
        scope.documentQa.thresholdError = '';
        scope.documentQa.modelError = '';
        scope.documentQa.model = '';
        scope.documentQa.page = 'QUERY';
        scope.documentQa.helpOverlay = false;
        scope.documentQa.advancedSettings = false;
        scope.documentQa.modelOptions = ['', 'siamese', 'haystack', 'faiss'];

        // Results
        scope.documentQa.results = { data: [], complete: false };
        scope.documentQa.loading = false;

        scope.documentQa.space = {
            selected: 'Project',
            options: ['Project'],
            app: {
                options: [],
                selected: '',
            },
        };

        // Browser
        scope.documentQa.setWorkspace = setWorkspace;
        scope.documentQa.changeWorkspace = changeWorkspace;
        scope.documentQa.onRender = onRender;
        scope.documentQa.onSearch = onSearch;
        scope.documentQa.onUpload = onUpload;
        scope.documentQa.onNew = onNew;

        // Functions
        scope.documentQa.isValidQuery = isValidQuery;
        scope.documentQa.clearQuery = clearQuery;
        scope.documentQa.changePage = changePage;
        scope.documentQa.runQuery = runQuery;
        scope.documentQa.clearModels = clearModels;
        scope.documentQa.preprocess = preprocess;
        scope.documentQa.createModel = createModel;

        /**
         * @name changePage
         * @desc changes the selected page
         * @param page the page to view (QUERY, RESULT)
         */
        function changePage(page: string): void {
            scope.documentQa.page = page;
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
            scope.documentQa.search = '';
            scope.documentQa.threshold = 95;
            scope.documentQa.rowCount = 3;
            scope.documentQa.source = false;
            scope.documentQa.results = { data: [], complete: false };
            scope.documentQa.disableIndex = 0;
            scope.documentQa.model = '';
        }

        /**
         * @name runQuery
         * @desc runs the query that the user built and returns insights to build
         */
        function runQuery(): void {
            const message = semossCoreService.utility.random('query-pixel'),
                commands: PixelCommand[] = [];

            scope.documentQa.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[1].output,
                    type = response.pixelReturn[1].operationType[0];
                scope.documentQa.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                scope.documentQa.results = {
                    data: output.data
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
                        : [],
                    complete: true,
                };

                changePage('RESULT');
            });

            commands.push({
                type: 'Pixel',
                components: [
                    `SetContext('${scope.documentQa.space.app.selected}')`,
                ],
                terminal: true,
            });
            commands.push({
                type: 'Pixel',
                components: [
                    `QueryQAModel(filePath=["${
                        scope.documentQa.folder.name
                    }"], model=["${scope.documentQa.selectedModel}"] ${
                        scope.documentQa.threshold
                            ? ', threshold="' + scope.documentQa.threshold + '"'
                            : ''
                    }${
                        scope.documentQa.rowCount
                            ? ', rowCount="' + scope.documentQa.rowCount + '"'
                            : ''
                    }${
                        scope.documentQa.source
                            ? ', source="' + scope.documentQa.source + '"'
                            : ''
                    } ${
                        scope.documentQa.space.app.selected
                            ? ', project="' +
                              scope.documentQa.space.app.selected +
                              '"'
                            : ''
                    } , command=["${scope.documentQa.search}"])`,
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

            scope.documentQa.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[1].output,
                    type = response.pixelReturn[1].operationType[0];
                scope.documentQa.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
            });

            commands.push({
                type: 'Pixel',
                components: [
                    `SetContext('${scope.documentQa.space.app.selected}')`,
                ],
                terminal: true,
            });
            commands.push({
                meta: true,
                type: 'Pixel',
                components: [
                    `ClearModels(filePath=["${
                        scope.documentQa.folder.name
                    }"], model=["${scope.documentQa.selectedModel}"] ${
                        scope.documentQa.space.app.selected
                            ? ', project="' +
                              scope.documentQa.space.app.selected +
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
         * @name preprocess
         * @desc converts PDFs of selected path to CSV or txt files for building a model
         */
        function preprocess(): void {
            const message = semossCoreService.utility.random('query-pixel'),
                commands: PixelCommand[] = [];

            scope.documentQa.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[1].output,
                    type = response.pixelReturn[1].operationType[0];
                scope.documentQa.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
            });
            commands.push({
                type: 'Pixel',
                components: [
                    `SetContext('${scope.documentQa.space.app.selected}')`,
                ],
                terminal: true,
            });
            commands.push({
                meta: true,
                type: 'Pixel',
                components: [
                    `PreprocessQA(filePath=["${scope.documentQa.folder.name}"]${
                        scope.documentQa.space.app.selected
                            ? ', project="' +
                              scope.documentQa.space.app.selected +
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
         * @name createModel
         * @desc build the selected model for the selected folder
         */
        function createModel(): void {
            const message = semossCoreService.utility.random('query-pixel'),
                commands: PixelCommand[] = [];

            scope.documentQa.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[1].output,
                    type = response.pixelReturn[1].operationType[0];
                scope.documentQa.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
            });
            commands.push({
                type: 'Pixel',
                components: [
                    `SetContext('${scope.documentQa.space.app.selected}')`,
                ],
                terminal: true,
            });
            commands.push({
                meta: true,
                type: 'Pixel',
                components: [
                    `CreateQAModel(filePath=["${
                        scope.documentQa.folder.name
                    }"], model=["${scope.documentQa.selectedModel}"] ${
                        scope.documentQa.space.app.selected
                            ? ', project="' +
                              scope.documentQa.space.app.selected +
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
            if (String(scope.documentQa.selectedModel).length === 0) {
                scope.documentQa.modelError = 'You must select a model.';
                return false;
            }

            if (String(scope.documentQa.search).length === 0) {
                scope.documentQa.searchError = 'You must ask a question.';
                return false;
            }

            scope.documentQa.folderError = '';
            scope.documentQa.searchError = '';
            scope.documentQa.thresholdError = '';
            return true;
        }

        /**
         * @name setWorkspace
         * @desc setWorkspace the selected directory
         * @param space - space to select
         */
        function setWorkspace(space: string): void {
            scope.documentQa.space.selected = space;

            const callback = function (payload) {
                let output = payload.pixelReturn[0].output,
                    keepSelected = false;

                scope.documentQa.space.app.options = [];
                for (
                    let outputIdx = 0, outputLen = output.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    scope.documentQa.space.app.options.push({
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
                        scope.documentQa.space.app.selected &&
                        scope.documentQa.space.app.selected ===
                            output[outputIdx].project_id
                    ) {
                        keepSelected = true;
                    }
                }

                if (
                    !keepSelected &&
                    scope.documentQa.space.app.options.length > 0
                ) {
                    scope.documentQa.space.app.selected =
                        scope.documentQa.space.app.options[0].value;
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
            scope.$broadcast('browser--render');
        }

        /**
         * @name getWorkspace
         * @desc get the value for the selected space
         */
        function getWorkspace(): string {
            return scope.documentQa.space.app.selected;
        }

        /** BrowserCallbacks */
        /**
         * @name onRender
         * @desc callback for when the directory is rendered
         * @param path - path to render
         * @param callback - callback function
         */
        function onRender(path: string, callback: ([]) => {}): void {
            if (!path) {
                path = 'version/assets';
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

        function html_encode(s) {
            var ret_val = '';
            for (let char of s) {
                const code = char.codePointAt(0);
                if (code > 127) {
                    ret_val += '&#' + code + ';';
                } else {
                    ret_val += char;
                }
            }
            return ret_val;
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
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize(): void {
            let openFn;
            // assign the callback
            scope.$on(
                'browser-asset--get-workspace',
                (event: any, callback: any) => {
                    callback(getWorkspace());
                }
            );

            // capture the onOpen function, we need to have a custom one....
            if (scope.documentQa.hasOwnProperty('onOpen')) {
                openFn = scope.documentQa.onOpen;
            }

            scope.documentQa.onOpen = (item: any) => {
                // add the workspace info
                item.space = getWorkspace();

                // this is the correct model
                scope.documentQa.model = item;

                // call the onOpen function if it exists
                if (openFn) {
                    openFn({
                        item: item,
                    });
                }
            };

            // set the initial workspace based on the model
            setWorkspace('Project');
            scope.documentQa.space.app.selected =
                scope.widgetCtrl.getShared('insight.app_id') ||
                scope.documentQa.model.space ||
                '';

            scope.$broadcast('browser--render');

            if (scope.documentQa.space.app.selected)
                scope.documentQa.folder = {
                    ext: '',
                    name: 'assets',
                    path: 'version/assets',
                    space: scope.documentQa.space.app.selected,
                    type: 'directory',
                };
            scope.documentQa.onOpen(scope.documentQa.folder);
            scope.$broadcast('browser--render');

            // cleanup
            scope.$on('$destroy', function () {});
        }

        initialize();
    }
}
