import angular from 'angular';
import Utility from '../../utility/utility.js';
import { PANEL_TYPES } from '../../constants.js';

export default angular
    .module('app.workspace.service', [])
    .factory('workspaceService', workspaceService);

workspaceService.$inject = [
    '$sce',
    '$state',
    '$stateParams',
    '$transitions',
    '$location',
    '$timeout',
    'messageService',
    'storeService',
    'workbookService',
    'ENDPOINT',
];

function workspaceService(
    $sce,
    $state,
    $stateParams,
    $transitions,
    $location: ng.ILocationService,
    $timeout: ng.ITimeoutService,
    messageService: MessageService,
    storeService: StoreService,
    workbookService: WorkbookService,
    ENDPOINT
) {
    const /** Public */
        /** Private */
        _state = {
            workspace: {},
        },
        _popup: {
            insightID: string;
            window: Window | undefined;
            listeners: { (): void }[];
        } = {
            insightID: '',
            window: undefined,
            listeners: [],
        }, // stored seperately because you can't stringify
        _actions = {
            /**
             * @name new-insight
             * @param payload - {insightID}
             * @desc a new insight has been added, react to it
             */
            'new-insight': function (payload: { insightID: string }): void {
                const { insightID } = payload;

                if (
                    $state.current.name === 'embed-terminal' ||
                    $state.current.name === 'insight' ||
                    $state.current.name === 'html'
                ) {
                    // noop
                } else {
                    $state.go('home.build', {
                        insight: insightID,
                    });
                }

                _state.workspace[insightID] = {
                    tab: 'data',
                    menu: {
                        stored: window.innerWidth > 1440 ? 75 : 67,
                        dragged: window.innerWidth > 1440 ? 75 : 67,
                        current: 0,
                        open: false,
                    },
                    terminal: {
                        // general
                        open: false,
                        mode: 'repl',
                        view: 'overlay',
                        // for dragged
                        stored: 40,
                        current: 0,
                        // cache the files
                        files: undefined,
                    },
                    options: {
                        // defaul options for various elements in the workspace
                        panel: {
                            type: PANEL_TYPES.GOLDEN,
                        },
                    },
                    presentation: false, // is this in presentation mode
                };

                messageService.emit('added-workspace', {
                    insightID: insightID,
                });
            },
            /**
             * @name closed-insight
             * @param payload - {insightID}
             * @desc an insight has been closed, react to it
             */
            'closed-insight': function (payload: { insightID: string }): void {
                const { insightID } = payload;

                // delete the popup
                if (_popup) {
                    // remove it, if it is there
                    if (_popup.window) {
                        _popup.window.close();
                    }
                }

                // delete the workspace
                delete _state.workspace[insightID];

                //navigate away
                if (
                    $state.current.name === 'home.build' &&
                    $stateParams &&
                    $stateParams.insight === insightID
                ) {
                    $state.go('home.landing', {
                        insight: insightID,
                    });
                }
            },
            /**
             * @name set-workspace
             * @param payload - {insightID}
             * @desc update the workspace. This should almost never be used.
             */
            'set-workspace': (payload: {
                insightID: string;
                workspace: any;
            }): void => {
                const { insightID, workspace } = payload;

                // force update the insight
                _state.workspace[insightID] = workspace;

                messageService.emit('updated-workspace', {
                    insightID: payload.insightID,
                });
            },
            /**
             * @name change-workspace-menu
             * @param payload - {insightID, options}
             * @desc change the workspace menu
             */
            'change-workspace-menu': function (payload: {
                insightID: string;
                options: {
                    stored: number;
                    dragged: number;
                    current: number;
                    open: boolean;
                };
            }): void {
                const { insightID, options } = payload;

                // if it was previously open, and the drag size is 0, it is closed
                if (options && options.dragged === 0) {
                    options.dragged = options.stored; // reset the drag value to the stored value
                    options.open = false;
                }

                // it was previously closed and now open, use the stored value as the dragged value
                if (!_state.workspace[insightID].menu.open && options.open) {
                    options.current = options.stored;
                } else if (!options.open) {
                    // if it is closed hide it
                    options.current = 0;
                } else {
                    // it was previously open and we are just re-adjusting
                    options.stored = options.dragged; // only store if it it was opened and moved
                    options.current = options.dragged;
                }

                _state.workspace[insightID].menu = options;

                messageService.emit('changed-workspace-menu', {
                    insightID: insightID,
                });
            },
            /**
             * @name open-workspace-terminal
             * @param payload - {insightID}
             * @desc workspace terminal has been updated
             */
            'updated-workspace-terminal': function (payload: {
                insightID: string;
            }): void {
                const { insightID } = payload;

                const terminal = getWorkspace(insightID, 'terminal');

                // open the menu if it is on the side
                if (terminal && terminal.open && terminal.view === 'side') {
                    const menu = getWorkspace(insightID, 'menu');

                    menu.open = true;

                    messageService.emit('change-workspace-menu', {
                        insightID: insightID,
                        options: menu,
                    });
                }
            },
            /**
             * @name open-workspace-terminal
             * @param payload - {insightID}
             * @desc open the workspace terminal
             */
            'open-workspace-terminal': function (payload: {
                insightID: string;
            }): void {
                const { insightID } = payload;

                // mark it as open
                _state.workspace[insightID].terminal.open = true;

                // if the menu is open, make it open on the side
                const menu = getWorkspace(insightID, 'menu');
                if (menu.open) {
                    _state.workspace[insightID].terminal.view = 'side';
                }

                // update based on the view
                _updateTerminal(insightID);

                messageService.emit('updated-workspace-terminal', {
                    insightID: insightID,
                });
            },
            /**
             * @name close-workspace-terminal
             * @param payload - {insightID}
             * @desc close the workspace terminal
             */
            'close-workspace-terminal': function (payload: {
                insightID: string;
            }): void {
                const { insightID } = payload;

                // mark it as closed
                _state.workspace[insightID].terminal.open = false;

                // update based on the view
                _updateTerminal(insightID);

                messageService.emit('updated-workspace-terminal', {
                    insightID: insightID,
                });
            },
            /**
             * @name change-workspace-terminal-options
             * @param payload - {insightID, view, mode}
             * @desc change the workspace options terminal
             */
            'change-workspace-terminal-options': function (payload: {
                insightID: string;
                view?: string;
                mode?: string;
                files?: any[];
            }): void {
                const { insightID } = payload;

                if (payload.hasOwnProperty('view')) {
                    _state.workspace[insightID].terminal.view = payload.view;

                    // update based on the view
                    _updateTerminal(insightID);
                }

                if (payload.hasOwnProperty('mode')) {
                    _state.workspace[insightID].terminal.mode = payload.mode;
                }

                if (payload.hasOwnProperty('files')) {
                    _state.workspace[insightID].terminal.files = payload.files;
                }

                messageService.emit('updated-workspace-terminal', {
                    insightID: insightID,
                });
            },
            /**
             * @name drag-workspace-terminal
             * @param payload - {insightID, dragged}
             * @desc drag the workspace terminal
             */
            'drag-workspace-terminal': function (payload: {
                insightID: string;
                dragged: number;
            }): void {
                const { insightID, dragged } = payload;

                // if the drag size is 0, it is closed
                if (dragged === 0) {
                    _state.workspace[insightID].terminal.current =
                        _state.workspace[insightID].terminal.stored; // reset the current value to the stored value
                    _state.workspace[insightID].terminal.open = false;
                } else {
                    _state.workspace[insightID].terminal.stored = dragged;
                    _state.workspace[insightID].terminal.current = dragged;
                    _state.workspace[insightID].terminal.open = true;
                }

                messageService.emit('updated-workspace-terminal', {
                    insightID: insightID,
                });
            },
            /**
             * @name change-presentation
             * @param payload - {insightID, presentation}
             * @desc change presentation mode, add it or not
             */
            'change-presentation': function (payload: {
                insightID: string;
                presentation: boolean;
            }): void {
                const { insightID, presentation } = payload;

                // only change it if it is different
                if (_state.workspace[insightID].presentation !== presentation) {
                    _state.workspace[insightID].presentation = presentation;

                    messageService.emit('updated-presentation', {
                        insightID: insightID,
                    });
                }
            },
            /**
             * @name updated-presentation
             * @param payload - {insightID}
             * @desc react to changes in presentation mode (yes this can be merged, but if we split its easier)
             */
            'updated-presentation': function (payload: {
                insightID: string;
            }): void {
                const { insightID } = payload;

                // the menu is open, close the it
                if (_state.workspace[insightID].menu.open) {
                    const menu = Utility.freeze(
                        _state.workspace[insightID].menu
                    );

                    menu.open = false;

                    messageService.emit('change-workspace-menu', {
                        insightID: insightID,
                        options: menu,
                    });
                }
            },
            /**
             * @name change-workspace-tab
             * @param payload - {insightID, tab}
             * @desc change the workspace tab to a new one
             */
            'change-workspace-tab': function (payload: {
                insightID: string;
                tab: string;
            }): void {
                const { insightID, tab } = payload;

                if (tab && _state.workspace[insightID].tab !== tab) {
                    _state.workspace[insightID].tab = tab;

                    messageService.emit('changed-workspace-tab', {
                        insightID: insightID,
                    });
                }
            },
        };

    /**
     * @name _updateTerminal
     * @desc terminal view has been openedm closed, or switched
     * @param payload - {insightID}
     */
    function _updateTerminal(insightID: string): void {
        if (_state.workspace[insightID].terminal.open) {
            if (
                _state.workspace[insightID].terminal.view === 'overlay' ||
                _state.workspace[insightID].terminal.view === 'inline' ||
                _state.workspace[insightID].terminal.view === 'side'
            ) {
                _state.workspace[insightID].terminal.current =
                    _state.workspace[insightID].terminal.stored;

                if (_popup.window) {
                    // close it
                    _popup.window.close();
                }
            } else if (_state.workspace[insightID].terminal.view === 'popup') {
                if (_popup.insightID !== insightID) {
                    if (_popup.window) {
                        // close it
                        _popup.window.close();
                    }
                }

                // if its already popped out focus on it
                if (_popup.window) {
                    // focus on it
                    _popup.window.focus();
                } else {
                    // create it
                    _popup.insightID = insightID;

                    // create the window
                    const url =
                        $location.absUrl().split('#')[0] +
                        `#!/terminal?insightID=${_popup.insightID}`;

                    const trustedUrl = $sce.trustAsResourceUrl(url);
                    _popup.window =
                        window.open(
                            trustedUrl,
                            'popup',
                            'height=500px,width=500px'
                        ) || undefined;

                    // add event
                    if (_popup.window) {
                        _popup.window.addEventListener(
                            'message',
                            (message: any) => {
                                let messageObject: any;

                                if (message.origin !== window.location.origin) {
                                    return;
                                }

                                try {
                                    messageObject = JSON.parse(message.data);
                                } catch (e) {
                                    // not a valid message we're expecting so don't process it
                                    return;
                                }

                                // make sure we are working with an object
                                if (typeof messageObject === 'object') {
                                    // check the message to see what we need to do
                                    if (
                                        messageObject.message ===
                                        'semoss-terminal-child'
                                    ) {
                                        // force a sync
                                        messageService.emit(
                                            messageObject.data.message,
                                            messageObject.data.payload
                                        );
                                    }
                                }
                            }
                        );

                        // remove it
                        _popup.window.addEventListener('beforeunload', () => {
                            // remove it, if it is there
                            for (
                                let listenerIdx = 0,
                                    listenerLen = _popup.listeners.length;
                                listenerIdx < listenerLen;
                                listenerIdx++
                            ) {
                                _popup.listeners[listenerIdx]();
                            }

                            // get the insight id we are updating
                            const insightID = _popup.insightID;

                            // clear it
                            _popup.insightID = '';

                            // mark it as closed
                            _popup.window = undefined;

                            // if the view is a popup, its an update
                            if (
                                _state.workspace[insightID].terminal.view ===
                                    'overlay' ||
                                _state.workspace[insightID].terminal.view ===
                                    'inline' ||
                                _state.workspace[insightID].terminal.view ===
                                    'side'
                            ) {
                                messageService.emit(
                                    'updated-workspace-terminal',
                                    {
                                        insightID: insightID,
                                    }
                                );
                            } else {
                                messageService.emit(
                                    'close-workspace-terminal',
                                    {
                                        insightID: insightID,
                                    }
                                );
                            }

                            // trigger a digest
                            $timeout();
                        });

                        // add a listener to send messages back
                        _popup.listeners = [
                            messageService.on(
                                'sync-insight',
                                (payload: { insightID: string }) => {
                                    if (
                                        payload.insightID === _popup.insightID
                                    ) {
                                        const postMessage = {
                                            message: 'semoss-terminal-parent',
                                            data: {
                                                message: 'set-insight',
                                                payload: {
                                                    insightID: _popup.insightID,
                                                    shared: storeService.getShared(
                                                        _popup.insightID
                                                    ),
                                                },
                                            },
                                        };

                                        // let opener window know insight has been loaded
                                        if (_popup.window) {
                                            _popup.window.postMessage(
                                                JSON.stringify(postMessage),
                                                ENDPOINT.URL
                                            );
                                        }
                                    }
                                }
                            ),
                            messageService.on(
                                'sync-insight',
                                (payload: { insightID: string }) => {
                                    if (
                                        payload.insightID === _popup.insightID
                                    ) {
                                        const postMessage = {
                                            message: 'semoss-terminal-parent',
                                            data: {
                                                message: 'set-workspace',
                                                payload: {
                                                    insightID: _popup.insightID,
                                                    workspace: getWorkspace(
                                                        _popup.insightID
                                                    ),
                                                },
                                            },
                                        };

                                        // let opener window know insight has been loaded
                                        if (_popup.window) {
                                            _popup.window.postMessage(
                                                JSON.stringify(postMessage),
                                                ENDPOINT.URL
                                            );
                                        }
                                    }
                                }
                            ),
                        ];
                    }
                }
            }
        } else {
            if (
                _state.workspace[insightID].terminal.view === 'overlay' ||
                _state.workspace[insightID].terminal.view === 'inline' ||
                _state.workspace[insightID].terminal.view === 'side'
            ) {
                //noop
            } else if (_state.workspace[insightID].terminal.view === 'popup') {
                if (_popup.window) {
                    // close it
                    _popup.window.close();
                }
            }
        }
    }

    /** Public */
    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        // close when we switch away from the insight
        $transitions.onSuccess({}, function () {
            if (_popup.window && _popup.insightID !== $stateParams.insight) {
                // close it
                _popup.window.close();
            }
        });

        // close it when we close the page
        window.addEventListener('beforeunload', () => {
            if (_popup.window) {
                // close it
                _popup.window.close();
            }
        });

        // register the selected to force conformity
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    /**
     * @name get
     * @param {string} accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns {*} value of the requested object
     */
    function get(accessor?: string): any {
        return Utility.getter(_state, accessor);
    }

    /**
     * @name getWorkspace
     * @param {string} insightID - id of the the insight to grab information for
     * @param {string} accessor - string to get to the object. In the form of 'a.b.c'
     * @returns value of the requested object
     */
    function getWorkspace(insightID: string, accessor?: string): any {
        if (!_state.workspace[insightID]) {
            return undefined;
        }

        return Utility.getter(_state.workspace[insightID], accessor);
    }

    /**
     * @name saveWorkspace
     * @param insightID - id of the the insight to save
     * @desc save the configuration for the current workspace
     * @returns config
     */
    function saveWorkspace(insightID: string): {
        panels?: {
            string: {
                config?: {
                    type?: string;
                    backgroundColor?: string;
                    opacity?: number;
                    top?: number;
                    left?: number;
                    height?: number;
                    width?: number;
                    zIndex?: number;
                };
            };
        };
        sheets?: {
            string: {
                backgroundColor?: string;
                hideHeaders?: boolean;
                hideGutters?: boolean;
                gutterSize?: number;
                height?: string;
                width?: string;
                golden?: any;
            };
        };
        sheet?: string;
        presentation?: boolean;
    } {
        if (!_state.workspace[insightID]) {
            return {};
        }

        const config = workbookService.saveWorkbook(insightID);

        // add presentation mode if true
        if (_state.workspace[insightID].presentation) {
            config.presentation = _state.workspace[insightID].presentation;
        }

        return config;
    }

    return {
        initialize: initialize,
        get: get,
        getWorkspace: getWorkspace,
        saveWorkspace: saveWorkspace,
    };
}
