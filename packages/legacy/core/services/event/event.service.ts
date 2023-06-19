import angular from 'angular';
import Utility from '../../utility/utility.js';

export default angular
    .module('app.event.service', [])
    .factory('eventService', eventService);

eventService.$inject = ['messageService', 'optionsService', 'storeService'];

function eventService(
    messageService: MessageService,
    optionsService: OptionsService,
    storeService: StoreService
) {
    const _state = {}, // not initially set
        _actions = {
            /**
             * @name add-panel
             * @desc action that is triggered to initialize the event
             * @param payload - payload of the message
             * @return {void}
             */
            'add-panel': (payload: { widgetId: string }): void => {
                // empty object to hold the information
                _state[payload.widgetId] = {};

                // add in meta information
                _state[payload.widgetId].activeKeys = [];
                _state[payload.widgetId].mouse = {
                    x: 0,
                    y: 0,
                };

                // add in current event
                _state[payload.widgetId].currentEvent = {};

                // add in default events
                _state[payload.widgetId].callbacks = {
                    defaultMode: {
                        onClick: onSingleClick.bind(null, payload.widgetId),
                        onDoubleClick: onDoubleClick.bind(
                            null,
                            payload.widgetId
                        ),
                        onBrush: onBrush.bind(null, payload.widgetId),
                        onHover: onHover.bind(null, payload.widgetId),
                        onMouseIn: onMouseIn.bind(null, payload.widgetId),
                        onMouseOut: onMouseOut.bind(null, payload.widgetId),
                        onKeyDown: onKeyDown.bind(null, payload.widgetId),
                        onKeyUp: onKeyUp.bind(null, payload.widgetId),
                    },
                    selectMode: {
                        onClick: null,
                        onDoubleClick: null,
                    },
                    editMode: {
                        onSave: onEditMode.bind(null, payload.widgetId),
                    },
                    commentMode: {
                        onSave: onCommentMode.bind(null, payload.widgetId),
                    },
                };
            },
            /**
             * @name close-panel
             * @desc action that is triggered to destroy the event
             * @param payload - payload of the message
             */
            'close-panel': (payload: { widgetId: string }): void => {
                // empty object to hold the information
                delete _state[payload.widgetId];
            },
            /**
             * @name add-event
             * @desc action that is triggered to add an event
             * @param {object} payload - payload of the message
             * @return {void}
             */
            'add-event': (payload: {
                event: string;
                widgetId: string;
            }): void => {
                const pixelComponents: PixelCommand[] = [],
                    panelId: number = storeService.getWidget(
                        payload.widgetId,
                        'panelId'
                    );

                pixelComponents.push({
                    type: 'panel',
                    components: [panelId],
                });

                pixelComponents.push({
                    type: 'addPanelEvents',
                    components: [payload.event],
                    terminal: true,
                });

                pixelComponents.push({
                    type: 'panel',
                    components: [panelId],
                });

                pixelComponents.push({
                    type: 'retrievePanelEvents',
                    components: [],
                    terminal: true,
                });

                messageService.emit('execute-pixel', {
                    insightID: storeService.getWidget(
                        payload.widgetId,
                        'insightID'
                    ),
                    commandList: pixelComponents,
                });
            },
            /**
             * @name remove-event
             * @desc action that is triggered to remove an event
             * @param payload - payload of the message
             */
            'remove-event': (payload: {
                action: string;
                eventName: string;
                widgetId: string;
            }): void => {
                let pixelComponents: PixelCommand[] = [],
                    panelId: number = storeService.getWidget(
                        payload.widgetId,
                        'panelId'
                    );

                // remove event from this panel
                pixelComponents = [
                    {
                        type: 'panel',
                        components: [panelId],
                    },
                    {
                        type: 'removePanelEvents',
                        components: [payload.action + '.' + payload.eventName],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: [panelId],
                    },
                    {
                        type: 'retrievePanelEvents',
                        components: [],
                        terminal: true,
                    },
                ];

                messageService.emit('execute-pixel', {
                    insightID: storeService.getWidget(
                        payload.widgetId,
                        'insightID'
                    ),
                    commandList: pixelComponents,
                });
            },
        },
        semossValues: string[] = [
            '<CurrentPanel>',
            '<Layout>',
            '<InsightId>',
            '<NewCloneId>',
            '<Frame>',
            '<TaskId>',
            '<Limit>',
        ];

    /**
     * @name onEditMode
     * @param widgetId - widgetId to act on
     * @param editOptions the options to set
     */
    function onEditMode(widgetId: string, editOptions: any): void {
        const pixelComponents: PixelCommand[] = [],
            panelId: number = storeService.getWidget(widgetId, 'panelId'),
            options: any = {};

        options.editOptions = editOptions;

        pixelComponents.push(
            {
                type: 'panel',
                components: [panelId],
            },
            {
                type: 'removePanelOrnaments',
                components: ['editOptions'],
            },
            {
                type: 'addPanelOrnaments',
                components: [options],
            },
            {
                type: 'retrievePanelOrnaments',
                components: ['editOptions'],
                terminal: true,
            }
        );

        messageService.emit('execute-pixel', {
            insightID: storeService.getWidget(widgetId, 'insightID'),
            commandList: pixelComponents,
        });
    }

    /**
     * @name onCommentMode
     * @param widgetId - widgetId to act on
     * @param comment the comment to add
     * @param id the identifier for that comment
     * @param task the action to perform on that comment
     */
    function onCommentMode(
        widgetId: string,
        comment: any,
        id: string,
        task: string
    ): void {
        const pixelComponents: PixelCommand[] = [],
            panelId = storeService.getWidget(widgetId, 'panelId');

        comment.id = id;

        pixelComponents.push({
            type: 'panel',
            components: [panelId],
        });

        if (task === 'add' || task === 'edit') {
            pixelComponents.push({
                type: 'addPanelComment',
                components: [comment],
            });
        } else if (task === 'remove') {
            pixelComponents.push({
                type: 'removePanelComment',
                components: [id],
            });
        }
        pixelComponents.push({
            type: 'retrievePanelComments',
            components: [],
            terminal: true,
        });

        messageService.emit('execute-pixel', {
            insightID: storeService.getWidget(widgetId, 'insightID'),
            commandList: pixelComponents,
        });
    }

    /**
     * @name getSemossData
     * @param widgetId - widgetId to act on
     * @param dataToGrab the semoss data to return
     * @returns the semoss data to return
     */
    function getSemossData(widgetId: string, semossValue: string): string {
        let value: string,
            layerIndex = 0;

        switch (semossValue) {
            case '<CurrentPanel>':
                value = storeService.getWidget(widgetId, 'panelId');
                break;
            case '<Layout>':
                value = storeService.getWidget(
                    widgetId,
                    'view.visualization.layout'
                );
                break;
            case '<InsightId>':
                value = storeService.getWidget(widgetId, 'insightID');
                break;
            case '<NewCloneId>':
                value =
                    storeService.getShared(
                        storeService.getWidget(widgetId, 'insightID'),
                        'panelCounter'
                    ) + 1;
                break;
            case '<TaskId>':
                value = storeService.getWidget(
                    widgetId,
                    'view.visualization.tasks.' + layerIndex + '.taskId'
                );
                break;
            case '<Frame>':
                value = storeService.getShared(
                    storeService.getWidget(widgetId, 'insightID'),
                    'frames.' +
                        storeService.getWidget(widgetId, 'frame') +
                        '.name'
                );
                break;
            case '<Limit>':
                value = String(optionsService.get(widgetId, 'limit'));

                if (!value) {
                    value = String(500);
                }
                break;
            default:
                value = '';
        }

        return value;
    }

    /**
     * @name onSingleClick
     * @param widgetId - widgetId to act on
     * @param data the data passed from the event action
     */
    function onSingleClick(widgetId: string, data: any): void {
        const eventData = storeService.getWidget(widgetId, 'events'),
            selectedData: { alias: string; instances: string[] }[] = [];

        _state[widgetId].currentEvent = {
            type: 'onSingleClick',
            data: data,
        };

        if (data.mouse) {
            _state[widgetId].mouse.x = data.mouse[0];
            _state[widgetId].mouse.y = data.mouse[1];
        } else {
            _state[widgetId].mouse.x = 0;
            _state[widgetId].mouse.y = 0;
        }

        // send out a message for selected column
        for (const column in data.data) {
            if (data.data.hasOwnProperty(column)) {
                selectedData.push({
                    alias: column,
                    instances: data.data[column],
                });
                break;
            }
        }

        buildAndRunQuery(widgetId, eventData.onSingleClick, data);
    }

    /**
     * @name onDoubleClick
     * @param widgetId - widgetId to act on
     * @param data the data passed from the event action
     */
    function onDoubleClick(widgetId: string, data: any): void {
        const eventData = storeService.getWidget(widgetId, 'events');

        _state[widgetId].currentEvent = {
            type: 'onDoubleClick',
            data: data,
        };

        if (data.mouse) {
            _state[widgetId].mouse.x = data.mouse[0];
            _state[widgetId].mouse.y = data.mouse[1];
        } else {
            _state[widgetId].mouse.x = 0;
            _state[widgetId].mouse.y = 0;
        }

        buildAndRunQuery(widgetId, eventData.onDoubleClick, data);
    }

    /**
     * @name onBrush
     * @param widgetId - widgetId to act on
     * @param data the data passed from the event action
     * @param clearBrush removes brush from chart if no data brushed over
     */
    function onBrush(
        widgetId: string,
        data: any,
        clearBrush: (data: any) => void
    ): void {
        const eventData = storeService.getWidget(widgetId, 'events');
        _state[widgetId].currentEvent = {
            type: 'onBrush',
            data: data,
        };

        if (data.mouse) {
            _state[widgetId].mouse.x = data.mouse[0];
            _state[widgetId].mouse.y = data.mouse[1];
        } else {
            _state[widgetId].mouse.x = 0;
            _state[widgetId].mouse.y = 0;
        }
        buildAndRunQuery(widgetId, eventData.onBrush, data);
        if (clearBrush) {
            clearBrush(data.data);
        }
    }

    /**
     * @name onHover
     * @param widgetId - widgetId to act on
     * @param data the data passed from the event action
     */
    function onHover(widgetId: string, data: any): void {
        const eventData = storeService.getWidget(widgetId, 'events');
        _state[widgetId].currentEvent = {
            type: 'onHover',
            data: data,
        };

        if (data.mouse) {
            _state[widgetId].mouse.x = data.mouse[0];
            _state[widgetId].mouse.y = data.mouse[1];
        } else {
            _state[widgetId].mouse.x = 0;
            _state[widgetId].mouse.y = 0;
        }
        buildAndRunQuery(widgetId, eventData.onHover, data);
    }

    /**
     * @name onMouseIn
     * @param widgetId - widgetId to act on
     * @param data the data passed from the event action
     */
    function onMouseIn(widgetId: string, data: any): void {
        const eventData = storeService.getWidget(widgetId, 'events');
        _state[widgetId].currentEvent = {
            type: 'onMouseIn',
            data: data,
        };

        if (data.mouse) {
            _state[widgetId].mouse.x = data.mouse[0];
            _state[widgetId].mouse.y = data.mouse[1];
        } else {
            _state[widgetId].mouse.x = 0;
            _state[widgetId].mouse.y = 0;
        }

        buildAndRunQuery(widgetId, eventData.onMouseIn, data);
    }

    /**
     * @name onMouseIn
     * @param widgetId - widgetId to act on
     * @param data the data passed from the event action
     */
    function onMouseOut(widgetId: string, data: any): void {
        const eventData = storeService.getWidget(widgetId, 'events');
        _state[widgetId].currentEvent = {
            type: 'onMouseOut',
            data: data,
        };

        if (data.mouse) {
            _state[widgetId].mouse.x = data.mouse[0];
            _state[widgetId].mouse.y = data.mouse[1];
        } else {
            _state[widgetId].mouse.x = 0;
            _state[widgetId].mouse.y = 0;
        }

        buildAndRunQuery(widgetId, eventData.onMouseOut, data);
    }

    /**
     * @name onKeyDown
     * @param widgetId - widgetId to act on
     * @param data the event data
     */
    function onKeyDown(widgetId: string, data: any): void {
        // keep track of what keys are pressed
        if (
            _state[widgetId].activeKeys.indexOf(
                data.event.which || data.event.keyCode
            ) === -1
        ) {
            _state[widgetId].activeKeys.push(
                data.event.which || data.event.keyCode
            );
        }
    }

    /**
     * @name onKeyUp
     * @param widgetId - widgetId to act on
     * @param data the event data
     */
    function onKeyUp(widgetId: string, data: any): void {
        const eventData = storeService.getWidget(widgetId, 'events'),
            keyIndex: number = _state[widgetId].activeKeys.indexOf(
                data.event.which || data.event.keyCode
            );

        // if we have events registered to keypress we will call it
        if (
            eventData.onKeyPress &&
            Object.keys(eventData.onKeyPress).length > 0
        ) {
            _state[widgetId].currentEvent = {
                type: 'onKeyPress',
                data: data,
            };
            buildAndRunQuery(widgetId, eventData.onKeyPress, data);
        }

        // if key has been registered in activeKeys, we will remove them
        if (keyIndex > -1) {
            _state[widgetId].activeKeys.splice(keyIndex, 1);
        }
    }

    /**
     * @name buildAndRunQuery
     * @param {string} widgetId - widgetId to act on
     * @param events the events to run
     * @param actionData the data passed from the action
     * @returns the completed query
     */
    function buildAndRunQuery(
        widgetId: string,
        events: any,
        actionData: any
    ): void {
        let event: any,
            pixelComponents: PixelCommand[] = [],
            completeQuery = '',
            panels = storeService.getShared(
                storeService.getWidget(widgetId, 'insightID'),
                'panels'
            ),
            column: string,
            eventData: any = {},
            cloneIdx: number,
            refresh = false,
            specifyPanels: any = [],
            queryIdx: number,
            layout: string = storeService.getWidget(
                widgetId,
                'view.visualization.layout'
            ),
            pressed: number[],
            keyIdx: number,
            keyLen: number;

        for (event in events) {
            if (!events.hasOwnProperty(event)) {
                continue;
            }

            completeQuery = '';

            for (queryIdx = 0; queryIdx < events[event].length; queryIdx++) {
                if (events[event][queryIdx].disabled) {
                    continue;
                }

                // check if event is disabled for current layout
                if (
                    events[event][queryIdx].hasOwnProperty('disabledVisuals') &&
                    events[event][queryIdx].disabledVisuals.indexOf(layout) > -1
                ) {
                    continue;
                }
                // if there are keys defined, we will check those to see if those keys have been pressed by looking at activeKeys variable where we are tracking the pressed keys
                if (
                    events[event][queryIdx].options &&
                    events[event][queryIdx].options.keys &&
                    events[event][queryIdx].options.keys.length > 0
                ) {
                    // TODO: take a look at this....activeKeys are incorrect...when cloned and ctrl clicking
                    // it keeps CTRL key and doesn't remove...even though it goes through keyup and removing...
                    // not sure whats going on...could it be multiple event.service? or could it be its repainting once clicked?
                    // so that its not syncing correctly anymore...? idk
                    // replicate-->clone add event to highlight both panels with a control click. control click a bar-->let go of contrl and click-->activeKeys is registering control as pressed still...

                    // keys pressed and the keys required must be exactly the same to trigger the event action
                    pressed = [];
                    for (
                        keyIdx = 0,
                            keyLen =
                                events[event][queryIdx].options.keys.length;
                        keyIdx < keyLen;
                        keyIdx++
                    ) {
                        pressed.push(
                            events[event][queryIdx].options.keys[keyIdx].keycode
                        );
                    }

                    if (
                        JSON.stringify(_state[widgetId].activeKeys) !==
                        JSON.stringify(pressed)
                    ) {
                        continue;
                    }
                }

                // set an indicator to refresh the jobs
                if (events[event][queryIdx].refresh) {
                    refresh = true;
                    for (
                        let i = 0;
                        events[event][queryIdx].specifyPanels &&
                        i < events[event][queryIdx].specifyPanels.length;
                        i++
                    ) {
                        specifyPanels.push(
                            events[event][queryIdx].specifyPanels[i].replace(
                                '<Panel>',
                                events[event][queryIdx].panel
                            )
                        );
                    }
                }

                // no data so that means we will be running the query as is
                if (
                    !actionData.data ||
                    Object.keys(actionData.data).length === 0
                ) {
                    completeQuery += fillParams(
                        widgetId,
                        events[event][queryIdx],
                        eventData,
                        events[event][queryIdx].panel
                    );
                } else {
                    // lets try to fill in the data as appropriate
                    eventData = {};
                    for (column in actionData.data) {
                        if (!actionData.data.hasOwnProperty(column)) {
                            continue;
                        }

                        eventData[column] = actionData.data[column];
                    }

                    if (
                        !events[event][queryIdx].panel &&
                        events[event][queryIdx].panel !== 0
                    ) {
                        completeQuery += fillParams(
                            widgetId,
                            events[event][queryIdx],
                            eventData
                        );
                    } else {
                        completeQuery += fillParams(
                            widgetId,
                            events[event][queryIdx],
                            eventData,
                            events[event][queryIdx].panel
                        );
                    }
                }

                if (queryIsComplete(completeQuery)) {
                    pixelComponents.push({
                        type: 'Pixel',
                        components: [completeQuery],
                        terminal: true,
                    });
                }
            }
        }

        if (pixelComponents.length > 0) {
            if (refresh) {
                if (specifyPanels.length === 0) {
                    for (cloneIdx = 0; cloneIdx < panels.length; cloneIdx++) {
                        // TODO need to be smart about removing tasks, pass into the components a boolean when we DONT want to remove task...meaning if remove task is already being run previously
                        pixelComponents.push({
                            type: 'refresh',
                            components: [panels[cloneIdx].widgetId],
                            terminal: true,
                        });
                    }
                } else {
                    // loop through and refresh these specific panels only
                    for (let i = 0; i < specifyPanels.length; i++) {
                        for (
                            cloneIdx = 0;
                            cloneIdx < panels.length;
                            cloneIdx++
                        ) {
                            if (panels[cloneIdx].panelId === specifyPanels[i]) {
                                pixelComponents.push({
                                    type: 'refresh',
                                    components: [panels[cloneIdx].widgetId],
                                    terminal: true,
                                });
                            }
                        }
                    }
                }
            }

            messageService.emit('execute-pixel', {
                insightID: storeService.getWidget(widgetId, 'insightID'),
                commandList: pixelComponents,
            });
        }
    }

    /**
     * @param alias the alias to get frame name for
     * @param widgetId the widgetId to look in
     * @desc get the frame name of the alias to be used in events
     * @returns returns the frame name
     */
    function getFrameHeader(alias: string, widgetId: string): string {
        let layerIndex = 0,
            headers: any[] = storeService.getWidget(
                widgetId,
                'view.visualization.tasks.' + layerIndex + '.meta.headerInfo'
            ),
            frameHeader: string = alias,
            headerIdx: number;

        // find the actual frame header, not the
        if (headers && headers.length > 0) {
            for (headerIdx = 0; headerIdx < headers.length; headerIdx++) {
                if (headers[headerIdx].alias === alias) {
                    frameHeader = headers[headerIdx].header;
                    break;
                }
            }
        }

        return frameHeader;
    }

    /**
     * @param frameHeader the frameHeader to get alias for
     * @param widgetId the widgetId to look in
     * @desc get the alias of the frame name to be used in events
     * @returns returns the alias
     */
    function getAliasHeader(frameHeader: string, widgetId: string): string {
        let layerIndex = 0,
            headers: any[] = storeService.getWidget(
                widgetId,
                'view.visualization.tasks.' + layerIndex + '.meta.headerInfo'
            ),
            alias: string = frameHeader,
            headerIdx: number;

        // find the actual frame header, not the
        if (headers && headers.length > 0) {
            for (headerIdx = 0; headerIdx < headers.length; headerIdx++) {
                if (headers[headerIdx].header === frameHeader) {
                    alias = headers[headerIdx].alias;
                    break;
                }
            }
        }

        return alias;
    }

    /**
     * @name fillParams
     * @param widgetId - widgetId to act on
     * @param eventInfo the query to fill in
     * @param actionData the data returned from the action
     * @param panelId the panel id to replace
     * @returns the completed query
     */
    function fillParams(
        widgetId: string,
        eventInfo: any,
        actionData: any,
        panelId?: number
    ): string {
        let convertedData: any[] = [],
            selectedLayout: string = storeService.getWidget(
                widgetId,
                'view.visualization.layout'
            ),
            vizType: string = storeService.getWidget(
                widgetId,
                'view.visualization.options.type'
            ),
            active: string = storeService.getWidget(widgetId, 'active'),
            column: string,
            instanceIdx: number,
            len: number,
            smssValueIdx: number,
            originalQuery: string = eventInfo.query,
            returnQuery = '',
            taskData: any,
            dataHeader: string,
            dataIndex: number,
            actionDataIdx: number,
            ignoreLayouts: string[] = [
                'Column',
                'Line',
                'Scatter',
                'Pie',
                'Stack',
                'Bubble',
                'MultiLine',
                'Grid',
            ],
            textWidgetRegex = new RegExp(
                'SetPanelView\\s*\\((.*)text-widget(.*)(<SelectedValues>)(.*)\\)'
            ),
            layerIndex = 0;

        // TODO: replace and fix event.service... there is to much randomness/mishmosh

        // we're doing this check because we're always getting the actionData back as a string...the actual values may be a number so lets do compare against the actual values
        if (
            selectedLayout !== 'GraphGL' &&
            selectedLayout !== 'Graph' &&
            active !== 'legend-panel'
        ) {
            taskData = storeService.getWidget(
                widgetId,
                'view.visualization.tasks.' + layerIndex + '.data'
            );

            for (dataHeader in actionData) {
                if (actionData[dataHeader].length > 0) {
                    dataIndex = taskData.headers.indexOf(dataHeader);
                    if (taskData.values.length > 0) {
                        if (
                            typeof taskData.values[0][dataIndex] !==
                            typeof actionData[dataHeader][0]
                        ) {
                            // found discrepancy of data type...so set them straight.
                            for (
                                actionDataIdx = 0;
                                actionDataIdx < actionData[dataHeader].length;
                                actionDataIdx++
                            ) {
                                // if there are other types we need to check for...we can add them here in an else if
                                if (
                                    typeof taskData.values[0][dataIndex] ===
                                    'number'
                                ) {
                                    // if conversion not a number...we will not try to force a conversion
                                    if (
                                        !isNaN(
                                            Number(
                                                actionData[dataHeader][
                                                    actionDataIdx
                                                ]
                                            )
                                        )
                                    ) {
                                        actionData[dataHeader][actionDataIdx] =
                                            Number(
                                                actionData[dataHeader][
                                                    actionDataIdx
                                                ]
                                            );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // check to see if popup info exists, if so we will attempt to replace the url, width and height
        // the url replacement needs to happen first because the user can do something like https://www.duckduckgo.com/?q=<SelectedValue> at which point <SelectedValue> will be replaced later on
        if (eventInfo.options.url) {
            originalQuery = originalQuery.replace(
                /<URL>/g,
                "'" + eventInfo.options.url.link + "'"
            );
            originalQuery = originalQuery.replace(
                /<Width>/g,
                eventInfo.options.url.width
            );
            originalQuery = originalQuery.replace(
                /<Height>/g,
                eventInfo.options.url.height
            );
        }

        console.warn(
            'TODO: We need to use the "raw" data. Right now I am hacking it to add _ ....'
        );
        if (active !== 'legend-panel') {
            for (column in actionData) {
                if (actionData.hasOwnProperty(column)) {
                    returnQuery += originalQuery;
                    convertedData = JSON.parse(
                        JSON.stringify(actionData[column])
                    );

                    for (
                        instanceIdx = 0, len = convertedData.length;
                        instanceIdx < len;
                        instanceIdx++
                    ) {
                        // loop through the instances
                        if (
                            typeof convertedData[instanceIdx] === 'string' &&
                            (ignoreLayouts.indexOf(selectedLayout) === -1 ||
                                (vizType === 'standard' &&
                                    selectedLayout !== 'Bubble'))
                        ) {
                            // bubble is the only standard chart using raw data
                            convertedData[instanceIdx] = convertedData[
                                instanceIdx
                            ].replace(/ /g, '_');
                        }
                    }

                    if (ignoreLayouts.indexOf(selectedLayout) === -1) {
                        // replace <SelectedColumn> and <SelectedValues> with the clicked values
                        returnQuery = returnQuery.replace(
                            /<SelectedColumn>/g,
                            getFrameHeader(column, widgetId).replace(/ /g, '_')
                        );
                        returnQuery = returnQuery.replace(
                            /<SelectedAliasColumn>/g,
                            column.replace(/ /g, '_')
                        );
                    } else {
                        // replace <SelectedColumn> and <SelectedValues> with the clicked values
                        returnQuery = returnQuery.replace(
                            /<SelectedColumn>/g,
                            getFrameHeader(column, widgetId)
                        );
                        returnQuery = returnQuery.replace(
                            /<SelectedAliasColumn>/g,
                            column
                        );
                    }

                    if (returnQuery.match(textWidgetRegex)) {
                        // escape the double quotes for SetPanelView("text-widget"...) calls
                        returnQuery = returnQuery.replace(
                            /<SelectedValues>/g,
                            JSON.stringify(convertedData).replace(/"/g, '\\"')
                        );
                    } else {
                        returnQuery = returnQuery.replace(
                            /<SelectedValues>/g,
                            JSON.stringify(convertedData)
                        );
                    }
                    returnQuery = returnQuery.replace(
                        /<SelectedValue>/g,
                        convertedData[0]
                    );
                }
            }
        }

        if (!returnQuery) {
            // if query is empty we will use the original query.
            returnQuery = originalQuery;
        }

        // first lets replace any SMSS values that been used in the query
        for (
            smssValueIdx = 0;
            smssValueIdx < semossValues.length;
            smssValueIdx++
        ) {
            if (returnQuery.indexOf(semossValues[smssValueIdx]) > -1) {
                returnQuery = returnQuery.replace(
                    new RegExp(semossValues[smssValueIdx], 'g'),
                    getSemossData(widgetId, semossValues[smssValueIdx])
                );
            }
        }

        // then check to see if there's a selected header, if so replace the <TargetColumn> param
        if (eventInfo.options.header) {
            returnQuery = returnQuery.replace(
                /<TargetColumn>/g,
                eventInfo.options.header
            );
            returnQuery = returnQuery.replace(
                /<TargetAliasColumn>/g,
                getAliasHeader(eventInfo.options.header, widgetId)
            );
        }

        // finally add a check for panel id, if its passed in, we will replace <panel> with the id
        if (panelId === 0 || panelId) {
            returnQuery = returnQuery.replace(/<Panel>/g, String(panelId));
        }

        returnQuery = returnQuery.replace(
            /<MouseX>/g,
            _state[widgetId].mouse.x
        );
        returnQuery = returnQuery.replace(
            /<MouseY>/g,
            _state[widgetId].mouse.y
        );

        if (active === 'legend-panel') {
            returnQuery = returnQuery.replace(
                /<SelectedValue>/g,
                actionData[0]
            );
        }

        return returnQuery;
    }

    /**
     * @name queryIsComplete
     * @param query the query to check
     * @desc checks against all the params we have in store to make sure it does not have them in the query
     * @returns returns bool to indicate if this query is complete
     */
    function queryIsComplete(query: string): boolean {
        let paramList: string[],
            paramIdx: number,
            params: string[] = [
                '<TargetColumn>',
                '<TargetAliasColumn>',
                '<SelectedColumn>',
                '<SelectedAliasColumn>',
                '<SelectedValues>',
                '<SelectedValue>',
            ];

        if (!query) {
            return false;
        }

        paramList = semossValues.concat(params);

        for (paramIdx = 0; paramIdx < paramList.length; paramIdx++) {
            if (query.indexOf(paramList[paramIdx]) > -1) {
                return false;
            }
        }

        return true;
    }

    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        // register the actions
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    /**
     * @name get
     * @param id the widget id to grab
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function get(id: string, accessor?: string): any {
        return Utility.getter(_state[id], accessor);
    }

    /**
     * @name getCallbacks
     * @param id the widget id to grab
     * @returns the current event
     */
    function getCallbacks(id: string): any {
        return _state[id].callbacks;
    }

    return {
        initialize: initialize,
        get: get,
        getCallbacks: getCallbacks,
    };
}
