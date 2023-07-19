import Utility from '../../utility/utility.js';
import Pixel from '../../store/pixel/pixel.js';
import Visualization from '../../store/visualization/visualization.js';
import { PANEL_TYPES, THEME, FONT_FAMILY } from '../../constants.js';

import angular from 'angular';

export default angular
    .module('app.store.service', [])
    .factory('storeService', storeService);

storeService.$inject = [
    '$state',
    '$q',
    'messageService',
    'widgetService',
    'monolithService',
    'optionsService',
    'VIZ_COLORS',
];

function storeService(
    $state,
    $q: ng.IQService,
    messageService: MessageService,
    widgetService: WidgetService,
    monolithService: MonolithService,
    optionsService: OptionsService,
    VIZ_COLORS: any
) {
    enum GENERATE {
        REFRESH = 'refresh',
        LOAD = 'load',
        AUTO = 'auto',
        REFRESH_INSIGHT = 'refreshInsight',
    }
    /** * Private */
    // TODO: Seperate into seperate stores.
    const _state = {
            // current store
            queryInsightID: '',
            state: {},
            widgetIdentifier: 0,
            widgets: {},
            shared: {},
        },
        _actions = {
            'execute-pixel': (payload: PixelPayload): void => {
                let builtCommand = '',
                    queuedCommands: PixelCommand[] = [];

                // loop through the commandList to remove any 'refresh' types because we are handling them differently...
                // remove them from the commandList after storing them in refreshArray to process separately.
                // TODO should find a better way to handle special types of queries we're trying to build
                for (let i = 0; i < payload.commandList.length; i++) {
                    if (payload.commandList[i].type === GENERATE.REFRESH) {
                        // console.log('TODO: Clean the refresh');
                        // TODO: Clean the refesh so it maps to an object (not an array) and uses keys appropriately...
                        builtCommand += generate(GENERATE.REFRESH, {
                            widgetIds: [payload.commandList[i].components[0]],
                            replacements: payload.commandList[i].components[1],
                            meta: payload.commandList[i].meta,
                            force: payload.commandList[i].components[2],
                        });
                    } else if (payload.commandList[i].type === GENERATE.LOAD) {
                        console.log('TODO: Clean the load');
                        // TODO: Clean the refesh so it maps to an object (not an array) and uses keys appropriately...
                        builtCommand += generate(GENERATE.LOAD, {
                            widgetIds: [payload.commandList[i].components[0]],
                            meta: payload.commandList[i].meta,
                        });
                    } else if (payload.commandList[i].type === GENERATE.AUTO) {
                        builtCommand += generate(GENERATE.AUTO, {
                            widgetIds: [payload.commandList[i].components[0]],
                            meta: payload.commandList[i].meta,
                        });
                    } else if (
                        payload.commandList[i].type === GENERATE.REFRESH_INSIGHT
                    ) {
                        builtCommand += generate(GENERATE.REFRESH_INSIGHT, {
                            insightID: payload.commandList[i].components[0],
                            meta: payload.commandList[i].meta,
                        });
                    } else {
                        queuedCommands.push(payload.commandList[i]);
                        if (payload.commandList[i].terminal) {
                            builtCommand += Pixel.build(queuedCommands);
                            queuedCommands = [];
                        }
                    }
                }

                if (builtCommand.length <= 1) {
                    // command is empty or a semicolon
                    // Dont execute and return
                    return;
                }

                // turn on loading
                let stopPolling;
                if (payload.insightID) {
                    stopPolling = startPolling(
                        payload.insightID,
                        payload.listeners
                    );
                }

                // now we can execute the Pixel
                monolithService
                    .runPixel(
                        payload.insightID,
                        builtCommand,
                        undefined,
                        payload.disableLogging
                    )
                    .then(
                        (response) => {
                            messageService.emit('update-pixel', {
                                pixelReturn: response.pixelReturn,
                                insightID: payload.insightID,
                                direction: payload.direction,
                            });

                            runPixelSuccess(payload, response);

                            if (stopPolling) {
                                stopPolling();
                            }
                        },
                        (error) => {
                            runPixelError('execute-pixel', payload, error);

                            if (stopPolling) {
                                stopPolling();
                            }
                        }
                    );
            },
            'update-pixel': (payload: {
                insightID: string; //insightID that the pixel was run on
                pixelReturn: any[]; //return from the pixel
                recipe?: any[]; // steps that were run
                fromOpen?: boolean;
                direction?: string; // direction of the pixel
                insight?: any; //meta data to add to the insiht
            }): void => {
                let insightID: string,
                    pixelReturn: any[],
                    type: string,
                    output: string,
                    expression: string,
                    meta: boolean,
                    changes: PixelChange;

                insightID = payload.insightID;
                pixelReturn = payload.pixelReturn || [];

                // set the initial state
                changes = {
                    insight: {},
                    alerts: [],
                    frames: {},
                    selected: undefined,
                    worksheets: {},
                    panels: {},
                    messages: [],
                };

                // we do this because we do not want to create a new insight object for a temp insight (sent with false) or the queryInsight
                if (insightID && insightID !== _state.queryInsightID) {
                    // create a new insight object if it isn't there
                    if (!_state.shared[insightID]) {
                        newInsight(insightID, payload.insight || {});

                        changes.insight = {
                            new: true,
                        };
                    }

                    // update the insight object with the required steps
                    // insightID has to already be there
                    _state.shared[insightID].initialized = true;

                    // update the recipe
                    if (payload.direction === 'backward') {
                        _state.shared[insightID].step = -1;
                    }

                    if (payload.recipe) {
                        // full list of steps are being passed back so we will use this one
                        // otherwise we'd only have the steps for the cached version
                        for (
                            let recipeIdx = 0;
                            recipeIdx < payload.recipe.length;
                            recipeIdx++
                        ) {
                            _state.shared[insightID].steps.push({
                                type: '',
                                output: '',
                                expression: payload.recipe[recipeIdx],
                            });

                            _state.shared[insightID].step++;
                        }
                    } else {
                        for (
                            let i = 0, len = pixelReturn.length;
                            i < len;
                            i++
                        ) {
                            // easy mapping to the output object
                            output = pixelReturn[i].output;
                            type = pixelReturn[i].operationType;
                            expression = pixelReturn[i].pixelExpression;
                            meta = pixelReturn[i].isMeta;

                            // update the insight information... if it is not meta
                            if (!meta) {
                                _state.shared[insightID].step++;

                                // add the result (if we need to)
                                if (!payload.direction) {
                                    // shorten when it is not meta and when there are additional steps
                                    _state.shared[insightID].steps.length =
                                        _state.shared[insightID].step;

                                    _state.shared[insightID].steps.push({
                                        type: type,
                                        output: JSON.stringify(
                                            output,
                                            null,
                                            '\t'
                                        ), // pretty prints it for the console. TODO: trim in the console
                                        expression: expression,
                                    });
                                }
                            }
                        }
                    }
                }

                processChanges(changes, pixelReturn, insightID);

                // console.error(`
                // Fix:
                // Remove: FRAME_PLACEHOLDER and allow it to go off the frame

                // Check messages:
                // update-frame, check the inputs (frame + insightID, not widgetId)
                // update-frame-filter, check the inputs (frame + insightID, not widgetId)
                // alter-database, it uses widgetID make it go off of insightID
                // visualization-recommendations-received, it uses widgetID make it go off of insightID
                // does clone need its own message?
                // Remove widgetId

                // Nice to have:
                // Refactor to TS
                // `)

                // NEW STUFF
                if (changes.insight.new) {
                    messageService.emit('new-insight', {
                        insightID: insightID,
                        cached: changes.cached || false,
                    });
                }

                if (changes.insight.saved) {
                    messageService.emit('saved-insight', {
                        insightID: insightID,
                    });
                }

                if (changes.insight.closed) {
                    messageService.emit('closed-insight', {
                        insightID: insightID,
                    });
                }

                // we only update if it is a new insight, or we are updating an existing insight
                if (!changes.insight.closed) {
                    const refresh: { frame?: [] } = {};

                    for (
                        let alertIdx = 0, alertLen = changes.alerts.length;
                        alertIdx < alertLen;
                        alertIdx++
                    ) {
                        messageService.emit('alert', {
                            // called to send a lert to the user
                            color: changes.alerts[alertIdx].color,
                            text: changes.alerts[alertIdx].text,
                            insightID: insightID,
                        });
                    }

                    // message out miscellations miscellaneous
                    for (
                        let messageIdx = 0,
                            messageLen = changes.messages.length;
                        messageIdx < messageLen;
                        messageIdx++
                    ) {
                        messageService.emit(
                            changes.messages[messageIdx].message,
                            changes.messages[messageIdx].payload
                        );
                    }

                    //TODO: remove FRAME_PLACEHOLDER
                    // message out frame change notifications
                    let updateFrame = false,
                        updateFrameFilter = false;

                    for (const frame in changes.frames) {
                        if (changes.frames.hasOwnProperty(frame)) {
                            if (changes.frames[frame].updated) {
                                // called when the frame has change and we want to notify that it has changed
                                // TODO: move to insight level
                                // messageService.emit('update-frame', {
                                //     insightID: insightID,
                                //     frame: frame
                                // });

                                updateFrame = true;
                            }

                            if (changes.frames[frame].removed) {
                                // called when the frame has change and we want to notify that it has changed
                                messageService.emit('update-frame', {
                                    insightID: insightID,
                                    frame: frame,
                                });

                                updateFrame = true;
                            }

                            if (changes.frames[frame].headersChanged) {
                                // called to fetch new frame headers
                                console.error(
                                    'TODO: GET NEW HEADERS FROM THE UI'
                                );
                            }

                            if (changes.frames[frame].filtered) {
                                // called when the frame has been filtered
                                messageService.emit('update-frame-filter', {
                                    insightID: insightID,
                                    frame: frame,
                                });

                                updateFrameFilter = true;
                            }
                        }
                    }

                    //    ____          _   _       _     _____                _
                    //   |  _ \  ___   | \ | | ___ | |_  |_   _|__  _   _  ___| |__
                    //   | | | |/ _ \  |  \| |/ _ \| __|   | |/ _ \| | | |/ __| '_ \
                    //   | |_| | (_) | | |\  | (_) | |_    | | (_) | |_| | (__| | | |
                    //   |____/ \___/  |_| \_|\___/ \__|   |_|\___/ \__,_|\___|_| |_|
                    //
                    // THE ORDER IS VERY IMPORTANT!!!!!

                    // sheet updates
                    for (const sheetId in changes.worksheets) {
                        if (changes.worksheets.hasOwnProperty(sheetId)) {
                            // THE ORDER IS VERY IMPORTANT!!!!!
                            if (changes.worksheets[sheetId].closed) {
                                // delete from widgets
                                messageService.emit('close-worksheet', {
                                    insightID: insightID,
                                    sheetId: sheetId,
                                });

                                // this panel was closed, it shouldn't matter
                                continue;
                            }

                            if (changes.worksheets[sheetId].added) {
                                messageService.emit('add-worksheet', {
                                    insightID: insightID,
                                    sheetId: sheetId,
                                    worksheet:
                                        changes.worksheets[sheetId].worksheet ||
                                        {},
                                });
                            }

                            // update the configuration
                            if (changes.worksheets[sheetId].configured) {
                                messageService.emit('configure-worksheet', {
                                    insightID: insightID,
                                    sheetId: sheetId,
                                    worksheet:
                                        changes.worksheets[sheetId].worksheet ||
                                        {},
                                });
                            }
                        }
                    }

                    //TODO: remove and consolidate to the insight level
                    // old widget updates....
                    for (const widgetId in _state.widgets) {
                        if (_state.widgets.hasOwnProperty(widgetId)) {
                            if (
                                _state.widgets[widgetId].insightID === insightID
                            ) {
                                const panelId =
                                    _state.widgets[widgetId].panelId;

                                console.warn(
                                    'Message update-frame off of insight'
                                );
                                if (updateFrame) {
                                    messageService.emit('update-frame', {
                                        widgetId: widgetId,
                                    });
                                }
                                console.warn(
                                    'Message update-frame-filter off of insight'
                                );
                                if (updateFrameFilter) {
                                    messageService.emit('update-frame-filter', {
                                        widgetId: widgetId,
                                    });
                                }
                            }
                        }
                    }

                    // panel updates
                    for (const panelId in changes.panels) {
                        if (changes.panels.hasOwnProperty(panelId)) {
                            const widgetId = `SMSSWidget${insightID}___${panelId}`;

                            // close the panel
                            if (changes.panels[panelId].closed) {
                                messageService.emit('close-panel', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                });

                                continue;
                            }

                            // add a panel. If the panel is there, reset the data
                            if (changes.panels[panelId].added) {
                                messageService.emit('add-panel', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                    panel: changes.panels[panelId].panel || {},
                                    view: _state.widgets[widgetId].active,
                                });

                                // when adding a new panel and running a new task in the same thread, need to check to see if we need to
                                // update the task, otherwise the task wont update.
                                if (changes.panels[panelId].newTask) {
                                    messageService.emit('update-task', {
                                        insightID: insightID,
                                        panelId: panelId,
                                        widgetId: widgetId,
                                    });
                                }

                                continue;
                            }

                            // update the configuration
                            if (changes.panels[panelId].configured) {
                                messageService.emit('configure-panel', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                    panel: changes.panels[panelId].panel || {},
                                });
                            }

                            if (changes.panels[panelId].events) {
                                messageService.emit('update-events', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                });
                            }

                            if (changes.panels[panelId].filtered) {
                                messageService.emit('update-panel-filter', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                });
                            }

                            // message out the new task, if it updates, the rest update accordingly
                            if (changes.panels[panelId].newTask) {
                                messageService.emit('update-task', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                });

                                continue; //  new task, it should cascade
                            }

                            if (changes.panels[panelId].view) {
                                messageService.emit('update-view', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                });
                            }

                            if (changes.panels[panelId].ornaments) {
                                messageService.emit('update-ornaments', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                });
                            }

                            if (changes.panels[panelId].updatedTask) {
                                messageService.emit('added-data', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                });
                            }

                            if (changes.panels[panelId].colorByValue) {
                                messageService.emit('update-color-by-value', {
                                    insightID: insightID,
                                    panelId: panelId,
                                    widgetId: widgetId,
                                });
                            }
                        }
                    }

                    // check if we need to refresh any of the visuals
                    for (const widgetId in _state.widgets) {
                        if (_state.widgets.hasOwnProperty(widgetId)) {
                            if (
                                _state.widgets[widgetId].insightID === insightID
                            ) {
                                const panelId =
                                    _state.widgets[widgetId].panelId;

                                // for the panel, check the frame that task that was run,
                                // if it is recorded in the changes.frame object, then we ran the task AFTER the frame was updated
                                // if it isn't there we have to refresh it
                                // this is the frame that the panel is working on

                                //let frame = _state.widgets[widgetId].frame;
                                let frame = 'FRAME_PLACEHOLDER',
                                    validTask = true; // by default the task is valid, since the frame may not have changed

                                if (changes.frames.hasOwnProperty(frame)) {
                                    // the task was run AFTER the frame was updated, so it is still valid
                                    if (
                                        changes.frames[frame].tasks &&
                                        changes.frames[frame].tasks.indexOf(
                                            panelId
                                        ) > -1
                                    ) {
                                        validTask = true;
                                    } else {
                                        validTask = false;
                                    }
                                }

                                if (!validTask) {
                                    if (!refresh.hasOwnProperty(frame)) {
                                        refresh[frame] = [];
                                    }

                                    // add it if it doesn't exist
                                    if (
                                        refresh[frame].indexOf(
                                            _state.widgets[widgetId].panelId
                                        ) === -1
                                    ) {
                                        refresh[frame].push(
                                            _state.widgets[widgetId].panelId
                                        );
                                    }
                                }
                            }
                        }
                    }

                    // refresh the remaining visualizations
                    for (const frame in refresh) {
                        if (refresh.hasOwnProperty(frame)) {
                            for (
                                let panelIdx = 0,
                                    panelLen = refresh[frame].length;
                                panelIdx < panelLen;
                                panelIdx++
                            ) {
                                const widgetId = findWidget(
                                    insightID,
                                    refresh[frame][panelIdx]
                                );
                                messageService.emit('refresh-task', {
                                    insightID: insightID,
                                    panelId: refresh[frame][panelIdx],
                                    widgetId: widgetId,
                                });
                            }
                        }
                    }

                    // select the worksheet that should be open
                    if (typeof changes.selected !== 'undefined') {
                        messageService.emit('select-worksheet', {
                            insightID: insightID,
                            sheetId: changes.selected,
                        });
                    }

                    // open in presentation?
                    if (typeof changes.presentation !== 'undefined') {
                        messageService.emit('change-presentation', {
                            insightID: insightID,
                            presentation: changes.presentation,
                        });
                    }
                }

                // always run, since the insight is changed
                messageService.emit('sync-insight', {
                    insightID: insightID,
                });
            },
            close: (payload: { widgetId: string; closeAll: boolean }): void => {
                let widgets: any[],
                    panelId: string = getWidget(payload.widgetId, 'panelId'),
                    insightID: string = getWidget(
                        payload.widgetId,
                        'insightID'
                    ),
                    type: string = getShared(insightID, 'type'),
                    commandList: PixelCommand[],
                    drop: boolean,
                    closeUnfilter = false,
                    unfilterPanelId = -1;

                if (type === 'insight' || type === 'form') {
                    widgets = get('widgets');
                    commandList = [];
                    drop = true;

                    // if we are coming from delete-sheet in sheets service there is no way to give
                    // an accurate count of dashboard filters and therefore no way to close
                    // and unfilter button correctly.
                    // when coming from delete-sheet in sheets we will just iterate thru each one anyway
                    // so ignore this logic
                    if (
                        widgets[payload.widgetId].active ===
                            'DashboardFilter' &&
                        !payload.closeAll
                    ) {
                        const widgetKeys = Object.keys(widgets),
                            numDashboards = widgetKeys.filter(
                                (id) => widgets[id].active === 'DashboardFilter'
                            ).length;
                        if (numDashboards === 1) {
                            for (let i = 0; i < widgetKeys.length; i++) {
                                const widget = widgets[widgetKeys[i]];
                                if (widget.meta.subType === 'UNFILTER') {
                                    unfilterPanelId = widget.panelId;
                                    // in case user has closed it themselves, we cant assume there will be an unfilter to close
                                    closeUnfilter = widget.panelId >= 0;
                                }
                            }
                        }
                    }
                    // check the number to know which pixel to run
                    for (const i in widgets) {
                        if (widgets.hasOwnProperty(i)) {
                            if (
                                widgets[i].insightID === insightID &&
                                widgets[i].widgetId !== payload.widgetId
                            ) {
                                drop = false;
                                break;
                            }
                        }
                    }

                    if (drop) {
                        commandList.push({
                            type: 'dropInsight',
                            components: [],
                            terminal: true,
                        });
                    } else {
                        commandList.push({
                            type: 'closePanel',
                            components: [panelId],
                            terminal: true,
                        });
                        if (closeUnfilter) {
                            commandList.push({
                                type: 'closePanel',
                                components: [unfilterPanelId],
                                terminal: true,
                            });
                        }
                    }

                    if (type === 'form') {
                        deletePanel(insightID, panelId);
                    }

                    messageService.emit('execute-pixel', {
                        insightID: insightID,
                        commandList: commandList,
                    });
                } else if (type === 'playsheet') {
                    deletePanel(insightID, panelId);
                } else {
                    console.error('TODO:', type);
                }
            },
            'close-widget': (payload: { widgetId: string }): void => {
                messageService.emit('close', {
                    widgetId: payload.widgetId,
                });
            },
            'close-all': (): void => {
                const promises: ng.IPromise<any>[] = [];

                // drop the queryInsightID
                if (_state.queryInsightID) {
                    const deferred = $q.defer();
                    monolithService
                        .runPixel(_state.queryInsightID, 'DropInsight();')
                        .then(
                            () => {
                                deferred.resolve();
                            },
                            () => {
                                deferred.resolve();
                            }
                        );

                    promises.push(deferred.promise);
                }

                for (const insightID in _state.shared) {
                    if (_state.shared.hasOwnProperty(insightID)) {
                        const deferred = $q.defer();
                        monolithService
                            .runPixel(
                                _state.shared[insightID].insightID,
                                'DropInsight();'
                            )
                            .then(
                                function () {
                                    deferred.resolve();
                                },
                                function () {
                                    deferred.resolve();
                                }
                            );

                        promises.push(deferred.promise);
                    }
                }

                $q.all(promises).then(function () {
                    messageService.emit('close-all-complete');
                });
            },
            open: (payload: {
                type: string;
                newSheet: boolean;
                options: any;
            }): void => {
                let temp: string[];
                // TODO:find a better place to load all of the default panel settings (events, tools, etc.)
                if (payload.type === 'new') {
                    temp = Pixel.build([
                        {
                            type: 'addSheet',
                            components: [0, '0'],
                            terminal: true,
                        },
                        {
                            type: 'addPanel',
                            components: [0, '0'],
                            terminal: true,
                        },
                        {
                            type: 'panel',
                            components: [0],
                        },
                        {
                            type: 'addPanelConfig',
                            components: [
                                {
                                    type: PANEL_TYPES.GOLDEN,
                                },
                            ],
                            terminal: true,
                        },
                        {
                            type: 'panel',
                            components: [0],
                        },
                        {
                            type: 'addPanelEvents',
                            components: [
                                {
                                    onSingleClick: {
                                        Unfilter: [
                                            {
                                                panel: '',
                                                query: '<encode>(<Frame> | UnfilterFrame(<SelectedColumn>));</encode>',
                                                options: {},
                                                refresh: false,
                                                default: true,
                                                disabledVisuals: [
                                                    'Grid',
                                                    'Sunburst',
                                                ],
                                                disabled: false,
                                            },
                                        ],
                                    },
                                    onBrush: {
                                        Filter: [
                                            {
                                                panel: '',
                                                query: '<encode>if((IsEmpty(<SelectedValues>)),(<Frame> | UnfilterFrame(<SelectedColumn>)), (<Frame> | SetFrameFilter(<SelectedColumn>==<SelectedValues>)));</encode>',
                                                options: {},
                                                refresh: false,
                                                default: true,
                                                disabled: false,
                                            },
                                        ],
                                    },
                                },
                            ],
                            terminal: true,
                        },
                        {
                            type: 'panel',
                            components: [0],
                        },
                        {
                            type: 'retrievePanelEvents',
                            components: [],
                            terminal: true,
                        },
                        {
                            type: 'panel',
                            components: [0],
                        },
                        {
                            type: 'setPanelView',
                            components: [
                                'visualization',
                                {
                                    type: 'echarts',
                                },
                            ],
                            terminal: true,
                        },
                        {
                            type: 'panel',
                            components: [0],
                        },
                        {
                            type: 'setPanelView',
                            components: ['pipeline'],
                            terminal: true,
                        },
                    ]);

                    messageService.emit('execute-pixel', {
                        insightID: _state.queryInsightID,
                        commandList: [
                            {
                                meta: true,
                                type: 'openEmptyInsight',
                                components: [temp],
                                terminal: true,
                            },
                        ],
                    });
                } else if (payload.type === 'pixel') {
                    temp = payload.options.pixel;

                    messageService.emit('execute-pixel', {
                        insightID: _state.queryInsightID,
                        commandList: [
                            {
                                meta: true,
                                type: 'openEmptyInsight',
                                components: [temp],
                                terminal: true,
                            },
                        ],
                    });
                } else if (payload.type === 'insight') {
                    const openedInsight = _getOpenedInsight(
                        payload.options.app_id,
                        payload.options.app_insight_id
                    );
                    if (openedInsight) {
                        messageService.emit('redirect-insight', {
                            appId: payload.options.app_id,
                            appInsightId: payload.options.app_insight_id,
                            insightId: openedInsight,
                            callback: _openInsight,
                        });
                    } else {
                        _openInsight();
                    }

                    // execute pixel to open insight
                    function _openInsight() {
                        messageService.emit('execute-pixel', {
                            insightID: _state.queryInsightID,
                            commandList: [
                                {
                                    meta: true,
                                    type: 'openInsight',
                                    components: [
                                        payload.options.app_id,
                                        payload.options.app_insight_id,
                                        payload.options.parameters,
                                        payload.options.postQuery
                                            ? `${payload.options.postQuery}ReadInsightTheme();`
                                            : 'ReadInsightTheme();',
                                        payload.options.useExistingInsight,
                                    ],
                                    terminal: true,
                                },
                            ],
                        });
                    }

                    // check to see if this insight is already opened--if so we want to ask user if they want to go to the exiting or open new instance
                    function _getOpenedInsight(appId, appInsightId) {
                        let openedInsights = get('shared'),
                            openedInsight = '';

                        for (const id in openedInsights) {
                            if (openedInsights.hasOwnProperty(id)) {
                                if (
                                    openedInsights[id].insight.app_id ===
                                        appId &&
                                    openedInsights[id].insight
                                        .app_insight_id === appInsightId
                                ) {
                                    openedInsight = id;
                                    break;
                                }
                            }
                        }

                        return openedInsight;
                    }
                } else if (payload.type === 'form') {
                    // create a new widget
                    const message = Utility.random('meta');

                    messageService.on(message, function (importPayload) {
                        newPanel(
                            importPayload.pixelReturn[0].output.insightData
                                .insightID,
                            '0',
                            {
                                title: 'New Form',
                            }
                        );
                    });

                    messageService.emit('execute-pixel', {
                        insightID: _state.queryInsightID,
                        commandList: [
                            {
                                meta: true,
                                type: 'openEmptyInsight',
                                components: [],
                                terminal: true,
                            },
                        ],
                        responseObject: {
                            response: message,
                            payload: {},
                        },
                    });
                } else {
                    console.error('TODO:', payload.type, payload.options);
                }
            },
            'navigate-pixel': (payload: {
                insightID: string;
                stepIdx: number;
            }): void => {
                let shared = getShared(payload.insightID),
                    commandList: PixelCommand[] = [],
                    stepsLength: number = shared.steps.length,
                    direction = '';

                if (
                    shared.step === payload.stepIdx ||
                    payload.stepIdx > stepsLength - 1
                ) {
                    // no need to do anything .. not a valid step
                    messageService.emit('sync-insight', {
                        insightID: payload.insightID,
                    });
                    return;
                } else if (shared.step < payload.stepIdx) {
                    // forward
                    direction = 'forward';

                    for (
                        let i = shared.step + 1;
                        i <= payload.stepIdx && i < stepsLength;
                        i++
                    ) {
                        commandList.push({
                            type: 'Pixel',
                            components: [shared.steps[i].expression],
                            terminal: true,
                        });
                    }
                } else {
                    // backward
                    for (
                        let i = 0;
                        i <= payload.stepIdx && i < stepsLength;
                        i++
                    ) {
                        // only clear if it is a valid backwards step
                        if (commandList.length === 0) {
                            direction = 'backward';

                            commandList.push({
                                type: 'clearInsight',
                                components: [],
                                terminal: true,
                                meta: true,
                            });
                        }
                        commandList.push({
                            type: 'Pixel',
                            components: [shared.steps[i].expression],
                            terminal: true,
                        });
                    }
                }

                if (commandList.length > 0) {
                    messageService.emit('execute-pixel', {
                        insightID: payload.insightID,
                        commandList: commandList,
                        direction: direction,
                    });
                } else {
                    console.error('Investigate why navigatePixel was called');
                }
            },
            'set-insight': (payload: {
                insightID: string;
                shared: any;
            }): void => {
                const { insightID, shared } = payload;

                // force update the insight
                _state.shared[insightID] = shared;

                messageService.emit('sync-insight', {
                    insightID: payload.insightID,
                });
            },
            'refresh-insight': (payload: any): void => {
                const query = generate(GENERATE.REFRESH_INSIGHT, payload);
                // TODO message service and emit as execute pixel
                messageService.emit('execute-pixel', {
                    commandList: [
                        {
                            type: 'Pixel',
                            components: [query],
                            terminal: true,
                        },
                    ],
                    insightID: payload.insightID,
                });
            },
            'refresh-task': (payload: {
                widgetId: string;
                meta?: boolean;
            }): void => {
                messageService.emit('execute-pixel', {
                    insightID: getWidget(payload.widgetId, 'insightID'),
                    commandList: [
                        {
                            type: 'refresh',
                            components: [payload.widgetId],
                            terminal: true,
                            meta: payload.meta === false ? payload.meta : true,
                        },
                    ],
                    listeners: [payload.widgetId],
                });
            },
            refresh: (payload: { widgetIds: string[] }): void => {
                const query: string = generate(GENERATE.REFRESH, payload),
                    insightID: string = getWidget(
                        payload.widgetIds[0],
                        'insightID'
                    );

                // message service and emit as execute pixel
                messageService.emit('execute-pixel', {
                    commandList: [
                        {
                            type: 'Pixel',
                            components: [query],
                            terminal: true,
                        },
                    ],
                    insightID: insightID,
                });
            },
            'query-pixel': (payload: PixelPayload): void => {
                const builtCommand = Pixel.build(payload.commandList);

                if (builtCommand.length <= 1) {
                    // command is empty or a semicolon
                    // Dont execute and return
                    return;
                }

                // update the id
                payload.insightID = payload.insightID || _state.queryInsightID;

                // turn on loading
                let stopPolling;
                if (payload.insightID) {
                    stopPolling = startPolling(
                        payload.insightID,
                        payload.listeners
                    );
                }

                // now we can execute the Pixel
                monolithService.runPixel(payload.insightID, builtCommand).then(
                    (response) => {
                        checkMessages(response.pixelReturn || []);

                        if (payload.response) {
                            messageService.emit(payload.response, response);
                        }

                        runPixelSuccess(payload, response);

                        if (stopPolling) {
                            stopPolling();
                        }
                    },
                    (error) => {
                        // fake the error
                        if (payload.response) {
                            messageService.emit(payload.response, {
                                pixelReturn: [
                                    {
                                        output: error,
                                        operationType: ['ERROR'],
                                    },
                                ],
                            });
                        }

                        runPixelError('query-pixel', payload, error);

                        if (stopPolling) {
                            stopPolling();
                        }
                    }
                );
            },
            'meta-pixel': (payload: PixelPayload): void => {
                const builtCommand = Pixel.build(payload.commandList);

                if (builtCommand.length <= 1) {
                    // command is empty or a semicolon
                    // Dont execute and return
                    return;
                }

                // turn on loading
                let stopPolling;
                if (payload.insightID) {
                    stopPolling = startPolling(
                        payload.insightID,
                        payload.listeners
                    );
                }

                // now we can execute the Pixel
                monolithService
                    .runPixel(
                        payload.insightID,
                        builtCommand,
                        undefined,
                        payload.disableLogging
                    )
                    .then(
                        (response) => {
                            checkMessages(response.pixelReturn || []);

                            if (payload.response) {
                                messageService.emit(payload.response, response);
                            }

                            runPixelSuccess(payload, response);

                            if (stopPolling) {
                                stopPolling();
                            }
                        },
                        (error) => {
                            // fake the error
                            if (payload.response) {
                                messageService.emit(payload.response, {
                                    pixelReturn: [
                                        {
                                            output: error,
                                            operationType: ['ERROR'],
                                        },
                                    ],
                                });
                            }

                            runPixelError('meta-pixel', payload, error);

                            if (stopPolling) {
                                stopPolling();
                            }
                        }
                    );
            },
            'change-insight-name': function (payload: {
                insightID: string;
                name: string;
            }): void {
                _state.shared[payload.insightID].insight.name = payload.name;

                messageService.emit('changed-insight-name', {
                    insightID: payload.insightID,
                });
            },
        };

    /**
     * @name checkMessages
     * @param response - current response
     * @desc checks to see if there are any messages and alert
     */
    function checkMessages(response: any[]) {
        // Need this to reassign the param
        for (
            let responseIdx = 0, responseLen = response.length;
            responseIdx < responseLen;
            responseIdx++
        ) {
            // easy mapping to the output object
            const output = response[responseIdx].output,
                type = response[responseIdx].operationType,
                expression = response[responseIdx].pixelExpression;

            for (
                let typeIdx = 0, typeLen = type.length;
                type && typeIdx < typeLen;
                typeIdx++
            ) {
                if (
                    type[typeIdx] === 'CODE_EXECUTION' ||
                    type[typeIdx] === 'VECTOR'
                ) {
                    // this is nested
                    if (output !== 'no output') {
                        checkMessages(output);
                    } else {
                        console.error(
                            `Error: Unknown response type: ${type[typeIdx]} with response: ${output}`
                        );
                    }
                } else if (type[typeIdx] === 'SUCCESS') {
                    messageService.emit('alert', {
                        color: 'success',
                        text: output,
                    });
                } else if (type[typeIdx] === 'WARNING') {
                    messageService.emit('alert', {
                        color: 'warn',
                        text: output,
                    });
                } else if (type[typeIdx] === 'ERROR') {
                    if (output && typeof output === 'string') {
                        messageService.emit('alert', {
                            color: 'error',
                            text: output,
                        });
                        console.error(output);
                    } else if (output && output.errorData) {
                        if (output.errorData.message) {
                            messageService.emit('alert', {
                                color: 'error',
                                text: output.errorData.message,
                            });

                            console.error(output.errorData.message);
                        }
                    }
                }
            }

            // This was run 'after' the current step
            if (response[responseIdx].additionalOutput) {
                checkMessages(response[responseIdx].additionalOutput);
            }
        }
    }

    /**
     * @name generateQueryInsightID
     * @desc open a new insight to generate the query insightID
     */
    function generateQueryInsightID(): ng.IPromise<any> {
        const deferred = $q.defer();

        // clear out the old one
        _state.queryInsightID = '';

        const message = Utility.random('initialize-store');
        // create the fake insight to query off of
        messageService.once(
            message,
            (response: { insightID: string }): void => {
                if (response.insightID) {
                    _state.queryInsightID = response.insightID;
                }

                deferred.resolve();
            }
        );

        // generate a new insightID via a pixel
        messageService.emit('query-pixel', {
            insightID: 'new',
            commandList: [
                {
                    meta: true,
                    type: 'Pixel',
                    components: ['true'],
                    terminal: true,
                },
            ],
            listeners: [],
            response: message,
        });

        return deferred.promise;
    }

    /**
     * @name initialize
     * @desc called when the service is loaded
     * @return {void}
     */
    function initialize(): void {
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }

        // this is here because we are not making this call in the login screen. once user is logged in, we will come back here to open an empty insight.
        messageService.on('init-login', function () {
            generateQueryInsightID();
        });
    }

    /**
     * @name generate
     * @param type - type of generate to run
     * @param payload - generate info
     */
    function generate(
        type: string,
        payload: {
            insightID?: string;
            widgetIds?: string[];
            meta?: boolean;
            replacements?: any;
            force?: boolean;
        }
    ): string {
        let query = '',
            panels: any[] = [],
            len: number,
            widgetIds: string[],
            replacements: any;

        if (payload.widgetIds) {
            widgetIds = payload.widgetIds;
        } else {
            widgetIds = [];
        }
        if (payload.replacements) {
            replacements = payload.replacements;
        } else {
            replacements = {};
        }
        if (type === GENERATE.REFRESH_INSIGHT && payload.insightID) {
            panels = getShared(payload.insightID, 'panels');
            len = panels.length;
        } else {
            len = widgetIds.length;
        }
        for (let i = 0; i < len; i++) {
            switch (type) {
                case GENERATE.REFRESH:
                    query += refresh(
                        widgetIds[i],
                        replacements,
                        payload.meta || false,
                        payload.force
                    );
                    break;
                case GENERATE.LOAD:
                    query += load(widgetIds[i], payload.meta || false);
                    break;
                case GENERATE.AUTO:
                    query += auto(widgetIds[i], payload.meta || false);
                    break;
                case GENERATE.REFRESH_INSIGHT:
                    query += refresh(
                        panels[i].widgetId,
                        {},
                        payload.meta || false
                    );
                    break;
                default:
                    console.error('shouldnt see this');
            }
        }

        return query;
    }

    /* API helpers */
    /**
     * @name refresh
     * @param widgetId - id to refresh
     * @param replacements - replacements object
     * @param meta - should this refresh be meta?
     * @desc generates a task
     * @returns returns the queries for the task
     */
    function refresh(
        widgetId: string,
        replacements: any,
        meta: boolean,
        force?: boolean
    ): string {
        let panelId = getWidget(widgetId, 'panelId'),
            active = force ? 'visualization' : getWidget(widgetId, 'active'),
            tasks = getWidget(widgetId, 'view.' + active + '.tasks'),
            layout: any,
            keys: any,
            sortOptions: any,
            filterInfo: any,
            colorBy =
                getWidget(widgetId, 'view.' + active + '.colorByValue') || [],
            filterObj: any = {},
            alreadySelected: any[] = [],
            groupByInfo: any,
            taskOptionsComponent: any,
            selectComponent: any,
            groupComponent: any,
            options: any,
            pixelComponents: PixelCommand[] = [],
            insightID = getWidget(widgetId, 'insightID'),
            frameName = getShared(
                insightID,
                'frames.' + getWidget(widgetId, 'frame') + '.name'
            ),
            frameType = getShared(
                insightID,
                'frames.' + getWidget(widgetId, 'frame') + '.type'
            ),
            format: any,
            taskId: string,
            layerInfo: any,
            taskFrame: string,
            refreshQuery = '',
            replacement: any,
            collectComponent: any,
            rows: any,
            columns: any,
            calculations: any,
            sections: any,
            pivotValues: any,
            valueIdx: number,
            ggplot: string,
            seaborn: string,
            facetPixel: string,
            facetVariable: string;

        if (!tasks) {
            // if no tasks, there's nothing to refresh so return empty
            return '';
        }

        for (
            let taskIdx = 0, taskLen = tasks.length;
            taskIdx < taskLen;
            taskIdx++
        ) {
            (facetPixel = ''), (facetVariable = '');
            filterObj = {};
            alreadySelected = [];
            layout = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + taskIdx + '.layout'
            );
            keys = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + taskIdx + '.keys.' + layout
            );
            sortOptions = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + taskIdx + '.sortInfo'
            );
            filterInfo = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + taskIdx + '.filterInfo'
            );
            groupByInfo = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + taskIdx + '.groupByInfo'
            );
            format = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + taskIdx + '.meta.dataFormat'
            );
            taskId = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + taskIdx + '.taskId'
            );
            layerInfo = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + taskIdx + '.layer'
            );
            taskFrame = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + taskIdx + '.frame'
            );
            (replacement = !Utility.isEmpty(replacements)
                ? replacements[taskIdx]
                : {}),
                (collectComponent = {
                    type: 'collect',
                    components: [optionsService.get(widgetId, 'limit')],
                    terminal: true,
                });
            pixelComponents = [];
            // if frame exists on the task, we should be using that to account for tasks running off of multiple tasks
            if (taskFrame) {
                frameName = taskFrame;
            }

            if (layout === 'PivotTable') {
                rows = tasks[taskIdx].data.pivotData.rowGroups;
                columns = tasks[taskIdx].data.pivotData.columns;
                calculations = [];
                sections = tasks[taskIdx].data.pivotData.sections || [];
                pivotValues = tasks[taskIdx].data.pivotData.values;

                for (valueIdx = 0; valueIdx < pivotValues.length; valueIdx++) {
                    calculations.push(
                        pivotValues[valueIdx].math
                            ? pivotValues[valueIdx].math +
                                  '(' +
                                  pivotValues[valueIdx].alias +
                                  ')'
                            : pivotValues[valueIdx].alias
                    );
                }
                collectComponent = {
                    type: 'collectPivot',
                    components: [rows, columns, calculations, sections],
                    terminal: true,
                };
            } else if (layout === 'GGPlot') {
                ggplot = 'ggplot=["' + tasks[taskIdx].data.ggplot + '"]';
                if (tasks[taskIdx].data.format) {
                    ggplot += ', format=["' + tasks[taskIdx].data.format + '"]';
                }

                collectComponent = {
                    type: 'collectGGPlot',
                    components: [ggplot],
                    terminal: true,
                };
            } else if (layout === 'Seaborn') {
                seaborn = 'splot=["' + tasks[taskIdx].data.splot + '"]';
                if (tasks[taskIdx].data.format) {
                    seaborn +=
                        ', format=["' + tasks[taskIdx].data.format + '"]';
                }

                collectComponent = {
                    type: 'collectSeaborn',
                    components: [seaborn],
                    terminal: true,
                };
            }

            if (format) {
                format = format.toLowerCase();
            }

            if (filterInfo && filterInfo.length > 0) {
                for (let j = 0; j < filterInfo.length; j++) {
                    if (filterInfo[j].filterObj.filterType === 'SIMPLE') {
                        filterObj[filterInfo[j].filterObj.left.value] = {
                            comparator: filterInfo[j].filterObj.comparator,
                            value: filterInfo[j].filterObj.right.value,
                            isVariable:
                                filterInfo[j].filterObj.right.type === 'COLUMN',
                        };
                    } else {
                        // handling custom pixels. e.g. Filter(MovieBudget > 0 AND MovieBudget < 1000000)
                        filterObj[filterInfo[j].filterObj.filterStr] = {
                            value: filterInfo[j].filterStr,
                            isFilterString: true,
                        };
                    }
                }
            }

            // temporarily set to use CollectGraph for when its tinker and its either Graph or VivaGraph
            if (
                frameType === 'GRAPH' &&
                (layout === 'Graph' || layout === 'VivaGraph')
            ) {
                taskOptionsComponent = {};
                taskOptionsComponent[panelId] = {
                    layout: layout,
                };

                pixelComponents = [
                    {
                        type: 'taskOptions',
                        components: [taskOptionsComponent],
                    },
                    {
                        type: 'collectGraph',
                        components: [frameName],
                        terminal: true,
                    },
                ];

                return Pixel.build(pixelComponents);
            }

            // create components
            taskOptionsComponent = {};
            taskOptionsComponent[panelId] = {
                layout: layout,
                alignment: {},
            };
            if (format === 'graph') {
                options = [
                    getWidget(
                        widgetId,
                        'view.visualization.tasks.' + taskIdx + '.meta.options'
                    ),
                ];
            } else {
                options = false;
            }

            selectComponent = [];
            groupComponent = [];
            if (keys) {
                for (let i = 0, len = keys.length; i < len; i++) {
                    // add in the model
                    if (
                        !taskOptionsComponent[panelId].alignment[keys[i].model]
                    ) {
                        taskOptionsComponent[panelId].alignment[keys[i].model] =
                            [];
                    }

                    // add in the group component
                    if (
                        keys[i].groupBy &&
                        keys[i].groupBy.length > 0 &&
                        groupComponent.length === 0
                    ) {
                        groupComponent = keys[i].groupBy;
                    }

                    // add in the select component if not already added
                    if (alreadySelected.indexOf(keys[i].alias) === -1) {
                        if (keys[i].calculatedBy) {
                            selectComponent.push({
                                calculatedBy: keys[i].calculatedBy,
                                math: keys[i].math,
                                alias: keys[i].alias,
                            });
                        } else if (keys[i].derived && !keys[i].calculatedBy) {
                            selectComponent.push({
                                selector: '(' + keys[i].header + ')',
                                alias: keys[i].alias,
                            });
                        } else {
                            selectComponent.push({
                                selector: keys[i].header,
                                alias: keys[i].alias,
                            });
                        }

                        alreadySelected.push(keys[i].alias);
                    }

                    // add to the view component
                    taskOptionsComponent[panelId].alignment[keys[i].model].push(
                        keys[i].alias
                    );
                }
            }

            // SORTS ARE TAKEN CARED OF BY THE **WITH** REACTOR, SO NO NEED TO PROCESS IT TO ADD TO SELECTOR
            // if (sortOptions)

            // if group by exists, add to task
            if (groupByInfo && groupByInfo.viewType) {
                taskOptionsComponent[panelId].groupByInfo = {};
                taskOptionsComponent[panelId].groupByInfo.selectedDim =
                    groupByInfo.selectedDim;
                taskOptionsComponent[panelId].groupByInfo.viewType =
                    groupByInfo.viewType;
                taskOptionsComponent[panelId].groupByInfo.instanceIndex =
                    groupByInfo.instanceIndex;
                taskOptionsComponent[panelId].groupByInfo.selectComponent =
                    groupByInfo.selectComponent;
                taskOptionsComponent[panelId].groupByInfo.groupComponent =
                    groupByInfo.groupComponent;
                // taskOptionsComponent[panelId].groupByInfo.uniqueInstances = groupByInfo.uniqueInstances;
                // make a new variable for the unique instances & push into pixelComponents to be run first.
                facetVariable = 'facet_' + panelId;

                facetPixel += facetVariable + ' = ';
                facetPixel +=
                    'Frame(' +
                    frameName +
                    ') | Select (' +
                    groupByInfo.selectedDim +
                    ') | Sort(columns=["' +
                    groupByInfo.selectedDim +
                    '"], sort=["asc"]) | Collect(-1); ';

                refreshQuery += facetPixel;
                // set the uniqueInstances to be the facetVariable as a variable notation in the pixel
                taskOptionsComponent[panelId].groupByInfo.uniqueInstances =
                    '{' + facetVariable + '}';
            }

            if (layerInfo) {
                taskOptionsComponent[panelId].layer = layerInfo;
            }

            // if no selectors...then the query will become invalid. in which case we will just not run it.
            // TODO find the root cause of no selectors being passed in...should be taken cared of there not at this location
            if (selectComponent.length === 0) {
                return '';
            }

            // take in replacements and override current with the replacements
            // TODO need to build it out further and clean up
            if (
                replacement &&
                replacement.select &&
                replacement.select.length > 0
            ) {
                selectComponent = replacement.select;
            }

            if (replacement && replacement.taskOptions) {
                taskOptionsComponent = angular.extend(
                    taskOptionsComponent,
                    replacement.taskOptions
                );
            }

            if (replacement && replacement.layer) {
                taskOptionsComponent[panelId].layer = replacement.layer;
            }

            pixelComponents = pixelComponents.concat([
                {
                    type: 'frame',
                    components: [frameName],
                },
                {
                    type: 'select2',
                    components: [selectComponent],
                },
                {
                    type: 'sortOptions',
                    components: [sortOptions],
                },
                {
                    type: 'filter',
                    components: [filterObj],
                },
                {
                    type: 'group',
                    components: [groupComponent],
                },
            ]);

            if (frameType === 'GRAPH') {
                const joins = getShared(insightID, `frames.${frameName}.joins`);

                if (joins.length > 0) {
                    const joinComponent = joins.map((join) => ({
                        toColumn: join.toNode,
                        fromColumn: join.fromNode,
                        joinType: join.joinType,
                    }));

                    pixelComponents = pixelComponents.concat({
                        type: 'join',
                        components: [joinComponent],
                    });
                }
            }

            pixelComponents = pixelComponents.concat([
                {
                    // add in with to grab sorts and filters applied to the panel
                    type: 'with',
                    components: [panelId],
                },
                {
                    type: 'format',
                    components: [format, options],
                },
                {
                    type: 'taskOptions',
                    components: [taskOptionsComponent],
                },
                collectComponent,
            ]);

            refreshQuery += Pixel.build([
                {
                    type: 'ifError',
                    components: [pixelComponents, []],
                    terminal: true,
                    meta: meta,
                },
            ]);

            if (taskId) {
                pixelComponents = [
                    {
                        type: 'removeTask',
                        components: [taskId, true],
                        terminal: true,
                    },
                ];

                refreshQuery += Pixel.build([
                    {
                        type: 'ifError',
                        components: [pixelComponents, []],
                        terminal: true,
                        meta: true,
                    },
                ]);
            }

            // Do not remove facet variable
        }

        // adding color by value
        for (
            let colorByIdx = 0, colorByLen = colorBy.length;
            colorByIdx < colorByLen;
            colorByIdx++
        ) {
            pixelComponents = [
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'retrievePanelColorByValue',
                    components: [colorBy[colorByIdx].name],
                },
                {
                    type: 'collect',
                    components: [optionsService.get(widgetId, 'limit')],
                    terminal: true,
                },
            ];

            refreshQuery += Pixel.build([
                {
                    type: 'ifError',
                    components: [pixelComponents, []],
                    terminal: true,
                    meta: meta,
                },
            ]);
        }

        return refreshQuery;
    }

    /**
     * @name load
     * @param widgetId - id to refresh
     * @param meta - should this refresh be meta?
     * @desc generates the task for all of the panels in this insight
     * @returns returns the queries for the tasks
     */
    function load(widgetId: string, meta: boolean): string {
        let panelId = getWidget(widgetId, 'panelId'),
            active = getWidget(widgetId, 'active'),
            layerIndex = 0,
            tasks = getWidget(
                widgetId,
                'view.' + active + '.tasks.' + layerIndex
            ),
            colorBy =
                getWidget(widgetId, 'view.' + active + '.colorByValue') || [],
            pixelComponents: PixelCommand[] = [],
            loadQuery = '';

        if (tasks.available) {
            pixelComponents = [
                {
                    type: 'task',
                    components: [tasks.taskId],
                },
                {
                    type: 'collect',
                    components: [optionsService.get(widgetId, 'limit')],
                    terminal: true,
                },
            ];

            loadQuery += Pixel.build([
                {
                    type: 'ifError',
                    components: [pixelComponents, []],
                    terminal: true,
                    meta: meta,
                },
            ]);
        }

        // adding color by value
        for (let i = 0, len = colorBy.length; i < len; i++) {
            pixelComponents = [
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'retrievePanelColorByValue',
                    components: [colorBy[i].name],
                },
                {
                    type: 'collect',
                    components: [optionsService.get(widgetId, 'limit')],
                    terminal: true,
                },
            ];

            loadQuery += Pixel.build([
                {
                    type: 'ifError',
                    components: [pixelComponents, []],
                    terminal: true,
                    meta: meta,
                },
            ]);
        }

        return loadQuery;
    }

    /**
     * @name auto
     * @param widgetId - id to refresh
     * @param meta - should this refresh be meta?
     * @desc generates the task for all of the panels in this insight
     * @returns returns the queries for the tasks
     */
    function auto(widgetId: string, meta: boolean): string {
        let insightID = getWidget(widgetId, 'insightID'),
            panelId = getWidget(widgetId, 'panelId'),
            frameName = getShared(
                insightID,
                'frames.' + getWidget(widgetId, 'frame') + '.name'
            ),
            limit = optionsService.get(widgetId, 'limit'),
            pixelComponents: PixelCommand[];

        pixelComponents = [
            {
                type: 'frame',
                components: [frameName],
            },
            {
                type: 'queryAll',
                components: [],
            },
            {
                type: 'autoTaskOptions',
                components: [panelId, 'Grid'],
            },
            {
                type: 'collect',
                components: [limit],
                terminal: true,
            },
        ];

        return Pixel.build([
            {
                type: 'ifError',
                components: [pixelComponents, []],
                terminal: true,
                meta: meta,
            },
        ]);
    }

    /**
     * @name processChanges
     * @param changes - changes
     * @param response - current response
     * @param insightID - current insightID
     * @desc function that process the current triggering the appropate update functions
     * @returns {void}
     */
    function processChanges(
        changes: PixelChange,
        response: any[],
        insightID: string
    ): void {
        let output: any, type: string, expression: string;

        // Need this to reassign the param
        for (let i = 0, len = response.length; i < len; i++) {
            // easy mapping to the output object
            output = response[i].output;
            type = response[i].operationType;
            expression = response[i].pixelExpression;

            for (let typeIdx = 0; type && typeIdx < type.length; typeIdx++) {
                if (
                    type[typeIdx] === 'CODE_EXECUTION' ||
                    type[typeIdx] === 'VECTOR'
                ) {
                    // this is nested
                    if (output !== 'no output') {
                        processChanges(changes, output, insightID);
                    } else {
                        console.error(
                            `Error: Unknown response type: ${type[typeIdx]} with response: ${output}`
                        );
                    }
                } else if (type[typeIdx] === 'SUCCESS') {
                    SUCCESS(changes, output, insightID);
                } else if (type[typeIdx] === 'WARNING') {
                    WARNING(changes, output, insightID);
                } else if (type[typeIdx] === 'ERROR') {
                    ERROR(changes, output, insightID);
                } else if (type[typeIdx] === 'FRAME') {
                    FRAME(changes, output, insightID);
                } else if (type[typeIdx] === 'FRAME_FILTER_CHANGE') {
                    FRAME_FILTER_CHANGE(changes, output, insightID);
                } else if (type[typeIdx] === 'FRAME_DATA_CHANGE') {
                    FRAME_DATA_CHANGE(changes, output, insightID);
                } else if (type[typeIdx] === 'REMOVE_FRAME') {
                    REMOVE_FRAME(changes, output, insightID);
                } else if (type[typeIdx] === 'FRAME_HEADERS') {
                    FRAME_HEADERS(changes, output, insightID);
                } else if (type[typeIdx] === 'FRAME_HEADERS_CHANGE') {
                    FRAME_HEADERS_CHANGE(changes, output, insightID);
                } else if (type[typeIdx] === 'REMOVE_HEADERS') {
                    REMOVE_HEADERS(changes, output, insightID);
                } else if (type[typeIdx] === 'MODIFY_HEADERS') {
                    MODIFY_HEADERS(changes, output, insightID);
                } else if (type[typeIdx] === 'TASK_DATA') {
                    TASK_DATA(changes, output, insightID, expression);
                } else if (type[typeIdx] === 'REMOVE_LAYER') {
                    REMOVE_LAYER(changes, output, insightID);
                } else if (type[typeIdx] === 'RESET_PANEL_TASKS') {
                    RESET_PANEL_TASKS(changes, output, insightID);
                } else if (type[typeIdx] === 'VIZ_OUTPUT') {
                    VIZ_OUTPUT(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_OPEN') {
                    PANEL_OPEN(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_CLONE') {
                    PANEL_CLONE(changes, output, insightID);
                } else if (type[typeIdx] === 'CACHED_PANEL_CLONE') {
                    CACHED_PANEL_CLONE(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_CLOSE') {
                    PANEL_CLOSE(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_VIEW') {
                    PANEL_VIEW(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_ORNAMENT') {
                    PANEL_ORNAMENT(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_ORNAMENT_DATA') {
                    PANEL_ORNAMENT_DATA(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_LABEL') {
                    PANEL_LABEL(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_CONFIG') {
                    if (output.config && output.config.test) {
                        // debugger;
                    } else {
                        PANEL_CONFIG(changes, output, insightID);
                    }
                } else if (type[typeIdx] === 'PANEL_COMMENT') {
                    PANEL_COMMENT(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_EVENT') {
                    PANEL_EVENT(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_FILTER_CHANGE') {
                    PANEL_FILTER_CHANGE(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_SORT') {
                    PANEL_SORT(changes, output, insightID);
                } else if (type[typeIdx] === 'PANEL_COLLECT') {
                    PANEL_COLLECT(changes, output, insightID);
                } else if (type[typeIdx] === 'ADD_PANEL_COLOR_BY_VALUE') {
                    ADD_PANEL_COLOR_BY_VALUE(changes, output, insightID);
                } else if (type[typeIdx] === 'REMOVE_PANEL_COLOR_BY_VALUE') {
                    REMOVE_PANEL_COLOR_BY_VALUE(changes, output, insightID);
                } else if (type[typeIdx] === 'SHEET_OPEN') {
                    SHEET_OPEN(changes, output, insightID);
                } else if (type[typeIdx] === 'SHEET_CLOSE') {
                    SHEET_CLOSE(changes, output, insightID);
                } else if (type[typeIdx] === 'SHEET_LABEL') {
                    SHEET_LABEL(changes, output, insightID);
                } else if (type[typeIdx] === 'SHEET_CONFIG') {
                    SHEET_CONFIG(changes, output, insightID);
                } else if (type[typeIdx] === 'CLEAR_INSIGHT') {
                    CLEAR_INSIGHT(changes, output, insightID);
                } else if (type[typeIdx] === 'DROP_INSIGHT') {
                    DROP_INSIGHT(changes, output, insightID);
                } else if (
                    type[typeIdx] === 'DASHBOARD_INSIGHT_CONFIGURATION'
                ) {
                    DASHBOARD_INSIGHT_CONFIGURATION(changes, output, insightID);
                } else if (type[typeIdx] === 'INSIGHT_CONFIG') {
                    INSIGHT_CONFIG(changes, output, insightID);
                } else if (type[typeIdx] === 'MOVE_SHEET') {
                    MOVE_SHEET(changes, output, insightID);
                } else if (type[typeIdx] === 'SUB_SCRIPT') {
                    SUB_SCRIPT(changes, output, insightID);
                } else if (type[typeIdx] === 'NEW_EMPTY_INSIGHT') {
                    NEW_EMPTY_INSIGHT(changes, output, insightID);
                } else if (type[typeIdx] === 'OPEN_SAVED_INSIGHT') {
                    OPEN_SAVED_INSIGHT(changes, output, insightID);
                } else if (type[typeIdx] === 'LOAD_INSIGHT') {
                    LOAD_INSIGHT(changes, output, insightID);
                } else if (type[typeIdx] === 'OLD_INSIGHT') {
                    OLD_INSIGHT(changes, output, insightID);
                } else if (type[typeIdx] === 'SAVE_INSIGHT') {
                    SAVE_INSIGHT(changes, output, insightID);
                } else if (type[typeIdx] === 'CACHED_SHEET') {
                    CACHED_SHEET(changes, output, insightID);
                } else if (type[typeIdx] === 'CACHED_PANEL') {
                    CACHED_PANEL(changes, output, insightID);
                } else if (type[typeIdx] === 'FRAME_CACHE') {
                    FRAME_CACHE(changes, output, insightID);
                } else if (type[typeIdx] === 'FRAME_SWAP') {
                    FRAME_SWAP(changes, output, insightID);
                } else if (type[typeIdx] === 'LOGGIN_REQUIRED_ERROR') {
                    LOGGIN_REQUIRED_ERROR(changes, output, insightID);
                } else if (type[typeIdx] === 'OPEN_TAB') {
                    OPEN_TAB(changes, output, insightID);
                } else if (type[typeIdx] === 'FILE_DOWNLOAD') {
                    FILE_DOWNLOAD(changes, output, insightID);
                } else if (type[typeIdx] === 'VIZ_RECOMMENDATION') {
                    VIZ_RECOMMENDATION(changes, output, insightID);
                } else if (type[typeIdx] === 'ALTER_DATABASE') {
                    ALTER_DATABASE(changes, output, insightID);
                } else if (type[typeIdx] === 'OPERATION') {
                    // noop this can be anything
                } else if (type[typeIdx] === 'CHECK_R_PACKAGES') {
                    CHECK_R_PACKAGES(changes, output, insightID);
                } else if (type[typeIdx] === 'FILE') {
                    FILE(changes, output, insightID);
                } else if (type[typeIdx] === 'RERUN_INSIGHT_RECIPE') {
                    RERUN_INSIGHT_RECIPE(changes, output, insightID);
                } else if (type[typeIdx] === 'PARAMETER_EXECUTION') {
                    PARAMETER_EXECUTION(changes, output, insightID);
                } else if (type[typeIdx] === 'INSIGHT_THEME') {
                    INSIGHT_THEME(changes, output, insightID);
                } else {
                    console.error(
                        'Error: Unknown response type: ' + type[typeIdx]
                    );
                }
            }

            // This was run 'after' the current step
            if (response[i].additionalOutput) {
                processChanges(
                    changes,
                    response[i].additionalOutput,
                    insightID
                );
            }
        }
    }

    /**
     * @name INSIGHT_THEME
     * @desc applys a theme to an insight
     * @param changes tracks the changes
     * @param output output
     * @param insightID insightID for the current insight
     */
    function INSIGHT_THEME(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        if (Object.keys(output).length) {
            _state.shared[insightID].theme = output;
        } else {
            _state.shared[insightID].theme = THEME;
        }
        // Update visualization tools
        for (const widgetId in _state.widgets) {
            if (
                _state.widgets.hasOwnProperty(widgetId) &&
                _state.widgets[widgetId].insightID === insightID
            ) {
                const tools =
                        _state.widgets[widgetId].view.visualization.tools
                            .shared,
                    newOptions = mergeVizOptions(
                        _state.shared[insightID].theme,
                        tools,
                        _state.widgets[widgetId].view.visualization
                            .appliedOrnaments
                    );
                _state.widgets[widgetId].view.visualization.tools.shared =
                    newOptions;
            }
        }

        messageService.emit('update-theme', {
            insightID: insightID,
            theme: _state.shared[insightID].theme,
        });
    }

    /**
     * @name SUCCESS
     * @param changes - changes object that tracks the total changes in the current execution
     * @param output - output for this step
     * @param insightID - insightID that we are working with
     * @desc send a success message when prompted
     */
    function SUCCESS(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        if (output && typeof output === 'string') {
            changes.alerts.push({
                panel: false,
                color: 'success',
                text: output,
            });
        }
    }

    /**
     * @name WARNING
     * @param changes - changes object that tracks the total changes in the current execution
     * @param output - output for this step
     * @param insightID - insightID that we are working with
     * @desc send a warning message when prompted
     */
    function WARNING(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        if (output && typeof output === 'string') {
            changes.alerts.push({
                panel: false,
                color: 'warn',
                text: output,
            });
        }
    }

    /**
     * @name ERROR
     * @param changes - changes object that tracks the total changes in the current execution
     * @param output - output for this step
     * @param insightID - insightID that we are working with
     * @desc send a error message when prompted
     */
    function ERROR(changes: PixelChange, output: any, insightID: string): void {
        let message = '';
        if (output && typeof output === 'string') {
            message = output;
        } else if (output && output.errorData && output.errorData.message) {
            message = output.errorData.message;
        }

        if (message) {
            changes.alerts.push({
                panel: false,
                color: 'error',
                text: message,
            });
        } else {
            // fall back into generic error message
            changes.alerts.push({
                panel: false,
                color: 'error',
                text: 'An unknown error occurred.',
            });
        }
    }

    /**
     * @name FRAME
     * @param changes - changes object that tracks the total changes in the current execution
     * @param output - output for this step
     * @param insightID - insightID that we are working with
     * @desc function that updates the store when the frame changes
     */
    function FRAME(changes: PixelChange, output: any, insightID: string): void {
        if (output) {
            // update the frame object
            setFrame(insightID, {
                name: output.name,
                type: output.type,
            });

            changes.frames['FRAME_PLACEHOLDER'] = angular.merge(
                changes.frames['FRAME_PLACEHOLDER'] || {},
                {
                    updated: true,
                    tasks: [], // clear out the tasks
                }
            );

            // clear out tasks for real
            changes.frames['FRAME_PLACEHOLDER'].tasks = [];
        }
    }

    /**
     * @name FRAME_FILTER_CHANGE
     * @param changes - changes object that tracks the total changes in the current execution
     * @param output - output for this step
     * @param insightID - insightID that we are working with
     * @desc function that updates the store when the frame filter changes
     */
    function FRAME_FILTER_CHANGE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // no change to the state

        // merge with other 'sub' types
        changes.frames['FRAME_PLACEHOLDER'] = angular.merge(
            changes.frames['FRAME_PLACEHOLDER'] || {},
            {
                updated: true,
                filtered: true,
                tasks: [], // clear out the tasks
            }
        );

        // clear out tasks for real
        changes.frames['FRAME_PLACEHOLDER'].tasks = [];
    }

    /**
     * @name FRAME_DATA_CHANGE
     * @param changes - changes object that tracks the total changes in the current execution
     * @param output - output for this step
     * @param insightID - insightID that we are working with
     * @desc function that updates the store when the frame data changes
     */
    function FRAME_DATA_CHANGE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // no change to the state

        changes.frames['FRAME_PLACEHOLDER'] = angular.merge(
            changes.frames['FRAME_PLACEHOLDER'] || {},
            {
                updated: true,
                tasks: [], // clear out the tasks
            }
        );

        // clear out tasks for real
        changes.frames['FRAME_PLACEHOLDER'].tasks = [];
    }

    /**
     * @name REMOVE_FRAME
     * @param changes - changes object that tracks the total changes in the current execution
     * @param output - output for this step
     * @param insightID - insightID that we are working with
     * @desc function that updates the store when a frame is removed
     */
    function REMOVE_FRAME(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        if (output) {
            if (_state.shared[insightID].frames.hasOwnProperty(output)) {
                // delete the frame
                delete _state.shared[insightID].frames[output];

                for (const widgetId in _state.widgets) {
                    if (_state.widgets.hasOwnProperty(widgetId)) {
                        if (_state.widgets[widgetId].insightID === insightID) {
                            // set to a new one
                            if (_state.widgets[widgetId].frame === output) {
                                _state.widgets[widgetId].frame = Object.keys(
                                    _state.shared[insightID].frames
                                )[0];
                            }
                        }
                    }
                }

                changes.frames['FRAME_PLACEHOLDER'] = {
                    removed: true,
                };
            }
        }
    }

    /**
     * @name FRAME_HEADERS
     * @param changes - changes object that tracks the total changes in the current execution
     * @param output - output for this step
     * @param insightID - insightID that we are working with
     * @desc function that updates the store when the frame headers changes
     */
    function FRAME_HEADERS(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        setFrame(insightID, {
            name: output.name,
            type: output.type,
            headers: output.headerInfo.headers,
            joins: output.headerInfo.joins,
        });

        changes.frames['FRAME_PLACEHOLDER'] = angular.merge(
            changes.frames['FRAME_PLACEHOLDER'] || {},
            {
                updated: true,
                headersChanged: false, // we do not need to get new headers
            }
        );
    }

    /**
     * @name FRAME_HEADERS_CHANGE
     * @param changes - changes object that tracks the total changes in the current execution
     * @param output - output for this step
     * @param insightID - insightID that we are working with
     * @desc function that updates the store when the frame headers changes
     */
    function FRAME_HEADERS_CHANGE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // no change to the state

        changes.frames['FRAME_PLACEHOLDER'] = angular.merge(
            changes.frames['FRAME_PLACEHOLDER'] || {},
            {
                updated: true,
                headersChanged: true, // we need to get new headers
            }
        );
    }

    /**
     * @name REMOVE_HEADERS
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store when a header is removed
     */
    function REMOVE_HEADERS(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        for (const widgetId in _state.widgets) {
            if (_state.widgets.hasOwnProperty(widgetId)) {
                if (_state.widgets[widgetId].insightID === insightID) {
                    if (_state.widgets[widgetId].active === 'visualization') {
                        // go through all of the widgets and look at their task...if they use the header that was removed, we will emit a message to it to display as warning
                        let keys = getWidget(
                                widgetId,
                                'view.' +
                                    _state.widgets[widgetId].active +
                                    '.keys.' +
                                    _state.widgets[widgetId].view[
                                        _state.widgets[widgetId].active
                                    ].layout
                            ),
                            headerUpdated = false;

                        if (keys) {
                            for (
                                let keyIdx = 0, keyLen = keys.length;
                                keyIdx < keyLen;
                                keyIdx++
                            ) {
                                if (
                                    output.remove.indexOf(keys[keyIdx].alias) >
                                    -1
                                ) {
                                    headerUpdated = true;

                                    changes.alerts.push({
                                        panel: _state.widgets[widgetId].panelId,
                                        color: 'warn',
                                        text: `${keys[keyIdx].alias} has been removed. Dimensions may need to be updated.`,
                                    });
                                }
                            }
                        }

                        if (headerUpdated) {
                            changes.frames['FRAME_PLACEHOLDER'] = angular.merge(
                                changes.frames['FRAME_PLACEHOLDER'] || {},
                                {
                                    updated: true,
                                    headersChanged: true, // we need to get new headers
                                    tasks: [], // clear out the tasks
                                }
                            );

                            // clear out tasks for real
                            changes.frames['FRAME_PLACEHOLDER'].tasks = [];
                        }
                    }
                }
            }
        }
    }

    /**
     * @name MODIFY_HEADERS
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store when the frame headers changes
     */
    function MODIFY_HEADERS(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const frameName: string = output.frameName;
        // TODO: We should map the insight to the widget ... then I don't have to look at all the widgets
        if (output) {
            for (const widgetId in _state.widgets) {
                if (_state.widgets.hasOwnProperty(widgetId)) {
                    if (
                        _state.widgets[widgetId].insightID === insightID &&
                        _state.widgets[widgetId].frame == frameName
                    ) {
                        if (
                            _state.widgets[widgetId].active === 'visualization'
                        ) {
                            const viewData =
                                _state.widgets[widgetId].view[
                                    _state.widgets[widgetId].active
                                ];
                            for (const layout in viewData.keys) {
                                if (viewData.keys.hasOwnProperty(layout)) {
                                    let headerUpdated = false,
                                        keys = getWidget(
                                            widgetId,
                                            'view.' +
                                                _state.widgets[widgetId]
                                                    .active +
                                                '.keys.' +
                                                layout
                                        );

                                    for (
                                        let keyIdx = 0, keyLen = keys.length;
                                        keyIdx < keyLen;
                                        keyIdx++
                                    ) {
                                        if (
                                            output.remove.indexOf(
                                                keys[keyIdx].alias
                                            ) > -1
                                        ) {
                                            // change the task keys' alias and header to update the select component that will be built
                                            viewData.keys[layout][
                                                keyIdx
                                            ].alias =
                                                output.add[
                                                    output.remove.indexOf(
                                                        keys[keyIdx].alias
                                                    )
                                                ];
                                            viewData.keys[layout][
                                                keyIdx
                                            ].header =
                                                output.add[
                                                    output.remove.indexOf(
                                                        keys[keyIdx].alias
                                                    )
                                                ];
                                            // need to loop through the keys for each specific tasks as well and update the header information
                                            for (
                                                let taskIdx = 0;
                                                taskIdx < viewData.tasks.length;
                                                taskIdx++
                                            ) {
                                                const taskKeys =
                                                    viewData.tasks[taskIdx]
                                                        .keys[
                                                        viewData.tasks[taskIdx]
                                                            .layout
                                                    ];
                                                for (
                                                    let taskKeyIdx = 0;
                                                    taskKeyIdx <
                                                    taskKeys.length;
                                                    taskKeyIdx++
                                                ) {
                                                    if (
                                                        output.remove.indexOf(
                                                            taskKeys[taskKeyIdx]
                                                                .alias
                                                        ) > -1
                                                    ) {
                                                        taskKeys[
                                                            taskKeyIdx
                                                        ].alias =
                                                            output.add[
                                                                output.remove.indexOf(
                                                                    keys[keyIdx]
                                                                        .alias
                                                                )
                                                            ];
                                                        taskKeys[
                                                            taskKeyIdx
                                                        ].header =
                                                            output.add[
                                                                output.remove.indexOf(
                                                                    keys[keyIdx]
                                                                        .alias
                                                                )
                                                            ];
                                                    }
                                                }
                                            }

                                            // TODO change any filter data--right now we don't keep track of filter in the query level...
                                            if (layout === viewData.layout) {
                                                headerUpdated = true;
                                            }
                                        }

                                        // change any grouping headers
                                        if (keys[keyIdx].groupBy) {
                                            for (
                                                let groupIdx = 0,
                                                    groupLen =
                                                        keys[keyIdx].groupBy
                                                            .length;
                                                groupIdx < groupLen;
                                                groupIdx++
                                            ) {
                                                if (
                                                    output.remove.indexOf(
                                                        keys[keyIdx].groupBy[
                                                            groupIdx
                                                        ]
                                                    ) > -1
                                                ) {
                                                    viewData.keys[layout][
                                                        keyIdx
                                                    ].groupBy[groupIdx] =
                                                        output.add[
                                                            output.remove.indexOf(
                                                                keys[keyIdx]
                                                                    .groupBy[
                                                                    groupIdx
                                                                ]
                                                            )
                                                        ];
                                                    if (
                                                        layout ===
                                                        viewData.layout
                                                    ) {
                                                        headerUpdated = true;
                                                    }
                                                }
                                            }
                                        }

                                        // change the calculatedBy field to match the new column name and then adjust the new alias and header to be mathOfCalculatedBy
                                        if (keys[keyIdx].calculatedBy) {
                                            if (
                                                output.remove.indexOf(
                                                    keys[keyIdx].calculatedBy
                                                ) > -1
                                            ) {
                                                viewData.keys[layout][
                                                    keyIdx
                                                ].calculatedBy =
                                                    output.add[
                                                        output.remove.indexOf(
                                                            keys[keyIdx]
                                                                .calculatedBy
                                                        )
                                                    ];
                                                viewData.keys[layout][
                                                    keyIdx
                                                ].alias =
                                                    viewData.keys[layout][
                                                        keyIdx
                                                    ].math +
                                                    'of' +
                                                    output.add[
                                                        output.remove.indexOf(
                                                            keys[keyIdx]
                                                                .calculatedBy
                                                        )
                                                    ];
                                                viewData.keys[layout][
                                                    keyIdx
                                                ].header =
                                                    viewData.keys[layout][
                                                        keyIdx
                                                    ].math +
                                                    'of' +
                                                    output.add[
                                                        output.remove.indexOf(
                                                            keys[keyIdx]
                                                                .calculatedBy
                                                        )
                                                    ];

                                                if (
                                                    layout === viewData.layout
                                                ) {
                                                    headerUpdated = true;
                                                }
                                            }
                                        }
                                    }

                                    if (headerUpdated) {
                                        changes.frames['FRAME_PLACEHOLDER'] =
                                            angular.merge(
                                                changes.frames[
                                                    'FRAME_PLACEHOLDER'
                                                ] || {},
                                                {
                                                    updated: true,
                                                    headersChanged: true, // we need to get new headers
                                                    tasks: [], // clear out the tasks
                                                }
                                            );

                                        // clear out tasks for real
                                        changes.frames[
                                            'FRAME_PLACEHOLDER'
                                        ].tasks = [];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * @name TASK_DATA
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @param expression - current expression
     * @desc function that updates the store for the task
     */
    function TASK_DATA(
        changes: PixelChange,
        output: any,
        insightID: string,
        expression: string
    ): void {
        for (const widgetId in _state.widgets) {
            if (_state.widgets.hasOwnProperty(widgetId)) {
                if (_state.widgets[widgetId].insightID === insightID) {
                    const taskOption = output.taskOptions
                        ? output.taskOptions[_state.widgets[widgetId].panelId]
                        : undefined;
                    // view options have changed
                    if (taskOption) {
                        // switch the view if it is not visualization. This matches the BE state.
                        if (
                            _state.widgets[widgetId].active !== 'visualization'
                        ) {
                            _state.widgets[widgetId].active = 'visualization';
                        }

                        let viewInfo =
                                _state.widgets[widgetId].view[
                                    _state.widgets[widgetId].active
                                ],
                            layerInfo = taskOption.layer,
                            layerIndex = 0;

                        // if explicitly defined as the base layer, we will assume we're overriding the 0 indexed layer
                        if (!Utility.isEmpty(layerInfo)) {
                            layerIndex = layerInfo.base
                                ? 0
                                : getLayerIndex(viewInfo.tasks, layerInfo.id);
                        }
                        let newData = false,
                            currentCount = 0;

                        // initialize if it isn't there
                        if (!viewInfo) {
                            viewInfo = {
                                options: {},
                                layout: false,
                                events: {},
                                tools: {
                                    shared: {},
                                    individual: {},
                                },
                                tasks: [],
                                keys: {}, // should remove this and always use the tasks version...
                                colorByValue: [],
                            };
                        }

                        if (
                            !viewInfo.tasks[layerIndex] ||
                            output.taskId !== viewInfo.tasks[layerIndex].taskId
                        ) {
                            viewInfo.tasks[layerIndex] = {
                                taskId: output.taskId,
                                expression: expression,
                                available: false,
                                collected: 0,
                                totalRows: 0,
                                data: {},
                                layout: taskOption
                                    ? taskOption.layout
                                    : undefined,
                                meta: {}, // meta associated with the task
                                keys: {},
                                frame: '',
                            };

                            // the last frame is the default frame that we are using
                            if (output.sources) {
                                for (
                                    let i = output.sources.length - 1;
                                    i >= 0;
                                    i--
                                ) {
                                    if (output.sources[i].type === 'FRAME') {
                                        _state.widgets[widgetId].frame =
                                            output.sources[i].name;
                                        viewInfo.tasks[layerIndex].frame =
                                            output.sources[i].name;
                                        break;
                                    }
                                }
                            }

                            newData = true;
                        } else {
                            newData = false;
                        }

                        // update the meta info
                        if (output.headerInfo) {
                            viewInfo.tasks[layerIndex].meta.headerInfo =
                                output.headerInfo;
                        }

                        // update the meta info
                        if (output.format) {
                            viewInfo.tasks[layerIndex].meta.dataFormat =
                                output.format.type;
                            if (
                                viewInfo.tasks[layerIndex].meta.dataFormat ===
                                'GRAPH'
                            ) {
                                viewInfo.tasks[layerIndex].meta.options =
                                    output.format.options;
                            }
                        }

                        // update the data
                        if (output.data) {
                            if (
                                viewInfo.tasks[layerIndex].data.values &&
                                viewInfo.tasks[layerIndex].data.values.length
                            ) {
                                currentCount =
                                    viewInfo.tasks[layerIndex].data.values
                                        .length;
                            }
                            if (
                                viewInfo.tasks[layerIndex].meta.dataFormat ===
                                'TABLE'
                            ) {
                                // update the number collected
                                viewInfo.tasks[layerIndex].collected =
                                    currentCount + output.data.values.length;

                                // update the total number of rows
                                viewInfo.tasks[layerIndex].totalRows =
                                    output.numRows;

                                // check if more can be collected
                                viewInfo.tasks[layerIndex].available =
                                    output.data.values.length ===
                                    output.numCollected;

                                // combine values
                                if (!viewInfo.tasks[layerIndex].data.values) {
                                    viewInfo.tasks[layerIndex].data.values = [];
                                }

                                viewInfo.tasks[layerIndex].data.values =
                                    viewInfo.tasks[
                                        layerIndex
                                    ].data.values.concat(output.data.values);
                            } else if (
                                viewInfo.tasks[layerIndex].meta.dataFormat ===
                                'GRAPH'
                            ) {
                                viewInfo.tasks[layerIndex].data = output.data;
                            } else if (
                                viewInfo.tasks[layerIndex].meta.dataFormat ===
                                'CLUSTERGRAM'
                            ) {
                                viewInfo.tasks[layerIndex].data = output.data;
                            } else {
                                console.error('Error: Unknown format type');
                            }

                            // update headers
                            // headers are just the headerInfo aliases
                            // rawHeaders are the header aliases in all caps unless derivced
                            if (output.headerInfo) {
                                viewInfo.tasks[layerIndex].data.headers =
                                    output.headerInfo.map(
                                        (header) => header.alias
                                    );
                                viewInfo.tasks[layerIndex].data.rawHeaders =
                                    output.headerInfo.map((header) =>
                                        header.derived
                                            ? header.alias
                                            : header.alias.toUpperCase()
                                    );
                            }

                            if (output.data.pivotData) {
                                viewInfo.tasks[layerIndex].data.pivotData =
                                    output.data.pivotData;
                            }

                            if (output.data.ggplot) {
                                viewInfo.tasks[layerIndex].data.ggplot =
                                    output.data.ggplot;
                            }

                            if (output.data.splot) {
                                viewInfo.tasks[layerIndex].data.splot =
                                    output.data.splot;
                            }
                        }

                        // update the sort info
                        if (output.sortInfo) {
                            viewInfo.tasks[layerIndex].sortInfo =
                                output.sortInfo;
                        }

                        // update the filter info
                        if (output.filterInfo) {
                            viewInfo.tasks[layerIndex].filterInfo =
                                output.filterInfo;
                        }

                        // merge tools
                        let sharedTools = widgetService.getSharedTools();
                        sharedTools = mergeVizOptions(
                            _state.shared[insightID].theme,
                            sharedTools,
                            _state.widgets[widgetId].view[
                                _state.widgets[widgetId].active
                            ].appliedOrnaments
                        );

                        // manually copying over tools that are not already set. in the shared object
                        for (const sharedKey in sharedTools) {
                            if (
                                sharedTools.hasOwnProperty(sharedKey) &&
                                viewInfo.tools.shared[sharedKey] === undefined
                            ) {
                                viewInfo.tools.shared[sharedKey] =
                                    sharedTools[sharedKey];
                            }
                        }

                        if (taskOption.layout) {
                            // TODO in here check to see if we need to do the same logic as above, where we are copying over the default tools if they don't exist.
                            // Grab individual tools for new layout (when they do not exist)
                            if (Utility.isEmpty(viewInfo.tools.individual)) {
                                viewInfo.tools.individual = {};
                            }

                            if (!viewInfo.tools.individual[taskOption.layout]) {
                                // TODO this seems to be returning empty object all the time...? if it's supposed to return data, it needs to NOT use the layout name but the directive name of the visualization. They're no longer the same.
                                viewInfo.tools.individual[taskOption.layout] =
                                    widgetService.getIndividualTools(
                                        taskOption.layout
                                    );
                            }

                            if (
                                Utility.isEmpty(layerInfo) ||
                                (layerInfo && layerInfo.base)
                            ) {
                                viewInfo.layout = taskOption.layout;
                            }
                        }

                        // if groupByInfo exists then we will add to the store's task data
                        if (taskOption.groupByInfo) {
                            viewInfo.tasks[layerIndex].groupByInfo =
                                taskOption.groupByInfo;
                        }

                        // we need to 'construct' the keys object to be a combination of the meta and the actual keys to save the previous state
                        if (taskOption.alignment) {
                            // clear out the old keys
                            if (
                                Utility.isEmpty(layerInfo) ||
                                (layerInfo && layerInfo.base)
                            ) {
                                // TODO move usage of keys and layout to task level at all times...instead of keeping two of them
                                // if we're working with layers, don't clear this keys...
                                viewInfo.keys[taskOption.layout] = [];
                            }
                            // for merging layers
                            viewInfo.tasks[layerIndex].keys[taskOption.layout] =
                                [];

                            // need to loop through headerInfo first because it keeps track of ordering
                            // the order of the keys object is needed to recreate the Select component later on
                            // look for the matching header
                            for (
                                let k = 0,
                                    len3 =
                                        viewInfo.tasks[layerIndex].meta
                                            .headerInfo.length;
                                k < len3;
                                k++
                            ) {
                                for (const i in taskOption.alignment) {
                                    if (
                                        taskOption.alignment.hasOwnProperty(i)
                                    ) {
                                        // loop through each of the values
                                        for (
                                            let j = 0,
                                                len2 =
                                                    taskOption.alignment[i]
                                                        .length;
                                            j < len2;
                                            j++
                                        ) {
                                            if (
                                                viewInfo.tasks[layerIndex].meta
                                                    .headerInfo[k].alias ===
                                                taskOption.alignment[i][j]
                                            ) {
                                                const headerInfo = JSON.parse(
                                                    JSON.stringify(
                                                        viewInfo.tasks[
                                                            layerIndex
                                                        ].meta.headerInfo[k]
                                                    )
                                                );
                                                headerInfo.model = i;

                                                // standardize
                                                if (!headerInfo.derived) {
                                                    headerInfo.math = false;
                                                    headerInfo.calculatedBy =
                                                        false;
                                                    headerInfo.groupBy = [];
                                                }

                                                if (
                                                    !layerInfo ||
                                                    (layerInfo &&
                                                        layerInfo.base)
                                                ) {
                                                    viewInfo.keys[
                                                        taskOption.layout
                                                    ].push(headerInfo);
                                                }
                                                // for merging layers
                                            if (
                                                    taskOption.layout !== 'Graph' &&
                                                    taskOption.layout !== 'GraphGL' &&
                                                    taskOption.layout !== 'VivaGraph'
                                                ) {
                                                    // for merging layers
                                                    viewInfo.tasks[layerIndex].keys[taskOption.layout].push(headerInfo);
                                                    break;
                                                } else {
                                                    const layout = viewInfo.tasks[layerIndex].keys[taskOption.layout];
                                                    if (headerInfo.model === 'start' || headerInfo.model === 'end') {
                                                        layout.push(headerInfo);
                                                    } else if (headerInfo.model === 'facet') {
                                                        layout.push(headerInfo);
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if (layerInfo) {
                            viewInfo.tasks[layerIndex].layer = layerInfo;
                        }

                        // update the changes
                        if (newData) {
                            // mark that the task has been updated
                            if (
                                changes.frames.hasOwnProperty(
                                    'FRAME_PLACEHOLDER'
                                )
                            ) {
                                if (
                                    !changes.frames['FRAME_PLACEHOLDER'].tasks
                                ) {
                                    changes.frames['FRAME_PLACEHOLDER'].tasks =
                                        [];
                                }

                                changes.frames['FRAME_PLACEHOLDER'].tasks.push(
                                    _state.widgets[widgetId].panelId
                                );
                            }

                            // mark it as new task
                            changes.panels[_state.widgets[widgetId].panelId] =
                                angular.merge(
                                    changes.panels[
                                        _state.widgets[widgetId].panelId
                                    ] || {},
                                    {
                                        newTask: true,
                                    }
                                );
                        } else {
                            // mark that the task has been updated
                            changes.panels[_state.widgets[widgetId].panelId] =
                                angular.merge(
                                    changes.panels[
                                        _state.widgets[widgetId].panelId
                                    ] || {},
                                    {
                                        updatedTask: true,
                                    }
                                );
                        }
                    }
                }
            }
        }
    }

    /**
     * @name REMOVE_LAYER
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc remove a layer from the tasks
     */
    function REMOVE_LAYER(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        let panelId: string = output.panel,
            widgetId: string = findWidget(insightID, panelId),
            layerId = output.layer,
            viewInfo: any,
            foundTask: boolean;

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        foundTask = false;

        viewInfo =
            _state.widgets[widgetId].view[_state.widgets[widgetId].active];
        for (
            let taskIdx = 0, taskLen = viewInfo.tasks.length;
            taskIdx < taskLen;
            taskIdx++
        ) {
            if (viewInfo.tasks[taskIdx].layer) {
                // if the task has layer info, then we check to see if this is the layer we need to remove
                if (viewInfo.tasks[taskIdx].layer.id === layerId) {
                    foundTask = true;
                }
            } else {
                // if the task has no layer info, then it's assumed that its layerId is === 'base'
                if (layerId === 'base') {
                    foundTask = true;
                }
            }

            if (foundTask) {
                // remove this task from the store
                viewInfo.tasks.splice(taskIdx, 1);
                // if the base layer is removed, we need to assign a new base
                // new base will be the next task, so we will set that in the layer info
                // so when we go throug the refresh logic, it will set the base correctly
                if (taskIdx === 0) {
                    // if there are still tasks remaining
                    if (viewInfo.tasks[0] && viewInfo.tasks[0].layer) {
                        viewInfo.tasks[0].layer.base = true;
                    }
                }
                break;
            }
        }

        if (foundTask) {
            // remove the panel from frames ... this needs to be rerun
            if (changes.frames.hasOwnProperty('FRAME_PLACEHOLDER')) {
                console.log(
                    'Figure out how to do this probably, this is dependent on the task, not the frame'
                );
                if (!changes.frames['FRAME_PLACEHOLDER'].tasks) {
                    // this is all of the frames, because we don't wanna refresh everything
                    changes.frames['FRAME_PLACEHOLDER'].tasks = [];

                    for (const widgetId in _state.widgets) {
                        if (_state.widgets.hasOwnProperty(widgetId)) {
                            changes.frames['FRAME_PLACEHOLDER'].tasks.push(
                                _state.widgets[widgetId].panelId
                            );
                        }
                    }
                }

                // if the task was previously executed, we need to refresh it
                const taskIdx = changes.frames[
                    'FRAME_PLACEHOLDER'
                ].tasks.indexOf(_state.widgets[widgetId].panelId);
                if (taskIdx !== -1) {
                    changes.frames['FRAME_PLACEHOLDER'].tasks.splice(
                        taskIdx,
                        1
                    );
                }
            }

            // treat as a new task, it will cause the visualization to refresh
            changes.panels[_state.widgets[widgetId].panelId] = angular.merge(
                changes.panels[_state.widgets[widgetId].panelId] || {},
                {
                    newTask: true,
                }
            );
        }
    }

    /**
     * @name RESET_PANEL_TASKS
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc resets the panel tasks
     */
    function RESET_PANEL_TASKS(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        for (let taskIndex = 0; taskIndex < output.length; taskIndex++) {
            TASK_DATA(changes, output[taskIndex].output, insightID, '');
        }

        // changes are handled
    }

    /**
     * @name VIZ_OUTPUT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc
     */
    function VIZ_OUTPUT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const panelId: string = output.panelId,
            widgetId: string = findWidget(insightID, panelId);

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        const layerIdx = 0;
        if (output.headers && output.data) {
            _state.widgets[widgetId].view.visualization.tasks[layerIdx].data =
                angular.extend(
                    output,
                    Visualization.formatTableData(
                        output.headers,
                        output.data,
                        output.rawHeaders
                    )
                );
        } else {
            _state.widgets[widgetId].view.visualization.tasks[layerIdx].data =
                output;
        }

        _state.widgets[widgetId].view.visualization.layout = output.layout;
        _state.widgets[widgetId].view.layout = output.layout;
        _state.widgets[widgetId].active = 'visualization';

        // mark that the task has been updated
        if (changes.frames.hasOwnProperty('FRAME_PLACEHOLDER')) {
            if (!changes.frames['FRAME_PLACEHOLDER'].tasks) {
                changes.frames['FRAME_PLACEHOLDER'].tasks = [];
            }

            changes.frames['FRAME_PLACEHOLDER'].tasks.push(
                _state.widgets[widgetId].panelId
            );
        }

        // mark it as new task
        changes.panels[_state.widgets[widgetId].panelId] = angular.merge(
            changes.panels[_state.widgets[widgetId].panelId] || {},
            {
                newTask: true,
            }
        );
    }

    /**
     * @name PANEL_OPEN
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that opens a new panel
     */
    function PANEL_OPEN(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        let exists = false,
            newPanelId: string = output.panelId,
            newWidgetId: string | boolean;

        // check if it was already there
        if (findWidget(insightID, newPanelId)) {
            exists = true;
        }

        // set the new widget (or reset it)
        newWidgetId = newPanel(insightID, newPanelId);

        // update share if it is new
        if (!exists) {
            const newCounter: number = findPanelCounter(newPanelId);
            if (_state.shared[insightID].panelCounter < newCounter) {
                _state.shared[insightID].panelCounter = newCounter;
            }

            _state.shared[insightID].panels.push({
                panelId: newPanelId,
                widgetId: newWidgetId,
            });
        }

        // if it exists, we still add again (and will make it act like a refresh)
        changes.panels[newPanelId] = {
            added: true,
            panel: {
                panelId: output.panelId,
                sheetId: output.sheetId || '0',
            },
        };

        // update the config
        PANEL_CONFIG(changes, output, insightID);
    }

    /**
     * @name PANEL_CLONE
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that opens a clone
     */
    function PANEL_CLONE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        let exists = false,
            originalPanelId: string = output.original.panelId,
            clonePanelId: string = output.clone.panelId;

        // check if it was already there
        if (findWidget(insightID, clonePanelId)) {
            exists = true;
        }

        const originalWidgetId: string = findWidget(insightID, originalPanelId);
        if (!originalWidgetId) {
            console.error(
                'Cannot find widget for widgetId:' + originalWidgetId
            );
            return;
        }

        const widget = getWidget(originalWidgetId);

        // delete extra widgetId
        delete widget.widgetId;

        // remove the taskId (they are different tasks technically.... we just do not rerun one)
        for (const view in widget.view) {
            if (widget.view.hasOwnProperty(view)) {
                for (
                    let layerIdx = 0, layerLen = widget.view[view].tasks.length;
                    layerIdx < layerLen;
                    layerIdx++
                ) {
                    if (
                        widget.view[view].tasks[layerIdx] &&
                        widget.view[view].tasks[layerIdx].taskId
                    ) {
                        widget.view[view].tasks[layerIdx].taskId = '';
                    }
                }
            }
        }

        // modify what is needed
        widget.active = output.clone.view;

        // output.clone is pass by reference so any modifications made to the clone later in the pixel will
        // be available here
        // set the new widget
        const newWidgetId = newPanel(insightID, clonePanelId, widget);

        // update share if it is new
        if (!exists) {
            const newCounter = findPanelCounter(output.clone.panelId);
            if (_state.shared[insightID].panelCounter < newCounter) {
                _state.shared[insightID].panelCounter = newCounter;
            }

            _state.shared[insightID].panels.push({
                panelId: clonePanelId,
                widgetId: newWidgetId,
            });
        }

        // if it exists, we still add again (and will make it act like a refresh)
        changes.panels[clonePanelId] = {
            added: true,
            panel: {
                panelId: clonePanelId,
                sheetId: output.clone.sheetId,
            },
        };

        // update the config
        PANEL_CONFIG(changes, output.clone, insightID);
    }

    /**
     * @name CACHED_PANEL_CLONE
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that opens a clone
     */
    function CACHED_PANEL_CLONE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // when its a cached panel clone, the cloned panel already exists via CachedPanel in the beginning of the recipe
        const originalPanelId: string = output.original.panelId,
            clonePanelId: string = output.clone.panelId;

        const originalWidgetId: string = findWidget(insightID, originalPanelId);
        const cloneWidgetId: string = findWidget(insightID, clonePanelId);
        if (!originalWidgetId) {
            console.error(
                'Cannot find widget for widgetId:' + originalWidgetId
            );
            return;
        }

        const widget = getWidget(originalWidgetId);
        const cloneWidget = getWidget(cloneWidgetId);

        // copy over cloneWidget's view information to widget so that it is persisted.
        for (const cloneView in cloneWidget.view) {
            // we want to persist widget's visualization to copy over the task information so lets skip it
            if (cloneView === 'visualization') {
                continue;
            }

            widget.view[cloneView] = Utility.freeze(
                cloneWidget.view[cloneView]
            );
        }

        // delete extra widgetId
        delete widget.widgetId;

        // remove the taskId (they are different tasks technically.... we just do not rerun one)
        for (const view in widget.view) {
            if (widget.view.hasOwnProperty(view)) {
                for (
                    let layerIdx = 0, layerLen = widget.view[view].tasks.length;
                    layerIdx < layerLen;
                    layerIdx++
                ) {
                    if (
                        widget.view[view].tasks[layerIdx] &&
                        widget.view[view].tasks[layerIdx].taskId
                    ) {
                        widget.view[view].tasks[layerIdx].taskId = '';
                    }
                }
            }
        }

        // modify what is needed
        widget.active = output.clone.view;

        // copy over data from the original widget
        newPanel(insightID, clonePanelId, widget);

        // if it exists, we still add again (and will make it act like a refresh)
        changes.panels[clonePanelId] = {
            added: true,
            panel: {
                panelId: clonePanelId,
                sheetId: output.clone.sheetId,
            },
        };

        // update the config
        PANEL_CONFIG(changes, output.clone, insightID);
    }

    /**
     * @name PANEL_CLOSE
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates a closed insight
     */
    function PANEL_CLOSE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const closedPanelId = output;

        // Search for the widget to close
        for (const i in _state.widgets) {
            if (_state.widgets.hasOwnProperty(i)) {
                if (
                    _state.widgets[i].insightID === insightID &&
                    String(_state.widgets[i].panelId) === closedPanelId
                ) {
                    // if panel is closed...we don't want to do anything with it so wipe out all the changes otherwise we will run into null pointers.
                    changes.panels[closedPanelId] = {
                        closed: true,
                    };

                    deletePanel(insightID, closedPanelId);
                }
            }
        }
    }

    /**
     * @name PANEL_VIEW
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for panel ornaments
     */
    function PANEL_VIEW(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        let panelId: string = output.panelId,
            widgetId: string = findWidget(insightID, panelId),
            updateView = false;

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        if (output.view !== _state.widgets[widgetId].active) {
            _state.widgets[widgetId].active = output.view;
            updateView = true;
        }

        // initialize if it isn't there
        if (!_state.widgets[widgetId].view[_state.widgets[widgetId].active]) {
            _state.widgets[widgetId].view[_state.widgets[widgetId].active] = {
                options: {},
                layout: false,
                events: {},
                tools: {
                    shared: mergeVizOptions(
                        _state.shared[insightID].theme,
                        widgetService.getSharedTools(),
                        {}
                    ),
                    individual: {},
                },
                tasks: [],
                keys: {},
                colorByValue: [],
            };
        }

        if (output.options) {
            _state.widgets[widgetId].view[
                _state.widgets[widgetId].active
            ].options = angular.extend(
                _state.widgets[widgetId].view[_state.widgets[widgetId].active]
                    .options,
                JSON.parse(output.options)
            );
            updateView = true;
        }

        if (updateView) {
            changes.panels[panelId] = angular.merge(
                changes.panels[panelId] || {},
                {
                    view: true,
                }
            );
        }
    }

    /**
     * @name PANEL_ORNAMENT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for panel ornaments
     */
    function PANEL_ORNAMENT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        let panelId: string = output.panelId,
            widgetId: string = findWidget(insightID, panelId),
            updateOrnaments = false,
            ornaments: any;

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        if (output.path) {
            ornaments = output.ornaments;
            output.ornaments = {};
            Utility.setter(output.ornaments, output.path, ornaments);
        }

        if (output.ornaments) {
            if (output.ornaments.tools) {
                if (output.ornaments.tools.shared) {
                    // Keeps track of what ornaments are applied (used for themes)
                    const applied = {};
                    // add the shared tools
                    for (const i in output.ornaments.tools.shared) {
                        if (output.ornaments.tools.shared.hasOwnProperty(i)) {
                            _state.widgets[widgetId].view[
                                _state.widgets[widgetId].active
                            ].tools.shared[i] =
                                output.ornaments.tools.shared[i];
                            applied[i] = true;
                        }
                        if (i === 'limit') {
                            optionsService.set(
                                widgetId,
                                'limit',
                                output.ornaments.tools.shared.limit
                            );
                        }
                        // TODO: Fix for Legacy CBV
                        if (i === 'colorByValue') {
                            if (
                                !_state.widgets[widgetId].view[
                                    _state.widgets[widgetId].active
                                ].hasOwnProperty('colorByValue')
                            ) {
                                _state.widgets[widgetId].view[
                                    _state.widgets[widgetId].active
                                ].colorByValue = [];
                            }

                            for (
                                let idx = 0,
                                    len =
                                        output.ornaments.tools.shared[i].length;
                                idx < len;
                                idx++
                            ) {
                                _state.widgets[widgetId].view[
                                    _state.widgets[widgetId].active
                                ].colorByValue.push({
                                    name: output.ornaments.tools.shared[i][idx]
                                        .ruleId,
                                    filters: [
                                        {
                                            filterStr:
                                                output.ornaments.tools.shared[
                                                    i
                                                ][idx].filterQuery,
                                        },
                                    ],
                                    havings: [],
                                    color: output.ornaments.tools.shared[i][idx]
                                        .color,
                                    colorOn:
                                        output.ornaments.tools.shared[i][idx]
                                            .colorOn,
                                    highlightRow: output.ornaments.tools.shared[
                                        i
                                    ][idx].highlightRow
                                        ? output.ornaments.tools.shared[i][idx]
                                              .highlightRow
                                        : false,
                                    valuesToColor:
                                        output.ornaments.tools.shared[i][idx]
                                            .valuesToColor,
                                    taskId: false,
                                    collected: -1,
                                    available: false,
                                });
                            }

                            console.warn(
                                'Running a Legacy Fix for Color by Value - Upgrade It'
                            );

                            delete output.ornaments.tools.shared[i];
                        } else if (i === 'pixelTimer') {
                            // not really an ornamnet but we need a way to save this to recipe
                            _state.widgets[widgetId].pixelTimer =
                                output.ornaments.tools.shared[i];
                        } else if (i === 'customColors') {
                            for (const customColor in output.ornaments.tools
                                .shared[i]) {
                                if (
                                    output.ornaments.tools.shared[
                                        i
                                    ].hasOwnProperty(customColor)
                                ) {
                                    // add to the list of palettes so all visualizations can pick it up
                                    VIZ_COLORS[
                                        'COLOR_' + customColor.toUpperCase()
                                    ] = JSON.parse(
                                        output.ornaments.tools.shared[i][
                                            customColor
                                        ]
                                    );
                                }
                            }
                        } else if (i === 'editXAxis') {
                            // override theme with panel ornament
                            _state.widgets[widgetId].view[
                                _state.widgets[widgetId].active
                            ].tools.shared.axis.label.fontSize =
                                output.ornaments.tools.shared[i].fontSize;
                        } else if (
                            i === 'customizeBarLabel' ||
                            i === 'customizeLabel' ||
                            i === 'customizeGraphLabel' ||
                            i === 'customizeFunnelLabel'
                        ) {
                            // override theme with panel ornament
                            const ornaments: any = {
                                fontSize:
                                    output.ornaments.tools.shared[i].fontSize,
                            };
                            if (i !== 'customizeFunnelLabel') {
                                ornaments.fontFamily =
                                    output.ornaments.tools.shared[i].fontFamily;
                            }
                            if (
                                i === 'customizeBarLabel' ||
                                i === 'customizeLabel'
                            ) {
                                ornaments.fontWeight =
                                    output.ornaments.tools.shared[i].fontWeight;
                                ornaments.fontColor =
                                    output.ornaments.tools.shared[i].fontColor;
                            }
                            _state.widgets[widgetId].view[
                                _state.widgets[widgetId].active
                            ].tools.shared.valueLabel = angular.merge(
                                {},
                                _state.widgets[widgetId].view[
                                    _state.widgets[widgetId].active
                                ].tools.shared.valueLabel,
                                ornaments
                            );
                        }
                    }
                    // Reset applied ornaments
                    if (
                        _state.widgets[widgetId].view[
                            _state.widgets[widgetId].active
                        ].appliedOrnaments
                    ) {
                        _state.widgets[widgetId].view[
                            _state.widgets[widgetId].active
                        ].appliedOrnaments = applied;
                    }
                    // Must refresh the ornaments by merging with the theme options
                    const newOptions = mergeVizOptions(
                        _state.shared[insightID].theme,
                        _state.widgets[widgetId].view[
                            _state.widgets[widgetId].active
                        ].tools.shared,
                        applied
                    );
                    _state.widgets[widgetId].view[
                        _state.widgets[widgetId].active
                    ].tools.shared = newOptions;
                }

                if (output.ornaments.tools.individual) {
                    // add the shared tools
                    for (const i in output.ornaments.tools.individual) {
                        if (
                            output.ornaments.tools.individual.hasOwnProperty(i)
                        ) {
                            if (
                                !_state.widgets[widgetId].view[
                                    _state.widgets[widgetId].active
                                ].tools.individual[i]
                            ) {
                                _state.widgets[widgetId].view[
                                    _state.widgets[widgetId].active
                                ].tools.individual[i] = {};
                            }

                            // the final state is sent back, not the delta!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                            _state.widgets[widgetId].view[
                                _state.widgets[widgetId].active
                            ].tools.individual[i] =
                                output.ornaments.tools.individual[i];
                        }
                    }
                }

                updateOrnaments = true;
            }

            if (output.ornaments.editOptions) {
                _state.widgets[widgetId].view[
                    _state.widgets[widgetId].active
                ].editOptions = output.ornaments.editOptions;

                updateOrnaments = true;
            }

            if (output.ornaments.dashboardFilter) {
                if (
                    !_state.widgets[widgetId].view[
                        _state.widgets[widgetId].active
                    ]
                ) {
                    _state.widgets[widgetId].view[
                        _state.widgets[widgetId].active
                    ] = _state.widgets[widgetId].view.visualization;
                }

                _state.widgets[widgetId].view[
                    _state.widgets[widgetId].active
                ].dashboardFilter = output.ornaments.dashboardFilter;

                updateOrnaments = true;
            }

            if (updateOrnaments) {
                changes.panels[panelId] = angular.merge(
                    changes.panels[panelId] || {},
                    {
                        ornaments: true,
                    }
                );
            }
        }
    }

    /**
     * @name PANEL_ORNAMENT_DATA
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for panel ornament data changes
     */
    function PANEL_ORNAMENT_DATA(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        if (output.taskOptions) {
            let panelId: string = output.taskOptions.panelId,
                widgetId: string = findWidget(insightID, panelId),
                values: any[];

            if (!widgetId) {
                console.error('Cannot find widget for widgetId:' + widgetId);
                return;
            }

            if (output.taskOptions.type === 'color') {
                values = [];
                for (
                    let idx = 0, len = output.data.values.length;
                    idx < len;
                    idx++
                ) {
                    values.push(output.data.values[idx][0]);
                }

                for (
                    let idx = 0,
                        len =
                            _state.widgets[widgetId].view[
                                _state.widgets[widgetId].active
                            ].colorByValue.length;
                    idx < len;
                    idx++
                ) {
                    if (
                        _state.widgets[widgetId].view[
                            _state.widgets[widgetId].active
                        ].colorByValue[idx].name === output.taskOptions.name
                    ) {
                        if (
                            _state.widgets[widgetId].view[
                                _state.widgets[widgetId].active
                            ].colorByValue[idx].taskId === output.taskId
                        ) {
                            _state.widgets[widgetId].view[
                                _state.widgets[widgetId].active
                            ].colorByValue[idx].valuesToColor = [];
                        }

                        _state.widgets[widgetId].view[
                            _state.widgets[widgetId].active
                        ].colorByValue[idx].valuesToColor =
                            _state.widgets[widgetId].view[
                                _state.widgets[widgetId].active
                            ].colorByValue[idx].valuesToColor.concat(values);
                        _state.widgets[widgetId].view[
                            _state.widgets[widgetId].active
                        ].colorByValue[idx].taskId = output.taskId;
                        _state.widgets[widgetId].view[
                            _state.widgets[widgetId].active
                        ].colorByValue[idx].collected = output.numCollected;
                        _state.widgets[widgetId].view[
                            _state.widgets[widgetId].active
                        ].colorByValue[idx].available =
                            output.data.values.length === output.numCollected;
                    }
                }

                // treat it as a new task
                // mark that the task has been updated
                if (changes.frames.hasOwnProperty('FRAME_PLACEHOLDER')) {
                    if (!changes.frames['FRAME_PLACEHOLDER'].tasks) {
                        changes.frames['FRAME_PLACEHOLDER'].tasks = [];
                    }

                    changes.frames['FRAME_PLACEHOLDER'].tasks.push(
                        _state.widgets[widgetId].panelId
                    );
                }

                // mark it as new task
                changes.panels[_state.widgets[widgetId].panelId] =
                    angular.merge(
                        changes.panels[_state.widgets[widgetId].panelId] || {},
                        {
                            newTask: true,
                        }
                    );
            }
        }
    }

    /**
     * @name PANEL_LABEL
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for panel label
     */
    function PANEL_LABEL(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const panelId: string = output.panelId,
            widgetId: string = findWidget(insightID, panelId);

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        if (output.hasOwnProperty('panelLabel')) {
            // just a pass through
            changes.panels[panelId] = angular.merge(
                changes.panels[panelId] || {},
                {
                    configured: true,
                    panel: {
                        labelOverride: true,
                        panelLabel: output.panelLabel,
                    },
                }
            );
        }
    }

    /**
     * @name PANEL_CONFIG
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for the panel configuration
     */
    function PANEL_CONFIG(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const panelId: string = output.panelId,
            widgetId: string = findWidget(insightID, panelId);

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        changes.panels[panelId] = angular.merge(changes.panels[panelId] || {}, {
            configured: true,
            panel: {
                panelId: output.panelId,
                config: output.config || {},
            },
        });
    }

    /**
     * @name PANEL_COMMENT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for the comments
     */
    function PANEL_COMMENT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        if (output.commentData) {
            const panelId: string = output.panelId,
                widgetId: string = findWidget(insightID, panelId);

            if (!widgetId) {
                console.error('Cannot find widget for widgetId:' + widgetId);
                return;
            }

            for (const commendId in output.commentData) {
                if (output.commentData.hasOwnProperty(commendId)) {
                    output.commentData[commendId].commentText =
                        decodeURIComponent(
                            output.commentData[commendId].commentText
                        );
                }
            }
            _state.widgets[widgetId].view[
                _state.widgets[widgetId].active
            ].commentData = output.commentData;

            // TODO maybe update changes to be comments instead of ornaments?
            changes.panels[panelId] = angular.merge(
                changes.panels[panelId] || {},
                {
                    ornaments: true,
                }
            );
        }
    }

    /**
     * @name PANEL_EVENT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for panel events
     */
    function PANEL_EVENT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        if (output.events) {
            const panelId: string = output.panelId,
                widgetId: string = findWidget(insightID, panelId);

            if (!widgetId) {
                console.error('Cannot find widget for widgetId:' + widgetId);
                return;
            }

            // need to decode the query cuz we always encode it to make sure they parse correctly...=/
            for (const action in output.events) {
                if (output.events.hasOwnProperty(action)) {
                    let emptyEvent = true;
                    for (const event in output.events[action]) {
                        if (output.events[action].hasOwnProperty(event)) {
                            emptyEvent = false;
                        }
                    }
                    // remove empty events so they dont show on the ui
                    if (emptyEvent) {
                        delete output.events[action];
                    }
                }
            }

            // remove event if there are no existing events
            _state.widgets[widgetId].events = output.events;

            changes.panels[panelId] = angular.merge(
                changes.panels[panelId] || {},
                {
                    events: true,
                }
            );
        }
    }

    /**
     * @name PANEL_FILTER_CHANGE
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for panel filters
     */
    function PANEL_FILTER_CHANGE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const panelId: string = output.name,
            widgetId: string = findWidget(insightID, panelId);

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        // remove the panel from frames ... this needs to be rerun
        if (changes.frames.hasOwnProperty('FRAME_PLACEHOLDER')) {
            console.log(
                'Figure out how to do this probably, this is dependent on the task, not the frame'
            );
            if (!changes.frames['FRAME_PLACEHOLDER'].tasks) {
                // this is all of the frames, because we don't wanna refresh everything
                changes.frames['FRAME_PLACEHOLDER'].tasks = [];

                for (const widgetId in _state.widgets) {
                    if (_state.widgets.hasOwnProperty(widgetId)) {
                        changes.frames['FRAME_PLACEHOLDER'].tasks.push(
                            _state.widgets[widgetId].panelId
                        );
                    }
                }
            }

            // if the task was previously executed, we need to refresh it
            const taskIdx =
                changes.frames['FRAME_PLACEHOLDER'].tasks.indexOf(panelId);
            if (taskIdx !== -1) {
                changes.frames['FRAME_PLACEHOLDER'].tasks.splice(taskIdx, 1);
            }
        } else {
            changes.frames['FRAME_PLACEHOLDER'] = {
                updated: false,
                filtered: false,
                tasks: [], // clear out the tasks
            };
        }

        // mark that filter has been added
        changes.panels[panelId] = angular.merge(changes.panels[panelId] || {}, {
            filtered: true,
        });
    }

    /**
     * @name PANEL_SORT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for panel filters
     */
    function PANEL_SORT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const panelId: string = output.name,
            widgetId: string = findWidget(insightID, panelId);

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        // remove the panel from frames ... this needs to be rerun
        if (changes.frames.hasOwnProperty('FRAME_PLACEHOLDER')) {
            console.log(
                'Figure out how to do this probably, this is dependent on the task, not the frame'
            );
            if (!changes.frames['FRAME_PLACEHOLDER'].tasks) {
                // this is all of the frames, because we don't wanna refresh everything
                changes.frames['FRAME_PLACEHOLDER'].tasks = [];

                for (const widgetId in _state.widgets) {
                    if (_state.widgets.hasOwnProperty(widgetId)) {
                        changes.frames['FRAME_PLACEHOLDER'].tasks.push(
                            _state.widgets[widgetId].panelId
                        );
                    }
                }
            }

            // if the task was previously executed, we need to refresh it
            const taskIdx =
                changes.frames['FRAME_PLACEHOLDER'].tasks.indexOf(panelId);
            if (taskIdx !== -1) {
                changes.frames['FRAME_PLACEHOLDER'].tasks.splice(taskIdx, 1);
            }
        }

        // change anything?
    }

    /**
     * @name PANEL_COLLECT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the limit to collect for the panel
     */
    function PANEL_COLLECT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const panelId: string = output.panelId,
            widgetId: string = findWidget(insightID, panelId),
            limit = output.numCollect;

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        optionsService.set(widgetId, 'limit', limit);
    }

    /**
     * @name ADD_PANEL_COLOR_BY_VALUE
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store when color by value is added
     */
    function ADD_PANEL_COLOR_BY_VALUE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const panelId: string = output.panelId,
            widgetId: string = findWidget(insightID, panelId);

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        if (
            !_state.widgets[widgetId].view[
                _state.widgets[widgetId].active
            ].hasOwnProperty('colorByValue')
        ) {
            _state.widgets[widgetId].view[
                _state.widgets[widgetId].active
            ].colorByValue = [];
        }

        _state.widgets[widgetId].view[
            _state.widgets[widgetId].active
        ].colorByValue.push({
            name: output.name,
            havings: output.havingInfo,
            filters: output.filterInfo,
            color: output.options.color,
            colorOn: output.options.colorOn,
            valuesColumn: output.options.valuesColumn,
            highlightRow: output.options.highlightRow
                ? output.options.highlightRow
                : false,
            selectedValues: output.options.selectedValues || [],
            comparator: output.options.comparator || {},
            queued: output.options.queued || false,
            restrict: output.options.restrict || false,
            valuesToColor: [],
            taskId: false,
            collected: -1,
            available: false,
        });

        // remove the panel from frames ... this needs to be rerun
        if (changes.frames.hasOwnProperty('FRAME_PLACEHOLDER')) {
            console.log(
                'Figure out how to do this probably, this is dependent on the task, not the frame'
            );
            if (!changes.frames['FRAME_PLACEHOLDER'].tasks) {
                // this is all of the frames, because we don't wanna refresh everything
                changes.frames['FRAME_PLACEHOLDER'].tasks = [];

                for (const widgetId in _state.widgets) {
                    if (_state.widgets.hasOwnProperty(widgetId)) {
                        changes.frames['FRAME_PLACEHOLDER'].tasks.push(
                            _state.widgets[widgetId].panelId
                        );
                    }
                }
            }

            // if the task was previously executed, we need to refresh it
            const taskIdx =
                changes.frames['FRAME_PLACEHOLDER'].tasks.indexOf(panelId);
            if (taskIdx !== -1) {
                changes.frames['FRAME_PLACEHOLDER'].tasks.splice(taskIdx, 1);
            }
        }

        // mark that color by value has been added
        changes.panels[panelId] = angular.merge(changes.panels[panelId] || {}, {
            colorByValue: true,
            updatedTask: true,
        });
    }

    /**
     * @name REMOVE_PANEL_COLOR_BY_VALUE
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store when color by value is removed
     */
    function REMOVE_PANEL_COLOR_BY_VALUE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const panelId: string = output.panelId,
            widgetId: string = findWidget(insightID, panelId);

        if (!widgetId) {
            console.error('Cannot find widget for widgetId:' + widgetId);
            return;
        }

        let i =
            _state.widgets[widgetId].view[_state.widgets[widgetId].active]
                .colorByValue.length;
        while (i--) {
            if (
                _state.widgets[widgetId].view[_state.widgets[widgetId].active]
                    .colorByValue[i].name === output.name
            ) {
                _state.widgets[widgetId].view[
                    _state.widgets[widgetId].active
                ].colorByValue.splice(i, 1);
            }
        }

        // we do not need to refresh, just need to update the view
        // mark that color by value has been removed
        changes.panels[panelId] = angular.merge(changes.panels[panelId] || {}, {
            colorByValue: true,
            updatedTask: true,
        });
    }

    /**
     * @name SHEET_OPEN
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that opens a new sheet
     */
    function SHEET_OPEN(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const newSheetId: string = output.sheetId;

        changes.worksheets[newSheetId] = {
            added: true,
            worksheet: {},
        };

        // update the config
        SHEET_CONFIG(changes, output, insightID);
    }

    /**
     * @name SHEET_CLOSE
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates a closed insight
     */
    function SHEET_CLOSE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const closedSheetId = output;

        changes.worksheets[closedSheetId] = {
            closed: true,
        };
    }

    /**
     * @name SHEET_LABEL
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for the sheet label
     */
    function SHEET_LABEL(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const sheetId: string = output.sheetId,
            worksheet = output;

        // check if there is a label
        if (worksheet.hasOwnProperty('sheetLabel')) {
            worksheet.labelOverride = true;
        }

        changes.worksheets[sheetId] = angular.merge(
            changes.worksheets[sheetId] || {},
            {
                configured: true,
                worksheet: worksheet,
            }
        );
    }

    /**
     * @name SHEET_CONFIG
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the store for the sheet configuration
     */
    function SHEET_CONFIG(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const sheetId: string = output.sheetId,
            worksheet = output;

        // check if there is a label
        if (worksheet.hasOwnProperty('sheetLabel')) {
            worksheet.labelOverride = true;
        }

        if (!changes.worksheets[sheetId]) {
            changes.worksheets[sheetId] = {};
        }

        changes.worksheets[sheetId].configured = true;

        // keep the existing worksheet changes by merging
        changes.worksheets[sheetId].worksheet = angular.merge(
            changes.worksheets[sheetId].worksheet || {},
            worksheet
        );

        // if golden is there, overwrite golden
        if (worksheet.golden) {
            changes.worksheets[sheetId].worksheet.golden = worksheet.golden;
        }
    }

    /**
     * @name CLEAR_INSIGHT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the dropped insight
     */
    function CLEAR_INSIGHT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // Search for the widget to close
        if (!output.suppress) {
            for (const i in _state.widgets) {
                if (_state.widgets.hasOwnProperty(i)) {
                    if (_state.widgets[i].insightID === insightID) {
                        // TODO: PROBABLY STUPID;
                        console.log('What do we run?');

                        // need to call clearinsight() for pipeline replay but cant close panel
                        if (_state.widgets[i].active !== 'pipeline') {
                            deletePanel(insightID, _state.widgets[i].panelId);
                        }
                    }
                }
            }
        }

        // Remove the frames
        for (const frame in _state.shared[insightID].frames) {
            if (_state.shared[insightID].frames.hasOwnProperty(frame)) {
                // delete the frame
                delete _state.shared[insightID].frames[frame];

                for (const widgetId in _state.widgets) {
                    if (_state.widgets.hasOwnProperty(widgetId)) {
                        if (_state.widgets[widgetId].insightID === insightID) {
                            // set to a new one
                            if (_state.widgets[widgetId].frame === frame) {
                                _state.widgets[widgetId].frame = Object.keys(
                                    _state.shared[insightID].frames
                                )[0];
                            }
                        }
                    }
                }

                changes.frames['FRAME_PLACEHOLDER'] = {
                    removed: true,
                };
            }
        }
    }

    /**
     * @name DROP_INSIGHT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function that updates the dropped insight
     */
    function DROP_INSIGHT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // Search for the widget to close
        for (const widgetId in _state.widgets) {
            if (_state.widgets.hasOwnProperty(widgetId)) {
                if (_state.widgets[widgetId].insightID === insightID) {
                    deletePanel(insightID, _state.widgets[widgetId].panelId);
                }
            }
        }

        // remove the insight
        if (_state.shared.hasOwnProperty(insightID)) {
            changes.insight = {
                closed: true,
            };

            // delete from store
            delete _state.shared[insightID];
        }
    }

    /**
     * @name DASHBOARD_INSIGHT_CONFIGURATION
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function updates a dashboard
     */
    function DASHBOARD_INSIGHT_CONFIGURATION(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // use the current sheet (0)
        const insightConfig = output.insightConfig,
            layoutConfig = output.layoutConfig
                ? JSON.parse(output.layoutConfig)
                : {},
            recipe: any[] = [],
            config = {};

        // get all of the old panels
        if (layoutConfig && layoutConfig.hasOwnProperty('currentLayout')) {
            for (
                let widgetIdx = 0,
                    widgetLen =
                        layoutConfig.currentLayout.availableWidgets.length;
                widgetIdx < widgetLen;
                widgetIdx++
            ) {
                if (
                    layoutConfig.currentLayout.availableWidgets[widgetIdx]
                        .deleted
                ) {
                    continue;
                }

                // add this panel
                const widgetId =
                    layoutConfig.currentLayout.availableWidgets[widgetIdx]
                        .widgetId;
                if (
                    layoutConfig.currentLayout.config.panels.hasOwnProperty(
                        widgetId
                    )
                ) {
                    const split = widgetId.split('___');
                    if (typeof split[1] !== 'undefined') {
                        const panelId = split[1];

                        const oldId = String(split[0]).replace(
                            /SMSSWidget/g,
                            ''
                        );
                        if (!config.hasOwnProperty(oldId)) {
                            config[oldId] = [];
                        }

                        config[oldId].push({
                            panelId: panelId,
                            config:
                                layoutConfig.currentLayout.config.panels[
                                    widgetId
                                ] || {},
                        });
                    }
                }
            }
        }

        // replace any use of the oldId with the newId...specifically for when dashboard filters get saved with oldId configurations.
        for (
            let insightIdx = 0, insightLen = insightConfig.length;
            insightIdx < insightLen;
            insightIdx++
        ) {
            for (let k = 0, len = insightConfig.length; k < len; k++) {
                const regex = new RegExp(insightConfig[k].oldId, 'g');
                insightConfig[insightIdx].recipe = insightConfig[
                    insightIdx
                ].recipe.replace(regex, insightConfig[k].newId);
            }

            // first thing we have to do is create the new insight
            newInsight(insightConfig[insightIdx].newId, {
                insight: {
                    name: insightConfig[insightIdx].name,
                    app_id: insightConfig[insightIdx].app_id,
                    app_name: insightConfig[insightIdx].app_name,
                    app_insight_id: insightConfig[insightIdx].app_insight_id,
                },
            });

            // message the new insight
            messageService.emit('new-insight', {
                insightID: insightConfig[insightIdx].newId,
            });

            // default to presentation mode
            messageService.emit('change-presentation', {
                insightID: insightConfig[insightIdx].newId,
                presentation: true,
            });

            // save recipe
            recipe.push({
                command: insightConfig[insightIdx].recipe,
                insightID: insightConfig[insightIdx].newId,
                panels: config.hasOwnProperty(insightConfig[insightIdx].oldId)
                    ? config[insightConfig[insightIdx].oldId]
                    : [],
            });
        }

        // run the recipes
        let counter = 0,
            total = recipe.length; // number of responses that we have to wait for

        for (
            let recipeIdx = 0, recipeLen = recipe.length;
            recipeIdx < recipeLen;
            recipeIdx++
        ) {
            const message = Utility.random('old-dashboard');

            messageService.once(
                message,
                function (payload: {
                    panels: any;
                    insightID: string;
                    firstInsightId: string;
                }) {
                    // update all of the configs
                    for (
                        let panelIdx = 0, panelLen = payload.panels.length;
                        panelIdx < panelLen;
                        panelIdx++
                    ) {
                        // hack for OLD DASHBOARDS, force it to be floating.....
                        payload.panels[panelIdx].config.type =
                            PANEL_TYPES.FLOATING;

                        messageService.emit('configure-panel', {
                            insightID: payload.insightID,
                            panelId: payload.panels[panelIdx].panelId,
                            widgetId: `SMSSWidget${payload.insightID}___${payload.panels[panelIdx].panelId}`,
                            panel: {
                                config: payload.panels[panelIdx].config,
                            },
                        });
                    }

                    // add to the counter
                    counter++;

                    // counter and total match, so this is the 'last' one
                    if (counter === total) {
                        $state.go('home.build', {
                            insight: payload.firstInsightId,
                        });

                        // drop the dashboard insightId (it is fake)
                        messageService.emit('execute-pixel', {
                            insightID: insightID,
                            commandList: [
                                {
                                    type: 'Pixel',
                                    components: ['DropInsight()'],
                                    terminal: true,
                                },
                            ],
                        });

                        // turn off the loading message
                        messageService.emit('stop-loading', {
                            id: false,
                        });
                    }
                }
            );

            // message back
            messageService.emit('execute-pixel', {
                insightID: recipe[recipeIdx].insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [recipe[recipeIdx].command],
                        terminal: true,
                    },
                ],
                responseObject: {
                    response: message,
                    payload: {
                        firstInsightId: recipe[0].insightID,
                        insightID: recipe[recipeIdx].insightID,
                        panels: recipe[recipeIdx].panels,
                    },
                },
            });
        }

        // turn off the loading message
        messageService.emit('start-loading', {
            id: false,
            message: 'Configuring Dashboard',
        });
    }

    /**
     * @name INSIGHT_CONFIG
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function updates an insights configuration
     */
    function INSIGHT_CONFIG(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // update sheets
        if (output.sheets) {
            for (const sheetId in output.sheets) {
                if (output.sheets.hasOwnProperty(sheetId)) {
                    // adding the sheetId (in case it wasn't defined)
                    output.sheets[sheetId].sheetId = sheetId;

                    SHEET_CONFIG(changes, output.sheets[sheetId], insightID);
                }
            }
        }

        // update the panels
        if (output.panels) {
            for (const panelId in output.panels) {
                if (output.panels.hasOwnProperty(panelId)) {
                    // adding the panelId (in case it wasn't defined)
                    output.panels[panelId].panelId = panelId;

                    PANEL_CONFIG(changes, output.panels[panelId], insightID);
                }
            }
        }

        // select the sheet
        if (output.sheet) {
            // select the one
            MOVE_SHEET(changes, output.sheet, insightID);
        }

        // toggle presentation
        if (output.presentation) {
            changes.presentation = output.presentation;
        }
    }

    /**
     * @name MOVE_SHEET
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc function updates an insights configuration
     */
    function MOVE_SHEET(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // select the sheet
        if (output) {
            changes.selected = output;
        }
    }

    /**
     * @name SUB_SCRIPT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc opens a new insight
     */
    function SUB_SCRIPT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        messageService.emit('update-pixel', {
            insightID: insightID,
            pixelReturn: output.insightData.pixelReturn,
        });
    }

    /**
     * @name NEW_EMPTY_INSIGHT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc opens a new insight
     */
    function NEW_EMPTY_INSIGHT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        messageService.emit('update-pixel', {
            insightID: output.insightData.insightID,
            pixelReturn: output.insightData.pixelReturn,
            recipe: output.recipe,
            direction: false,
            insight: {
                insight: {
                    name: '',
                },
            },
        });

        // no change for the current insight
    }

    /**
     * @name OPEN_SAVED_INSIGHT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc opens a new insight
     */
    function OPEN_SAVED_INSIGHT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        messageService.emit('update-pixel', {
            insightID: output.insightData.insightID,
            pixelReturn: output.insightData.pixelReturn,
            recipe: output.recipe,
            direction: false,
            fromOpen: true,
            insight: {
                insight: {
                    name: output.name,
                    app_id: output.app_id || output.core_engine,
                    app_name: output.app_name,
                    app_insight_id:
                        output.app_insight_id || output.core_engine_id,
                    params: output.params ? JSON.parse(output.params) : {},
                },
            },
        });

        // if the insight info has not been set, we will set it here. this happens when we do Open New Insight --> Open Existing Insight
        if (
            _state.shared[output.insightData.insightID] &&
            !_state.shared[output.insightData.insightID].insight.app_insight_id
        ) {
            _state.shared[output.insightData.insightID].insight.name =
                output.name;
            _state.shared[output.insightData.insightID].insight.app_id =
                output.app_id || output.core_engine;
            _state.shared[output.insightData.insightID].insight.app_name =
                output.app_name;
            _state.shared[output.insightData.insightID].insight.app_insight_id =
                output.app_insight_id || output.core_engine_id;
            _state.shared[output.insightData.insightID].insight.params =
                output.params ? JSON.parse(output.params) : {};
        }
    }

    /**
     * @name LOAD_INSIGHT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc opens a new insight
     */
    function LOAD_INSIGHT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        OPEN_SAVED_INSIGHT(changes, output, insightID);

        // always reset the insight information because this operation type is overriding the insight
        _state.shared[output.insightData.insightID].insight.name = output.name;
        _state.shared[output.insightData.insightID].insight.app_id =
            output.app_id || output.core_engine;
        _state.shared[output.insightData.insightID].insight.app_name =
            output.app_name;
        _state.shared[output.insightData.insightID].insight.app_insight_id =
            output.app_insight_id || output.core_engine_id;
        _state.shared[output.insightData.insightID].insight.params =
            output.params ? JSON.parse(output.params) : {};
    }

    /**
     * @name OLD_INSIGHT
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @param output the output of that expression
     */
    function OLD_INSIGHT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        let tempInsightID = 'OLD' + Math.floor(Math.random() * 1000000),
            widgetId: string | boolean,
            panelId = '0';

        // update the new insight
        newInsight(tempInsightID, {
            insight: {
                name: output.name,
                app_name: output.app_name,
                app_insight_id: output.app_insight_id,
                layout: output.layout,
                param: '',
            },
        });

        // message that a panel has been created
        messageService.emit('new-insight', {
            insightID: tempInsightID,
        });

        // create a panel
        widgetId = newPanel(tempInsightID, panelId, {
            active: 'playsheet',
            view: {
                playsheet: {
                    options: {
                        app_name: output.app_name,
                        app_insight_id: output.app_insight_id,
                        layout: output.layout,
                    },
                },
            },
        });

        // message that a panel has been created
        messageService.emit('add-panel', {
            insightID: tempInsightID,
            panelId: panelId,
            widgetId: widgetId,
            panel: {
                labelOverride: true,
                panelLabel: output.name,
            },
        });

        // navigate
        $state.go('home.build', {
            insight: tempInsightID,
        });

        // nothing to drop (since there is no insight)
    }

    /**
     * @name SAVE_INSIGHT
     * @param changes - changes object to track modifications
     * @param output the output of that expression
     * @param insightID the insightID that the expression ran on
     */
    function SAVE_INSIGHT(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // TODO update the recipe here...except for param...how do we know?
        _state.shared[insightID].insight.name = output.name;
        _state.shared[insightID].insight.app_id = output.app_id;
        _state.shared[insightID].insight.app_name = output.app_name;
        _state.shared[insightID].insight.app_insight_id = output.app_insight_id;

        changes.alerts.push({
            panel: false,
            color: 'success',
            text: 'Successfully saved insight(s)',
        });

        changes.insight = angular.merge(changes.insight || {}, {
            saved: true,
        });
    }

    /**
     * @name CACHED_SHEET
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc generates an insight when the sheet is cached
     */
    function CACHED_SHEET(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // this will open it
        SHEET_OPEN(changes, output, insightID);
    }

    /**
     * @name CACHED_PANEL
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc generates an insight when the panel is cached
     */
    function CACHED_PANEL(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        let panelId = output.panelId,
            outputData: {
                panelId: number;
                sheetId?: string;
                view?: string;
                options?: any;
                commentData?: any[];
                config?: any;
                events?: any;
                panelLabel?: string;
                ornaments?: any;
            } = {
                panelId: panelId,
            },
            widgetId = '';

        // need to reuse this logic in the next section so turning into a function...
        // PANEL_OPEN will add a new widget id which is why we're checking both before and after
        // we're doing two checks because of clones...if clone comes first, it will already create the widget id so we don't want to override its data
        // when that widget id has already been created.
        // TODO needs to review this logic..

        widgetId = findWidget(insightID, panelId);

        // there is none, we should create it....
        if (!widgetId) {
            outputData = {
                panelId: panelId,
                sheetId: output.sheetId,
            };

            PANEL_OPEN(changes, outputData, insightID);

            widgetId = findWidget(insightID, panelId);
        }

        if (output.view) {
            outputData = {
                panelId: panelId,
                view: output.view,
                options: output.viewOptions,
            };

            PANEL_VIEW(changes, outputData, insightID);
        }

        if (output.comments && !Utility.isEmpty(output.comments)) {
            outputData = {
                panelId: panelId,
                commentData: output.comments,
            };

            PANEL_COMMENT(changes, outputData, insightID);
        }

        if (output.config && !Utility.isEmpty(output.config)) {
            outputData = {
                panelId: panelId,
                config: output.config,
            };

            PANEL_CONFIG(changes, outputData, insightID);
        }

        if (output.events && !Utility.isEmpty(output.events)) {
            outputData.panelId = panelId;
            outputData.events = output.events;

            PANEL_EVENT(changes, outputData, insightID);
        }

        if (output.ornaments && !Utility.isEmpty(output.ornaments)) {
            outputData.panelId = panelId;
            outputData.ornaments = output.ornaments;

            PANEL_ORNAMENT(changes, outputData, insightID);
        }

        if (output.cbv && !Utility.isEmpty(output.cbv)) {
            output.cbv.forEach((cbv) => {
                outputData = cbv;
                outputData.panelId = panelId;

                ADD_PANEL_COLOR_BY_VALUE(changes, outputData, insightID);
            });
        }

        if (output.panelLabel) {
            outputData = {
                panelId: panelId,
                panelLabel: output.panelLabel,
            };

            PANEL_LABEL(changes, outputData, insightID);
        }

        //let frame = _state.widgets[widgetId].frame;
        const frame = 'FRAME_PLACEHOLDER';

        // task is always valid no need to refresh
        if (changes.frames.hasOwnProperty(frame)) {
            if (
                changes.frames[frame].tasks &&
                changes.frames[frame].tasks.indexOf(panelId) > -1
            ) {
                changes.frames[frame].tasks.push(panelId);
            }
        }

        changes.cached = true;
    }

    /**
     * @name FRAME_CACHE
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc turns the caching on/off for frames
     */
    function FRAME_CACHE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        _state.shared[insightID].frameCache = output;
    }

    /**
     * @name FRAME_SWAP
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc frame swap currently in progress
     */
    function FRAME_SWAP(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        _state.shared[insightID].frameSwap = true;
    }

    /**
     * @name LOGGIN_REQUIRED_ERROR
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc gives you a popup to sign into google and then rerun the insight
     */
    function LOGGIN_REQUIRED_ERROR(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        if (output.errorData && output.errorData.type) {
            changes.messages.push({
                message: 'pixel-login',
                payload: {
                    type: output.errorData.type,
                    insightID: insightID,
                    insight: {
                        app: output.app,
                        id: output.id,
                        params: output.params,
                        additionalPixels: output.additionalPixels,
                    },
                },
            });
        }
    }

    /**
     * @name OPEN_TAB
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc open a new tab
     */
    function OPEN_TAB(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // TODO: popup blocker will block it...need to find a better solution
        let url = output;
        if (!url.match(/^https?:\/\//i)) {
            // append http if not exist
            url = 'http://' + url;
        }

        changes.messages.push({
            message: 'open-tab',
            payload: {
                insightID: insightID,
                url: url,
            },
        });
    }

    /**
     * @name FILE_DOWNLOAD
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc downloads a file
     */
    function FILE_DOWNLOAD(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        changes.messages.push({
            message: 'download-file',
            payload: {
                insightID: insightID,
                file: output,
            },
        });
    }

    /**
     * @name VIZ_RECOMMENDATION
     * @param changes - changes object to track modifications
     * @param output - the output of the expression
     * @param insightID - insightID to execute off of
     * @desc updates what visualizations are recommended
     */
    function VIZ_RECOMMENDATION(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        const defaultFrame = Object.keys(_state.shared[insightID].frames)[0];

        if (defaultFrame) {
            _state.shared[insightID].frames[defaultFrame].recommendations =
                output;
        }

        changes.messages.push({
            message: 'visualization-recommendations-received',
            payload: {
                insightID: insightID,
            },
        });
    }

    /**
     * @name ALTER_DATABASE
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc response to ALTER DATABASE op type
     */
    function ALTER_DATABASE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        changes.messages.push({
            message: 'alter-database',
            payload: {
                insightID: insightID,
            },
        });
    }

    /**
     * @name CHECK_R_PACKAGES
     * @param changes - changes object to track modifications
     * @param output - pixel response output
     * @param insightID - selected insightID
     * @desc response to CHECK R PACKAGES op type
     */
    function CHECK_R_PACKAGES(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        changes.messages.push({
            message: 'update-installed-packages',
            payload: {
                packages: output,
            },
        });
    }

    /**
     * @name FILE
     * @param changes - changes object to track modifications
     * @param  output - the output of the expression
     * @desc response to FILE
     */
    function FILE(changes: PixelChange, output: any, insightID: string): void {
        // forcing view to be file loader
        // output.view = 'FileLoader';
        for (const panelId in output.taskOptions) {
            output.panelId = panelId;
            output.view = 'visualization';

            // changes handled by PANEL_VIEW
            PANEL_VIEW(changes, output, insightID);
        }
    }

    /**
     * @name RERUN_INSIGHT_RECIPE
     * @param changes - changes object to track modifications
     * @param  output - the output of the expression
     * @param insightID - the insightID being worked off of
     * @desc response to DELETE_INSIGHT_RECIPE
     */
    function RERUN_INSIGHT_RECIPE(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // wipe the existing insight except for the insight metadata like name, app_id, etc.
        // because editing insight recipe will re-run the whole insight, so we dont want to keep any of the old data
        newInsight(insightID, {
            insight: _state.shared[insightID].insight,
            panelCounter: _state.shared[insightID].panelCounter,
        });

        // prevent sheets from being selected when added/removed
        messageService.emit('set-sheet-selection', {
            insightID: insightID,
            selectable: false,
        });

        // Remove all panels
        for (const widgetId in _state.widgets) {
            if (_state.widgets[widgetId].insightID === insightID) {
                messageService.emit('close-panel', {
                    insightID: insightID,
                    panelId: _state.widgets[widgetId].panelId,
                    widgetId: widgetId,
                });
                delete _state.widgets[widgetId];
            }
        }

        // Remove all sheets
        messageService.emit('close-all-worksheets', {
            insightID: insightID,
            sheetsToKeep: ['0'],
        });

        // update this new insight with all the recipe steps passed back from the BE
        messageService.emit('update-pixel', {
            pixelReturn: output.insightData.pixelReturn,
            insightID: insightID,
        });

        // reset sheets to be selected when added/removed
        messageService.emit('set-sheet-selection', {
            insightID: insightID,
            selectable: true,
        });
    }

    /**
     * @name PARAMETER_EXECUTION
     * @param changes - changes object to track modifications
     * @param  output - the output of the expression
     * @param insightID - the insightID being worked off of
     * @desc response to PARAMETER_EXECUTION
     */
    function PARAMETER_EXECUTION(
        changes: PixelChange,
        output: any,
        insightID: string
    ): void {
        // check to see if param info exists because we need to persist it after running the param insight
        let paramInfo;
        if (_state.shared[insightID]) {
            const panels = _state.shared[insightID].panels;

            for (
                let panelIdx = 0, panelLen = panels.length;
                panelIdx < panelLen;
                panelIdx++
            ) {
                const widgetId = panels[panelIdx].widgetId;
                if (
                    _state.widgets[widgetId] &&
                    _state.widgets[widgetId].view &&
                    _state.widgets[widgetId].view.param
                ) {
                    paramInfo = _state.widgets[widgetId].view.param;
                    break;
                }
            }
        }

        console.warn(paramInfo);

        // wipe the existing insight except for the insight metadata like name, app_id, etc.
        // because editing insight recipe will re-run the whole insight, so we dont want to keep any of the old data
        newInsight(insightID, {
            insight: _state.shared[insightID].insight,
            panelCounter: _state.shared[insightID].panelCounter,
        });

        // prevent sheets from being selected when added/removed
        messageService.emit('set-sheet-selection', {
            insightID: insightID,
            selectable: false,
        });

        // Remove all panels
        for (const widgetId in _state.widgets) {
            if (_state.widgets[widgetId].insightID === insightID) {
                messageService.emit('close-panel', {
                    insightID: insightID,
                    panelId: _state.widgets[widgetId].panelId,
                    widgetId: widgetId,
                });

                delete _state.widgets[widgetId];
            }
        }

        // Remove all sheets
        messageService.emit('close-all-worksheets', {
            insightID: insightID,
            sheetsToKeep: ['0'],
        });

        // update this new insight with all the recipe steps passed back from the BE
        messageService.emit('update-pixel', {
            pixelReturn: output.insightData.pixelReturn,
            insightID: insightID,
        });

        // reset sheets to be selected when added/removed
        messageService.emit('set-sheet-selection', {
            insightID: insightID,
            selectable: true,
        });

        // add the param info to all of the related insights
        if (paramInfo && _state.shared[insightID]) {
            const panels = _state.shared[insightID].panels;

            for (
                let panelIdx = 0, panelLen = panels.length;
                panelIdx < panelLen;
                panelIdx++
            ) {
                const widgetId = panels[panelIdx].widgetId;
                if (_state.widgets[widgetId]) {
                    _state.widgets[widgetId].view.param = paramInfo;
                }
            }
        }
    }

    /** NON Pixel */

    /**
     * @name mergeVizOptions
     * @desc merges the theme and panel ornaments
     * @param theme - the insight's theme
     * @param tools - shared tools
     * @returns new options for chart
     */
    function mergeVizOptions(theme, tools, appliedOrnaments) {
        const newOptions: any = {};

        // Set the color scheme
        if (appliedOrnaments && appliedOrnaments.hasOwnProperty('color')) {
            newOptions.color = tools.color;
            newOptions.colorName = tools.colorName;
        } else {
            newOptions.color =
                theme.color.scheme.colors || THEME.color.scheme.colors;
            newOptions.colorName =
                theme.color.scheme.colorName || THEME.color.scheme.colorName;
        }
        // Set color scheme for heatmap and choropleth
        if (
            appliedOrnaments &&
            appliedOrnaments.hasOwnProperty('heatmapColor')
        ) {
            newOptions.heatmapColor = tools.heatmapColor;
        } else {
            newOptions.heatmapColor =
                theme.chart.colorRange || THEME.chart.colorRange;
        }
        // Set color scheme for gauge
        if (appliedOrnaments && appliedOrnaments.hasOwnProperty('gaugeColor')) {
            newOptions.gaugeColor = tools.gaugeColor;
        } else {
            newOptions.gaugeColor =
                theme.chart.colorRange || THEME.chart.colorRange;
        }
        // Set color scheme for waterfall
        if (
            appliedOrnaments &&
            appliedOrnaments.hasOwnProperty('waterfallColor')
        ) {
            newOptions.waterfallColor = tools.waterfallColor;
        } else {
            newOptions.waterfallColor =
                theme.chart.colorDuo || THEME.chart.colorDuo;
        }

        // Set the grid
        if (appliedOrnaments && appliedOrnaments.hasOwnProperty('grid')) {
            // TO DO: update editGrid widget to add in options from the theme
            newOptions.grid = tools.grid;
        } else {
            newOptions.grid = theme.chart.grid
                ? {
                      color: theme.chart.grid.borderColor,
                      width: parseInt(theme.chart.grid.borderWidth),
                  }
                : THEME.chart.grid;
        }

        // Set x axis
        if (appliedOrnaments && appliedOrnaments.hasOwnProperty('editXAxis')) {
            // TO DO: update editXAxis widget to add in options from the theme
            newOptions.axis = angular.merge(theme.chart.axis, {
                label: {
                    fontSize: tools.editXAxis.fontSize,
                },
            });
        } else {
            newOptions.axis = theme.chart.axis || THEME.chart.axis;
        }

        // Set y axis
        if (appliedOrnaments && appliedOrnaments.hasOwnProperty('editYAxis')) {
            // TO DO: update editYAxis widget to add in options from the theme
            newOptions.axis = theme.chart.axis;
        } else {
            newOptions.axis = theme.chart.axis || THEME.chart.axis;
        }

        // Set chart title
        if (appliedOrnaments && appliedOrnaments.hasOwnProperty('chartTitle')) {
            newOptions.chartTitle = tools.chartTitle;
        } else {
            let isCustom = true,
                titleObj = theme.chart.title || THEME.chart.title,
                fontFamily = titleObj.fontFamily;
            for (let i = 0; i < FONT_FAMILY.length; i++) {
                const font = FONT_FAMILY[i].value;
                if (font === fontFamily) {
                    isCustom = false;
                    break;
                }
            }
            newOptions.chartTitle = angular.merge({}, titleObj, {
                enterCustomFont: isCustom,
            });
        }

        // Default theme value labels
        newOptions.valueLabel = theme.chart.value || THEME.chart.value;

        // Set chart labels
        if (
            appliedOrnaments &&
            appliedOrnaments.hasOwnProperty('customizeBarLabel')
        ) {
            newOptions.valueLabel = angular.merge({}, theme.chart.value, {
                fontSize: tools.customizeBarLabel.fontSize,
                fontFamily: tools.customizeBarLabel.fontFamily,
                fontWeight: tools.customizeBarLabel.fontWeight,
                fontColor: tools.customizeBarLabel.fontColor,
            });
        }
        if (
            appliedOrnaments &&
            appliedOrnaments.hasOwnProperty('customizeLabel')
        ) {
            newOptions.valueLabel = angular.merge({}, theme.chart.value, {
                fontSize: tools.customizeLabel.fontSize,
                fontFamily: tools.customizeLabel.fontFamily,
                fontWeight: tools.customizeLabel.fontWeight,
                fontColor: tools.customizeLabel.color,
            });
        }
        if (
            appliedOrnaments &&
            appliedOrnaments.hasOwnProperty('customizeGraphLabel')
        ) {
            // TO DO: update customizeGraphLabel widget to add in options from the theme (fontweight, fontcolor)
            newOptions.valueLabel = angular.merge({}, theme.chart.value, {
                fontSize: tools.customizeGraphLabel.fontSize,
                fontFamily: tools.customizeGraphLabel.font,
            });
        }
        if (
            appliedOrnaments &&
            appliedOrnaments.hasOwnProperty('customizeFunnelLabel')
        ) {
            // TO DO: update customizeFunnelLabel widget to add in options from the theme (fontweight, fontcolor, fontfamily)
            newOptions.valueLabel = angular.merge({}, theme.chart.value, {
                fontSize: tools.customizeFunnelLabel.fontSize,
            });
        }

        // Set the legend
        if (appliedOrnaments && appliedOrnaments.hasOwnProperty('legend')) {
            // TO DO: update toggleLegend widget to add in options from the theme
            newOptions.legend = tools.legend;
        } else {
            newOptions.legend = theme.chart.legend || THEME.chart.legend;
        }

        // Set the kpi options
        if (appliedOrnaments) {
            // TO DO: update kpiSettings widget to match theme options
            const opt: any = { value: {}, label: {} };
            if (appliedOrnaments.hasOwnProperty('kpiColor')) {
                opt.value.fontColor = tools.kpiColor;
                opt.label.fontColor = tools.kpiColor;
            }
            if (appliedOrnaments.hasOwnProperty('kpiFontFamily')) {
                opt.value.fontFamily = tools.kpiFontFamily;
                opt.label.fontFamily = tools.kpiFontFamily;
            }
            if (appliedOrnaments.hasOwnProperty('kpiValueSize')) {
                opt.value.fontFamily = tools.kpiValueSize;
            }
            if (appliedOrnaments.hasOwnProperty('kpiTitleSize')) {
                opt.label.fontFamily = tools.kpiTitleSize;
            }
            newOptions.kpi = angular.merge({}, theme.kpi, opt);
        } else {
            newOptions.kpi = theme.kpi || THEME.kpi;
        }

        // add in the text
        newOptions.text = theme.text || THEME.text;

        newOptions.tooltip = theme.chart.tooltip || THEME.chart.tooltip;
        newOptions.dataZoom = theme.chart.dataZoom || THEME.chart.dataZoom;

        // chart specific properties
        newOptions.treemap = theme.chart.treemap || THEME.chart.treemap;
        newOptions.boxwhisker =
            theme.chart.boxwhisker || THEME.chart.boxwhisker;
        newOptions.graph = theme.chart.graph || THEME.chart.graph;
        newOptions.dendrogram =
            theme.chart.dendrogram || THEME.chart.dendrogram;

        return angular.merge({}, tools, newOptions);
    }

    /**
     * @name findPanelCounter
     * @param {string} panelId the panel id to search
     * @desc find the id concatenated in this panelId
     * @returns {string} the panel id counter concatenated to the end of the panel id
     */
    function findPanelCounter(panelId: number | string): number {
        let matches: RegExpMatchArray | null = [],
            newCounter = -1,
            counterRegex = /\d+$/g;

        // looking for the last number used to unique-ify the clone panel id.
        matches = String(panelId).match(counterRegex);

        if (matches && matches.length > 0) {
            if (typeof parseInt(matches[matches.length - 1], 10) === 'number') {
                newCounter = parseInt(matches[matches.length - 1], 10);
            }
        }

        return newCounter;
    }

    /**
     * @name newInsight
     * @desc create a new insight
     * @param insightID - insightID added to
     * @param insight - insight object to add
     * @returns new insightID
     */
    function newInsight(insightID: string, insight: any): string {
        _state.shared[insightID] = angular.extend(
            {
                insightID: insightID,
                step: -1,
                steps: [],
                panels: [],
                panelCounter: 0,
                frames: {},
                type: 'insight',
                insight: {
                    name: '',
                },
                initialized: false,
                theme: THEME,
            },
            insight || {}
        );

        // set the default name to be New Insight
        if (!_state.shared[insightID].insight.name) {
            _state.shared[insightID].insight.name = 'New Insight';
        }

        // make sure the insightID is set properly
        _state.shared[insightID].insightID = insightID;

        return insightID;
    }

    /**
     * @name setFrame
     * @desc set and update a farme object
     * @param insightID - insightID added to
     * @param modifiedFrame - customized frame
     */
    function setFrame(insightID: string, modifiedFrame: any): string {
        if (
            !_state.shared[insightID].frames.hasOwnProperty(modifiedFrame.name)
        ) {
            _state.shared[insightID].frames[modifiedFrame.name] = {
                name: undefined,
                type: '',
                headers: [],
                joins: [],
                recommendations: [],
                image: '',
            };
        }

        _state.shared[insightID].frames[modifiedFrame.name] = angular.extend(
            _state.shared[insightID].frames[modifiedFrame.name],
            modifiedFrame
        );

        // update the image for the type
        if (
            _state.shared[insightID].frames[modifiedFrame.name].type === 'GRAPH'
        ) {
            _state.shared[insightID].frames[
                modifiedFrame.name
            ].image = require('images/graph.svg');
        } else if (
            _state.shared[insightID].frames[modifiedFrame.name].type ===
            'NATIVE'
        ) {
            _state.shared[insightID].frames[
                modifiedFrame.name
            ].image = require('images/external.svg');
        } else if (
            _state.shared[insightID].frames[modifiedFrame.name].type === 'R'
        ) {
            _state.shared[insightID].frames[
                modifiedFrame.name
            ].image = require('images/r.png');
        } else if (
            _state.shared[insightID].frames[modifiedFrame.name].type === 'PY'
        ) {
            _state.shared[insightID].frames[
                modifiedFrame.name
            ].image = require('images/python.png');
        } else {
            _state.shared[insightID].frames[
                modifiedFrame.name
            ].image = require('images/grid.svg');
        }

        // sort the headers only if it was changed
        if (modifiedFrame.headers) {
            _state.shared[insightID].frames[modifiedFrame.name].headers.sort(
                function (a, b) {
                    const textA = a.alias.toUpperCase(),
                        textB = b.alias.toUpperCase();
                    if (textA < textB) {
                        return -1;
                    }
                    if (textA > textB) {
                        return 1;
                    }

                    return 0;
                }
            );
        }

        // if there is no frame, select this one
        // update the widgetId that the frame it is using,
        // this should automatically be set for the first one (since it is the only time it doesn't)
        for (const widgetId in _state.widgets) {
            if (_state.widgets.hasOwnProperty(widgetId)) {
                if (_state.widgets[widgetId].insightID === insightID) {
                    if (!_state.widgets[widgetId].frame) {
                        _state.widgets[widgetId].frame = modifiedFrame.name;
                    }
                }
            }
        }

        return _state.shared[insightID].frames[modifiedFrame.name].name;
    }

    /**
     * @name findWidget
     * @desc find the widget in the state
     * @param insightID - insightID of the widget
     * @param panelId - panelId of the widget
     * @param widget - customized share of the new panel
     * @returns new widgetId
     */
    function findWidget(insightID: string, panelId: string): string {
        for (const i in _state.widgets) {
            if (_state.widgets.hasOwnProperty(i)) {
                if (
                    _state.widgets[i].insightID === insightID &&
                    _state.widgets[i].panelId === panelId
                ) {
                    return _state.widgets[i].widgetId;
                }
            }
        }

        return '';
    }

    /**
     * @name newPanel
     * @desc create a new widget
     * @param insightID - insightId to create
     * @param panelId - panelId to create
     * @param widget - customized share of the new panel
     * @returns new widgetId
     */
    function newPanel(
        insightID: string,
        panelId: string,
        widget?: object
    ): string {
        let frame = '',
            paramInfo = undefined;

        if (!panelId) {
            panelId = '0';
        }

        const widgetId = `SMSSWidget${insightID}___${panelId}`;

        // default frame
        if (_state.shared[insightID] && _state.shared[insightID].frames) {
            frame = Object.keys(_state.shared[insightID].frames)[0];
        }

        // check to see if param info exists because we need to persist it after running the param insight
        if (
            _state.widgets[widgetId] &&
            _state.widgets[widgetId].view &&
            _state.widgets[widgetId].view.param
        ) {
            paramInfo = _state.widgets[widgetId].view.param;
        }

        // add the widget id
        _state.widgets[widgetId] = angular.extend(
            {
                insightID: insightID, // link the widget back
                widgetId: widgetId,
                panelId: panelId,
                frame: frame, // this is the frame that is working off of
                active: '',
                view: {
                    visualization: {
                        options: {
                            type: 'echarts',
                        },
                        layout: false,
                        events: {},
                        tools: {
                            shared: mergeVizOptions(
                                _state.shared[insightID].theme,
                                widgetService.getSharedTools(),
                                {}
                            ),
                            individual: {},
                        },
                        appliedOrnaments: {},
                        tasks: [],
                        keys: {},
                        colorByValue: [],
                    },
                },
                events: {},
            },
            widget || {}
        );

        // if param info exists, we will set it back to the view so we will be able to
        // detect it to bring up the default handle widget again
        if (paramInfo) {
            _state.widgets[widgetId].view.param = paramInfo;
        }

        // make sure the widgetId and panelId are set properly
        _state.widgets[widgetId].widgetId = widgetId;
        _state.widgets[widgetId].panelId = panelId;

        return widgetId;
    }

    /**
     * @name deletePanel
     * @desc delete a new widget
     * @param insightID - insightId to delete
     * @param panelId - panelId to delete
     */
    function deletePanel(insightID: string, panelId: string): void {
        const widgetId = findWidget(insightID, panelId);

        if (!widgetId) {
            return;
        }

        // delete from panels
        if (insightID && _state.shared[insightID]) {
            _state.shared[insightID].panels = _state.shared[
                insightID
            ].panels.filter((panel) => {
                return panel.panelId !== panelId;
            });
        }

        // delete the widget
        delete _state.widgets[widgetId];
    }

    /** General */
    /**
     * @name set
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @param content - content to set
     * @desc function that gets data from the store
     */
    function set(accessor: string, content: any): void {
        Utility.setter(_state, accessor, JSON.parse(JSON.stringify(content)));
    }

    /**
     * @name get
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function get(accessor?: string): any {
        return Utility.getter(_state, accessor);
    }

    /**
     * @name getLayerIndex
     * @param {array} tasks the tasks to search
     * @param {string} id the id to search for
     * @desc return the index for the layer with this id
     * @returns {number} the index of the id
     */
    function getLayerIndex(tasks: any[], id: string): number {
        let index: number = tasks.length,
            idx: number;

        if (tasks && tasks.length > 0) {
            for (idx = 0; idx < tasks.length; idx++) {
                if (tasks[idx].layer && tasks[idx].layer.id === id) {
                    index = idx;
                    break;
                }
            }
        }

        return index;
    }

    /**
     * @name getWidget
     * @param widgetId - id of the widget to get
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets widget data from the store
     * @returns value of the requested object
     */
    function getWidget(widgetId: string, accessor?: string): any {
        if (_state.widgets[widgetId]) {
            if (accessor) {
                return get('widgets.' + widgetId + '.' + accessor);
            }
            return get('widgets.' + widgetId);
        }
        return false;
    }

    /**
     * @name getShared
     * @param insightID - id of the shared to get
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets shared data from the store
     * @returns  value of the requested object
     */
    function getShared(insightID: string, accessor?: string): any {
        if (_state.shared[insightID]) {
            if (accessor) {
                return get('shared.' + insightID + '.' + accessor);
            }
            return get('shared.' + insightID);
        }
        return false;
    }

    /**
     * @name startPolling
     * @param id - id to load the filter on
     * @param listeners - listeners to listen for the loading screen
     */
    function startPolling(id: string, listeners?: string[]): () => void {
        // check if listeners are there
        if (typeof listeners === 'undefined') {
            listeners = [id];
        }

        messageService.emit('start-polling', {
            id: id,
            listeners: listeners,
        });

        return () => {
            messageService.emit('stop-polling', {
                id: id,
                listeners: listeners,
            });
        };
    }

    /**
     * @name runPixelSuccess
     * @param payload - pixel payload executed
     * @param response - pixel response
     */
    function runPixelSuccess(payload: PixelPayload, response: any): void {
        if (
            payload.responseObject &&
            payload.responseObject.widgetId &&
            payload.responseObject.response
        ) {
            messageService.emit(payload.responseObject.response, response);
        } else if (payload.responseObject && payload.responseObject.response) {
            payload.responseObject.payload.pixelReturn = response.pixelReturn;
            messageService.emit(
                payload.responseObject.response,
                payload.responseObject.payload
            );
        }
    }

    /**
     * @name runPixelError
     * @param message - original message
     * @param payload - payload that was run
     * @param error - error message
     */
    function runPixelError(
        message: string,
        payload: PixelPayload,
        error: any
    ): void {
        if (error) {
            // if it is a query is not found and we are using the queryID, try to make a new one
            if (
                payload.insightID &&
                payload.insightID === _state.queryInsightID
            ) {
                if (
                    error &&
                    error.data &&
                    error.data.errorType === 'INSIGHT_NOT_FOUND'
                ) {
                    messageService.emit('alert', {
                        color: 'error',
                        text: 'Could not find session. Refreshing session.',
                    });

                    generateQueryInsightID().then(() => {
                        // modify it
                        payload.insightID = _state.queryInsightID;
                        // try again
                        messageService.emit(message, payload);
                    });

                    return;
                }
            }

            // send it out
            if (error.statusText) {
                messageService.emit('alert', {
                    color: 'error',
                    text: error.statusText,
                });
            } else if (typeof error === 'string') {
                messageService.emit('alert', {
                    color: 'error',
                    text: error,
                });
            } else {
                messageService.emit('alert', {
                    color: 'error',
                    text: 'Error',
                });
            }
        }

        // fake the error
        if (
            payload.responseObject &&
            payload.responseObject.widgetId &&
            payload.responseObject.response
        ) {
            messageService.emit(payload.responseObject.response, {
                pixelReturn: [
                    {
                        output: error,
                        operationType: ['ERROR'],
                    },
                ],
            });
        } else if (payload.responseObject && payload.responseObject.response) {
            payload.responseObject.payload.pixelReturn = [
                {
                    output: error,
                    operationType: ['ERROR'],
                },
            ];
            messageService.emit(
                payload.responseObject.response,
                payload.responseObject.payload
            );
        }
    }

    return {
        get: get,
        set: set,
        getWidget: getWidget,
        getShared: getShared,
        generate: generate,
        initialize: initialize,
    };
}
