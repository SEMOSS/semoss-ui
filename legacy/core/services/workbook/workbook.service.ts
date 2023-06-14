import angular from 'angular';
import Utility from '../../utility/utility.js';
import { WORKSHEET, PANEL_TYPES, PANEL_OPTIONS } from '../../constants.js';

export default angular
    .module('app.workbook.service', [])
    .factory('workbookService', workbookService);

workbookService.$inject = ['messageService', 'storeService'];

/**
 * @name workbookService
 * @desc the workbookService is the intermediary between the storeService and the actual workbook ui
 * When panels are created and modified via pixel, they are processed via the storeService based on the
 * Pixel Operation Type. These changes are pushed from the storeService to the workbookService. When the user interacts
 * with a panel in such a way that no pixel is called but the view changes, these changes are only reflected in the
 * workbookService.
 */
function workbookService(
    messageService: MessageService,
    storeService: StoreService
) {
    const /** Public */
        /** Private */
        _state = {
            workbook: {},
        },
        _actions = {
            /**
             * @name new-insight
             * @param payload - {insightID}
             * @desc a new insight has been added, react to it
             */
            'new-insight': function (payload: {
                insightID: string;
                cached: boolean;
            }): void {
                const { insightID } = payload;

                _state.workbook[insightID] = {
                    worksheetCounter: 0, // counter for the worksheet
                    worksheet: undefined, // worksheet that is open
                    worksheets: {}, // all of the current worksheets
                    history: [], // history of the worksheets (to track back),
                    allowSheetSelection: true, // allow selection of a new sheet when sheets are added or removed
                };

                messageService.emit('added-workbook', {
                    insightID: insightID,
                });

                if (!payload.cached) {
                    // always added by default. This is helpful for legacy. DO NOT CHANGE THIS.
                    messageService.emit('add-worksheet', {
                        insightID: insightID,
                        sheetId: '0',
                    });
                }
            },
            /**
             * @name closed-insight
             * @param payload - {insightID}
             * @desc an insight has been closed, react to it
             */
            'closed-insight': function (payload: { insightID: string }): void {
                const { insightID } = payload;

                // delete the book
                delete _state.workbook[insightID];

                messageService.emit('closed-workbook', {
                    insightID: insightID,
                });
            },
            /**
             * @name add-worksheet
             * @param payload - {insightID, sheetId - to add, label}
             * @desc add a new worksheet
             */
            'add-worksheet': function (payload: {
                insightID: string;
                sheetId: string;
                worksheet?: any;
            }): void {
                const { insightID, sheetId } = payload;

                const newCounter = parseInt(sheetId),
                    worksheet = payload.worksheet || {},
                    theme = storeService.getShared(insightID, 'theme') || {};

                if (!_state.workbook[insightID]) {
                    messageService.emit('alert', {
                        color: 'error',
                        text: 'Error: Insight is missing',
                    });

                    console.error('Error: Insight is missing');
                }

                // change the counter if the sheet is bigger
                if (_state.workbook[insightID].worksheetCounter < newCounter) {
                    _state.workbook[insightID].worksheetCounter = newCounter;
                }

                let newConfig: any = {
                    sheetLabel: `Sheet ${parseInt(sheetId) + 1}`,
                };
                if (theme && theme.sheet && theme.sheet.backgroundColor) {
                    newConfig = angular.merge({}, newConfig, theme.sheet);
                }

                _state.workbook[insightID].worksheets[sheetId] = angular.merge(
                    {},
                    WORKSHEET,
                    newConfig,
                    worksheet
                );

                _state.workbook[insightID].worksheets[sheetId].sheetId =
                    sheetId;

                messageService.emit('added-worksheet', {
                    insightID: insightID,
                    sheetId: sheetId,
                });

                if (_state.workbook[insightID].allowSheetSelection) {
                    messageService.emit('select-worksheet', {
                        insightID: insightID,
                        sheetId: sheetId,
                    });
                }
            },
            /**
             * @name select-worksheet
             * @param payload - {insightID, sheetId}
             * @desc select a  worksheet
             */
            'select-worksheet': function (payload: {
                insightID: string;
                sheetId: string;
            }): void {
                const { insightID, sheetId } = payload;

                if (_state.workbook[insightID].worksheet !== sheetId) {
                    _state.workbook[insightID].worksheet = sheetId;

                    _state.workbook[insightID].history.push(sheetId);

                    messageService.emit('selected-worksheet', {
                        insightID: insightID,
                        sheetId: sheetId,
                    });
                }
            },
            /**
             * @name close-worksheet
             * @param payload - {insightID, sheetId}
             * @desc delete a worksheet
             */
            'close-worksheet': function (payload: {
                insightID: string;
                sheetId: string;
            }): void {
                const { insightID, sheetId } = payload;

                // remove worksheet
                delete _state.workbook[insightID].worksheets[sheetId];

                // remove the historical record
                for (
                    let historyIdx =
                        _state.workbook[insightID].history.length - 1;
                    historyIdx >= 0;
                    historyIdx--
                ) {
                    if (
                        _state.workbook[insightID].history[historyIdx] ===
                        sheetId
                    ) {
                        _state.workbook[insightID].history.splice(
                            historyIdx,
                            1
                        );
                    }
                }

                if (_state.workbook[insightID].allowSheetSelection) {
                    // select a new worksheet
                    if (_state.workbook[insightID].history.length > 0) {
                        messageService.emit('select-worksheet', {
                            insightID: insightID,
                            sheetId:
                                _state.workbook[insightID].history[
                                    _state.workbook[insightID].history.length -
                                        1
                                ],
                        });
                    } else {
                        messageService.emit('select-worksheet', {
                            insightID: insightID,
                            sheetId: undefined,
                        });
                    }
                }

                messageService.emit('closed-worksheet', {
                    insightID: insightID,
                    sheetId: sheetId,
                });
            },
            /**
             * @name close-worksheet
             * @param payload - {insightID: id of insight, sheetsToKeep: optional parameter to keep certain sheets}
             * @desc delete all worksheets in an insight
             */
            'close-all-worksheets': function (payload: {
                insightID: string;
                sheetsToKeep?: string[];
            }) {
                const { insightID, sheetsToKeep } = payload;

                // remove worksheet
                for (const sheetId in _state.workbook[insightID].worksheets) {
                    if (sheetsToKeep) {
                        if (sheetsToKeep.indexOf(sheetId) === -1) {
                            messageService.emit('close-worksheet', {
                                insightID: insightID,
                                sheetId: sheetId,
                            });
                        }
                    } else {
                        messageService.emit('close-worksheet', {
                            insightID: insightID,
                            sheetId: sheetId,
                        });
                    }
                }
            },
            /**
             * @name set-sheet-selection
             * @param payload - {insightID: id of insight, selectable: boolean to enable/disable sheet selection}
             * @desc sets whether new sheets can be selected when added/removed
             */
            'set-sheet-selection': function (payload: {
                insightID: string;
                selectable: boolean;
            }) {
                const { insightID, selectable } = payload;
                _state.workbook[insightID].allowSheetSelection = selectable;
            },

            /**
             * @name configure-worksheet
             * @param payload - {insightID, sheetId, worksheet}
             * @desc configure a worksheet with new options
             */
            'configure-worksheet': function (payload: {
                insightID: string;
                sheetId: string;
                worksheet: any;
            }): void {
                const { insightID, sheetId } = payload;

                const worksheet = payload.worksheet || {};

                _state.workbook[insightID].worksheets[sheetId] = angular.merge(
                    _state.workbook[insightID].worksheets[sheetId],
                    worksheet
                );

                // tell that the sheet has been updated
                messageService.emit('updated-worksheet', {
                    insightID: insightID,
                    sheetId: sheetId,
                });
            },
            /**
             * @name cache-worksheet
             * @param payload - {golden, panel, insightID, sheetId}
             * @desc sets the current layout config objects
             */
            'cache-worksheet': function (payload: {
                golden: any;
                insightID: string;
                sheetId: string;
            }): void {
                const { insightID, sheetId, golden } = payload;
                if (golden) {
                    _state.workbook[insightID].worksheets[sheetId].golden =
                        golden;
                }
            },
            /**
             * @name add-panel
             * @param payload - {insightID, panelId, panel, widgetId}
             * @desc add a panel (this should be called from a pixel)
             */
            'add-panel': function (payload: {
                insightID: string;
                panelId: string;
                panel: any;
                widgetId: string;
            }): void {
                const { insightID, panelId, widgetId } = payload;

                let sheetId = '0',
                    panel = payload.panel || {},
                    theme = storeService.getShared(insightID, 'theme') || {};

                // happens with old saved dashboard
                if (!_state.workbook[insightID]) {
                    messageService.emit('alert', {
                        color: 'error',
                        text: 'Error: Insight is missing',
                    });

                    console.error('Error: Insight is missing');
                }

                // use the sheetId if it there
                if (panel.hasOwnProperty('sheetId')) {
                    sheetId = panel.sheetId;
                }

                // create it if it is missing
                if (
                    !_state.workbook[insightID].worksheets.hasOwnProperty(
                        sheetId
                    )
                ) {
                    messageService.emit('alert', {
                        color: 'error',
                        text: 'Error: Sheet is missing',
                    });

                    console.error('Error: Sheet is missing');
                }

                let exists = false;
                if (
                    _state.workbook[insightID].worksheets[
                        sheetId
                    ].panels.hasOwnProperty(panelId)
                ) {
                    exists = true;
                }

                // this is for golden layout
                if (
                    !panel.config ||
                    !panel.config.type ||
                    panel.config.type === PANEL_TYPES.GOLDEN
                ) {
                    let themeConfig = {};

                    if (theme) {
                        let active = storeService.getWidget(widgetId, 'active'),
                            config;
                        if (active === 'dashboard-filter') {
                            config = theme.filter;
                        } else if (active === 'text-editor') {
                            config = theme.text;
                        } else {
                            config = theme.panel;
                        }
                        themeConfig = angular.merge({}, PANEL_OPTIONS.GOLDEN, {
                            config: config,
                        });
                    }

                    panel = angular.merge(
                        {},
                        PANEL_OPTIONS.GOLDEN,
                        themeConfig,
                        panel
                    );
                } else {
                    let themeConfig = {};

                    if (theme) {
                        let active = storeService.getWidget(widgetId, 'active'),
                            config;
                        if (active === 'dashboard-filter') {
                            config = theme.filter;
                        } else if (active === 'text-editor') {
                            config = theme.text;
                        } else {
                            config = theme.panel;
                        }
                        themeConfig = {
                            config: config,
                        };
                    }

                    // forces standard to become floating
                    panel = angular.merge(
                        {},
                        PANEL_OPTIONS.FLOATING,
                        themeConfig,
                        panel,
                        {
                            config: {
                                type: PANEL_TYPES.FLOATING,
                            },
                        }
                    );
                }

                // update the ids
                // Remember this is the most up to date state
                panel.panelId = panelId;
                panel.widgetId = widgetId;
                panel.sheetId = sheetId;

                // save the value
                _state.workbook[insightID].worksheets[sheetId].panels[panelId] =
                    panel;

                // update the panel label
                if (
                    !_state.workbook[insightID].worksheets[sheetId].panels[
                        panelId
                    ].labelOverride
                ) {
                    setSmartPanelLabel(insightID, sheetId, panelId);
                }

                // the panel has already been added so we will reset it
                if (exists) {
                    messageService.emit('reset-panel', {
                        insightID: insightID,
                        sheetId: sheetId,
                        panelId: panelId,
                    });
                } else {
                    messageService.emit('added-panel', {
                        insightID: insightID,
                        sheetId: sheetId,
                        panelId: panelId,
                    });
                }

                messageService.emit('select-panel', {
                    insightID: insightID,
                    sheetId: sheetId,
                    panelId: panelId,
                    mode: 'move',
                });
            },

            /**
             * @name close-panel
             * @param payload - {insightID, panelId}
             * @desc close a panel (this should be called from a pixel)
             */
            'close-panel': function (payload: {
                insightID: string;
                panelId: string;
            }): void {
                const { insightID, panelId } = payload;

                // find the sheet that the panel belongs to
                const sheetId = findSheet(insightID, panelId);

                // sheet can't be found
                if (!sheetId) {
                    return;
                }

                // delete the id
                delete _state.workbook[insightID].worksheets[sheetId].panels[
                    panelId
                ];

                // tell that the panels have been closed
                messageService.emit('closed-panel', {
                    insightID: insightID,
                    sheetId: sheetId,
                    panelId: panelId,
                });

                messageService.emit('select-panel', {
                    insightID: insightID,
                    sheetId: sheetId,
                    panelId: '',
                    mode: 'move',
                });
            },
            /**
             * @name configure-panel
             * @param payload - {insightID, panelId, panel}
             * @desc configure the panel with new optins
             */
            'configure-panel': function (payload: {
                insightID: string;
                panelId: string;
                panel: any;
                widgetId: string;
            }): void {
                const { insightID, panelId, widgetId } = payload;

                const panel = payload.panel || {},
                    theme = storeService.getShared(insightID, 'theme') || {};

                // find the sheet that the panel belongs to
                const sheetId = findSheet(insightID, panelId);

                // sheet can't be found
                if (!sheetId) {
                    return;
                }

                let type = PANEL_TYPES.GOLDEN;

                // get the type and we will adjust to that
                if (
                    panel &&
                    panel.config &&
                    panel.config.hasOwnProperty('type')
                ) {
                    type = panel.config.type;
                } else if (
                    _state.workbook[insightID].worksheets[sheetId].panels[
                        panelId
                    ] &&
                    _state.workbook[insightID].worksheets[sheetId].panels[
                        panelId
                    ].config &&
                    _state.workbook[insightID].worksheets[sheetId].panels[
                        panelId
                    ].config.hasOwnProperty('type')
                ) {
                    type =
                        _state.workbook[insightID].worksheets[sheetId].panels[
                            panelId
                        ].config.type;
                }

                // get the options based on the type
                let base: any,
                    themeConfig = {};
                if (!type || type === PANEL_TYPES.GOLDEN) {
                    base = angular.merge({}, PANEL_OPTIONS.GOLDEN);

                    if (theme) {
                        let active = storeService.getWidget(widgetId, 'active'),
                            config;
                        if (active === 'dashboard-filter') {
                            config = theme.filter;
                        } else if (active === 'text-editor') {
                            config = theme.text;
                        } else {
                            config = theme.panel;
                        }
                        themeConfig = {
                            config: config,
                        };
                    }

                    type = PANEL_TYPES.GOLDEN;
                } else {
                    base = angular.merge({}, PANEL_OPTIONS.FLOATING);
                    let active = storeService.getWidget(widgetId, 'active'),
                        config;
                    if (active === 'dashboard-filter') {
                        config = theme.filter;
                    } else if (active === 'text-editor') {
                        config = theme.text;
                    } else {
                        config = theme.panel;
                    }

                    if (theme) {
                        themeConfig = {
                            config: config,
                        };
                    }

                    type = PANEL_TYPES.FLOATING;
                }

                // merge in the options (and force the standardization of the type)
                _state.workbook[insightID].worksheets[sheetId].panels[panelId] =
                    angular.merge(
                        {},
                        base,
                        _state.workbook[insightID].worksheets[sheetId].panels[
                            panelId
                        ],
                        themeConfig,
                        panel,
                        {
                            config: {
                                type: type,
                            },
                        }
                    );

                // remove extra from the config
                for (const option in _state.workbook[insightID].worksheets[
                    sheetId
                ].panels[panelId].config) {
                    if (
                        _state.workbook[insightID].worksheets[sheetId].panels[
                            panelId
                        ].config.hasOwnProperty(option) &&
                        !base.config.hasOwnProperty(option)
                    ) {
                        delete _state.workbook[insightID].worksheets[sheetId]
                            .panels[panelId].config[option];
                    }
                }

                // tell that the panels have been updated
                messageService.emit('updated-panel', {
                    insightID: insightID,
                    sheetId: sheetId,
                    panelId: panelId,
                });

                messageService.emit('select-panel', {
                    insightID: insightID,
                    sheetId: sheetId,
                    panelId: panelId,
                });
            },
            /**
             * @name select-panel
             * @param payload - {insightID, sheetId, panelId}
             * @desc select a  panel
             */
            'select-panel': function (payload: {
                insightID: string;
                sheetId: string;
                panelId: string;
                mode?: 'move' | 'edit';
            }): void {
                const { insightID, sheetId, panelId, mode } = payload;

                if (
                    _state.workbook[insightID].worksheets[sheetId].selected
                        .panel !== panelId ||
                    (mode &&
                        _state.workbook[insightID].worksheets[sheetId].selected
                            .mode !== mode)
                ) {
                    // panels can be undefined (nothing is selected)
                    _state.workbook[insightID].worksheets[
                        sheetId
                    ].selected.panel = panelId;

                    if (mode) {
                        _state.workbook[insightID].worksheets[
                            sheetId
                        ].selected.mode = mode;
                    }

                    messageService.emit('selected-panel', {
                        insightID: insightID,
                        sheetId: sheetId,
                        panelId: panelId,
                    });
                }
            },
            /**
             * @name cache-panel
             * @param payload - {insightID, panelId, panel}
             * @desc store changes to the panel
             */
            'cache-panel': function (payload: {
                insightID: string;
                panelId: string;
                panel: any;
            }): void {
                const { insightID, panelId } = payload;

                const panel = payload.panel || {};

                // find the sheet that the panel belongs to
                const sheetId = findSheet(insightID, panelId);

                // sheet can't be found
                if (!sheetId) {
                    return;
                }

                _state.workbook[insightID].worksheets[sheetId].panels[panelId] =
                    angular.merge(
                        _state.workbook[insightID].worksheets[sheetId].panels[
                            panelId
                        ],
                        panel
                    );
            },
            /**
             * @name update-task
             * @param payload - {insightID}
             * @desc task has been changed, update the panel label
             */
            'update-task': function (payload: {
                insightID: string;
                panelId: string;
            }) {
                const { insightID, panelId } = payload;

                updatePanelLabel(insightID, panelId);
            },
            /**
             * @name update-view
             * @param payload - {insightID}
             * @desc view has been updated, update the panel label
             */
            'update-view': function (payload: {
                insightID: string;
                panelId: string;
            }) {
                const { insightID, panelId } = payload;

                updatePanelLabel(insightID, panelId);
            },
            /**
             * @name update-ornaments
             * @param payload - {insightID}
             * @desc ornaments has been updated, update the panel label
             */
            'update-ornaments': function (payload: {
                insightID: string;
                panelId: string;
            }) {
                const { insightID, panelId } = payload;

                updatePanelLabel(insightID, panelId);
            },
            /**
             * @name update-theme
             * @param payload  - {insightID, theme}
             * @desc theme has been updated, update the workbook
             */
            'update-theme': function (payload: {
                insightID: string;
                theme: any;
            }) {
                const { insightID, theme } = payload;
                updateWorkbookTheme(insightID, theme);
            },
        };

    /** Public */

    /**
     * @name updateWorkbookTheme
     * @param insightID {string} - insight to update
     * @param theme {any} - the new theme
     * @desc updates items in the workbook when a theme is applied
     */
    function updateWorkbookTheme(insightID, theme) {
        if (_state.workbook[insightID]) {
            for (const sheetIdx in _state.workbook[insightID].worksheets) {
                if (
                    sheetIdx &&
                    _state.workbook[insightID].worksheets.hasOwnProperty(
                        sheetIdx
                    )
                ) {
                    const sheet =
                        _state.workbook[insightID].worksheets[sheetIdx];

                    // Update sheet style
                    if (theme && theme.sheet) {
                        sheet.backgroundColor = theme.sheet.backgroundColor;

                        if (
                            _state.workbook[insightID].worksheet ===
                            sheet.sheetId
                        ) {
                            messageService.emit('updated-worksheet', {
                                insightID: insightID,
                                sheetId: sheet.sheetId,
                            });
                        }
                    }

                    // Update panel style
                    for (const panelIdx in sheet.panels) {
                        if (panelIdx && sheet.panels.hasOwnProperty(panelIdx)) {
                            const panel = sheet.panels[panelIdx];
                            if (theme) {
                                let active = storeService.getWidget(
                                        panel.widgetId,
                                        'active'
                                    ),
                                    config;
                                if (active === 'dashboard-filter') {
                                    config = theme.filter;
                                } else if (active === 'text-editor') {
                                    config = theme.text;
                                } else {
                                    config = theme.panel;
                                }
                                panel.config = angular.merge(
                                    {},
                                    panel.config,
                                    config
                                );

                                if (
                                    _state.workbook[insightID].worksheet ===
                                    sheet.sheetId
                                ) {
                                    messageService.emit('updated-panel', {
                                        insightID: insightID,
                                        sheetId: sheet.sheetId,
                                        panelId: panel.panelId,
                                    });
                                    messageService.emit('update-ornaments', {
                                        insightID: insightID,
                                        panelId: panel.panelId,
                                        widgetId: panel.widgetId,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * @name updatePanelLabel
     * @desc update the panel label and message out if it has changed
     * @param insightId to update
     * @param panelId to update
     * @return {void}
     */
    function updatePanelLabel(insightID: string, panelId: string): void {
        // find the sheet that the panel belongs to
        const sheetId = findSheet(insightID, panelId);

        if (!sheetId) {
            return;
        }

        if (
            !_state.workbook[insightID].worksheets[sheetId].panels[panelId]
                .labelOverride
        ) {
            setSmartPanelLabel(insightID, sheetId, panelId);

            // tell that the panels have been updated
            messageService.emit('updated-panel', {
                insightID: insightID,
                sheetId: sheetId,
                panelId: panelId,
            });
        }
    }

    /**
     * @name setSmartPanelLabel
     * @desc get the panel label
     * @param insightId to update
     * @param sheetId to update
     * @param panelId to update
     * @return {void}
     */
    function setSmartPanelLabel(
        insightID: string,
        sheetId: string,
        panelId: string
    ): void {
        let widgets = storeService.get('widgets'),
            widgetId = '',
            label = '',
            active = '';

        for (widgetId in widgets) {
            if (widgets.hasOwnProperty(widgetId)) {
                if (
                    widgets[widgetId].insightID === insightID &&
                    widgets[widgetId].panelId === panelId
                ) {
                    break;
                }
            }
        }

        if (!widgetId) {
            return;
        }

        active = storeService.getWidget(widgetId, 'active');
        if (active === 'visualization') {
            const headerInfo = storeService.getWidget(
                widgetId,
                'view.visualization.tasks.0.meta.headerInfo'
            );
            if (headerInfo && headerInfo.length > 0) {
                let post = '',
                    layout: string = storeService.getWidget(
                        widgetId,
                        'view.visualization.layout'
                    ),
                    keyType: any[] = storeService.getWidget(
                        widgetId,
                        'view.visualization.keys.' + layout
                    );

                label += layout + ' of ';
                headerInfo.forEach((key, index: number): void => {
                    // if we have added the ..., ignore
                    if (label.slice(-3) !== '...') {
                        // logic to create english sounding sentence
                        if (index === 0) {
                            if (
                                layout !== 'Grid' &&
                                layout !== 'ScatterplotMatrix' &&
                                layout !== 'ParallelCoordinates' &&
                                layout !== 'HeatMap' &&
                                layout !== 'TreeMap' &&
                                layout !== 'Sunburst' &&
                                layout !== 'Graph' &&
                                layout !== 'VivaGraph' &&
                                layout !== 'GraphGL' &&
                                layout !== 'Dendrogram' &&
                                layout !== 'Cluster' &&
                                layout !== 'Sankey' &&
                                layout !== 'Map'
                            ) {
                                post = ' by ' + key.alias;
                                return;
                            }

                            label += key.alias;
                            if (headerInfo.length > 1) {
                                label += ', ';
                            }
                            return;
                        } else if (
                            keyType &&
                            keyType[index] &&
                            (keyType[index].model === 'tooltip' ||
                                keyType[index].model === 'longitude' ||
                                keyType[index].model === 'latitude')
                        ) {
                            return;
                        } else if (index === 1) {
                            label += key.alias;
                            return;
                        } else if (label.length > 65) {
                            // once we get to this many characters, limit the length
                            label += '...';
                            return;
                        } else if (
                            index === headerInfo.length - 1 &&
                            headerInfo.length >= 3
                        ) {
                            label += ', and ' + key.alias;
                            return;
                        }

                        label += ', ' + key.alias;
                    }
                });

                label += post;
            }
        } else if (active === 'DashboardFilter') {
            const dashboardFilterInstances = storeService.getWidget(
                widgetId,
                'view.DashboardFilter.dashboardFilter.instances'
            );

            label += 'Filter of ';

            if (
                dashboardFilterInstances &&
                dashboardFilterInstances.length > 0
            ) {
                label += dashboardFilterInstances.join(', ');
            }
        } else if (active === 'dashboard-filter') {
            const options =
                storeService.getWidget(
                    widgetId,
                    'view.dashboard-filter.options'
                ) || {};

            if (options.column) {
                label += `Filter of ${options.column}`;
            } else {
                label += 'Create Filter';
            }
        } else if (active) {
            label += active
                .split('-')
                .filter(function (chunk) {
                    return chunk;
                })
                .map(function (chunk) {
                    return chunk.charAt(0).toUpperCase() + chunk.substring(1);
                })
                .join(' ');
        } else {
            label += `Panel ${panelId}`;
        }

        _state.workbook[insightID].worksheets[sheetId].panels[
            panelId
        ].panelLabel = String(label).replace(/_/g, ' ');
    }

    /**
     * @name findSheet
     * @desc find the sheet in the state
     * @param insightID - insightID of the widget
     * @param panelId - panelId of the widget
     * @returns sheetId
     */
    function findSheet(insightID: string, panelId: string): string {
        for (const sheetId in _state.workbook[insightID].worksheets) {
            if (_state.workbook[insightID].worksheets.hasOwnProperty(sheetId)) {
                if (
                    _state.workbook[insightID].worksheets[
                        sheetId
                    ].panels.hasOwnProperty(panelId)
                ) {
                    return sheetId;
                }
            }
        }

        return '';
    }

    /**
     * @name setWorksheetOrder
     * @desc set the order variable for a worksheet
     * @param insightID - insightID of the widget
     * @param sheetID - sheetID of the widget
     * @param order - order
     */
    function setWorksheetOrder(
        insightID: string,
        sheetID: string,
        order: number
    ): void {
        _state.workbook[insightID].worksheets[sheetID].order = order;
    }

    /**
     * @name initialize
     * @desc called when the module is loaded
     * @return {void}
     */
    function initialize() {
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
     * @name getWorkbook
     * @param {string} insightID - id of the the insight to grab information for
     * @param {string} accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns {*} value of the requested object
     */
    function getWorkbook(insightID: string, accessor?: string): any {
        if (!_state.workbook[insightID]) {
            return undefined;
        }

        return Utility.getter(_state.workbook[insightID], accessor);
    }

    /**
     * @name saveWorkbook
     * @param insightID - id of the the insight to grab information for
     * @desc save the configuration for the current workbook
     * @returns config
     */
    function saveWorkbook(insightID: string): {
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
                golden?: any;
                order: number;
            };
        };
        sheet?: string;
    } {
        if (!_state.workbook[insightID]) {
            return {};
        }

        // save the most recent version
        messageService.emit('save-worksheet', {
            insightID: insightID,
        });

        const panels = {},
            sheets = {},
            config: {
                panels?: any;
                sheets?: any;
                golden?: any;
                sheet?: string;
            } = {};

        for (const sheetId in _state.workbook[insightID].worksheets) {
            if (_state.workbook[insightID].worksheets.hasOwnProperty(sheetId)) {
                // add in the panels
                for (const panelId in _state.workbook[insightID].worksheets[
                    sheetId
                ].panels) {
                    if (
                        _state.workbook[insightID].worksheets[
                            sheetId
                        ].panels.hasOwnProperty(panelId)
                    ) {
                        // base panel
                        panels[panelId] = {
                            config: {
                                type: _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.type,
                            },
                        };

                        // this means that it is golden
                        if (
                            _state.workbook[insightID].worksheets[sheetId]
                                .panels[panelId].config.type ===
                            PANEL_TYPES.GOLDEN
                        ) {
                            panels[panelId].config.backgroundColor =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.backgroundColor;
                            panels[panelId].config.opacity =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.opacity;
                        } else if (
                            _state.workbook[insightID].worksheets[sheetId]
                                .panels[panelId].config.type ===
                            PANEL_TYPES.FLOATING
                        ) {
                            // save if it is different
                            panels[panelId].config.backgroundColor =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.backgroundColor;
                            panels[panelId].config.opacity =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.opacity;
                            panels[panelId].config.top =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.top;
                            panels[panelId].config.left =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.left;
                            panels[panelId].config.height =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.height;
                            panels[panelId].config.width =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.width;
                            panels[panelId].config.zIndex =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.zIndex;
                            panels[panelId].config.panelstatus =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.panelstatus;

                            // Border
                            panels[panelId].config.borderWidth =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.borderWidth;
                            panels[panelId].config.borderStyle =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.borderStyle;
                            panels[panelId].config.borderColor =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.borderColor;

                            // Box Shadow
                            panels[panelId].config.shadowX =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.shadowX;
                            panels[panelId].config.shadowY =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.shadowY;
                            panels[panelId].config.shadowBlur =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.shadowBlur;
                            panels[panelId].config.shadowSpread =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.shadowSpread;
                            panels[panelId].config.shadowColor =
                                _state.workbook[insightID].worksheets[
                                    sheetId
                                ].panels[panelId].config.shadowColor;
                        }

                        if (Object.keys(panels[panelId]).length === 0) {
                            delete panels[panelId];
                        }
                    }
                }

                // add the sheet information
                sheets[sheetId] = {};

                // add the backgroundColor
                if (
                    _state.workbook[insightID].worksheets[sheetId]
                        .backgroundColor !== WORKSHEET.backgroundColor
                ) {
                    sheets[sheetId].backgroundColor =
                        _state.workbook[insightID].worksheets[
                            sheetId
                        ].backgroundColor;
                }

                // add the order
                if (
                    _state.workbook[insightID].worksheets[sheetId].order !==
                    WORKSHEET.order
                ) {
                    sheets[sheetId].order =
                        _state.workbook[insightID].worksheets[sheetId].order;
                }

                // add the hideHeaders
                if (
                    _state.workbook[insightID].worksheets[sheetId]
                        .hideHeaders !== WORKSHEET.hideHeaders
                ) {
                    sheets[sheetId].hideHeaders =
                        _state.workbook[insightID].worksheets[
                            sheetId
                        ].hideHeaders;
                }

                // add the hideGutters
                if (
                    _state.workbook[insightID].worksheets[sheetId]
                        .hideGutters !== WORKSHEET.hideGutters
                ) {
                    sheets[sheetId].hideGutters =
                        _state.workbook[insightID].worksheets[
                            sheetId
                        ].hideGutters;
                }

                // add the gutterSize
                if (
                    _state.workbook[insightID].worksheets[sheetId]
                        .gutterSize !== WORKSHEET.gutterSize
                ) {
                    sheets[sheetId].gutterSize =
                        _state.workbook[insightID].worksheets[
                            sheetId
                        ].gutterSize;
                }

                // add the height
                if (
                    _state.workbook[insightID].worksheets[sheetId].height !==
                    WORKSHEET.height
                ) {
                    sheets[sheetId].height =
                        _state.workbook[insightID].worksheets[sheetId].height;
                }

                // add the width
                if (
                    _state.workbook[insightID].worksheets[sheetId].width !==
                    WORKSHEET.width
                ) {
                    sheets[sheetId].width =
                        _state.workbook[insightID].worksheets[sheetId].width;
                }

                // add the golden layout
                if (
                    _state.workbook[insightID].worksheets[
                        sheetId
                    ].hasOwnProperty('golden') &&
                    JSON.stringify(
                        _state.workbook[insightID].worksheets[sheetId].golden
                    ) !== JSON.stringify(WORKSHEET.golden)
                ) {
                    sheets[sheetId].golden =
                        _state.workbook[insightID].worksheets[sheetId].golden;
                }

                if (Object.keys(sheets[sheetId]).length === 0) {
                    delete sheets[sheetId];
                }
            }
        }

        if (Object.keys(panels).length > 0) {
            config.panels = panels;
        }

        if (Object.keys(sheets).length > 0) {
            config.sheets = sheets;
        }

        if (Object.keys(config).length > 0) {
            // add the sheet if it is defined
            if (typeof _state.workbook[insightID].worksheet !== 'undefined') {
                config.sheet = _state.workbook[insightID].worksheet;
            }
        }

        return config;
    }

    /**
     * @name getWorksheet
     * @param insightID - id of the the insight to grab information for
     * @param sheetId - id of the sheet to grab information for
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function getWorksheet(
        insightID: string,
        sheetId: string,
        accessor?: string
    ): any {
        if (!_state.workbook[insightID].worksheets[sheetId]) {
            return undefined;
        }

        return Utility.getter(
            _state.workbook[insightID].worksheets[sheetId],
            accessor
        );
    }

    /**
     * @name getPanel
     * @param insightID - id of the the insight to grab information for
     * @param sheetId - id of the sheet to grab information for
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function getPanel(
        insightID: string,
        sheetId: string,
        panelId: string,
        accessor?: string
    ): any {
        if (!_state.workbook[insightID].worksheets[sheetId].panels[panelId]) {
            return undefined;
        }

        return Utility.getter(
            _state.workbook[insightID].worksheets[sheetId].panels[panelId],
            accessor
        );
    }

    return {
        initialize: initialize,
        get: get,
        getWorkbook: getWorkbook,
        setWorksheetOrder: setWorksheetOrder,
        saveWorkbook: saveWorkbook,
        getWorksheet: getWorksheet,
        getPanel: getPanel,
    };
}
