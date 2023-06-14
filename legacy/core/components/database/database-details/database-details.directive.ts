'use strict';

import angular from 'angular';
import '../../markdown/markdown.directive.ts';

export default angular
    .module('app.database.database-details', ['app.markdown.directive'])
    .directive('databaseDetails', databaseDetailsDirective);

import './database-details.scss';

databaseDetailsDirective.$inject = [
    'semossCoreService',
    'monolithService',
    '$q',
];

function databaseDetailsDirective(semossCoreService, monolithService, $q) {
    databaseDetailsCtrl.$inject = [];
    databaseDetailsLink.$inject = ['scope'];

    return {
        require: ['^database'],
        restrict: 'E',
        template: require('./database-details.directive.html'),
        bindToController: {
            database: '=',
            info: '=',
        },
        controller: databaseDetailsCtrl,
        controllerAs: 'databaseDetails',
        link: databaseDetailsLink,
    };

    function databaseDetailsCtrl() {}

    function databaseDetailsLink(scope, ele, attrs, ctrl) {
        scope.databaseDetails.databaseCtrl = ctrl[0];

        scope.databaseDetails.name = {
            new: '',
            old: '',
        };

        scope.databaseDetails.markdown = {
            new: '',
            old: '',
        };

        scope.databaseDetails.description = {
            new: '',
            old: '',
        };

        scope.databaseDetails.fields = [];
        scope.databaseDetails.fieldOptions = {};
        scope.databaseDetails.defaultFieldOptions = {
            new: [],
            old: [],
            mapping: {},
            options: [
                'blue',
                'orange',
                'teal',
                'purple',
                'yellow',
                'pink',
                'violet',
                'olive',
            ],
        };

        scope.databaseDetails.image = {
            file: undefined,
            url: '',
        };

        /** Catalog Fields to Display/Edit */
        const keys = scope.databaseCtrl.CONFIG.databaseMetaKeys
            ? scope.databaseCtrl.CONFIG.databaseMetaKeys.sort(
                  (a, b) => a.display_order - b.display_order
              )
            : [];

        keys.forEach(function (item) {
            const metaKey = item.metakey;
            if (metaKey !== 'description') {
                scope.databaseDetails.fields.push(metaKey);
                scope.databaseDetails.fieldOptions[metaKey] = {
                    ...item,
                    ...scope.databaseDetails.defaultFieldOptions,
                };
                if (scope.databaseDetails.info.hasOwnProperty(metaKey)) {
                    if (
                        scope.databaseDetails.fieldOptions[metaKey]
                            .display_options !== 'textarea' &&
                        scope.databaseDetails.fieldOptions[metaKey]
                            .display_options !== 'markdown' &&
                        scope.databaseDetails.fieldOptions[metaKey]
                            .display_options !== 'input' &&
                        scope.databaseDetails.fieldOptions[metaKey]
                            .display_options !== 'single-typeahead'
                    ) {
                        scope.databaseDetails.fieldOptions[metaKey].new =
                            semossCoreService.utility.freeze(
                                scope.databaseDetails.info[metaKey]
                                    ? !Array.isArray(
                                          scope.databaseDetails.info[metaKey]
                                      )
                                        ? [scope.databaseDetails.info[metaKey]]
                                        : scope.databaseDetails.info[metaKey]
                                    : []
                            );

                        for (
                            let i = 0;
                            i <
                            scope.databaseDetails.fieldOptions[metaKey].new
                                .length;
                            i++
                        ) {
                            setFieldOptionColor(
                                scope.databaseDetails.fieldOptions[metaKey].new[
                                    i
                                ],
                                metaKey
                            );
                        }
                    } else {
                        const val = scope.databaseDetails.info[metaKey];
                        console.log(
                            metaKey,
                            scope.databaseDetails.info[metaKey]
                        );
                        // if(metaKey ==='markdown' && scope.databaseDetails.info[metaKey] && scope.databaseDetails.info[metaKey] === 'undefined'){
                        //     val = '';
                        // }
                        scope.databaseDetails.fieldOptions[metaKey].new = val;
                    }
                }
            }
        });

        /**
         * @name setFieldOptionColor
         * @desc sets the field color pseudo-randomly
         * @param option - field value
         * @param field - metakey field
         */
        function setFieldOptionColor(opt: string, field: string): void {
            if (
                !scope.databaseDetails.fieldOptions[
                    field
                ].mapping.hasOwnProperty(opt)
            ) {
                const charCode = opt
                    .split('')
                    .map((x) => x.charCodeAt(0))
                    .reduce((a, b) => a + b);
                const color =
                    scope.databaseDetails.fieldOptions[field].options[
                        charCode % 8
                    ];
                scope.databaseDetails.fieldOptions[field].mapping[opt] = color;
            }
        }

        /** Details */
        /**
         * @name getDetails
         * @desc get a copy of the metamodel
         */
        function getDetails(): void {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                let output, type;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    //scope.databaseDetails.appInfo = output;

                    scope.databaseDetails.fields.forEach(function (item) {
                        scope.databaseDetails.fieldOptions[item].old =
                            semossCoreService.utility.freeze(
                                output[item]
                                    ? !Array.isArray(output[item])
                                        ? [output[item]]
                                        : output[item]
                                    : []
                            );
                        scope.databaseDetails.fieldOptions[item].new =
                            semossCoreService.utility.freeze(
                                output[item]
                                    ? !Array.isArray(output[item])
                                        ? [output[item]]
                                        : output[item]
                                    : []
                            );
                        if (scope.databaseDetails.fieldOptions[item].old) {
                            for (
                                let i = 0;
                                i <
                                scope.databaseDetails.fieldOptions[item].old
                                    .length;
                                i++
                            ) {
                                setFieldOptionColor(
                                    scope.databaseDetails.fieldOptions[item]
                                        .old[i],
                                    item
                                );
                            }
                        }
                    });
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseMetadata',
                        components: [
                            scope.databaseMeta.appId,
                            scope.databaseDetails.fields,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Markdown */

        /**
         * @name getMarkdown
         * @desc get a copy of the metamodel
         */
        function getMarkdown(): void {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                let output, type;

                output =
                    response.pixelReturn[0].output &&
                    response.pixelReturn[0].output.markdown &&
                    response.pixelReturn[0].output.markdown !== 'undefined'
                        ? response.pixelReturn[0].output.markdown
                        : '';
                type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    scope.databaseDetails.markdown.old =
                        semossCoreService.utility.freeze(
                            unindent(output) || ''
                        );
                    scope.databaseDetails.markdown.new =
                        semossCoreService.utility.freeze(
                            unindent(output) || ''
                        );
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseMetadata',
                        components: [scope.databaseMeta.appId, 'markdown'],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name unindent
         * @desc parse returned markdown
         */
        function unindent(text) {
            if (!text) {
                return text;
            }

            const lines = text.replace(/\t/g, '  ').split(/\r?\\n/);

            let min = null;
            const len = lines.length;
            let i;

            for (i = 0; i < len; i++) {
                const line = lines[i];
                const l = line.match(/^(\s*)/)[0].length;
                if (l === line.length) {
                    continue;
                }
                min = l < min || min === null ? l : min;
            }

            if (min !== null && min > 0) {
                for (i = 0; i < len; i++) {
                    lines[i] = lines[i].substr(min);
                }
            }
            return lines.join('\n');
        }

        /** General */
        /**
         * @name reset
         * @desc reset everything
         */
        function reset(): void {
            // name
            scope.databaseDetails.name.new =
                scope.databaseDetails.info.database_name;
            scope.databaseDetails.name.old =
                scope.databaseDetails.info.database_name;

            // description
            scope.databaseDetails.description.new =
                scope.databaseDetails.info.description;
            scope.databaseDetails.description.old =
                scope.databaseDetails.info.description;

            // markdown
            scope.databaseDetails.markdown.new =
                semossCoreService.utility.freeze(
                    scope.databaseDetails.markdown.old
                );

            // app-defined database metakeys
            scope.databaseDetails.fields.forEach(function (item) {
                scope.databaseDetails.fieldOptions[item].new =
                    semossCoreService.utility.freeze(
                        scope.databaseDetails.info[item]
                            ? !Array.isArray(scope.databaseDetails.info[item])
                                ? [scope.databaseDetails.info[item]]
                                : scope.databaseDetails.info[item]
                            : []
                    );
                scope.databaseDetails.fieldOptions[item].old =
                    semossCoreService.utility.freeze(
                        scope.databaseDetails.info[item]
                            ? !Array.isArray(scope.databaseDetails.info[item])
                                ? [scope.databaseDetails.info[item]]
                                : scope.databaseDetails.info[item]
                            : []
                    );
            });

            scope.databaseDetails.fields.forEach(function (metaKey) {
                if (
                    scope.databaseDetails.fieldOptions[metaKey]
                        .display_options !== 'textarea' &&
                    scope.databaseDetails.fieldOptions[metaKey]
                        .display_options !== 'markdown' &&
                    scope.databaseDetails.fieldOptions[metaKey]
                        .display_options !== 'input' &&
                    scope.databaseDetails.fieldOptions[metaKey]
                        .display_options !== 'single-typeahead'
                ) {
                    scope.databaseDetails.fieldOptions[metaKey].new =
                        semossCoreService.utility.freeze(
                            scope.databaseDetails.info[metaKey]
                                ? !Array.isArray(
                                      scope.databaseDetails.info[metaKey]
                                  )
                                    ? [scope.databaseDetails.info[metaKey]]
                                    : scope.databaseDetails.info[metaKey]
                                : []
                        );

                    scope.databaseDetails.fieldOptions[metaKey].old =
                        semossCoreService.utility.freeze(
                            scope.databaseDetails.info[metaKey]
                                ? !Array.isArray(
                                      scope.databaseDetails.info[metaKey]
                                  )
                                    ? [scope.databaseDetails.info[metaKey]]
                                    : scope.databaseDetails.info[metaKey]
                                : []
                        );
                } else {
                    scope.databaseDetails.fieldOptions[metaKey].new =
                        scope.databaseDetails.info[metaKey];
                    scope.databaseDetails.fieldOptions[metaKey].old =
                        scope.databaseDetails.info[metaKey];
                }
            });

            // image
            const imageUpdates = semossCoreService.getOptions('imageUpdates');

            if (imageUpdates[scope.databaseDetails.info.database_id]) {
                scope.databaseDetails.image.url =
                    imageUpdates[scope.databaseDetails.info.database_id];
            } else {
                scope.databaseDetails.image.url =
                    semossCoreService.app.generateDatabaseImageURL(
                        scope.databaseDetails.info.database_id
                    );
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            const markdownListener = semossCoreService.on(
                'update-catalog-filters',
                ({ databaseId }) => {
                    if (databaseId === scope.databaseDetails.info.database_id) {
                        getMarkdown();
                    }
                }
            );
            getMarkdown();
            reset();
            scope.$watch(
                function () {
                    return JSON.stringify(scope.databaseDetails.info);
                },
                function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        reset();
                    }
                }
            );

            scope.databaseDetails.fields.forEach(function (item) {
                const field = `databaseDetails.info.${item}`;
                scope.$watch(field, function (newValue, oldValue) {
                    if (newValue && !angular.equals(newValue, oldValue)) {
                        const newVal = newValue
                            ? !Array.isArray(newValue)
                                ? [newValue]
                                : newValue
                            : [];
                        for (let i = 0; i < newVal.length; i++) {
                            setFieldOptionColor(newVal[i], item);
                        }
                    }
                });
            });

            scope.$on('destroy', function () {
                markdownListener();
            });
        }

        initialize();
    }
}
