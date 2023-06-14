import angular from 'angular';

import './lookup-merge.scss';

export default angular
    .module('app.lookup-merge.directive', [])
    .directive('lookupMerge', lookupMerge);

lookupMerge.$inject = [];

function lookupMerge() {
    lookupMergeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    lookupMergeCtrl.$inject = [];

    return {
        restrict: 'E',
        template: require('./lookup-merge.directive.html'),
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        bindToController: {},
        controllerAs: 'lookupMerge',
        controller: lookupMergeCtrl,
        link: lookupMergeLink,
    };

    function lookupMergeCtrl() {}

    function lookupMergeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.lookupMerge.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.lookupMerge.catalog = {};

        scope.lookupMerge.headers = {
            options: [],
            selected: '',
        };

        scope.lookupMerge.instances = {
            loading: false,
            matchLoading: false,
            taskId: false,
            all: true, // collect all matches?
            count: 5, // how many to return
            selected: -1, // idx of the instance
            options: [], // all values on the dom for the alias
        };

        scope.lookupMerge.selectCatalog = selectCatalog;
        scope.lookupMerge.getInstances = getInstances;
        scope.lookupMerge.selectInstance = selectInstance;
        scope.lookupMerge.getMatches = getMatches;
        scope.lookupMerge.toggleMatch = toggleMatch;
        scope.lookupMerge.previousMatch = previousMatch;
        scope.lookupMerge.nextMatch = nextMatch;
        scope.lookupMerge.executeMatch = executeMatch;
        scope.lookupMerge.previewMatch = previewMatch;
        scope.lookupMerge.cancelMatch = cancelMatch;

        /**
         * @name getFrameName
         * @param accessor - how do we want to access the frame?
         * @returns frame options
         */
        function getFrame(accessor?: string): any {
            if (scope.lookupMerge.PIPELINE) {
                return scope.pipelineComponentCtrl.getComponent(
                    accessor
                        ? 'parameters.FRAME.value.' + accessor
                        : 'parameters.FRAME.value'
                );
            }

            return scope.widgetCtrl.getFrame(accessor);
        }

        /**
         * @name resetPanel
         * @desc updates the initial panel options
         */
        function resetPanel(): void {
            // set the catalog step
            scope.lookupMerge.step = 'catalog';

            // get the initial data
            getHeaders();
        }

        /** Catalog */
        /**
         * @name selectCatalog
         * @desc select a catalog
         * @param file - file to open
         */
        function selectCatalog(file: {
            name: string;
            path: string;
            space: string;
        }): void {
            scope.lookupMerge.catalog = {
                name: file.name,
                path: file.path,
                space: file.space,
            };
        }

        /** Headers */
        /**
         * @name getHeaders
         * @desc get a list of the headers that we will match from
         */
        function getHeaders(): void {
            let keepSelected = false;

            // get the headers
            scope.lookupMerge.headers.options = getFrame('headers');

            if (scope.lookupMerge.headers.selected) {
                for (
                    let headerIdx = 0,
                        headerLen = scope.lookupMerge.headers.options.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    if (
                        scope.lookupMerge.headers.options[headerIdx].alias ===
                        scope.lookupMerge.headers.selected
                    ) {
                        keepSelected = true;
                        return;
                    }
                }
            }

            if (!keepSelected && scope.lookupMerge.headers.options.length > 0) {
                scope.lookupMerge.headers.selected =
                    scope.lookupMerge.headers.options[0].alias;
            }
        }

        /** Instance */
        /**
         * @name getInstances
         * @desc get a list of the instances that we will match from
         */
        function getInstances(): void {
            let callback;

            // no header selected
            if (!scope.lookupMerge.headers.selected) {
                return;
            }

            scope.lookupMerge.instances.loading = true;

            // register callback
            callback = function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                scope.lookupMerge.instances.loading = false;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                //  need to clear out because we are loading infinite
                scope.lookupMerge.instances.options = [];

                // add new ones
                for (
                    let valueIdx = 0, valueLen = output.data.values.length;
                    valueIdx < valueLen;
                    valueIdx++
                ) {
                    scope.lookupMerge.instances.options.push({
                        id: scope.lookupMerge.instances.options.length,
                        display: String(
                            output.data.values[valueIdx][0]
                        ).replace(/_/g, ' '),
                        value: output.data.values[valueIdx][0],
                        title: 'Click to calculate matches',
                        state: 'unknown',
                        matches: [],
                    });
                }

                // update filter control variables
                scope.lookupMerge.instances.taskId = output.taskId;

                // set selected
                if (scope.lookupMerge.instances.options.length > 0) {
                    scope.lookupMerge.instances.selected = 0;
                }

                // get matches
                getMatches(scope.lookupMerge.instances.all, true);

                // switch step
                scope.lookupMerge.step = 'instance';
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'frame',
                        components: [getFrame('name')],
                        meta: true,
                    },
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    alias: scope.lookupMerge.headers.selected,
                                },
                            ],
                        ],
                    },
                    {
                        type: 'collect',
                        components: [-1],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name selectInstance
         * @desc select an instance and get matches
         * @param index - index of the instance to select
         * @returns {void}
         */
        function selectInstance(index: number): void {
            if (!scope.lookupMerge.instances.options[index]) {
                return;
            }

            scope.lookupMerge.instances.selected = index;

            // get the associated of the values
            getMatches(false, false);
        }

        /** Matches */

        /**
         * @name getMatches
         * @desc select an instance and get matches for it
         * @param all - get all of the results?
         * @param reset - reset the matches
         * @returns {void}
         */
        function getMatches(all: boolean, reset: boolean) {
            let callback,
                instances: string[] = [];

            // no catalog
            if (!scope.lookupMerge.catalog || !scope.lookupMerge.catalog.path) {
                return;
            }

            // no instance selected
            if (
                !all &&
                !scope.lookupMerge.instances.options[
                    scope.lookupMerge.instances.selected
                ]
            ) {
                return;
            }

            if (all) {
                instances = [];
                for (
                    let instanceIdx = 0,
                        instanceLen =
                            scope.lookupMerge.instances.options.length;
                    instanceIdx < instanceLen;
                    instanceIdx++
                ) {
                    if (
                        reset ||
                        scope.lookupMerge.instances.options[instanceIdx]
                            .state === 'unknown'
                    ) {
                        instances.push(
                            scope.lookupMerge.instances.options[instanceIdx]
                                .value
                        );
                    }
                }
            } else {
                if (
                    reset ||
                    scope.lookupMerge.instances.options[
                        scope.lookupMerge.instances.selected
                    ].state === 'unknown'
                ) {
                    instances = [
                        scope.lookupMerge.instances.options[
                            scope.lookupMerge.instances.selected
                        ].value,
                    ];
                }
            }

            // only get if we need it
            if (instances.length === 0) {
                return;
            }

            scope.lookupMerge.instances.matchLoading = true;
            // clear out existing options
            callback = function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                scope.lookupMerge.instances.matchLoading = false;

                if (type.indexOf('ERROR') > -1) {
                    if (all) {
                        for (
                            let instanceIdx = 0,
                                instanceLen =
                                    scope.lookupMerge.instances.options.length;
                            instanceIdx < instanceLen;
                            instanceIdx++
                        ) {
                            scope.lookupMerge.instances.options[
                                instanceIdx
                            ].matches = [];
                            scope.lookupMerge.instances.options[
                                instanceIdx
                            ].title = `${scope.lookupMerge.instances.options[instanceIdx].display} has matches`;
                            scope.lookupMerge.instances.options[
                                instanceIdx
                            ].state = 'none';
                        }
                    } else {
                        scope.lookupMerge.instances.options[
                            scope.lookupMerge.instances.selected
                        ].matches = [];
                        scope.lookupMerge.instances.options[
                            scope.lookupMerge.instances.selected
                        ].title = `${
                            scope.lookupMerge.instances.options[
                                scope.lookupMerge.instances.selected
                            ].display
                        } has matches`;
                        scope.lookupMerge.instances.options[
                            scope.lookupMerge.instances.selected
                        ].state = 'none';
                    }
                    return;
                }

                // look through all of the instances and update it if it exists in output
                for (
                    let instanceIdx = 0,
                        instanceLen =
                            scope.lookupMerge.instances.options.length;
                    instanceIdx < instanceLen;
                    instanceIdx++
                ) {
                    // exists in the output, we can update it
                    if (
                        output.hasOwnProperty(
                            scope.lookupMerge.instances.options[instanceIdx]
                                .value
                        )
                    ) {
                        // clear out the old ones
                        scope.lookupMerge.instances.options[
                            instanceIdx
                        ].matches.length = 0;

                        const matchLen =
                            output[
                                scope.lookupMerge.instances.options[instanceIdx]
                                    .value
                            ].length;
                        for (
                            let matchIdx = 0;
                            matchIdx < matchLen;
                            matchIdx++
                        ) {
                            const match =
                                output[
                                    scope.lookupMerge.instances.options[
                                        instanceIdx
                                    ].value
                                ][matchIdx];

                            match.id =
                                scope.lookupMerge.instances.options[
                                    instanceIdx
                                ].matches.length;
                            match.accepted = true;
                            match.similarity =
                                Math.round(match.similarity * 100) + '%';
                            match.displayRequest = String(
                                match.request
                            ).replace(/_/g, ' ');
                            match.displayMatch = String(match.match).replace(
                                /_/g,
                                ' '
                            );

                            scope.lookupMerge.instances.options[
                                instanceIdx
                            ].matches.push(match);
                        }

                        if (matchLen === 0) {
                            scope.lookupMerge.instances.options[
                                instanceIdx
                            ].title = `${scope.lookupMerge.instances.options[instanceIdx].display} has no matches`;
                            scope.lookupMerge.instances.options[
                                instanceIdx
                            ].state = 'none';
                        } else {
                            scope.lookupMerge.instances.options[
                                instanceIdx
                            ].title = `${scope.lookupMerge.instances.options[instanceIdx].display} has matches`;
                            scope.lookupMerge.instances.options[
                                instanceIdx
                            ].state = 'matched';
                        }
                    }
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [
                            `LookupMatch(fileName=["${
                                scope.lookupMerge.catalog.path
                            }"], space=["${
                                scope.lookupMerge.catalog.space
                            }"], instance=${JSON.stringify(
                                instances
                            )}, count=[${
                                scope.lookupMerge.instances.count || 5
                            }]);`,
                        ],
                        meta: true,
                        terminal: true,
                    },
                ],
                callback,
                []
            );
        }

        /**
         * @name toggleMatch
         * @desc toggle the match to be true or false
         * @returns {void}
         */
        function toggleMatch(id) {
            scope.lookupMerge.instances.options[
                scope.lookupMerge.instances.selected
            ].matches[id].accepted =
                !scope.lookupMerge.instances.options[
                    scope.lookupMerge.instances.selected
                ].matches[id].accepted;
        }

        /**
         * @name previousMatch
         * @desc step back a match
         * @returns {void}
         */
        function previousMatch() {
            // select a new one
            const nextIdx = scope.lookupMerge.instances.selected - 1;
            if (0 <= nextIdx) {
                selectInstance(nextIdx);
            }
        }

        /**
         * @name nextMatch
         * @desc save the match (to join later) and go to the next one
         * @returns {void}
         */
        function nextMatch() {
            // select a new one
            const nextIdx = scope.lookupMerge.instances.selected + 1;
            if (nextIdx < scope.lookupMerge.instances.options.length) {
                selectInstance(nextIdx);
            }
        }

        /** Utility */
        /**
         * @name buildParameters
         * @desc builds params for pipeline
         * @returns the params and their values
         */
        function buildParameters(): {
            FRAME: { name: string };
            COLUMN?: string;
            MATCHES?: string;
        } {
            const matches: {
                instance?: string[]; // instach to the matches
            } = {};

            for (
                let optionIdx = 0,
                    optionLen = scope.lookupMerge.instances.options.length;
                optionIdx < optionLen;
                optionIdx++
            ) {
                const group: string[] = [];

                for (
                    let matchIdx = 0,
                        matchLen =
                            scope.lookupMerge.instances.options[optionIdx]
                                .matches.length;
                    matchIdx < matchLen;
                    matchIdx++
                ) {
                    if (
                        scope.lookupMerge.instances.options[optionIdx].matches[
                            matchIdx
                        ].accepted
                    ) {
                        group.push(
                            scope.lookupMerge.instances.options[optionIdx]
                                .matches[matchIdx].match
                        );
                    }
                }

                if (group.length > 0) {
                    // instance to
                    matches[
                        scope.lookupMerge.instances.options[optionIdx].value
                    ] = group;
                }
            }

            // no column, no matches
            if (
                !scope.lookupMerge.headers.selected ||
                Object.keys(matches).length === 0
            ) {
                return {
                    FRAME: {
                        name: scope.pipelineComponentCtrl.getComponent(
                            'parameters.FRAME.value.name'
                        ),
                    },
                };
            }

            return {
                FRAME: {
                    name: scope.pipelineComponentCtrl.getComponent(
                        'parameters.FRAME.value.name'
                    ),
                },
                COLUMN: scope.lookupMerge.headers.selected,
                MATCHES: JSON.stringify(matches),
            };
        }

        /**
         * @name executeMatch
         * @desc runs the query using all the defined values
         */
        function executeMatch(): void {
            const parameters = buildParameters();

            if (scope.lookupMerge.PIPELINE) {
                scope.pipelineComponentCtrl.executeComponent(parameters, {
                    name: `Merged with Lookup`,
                });
                return;
            }

            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        `${parameters.FRAME.name} | LookupMerge(column=["${parameters.COLUMN}"], matches=[${parameters.MATCHES}]);`,
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name previewMatch
         * @desc loads preview
         */
        function previewMatch(): void {
            const parameters = buildParameters();

            scope.pipelineComponentCtrl.previewComponent(parameters);
        }

        /**
         * @name cancelMatch
         * @desc closes pipeline component
         */
        function cancelMatch(): void {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let updateFrameListener;

            // register listeners
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                function () {
                    resetPanel();
                }
            );

            scope.$on('$destroy', function () {
                updateFrameListener();
            });

            if (scope.lookupMerge.PIPELINE) {
                const frameComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.FRAME.value'
                );
                if (!frameComponent) {
                    scope.pipelineComponentCtrl.closeComponent();
                    return;
                }

                previewMatch();
            }

            resetPanel();
        }

        initialize();
    }
}
