'use strict';

/**
 * @name mdm.directive.js
 * @desc master data management
 */
export default angular
    .module('app.mdm.directive', [
        'app.mdm-connect.directive',
        'app.mdm-metamodel.directive',
        'app.mdm-column.directive',
        'app.mdm-dictionary.directive',
        'app.mdm-instances.directive',
    ])
    .directive('mdm', mdmDirective);

import './mdm-connect/mdm-connect.directive';
import './mdm-metamodel/mdm-metamodel.directive';
import './mdm-column/mdm-column.directive';
import './mdm-dictionary/mdm-dictionary.directive';
import './mdm-instances/mdm-instances.directive';

import './mdm.scss';

mdmDirective.$inject = ['$timeout', 'semossCoreService'];

function mdmDirective($timeout, semossCoreService) {
    mdmCtrl.$inject = [];
    mdmLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./mdm.directive.html'),
        controller: mdmCtrl,
        link: mdmLink,
        scope: {},
        bindToController: {},
        controllerAs: 'mdm',
    };

    function mdmCtrl() {
        var mdm = this;

        mdm.step = 0; // current step that you are viewing
        mdm.sidebarOpen = true; // can you view the navigation sidebar?
        mdm.insightID = false; // insightID to run the MDM off of.
        mdm.valid = false; // can you submit and go to the next step?
        mdm.appId = ''; // what is the current app you are working with? this is set after your initially connect
        mdm.storageFrame = ''; // frame where the data is stored
        mdm.pages = [
            // list of pages that you can go to for mastering your data
            {
                title: 'Connect to a Database',
                html: '<mdm-connect></mdm-connect>',
                status: 'incomplete',
            },
            {
                title: 'Define Column Definitions',
                html: getHtml('<mdm-dictionary></mdm-dictionary>'),
                status: 'incomplete',
            },
            {
                title: 'Direct Column Name Matches',
                html: getHtml('<mdm-column type="direct"></mdm-column>'),
                status: 'incomplete',
            },
            {
                title: 'Indirect Column Name Matches',
                html: getHtml('<mdm-column type="indirect"></mdm-column>'),
                status: 'incomplete',
            },
            {
                title: 'Semantic Column Name Matches',
                html: getHtml(
                    '<mdm-column type="semantic-column"></mdm-column>'
                ),
                status: 'incomplete',
            },
            {
                title: 'Semantic Instance Matches',
                html: getHtml(
                    '<mdm-column type="semantic-instance"></mdm-column>'
                ),
                status: 'incomplete',
            },
            {
                title: 'Mastered Metamodel',
                html: getHtml('<mdm-dictionary></mdm-dictionary>'),
                status: 'incomplete',
            },
        ];

        mdm.loading = {
            show: false,
            message: [],
        };

        mdm.navigate = navigate; // step to navigate to
        mdm.previous = navigate.bind(null, 'previous'); // overide to submit
        mdm.next = navigate.bind(null, 'next'); // override to submit
        mdm.skip = skip;
        mdm.setApp = setApp;
        mdm.updateMetamodel = updateMetamodel;
        mdm.updateStatus = updateStatus;
        mdm.sync = sync;

        /**
         * @name navigate
         * @desc navigate to the correct step
         * @param {string} direction - direction to move
         * @returns {void}
         */
        function navigate(direction) {
            if (direction === 'next') {
                mdm.step++;
            } else if (direction === 'previous') {
                mdm.step--;
            }

            // bound it
            if (mdm.step < 0) {
                mdm.step = 0;
            }

            if (mdm.step > mdm.pages.length - 1) {
                mdm.step = mdm.pages.length - 1;
            }
        }

        /**
         * @name skip
         * @desc skip the current step
         * @returns {void}
         */
        function skip() {
            updateStatus('skipped');
            navigate('next');
        }

        /**
         * @name setApp
         * @desc update the app tha you are mastering
         * @param {string} appId - app to master
         * @returns {void}
         */
        function setApp(appId) {
            mdm.appId = appId;
        }

        /**
         * @name updateMetamodel
         * @desc update the metamodel you are mastering
         * @returns {void}
         */
        function updateMetamodel() {
            var message = semossCoreService.utility.random('query-pixel');

            mdm.metamodel = {};

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    outputIdx,
                    outputLen;

                for (
                    outputIdx = 0, outputLen = response.pixelReturn.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    if (
                        response.pixelReturn[outputIdx].operationType.indexOf(
                            'ERROR'
                        ) > -1 ||
                        response.pixelReturn[outputIdx].operationType.indexOf(
                            'INVALID_SYNTAX'
                        ) > -1
                    ) {
                        return;
                    }
                }

                mdm.metamodel = output;
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'Pixel',
                        components: [
                            'GetOwlMetamodel(database=["' + mdm.appId + '"]);',
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name updateStatus
         * @desc update the status of the selected step
         * @param {string} status - status to set
         * @returns {void}
         */
        function updateStatus(status) {
            mdm.pages[mdm.step].status = status;
        }

        /**
         * @name sync
         * @desc sync with the local master
         * @returns {void}
         */
        function sync() {
            var message;

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var outputIdx, outputLen;

                for (
                    outputIdx = 0, outputLen = response.pixelReturn.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    if (
                        response.pixelReturn[outputIdx].operationType.indexOf(
                            'ERROR'
                        ) > -1 ||
                        response.pixelReturn[outputIdx].operationType.indexOf(
                            'INVALID_SYNTAX'
                        ) > -1
                    ) {
                        return;
                    }
                }

                mdm.updateStatus('complete');
            });

            semossCoreService.emit('meta-pixel', {
                insightID: mdm.insightID,
                commandList: [
                    {
                        type: 'syncDatabaseWithLocalMaster',
                        components: [mdm.appId],
                        meta: true,
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Helpers */
        /**
         * @name getHtml
         * @desc get the content with appropriate content wrapped in
         * @param {string} html - html to wrap arround
         * @returns {void}
         */
        function getHtml(html) {
            return `
                <smss-accordion class="mdm__wrapper__content__accordion" 
                    rotated
                    resizable>
                    <smss-accordion-item name="mdm.pages[mdm.step].title"
                                        size="60">
                        ${html}
                    </smss-accordion-item>
                    <smss-accordion-item name="'Metamodel'"
                                        size="40">
                        <mdm-metamodel></mdm-metamodel>
                    </smss-accordion-item>
                </smss-accordion>`;
        }
        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            // TODO: needed?
            var message = semossCoreService.utility.random('initialize'),
                frameName = semossCoreService.utility.random('FRAME'),
                pixel = semossCoreService.pixel.build([
                    {
                        type: 'createSource',
                        components: ['Frame', 'R', frameName, false],
                        terminal: true,
                    },
                ]);

            semossCoreService.once(message, function (response) {
                var output;
                if (response.pixelReturn) {
                    output = response.pixelReturn[0].output;
                    if (
                        output &&
                        output.insightData &&
                        output.insightData &&
                        output.insightData.insightID
                    ) {
                        mdm.insightID = output.insightData.insightID;
                        mdm.storageFrame =
                            output.insightData.pixelReturn[0].output.name;
                    }
                }
            });

            // create a fake insight
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'openEmptyInsight',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        initialize();
    }

    function mdmLink(scope) {
        /**
         * @name updateLoading
         * @param {object} payload - {id, messageList, visible}
         * @desc called to update when the loading changes
         * @returns {void}
         */
        function updateLoading(payload) {
            // if the id is false, it is on the global level
            if (payload.id === false || payload.id === scope.mdm.insightID) {
                scope.mdm.loading.show = payload.active;
                scope.mdm.loading.message = payload.messageList;
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            // TODO: needed?
            var updateLoadingListener = semossCoreService.on(
                'update-loading',
                updateLoading
            );

            scope.$on('$destroy', function () {
                updateLoadingListener();
            });
        }

        initialize();
    }
}
