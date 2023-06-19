'use strict';

import './browser.scss';
import * as angular from 'angular';
import Utility from '../../utility/utility';

export default angular
    .module('app.browser.directive', [])
    .directive('browser', browserDirective);

browserDirective.$inject = ['$timeout'];

function browserDirective($timeout: ng.ITimeoutService) {
    browserCompile.$inject = ['tElement', 'tAttributes'];
    browserCtrl.$inject = [];
    browserLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./browser.directive.html'),
        scope: {},
        require: ['?^insight'],
        controller: browserCtrl,
        controllerAs: 'browser',
        bindToController: {
            model: '=?',
            disabled: '=?ngDisabled',
            onRender: '&',
            onSearch: '&?',
            onOpen: '&?',
            onUpload: '&?',
            onNew: '&?',
            onlyDirectory: '=?',
            layout: '@?',
        },
        transclude: {
            toggle: '?toggle',
            header: '?header',
            footer: '?footer',
        },
        compile: browserCompile,
    };

    function browserCompile(tElement, tAttributes) {
        if (tAttributes.hasOwnProperty('layout')) {
            let browserEle, toggleEle;

            // remove the browser
            browserEle = angular.element(tElement[0].querySelector('#browser'));
            browserEle.remove();

            // add the toggle
            toggleEle = angular.element(`
            <div id="browser__toggle"
                class="browser__toggle ${
                    tAttributes.compact ? 'browser__toggle--compact' : ''
                } ${tAttributes.bordered ? 'browser__toggle--bordered' : ''}"
                ng-disabled="browser.disabled"
                tabindex="{{browser.disabled ? -1 : 0}}"
                title="{{browser.model.path}}">
                <div class="browser__toggle__mark">
                    <i class="fa fa-file-o"
                        ng-show="browser.model.type !== 'directory'"></i>
                    <i class="fa fa-folder smss-color--warn"
                        ng-show="browser.model.type === 'directory'"></i>
                </div>
                ${
                    tAttributes.compact
                        ? ''
                        : `
                <div class="browser__toggle__text"
                    ng-transclude="toggle">
                    <span>{{browser.model.name}}</span>
                </div>`
                }
            </div>
        `);
            // add the toggle element
            tElement.append(toggleEle);

            if (tAttributes.layout === 'overlay') {
                // add the popover
                let overlayEle, overlayContentEle;

                // add click
                toggleEle.attr('ng-click', 'browser.open=true;');

                overlayEle = angular.element(`
                <smss-overlay open="browser.open">
                    <smss-overlay-body>
                        <div class="browser__overlay">
                            
                        </div>
                    </smss-overlay-body>
                    <smss-overlay-footer>
                        <smss-btn ng-click="browser.open=false;">
                            Cancel
                        </smss-btn>
                        <smss-btn ng-click="browser.selectDirectory()"
                            ng-if="browser.onlyDirectory">
                            Select Directory
                        </smss-btn>
                    </smss-overlay-footer>
                </smss-overlay>
                `);

                overlayContentEle = angular.element(
                    overlayEle[0].querySelector('.browser__overlay')
                );
                overlayContentEle.append(browserEle);

                tElement.append(overlayEle);
            } else if (tAttributes.layout === 'popover') {
                // add the popover
                let popoverEle, popoverContentEle;

                // make it a popover
                toggleEle.attr('smss-popover', '');

                popoverEle = angular.element(`
                <smss-popover-content model="browser.open"
                            position="['SW', 'SE', 'NW','NE']"
                            ${
                                tAttributes.hasOwnProperty('body')
                                    ? `body=${!(tAttributes.body === 'false')}`
                                    : ''
                            }>
                    <div class="browser__popover" ng-click="$event.stopPropagation()">

                    </div>
                    <div class="smss-action" ng-if="browser.onlyDirectory">
                        <smss-btn ng-click="browser.selectDirectory()">
                            Select Directory
                        </smss-btn>
                    </div>
                </smss-popover-content>
                `);

                popoverContentEle = angular.element(
                    popoverEle[0].querySelector('.browser__popover')
                );
                popoverContentEle.append(browserEle);

                toggleEle.append(popoverEle);
            }
        }

        return browserLink;
    }

    function browserCtrl() {}

    function browserLink(scope, ele, attrs, ctrl) {
        let searchTimeout, blurTimeout;

        scope.insightCtrl = ctrl[0];

        interface item {
            active: boolean;
            name: string;
            ext: string;
            type: 'directory' | 'file';
            date: string;
            path: string;
            split: string[];
        }

        scope.browser.open = false;

        scope.browser.flow = undefined;

        scope.browser.search = {
            term: '',
            open: false,
            available: false,
        };

        scope.browser.directory = {
            options: [],
            split: [],
        };

        scope.browser.upload = {
            open: false,
            flow: undefined,
            comment: '',
            available: false,
        };

        scope.browser.new = {
            open: false,
            type: 'file',
            name: '',
            comment: '',
            available: false,
        };

        scope.browser.searchDirectory = searchDirectory;
        scope.browser.navigateDirectory = navigateDirectory;
        scope.browser.openDirectory = openDirectory;
        scope.browser.selectDirectory = selectDirectory;
        scope.browser.openSearch = openSearch;
        scope.browser.blurSearch = blurSearch;
        scope.browser.closeSearch = closeSearch;
        scope.browser.openUpload = openUpload;
        scope.browser.closeUpload = closeUpload;
        scope.browser.saveUpload = saveUpload;
        scope.browser.removeUploadFiles = removeUploadFiles;
        scope.browser.openNew = openNew;
        scope.browser.closeNew = closeNew;
        scope.browser.saveNew = saveNew;

        /**
         * @name getDirectory
         * @desc get the path for the selected directory
         * @returns valid path of the directory
         */
        function getDirectory(): string {
            if (scope.browser.directory.split) {
                return scope.browser.directory.split.join('/');
            }

            return '';
        }

        /**
         * @name renderDirectory
         * @desc renderDirectory the selected directory
         */
        function renderDirectory(): void {
            let callback: any, path: string;

            callback = (
                output: {
                    name: string;
                    type: string;
                    lastModified: string;
                    path: string;
                }[]
            ) => {
                // split so the directories show up first
                const directories: item[] = [],
                    files: item[] = [];

                for (let idx = 0, len = output.length; idx < len; idx++) {
                    const split = output[idx].path.split('/').filter((item) => {
                        return item.length !== 0;
                    });

                    if (output[idx].type === 'directory') {
                        directories.push({
                            active: true,
                            name: output[idx].name,
                            ext: '',
                            type: 'directory',
                            date: output[idx].lastModified,
                            path: output[idx].path,
                            split: split,
                        });
                    } else {
                        files.push({
                            active: !scope.browser.onlyDirectory,
                            name: output[idx].name,
                            ext: output[idx].name
                                ? output[idx].name.substr(
                                      output[idx].name.lastIndexOf('.') + 1
                                  )
                                : '',
                            type: 'file',
                            date: output[idx].lastModified,
                            path: output[idx].path,
                            split: split,
                        });
                    }
                }

                // sort each
                Utility.sort(directories, 'name');
                Utility.sort(files, 'name');

                scope.browser.directory.options = [...directories, ...files];
            };

            // it needs to be a string
            path = scope.browser.directory.split.join('/');

            // call the render function
            scope.browser.onRender({
                path: path,
                callback: callback,
            });
        }

        /**
         * @name searchDirectory
         * @desc search the directory based on a search string
         */
        function searchDirectory(): void {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            // debounce
            searchTimeout = $timeout(function () {
                const callback = (
                    output: {
                        name: string;
                        type: string;
                        lastModified: string;
                        path: string;
                    }[]
                ) => {
                    scope.browser.directory.options = [];
                    for (let idx = 0, len = output.length; idx < len; idx++) {
                        scope.browser.directory.options.push({
                            active: !scope.browser.onlyDirectory,
                            name: output[idx].path,
                            ext: output[idx].name
                                ? output[idx].name.substr(
                                      output[idx].name.lastIndexOf('.') + 1
                                  )
                                : '',
                            type: output[idx].type,
                            date: output[idx].lastModified,
                            path: output[idx].path,
                            split: output[idx].path
                                .split('/')
                                .filter((item) => {
                                    return item.length !== 0;
                                }),
                        });
                    }
                };

                scope.browser.onSearch({
                    search: scope.browser.search.term,
                    callback: callback,
                });

                $timeout.cancel(searchTimeout);
            }, 300);
        }

        /**
         * @name navigateDirectory
         * @desc navigate to a specific directory
         * @param pathIdx - index of the path to remove from
         */
        function navigateDirectory(pathIdx: number): void {
            scope.browser.directory.split.length = pathIdx + 1;
            renderDirectory();
        }

        /**
         * @name openDirectory
         * @desc open the item
         * @param item - the item to open
         */
        function openDirectory(item: item): void {
            if (blurTimeout) {
                $timeout.cancel(blurTimeout);
            }

            // enter the directorty
            if (item.type === 'directory') {
                scope.browser.directory.split = item.split;
                scope.browser.model = item;
                renderDirectory();
                return;
            }

            // this means that only a directory can be opened
            if (scope.browser.onlyDirectory) {
                return;
            }

            scope.browser.model = item;

            // TODO:check if the file is allowed to be opened
            scope.browser.onOpen({
                item: item,
            });

            scope.browser.open = false;
        }

        /**
         * @name selectDirectory
         * @desc a folder has been open
         */
        function selectDirectory(): void {
            const path = getDirectory(),
                item = {
                    name: `${path.split('/').pop()}`,
                    ext: '',
                    type: 'directory',
                    path: path,
                };

            scope.browser.onOpen({
                item: item,
            });

            scope.browser.model = item;

            scope.browser.open = false;
        }

        /**
         * @name openSearch
         * @desc open the search
         */
        function openSearch(): void {
            scope.browser.search.term = '';
            scope.browser.search.open = true;

            const searchEle = ele[0].querySelector(
                '#browser__files__search__input'
            );
            if (document.activeElement !== searchEle) {
                searchEle.focus();
            }
        }

        /**
         * @name blurSearch
         * @desc close the search
         */
        function blurSearch(): void {
            // cancel the timeout so it doesn't rerun
            if (blurTimeout) {
                $timeout.cancel(blurTimeout);
            }

            blurTimeout = $timeout(function () {
                closeSearch();
            }, 300);
        }

        /**
         * @name closeSearch
         * @desc close the search
         */
        function closeSearch(): void {
            // cancel the timeout so it doesn't rerun
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            scope.browser.search.term = '';
            scope.browser.search.open = false;

            renderDirectory();
        }

        /**
         * @name openUpload
         * @desc open the upload modal
         * @param flow - newly added flow file
         */
        function openUpload(flow: any): void {
            if (!scope.browser.upload.available) {
                return;
            }

            if (flow && flow.file) {
                $timeout(function () {
                    scope.browser.upload.flow.addFile(flow.file);
                    // make comment pre populate for git
                    scope.browser.upload.comment = `Initial upload of file ${flow.name}`;
                }, 100);
            } else {
                scope.browser.upload.flow = undefined;
                scope.browser.upload.comment = '';
            }
            scope.browser.upload.open = true;
        }

        /**
         * @name closeUpload
         * @desc open the upload modal
         */
        function closeUpload(): void {
            scope.browser.upload.flow = undefined;
            scope.browser.upload.comment = '';
            scope.browser.upload.open = false;
        }

        /**
         * @name saveUpload
         * @desc actually perform the upload
         */
        function saveUpload(): void {
            let callback: any, path: string;

            if (scope.browser.upload.flow.files.length === 0) {
                scope.insightCtrl.alert(
                    'warn',
                    'Please select files to upload.'
                );
                return;
            }

            if (!scope.browser.upload.comment) {
                scope.insightCtrl.alert(
                    'warn',
                    'Please include a comment to describe your newly added file(s).'
                );
                return;
            }

            // it needs to be a string
            path = scope.browser.directory.split.join('/');

            if (path.length > 0) {
                path += '/';
            }

            callback = () => {
                // closeE
                closeUpload();

                // rerender
                renderDirectory();
            };

            scope.browser.onUpload({
                path: path,
                files: scope.browser.upload.flow.files,
                comment: scope.browser.upload.comment,
                callback: callback,
            });
        }
        /**
         * @name removeUploadFiles
         * @desc called when a user removes a file from the upload
         * @param file - the file to remove
         */
        function removeUploadFiles(file: any): void {
            if (file) {
                file.cancel();
            }
        }

        /**
         * @name openNew
         * @desc open the new modal
         */
        function openNew(): void {
            if (!scope.browser.new.available) {
                return;
            }
            scope.browser.new.type = 'file';
            scope.browser.new.name = '';
            scope.browser.new.comment = '';
            scope.browser.new.open = true;
            // check for any changes in file name
            scope.$watch('browser.new.name', function () {
                scope.browser.new.comment = `Initial creation of file ${scope.browser.new.name}`;
            });
        }

        /**
         * @name closeNew
         * @desc close the new modal
         */
        function closeNew(): void {
            scope.browser.new.type = 'file';
            scope.browser.new.name = '';
            scope.browser.new.comment = '';
            scope.browser.new.open = false;
        }

        /**
         * @name saveNew
         * @desc save and create the new file
         */
        function saveNew(): void {
            let callback: any, path: string;

            if (!scope.browser.new.name) {
                scope.insightCtrl.alert(
                    'warn',
                    `Please enter a name for your newly created ${scope.browser.new.type}.`
                );
                return;
            }

            if (!scope.browser.new.comment) {
                scope.insightCtrl.alert(
                    'warn',
                    `Please include a comment to describe your newly created ${scope.browser.new.type}.`
                );
                return;
            }

            // it needs to be a string
            path = scope.browser.directory.split.join('/');

            if (path.length > 0) {
                path += '/';
            }

            callback = () => {
                // closeE
                closeNew();

                // rerender
                renderDirectory();
            };

            scope.browser.onNew({
                path: path,
                name: scope.browser.new.name,
                type: scope.browser.new.type,
                comment: scope.browser.new.comment,
                callback: callback,
            });
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize() {
            // assign the callback
            scope.$on('browser--get', (event: any, callback: any) => {
                callback(getDirectory());
            });

            scope.$on('browser--render', (event: any) => {
                renderDirectory();
            });

            scope.$on('browser--navigate', (event: any, item: any) => {
                openDirectory(item);
            });

            // set up the API / callbacks
            if (!scope.browser.hasOwnProperty('onRender')) {
                console.error('Set function to render files + directory');

                scope.browser.onRender = (
                    path: string,
                    callback: () => {}
                ) => {};
            }

            if (!scope.browser.hasOwnProperty('onSearch')) {
                console.warn('Set function to render search');

                scope.browser.onSearch = (
                    search: string,
                    callback: () => {}
                ) => {};

                scope.browser.search.available = false;
            } else {
                scope.browser.search.available = true;
            }

            if (!scope.browser.hasOwnProperty('onOpen')) {
                console.warn('Set function to render opening');

                scope.browser.onOpen = (item: item) => {};
            }

            if (!scope.browser.hasOwnProperty('onUpload')) {
                console.warn('Set function to render upload');

                scope.browser.onUpload = (
                    path: string,
                    files: any,
                    comment: string,
                    callback: () => {}
                ) => {};

                scope.browser.upload.available = false;
            } else {
                scope.browser.upload.available = true;
            }

            if (!scope.browser.hasOwnProperty('onNew')) {
                console.warn('Set function to render new');

                scope.browser.onNew = (
                    path: string,
                    name: string,
                    type: string,
                    comment: string,
                    callback: () => {}
                ) => {};

                scope.browser.new.available = false;
            } else {
                scope.browser.new.available = true;
            }

            // cleanup
            scope.$on('$destroy', function () {});
        }

        initialize();
    }
}
