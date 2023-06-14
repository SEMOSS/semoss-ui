import angular from 'angular';
import TrackingAction from './TrackingAction';

/**
 * @name tracking.service.js
 * @desc tracking
 */
export default angular
    .module('app.tracking.service', [])
    .factory('trackingService', trackingService);

trackingService.$inject = [
    'messageService',
    'storeService',
    'workspaceService',
    'handleService',
    'widgetTabService',
];

function trackingService(
    messageService: MessageService,
    storeService: StoreService,
    workspaceService: WorkspaceService,
    handleService: HandleService,
    widgetTabService: WidgetTabService
) {
    const /** Public */
        /** Private */
        _state: any = {},
        _actions = {
            // Actions we are tracking:
            // Open/Close Menu
            // Change Menu Type (Panel vs. Sheet)
            // Change Menu Tab (Panel and Sheet)

            // TODO
            // Determine when to check for changes (drop-insight?)
            // Add more messages:
            // Widget Clicks (update-handle or change-handle)
            // New Insight / Sheet

            /**
             * @name changed-workspace-menu
             * @desc track action when menu is opened or closed and when a menu type is selected (widget or sheet)
             * @param payload - payload of the message
             */
            'changed-workspace-menu': (payload: {
                insightID: string;
            }): void => {
                let newAction: TrackingAction;

                if (payload.insightID) {
                    if (!_state[payload.insightID]) {
                        _state[payload.insightID] = {};
                    }

                    if (!_state[payload.insightID].hasOwnProperty('menu')) {
                        _state[payload.insightID].menu = [];
                    }

                    newAction = {
                        time: getTimeStamp(),
                        value: {
                            open: workspaceService.getWorkspace(
                                payload.insightID,
                                'menu.open'
                            ),
                        },
                    };

                    _state[payload.insightID].menu.push(newAction);
                }
            },
            /**
             * @name update-widget-tab
             * @desc track action when menu (sheet mode) tab is selected
             * @param payload - payload of the message
             */
            'update-widget-tab': (payload: { widgetId: string }): void => {
                let insightID = storeService.getWidget(
                        payload.widgetId,
                        'insightID'
                    ),
                    currentState = widgetTabService.get(
                        payload.widgetId,
                        'selected'
                    ),
                    newAction: TrackingAction;

                if (insightID) {
                    if (!_state[insightID]) {
                        _state[insightID] = {};
                    }

                    if (!_state[insightID].hasOwnProperty('menuWidgetTab')) {
                        _state[insightID].menuWidgetTab = [];
                    }

                    newAction = {
                        time: getTimeStamp(),
                        value: {
                            tab: currentState,
                        },
                    };
                    _state[insightID].menuWidgetTab.push(newAction);
                }
            },
            /**
             * @name update-handle
             * @desc track action when handle is updated
             * @param {object} payload - payload of the message
             */
            'update-handle': (payload: { widgetId: string }): void => {
                let insightID = storeService.getWidget(
                        payload.widgetId,
                        'insightID'
                    ),
                    newAction: TrackingAction,
                    widgetName = handleService.get(
                        payload.widgetId,
                        'selected'
                    );

                if (insightID) {
                    if (!_state[insightID]) {
                        _state[insightID] = {};
                    }
                    if (!_state[insightID].hasOwnProperty('widgetSelect')) {
                        _state[insightID].widgetSelect = [];
                    }

                    newAction = {
                        time: getTimeStamp(),
                        value: {
                            tab: widgetName,
                        },
                    };
                    _state[insightID].widgetSelect.push(newAction);
                }
            },
            /**
             * @name close-widget
             * @desc listen when a widget is closed
             * @param payload - payload of the message
             */
            'close-widget': (payload: { widgetId: string }): void => {
                const insightID = storeService.getWidget(
                    payload.widgetId,
                    'insightID'
                );
                collectChanges(insightID);
            },
        };

    /** Public */
    /**
     * @name getTimeStamp
     * @desc get date in YYYY-MM-DD HH:mm:ss format
     * @returns formatted date
     */
    function getTimeStamp(): string {
        const d: Date = new Date();

        return d.toISOString().slice(0, 23).replace('T', ' ');
    }

    /**
     * @name collectChanges
     * @desc determine any changes to the state for an insight
     * @param insightID selected insightID
     */
    function collectChanges(insightID: string): void {
        let insightChanges: any[] = [];

        if (_state.hasOwnProperty(insightID)) {
            for (const actionType in _state[insightID]) {
                if (_state[insightID].hasOwnProperty(actionType)) {
                    insightChanges = insightChanges.concat(
                        findChangesForItem(
                            insightID,
                            _state[insightID][actionType],
                            actionType
                        )
                    );
                }
            }
            // Remove insightID object from _state
            delete _state[insightID];
        }

        // Sort changes by time
        if (insightChanges.length > 0) {
            insightChanges.sort(compare);
            recordInsightChanges(insightChanges);
        }
    }

    /**
     * @name recordInsightChanges
     * @desc send tracking to back end
     * @param insightChanges changes for a specific insight
     */
    function recordInsightChanges(insightChanges: any[]): void {
        messageService.emit('execute-pixel', {
            commandList: [
                {
                    type: 'widgetTracking',
                    components: [insightChanges],
                    terminal: true,
                },
            ],
            listeners: [],
        });
    }

    function compare(a: TrackingAction, b: TrackingAction): number {
        const aKey = new Date(a.time),
            bKey = new Date(b.time);

        if (aKey < bKey) {
            return -1;
        }
        if (aKey > bKey) {
            return 1;
        }
        return 0;
    }

    /**
     * @name findChangesForItem
     * @desc loop through actions and identify changes
     * @param insightID selected insightID
     * @param actions actions for a given item
     * @param  actionType type of action
     */
    function findChangesForItem(
        insightID: string,
        actions: TrackingAction[],
        actionType: string
    ): any[] {
        const changes: any[] = [];

        for (let i = 0; i < actions.length; i++) {
            for (const item in actions[i].value) {
                if (actions[i].value.hasOwnProperty(item)) {
                    if (i === 0) {
                        changes.push({
                            time: actions[i].time,
                            insightID: insightID,
                            type: actionType,
                            value: actions[i].value[item],
                        });
                    } else if (
                        actions[i].value[item] !== actions[i - 1].value[item]
                    ) {
                        changes.push({
                            time: actions[i].time,
                            insightID: insightID,
                            type: actionType,
                            value: actions[i].value[item],
                        });
                    }
                }
            }
        }
        return changes;
    }

    /**
     * @name initialize
     * @desc called when the module is loaded
     * @return {void}
     */
    function initialize() {
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    return {
        initialize: initialize,
    };
}
