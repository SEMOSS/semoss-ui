'use strict';

import { PREVIEW_LIMIT } from '@/core/constants.js';
import jmespath from 'jmespath';

import './pipeline-api.scss';

export default angular
    .module('app.pipeline.pipeline-api', [])
    .directive('pipelineApi', pipelineApiDirective);

pipelineApiDirective.$inject = ['$timeout'];

function pipelineApiDirective($timeout) {
    pipelineApiCtrl.$inject = [];
    pipelineApiLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline-api.directive.html'),
        scope: {},
        require: ['^widget', '^pipelineComponent'],
        controller: pipelineApiCtrl,
        controllerAs: 'pipelineApi',
        bindToController: {},
        link: pipelineApiLink,
    };

    function pipelineApiCtrl() {}

    function pipelineApiLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        var aliasTimeout;

        scope.pipelineApi.step = 1;

        scope.pipelineApi.frameType = undefined;
        scope.pipelineApi.customFrameName = {
            name: '',
            valid: true,
            message: '',
        };

        scope.pipelineApi.api = {
            url: '',
            type: 'get',
            headers: [],
            body: [],
        };

        scope.pipelineApi.json = {
            raw: {},
            rendered: {},
        };

        scope.pipelineApi.parser = {
            type: 'select',
        };

        scope.pipelineApi.header = {
            key: '',
            value: '',
        };

        scope.pipelineApi.body = {
            key: '',
            value: '',
        };

        scope.pipelineApi.root = {
            raw: [],
            options: [],
            selected: '',
        };

        scope.pipelineApi.available = {
            options: [],
        };

        scope.pipelineApi.selected = {
            columns: [],
        };

        scope.pipelineApi.valid = false;

        scope.pipelineApi.updateFrame = updateFrame;
        scope.pipelineApi.updateType = updateType;
        scope.pipelineApi.addHeader = addHeader;
        scope.pipelineApi.removeHeader = removeHeader;
        scope.pipelineApi.addBody = addBody;
        scope.pipelineApi.removeBody = removeBody;
        scope.pipelineApi.resetData = resetData;
        scope.pipelineApi.getData = getData;
        scope.pipelineApi.updateParser = updateParser;
        scope.pipelineApi.updateRoot = updateRoot;
        scope.pipelineApi.addSelected = addSelected;
        scope.pipelineApi.removeSelected = removeSelected;
        scope.pipelineApi.updateSelectedAlias = updateSelectedAlias;
        scope.pipelineApi.validateSelected = validateSelected;
        scope.pipelineApi.previewApi = previewApi;
        scope.pipelineApi.importApi = importApi;
        scope.pipelineApi.addAll = addAll;
        scope.pipelineApi.clearAll = clearAll;
        scope.pipelineApi.validateFrameName = validateFrameName;

        /**
         * @name setFrameData
         * @desc set the frame type
         * @return {void}
         */
        function setFrameData() {
            scope.pipelineApi.frameType =
                scope.widgetCtrl.getOptions('initialFrameType');
        }

        /**
         * @name updateFrame
         * @param {string} frame - frame
         * @desc update the frame type
         * @return {void}
         */
        function updateFrame(frame) {
            scope.widgetCtrl.setOptions('initialFrameType', frame);
        }

        /**
         * @name setApi
         * @desc update the frame type
         * @return {void}
         */
        function setApi() {
            var apiComponent = scope.pipelineComponentCtrl.getComponent(
                'parameters.QUERY_STRUCT.value'
            );

            if (apiComponent) {
                if (apiComponent.url) {
                    scope.pipelineApi.api.url = apiComponent.url;
                }

                if (apiComponent.type) {
                    scope.pipelineApi.api.type = apiComponent.type;
                }

                if (apiComponent.method) {
                    scope.pipelineApi.api.method = apiComponent.method;
                }

                if (apiComponent.headers) {
                    scope.pipelineApi.api.headers = apiComponent.headers;
                }

                if (apiComponent.body) {
                    scope.pipelineApi.api.body = apiComponent.body;
                }
            }

            // has to be the first step
            scope.pipelineApi.step = 1;
        }

        /**
         * @name updateType
         * @desc update the api's type
         * @return {void}
         */
        function updateType() {
            if (scope.pipelineApi.api.type === 'post') {
                scope.pipelineApi.api.body = [];
            }
        }

        /**
         * @name addHeader
         * @desc add an api header
         * @return {void}
         */
        function addHeader() {
            if (
                scope.pipelineApi.header.key.length === 0 ||
                scope.pipelineApi.header.value.length === 0
            ) {
                return;
            }
            // intentionally can have duplicates
            scope.pipelineApi.api.headers.push({
                key: scope.pipelineApi.header.key,
                value: scope.pipelineApi.header.value,
            });

            scope.pipelineApi.header.key = '';
            scope.pipelineApi.header.value = '';
        }

        /**
         * @name removeHeader
         * @desc remove an api header
         * @param {string} idx - index to remove the header
         * @return {void}
         */
        function removeHeader(idx) {
            scope.pipelineApi.api.headers.splice(idx, 1);
        }

        /**
         * @name addBody
         * @desc add an api body key value pair
         * @return {void}
         */
        function addBody() {
            if (
                scope.pipelineApi.body.key.length === 0 ||
                scope.pipelineApi.body.value.length === 0
            ) {
                return;
            }

            // intentionally can have duplicates
            scope.pipelineApi.api.body.push({
                key: scope.pipelineApi.body.key,
                value: scope.pipelineApi.body.value,
            });

            scope.pipelineApi.body.key = '';
            scope.pipelineApi.body.value = '';
        }

        /**
         * @name removeBody
         * @desc remove an api body key value pair
         * @param {string} idx - index to remove the pair
         * @return {void}
         */
        function removeBody(idx) {
            scope.pipelineApi.api.body.splice(idx, 1);
        }

        /**
         * @name resetData
         * @desc calls function to step back and reset the api's data
         * @returns {void}
         */
        function resetData() {
            scope.pipelineApi.step = 1;
        }

        /**
         * @name getData
         * @desc calls function to get the api's data
         * @returns {void}
         */
        function getData() {
            var callback,
                pixelComponents = [],
                headers,
                headerIdx,
                headerLen,
                body,
                bodyIdx,
                bodyLen;

            if (
                scope.pipelineApi.api.url.length === 0 ||
                !scope.pipelineApi.api.type
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Url is empty. Please enter a url.'
                );
                return;
            }

            headers = {};
            for (
                headerIdx = 0, headerLen = scope.pipelineApi.api.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                headers[scope.pipelineApi.api.headers[headerIdx].key] =
                    scope.pipelineApi.api.headers[headerIdx].value;
            }

            if (scope.pipelineApi.api.type === 'get') {
                pixelComponents = [
                    {
                        type: 'getRequest',
                        components: [scope.pipelineApi.api.url, headers],
                        terminal: true,
                        meta: true,
                    },
                ];
            } else if (scope.pipelineApi.api.type === 'post') {
                body = {};
                for (
                    bodyIdx = 0, bodyLen = scope.pipelineApi.api.body.length;
                    bodyIdx < bodyLen;
                    bodyIdx++
                ) {
                    body[scope.pipelineApi.api.body[bodyIdx].key] =
                        scope.pipelineApi.api.body[bodyIdx].value;
                }

                pixelComponents = [
                    {
                        type: 'postRequest',
                        components: [scope.pipelineApi.api.url, headers, body],
                        terminal: true,
                        meta: true,
                    },
                ];
            }

            if (pixelComponents.length === 0) {
                return;
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (type.indexOf('OPERATION') > -1 && output[0] === '<') {
                    return;
                }

                console.log(
                    'TODO: optimize this somehow, it gets slow when there is a a lot of data'
                );

                scope.pipelineApi.step = 2;

                scope.pipelineApi.json.raw = JSON.parse(output);

                updateParser();
            };

            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        /**
         * @name updateParser
         * @desc update the parser
         * @return {void}
         */
        function updateParser() {
            var root;
            if (scope.pipelineApi.parser.type === 'select') {
                scope.pipelineApi.root.raw = findRoots(
                    scope.pipelineApi.json.raw
                );

                // the options are the ones that end in [] (they are an array)
                scope.pipelineApi.root.options = [];
                for (root in scope.pipelineApi.root.raw) {
                    if (scope.pipelineApi.root.raw.hasOwnProperty(root)) {
                        if (root.substr(-2) === '[]') {
                            scope.pipelineApi.root.options.push(root);
                        }
                    }
                }

                // set the root
                if (scope.pipelineApi.root.options.length > 0) {
                    scope.pipelineApi.root.selected =
                        scope.pipelineApi.root.options[0];
                }

                updateRoot();
            } else {
                scope.pipelineApi.json.rendered = JSON.parse(
                    JSON.stringify(scope.pipelineApi.json.raw)
                );
            }
        }

        /**
         * @name findRoots
         * @desc called to record the path, the options object has all of the values (by reference)
         * @param {*} json - json to find the path of
         * @returns {array} all of the paths in the json (in the notation of 'a.b.c')
         */
        function findRoots(json) {
            var queue = [],
                record = {},
                current,
                next,
                isArray,
                keys,
                keyIdx,
                keyLen;

            queue.push({
                item: json,
                parent: '',
                path: '',
            });

            while (queue.length > 0) {
                current = queue.shift();

                if (current.path) {
                    if (!record.hasOwnProperty(current.path)) {
                        record[current.path] = {};
                    }
                }

                if (current.parent) {
                    if (record.hasOwnProperty(current.parent)) {
                        record[current.parent][current.path] = true;
                    }
                }

                if (typeof current.item === 'object' && current.item) {
                    isArray = Array.isArray(current.item);
                    keys = Object.keys(current.item);

                    if (keys.length > 0) {
                        for (
                            keyIdx = 0, keyLen = keys.length;
                            keyIdx < keyLen;
                            keyIdx++
                        ) {
                            next = {
                                item: current.item[keys[keyIdx]],
                                parent: current.path,
                                path: current.path,
                            };

                            // it is a valid path if it isn't an array
                            if (!isArray) {
                                if (next.path) {
                                    next.path += '.';
                                }

                                next.path += `"${keys[keyIdx]}"`;
                            } else {
                                next.path += '[]';
                            }

                            queue.push(next);
                        }
                    }
                }
            }

            return record;
        }

        /**
         * @name updateRoot
         * @desc update the api's root
         * @return {void}
         */
        function updateRoot() {
            var root, relativePath;

            if (scope.pipelineApi.parser.type === 'select') {
                // update the available options
                scope.pipelineApi.available.options = [];

                for (root in scope.pipelineApi.root.raw) {
                    if (scope.pipelineApi.root.raw.hasOwnProperty(root)) {
                        if (
                            root.indexOf(scope.pipelineApi.root.selected) === 0
                        ) {
                            // can't end in an array
                            if (root.substr(-2) === '[]') {
                                continue;
                            }

                            relativePath = String(root);

                            if (
                                relativePath.indexOf(
                                    scope.pipelineApi.root.selected
                                ) === 0
                            ) {
                                relativePath = relativePath.slice(
                                    scope.pipelineApi.root.selected.length
                                );
                            }

                            // if there is a leading '.' remove it
                            if (relativePath.indexOf('.') === 0) {
                                relativePath = relativePath.slice(1);
                            }

                            scope.pipelineApi.available.options.push({
                                alias: relativePath
                                    .replace(/[^a-zA-Z0-9 ]/g, ' ')
                                    .replace(/_/g, ' ')
                                    .replace(/  +/g, ' ')
                                    .trim(),
                                relativePath: relativePath,
                                table: 'placeholder',
                            });
                        }
                    }
                }

                try {
                    scope.pipelineApi.json.rendered = jmespath.search(
                        scope.pipelineApi.json.raw,
                        scope.pipelineApi.root.selected
                    );
                } catch (err) {
                    console.warn(err);
                    scope.widgetCtrl.alert(
                        'warn',
                        'invalid jmes query. Please enter a valid query.'
                    );
                    scope.pipelineApi.json.rendered =
                        scope.pipelineApi.json.raw;
                }
            }

            // clear selected
            scope.pipelineApi.selected.columns = [];
            // validate the selected
            validateSelected();

            // update the preview
            previewApi();
        }

        /**
         * @name addSelected
         * @desc add a selected column
         * @param {string} column - column
         * @return {void}
         */
        function addSelected(column) {
            var addedColumns = {},
                upperColumn,
                colIdx,
                colLen,
                newColumn,
                count = 1;

            for (
                colIdx = 0, colLen = scope.pipelineApi.selected.columns.length;
                colIdx < colLen;
                colIdx++
            ) {
                upperColumn =
                    scope.pipelineApi.selected.columns[
                        colIdx
                    ].column.toUpperCase();
                addedColumns[upperColumn] = true;
            }

            newColumn = String(column.relativePath)
                .replace(/[^a-zA-Z0-9_ ]/g, '')
                .replace(/ /g, '_');

            while (addedColumns.hasOwnProperty(newColumn.toUpperCase())) {
                newColumn = newColumn + '_' + count;
                count++;
            }

            scope.pipelineApi.selected.columns.push({
                alias: column.alias,
                column: newColumn,
                table: 'placeholder',
                relativePath: column.relativePath,
                hasAliasError: false,
            });

            // validate the selected
            validateSelected();
        }

        /**
         * @name addAll
         * @desc add all columns
         * @returns {void}
         */
        function addAll() {
            var option;
            scope.pipelineApi.selected.columns = [];
            for (
                option = 0;
                option < scope.pipelineApi.available.options.length;
                option++
            ) {
                addSelected(scope.pipelineApi.available.options[option]);
            }

            previewApi();
        }

        /**
         * @name clearAll
         * @desc clear all columns
         * @returns {void}
         */
        function clearAll() {
            scope.pipelineApi.selected.columns = [];
            // validate the selected
            validateSelected();
            previewApi();
        }

        /**
         * @name removeSelected
         * @desc remove a selected column
         * @param {number} idx - idx
         * @return {void}
         */
        function removeSelected(idx) {
            scope.pipelineApi.selected.columns.splice(idx, 1);

            // validate the selected
            validateSelected();

            // update the preview
            previewApi();
        }

        /**
         * @name updateSelectedAlias
         * @desc when user updates alias we want to update preview but not on each change
         *       so, we create a timeout that is canceled at the beginning of each call
         *       to this function so when the user types, load preview will not be continuously
         *       called. After one second of no typing previewSelected is called
         * @return {void}
         */
        function updateSelectedAlias() {
            // validate the selected
            validateSelected();

            if (aliasTimeout) {
                $timeout.cancel(aliasTimeout);
            }

            aliasTimeout = $timeout(function () {
                // update the preview
                previewApi();
            }, 300);
        }

        /**
         * @name validateSelected
         * @desc validate the selected columns
         * @returns {void}
         */
        function validateSelected() {
            var alias,
                colIdx,
                colLen,
                upperAlias,
                aliasMap = {},
                aliasIdx,
                aliasLen;

            if (
                scope.pipelineApi.api.url.length === 0 ||
                !scope.pipelineApi.api.type ||
                scope.pipelineApi.selected.columns.length === 0
            ) {
                scope.pipelineApi.valid = false;
                return;
            }

            // check for invalid aliases
            // and aggregate alias that match ignoring case
            for (
                colIdx = 0, colLen = scope.pipelineApi.selected.columns.length;
                colIdx < colLen;
                colIdx++
            ) {
                // check if the alias itself is valid and save the duplicate
                scope.pipelineApi.selected.columns[colIdx].hasAliasError =
                    !scope.pipelineApi.selected.columns[colIdx].alias ||
                    !!scope.pipelineApi.selected.columns[colIdx].alias.match(
                        /[-\/\\^$*+?.()|[\]{};!%#@~`]/g
                    ) ||
                    !!scope.pipelineApi.selected.columns[colIdx].alias.match(
                        /( |_)( |_)/g
                    );

                upperAlias =
                    scope.pipelineApi.selected.columns[
                        colIdx
                    ].alias.toUpperCase();
                if (!aliasMap.hasOwnProperty(upperAlias)) {
                    aliasMap[upperAlias] = [];
                }

                aliasMap[upperAlias].push(colIdx);
            }

            for (alias in aliasMap) {
                if (aliasMap.hasOwnProperty(alias)) {
                    // duplicates
                    if (aliasMap[alias].length >= 2) {
                        for (
                            aliasIdx = 0, aliasLen = aliasMap[alias].length;
                            aliasIdx < aliasLen;
                            aliasIdx++
                        ) {
                            scope.pipelineApi.selected.columns[
                                aliasMap[alias][aliasIdx]
                            ].hasAliasError = true;
                        }
                    }
                }
            }

            // set validity
            for (
                colIdx = 0, colLen = scope.pipelineApi.selected.columns.length;
                colIdx < colLen;
                colIdx++
            ) {
                if (scope.pipelineApi.selected.columns[colIdx].hasAliasError) {
                    scope.pipelineApi.valid = false;
                    return;
                }
            }

            scope.pipelineApi.valid = true;
        }

        /**
         * @name previewApi
         * @desc import the query
         * @returns {void}
         */
        function previewApi() {
            var parameters = buildParameters(true);
            if (parameters.QUERY_STRUCT.selectors.length > 0) {
                scope.pipelineComponentCtrl.previewComponent(parameters);
            } else {
                // wipe the preview
                scope.widgetCtrl.emit('load-preview', {
                    pixelComponents: [],
                });
            }
        }

        /**
         * @name importApi
         * @param {boolean} visualize if true visualize frame
         * @desc import the query
         * @returns {void}
         */
        function importApi(visualize) {
            let parameters, callback;

            if (
                scope.pipelineApi.api.url.length === 0 ||
                !scope.pipelineApi.api.type
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Api is empty. Please enter a query.'
                );
                return;
            }

            parameters = buildParameters();

            if (visualize) {
                callback = scope.pipelineComponentCtrl.visualizeComponent;
            }

            scope.pipelineComponentCtrl.executeComponent(
                parameters,
                {},
                callback
            );
        }

        /**
         * @name buildParameters
         * @param {boolean} preview - true if coming from preview
         * @desc build the parameters for the current module
         * @returns {object} - map of the paramters to value
         */
        function buildParameters(preview) {
            var headers,
                headerIdx,
                headerLen,
                body,
                bodyIdx,
                bodyLen,
                split,
                url,
                paramArr,
                paramIdx,
                paramLen,
                param,
                paramName,
                paramVar,
                paramVal,
                explicitFilters = [],
                selectors = [],
                roots = {},
                colIdx,
                colLen;

            // technically these should be arrays as duplicates are allowed
            headers = {};
            for (
                headerIdx = 0, headerLen = scope.pipelineApi.api.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                headers[scope.pipelineApi.api.headers[headerIdx].key] =
                    scope.pipelineApi.api.headers[headerIdx].value;
            }

            body = {};
            for (
                bodyIdx = 0, bodyLen = scope.pipelineApi.api.body.length;
                bodyIdx < bodyLen;
                bodyIdx++
            ) {
                body[scope.pipelineApi.api.body[bodyIdx].key] =
                    scope.pipelineApi.api.body[bodyIdx].value;
            }

            // construct the query with the filters
            split = scope.pipelineApi.api.url.split('?');
            url = split.shift();

            if (split.length > 0) {
                paramArr = split.join('?').split('&');
            } else {
                paramArr = [];
            }

            for (
                paramIdx = 0, paramLen = paramArr.length;
                paramIdx < paramLen;
                paramIdx++
            ) {
                param = paramArr[paramIdx].split('=');
                paramName = param.shift();
                paramVar = paramName + String(paramIdx);
                paramVal = param.join('='); // this is intentionally not decoded (BE can't handle it)

                // add the url
                url +=
                    (paramIdx > 0 ? '&' : '?') +
                    paramName +
                    '=' +
                    '@' +
                    paramVar +
                    '@';

                // add the filter
                explicitFilters.push({
                    type: 'SIMPLE',
                    content: {
                        left: {
                            pixelType: 'CONST_STRING',
                            value: paramVar,
                        },
                        comparator: '==',
                        right: {
                            pixelType: 'CONST_STRING',
                            value: [paramVal],
                        },
                    },
                });
            }

            for (
                colIdx = 0, colLen = scope.pipelineApi.selected.columns.length;
                colIdx < colLen;
                colIdx++
            ) {
                selectors.push({
                    type: 'COLUMN',
                    content: {
                        table: 'placeholder',
                        column: scope.pipelineApi.selected.columns[colIdx]
                            .column,
                        alias: String(
                            scope.pipelineApi.selected.columns[colIdx].alias
                        ).replace(/ /g, '_'),
                    },
                });

                roots[scope.pipelineApi.selected.columns[colIdx].column] =
                    scope.pipelineApi.selected.columns[colIdx].relativePath;
            }

            roots.root = scope.pipelineApi.root.selected;

            return {
                IMPORT_FRAME: {
                    name:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.name'
                        ) || scope.pipelineApi.customFrameName.name,
                    type:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.type'
                        ) || scope.widgetCtrl.getOptions('initialFrameType'),
                    override: true,
                },
                QUERY_STRUCT: {
                    qsType: 'API',
                    type: 'JSON2',
                    url: url,
                    method: scope.pipelineApi.api.type,
                    roots: roots,
                    headers: headers,
                    body: body,
                    selectors: selectors,
                    explicitFilters: explicitFilters,
                    limit: preview ? PREVIEW_LIMIT : -1,
                },
            };
        }

        /**
         * @name validateFrameName
         * @desc checks if the frame name entered by the user is valid
         * @returns {void}
         */
        function validateFrameName() {
            let results = scope.pipelineComponentCtrl.validateFrameName(
                scope.pipelineApi.customFrameName.name
            );
            scope.pipelineApi.customFrameName.valid = results.valid;
            scope.pipelineApi.customFrameName.message = results.message;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            setFrameData();
            setApi();
            scope.pipelineApi.customFrameName.name =
                scope.pipelineComponentCtrl.createFrameName('API');
            validateFrameName();
        }

        initialize();
    }
}
