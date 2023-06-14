'use strict';

import angular from 'angular';
import '../markdown/markdown.directive.ts';
import Utility from '../../utility/utility.js';

export default angular
    .module('app.edit-database.directive', ['app.markdown.directive'])
    .directive('editDatabase', editDatabaseDirective);

import './edit-database.scss';

editDatabaseDirective.$inject = [
    '$q',
    'monolithService',
    'semossCoreService',
    'ENDPOINT',
    'CONFIG',
];

function editDatabaseDirective(
    $q: ng.IQService,
    monolithService: MonolithService,
    semossCoreService: SemossCoreService,
    ENDPOINT: EndPoint,
    CONFIG: any
) {
    editDatabaseCtrl.$inject = [];
    editDatabaseLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./edit-database.directive.html'),
        bindToController: {
            open: '=',
            db: '=',
        },
        controller: editDatabaseCtrl,
        controllerAs: 'editDatabase',
        link: editDatabaseLink,
    };
    function editDatabaseCtrl() {}

    function editDatabaseLink(scope) {
        scope.editDatabase.CONFIG = CONFIG;

        scope.editDatabase.name = {
            new: '',
            old: '',
        };

        scope.editDatabase.markdown = {
            new: '',
            old: '',
        };

        scope.editDatabase.description = {
            new: '',
            old: '',
        };

        scope.editDatabase.fields = [];
        scope.editDatabase.fieldOptions = {};
        scope.editDatabase.defaultFieldOptions = {
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

        scope.editDatabase.filterOptions = {};
        scope.editDatabase.defaultFilterOptions = {
            searchTerm: '',
            isOpen: true,
            raw: [],
            filtered: [],
            selected: [],
        };

        scope.editDatabase.image = {
            file: undefined,
            url: '',
        };

        scope.editDatabase.save = save;
        scope.editDatabase.markdownEdit = true;
        scope.editDatabase.toggleMarkdownEdit = toggleMarkdownEdit;
        scope.editDatabase.editMode = false;

        // Generating Descriptions
        scope.editDatabase.packagesInstalled = false;
        scope.editDatabase.showDescriptionScreen = false;
        scope.editDatabase.generatedDescriptions = [];
        scope.editDatabase.selectedDesc = '';
        scope.editDatabase.numDesc = 1;
        scope.editDatabase.loadingDesc = false;
        scope.editDatabase.callbackMessage = '';

        scope.editDatabase.cancel = cancel;
        scope.editDatabase.deleteDatabaseImage = deleteDatabaseImage;

        // Generating Descriptions - Functions
        scope.editDatabase.openDescriptionScreen = openDescriptionScreen;
        scope.editDatabase.getDescriptions = getDescriptions;
        scope.editDatabase.submitDescription = submitDescription;
        scope.editDatabase.resetDescription = resetDescription;
        scope.editDatabase.descriptionChanged = descriptionChanged;

        /** Catalog Fields to Display/Edit */
        const keys = scope.editDatabase.CONFIG.databaseMetaKeys
            ? scope.editDatabase.CONFIG.databaseMetaKeys.sort(
                  (a, b) => a.display_order - b.display_order
              )
            : [];
        keys.forEach(function (item) {
            const metaKey = item.metakey;
            scope.editDatabase.fields.push(metaKey);
            scope.editDatabase.fieldOptions[metaKey] = {
                ...item,
                ...scope.editDatabase.defaultFieldOptions,
            };
        });

        /**
         * @name setFieldOptionColor
         * @desc sets the field color pseudo-randomly
         * @param option - field value
         * @param field - metakey field
         */
        function setFieldOptionColor(opt: string, field: string): void {
            if (
                !scope.editDatabase.fieldOptions[field].mapping.hasOwnProperty(
                    opt
                )
            ) {
                const charCode = opt
                    .split('')
                    .map((x) => x.charCodeAt(0))
                    .reduce((a, b) => a + b);
                const color =
                    scope.editDatabase.fieldOptions[field].options[
                        charCode % 8
                    ];
                scope.editDatabase.fieldOptions[field].mapping[opt] = color;
            }
        }

        /**
         * @name toggleEdit
         * @desc opens the remove overlay and sets the user to delete
         * @param user - the user to remove
         */
        function toggleMarkdownEdit(edit): void {
            scope.editDatabase.markdownEdit = edit;
        }

        /**
         * @name getFilterOptions
         * @desc gets the list of available filter options for application defined meta keys
         * @param clearSelected - if true, will clear selected
         */
        function getFilterOptions(): void {
            const fields = scope.editDatabase.fields.filter((f) => {
                return (
                    scope.editDatabase.fieldOptions[f].display_options !==
                        'textarea' &&
                    scope.editDatabase.fieldOptions[f].display_options !==
                        'markdown' &&
                    scope.editDatabase.fieldOptions[f].display_options !==
                        'input'
                );
            });

            const message = semossCoreService.utility.random('query-pixel');
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                const filterValues = {};

                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                for (let i = 0; i < output.length; i++) {
                    filterValues[output[i].METAKEY] =
                        filterValues[output[i].METAKEY] || [];
                    if (scope.editDatabase.fieldOptions[output[i].METAKEY]) {
                        setFieldOptionColor(
                            output[i].METAVALUE,
                            output[i].METAKEY
                        );
                        filterValues[output[i].METAKEY].push(
                            output[i].METAVALUE
                        );
                    }
                }

                for (const key in filterValues) {
                    // sort filter values
                    if (filterValues.hasOwnProperty(key)) {
                        Utility.sort(filterValues[key]);
                    }
                    // populate filter values
                    if (scope.editDatabase.filterOptions.hasOwnProperty(key)) {
                        scope.editDatabase.filterOptions[key].raw =
                            filterValues[key] || [];
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseMetaValues',
                        components: [fields],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });

            //return deferred.promise;
        }

        /**
         * @name save
         * @desc actually save everything
         * @returns {void}
         */
        function save(): void {
            const promises: ng.IPromise<any>[] = [],
                pixelComponents: PixelCommand[] = [],
                metadata = {};

            // Update all defined meta fields
            scope.editDatabase.fields.forEach(function (item) {
                if (
                    JSON.stringify(
                        scope.editDatabase.fieldOptions[item].new
                    ) !==
                    JSON.stringify(scope.editDatabase.fieldOptions[item].old)
                ) {
                    metadata[item] = scope.editDatabase.fieldOptions[item].new;
                }
            });

            // markdown
            if (
                scope.editDatabase.markdown.old !==
                scope.editDatabase.markdown.new
            ) {
                metadata['markdown'] = scope.editDatabase.markdown.new;
            }

            if (Object.keys(metadata).length > 0) {
                pixelComponents.push({
                    type: 'Pixel',
                    components: [
                        `SetDatabaseMetadata(database=["${
                            scope.editDatabase.db.database_id
                        }"], meta=[${JSON.stringify(
                            metadata
                        )}], jsonCleanup=true);`,
                    ],
                    terminal: true,
                });
            }

            // file
            const file = scope.editDatabase.image.file
                ? scope.editDatabase.image.file
                : undefined;
            if (file) {
                promises.push(
                    monolithService.uploadDatabaseImage(
                        scope.editDatabase.db.database_id,
                        file
                    )
                );
            }

            // message pixel
            if (pixelComponents.length > 0) {
                const message =
                        semossCoreService.utility.random('execute-pixel'),
                    deffered = $q.defer();

                semossCoreService.once(message, function (response) {
                    const type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        // because it is pixel, it will resolve
                        deffered.reject();
                        return;
                    }

                    deffered.resolve();
                });

                promises.push(deffered.promise);

                semossCoreService.emit('query-pixel', {
                    commandList: pixelComponents,
                    response: message,
                });
            }

            if (promises.length === 0) {
                semossCoreService.emit('alert', {
                    color: 'warn',
                    text: 'Nothing to update.',
                });
            } else {
                $q.all(promises).then(
                    function () {
                        // update with the new information
                        scope.editDatabase.db.database_name =
                            scope.editDatabase.name.new;

                        // description
                        scope.editDatabase.db.description =
                            scope.editDatabase.description.new;

                        // image
                        if (file) {
                            // tag the app as updated image so we can refresh it next time we get it
                            semossCoreService.setOptions(
                                'imageUpdates',
                                scope.editDatabase.db.database_id,
                                semossCoreService.app.generateDatabaseImageURL(
                                    scope.editDatabase.db.database_id
                                ) +
                                    '?time=' +
                                    new Date().getTime()
                            );
                            scope.editDatabase.db.image = file;

                            // TODO: Fix hack.....
                            semossCoreService.emit('update-app');
                        }

                        for (const key in metadata) {
                            if (
                                scope.editDatabase.fieldOptions.hasOwnProperty(
                                    key
                                )
                            ) {
                                let newVals, removedVals;
                                if (
                                    scope.editDatabase.fieldOptions[key]
                                        .display_options !== 'textarea' &&
                                    scope.editDatabase.fieldOptions[key]
                                        .display_options !== 'markdown' &&
                                    scope.editDatabase.fieldOptions[key]
                                        .display_options !== 'input' &&
                                    scope.editDatabase.fieldOptions[key]
                                        .display_options !== 'single-select' &&
                                    scope.editDatabase.fieldOptions[key]
                                        .display_options !== 'single-typeahead'
                                ) {
                                    newVals = scope.editDatabase.fieldOptions[
                                        key
                                    ].new.filter(
                                        (x) =>
                                            !scope.editDatabase.fieldOptions[
                                                key
                                            ].old.includes(x)
                                    );
                                    removedVals =
                                        scope.editDatabase.fieldOptions[
                                            key
                                        ].old.filter(
                                            (x) =>
                                                !scope.editDatabase.fieldOptions[
                                                    key
                                                ].new.includes(x)
                                        );
                                }

                                // Update database details on save
                                semossCoreService.emit(
                                    'update-catalog-filters',
                                    {
                                        databaseId:
                                            scope.editDatabase.db.database_id,
                                        key: key,
                                        metaData: metadata,
                                        newVals: newVals,
                                        removedVals: removedVals,
                                    }
                                );
                            }
                        }

                        scope.editDatabase.fields.forEach(function (item) {
                            scope.editDatabase.db[item] =
                                semossCoreService.utility.freeze(
                                    scope.editDatabase.fieldOptions[item].new
                                );
                            if (scope.editDatabase.fieldOptions[item].old) {
                                // if single - setup as an array
                                if (
                                    !Array.isArray(
                                        scope.editDatabase.fieldOptions[item]
                                            .old
                                    )
                                ) {
                                    scope.editDatabase.fieldOptions[item].old =
                                        [
                                            '' +
                                                scope.editDatabase.fieldOptions[
                                                    item
                                                ].old,
                                        ];
                                }
                                for (
                                    let i = 0;
                                    i <
                                    scope.editDatabase.fieldOptions[item].old
                                        .length;
                                    i++
                                ) {
                                    setFieldOptionColor(
                                        scope.editDatabase.fieldOptions[item]
                                            .old[i],
                                        item
                                    );
                                }
                            }
                        });
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error || 'Error updating database.',
                        });
                    }
                );
            }

            // close the model
            scope.editDatabase.open = false;
            scope.editDatabase.markdownEdit = true;
        }

        /**
         * @name cancel
         * @desc do not save things
         */
        function cancel(): void {
            scope.editDatabase.open = false;
            scope.editDatabase.markdownEdit = true;
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
                    scope.editDatabase.appInfo = output;

                    scope.editDatabase.fields.forEach(function (item) {
                        if (
                            scope.editDatabase.fieldOptions[item]
                                .display_options !== 'textarea' &&
                            scope.editDatabase.fieldOptions[item]
                                .display_options !== 'markdown' &&
                            scope.editDatabase.fieldOptions[item]
                                .display_options !== 'input' &&
                            scope.editDatabase.fieldOptions[item]
                                .display_options !== 'single-select' &&
                            scope.editDatabase.fieldOptions[item]
                                .display_options !== 'single-typeahead'
                        ) {
                            scope.editDatabase.fieldOptions[item].old =
                                semossCoreService.utility.freeze(
                                    output[item]
                                        ? !Array.isArray(output[item])
                                            ? [output[item]]
                                            : output[item]
                                        : []
                                );
                            scope.editDatabase.fieldOptions[item].new =
                                semossCoreService.utility.freeze(
                                    output[item]
                                        ? !Array.isArray(output[item])
                                            ? [output[item]]
                                            : output[item]
                                        : []
                                );
                            // populate 'tag' colors
                            if (
                                scope.editDatabase.fieldOptions[item].old
                                    .length > 0
                            ) {
                                for (
                                    let i = 0;
                                    i <
                                    scope.editDatabase.fieldOptions[item].old
                                        .length;
                                    i++
                                ) {
                                    setFieldOptionColor(
                                        scope.editDatabase.fieldOptions[item]
                                            .old[i],
                                        item
                                    );
                                }
                            }
                        } else if (
                            scope.editDatabase.fieldOptions[item]
                                .display_options === 'markdown'
                        ) {
                            scope.editDatabase.fieldOptions[item].new =
                                decodeURIComponent(output[item]);
                        } else {
                            scope.editDatabase.fieldOptions[item].old =
                                output[item];
                            scope.editDatabase.fieldOptions[item].new =
                                output[item];
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
                            scope.editDatabase.db.database_id,
                            scope.editDatabase.fields,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Markdown */

        /**~
         * @name getMarkdown
         * @desc get a copy of the metamodel
         */
        function getMarkdown(): void {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                let output, type;

                output =
                    response.pixelReturn[0].output.markdown &&
                    response.pixelReturn[0].output.markdown !== 'undefined'
                        ? response.pixelReturn[0].output.markdown
                        : '';
                type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    scope.editDatabase.markdown.old =
                        semossCoreService.utility.freeze(
                            unindent(output) || ''
                        );
                    scope.editDatabase.markdown.new =
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
                        components: [
                            scope.editDatabase.db.database_id,
                            'markdown',
                        ],
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

        /** Image */

        /**
         * @name deleteDatabaseImage
         * @desc delete the app image
         * @returns {void}
         */
        function deleteDatabaseImage(): void {
            monolithService
                .deleteDatabaseImage(scope.editDatabase.db.database_id)
                .then((response) => {
                    // scope.editDatabase.db.last_app_image_timestamp = response.last_app_image_timestamp;
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Database image has been deleted.',
                    });
                    scope.editDatabase.image.file = null;
                    // tag the app as updated image so we can refresh it next time we get it
                    semossCoreService.setOptions(
                        'imageUpdates',
                        scope.editDatabase.db.database_id,
                        semossCoreService.app.generateDatabaseImageURL(
                            scope.editDatabase.db.database_id
                        ) +
                            '?time=' +
                            new Date().getTime()
                    );
                    scope.editDatabase.image.url =
                        semossCoreService.getOptions('imageUpdates')[
                            scope.editDatabase.db.database_id
                        ];
                    semossCoreService.emit('update-app');
                });
        }

        /** Generate Descriptions */

        /**
         * @name openDescriptionScreen
         * @desc opens the screen that auto generates descriptions
         */
        function openDescriptionScreen(): void {
            scope.editDatabase.showDescriptionScreen = true;
        }

        /**
         * @name getDescriptions
         * @desc called to auto generate descriptions
         */
        function getDescriptions(): void {
            const message = semossCoreService.utility.random('execute-pixel');
            scope.editDatabase.loadingDesc = true;
            scope.editDatabase.callbackMessage = message;

            semossCoreService.once(message, function (response) {
                const type = response.pixelReturn[0].operationType,
                    output = response.pixelReturn[0].output;
                scope.editDatabase.loadingDesc = false;
                scope.editDatabase.callbackMessage = '';
                if (type.indexOf('ERROR') > -1) {
                    scope.editDatabase.generatedDescriptions = [];
                    return;
                }
                scope.editDatabase.generatedDescriptions = output;
                scope.editDatabase.selectedDesc = output[0];
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'generateDescription',
                        components: [
                            'app',
                            scope.editDatabase.db.database_id,
                            '',
                            scope.editDatabase.numDesc,
                        ],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name submitDescription
         * @desc sets the description using the selected generated description;
         */
        function submitDescription(): void {
            scope.editDatabase.description.new =
                scope.editDatabase.selectedDesc;
            resetDescription();
        }

        /**
         * @name resetDescription
         * @desc resets the values for generating descriptions
         * @param goBack - if true, will take user to original edit app screen
         */
        function resetDescription(goBack = true): void {
            if (goBack) {
                scope.editDatabase.showDescriptionScreen = false;
            }
            // Reset fields and results
            scope.editDatabase.loadingDesc = false;
            scope.editDatabase.generatedDescriptions = [];
            scope.editDatabase.selectedDesc = '';
            scope.editDatabase.numDesc = 1;

            // Cancel previous callback response if in the middle of another call
            if (scope.editDatabase.callbackMessage.length) {
                semossCoreService.off(scope.editDatabase.callbackMessage);
                scope.editDatabase.callbackMessage = '';
            }
        }

        /**
         * @name descriptionChanged
         * @desc Called when the textarea is focused or changed.
         * Syncs the selectedDesc so that the textarea and radio button stay in sync.
         * @param desc - the description filled in the textarea
         */
        function descriptionChanged(desc: string): void {
            scope.editDatabase.selectedDesc = desc;
        }

        /**
         * @name checkPackages
         * @desc checks to see if the required R packages for generating descriptions are installed
         */
        function checkPackages(): void {
            const installedPackages =
                semossCoreService.getWidgetState('installedPackages');
            if (installedPackages) {
                if (installedPackages.hasOwnProperty('R')) {
                    if (installedPackages.R.indexOf('gpt2') > -1) {
                        scope.editDatabase.packagesInstalled = true;
                    }
                }
            }
        }

        /** General */
        /**
         * @name reset
         * @desc reset everything
         */
        function reset(): void {
            if (!scope.editDatabase.open) {
                return;
            }

            // name
            scope.editDatabase.name.new = scope.editDatabase.db.database_name;
            scope.editDatabase.name.old = scope.editDatabase.db.database_name;

            // description
            scope.editDatabase.description.new =
                scope.editDatabase.db.description;
            scope.editDatabase.description.old =
                scope.editDatabase.db.description;

            // markdown
            scope.editDatabase.markdown.new = semossCoreService.utility.freeze(
                scope.editDatabase.markdown.old
            );

            getFilterOptions();
            getDetails();
            getMarkdown();

            // image
            const imageUpdates = semossCoreService.getOptions('imageUpdates');

            if (imageUpdates[scope.editDatabase.db.database_id]) {
                scope.editDatabase.image.url =
                    imageUpdates[scope.editDatabase.db.database_id];
            } else {
                scope.editDatabase.image.url =
                    semossCoreService.app.generateDatabaseImageURL(
                        scope.editDatabase.db.database_id
                    );
            }

            resetDescription();
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            reset();
            checkPackages();

            scope.$watch(
                function () {
                    return (
                        JSON.stringify(scope.editDatabase.db) +
                        '_' +
                        scope.editDatabase.open
                    );
                },
                function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        reset();
                        checkPackages();
                    }
                }
            );

            scope.editDatabase.fields.forEach(function (item) {
                const field = `editDatabase.db.${item}`;
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
        }

        initialize();
    }
}
