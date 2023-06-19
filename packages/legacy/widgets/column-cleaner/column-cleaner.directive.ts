import angular from 'angular';
import './column-cleaner.scss';

/**
 * @name column-cleaner
 * @desc Column Cleaner widget that condenses the number of instances in your column
 *       by allowing the user to have similarly scored strings to be replaced by others.
 *       An example is if a column contains "Cat1" and "Cat", we probably want to replace
 *       the instance of Cat1 with Cat (input error) so that we have uniform/clean data.
 */
export default angular
    .module('app.column-cleaner.directive', [])
    .directive('columnCleaner', columnCleanerDirective);

columnCleanerDirective.$inject = ['semossCoreService', '$timeout'];

function columnCleanerDirective(
    semossCoreService: SemossCoreService,
    $timeout: ng.ITimeoutService
) {
    columnCleanerCtrl.$inject = [];
    columnCleanerLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'columnCleaner',
        bindToController: {},
        template: require('./column-cleaner.directive.html'),
        controller: columnCleanerCtrl,
        link: columnCleanerLink,
    };

    function columnCleanerCtrl() {}

    function columnCleanerLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.columnCleaner.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.columnCleaner.toggleSort = toggleSort;
        scope.columnCleaner.getFrameName = getFrameName;
        scope.columnCleaner.getFrameValues = getFrameValues;
        scope.columnCleaner.clearRenderedValues = clearRenderedValues;
        scope.columnCleaner.resetValues = resetValues;
        scope.columnCleaner.removeMatch = removeMatch;
        scope.columnCleaner.execute = execute;
        scope.columnCleaner.switchCols = switchCols;
        scope.columnCleaner.loadPreview = loadPreview;
        scope.columnCleaner.cancel = cancel;

        scope.columnCleaner.frameHeaders = [];
        scope.columnCleaner.frameHeaderSelection = '';
        scope.columnCleaner.searchTerm = '';
        scope.columnCleaner.sortDirection = 'asc';
        scope.columnCleaner.renderedValues = [];
        scope.columnCleaner.currentFrame = '';
        scope.columnCleaner.maxSize = 10;
        scope.columnCleaner.similarity = 95;
        scope.columnCleaner.time;
        scope.columnCleaner.createFrame = true;
        scope.columnCleaner.copiedFrame = '';

        /**
         * @name setData
         * @desc Function that is ran when the widget loads or a listener catches an event.
         *       We basically just get the current STRING FrameHeaders and push them into
         *       our frameHeaders array AS LONG as they are unique (when we run Execute,
         *       setData will trigger and we don't want to duplicate our headers).
         */
        function setData(): void {
            let headers: any = [],
                matchArray;

            if (scope.columnCleaner.PIPELINE) {
                headers =
                    scope.pipelineComponentCtrl.getComponent(
                        'parameters.SOURCE.value.headers'
                    ) || [];
                matchArray = scope.pipelineComponentCtrl.getComponent(
                    'parameters.COLUMN_CLEANER.value'
                );
                if (matchArray) {
                    if (matchArray.col) {
                        scope.columnCleaner.frameHeaderSelection =
                            matchArray.col;
                    }
                    if (matchArray.matchesObj) {
                        scope.columnCleaner.renderedValues =
                            matchArray.matchesObj;
                    }
                    if (matchArray.matchTable && matchArray.matchTable.length) {
                        scope.columnCleaner.currentFrame =
                            matchArray.matchTable;
                    }
                }
            } else {
                headers = scope.widgetCtrl.getFrame('headers') || [];
            }

            scope.columnCleaner.frameHeaders = headers
                ? headers
                      .filter((header) => header.dataType === 'STRING')
                      .map((header) => header.alias)
                : [];

            if (
                !scope.columnCleaner.frameHeaderSelection &&
                scope.columnCleaner.frameHeaders.length > 0
            ) {
                scope.columnCleaner.frameHeaderSelection =
                    scope.columnCleaner.frameHeaders[0];
                // getFrameName(true);
            }
        }

        /**
         * @name toggleSort
         * @desc External function that is triggered when a user clicks on the sort
         *       button. We toggle between sorting in ascending and descending order
         *       and then refresh the widget with the new values.
         */
        function toggleSort(): void {
            // toggle asc/desc
            if (scope.columnCleaner.sortDirection === 'desc') {
                scope.columnCleaner.sortDirection = 'asc';
            } else if (scope.columnCleaner.sortDirection === 'asc') {
                scope.columnCleaner.sortDirection = 'desc';
            }

            // update widget w/ new values
            getFrameValues();
        }

        /**
         * @name getFrameName
         * @param reset Reset values after function runs?
         * @desc Function that gets the current R frame so that we have the most
         *       up-to-date data in our widget. After we get the current frame we get
         *       the values in that frame and (optionally) flush scope values.
         */
        function getFrameName(reset: boolean, cb?: () => void): void {
            const callback = (response: PixelReturnPayload): void => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // Get frame name and its values
                scope.columnCleaner.currentFrame = output.name;

                // If we need to reset (which is only the case when a user selects
                // a different dropdown value)
                if (reset) {
                    resetValues();
                }
                if (cb) {
                    cb();
                }
            };
            scope.widgetCtrl.meta(
                [
                    {
                        type: 'variable',
                        components: [
                            scope.columnCleaner.copiedFrame.length > 0
                                ? scope.columnCleaner.copiedFrame
                                : scope.widgetCtrl.getFrame('name'),
                        ],
                        meta: true,
                    },
                    {
                        type: 'matchColumnValues',
                        components: [scope.columnCleaner.frameHeaderSelection],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name resetValues
         * @desc Internal function that resets certain scope variables
         */
        function resetValues(): void {
            scope.columnCleaner.searchTerm = '';
            scope.columnCleaner.maxSize = 10;
            scope.columnCleaner.sortDirection = 'asc';
        }

        function clearRenderedValues(): void {
            scope.columnCleaner.renderedValues = [];
        }

        /**
         * @name getFrameValues
         * @desc Function that pulls out the current values in our R frame.
         *       Meat of this directive because it is called on many user events
         *       (choosing a column, changing similarity threshold, etc.)
         */
        function getFrameValues(): void {
            // Cancel timer if we have it
            if (scope.columnCleaner.time) {
                $timeout.cancel(scope.columnCleaner.time);
            }

            // Resting so that filter isn't highly triggered
            scope.columnCleaner.time = $timeout(() => {
                scope.columnCleaner.renderedValues = [];
                if (scope.columnCleaner.createFrame) {
                    getFrameName(false, setFrameValues);
                    scope.columnCleaner.createFrame = false;
                } else {
                    setFrameValues();
                }

                $timeout.cancel(scope.columnCleaner.time);
            }, 300);
        }

        /**
         * @name setFrameValues
         * @desc sets the rendered values for the frame
         */
        function setFrameValues(): void {
            let pixelComponents: PixelCommand[] = [],
                filterObj: { distance: { comparator: string; value: number } } =
                    {
                        distance: {
                            comparator: '',
                            value: 0,
                        },
                    },
                callback;

            // Get values in our current frame and sort by distance
            pixelComponents.push(
                {
                    type: 'Pixel',
                    components: [
                        'Frame(frame=[' +
                            scope.columnCleaner.currentFrame +
                            '])',
                    ],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                selector: 'col1',
                                alias: 'col1',
                            },
                            {
                                selector: 'col2',
                                alias: 'col2',
                            },
                            {
                                selector: 'distance',
                                alias: 'distance',
                            },
                        ],
                    ],
                },
                {
                    type: 'sortOptions',
                    components: [
                        [
                            {
                                alias: 'distance',
                                dir: scope.columnCleaner.sortDirection,
                            },
                        ],
                    ],
                }
            );

            // If a user has typed something into the search bar, search by it
            if (scope.columnCleaner.searchTerm !== '') {
                pixelComponents.push({
                    type: 'Pixel',
                    components: [
                        'Filter((col1 ?like "' +
                            scope.columnCleaner.searchTerm.replace(/ /g, '_') +
                            '") OR (col2 ?like "' +
                            scope.columnCleaner.searchTerm.replace(/ /g, '_') +
                            '"))',
                    ],
                });
            }

            // Filter by similarity threshold
            filterObj.distance = {
                comparator: '<=',
                value: 1 - scope.columnCleaner.similarity / 100,
            };

            pixelComponents.push({
                type: 'filter',
                components: [filterObj],
            });

            // Collect however many values the user wants (defaults to 10)
            pixelComponents.push({
                type: 'collect',
                components: [
                    typeof scope.columnCleaner.maxSize !== 'number'
                        ? 10
                        : scope.columnCleaner.maxSize,
                ],
                terminal: true,
            });

            // Parse our frame values
            callback = (response: PixelReturnPayload): void => {
                const returnIdx = response.pixelReturn[1] ? 1 : 0;
                const output = response.pixelReturn[returnIdx].output,
                    type = response.pixelReturn[returnIdx].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // Ensure that pixel was successful
                // Loop through the returned values
                for (
                    let valueIdx = 0, valueLen = output.data.values.length;
                    valueIdx < valueLen;
                    valueIdx++
                ) {
                    // Push them all to our rendered values array. We calculate distance
                    // by taking 1 - distance (in decimal) which in this case is our
                    // "Similarity" score
                    scope.columnCleaner.renderedValues.push({
                        left: output.data.values[valueIdx][0],
                        right: output.data.values[valueIdx][1],
                        distance:
                            (
                                (1 - output.data.values[valueIdx][2]) *
                                100
                            ).toString() + '%',
                    });
                }

                if (scope.columnCleaner.renderedValues.length === 0) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'No values returned, try refinining your search criteria.'
                    );
                }
            };

            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        /**
         * @name removeMatch
         * @param match - match to remove
         * @desc Removes a certain object from our renderedValues array. Triggered
         *       whenever the user hits the X button next to a "match".
         */
        function removeMatch(match: {
            left: string;
            right: string;
            distance: string;
        }): void {
            let idx = -1;

            for (
                let valueIdx = 0,
                    valueLen = scope.columnCleaner.renderedValues.length;
                valueIdx < valueLen;
                valueIdx++
            ) {
                if (
                    scope.columnCleaner.renderedValues[valueIdx].left ===
                        match.left &&
                    scope.columnCleaner.renderedValues[valueIdx].right ===
                        match.right
                ) {
                    idx = valueIdx;
                    break;
                }
            }

            if (idx === -1) {
                return;
            }

            // remove it
            scope.columnCleaner.renderedValues.splice(idx, 1);
        }

        /**
         * @name switchCols
         * @param match - match to swap
         * @desc External function that is triggered whenever a user clicks on an
         *       arrow to swap what value is being replaced.
         */
        function switchCols(match: {
            left: string;
            right: string;
            distance: string;
        }): void {
            let idx = -1;

            for (
                let valueIdx = 0,
                    valueLen = scope.columnCleaner.renderedValues.length;
                valueIdx < valueLen;
                valueIdx++
            ) {
                if (
                    scope.columnCleaner.renderedValues[valueIdx].left ===
                        match.left &&
                    scope.columnCleaner.renderedValues[valueIdx].right ===
                        match.right
                ) {
                    idx = valueIdx;
                    break;
                }
            }

            if (idx === -1) {
                return;
            }

            // swap the values
            scope.columnCleaner.renderedValues[idx] = {
                left: match.right,
                right: match.left,
                distance: match.distance,
            };
        }

        /**
         * @name buildParams
         * @param matches what to match
         * @desc builds pipeline parameters
         */
        function buildParams(matches: any[]): {
            SOURCE: { name: string };
            COLUMN_CLEANER: {
                col: string;
                matches: string;
                matchTable: string;
                matchesObj: any[];
                similarity: number;
            };
        } {
            const params = {
                SOURCE: scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                ),
                COLUMN_CLEANER: {
                    matches: '',
                    col: '',
                    matchTable: '',
                    matchesObj: scope.columnCleaner.renderedValues,
                    similarity: scope.columnCleaner.similarity,
                },
            };

            if (scope.columnCleaner.frameHeaderSelection) {
                params.COLUMN_CLEANER = {
                    col: scope.columnCleaner.frameHeaderSelection,
                    matches: '',
                    matchTable: scope.columnCleaner.currentFrame,
                    matchesObj: scope.columnCleaner.renderedValues,
                    similarity: scope.columnCleaner.similarity,
                };

                params.COLUMN_CLEANER.matches = matches
                    .map((match) => `"${match.left} == ${match.right}"`)
                    .join(', ');
            }

            return params;
        }

        /**
         * @name getMatchArray
         * @desc get the array of matches
         * @returns {array} of matches
         */
        function getMatchArray(): {
            right: string | number;
            left: string | number;
        }[] {
            const matchArray: {
                    right: string | number;
                    left: string | number;
                }[] = [],
                curValArray: any[] = [];

            // We reverse it because in the actual pixel the value to the right
            // actually takes the place of the value on the left...
            for (
                let i = 0, iLen = scope.columnCleaner.renderedValues.length;
                i < iLen;
                i++
            ) {
                // Need to check for duplicate "Curent Value" values, messes
                // up the R routine that we run
                for (let j = 0, jLen = curValArray.length; j < jLen; j++) {
                    if (
                        scope.columnCleaner.renderedValues[i].right ===
                        curValArray[j]
                    ) {
                        // If we find it throw a warning and gtfo of this function
                        scope.widgetCtrl.alert(
                            'warn',
                            'Cannot have duplicate values in your "Current Value" column. ' +
                                curValArray[j] +
                                ' is a duplicate value, delete all but one instance of this occurence using the red X buttons.'
                        );
                        return [];
                    }
                }

                curValArray.push(scope.columnCleaner.renderedValues[i].right);
                matchArray.push({
                    right: scope.columnCleaner.renderedValues[i].left,
                    left: scope.columnCleaner.renderedValues[i].right,
                });
            }

            return matchArray;
        }

        /**
         * @name execute
         * @desc External execute function that is triggered whenever the
         *       user hits the Execute button in the column-cleaner widget
         */
        function execute(): void {
            let matchArray: {
                right: string | number;
                left: string | number;
            }[] = [];
            matchArray = getMatchArray();

            if (matchArray.length === 0) {
                // no matches selected, so don't even run...
                return;
            }

            if (scope.columnCleaner.PIPELINE) {
                const params = buildParams(matchArray);
                scope.pipelineComponentCtrl.executeComponent(params, {});
            } else {
                const callback = (response: PixelReturnPayload): void => {
                    const type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully replaced values'
                    );
                    getFrameName(false);
                };

                // Execute
                scope.widgetCtrl.execute(
                    [
                        {
                            type: 'variable',
                            components: [scope.widgetCtrl.getFrame('name')],
                        },
                        {
                            type: 'updateMatchColumnValues',
                            components: [
                                scope.columnCleaner.frameHeaderSelection,
                                matchArray,
                                scope.columnCleaner.currentFrame,
                            ],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }
        }

        /**
         * @name cancel
         * @desc closes pipeline component
         */
        function cancel(): void {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name loadPreview
         * @desc loads preview
         */
        function loadPreview(): void {
            let pixel,
                matchArray = getMatchArray();

            if (matchArray.length === 0) {
                // no match array, so don't run
                return;
            }

            pixel = buildParams(matchArray);
            scope.pipelineComponentCtrl.previewComponent(pixel);
        }

        /**
         * @name checkFrame
         * @desc For pipeline, checks if the frame type is correct. If not, will create a copy of the frame in the correct type.
         */
        function checkFrame(): void {
            const frame = scope.widgetCtrl.getFrame(),
                required =
                    scope.pipelineComponentCtrl.getComponent('required.Frame');
            if (required.indexOf(frame.type) === -1) {
                scope.widgetCtrl.meta(
                    [
                        {
                            type: 'variable',
                            components: [frame.name],
                            meta: true,
                        },
                        {
                            type: 'queryAll',
                            components: [],
                        },
                        {
                            type: 'import',
                            components: [
                                `CreateFrame(frameType=[R],override=[false]).as(["${
                                    frame.name + '_copy'
                                }"])`,
                            ],
                            terminal: true,
                        },
                    ],
                    function (response) {
                        const type = response.pixelReturn[0].operationType,
                            output = response.pixelReturn[0].output;

                        if (type.indexOf('ERROR') > -1) {
                            return;
                        }
                        scope.columnCleaner.copiedFrame = output.name;
                    }
                );
            }
        }

        /**
         * @name initialize
         * @desc initializes the directive
         */
        function initialize(): void {
            let updateFrameListener = scope.widgetCtrl.on(
                    'update-frame',
                    setData
                ),
                srcComponent;

            if (scope.columnCleaner.PIPELINE) {
                srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (!srcComponent) {
                    scope.pipelineComponentCtrl.closeComponent();
                    return;
                }

                loadPreview();
                checkFrame();
            }

            setData();

            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying columnCleaner....');
                updateFrameListener();
            });
        }

        initialize();
    }
}
