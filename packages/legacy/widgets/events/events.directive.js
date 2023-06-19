'use strict';

import './events.scss';

export default angular
    .module('app.events.directive', [])
    .directive('events', eventsDirective);

eventsDirective.$inject = ['semossCoreService', '$timeout'];

function eventsDirective(semossCoreService, $timeout) {
    eventsCtrl.$inject = [];
    eventsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        template: require('./events.directive.html'),
        controller: eventsCtrl,
        link: eventsLink,
        scope: {},
        bindToController: {},
        controllerAs: 'events',
    };

    function eventsCtrl() {}

    function eventsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var updateEventsListener, updateClonesListener, highlightTimer;

        // functions
        scope.events.addEvent = addEvent;
        scope.events.removeEvent = removeEvent;
        scope.events.toggleEventDisabled = toggleEventDisabled;
        scope.events.editEvent = editEvent;
        scope.events.selectEvent = selectEvent;
        scope.events.selectOpenType = selectOpenType;
        scope.events.mouseover = mouseover;
        scope.events.mouseleave = mouseleave;
        scope.events.setKeysToBind = setKeysToBind;
        scope.events.registerKeys = registerKeys;
        scope.events.selectAction = selectAction;
        scope.events.updateAccordion = updateAccordion;
        scope.events.setAccordion = setAccordion;
        scope.events.resetValues = resetValues;
        scope.events.getInsights = getInsights;
        scope.events.checkVisualizationEvents = checkVisualizationEvents;
        scope.events.checkVisualizationActions = checkVisualizationActions;

        // disable these features on events
        scope.events.hideFeatures = {
            echarts: {
                actions: {
                    // hide these actions for the listed visualizations
                    Click: [],
                    'Double Click': [],
                    Brush: ['ParallelCoordinates', 'Pie', 'Polar'],
                    Hover: ['ParallelCoordinates'],
                    'Mouse Out': ['ParallelCoordinates'],
                    'Key Press': ['ParallelCoordinates'],
                },
                events: {
                    // hide these events for the listed visualizations
                    'Highlight Column': ['ParallelCoordinates'],
                    'Unfilter Column (Frame)': ['ParallelCoordinates'],
                    'Filter Column (Frame)': ['ParallelCoordinates'],
                    'Unfilter Column (Panel)': ['ParallelCoordinates'],
                    'Filter Column (Panel)': ['ParallelCoordinates'],
                    'Open URL': [],
                    'Open Insight': [],
                    'Custom Script': [],
                },
            },
            standard: {
                actions: {
                    // hide these actions for the listed visualizations
                    Click: [],
                    'Double Click': [],
                    Brush: ['Radial'],
                    Hover: ['Radial'],
                    'Mouse Out': ['Radial'],
                    'Key Press': [],
                },
                events: {
                    // hide these events for the listed visualizations
                    'Highlight Column': ['Radial'],
                    'Filter Column (Frame)': ['Radial'],
                    'Unfilter Column (Frame)': ['Radial'],
                    'Filter Column (Panel)': ['Radial'],
                    'Unfilter Column (Panel)': ['Radial'],
                    'Open URL': [],
                    'Open Insight': [],
                    'Custom Script': [],
                },
            },
        };
        // scope variables
        scope.events.eventNameMapping = {
            onSingleClick: 'Click',
            onDoubleClick: 'Double Click',
            onBrush: 'Brush',
            onHover: 'Hover',
            onMouseOut: 'Mouse Out',
            onKeyPress: 'Key Press',
        };
        scope.events.accordionArr = [];
        scope.events.applyTo = {
            list: ['Specific Panels', 'All Panels'],
            selected: 'Specific Panels',
        };

        scope.events.actions = {
            list: [
                {
                    name: 'Click',
                    value: 'onSingleClick',
                },
                {
                    name: 'Double Click',
                    value: 'onDoubleClick',
                },
                {
                    name: 'Brush',
                    value: 'onBrush',
                },
                {
                    name: 'Hover',
                    value: 'onHover',
                },
                // {TODO add mouse in functionality
                //     name: 'Mouse In',
                //     value: 'onMouseIn'
                // },
                {
                    name: 'Mouse Out',
                    value: 'onMouseOut',
                },
                {
                    name: 'Key Press',
                    value: 'onKeyPress',
                },
            ],
            selected: {},
        };

        scope.events.keyBinding = {
            list: [
                {
                    name: 'Control',
                    keycode: 17,
                },
                {
                    name: 'Shift',
                    keycode: 16,
                },
                {
                    name: 'Alt',
                    keycode: 18,
                },
            ],
            selected: {
                name: 'Control',
                keycode: 17,
            },
            bindToKey: false,
        };

        scope.events.keysToBind = {
            list: [],
            value: '',
        };

        scope.events.videoTypes = {
            list: [
                {
                    name: 'Youtube',
                    url: 'https://www.youtube.com/results?search_query=<SelectedValue>',
                },
                {
                    name: 'Vimeo',
                    url: 'https://www.vimeo.com/search?q=<SelectedValue>',
                },
            ],
            selected: {
                name: 'Youtube',
                url: 'https://www.youtube.com/results?search_query=<SelectedValue>',
            },
        };

        scope.events.actions.selected = scope.events.actions.list[0];

        scope.events.eventsList = [
            {
                name: 'Highlight Column',
                query: [
                    'Panel(<Panel>)|AddPanelOrnaments({"tools":{"shared":{"highlight":{"data":{"<SelectedAliasColumn>":<SelectedValues>}}}}});Panel(<Panel>)|RetrievePanelOrnaments();',
                    'smss_chain_highlight=Frame(<Frame>) | Select(<TargetColumn>)|Filter(<SelectedColumn>==<SelectedValues>)|Iterate(useFrameFilters=[false]);' +
                        'Panel(<Panel>)|AddPanelOrnaments({"tools":{"shared":{"highlight":{"data":{"<TargetAliasColumn>":{smss_chain_highlight}}}}}});' +
                        'Panel(<Panel>)|RetrievePanelOrnaments();RemoveVariable(smss_chain_highlight);',
                ],
                refresh: false,
                specifyColumn: false,
                type: 'Specific Panels',
            },
            {
                name: 'Filter Column (Frame)',
                query: [
                    '<Frame> | SetFrameFilter(<SelectedColumn>==<SelectedValues>);',
                    'smss_chain_filter= Frame(<Frame>) |Select(<TargetColumn>) | Filter(<SelectedColumn>==<SelectedValues>)|Iterate(useFrameFilters=[false]);<Frame> | SetFrameFilter(<TargetColumn>==smss_chain_filter);RemoveVariable(smss_chain_filter);',
                ],
                refresh: true,
                specifyColumn: false,
                type: 'All Panels',
            },
            {
                name: 'Filter Column (Panel)',
                query: [
                    'Panel("<Panel>") | SetPanelFilter(<SelectedColumn>==<SelectedValues>);',
                    'smss_chain_filter= Frame(<Frame>) |Select(<TargetColumn>) | Filter(<SelectedColumn>==<SelectedValues>)|Iterate(useFrameFilters=[false]);Panel("<Panel>") | SetPanelFilter(<TargetColumn>==smss_chain_filter);RemoveVariable(smss_chain_filter);',
                ],
                refresh: true,
                specifyPanels: ['<Panel>'],
                specifyColumn: false,
                type: 'Specific Panels',
            },
            {
                name: 'Unfilter Column (Frame)',
                query: ['<Frame> | UnfilterFrame(<SelectedColumn>);'],
                refresh: true,
                specifyColumn: false,
                type: 'All Panels',
            },
            {
                name: 'Unfilter Column (Panel)',
                query: ['Panel("<Panel>") | UnfilterPanel(<SelectedColumn>);'],
                refresh: true,
                specifyPanels: ['<Panel>'],
                specifyColumn: false,
                type: 'Specific Panels',
            },
            {
                name: 'Open URL',
                query: [
                    'Panel(<Panel>)|AddPanelComment({"binding":{"showAsMarker":"false","height":<Height>,"width":<Width>,"x":<MouseX>,"y":<MouseY>,"clientWidth":1874,"clientHeight":816},"id":"1","alwaysDisplay": true,"type":"svgMain","commentText":"<iframe style=\'border: none\' src=<URL>></iframe>"});Panel(<Panel>)|RetrievePanelComment();', // open as comment
                    'AddPanel(999);Panel(999)|SetPanelView("text-widget",{"html":"<iframe src=<URL> style=\'top:0;left: 0;width:100%;height: 100%; position: absolute; border: none\'></iframe>","varList":[{"query":"","name":""}]});', // open new panel
                    'OpenTab(<URL>);', // open tab
                ],
                refresh: false,
                specifyColumn: false,
                type: 'Specific Panels',
            },
            {
                name: 'Open Insight',
                query: [
                    'META | OpenInsight(app=["<AppId>"], id=["<InsightId>"]);',
                ],
                refresh: false,
                specifyColumn: false,
                type: 'All Panels',
            },
            /* {
                name: 'Close Popup',
                query: [
                    'Panel(<CurrentPanel>)|RemovePanelComment("1")|RetrievePanelComment();'
                ],
                refresh: false,
                specifyColumn: false
            },*/
            {
                name: 'Custom Script',
                query: [''],
                refresh: false,
                specifyColumn: false,
                type: 'Specific Panels',
            },
        ];

        scope.events.selectedEvent = scope.events.eventsList[0];
        scope.events.query = scope.events.selectedEvent.query[0];
        scope.events.specifyColumn = specifyColumn;

        scope.events.clones = {
            list: [],
            selected: [],
        };

        scope.events.eventData = {};

        scope.events.headers = {
            selected: '',
            list: [],
        };

        scope.events.apps = {
            list: [],
            selected: '',
        };

        scope.events.insights = {
            list: [],
            selected: '',
        };

        scope.events.showActiveEvents = true;
        scope.events.refresh = scope.events.selectedEvent.refresh;
        scope.events.url = {
            link: '',
            width: 300,
            height: 300,
        };

        scope.events.activeKeys = [];
        scope.events.showAdvanced = false;
        scope.events.visualizations = semossCoreService
            .getVisualizationConfig()
            .map(function (viz) {
                return viz.name;
            })
            .filter(function (item, idx, self) {
                return self.indexOf(item) === idx;
            })
            .sort();
        scope.events.selectedVisuals = semossCoreService
            .getVisualizationConfig()
            .map(function (viz) {
                return viz.name;
            })
            .filter(function (item, idx, self) {
                return self.indexOf(item) === idx;
            })
            .sort();

        /**
         * @name isValid
         * @param {object} currentAccordion the accordion to check if all fields are filled
         * @desc checks to see if all required fields are filled in for the event to be added
         * @returns {boolean} returns a boolean
         */
        function isValid(currentAccordion) {
            // generic check for query and name...those are always required and doesn't pre-populate with anything
            if (
                !currentAccordion.query ||
                !scope.events.name ||
                (currentAccordion.selectedEvent.specifyColumn &&
                    !currentAccordion.headers.selected)
            ) {
                return false;
            }

            if (currentAccordion.selectedEvent.name === 'Open URL') {
                if (!currentAccordion.url.link) {
                    // always needs a link
                    return false;
                }
            }

            if (currentAccordion.selectedEvent.name === 'Open Insight') {
                if (
                    !scope.events.apps.selected ||
                    !scope.events.insights.selected
                ) {
                    return false;
                }
            }

            // key press needs a key to bind to
            if (scope.events.actions.selected.name === 'Key Press') {
                if (!scope.events.keysToBind.value) {
                    return false;
                }
            }

            return true;
        }

        /**
         * @name checkVisualizationActions
         * @desc checks the visualization to only show available actions (click, dbl click, etc.)
         * @returns {void}
         */
        function checkVisualizationActions() {
            var actionIdx,
                action,
                currentLayout,
                active = scope.widgetCtrl.getWidget('active'),
                type;

            if (active === 'visualization') {
                currentLayout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                );
                type = scope.widgetCtrl.getWidget(
                    'view.' + active + '.options.type'
                );
            } else {
                currentLayout = active;
            }

            if (
                scope.events.hideFeatures[type] &&
                scope.events.hideFeatures[type].actions
            ) {
                // loop through and see what actions we need to remove for this visualization
                for (action in scope.events.hideFeatures[type].actions) {
                    if (
                        scope.events.hideFeatures[type].actions.hasOwnProperty(
                            action
                        )
                    ) {
                        if (
                            scope.events.hideFeatures[type].actions[
                                action
                            ].indexOf(currentLayout) > -1
                        ) {
                            // hide this action option for this visualization
                            for (
                                actionIdx = 0;
                                actionIdx < scope.events.actions.list.length;
                                actionIdx++
                            ) {
                                if (
                                    scope.events.actions.list[actionIdx]
                                        .name === action
                                ) {
                                    // remove it
                                    scope.events.actions.list.splice(
                                        actionIdx,
                                        1
                                    );
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        /**
         * @name checkVisualizationEvents
         * @desc checks the visualization to only show the available events (filter, highlight, etc.)
         * @returns {void}
         */
        function checkVisualizationEvents() {
            var eventIdx,
                event,
                currentLayout,
                active = scope.widgetCtrl.getWidget('active'),
                type;

            if (active === 'visualization') {
                currentLayout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                );
                type = scope.widgetCtrl.getWidget(
                    'view.' + active + '.options.type'
                );
            } else {
                currentLayout = active;
            }

            if (
                scope.events.hideFeatures[type] &&
                scope.events.hideFeatures[type].events
            ) {
                // loop through and see what events we need to remove for this visualization
                for (event in scope.events.hideFeatures[type].events) {
                    if (
                        scope.events.hideFeatures[type].events.hasOwnProperty(
                            event
                        )
                    ) {
                        if (
                            scope.events.hideFeatures[type].events[
                                event
                            ].indexOf(currentLayout) > -1
                        ) {
                            // hide this event option for this visualization
                            for (
                                eventIdx = 0;
                                eventIdx < scope.events.eventsList.length;
                                eventIdx++
                            ) {
                                if (
                                    scope.events.eventsList[eventIdx].name ===
                                    event
                                ) {
                                    // remove it
                                    scope.events.eventsList.splice(eventIdx, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        /**
         * @name addEvent
         * @desc add an event to the panel
         * @returns {void}
         */
        function addEvent() {
            var validEvent = true,
                queryIdx;

            for (
                queryIdx = 0;
                queryIdx < scope.events.accordionArr.length;
                queryIdx++
            ) {
                if (!isValid(scope.events.accordionArr[queryIdx])) {
                    validEvent = false;
                    break;
                }
            }

            if (validEvent) {
                scope.widgetCtrl.emit('add-event', {
                    event: getEventsObject(),
                });
            } else {
                scope.widgetCtrl.alert(
                    'warn',
                    'All required fields must be filled.'
                );
            }
        }

        /**
         * @name getEventsObject
         * @desc this will take the data in the accordions and convert it to the structure that we will use to save as an event
         * @returns {object} the final events object we will try to save
         */
        function getEventsObject() {
            var eventObject = {},
                action = scope.events.actions.selected.value,
                accordionIdx,
                eventData = {},
                currentAccordion,
                tempKeyList = [],
                newEventObject = {},
                panels,
                panelIdx,
                tempQuery;

            eventObject[action] = {};
            eventObject[action][scope.events.name] = [];

            // loop through the accordion and take the data to structure to how we need to save in the BE
            for (
                accordionIdx = 0;
                accordionIdx < scope.events.accordionArr.length;
                accordionIdx++
            ) {
                currentAccordion = scope.events.accordionArr[accordionIdx];
                eventData = {};
                eventData.panel = currentAccordion.panel;
                eventData.query =
                    '<encode>' + currentAccordion.query + '</encode>';
                eventData.options = {};
                eventData.refresh = currentAccordion.refresh;

                if (
                    eventData.refresh &&
                    currentAccordion.specifyPanels &&
                    currentAccordion.specifyPanels.length > 0
                ) {
                    eventData.specifyPanels = currentAccordion.specifyPanels;
                }

                eventData.disabledVisuals = [];
                if (currentAccordion.default) {
                    eventData.default = currentAccordion.default;
                }
                // eslint-disable-next-line no-loop-func
                scope.events.visualizations.forEach(function (viz) {
                    if (scope.events.selectedVisuals.indexOf(viz) === -1) {
                        eventData.disabledVisuals.push(viz);
                    }
                });
                // if they specify a column and selected a column then we will
                if (
                    currentAccordion.specifyColumn &&
                    currentAccordion.headers.selected
                ) {
                    eventData.options.header =
                        currentAccordion.headers.selected;
                }

                // add the url information if exists
                if (
                    currentAccordion.url.link &&
                    currentAccordion.selectedEvent.name === 'Open URL'
                ) {
                    if (currentAccordion.openTypes.selected === 'Popup') {
                        // special case here...if it's a popup we want user to define how they want to close it
                        eventData.options.url = currentAccordion.url;
                        eventObject[currentAccordion.popoutClose.action.value] =
                            {};
                        eventObject[currentAccordion.popoutClose.action.value][
                            scope.events.name + ' (Close Popup)'
                        ] = [
                            {
                                query: '<encode>Panel(<Panel>)|RemovePanelComment("1")|RetrievePanelComment();</encode>',
                                panel: currentAccordion.panel,
                                options: {
                                    keys: currentAccordion.popoutClose
                                        .keysToBind.list,
                                },
                                refresh: false,
                                openType: {},
                            },
                        ];
                    } else {
                        eventData.options.url = {
                            link: currentAccordion.url.link,
                        };
                    }
                }

                if (currentAccordion.selectedEvent.name === 'Open Insight') {
                    // replace with the app id and insight id to open
                    currentAccordion.query = currentAccordion.query.replace(
                        '<AppId>',
                        scope.events.apps.selected
                    );
                    currentAccordion.query = currentAccordion.query.replace(
                        '<InsightId>',
                        scope.events.insights.selected
                    );
                    eventData.query =
                        '<encode>' + currentAccordion.query + '</encode>';
                }

                // if they bind the event to a key...we will add that selected key to the event
                if (scope.events.keyBinding.bindToKey) {
                    // this is the binding for events other than 'Key Press'; e.g. Control + Click
                    tempKeyList = [scope.events.keyBinding.selected];
                } else if (
                    scope.events.keysToBind.value &&
                    scope.events.actions.selected.name === 'Key Press'
                ) {
                    // this is the binding for 'Key Press' action
                    tempKeyList = scope.events.keysToBind.list;
                } else {
                    scope.events.keysToBind = {
                        list: [],
                        value: '',
                    };
                }

                if (tempKeyList.length > 0) {
                    eventData.options.keys = tempKeyList;
                }

                eventObject[action][scope.events.name].push(eventData);
                // need to replace the <Panel> in the query for each panel in the insight
                if (
                    currentAccordion.name === 'All Panels' &&
                    currentAccordion.query.indexOf('<Panel>') > -1
                ) {
                    // grab all of the panels...and then do the replacements
                    panels = scope.widgetCtrl.getShared('panels');
                    tempQuery = '<encode>';
                    for (panelIdx = 0; panelIdx < panels.length; panelIdx++) {
                        tempQuery += currentAccordion.query.replace(
                            /<Panel>/g,
                            panels[panelIdx].panelId
                        );
                    }

                    tempQuery += '</encode>';
                    eventObject[action][scope.events.name][0].query = tempQuery;
                }
            }
            return eventObject;
        }

        /**
         * @name setAccordion
         * @desc set the accordion based on whether it's panel specific or not
         * @returns {void}
         */
        function setAccordion() {
            if (scope.events.applyTo.selected === 'Specific Panels') {
                scope.events.accordionArr = [];
                scope.events.clones.selected = scope.events.clones.list[0];
                updateAccordion();
            } else {
                scope.events.accordionArr = [
                    {
                        name: 'All Panels',
                        height: 100,
                        panel: '',
                        query: scope.events.eventsList[0].query[0],
                        refresh: scope.events.eventsList[0].refresh,
                        specifyPanels: scope.events.eventsList[0].specifyPanels,
                        eventsList: scope.events.eventsList,
                        selectedEvent: JSON.parse(
                            JSON.stringify(scope.events.eventsList[0])
                        ),
                        popoutClose: {
                            action: 'Click',
                            keysToBind: {
                                list: [],
                                value: '',
                            },
                        },
                        openTypes: {
                            list: ['Popup', 'Panel', 'Tab'],
                            selected: 'Popup',
                        },
                        headers: {
                            selected: '',
                        },
                        url: {
                            link: '',
                            width: 300,
                            height: 300,
                        },
                        specifyColumn: scope.events.eventsList[0].specifyColumn
                            ? true
                            : false,
                    },
                ];
            }
        }

        /**
         * @name updateAccordion
         * @desc determines whether to add or remove the panel accordion
         * @returns {void}
         */
        function updateAccordion() {
            scope.events.accordionArr = [
                {
                    name: 'Panel ' + scope.events.clones.selected.panelId,
                    height: 100,
                    panel: scope.events.clones.selected.panelId,
                    query: scope.events.eventsList[0].query[0],
                    refresh: scope.events.eventsList[0].refresh,
                    specifyPanels: scope.events.eventsList[0].specifyPanels,
                    eventsList: scope.events.eventsList,
                    selectedEvent: JSON.parse(
                        JSON.stringify(scope.events.eventsList[0])
                    ),
                    popoutClose: {
                        action: 'Click',
                        keysToBind: {
                            list: [],
                            value: '',
                        },
                    },
                    openTypes: {
                        list: ['Popup', 'Panel', 'Tab'],
                        selected: 'Popup',
                    },
                    headers: {
                        selected: '',
                    },
                    url: {
                        link: '',
                        width: 300,
                        height: 300,
                    },
                    specifyColumn: scope.events.eventsList[0].specifyColumn
                        ? true
                        : false,
                },
            ];
        }

        /**
         * @name registerKeys
         * @param {*} event the the keypress event
         * @returns {boolean} prevent default behavior
         */
        function registerKeys(event) {
            if (!event.originalEvent.repeat) {
                scope.events.activeKeys.push({
                    keycode: event.which || event.keycode,
                    name: event.key,
                });
            }

            return false;
        }

        /**
         * @name setKeysToBind
         * @param {boolean} popoutKeys dictates which object to use
         * @param {object} currentAccordion the accordion currently modifying
         * @returns {void}
         */
        function setKeysToBind(popoutKeys, currentAccordion) {
            var keyIdx, keysToBind;

            if (popoutKeys) {
                keysToBind = currentAccordion.popoutClose.keysToBind;
            } else {
                keysToBind = scope.events.keysToBind;
            }

            if (scope.events.activeKeys.length > 0) {
                keysToBind.list = [];
                keysToBind.value = '';
                for (
                    keyIdx = 0;
                    keyIdx < scope.events.activeKeys.length;
                    keyIdx++
                ) {
                    keysToBind.value += scope.events.activeKeys[keyIdx].name;
                    if (scope.events.activeKeys.length - 1 !== keyIdx) {
                        keysToBind.value += '+';
                    }
                    keysToBind.list.push(scope.events.activeKeys[keyIdx]);
                }
            }

            scope.events.activeKeys = [];
        }

        /**
         * @name removeEvent
         * @param {*} action the action the event belongs to
         * @param {*} eventName the name of the event
         * @desc removes an event
         * @returns {void}
         */
        function removeEvent(action, eventName) {
            scope.widgetCtrl.emit('remove-event', {
                action: action,
                eventName: eventName,
            });
        }

        /**
         * @name disableEvent
         * @param {*} action the action the event belongs to
         * @param {*} eventName the name of the event
         * @desc disablss an event
         * @returns {void}
         */
        function toggleEventDisabled(action, eventName) {
            var event = {};
            event[action] = {};
            event[action][eventName] = JSON.parse(
                JSON.stringify(scope.events.eventData[action][eventName])
            );
            event[action][eventName][0].disabled =
                !event[action][eventName][0].disabled;

            scope.widgetCtrl.emit('add-event', {
                event: event,
            });
        }

        /**
         * @name editEvent
         * @param {*} action the action the event belongs to
         * @param {*} eventName the name of the event
         * @desc modifies an existing event
         * @returns {void}
         */
        function editEvent(action, eventName) {
            var currentEvent = JSON.parse(
                    JSON.stringify(scope.events.eventData[action][eventName])
                ),
                accordionDetails = {},
                accordionName = '',
                selectedEvent = {},
                urlData = {},
                actionIdx,
                inputIdx,
                eventIdx,
                keyIdx,
                openInsightRegex =
                    'META\\s{1}[|]{1}\\s{1}OpenInsight[(]{1}app=[[]{1}"[\\w-]+"[\\]]{1}, id=[[]{1}"[\\w-]*"[\\]]{1}[)]{1};';

            scope.events.accordionArr = [];
            scope.events.name = eventName;

            // find ignored visualizations
            currentEvent.forEach(function (piece) {
                if (piece.hasOwnProperty('disabledVisuals')) {
                    piece.disabledVisuals.forEach(function (visual) {
                        scope.events.selectedVisuals.splice(
                            scope.events.selectedVisuals.indexOf(visual),
                            1
                        );
                    });
                }
            });

            // find the action to set
            for (
                actionIdx = 0;
                actionIdx < scope.events.actions.list.length;
                actionIdx++
            ) {
                if (scope.events.actions.list[actionIdx].value === action) {
                    scope.events.actions.selected =
                        scope.events.actions.list[actionIdx];
                    break;
                }
            }

            // set the accordions and its content
            for (inputIdx = 0; inputIdx < currentEvent.length; inputIdx++) {
                // TODO set bind to key if action is Key Press
                if (
                    currentEvent[inputIdx].options &&
                    currentEvent[inputIdx].options.keys
                ) {
                    if (action === 'onKeyPress') {
                        scope.events.keysToBind = {
                            list: currentEvent[inputIdx].options.keys,
                            value: '',
                        };

                        for (
                            keyIdx = 0;
                            keyIdx < scope.events.keysToBind.list.length;
                            keyIdx++
                        ) {
                            scope.events.keysToBind.value +=
                                scope.events.keysToBind.list[keyIdx].name;
                            if (
                                scope.events.keysToBind.list.length - 1 !==
                                keyIdx
                            ) {
                                scope.events.keysToBind.value += '+';
                            }
                        }
                    } else {
                        scope.events.keyBinding.selected =
                            currentEvent[inputIdx].options.keys[0];
                        scope.events.keyBinding.bindToKey = true;
                    }
                }

                if (
                    currentEvent[inputIdx].panel ||
                    currentEvent[inputIdx].panel === 0
                ) {
                    accordionName = 'Panel ' + currentEvent[inputIdx].panel;
                    scope.events.clones.selected = {
                        name: 'Panel ' + currentEvent[inputIdx].panel,
                        panelId: currentEvent[inputIdx].panel,
                        widgetId: `SMSSWidget${scope.widgetCtrl.insightID}___${currentEvent[inputIdx].panel}`,
                    };
                    scope.events.applyTo.selected = 'Specific Panels';
                } else {
                    accordionName = 'All Panels';
                    scope.events.applyTo.selected = 'All Panels';
                }

                // check to see if it's the Open Insight event...since we do some string manipulations before adding the event, we'd have to convert it back to the original
                if (
                    currentEvent[inputIdx].query.match(openInsightRegex) &&
                    currentEvent[inputIdx].query.match(openInsightRegex)
                        .length === 1
                ) {
                    scope.events.apps.selected = currentEvent[
                        inputIdx
                    ].query.match('app=[[]{1}"([\\w-]+)"[\\]]{1}')[1];
                    scope.events.insights.selected = currentEvent[
                        inputIdx
                    ].query.match('id=[[]{1}"([\\w-]*)"')[1];
                    currentEvent[inputIdx].query =
                        'META | OpenInsight(app=["<AppId>"], id=["<InsightId>"]);';
                    getApps();
                }

                // find the event to set, if not found set it to custom
                for (
                    eventIdx = 0;
                    eventIdx < scope.events.eventsList.length;
                    eventIdx++
                ) {
                    if (
                        scope.events.eventsList[eventIdx].query.indexOf(
                            currentEvent[inputIdx].query
                        ) > -1
                    ) {
                        // found it
                        selectedEvent = scope.events.eventsList[eventIdx];
                    }
                }

                // check if selectedEvent is set
                if (Object.keys(selectedEvent).length === 0) {
                    // set it to the last one--which is custom script
                    selectedEvent = scope.events.eventsList[eventIdx - 1];
                }

                // check the url
                if (
                    currentEvent[inputIdx].options &&
                    currentEvent[inputIdx].options.url
                ) {
                    urlData = {
                        link: currentEvent[inputIdx].options.url.link,
                        height: currentEvent[inputIdx].options.url.height
                            ? currentEvent[inputIdx].options.url.height
                            : 0,
                        width: currentEvent[inputIdx].options.url.width
                            ? currentEvent[inputIdx].options.url.width
                            : 0,
                    };
                }

                accordionDetails = {
                    default: currentEvent[inputIdx].default,
                    name: accordionName,
                    height: currentEvent.length - 1 === inputIdx ? 100 : 0,
                    panel: currentEvent[inputIdx].panel,
                    query: currentEvent[inputIdx].query,
                    refresh: currentEvent[inputIdx].refresh,
                    specifyPanels: currentEvent[inputIdx].specifyPanels,
                    eventsList: scope.events.eventsList,
                    selectedEvent: selectedEvent,
                    popoutClose: {
                        // at this point will always be empty...because its being saved as a new 'event'
                        action: {
                            name: 'Click',
                            value: 'onSingleClick',
                        },
                        keysToBind: {
                            list: [],
                            value: '',
                        },
                    },
                    openTypes: {
                        list: ['Popup', 'Panel', 'Tab'],
                        selected: 'Popup',
                    },
                    headers: {
                        selected:
                            currentEvent[inputIdx].options &&
                            currentEvent[inputIdx].options.header
                                ? currentEvent[inputIdx].options.header
                                : '',
                    },
                    url: urlData,
                    specifyColumn:
                        currentEvent[inputIdx].options &&
                        currentEvent[inputIdx].options.header
                            ? true
                            : false,
                };

                scope.events.accordionArr.push(accordionDetails);
            }

            // set the view
            scope.events.showActiveEvents = false;
        }

        /**
         * @name mouseover
         * @param {*} option the panel information
         * @desc the event to trigger for mousing over an item in the list
         * @returns {void}
         */
        function mouseover(option) {
            // cancel the timer to clear highlight. should have been fired already by mouse event
            if (highlightTimer) {
                $timeout.cancel(highlightTimer);
            }
            // send a message to core to highlight the panel
            semossCoreService.emit('highlight-panel', {
                insightID: scope.widgetCtrl.insightID,
                panelId: option.panelId,
                highlight: true,
            });

            // toggle off the highlight
            highlightTimer = $timeout(
                function (boundOption) {
                    mouseleave(boundOption);
                }.bind(null, option),
                1500
            );
        }

        /**
         * @name mouseleave
         * @param {*} option the panel information
         * @desc the event to trigger for mousing out an item in the list
         * @returns {void}
         */
        function mouseleave(option) {
            // cancel the timer to clear highlight. will be fired below
            if (highlightTimer) {
                $timeout.cancel(highlightTimer);
            }
            // send a message to core to remove highlight for the panel
            semossCoreService.emit('highlight-panel', {
                insightID: scope.widgetCtrl.insightID,
                panelId: option.panelId,
                highlight: false,
            });
        }

        /**
         * @name getApps
         * @desc get available apps
         * @returns {void}
         */
        function getApps() {
            var pixelComponents = [],
                callback;

            pixelComponents.push({
                meta: true,
                type: 'getProjectList',
                components: [],
                terminal: true,
            });

            callback = function (response) {
                var output = response.pixelReturn[0].output;

                scope.events.apps.list = output;

                if (scope.events.apps.list.length > 0) {
                    if (!scope.events.apps.selected) {
                        scope.events.apps.selected =
                            scope.events.apps.list[0].project_id;
                        getInsights(scope.events.apps.selected);
                    } else {
                        getInsights(scope.events.apps.selected, true);
                    }
                }
            };

            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        /**
         * @name getInsights
         * @param {string} appId the app to get insights for
         * @param {boolean} edit is this coming from edit
         * @desc get the insights for the app
         * @returns {void}
         */
        function getInsights(appId, edit) {
            var pixelComponents = [],
                callback;

            pixelComponents.push({
                meta: true,
                type: 'getInsights',
                components: [appId],
                terminal: true,
            });

            callback = function (response) {
                var output = response.pixelReturn[0].output;

                scope.events.insights.list = output;

                if (scope.events.insights.list.length > 0 && !edit) {
                    scope.events.insights.selected =
                        scope.events.insights.list[0].app_insight_id;
                }
            };

            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        /**
         * @name selectEvent
         * @param {*} selectedEvent the selected event
         * @param {object} accordionItem the accordionItem to modify
         * @desc set the values for the selected event
         * @returns {void}
         */
        function selectEvent(selectedEvent, accordionItem) {
            accordionItem.query = selectedEvent.query[0];
            accordionItem.refresh = selectedEvent.refresh;

            if (selectedEvent.refresh && selectedEvent.specifyPanels) {
                accordionItem.specifyPanels = selectedEvent.specifyPanels;
            }

            accordionItem.specifyColumn = selectedEvent.specifyColumn;
            accordionItem.url = {
                // reset the popup info
                link: '',
                width: 300,
                height: 300,
            };
            accordionItem.openTypes.selected = 'Popup';
            accordionItem.popoutClose = {
                action: {},
                keysToBind: {
                    list: [],
                    value: '',
                },
            };

            // automatically set the action to close the popup
            if (scope.events.actions.selected.name === 'Click') {
                accordionItem.popoutClose.action = {
                    name: 'Double Click',
                    value: 'onDoubleClick',
                };
            } else {
                accordionItem.popoutClose.action = {
                    name: 'Click',
                    value: 'onSingleClick',
                };
            }

            if (selectedEvent.name === 'Custom Script') {
                scope.events.showAdvanced = true;
            } else {
                scope.events.showAdvanced = false;
            }

            if (selectedEvent.name === 'Open Insight') {
                if (scope.events.apps.list.length === 0) {
                    getApps();
                }
            }
        }

        /**
         * @name selectOpenType
         * @param {*} currentAccordion -
         * @returns {void}
         */
        function selectOpenType(currentAccordion) {
            if (currentAccordion.openTypes.selected === 'Popup') {
                currentAccordion.query =
                    currentAccordion.selectedEvent.query[0];
                // automatically set the selected value for Close Popup with
            } else if (currentAccordion.openTypes.selected === 'Panel') {
                currentAccordion.query =
                    currentAccordion.selectedEvent.query[1];
            } else if (currentAccordion.openTypes.selected === 'Tab') {
                currentAccordion.query =
                    currentAccordion.selectedEvent.query[2];
            }

            currentAccordion.url = {
                link: '',
                width: 300,
                height: 300,
            };

            // automatically set the action to close the popup
            if (scope.events.actions.selected.name === 'Click') {
                currentAccordion.popoutClose.action = {
                    name: 'Double Click',
                    value: 'onDoubleClick',
                };
            } else {
                currentAccordion.popoutClose.action = {
                    name: 'Click',
                    value: 'onSingleClick',
                };
            }
        }

        /**
         * @name selectAction
         * @returns {void}
         */
        function selectAction() {
            scope.events.keysToBind = {
                list: [],
                value: '',
            };
        }

        /**
         * @name specifyColumn
         * @param {object} currentAccordion the data for this accordion
         * @returns {void}
         */
        function specifyColumn(currentAccordion) {
            if (currentAccordion.specifyColumn) {
                currentAccordion.query =
                    currentAccordion.selectedEvent.query[1];
            } else {
                currentAccordion.headers.selected = '';
                currentAccordion.query =
                    currentAccordion.selectedEvent.query[0];
            }
        }

        function resetValues() {
            scope.events.accordionArr = [];
            scope.events.name = '';
            scope.events.actions.selected = scope.events.actions.list[0];
            scope.events.keyBinding.bindToKey = false;
            scope.events.keyBinding.selected = {
                name: 'Control',
                keycode: 17,
            };
            scope.events.clones.selected = {
                name: 'Panel 0',
                panelId: 0,
            };
            scope.events.applyTo.selected = 'Specific Panels';
            scope.events.keysToBind = {
                list: [],
                value: '',
            };

            updateAccordion();
        }

        function setCloneData() {
            var clones, cloneIdx, cloneLen;
            clones = scope.widgetCtrl.getShared('panels');

            scope.events.clones.list = [];

            for (
                cloneIdx = 0, cloneLen = clones.length;
                cloneIdx < cloneLen;
                cloneIdx++
            ) {
                scope.events.clones.list.push({
                    name: 'Panel ' + clones[cloneIdx].panelId + '',
                    panelId: clones[cloneIdx].panelId,
                    widgetId: clones[cloneIdx].widgetId,
                });
            }

            scope.events.clones.selected = scope.events.clones.list[0];
        }

        /**
         * @name initialize
         * @desc sets up the needed values
         * @returns {void}
         */
        function initialize() {
            // bind listeners
            updateEventsListener = scope.widgetCtrl.on(
                'update-events',
                function () {
                    var currentEvents = scope.widgetCtrl.getWidget('events');
                    scope.widgetCtrl.alert(
                        'success',
                        'Events have been updated'
                    );
                    if (currentEvents) {
                        scope.events.eventData = currentEvents;
                    }
                }
            );

            updateClonesListener = scope.widgetCtrl.on(
                'add-panel',
                setCloneData
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateEventsListener();
                updateClonesListener();
            });

            setCloneData();

            scope.events.headers.list =
                scope.widgetCtrl.getFrame('headers') || [];
            scope.events.eventData = scope.widgetCtrl.getWidget('events');

            checkVisualizationActions();
            checkVisualizationEvents();
        }

        initialize();
    }
}
