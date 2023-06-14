'use strict';
import * as angular from 'angular';

import './browser-asset.scss';

export default angular
    .module('app.browser-asset.directive', [])
    .directive('browserAsset', browserAssetDirective);

browserAssetDirective.$inject = [
    'ENDPOINT',
    '$timeout',
    'semossCoreService',
    'monolithService',
];

function browserAssetDirective(
    ENDPOINT,
    $timeout,
    semossCoreService,
    monolithService
) {
    browserAssetCompile.$inject = ['tElement', 'tAttributes'];
    browserAssetCtrl.$inject = [];
    browserAssetLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./browser-asset.directive.html'),
        scope: {},
        require: ['^insight'],
        controller: browserAssetCtrl,
        controllerAs: 'browserAsset',
        bindToController: {
            model: '=?',
            disabled: '=?ngDisabled',
            onOpen: '&?',
            onlyDirectory: '=?',
            allowedWorkspace: '=?',
        },
        compile: browserAssetCompile,
    };

    function browserAssetCompile(tElement, tAttributes) {
        if (tAttributes.hasOwnProperty('layout') && tAttributes.layout) {
            const browserEle = tElement[0].querySelector('#browser-asset');

            browserEle.setAttribute('layout', tAttributes.layout);
        }

        return browserAssetLink;
    }

    function browserAssetCtrl() {}

    function browserAssetLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];

        scope.browserAsset.space = {
            selected: 'Insight',
            options: ['User', 'Project', 'Insight'],
            app: {
                options: [],
                selected: '',
            },
        };

        scope.browserAsset.setWorkspace = setWorkspace;
        scope.browserAsset.changeWorkspace = changeWorkspace;
        scope.browserAsset.onRender = onRender;
        scope.browserAsset.onSearch = onSearch;
        scope.browserAsset.onUpload = onUpload;
        scope.browserAsset.onNew = onNew;

        /**
         * @name setWorkspace
         * @desc setWorkspace the selected directory
         * @param space - space to select
         */
        function setWorkspace(space: string): void {
            scope.browserAsset.space.selected = space;

            if (scope.browserAsset.space.selected === 'User') {
                changeWorkspace();
            } else if (scope.browserAsset.space.selected === 'Project') {
                const callback = function (payload) {
                    let output = payload.pixelReturn[0].output,
                        keepSelected = false;

                    scope.browserAsset.space.app.options = [];
                    for (
                        let outputIdx = 0, outputLen = output.length;
                        outputIdx < outputLen;
                        outputIdx++
                    ) {
                        scope.browserAsset.space.app.options.push({
                            display: String(
                                output[outputIdx].project_name
                            ).replace(/_/g, ' '),
                            value: output[outputIdx].project_id,
                            image: semossCoreService.app.generateProjectImageURL(
                                output[outputIdx].project_id
                            ),
                        });

                        if (
                            scope.browserAsset.space.app.selected &&
                            scope.browserAsset.space.app.selected ===
                                output[outputIdx].project_id
                        ) {
                            keepSelected = true;
                        }
                    }

                    if (
                        !keepSelected &&
                        scope.browserAsset.space.app.options.length > 0
                    ) {
                        scope.browserAsset.space.app.selected =
                            scope.browserAsset.space.app.options[0].value;
                    }

                    changeWorkspace();
                };

                scope.insightCtrl.query(
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
            } else if (scope.browserAsset.space.selected === 'Insight') {
                changeWorkspace();
            }
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
            if (scope.browserAsset.space.selected === 'User') {
                return 'user';
            } else if (scope.browserAsset.space.selected === 'Project') {
                return scope.browserAsset.space.app.selected;
            } else if (scope.browserAsset.space.selected === 'Insight') {
                return '';
            }

            return '';
        }

        /** Browswer Callbacks */
        /**
         * @name onRender
         * @desc callback for when the directory is rendered
         * @param path - path to render
         * @param callback - callback function
         */
        function onRender(path: string, callback: ([]) => {}): void {
            scope.insightCtrl.meta(
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
            scope.insightCtrl.execute(
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
                id: scope.insightCtrl.insightID,
                listeners: [scope.insightCtrl.insightID],
            });

            monolithService
                .uploadFile(
                    files,
                    scope.insightCtrl.insightID,
                    getWorkspace(),
                    path
                )
                .then(
                    function (upload) {
                        const components: PixelCommand[] = [];

                        semossCoreService.emit('stop-polling', {
                            id: scope.insightCtrl.insightID,
                            listeners: [scope.insightCtrl.insightID],
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

                        scope.insightCtrl.execute(components, callback);
                    },
                    function (error) {
                        semossCoreService.emit('stop-polling', {
                            id: scope.insightCtrl.insightID,
                            listeners: [scope.insightCtrl.insightID],
                        });
                        scope.insightCtrl.alert(
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

            scope.insightCtrl.execute(components, callback);
        }

        /**
         * @name initialize
         * @desc initialize the module
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
            if (scope.browserAsset.hasOwnProperty('onOpen')) {
                openFn = scope.browserAsset.onOpen;
            }

            scope.browserAsset.onOpen = (item: any) => {
                // add the workspace info
                item.space = getWorkspace();

                // this is the correct model
                scope.browserAsset.model = item;

                // call the onOpen function if it exists
                if (openFn) {
                    openFn({
                        item: item,
                    });
                }
            };

            // set the initial workspace based on the model
            if (
                scope.browserAsset.model &&
                scope.browserAsset.model.space === 'user'
            ) {
                setWorkspace('User');
            } else if (
                scope.browserAsset.model &&
                scope.browserAsset.model.space
            ) {
                scope.browserAsset.space.app.selected =
                    scope.browserAsset.model.space;
                setWorkspace('Project');
            } else {
                setWorkspace('User');
            }

            // cleanup
            scope.$on('$destroy', function () {});
        }

        initialize();
    }
}
