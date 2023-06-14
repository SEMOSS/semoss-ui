'use strict';

import '././choropleth-map-type.directive';

export default angular
    .module('app.choropleth-map-type.directive', [])
    .directive('choroplethMapType', choroplethMapTypeDirective);

choroplethMapTypeDirective.$inject = [];

function choroplethMapTypeDirective() {
    choroplethMapTypeCtrl.$inject = [];
    choroplethMapTypeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'choroplethMapType',
        bindToController: {},
        template: require('./choropleth-map-type.directive.html'),
        controller: choroplethMapTypeCtrl,
        link: choroplethMapTypeLink,
    };

    function choroplethMapTypeCtrl() {}

    function choroplethMapTypeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.choroplethMapType.types = {
            options: [
                {
                    display: 'World Countries',
                    value: 'countries',
                },
                {
                    display: 'U.S. States',
                    value: 'states',
                },
                {
                    display: 'U.S. Regions',
                    value: 'regions',
                },
                {
                    display: 'U.S. Counties',
                    value: 'counties',
                },
                {
                    display: 'U.S. Zipcodes',
                    value: 'zipcodes',
                },
                {
                    display: 'CBSA',
                    value: 'cbsa',
                },
                {
                    display: 'U.S. Counties By State',
                    value: 'counties/',
                    subtype: [
                        {
                            display: 'Alabama',
                            value: 'alabama',
                        },
                        {
                            display: 'Alaska',
                            value: 'alaska',
                        },
                        {
                            display: 'Arizona',
                            value: 'arizona',
                        },
                        {
                            display: 'Arkansas',
                            value: 'arkansas',
                        },
                        {
                            display: 'California',
                            value: 'california',
                        },
                        {
                            display: 'Colorado',
                            value: 'colorado',
                        },
                        {
                            display: 'Connecticut',
                            value: 'connecticut',
                        },
                        {
                            display: 'Delaware',
                            value: 'delaware',
                        },
                        {
                            display: 'District Of Columbia',
                            value: 'district-of-columbia',
                        },
                        {
                            display: 'Florida',
                            value: 'florida',
                        },
                        {
                            display: 'Georgia',
                            value: 'georgia',
                        },
                        {
                            display: 'Hawaii',
                            value: 'hawaii',
                        },
                        {
                            display: 'Idaho',
                            value: 'idaho',
                        },
                        {
                            display: 'Illinois',
                            value: 'illinois',
                        },
                        {
                            display: 'Indiana',
                            value: 'indiana',
                        },
                        {
                            display: 'Iowa',
                            value: 'iowa',
                        },
                        {
                            display: 'Kansas',
                            value: 'kansas',
                        },
                        {
                            display: 'Kentucky',
                            value: 'kentucky',
                        },
                        {
                            display: 'Louisiana',
                            value: 'louisiana',
                        },
                        {
                            display: 'Maine',
                            value: 'maine',
                        },
                        {
                            display: 'Maryland',
                            value: 'maryland',
                        },
                        {
                            display: 'Massachusetts',
                            value: 'massachusetts',
                        },
                        {
                            display: 'Michigan',
                            value: 'michigan',
                        },
                        {
                            display: 'Minnesota',
                            value: 'minnesota',
                        },
                        {
                            display: 'Mississippi',
                            value: 'mississippi',
                        },
                        {
                            display: 'Missouri',
                            value: 'missouri',
                        },
                        {
                            display: 'Montana',
                            value: 'montana',
                        },
                        {
                            display: 'Nebraska',
                            value: 'nebraska',
                        },
                        {
                            display: 'Nevada',
                            value: 'nevada',
                        },
                        {
                            display: 'New Hampshire',
                            value: 'new-hampshire',
                        },
                        {
                            display: 'New Jersey',
                            value: 'new-jersey',
                        },
                        {
                            display: 'New Mexico',
                            value: 'new-mexico',
                        },
                        {
                            display: 'New York',
                            value: 'new-york',
                        },
                        {
                            display: 'North Carolina',
                            value: 'north-carolina',
                        },
                        {
                            display: 'North Dakota',
                            value: 'north-dakota',
                        },
                        {
                            display: 'Ohio',
                            value: 'ohio',
                        },
                        {
                            display: 'Oklahoma',
                            value: 'oklahoma',
                        },
                        {
                            display: 'Oregon',
                            value: 'oregon',
                        },
                        {
                            display: 'Pennsylvania',
                            value: 'pennsylvania',
                        },
                        {
                            display: 'Puerto Rico',
                            value: 'puerto-rico',
                        },
                        {
                            display: 'Rhode Island',
                            value: 'rhode-island',
                        },
                        {
                            display: 'South Carolina',
                            value: 'south-carolina',
                        },
                        {
                            display: 'South Dakota',
                            value: 'south-dakota',
                        },
                        {
                            display: 'Tennessee',
                            value: 'tennessee',
                        },
                        {
                            display: 'Texas',
                            value: 'texas',
                        },
                        {
                            display: 'Utah',
                            value: 'utah',
                        },
                        {
                            display: 'Vermont',
                            value: 'vermont',
                        },
                        {
                            display: 'Virginia',
                            value: 'virginia',
                        },
                        {
                            display: 'Washington',
                            value: 'washington',
                        },
                        {
                            display: 'West Virginia',
                            value: 'west-virginia',
                        },
                        {
                            display: 'Wisconsin',
                            value: 'wisconsin',
                        },
                        {
                            display: 'Wyoming',
                            value: 'wyoming',
                        },
                    ],
                },
                {
                    display: 'U.S. Zip Codes By State',
                    value: 'zipcodes/',
                    subtype: [
                        {
                            display: 'Alabama',
                            value: 'alabama',
                        },
                        {
                            display: 'Alaska',
                            value: 'alaska',
                        },
                        {
                            display: 'Arizona',
                            value: 'arizona',
                        },
                        {
                            display: 'Arkansas',
                            value: 'arkansas',
                        },
                        {
                            display: 'California',
                            value: 'california',
                        },
                        {
                            display: 'Colorado',
                            value: 'colorado',
                        },
                        {
                            display: 'Connecticut',
                            value: 'connecticut',
                        },
                        {
                            display: 'Delaware',
                            value: 'delaware',
                        },
                        {
                            display: 'District Of Columbia',
                            value: 'district-of-columbia',
                        },
                        {
                            display: 'Florida',
                            value: 'florida',
                        },
                        {
                            display: 'Georgia',
                            value: 'georgia',
                        },
                        {
                            display: 'Hawaii',
                            value: 'hawaii',
                        },
                        {
                            display: 'Idaho',
                            value: 'idaho',
                        },
                        {
                            display: 'Illinois',
                            value: 'illinois',
                        },
                        {
                            display: 'Indiana',
                            value: 'indiana',
                        },
                        {
                            display: 'Iowa',
                            value: 'iowa',
                        },
                        {
                            display: 'Kansas',
                            value: 'kansas',
                        },
                        {
                            display: 'Kentucky',
                            value: 'kentucky',
                        },
                        {
                            display: 'Louisiana',
                            value: 'louisiana',
                        },
                        {
                            display: 'Maine',
                            value: 'maine',
                        },
                        {
                            display: 'Maryland',
                            value: 'maryland',
                        },
                        {
                            display: 'Massachusetts',
                            value: 'massachusetts',
                        },
                        {
                            display: 'Michigan',
                            value: 'michigan',
                        },
                        {
                            display: 'Minnesota',
                            value: 'minnesota',
                        },
                        {
                            display: 'Mississippi',
                            value: 'mississippi',
                        },
                        {
                            display: 'Missouri',
                            value: 'missouri',
                        },
                        {
                            display: 'Montana',
                            value: 'montana',
                        },
                        {
                            display: 'Nebraska',
                            value: 'nebraska',
                        },
                        {
                            display: 'Nevada',
                            value: 'nevada',
                        },
                        {
                            display: 'New Hampshire',
                            value: 'new-hampshire',
                        },
                        {
                            display: 'New Jersey',
                            value: 'new-jersey',
                        },
                        {
                            display: 'New Mexico',
                            value: 'new-mexico',
                        },
                        {
                            display: 'New York',
                            value: 'new-york',
                        },
                        {
                            display: 'North Carolina',
                            value: 'north-carolina',
                        },
                        {
                            display: 'North Dakota',
                            value: 'north-dakota',
                        },
                        {
                            display: 'Ohio',
                            value: 'ohio',
                        },
                        {
                            display: 'Oklahoma',
                            value: 'oklahoma',
                        },
                        {
                            display: 'Oregon',
                            value: 'oregon',
                        },
                        {
                            display: 'Pennsylvania',
                            value: 'pennsylvania',
                        },
                        {
                            display: 'Puerto Rico',
                            value: 'puerto-rico',
                        },
                        {
                            display: 'Rhode Island',
                            value: 'rhode-island',
                        },
                        {
                            display: 'South Carolina',
                            value: 'south-carolina',
                        },
                        {
                            display: 'South Dakota',
                            value: 'south-dakota',
                        },
                        {
                            display: 'Tennessee',
                            value: 'tennessee',
                        },
                        {
                            display: 'Texas',
                            value: 'texas',
                        },
                        {
                            display: 'Utah',
                            value: 'utah',
                        },
                        {
                            display: 'Vermont',
                            value: 'vermont',
                        },
                        {
                            display: 'Virginia',
                            value: 'virginia',
                        },
                        {
                            display: 'Washington',
                            value: 'washington',
                        },
                        {
                            display: 'West Virginia',
                            value: 'west-virginia',
                        },
                        {
                            display: 'Wisconsin',
                            value: 'wisconsin',
                        },
                        {
                            display: 'Wyoming',
                            value: 'wyoming',
                        },
                    ],
                },
            ],
            selected: [],
        };

        scope.choroplethMapType.subtypes = {
            options: [],
            selected: '',
        };

        // functions
        scope.choroplethMapType.changeMapType = changeMapType;
        scope.choroplethMapType.execute = execute;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            const active = scope.widgetCtrl.getWidget('active'),
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                );

            let type, first;
            if (typeof sharedTools.choroplethMapType === 'object') {
                type = Object.keys(sharedTools.choroplethMapType)[0];
            } else if (typeof sharedTools.choroplethMapType === 'string') {
                type = sharedTools.choroplethMapType;
            }

            first = type;
            if (first.indexOf('/') > -1) {
                first = first.substring(0, type.indexOf('/') + 1);
            }

            for (
                let optIdx = 0,
                    optLen = scope.choroplethMapType.types.options.length;
                optIdx < optLen;
                optIdx++
            ) {
                if (
                    scope.choroplethMapType.types.options[optIdx].value ===
                    first
                ) {
                    scope.choroplethMapType.types.selected =
                        scope.choroplethMapType.types.options[optIdx];
                    break;
                }
            }

            if (scope.choroplethMapType.types.selected.subtype) {
                let second = type.substring(type.indexOf('/') + 1);

                scope.choroplethMapType.subtypes.options =
                    scope.choroplethMapType.types.selected.subtype;

                for (
                    let optIdx = 0,
                        optLen =
                            scope.choroplethMapType.subtypes.options.length;
                    optIdx < optLen;
                    optIdx++
                ) {
                    if (
                        scope.choroplethMapType.subtypes.options[optIdx]
                            .value === second
                    ) {
                        scope.choroplethMapType.subtypes.selected =
                            scope.choroplethMapType.subtypes.options[optIdx];
                        break;
                    }
                }
            }
        }

        /**
         * @name changeMapType
         * @desc set the map type
         * @returns {void}
         */
        function changeMapType() {
            scope.choroplethMapType.subtypes = {
                options: scope.choroplethMapType.types.selected.subtype || [],
                selected: '',
            };
        }

        /**
         * @name executePixel
         * @desc executes the pixel to update and retrieve panel ornaments
         * @returns {void}
         */
        function execute() {
            let type = scope.choroplethMapType.types.selected.value;
            if (scope.choroplethMapType.subtypes.selected) {
                type =
                    scope.choroplethMapType.types.selected.value +
                    scope.choroplethMapType.subtypes.selected.value;
            }

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                shared: {
                                    choroplethMapType: type,
                                },
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let choroplethMapTypeUpdateFrameListener,
                choroplethMapTypeUpdateTaskListener,
                updateOrnamentsListener;

            // listeners
            choroplethMapTypeUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            choroplethMapTypeUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                choroplethMapTypeUpdateFrameListener();
                choroplethMapTypeUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
