'use strict';
import angular from 'angular';
import { PANEL_TYPES } from '../../core/constants.js';

// Import functions that create recipes for each visualization
import createMainViz from './recipes/main';
import createItemsetViz from './recipes/itemset';

/**
 * @name implied-insights.service.ts
 * @desc main functions to run implied insights and create a dashboard
 */
export default angular
    .module('app.implied-insights.service', [])
    .factory('impliedInsightsService', impliedInsightsService);

impliedInsightsService.$inject = [];

function impliedInsightsService() {
    // Panel IDs
    enum PANELS {
        panel0, // Dataset Grid
        panel1, // Filter
        panel2, // Attribute Importance
        // panel3, // Dataset Outliers // removed
        // panel4, // Column Outliers // removed
        panel3, // Frequent Itemsets
        panel4, // Column Composition and Outliers
    }

    // Order of frames returned
    enum FRAMES {
        sumNum,
        sumString,
        sumDate,
        column,
        itemset,
    }

    const frameToPanel = {
        [FRAMES.column]: [PANELS.panel3],
        [FRAMES.itemset]: [PANELS.panel4],
    };

    const panelDisplay = {
        [PANELS.panel0]: {
            display: true,
            panelTitle: 'Dataset',
            id: PANELS.panel0,
        },
        [PANELS.panel1]: {
            display: true,
            panelTitle: 'Outlier Filter',
            id: PANELS.panel1,
        },
        [PANELS.panel2]: {
            display: true,
            panelTitle: 'Attribute Importance',
            id: PANELS.panel2,
        },
        [PANELS.panel3]: {
            display: false,
            panelTitle: 'Frequent Itemset',
            id: PANELS.panel3,
        },
        [PANELS.panel4]: {
            display: false,
            panelTitle: 'Column Composition and Outliers',
            id: PANELS.panel4,
        },
    };

    let createdFrames: any = [],
        createdPanels: any = [];

    /**
     * @name createAttributeImportance
     * @desc creates the pixel recipe for the attribute importance panel
     * @param panelId - the panel ID
     * @param sheetId - the sheet ID
     * @returns pixel commands
     */
    function createAttributeImportance(
        panelId: number,
        sheetId: number,
        frame: string,
        columns: any[]
    ): PixelCommand[] {
        return [
            {
                type: 'addPanel',
                components: [panelId, sheetId],
                terminal: true,
            },
            {
                type: 'panel',
                components: [panelId],
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
                components: [panelId],
            },
            {
                type: 'setPanelView',
                components: [
                    'implied-insights-attribute-importance',
                    {
                        frame: frame,
                        columns: columns,
                    },
                ],
                terminal: true,
            },
        ];
    }

    /**
     * @name createComposition
     * @desc creates the pixel recipe for the column composition panel
     * @param panelId - the panel ID
     * @param sheetId - the sheet ID
     * @param frames - list of frames needed
     * @returns pixel commands
     */
    function createComposition(panelId: number, sheetId: number, frames: any) {
        return [
            {
                type: 'addPanel',
                components: [panelId, sheetId],
                terminal: true,
            },
            {
                type: 'panel',
                components: [panelId],
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
                components: [panelId],
            },
            {
                type: 'setPanelView',
                components: [
                    'implied-insights-composition',
                    {
                        frames: frames,
                    },
                ],
                terminal: true,
            },
        ];
    }

    /**
     * @name setPanelDisplay
     * @desc Used to determine if a viz should be displayed in the final dashboard.
     * If the frame is null, then it will not be displayed.
     * @param frames - list of frames created by implied insights
     */
    function setPanelDisplay(frames): void {
        createdPanels = [];
        for (let i = 0; i < frames.length; i++) {
            const panelIds = frameToPanel[i];

            if (!panelIds || panelIds.length === 0) continue;

            const display = !!frames[i];

            for (let panelId = 0; panelId < panelIds.length; panelId++) {
                panelDisplay[panelIds[panelId]].display = display;
                if (display) {
                    createdPanels.push(panelIds[panelId]);
                }
            }
        }
    }

    /**
     * @name createDashboard
     * @desc creates the dashboard
     * @param initial - true if this is the first time the dashboard is being created
     * @param frame - the frame of data that implied insights is run on
     * @param dataFrames - the new frames created by implied insights
     * @param sheetId - id of new sheet
     */
    function createDashboard(
        initial = false,
        frame: any,
        dataFrames: any,
        sheetId: number
    ): PixelCommand[] {
        let commands: PixelCommand[] = [],
            mainFrame = frame.name,
            frameHeaders = frame.headers,
            colOutlierFrame = dataFrames[FRAMES.column],
            compositionFrames = {
                number: dataFrames[FRAMES.sumNum],
                string: dataFrames[FRAMES.sumString],
                date: dataFrames[FRAMES.sumDate],
                composition: dataFrames[FRAMES.column],
            },
            itemsetFrame = dataFrames[FRAMES.itemset];
        createdFrames = dataFrames;
        if (mainFrame.length > 0) {
            setPanelDisplay(dataFrames);
            if (initial) {
                // Create Dataset Grid and Filter - these will use the main frame of data and only get created once
                const gridCommands = createMainViz.createDataGridViz(
                        PANELS.panel0,
                        sheetId,
                        mainFrame
                    ),
                    filterCommands = createMainViz.createFilterViz(
                        PANELS.panel1,
                        sheetId,
                        colOutlierFrame,
                        frameHeaders
                    ),
                    // Create Attribute Importance Panel - this panel does not rely on the whole dataset and uses its own reactor to get data
                    attributeCommands = createAttributeImportance(
                        PANELS.panel2,
                        sheetId,
                        mainFrame,
                        frameHeaders
                    );
                commands = commands.concat(
                    gridCommands,
                    filterCommands,
                    attributeCommands
                );
            }
            // Create Implied Insights Visualizations: Attribute Importance (itemset) and Column Composition
            // The data for these visualizations is created by implied insights whenever the main frame of data is changed
            const itemsetCommands = createItemsetViz(
                    PANELS.panel3,
                    sheetId,
                    itemsetFrame
                ),
                compositionCommands = createComposition(
                    PANELS.panel4,
                    sheetId,
                    compositionFrames
                ),
                labelCommands = createMainViz.setPanelLabels(panelDisplay),
                layoutCommands = createMainViz.createDashboardLayout(
                    panelDisplay,
                    sheetId
                );

            commands = commands.concat(
                itemsetCommands,
                compositionCommands,
                labelCommands,
                layoutCommands
            );
        }
        return commands;
    }

    /**
     * @name getFrame
     * @desc retrieves the index of the frame
     * @param frameName - name of the frame to retrieve
     */
    function getFrame(frameName): string {
        return FRAMES[frameName];
    }

    /**
     * @name removePanels
     * @desc removes previous panels
     * @returns pixel commands to remove panels
     */
    function removePanels(): PixelCommand[] {
        const commands: PixelCommand[] = [];

        for (let i = 0; i < createdPanels.length; i++) {
            if (panelDisplay[createdPanels[i]].display) {
                commands.push({
                    type: 'closePanel',
                    components: [createdPanels[i]],
                    terminal: true,
                });
            }
        }
        return commands;
    }

    /**
     * @name removeFrames
     * @desc removes previous frames
     * @returns pixel commands to remove frames
     */
    function removeFrames(): PixelCommand[] {
        const commands: PixelCommand[] = [];
        for (let i = 0; i < createdFrames.length; i++) {
            if (createdFrames[i]) {
                commands.push({
                    type: 'removeFrame',
                    components: [createdFrames[i]],
                    terminal: true,
                });
            }
        }
        createdFrames = [];
        return commands;
    }

    /**
     * @name getHelpHtml
     * @desc returns html for help popovers
     * @returns html
     */
    function getHelpHtml(): string {
        const html = `
        <div class="section">
            <h4>Dataset</h4>
            <p>
                This panel will visualize the current dataset in a grid. The data can be filtered by using the Outlier Filter.
            </p>
        </div>
        <div class="section">
            <h4>Outlier Filter</h4>
            <p>
                The Outlier Filter will let you drill down into your data. Click the plus button to filter by outliers. After applying a filter, Implied Insights will run and recreate the dashboard. To unfilter, you can click the "X" icon to remove the last applied filter.
            </p>
        </div>
        <div class="section">
            <h4>Column Composition and Outliers</h4>
            <p>
            The Column Composition and Outliers panel will show you various information about the columns in the dataset. Each section is organized by column and will show you the frequency of instances, outliers, and overall column statistics.
            </p>
        </div>
        <div class="section">
            <h4>Frequent Itemset</h4>
            <p>
            Frequent Itemset will show you groupings of items that frequently appear together.
            </p>
        </div>
        <div class="section">
            <h4>Attribute Importance</h4>
            <p>
            To use Attribute Importance, first select a column then execute (execution may take awhile). After executing, you will be shown a bar chart which shows the other columns' effect on the selected column.
            </p>
        </div>
        `;

        return html;
    }

    return {
        createDashboard: createDashboard,
        getFrame: getFrame,
        removePanels: removePanels,
        removeFrames: removeFrames,
        getHelpHtml: getHelpHtml,
    };
}
