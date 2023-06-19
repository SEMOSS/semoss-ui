'use strict';

export default angular
    .module('app.mdm-connect.directive', [])
    .directive('mdmConnect', mdmConnectDirective);

import { CONNECTORS } from '@/core/constants';

import './mdm-connect.scss';

mdmConnectDirective.$inject = ['ENDPOINT', '$filter', 'semossCoreService'];

function mdmConnectDirective(ENDPOINT, $filter, semossCoreService) {
    mdmConnectController.$inject = [];
    mdmConnectLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^mdm'],
        controller: mdmConnectController,
        bindToController: {},
        controllerAs: 'mdmConnect',
        link: mdmConnectLink,
        template: require('./mdm-connect.directive.html'),
    };

    function mdmConnectController() {}

    function mdmConnectLink(scope, ele, attrs, ctrl) {
        scope.mdmCtrl = ctrl[0];

        scope.mdmConnect.accordionSettings = {
            first: {
                name: 'Select a Starting Point',
                size: 40,
            },
            second: {
                name: '',
                size: 60,
            },
        };

        scope.mdmConnect.external = {
            raw: [],
            searchTerm: '',
            searched: [],
            selected: '',
        };

        scope.mdmConnect.form = {
            dbDriver: '',
            app: '',
            hostname: '',
            port: '',
            schema: '',
            username: '',
            password: '',
            additional: '',
        };

        scope.mdmConnect.searchExisting = searchExisting;
        scope.mdmConnect.selectExisting = selectExisting;
        scope.mdmConnect.searchExternal = searchExternal;
        scope.mdmConnect.selectExternal = selectExternal;
        scope.mdmConnect.validate = validate;

        /** Steps */
        /**
         * @name searchExternal
         * @desc updates the external list
         * @returns {void}
         */
        function searchExternal() {
            var cleanedSearch = String(
                scope.mdmConnect.external.searchTerm
            ).replace(/ /g, '_');
            scope.mdmConnect.external.searched = $filter('filter')(
                semossCoreService.utility.freeze(scope.mdmConnect.external.raw),
                {
                    value: cleanedSearch,
                }
            );
        }

        /**
         * @name selectExternal
         * @desc select options for the second step
         * @param {*} opt - selected option
         * @returns {void}
         */
        function selectExternal(opt) {
            scope.mdmConnect.accordionSettings.second.name = opt.name;
            scope.mdmConnect.external.selected = opt.value;

            if (scope.mdmConnect.external.selected === 'EXISTING') {
                setExisting();
            } else {
                setForm();
            }
        }

        /** Existing */
        /**
         * @name getApps
         * @desc updates the second step
         * @returns {void}
         */
        function setExisting() {
            var message = semossCoreService.utility.random('meta-pixel');

            scope.mdmConnect.existing = {
                raw: [],
                searchTerm: '',
                searched: [],
                selected: '',
            };

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len;

                for (i = 0, len = output.length; i < len; i++) {
                    if (
                        CONNECTORS[output[i].app_type] &&
                        CONNECTORS[output[i].app_type].type === 'RDBMS'
                    ) {
                        scope.mdmConnect.existing.raw.push({
                            name: String(output[i].app_name).replace(/_/g, ' '),
                            value: output[i].app_id,
                            image: semossCoreService.app.generateDatabaseImageURL(
                                output[i].app_id
                            ),
                        });
                    }
                }

                searchExisting();

                if (scope.mdmConnect.existing.searched.length > 0) {
                    selectExisting(scope.mdmConnect.existing.searched[0]);
                }

                validate();
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseList',
                        components: [],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name searchExisting
         * @desc updates the app list
         * @returns {void}
         */
        function searchExisting() {
            var cleanedSearch = String(
                scope.mdmConnect.existing.searchTerm
            ).replace(/_/g, ' ');
            scope.mdmConnect.existing.searched = $filter('filter')(
                semossCoreService.utility.freeze(scope.mdmConnect.existing.raw),
                {
                    name: cleanedSearch,
                }
            );
        }

        /**
         * @name selectExisting
         * @desc select options for the second step
         * @param {*} opt - selected option
         * @returns {void}
         */
        function selectExisting(opt) {
            scope.mdmConnect.existing.selected = opt.value;
        }

        /** Form */
        /**
         * @name setForm
         * @desc set the form data based on the selected options
         * @returns {void}
         */
        function setForm() {
            scope.mdmConnect.form = {
                dbDriver: '',
                app: '',
                hostname: '',
                port: '',
                schema: '',
                username: '',
                password: '',
                additional: '',
            };

            validate();
        }

        /**
         * @name validate
         * @desc validate the form based on the selected options
         * @returns {void}
         */
        function validate() {
            if (!scope.mdmConnect.external.selected) {
                scope.mdmCtrl.valid = false;
                return;
            }

            if (scope.mdmConnect.external.selected === 'EXISTING') {
                if (!scope.mdmConnect.existing.selected) {
                    scope.mdmCtrl.valid = false;
                    return;
                }
            } else {
                if (!scope.mdmConnect.form.app) {
                    scope.mdmCtrl.valid = false;
                    return;
                }

                if (!scope.mdmConnect.form.hostname) {
                    scope.mdmCtrl.valid = false;
                    return;
                }

                if (!scope.mdmConnect.form.schema) {
                    scope.mdmCtrl.valid = false;
                    return;
                }

                if (!scope.mdmConnect.form.username) {
                    scope.mdmCtrl.valid = false;
                    return;
                }
            }

            scope.mdmCtrl.valid = true;
        }

        /**
         * @name next
         * @desc validate the form based on the selected options
         * @returns {void}
         */
        function next() {
            if (!scope.mdmCtrl.valid) {
                return;
            }

            if (scope.mdmConnect.external.selected === 'EXISTING') {
                // update the status
                scope.mdmCtrl.setApp(scope.mdmConnect.existing.selected);
                scope.mdmCtrl.updateStatus('complete');
                scope.mdmCtrl.navigate('next');
            } else {
                connect();
            }
        }

        /**
         * @name connect
         * @desc validate the form based on the selected options
         * @returns {void}
         */
        function connect() {
            var message;
            if (!scope.mdmCtrl.valid) {
                return;
            }

            // generate map of connection details to pass to reactor
            scope.mdmConnect.form.dbDriver = scope.mdmConnect.external.selected;

            message = semossCoreService.utility.random('pixel');

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        meta: true,
                        type: 'externalJdbcSchema',
                        components: [
                            semossCoreService.utility.freeze(
                                scope.mdmConnect.form
                            ),
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });

            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType,
                    metamodel = {
                        relationships: [],
                        tables: {},
                    },
                    primKey,
                    i,
                    len,
                    j,
                    len2;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // we need to construt an object for the metamodel (special format)
                for (i = 0, len = output.relationships.length; i < len; i++) {
                    metamodel.relationships.push({
                        relName:
                            output.relationships[i].fromCol +
                            '.' +
                            output.relationships[i].toCol,
                        toTable: output.relationships[i].toTable,
                        fromTable: output.relationships[i].fromTable,
                    });
                }

                for (i = 0, len = output.tables.length; i < len; i++) {
                    primKey = '';

                    // assume that the first primkey is the important one. The user can change it later on
                    for (
                        j = 0, len2 = output.tables[i].isPrimKey.length;
                        j < len2;
                        j++
                    ) {
                        if (output.tables[i].isPrimKey[j]) {
                            primKey = output.tables[i].columns[j];
                            break;
                        }
                    }

                    // if there is no primKey, we assume it is the first one... SQL Tables always have a column
                    if (!primKey) {
                        primKey = output.tables[i].columns[0];
                    }

                    metamodel.tables[output.tables[i].table + '.' + primKey] =
                        output.tables[i].columns;
                }

                upload(metamodel);
            });
        }

        /**
         * @name upload
         * @desc validate the form based on the selected options
         * @param {object} metamodel - metamodel to upload
         * @returns {void}
         */
        function upload(metamodel) {
            // generate map of connection details to pass to reactor
            scope.mdmConnect.form.dbDriver = scope.mdmConnect.external.selected;

            var message = semossCoreService.utility.random('pixel');

            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // update the status
                scope.mdmCtrl.setApp(output.app_id);
                scope.mdmCtrl.updateStatus('complete');
                scope.mdmCtrl.navigate('next');
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        meta: true,
                        type: 'rdbmsExternalUpload',
                        components: [
                            semossCoreService.utility.freeze(
                                scope.mdmConnect.form
                            ),
                            scope.mdmConnect.form.app,
                            metamodel,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var c;
            // set the connector information
            scope.mdmConnect.external.raw = [
                {
                    name: 'Existing',
                    image: require('images/blue-logo.svg'),
                    value: 'EXISTING',
                },
            ];

            for (c in CONNECTORS) {
                if (CONNECTORS.hasOwnProperty(c)) {
                    if (CONNECTORS[c].type === 'RDBMS') {
                        scope.mdmConnect.external.raw.push({
                            name: CONNECTORS[c].name,
                            image: CONNECTORS[c].image,
                            value: CONNECTORS[c].driver,
                        });
                    }
                }
            }

            // set the override actions
            scope.mdmCtrl.next = next;
            scope.mdmCtrl.previous = scope.mdmCtrl.navigate.bind(
                null,
                'previous'
            );

            // update the status
            scope.mdmCtrl.updateStatus('inprogress');
            validate();

            searchExternal();

            if (scope.mdmConnect.external.searched.length > 0) {
                selectExternal(scope.mdmConnect.external.searched[0]);
            }
        }

        initialize();
    }
}
