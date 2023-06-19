import GoldenLayout from 'golden-layout';
import 'golden-layout/src/css/goldenlayout-base.css';
import 'golden-layout/src/css/goldenlayout-light-theme.css';

import './LayoutManager.scss';

import variables from '@/style/src/variables.scss';

export class LayoutManager {
    private layout: any;
    private highlighted = '';
    private disabled = false;
    private headers = false;
    private splitter = true;
    private splitterSize = 2;

    constructor(config: {
        ele: HTMLElement;
        content: any[];
        compile: any;
        destroy: any;
        events?: any;
    }) {
        if (!config.ele) {
            console.error('ele is required');
            return;
        }

        if (!config.compile) {
            console.error('compile is required');
        }

        if (!config.destroy) {
            console.error('destroy is required');
        }

        const events = {
            select: (panelId: string) => {},
            close: (panelId: string) => {},
            clone: (
                event: JQueryEventObject,
                panelId: string,
                relative: boolean
            ) => {},
            change: () => {},
            toggleMaximize: (panelId: string, panelStatus: string) => {},
            filter: (panelId: string) => {},
        };

        if (config.hasOwnProperty('events')) {
            if (config.events.hasOwnProperty('select')) {
                events.select = config.events.select;
            }

            if (config.events.hasOwnProperty('close')) {
                events.close = config.events.close;
            }

            if (config.events.hasOwnProperty('clone')) {
                events.clone = config.events.clone;
            }

            if (config.events.hasOwnProperty('filter')) {
                events.filter = config.events.filter;
            }

            if (config.events.hasOwnProperty('change')) {
                events.change = config.events.change;
            }

            if (config.events.hasOwnProperty('toggleMaximize')) {
                events.toggleMaximize = config.events.toggleMaximize;
            }
        }

        this.highlighted = '';
        this.disabled = false;
        this.headers = false;
        this.splitter = false;

        // need to do this check only if it exists
        if (this.layout) {
            this.layout.destroy();
        }

        // create the golden layout
        this.layout = new GoldenLayout(
            {
                dimensions: {
                    borderWidth: this.splitterSize,
                },
                settings: {
                    showPopoutIcon: false,
                },
                content: config.content || [],
            },
            config.ele
        );

        this.layout.registerComponent('panel', (container, state) => {
            // register and compile the element
            config.compile(container, state);

            // destroy the function when closed
            container.on('destroy', (item) => {
                //TODO: figure out why this is called multiple times by golden layout
                if (item.isComponent) {
                    config.destroy(item.config.componentState);
                }
            });
        });

        this.layout.on('stackCreated', (stack) => {
            // set up container onClick here
            stack.element.click((event) => {
                // stop propagation for panel selection
                event.stopPropagation();

                const panelId =
                    stack.getActiveContentItem().config.componentState.panelId;

                if (panelId) {
                    events.select(panelId);
                }
            });
            // set up mouseenter for container
            stack.element.mouseenter(() => {
                const panelId =
                    stack.getActiveContentItem().config.componentState.panelId;
                if (panelId) {
                    this.toggleControls(panelId, 'visible');
                }
            });
            // set up mouseleave for container
            stack.element.mouseleave(() => {
                const panelId =
                    stack.getActiveContentItem().config.componentState.panelId;
                if (panelId) {
                    this.toggleControls(panelId, 'hidden');
                }
            });
            stack.header.controlsContainer.prepend(
                `<li class="lm_clone" title="Clone Panel"></li>`
            );
            stack.header.controlsContainer.prepend(
                `<li class="lm_filter" title="Filter Panel"></li>`
            );
            stack.header.controlsContainer.children().each((index, child) => {
                if (child.title === 'additional tabs') {
                    child.title = 'Additional Panels';
                } else if (child.title === 'maximise') {
                    child.title = 'Maximize Panel';
                } else if (child.title === 'close') {
                    child.title = 'Close Panel';
                } else if (child.title === 'Clone Panel') {
                    // noop
                }
            });

            stack.header.controlsContainer
                .find('.lm_maximise') //get the maximise icon
                .click(function (event: any) {
                    let panelStatus = '';
                    const panelId =
                        stack.getActiveContentItem().config.componentState
                            .panelId;

                    if (event.target.title === 'maximise') {
                        // state is minimized
                        panelStatus = 'normalized';
                    } else {
                        // state is maximized
                        panelStatus = 'maximized';
                    }

                    events.toggleMaximize(panelId, panelStatus);
                });

            stack.header.controlsContainer
                .find('.lm_close')
                .off('click')
                .click(() => {
                    if (this.disabled) {
                        return;
                    }

                    const panelId =
                        stack.getActiveContentItem().config.componentState
                            .panelId;

                    if (panelId) {
                        events.close(panelId);
                    }
                });

            stack.header.controlsContainer.find(`.lm_clone`).click((event) => {
                if (this.disabled) {
                    return;
                }

                const panelId =
                    stack.getActiveContentItem().config.componentState.panelId;

                if (panelId) {
                    events.clone(event, panelId, false);
                }
            });
            stack.header.controlsContainer.find(`.lm_filter`).click(() => {
                if (this.disabled) {
                    return;
                }

                const panelId =
                    stack.getActiveContentItem().config.componentState.panelId;

                if (panelId) {
                    events.filter(panelId);
                }
            });
            stack.on('activeContentItemChanged', () => {
                events.change();
            });

            // update the stack
            this.updateStack(stack);
        });

        // this captures the 'click' on the tab
        this.layout.on('tabCreated', (tab) => {
            const state = tab.contentItem.container.getState();

            tab.element[0].addEventListener('mousedown', () => {
                const panelId = state.panelId;

                if (panelId) {
                    events.select(panelId);
                }
            });

            // remove the close element
            tab.closeElement.remove();

            // update the color
            if (state.backgroundColor) {
                tab.element[0].style.backgroundColor = state.backgroundColor;
            }

            // this is for drag....
            this.updateHighlight();
        });

        // update the component with options
        this.layout.on('componentCreated', (component) => {
            component.container.on('resize', () => {
                events.change();
            });

            this.updateComponent(component);
        });

        this.layout.init();
    }

    /**
     * @name render
     * @desc render the golden layout
     */
    render(config: { content: any }): void {
        // is there no config, or is the new config, the same? If so, do nothing
        if (!config.content) {
            return;
        }

        const current = this.getConfig();
        const cleaned = this.cleanConfig(config);

        if (
            JSON.stringify(cleaned.content) === JSON.stringify(current.content)
        ) {
            return;
        }

        // replace the content
        if (cleaned && cleaned.hasOwnProperty('content')) {
            // add a new child if it is a strack or row
            if (this.layout.root.contentItems.length === 0) {
                this.layout.root.addChild({
                    type: 'row',
                    content: [],
                });
            }

            this.layout.root.replaceChild(
                this.layout.root.contentItems[0],
                cleaned.content[0],
                true
            );
        }

        // highlight if necessary
        if (this.highlighted) {
            const component = this.getComponent(this.highlighted);
            if (component) {
                component.parent.setActiveContentItem(component);
            }
        }
    }

    /**
     * @name cleanConfig
     * @desc clean layout config
     */
    cleanConfig(current: any): any {
        // update the mapped option
        const cleaned: any = {};

        // copy over select properties
        if (current.hasOwnProperty('type')) {
            cleaned.type = current.type;
        }
        if (current.hasOwnProperty('activeItemIndex')) {
            cleaned.activeItemIndex = current.activeItemIndex;
        }

        if (current.hasOwnProperty('width')) {
            cleaned.width = current.width;
        }

        if (current.hasOwnProperty('height')) {
            cleaned.height = current.height;
        }

        if (current.hasOwnProperty('componentName')) {
            cleaned.componentName = current.componentName;
        }

        if (current.hasOwnProperty('componentState')) {
            cleaned.componentState = {};

            if (current.componentState.hasOwnProperty('panelId')) {
                cleaned.componentState.panelId = current.componentState.panelId;
            }
        }

        if (current.content) {
            const len = current.content.length;
            if (len) {
                cleaned.content = [];
                for (let i = 0; i < len; i++) {
                    cleaned.content.push(this.cleanConfig(current.content[i]));
                }
            }
        }

        return cleaned;
    }

    /**
     * @name getConfig
     * @desc gets layout config
     */
    getConfig(): { content: any } {
        // lets get the content with a custom function
        const config = this.layout.toConfig();

        // remove the 'extra' stuff
        const cleaned = this.cleanConfig(config);

        return {
            content: cleaned.content, // only return the content
        };
    }

    /**
     * @name updateStacks
     * @returns update the stacks
     */
    updateStacks(): void {
        const stacks = this.layout.root.getItemsByFilter((item) => {
            return item.isStack;
        });

        for (
            let stackIdx = 0, stackLen = stacks.length;
            stackIdx < stackLen;
            stackIdx++
        ) {
            this.updateStack(stacks[stackIdx]);
        }
    }

    /**
     * @name updateStack
     * @param stack - stack to update
     * @desc update the stack to match the most recent state
     */
    updateStack(stack: any): void {
        stack.header.controlsContainer.find('.lm_close')[0].style.display = this
            .disabled
            ? 'none'
            : '';

        stack.header.controlsContainer.find('.lm_clone')[0].style.display = this
            .disabled
            ? 'none'
            : '';

        stack.header.controlsContainer.find('.lm_filter')[0].style.display =
            this.disabled ? 'none' : '';

        // toggle the positions
        if (this.headers) {
            stack.header.position('top');
        } else {
            stack.header.position(false);
        }
    }

    /**
     * @name updateComponent
     * @param component - component to update
     * @desc update the panel name
     */
    updateComponent(component: any): void {
        if (component) {
            const state = component.container.getState();

            if (state.backgroundColor) {
                component.tab.element[0].style.backgroundColor =
                    state.backgroundColor;

                component.container
                    .getElement()
                    .css('background-color', state.backgroundColor);
            }

            if (state.opacity || state.opacity === 0) {
                component.container
                    .getElement()
                    .css('opacity', state.opacity / 100);
            }
        }
    }

    /**
     * @name getComponent
     * @param panelId - which widget component to get
     * @returns golden layout selected panel
     */
    getComponent(panelId: string): any {
        const components = this.layout.root.getItemsByFilter((item) => {
            return item.isComponent;
        });

        for (
            let componentIdx = 0, componentLen = components.length;
            componentIdx < componentLen;
            componentIdx++
        ) {
            if (
                components[componentIdx].config &&
                components[componentIdx].config.componentState &&
                components[componentIdx].config.componentState.hasOwnProperty(
                    'panelId'
                ) &&
                components[componentIdx].config.componentState.panelId ===
                    panelId
            ) {
                return components[componentIdx];
            }
        }

        return undefined;
    }

    /**
     * @name destroy
     * @desc destroys the layout
     */
    destroy(): void {
        this.layout.destroy();
    }

    /**
     * @name resize
     * @desc resizes the layout
     */
    resize(): void {
        this.layout.updateSize();
    }

    /**
     * @name enable
     * @desc enable the layout
     */
    enable(): void {
        if (this.disabled === true) {
            this.disabled = false;

            this.updateStacks();

            // need to update the highlight whenever we are enabling or disabling
            this.updateHighlight();

            // update the spliter, to enable / disable it
            this.updateSplitter();

            // update reorder
            this.updateReorder();
        }
    }

    /**
     * @name disable
     * @desc disable the layout
     */
    disable(): void {
        if (this.disabled === false) {
            this.disabled = true;

            this.updateStacks();

            // need to update the highlight whenever we are enabling or disabling
            this.updateHighlight();

            // update the spliter, to enable / disable it
            this.updateSplitter();

            // update reorder
            this.updateReorder();
        }
    }

    /** Header */
    /**
     * @name showHeaders
     * @desc show the headers
     */
    showHeaders(): void {
        if (this.headers === false) {
            this.headers = true;
            this.updateStacks();

            // need to update the highlight whenever we show the headers
            this.updateHighlight();
        }
    }

    /**
     * @name hideHeaders
     * @desc hide the headers
     */
    hideHeaders(): void {
        if (this.headers === true) {
            this.headers = false;
            this.updateStacks();
        }
    }

    /** splitter */
    /**
     * @name showSplitter
     * @desc show the splitter
     */
    showSplitter(): void {
        if (this.splitter === false) {
            this.splitter = true;

            this.layout.config.dimensions.borderWidth = this.splitterSize;
            this.updateSplitter();
        }
    }

    /**
     * @name hideSplitter
     * @desc hide the splitter
     */
    hideSplitter(): void {
        if (this.splitter === true) {
            this.splitter = false;

            this.layout.config.dimensions.borderWidth = 0;
            this.updateSplitter();
        }
    }

    /**
     * @name resizeSplitter
     * @param size - new size of the splitter
     * @desc resize the splitter
     */
    resizeSplitter(size: number): void {
        // update the size, only if there is a difference
        if (this.splitterSize !== size) {
            this.splitterSize = size;

            // rerender if true
            if (this.splitter === true) {
                this.layout.config.dimensions.borderWidth = this.splitterSize;
                this.updateSplitter();
            }
        }
    }

    /**
     * @name updateSplitter
     * @desc update the splitter
     */
    updateSplitter(): void {
        const components = this.layout.root.getItemsByFilter((item) => {
            return item.isColumn || item.isRow;
        });

        for (
            let componentIdx = 0, componentLen = components.length;
            componentIdx < componentLen;
            componentIdx++
        ) {
            if (components[componentIdx].hasOwnProperty('_splitter')) {
                // set the size
                components[componentIdx]._splitterSize =
                    this.layout.config.dimensions.borderWidth;

                // update the individual components
                for (
                    let splitterIdx = 0,
                        splitterLen = components[componentIdx]._splitter.length;
                    splitterIdx < splitterLen;
                    splitterIdx++
                ) {
                    const splitter =
                        components[componentIdx]._splitter[splitterIdx];
                    // update the size
                    splitter._size = this.layout.config.dimensions.borderWidth;

                    // set the pointer if it was disabled/enabled
                    splitter.element.css(
                        'pointer-events',
                        this.disabled ? 'none' : ''
                    );

                    // reposition it
                    // less than 0, hide it
                    if (splitter._size <= 0) {
                        splitter.element.hide();
                        continue;
                    }

                    // show it
                    splitter.element.show();

                    // update the size
                    if (splitter._isVertical) {
                        splitter.element['height'](splitter._size);
                    } else {
                        splitter.element['width'](splitter._size);
                    }
                }
            }
        }

        this.layout.updateSize();
    }

    /** Reorder */
    /**
     * @name updateReorder
     * @desc update the drag
     */
    updateReorder(): void {
        const reorder = !this.disabled;

        this.layout.config.settings.reorderEnabled = reorder;

        const components = this.layout.root.getItemsByFilter((item) => {
            return item.isComponent;
        });

        for (
            let componentIdx = 0, componentLen = components.length;
            componentIdx < componentLen;
            componentIdx++
        ) {
            if (components[componentIdx].tab) {
                const tab = components[componentIdx].tab;

                // clear it
                if (tab._dragListener) {
                    tab.contentItem.off(
                        'destroy',
                        tab._dragListener.destroy,
                        tab._dragListener
                    );
                    tab._dragListener.off('dragStart', tab._onDragStart);
                    tab._dragListener = null;
                }

                // add it if necessary
                if (reorder) {
                    // @ts-ignore - We are using a 'hidden' feature
                    tab._dragListener =
                        new GoldenLayout.__lm.utils.DragListener(tab.element);
                    tab._dragListener.on('dragStart', tab._onDragStart, tab);
                    tab.contentItem.on(
                        'destroy',
                        tab._dragListener.destroy,
                        tab._dragListener
                    );
                }
            }
        }
    }

    /**Highlight */
    /**
     * @name addHighlight
     * @param panelId - panelId to add
     * @desc remove the highlight from golden layout
     */
    addHighlight(panelId: string): void {
        this.highlighted = panelId;
        this.updateHighlight();
    }

    /**
     * @name removeHighlight
     * @desc remove the highlight from golden layout
     */
    removeHighlight(): void {
        this.highlighted = '';
        this.updateHighlight();
    }

    /**
     * @name updateHighlight
     * @desc remove the highlight from golden layout
     */
    updateHighlight(): void {
        const components = this.layout.root.getItemsByFilter((item) => {
            return item.isComponent;
        });

        for (
            let componentIdx = 0, componentLen = components.length;
            componentIdx < componentLen;
            componentIdx++
        ) {
            let color = '';
            if (
                !this.disabled &&
                components[componentIdx].config &&
                components[componentIdx].config.componentState &&
                components[componentIdx].config.componentState.hasOwnProperty(
                    'panelId'
                ) &&
                components[componentIdx].config.componentState.panelId ===
                    this.highlighted
            ) {
                color = variables.defaultPrimary;
            }

            if (components[componentIdx].tab) {
                components[componentIdx].tab.element[0].style.color = color;
            }
        }
    }
    /**
     * @name toggleControls
     * @desc show/hide the controls
     * @param panelId - the panel
     * @param visibility - status to change the panel controls to
     */
    toggleControls(panelId, visibility): void {
        const components = this.layout.root.getItemsByFilter((item) => {
            return item.isComponent;
        });

        for (
            let componentIdx = 0, componentLen = components.length;
            componentIdx < componentLen;
            componentIdx++
        ) {
            if (
                components[componentIdx].config &&
                components[componentIdx].config.componentState &&
                components[componentIdx].config.componentState.hasOwnProperty(
                    'panelId'
                ) &&
                components[componentIdx].config.componentState.panelId ===
                    panelId
            ) {
                if (components[componentIdx].tab) {
                    components[
                        componentIdx
                    ].tab.header.controlsContainer[0].style.visibility = visibility;
                }
            }
        }
    }

    updatePanelHighlight(payload): void {
        const components = this.layout.root.getItemsByFilter((item) => {
            return item.isComponent;
        });

        for (
            let componentIdx = 0, componentLen = components.length;
            componentIdx < componentLen;
            componentIdx++
        ) {
            let bgColor = '';
            if (
                !this.disabled &&
                components[componentIdx].config &&
                components[componentIdx].config.componentState &&
                components[componentIdx].config.componentState.hasOwnProperty(
                    'panelId'
                ) &&
                components[componentIdx].config.componentState.panelId ===
                    payload.panelId
            ) {
                bgColor = payload.highlight ? 'yellow' : '';
            }

            if (components[componentIdx].tab) {
                components[componentIdx].tab.element[0].style.backgroundColor =
                    bgColor;
            }
        }
    }

    /**Panel */

    /**
     * @name getPanels
     * @returns all of the available panels
     */
    getPanels(): any {
        const components = this.layout.root.getItemsByFilter((item) => {
            return item.isComponent;
        });

        const panels: string[] = [];
        for (
            let componentIdx = 0, componentLen = components.length;
            componentIdx < componentLen;
            componentIdx++
        ) {
            if (
                components[componentIdx].config &&
                components[componentIdx].config.componentState &&
                components[componentIdx].config.componentState.hasOwnProperty(
                    'panelId'
                )
            ) {
                panels.push(
                    components[componentIdx].config.componentState.panelId
                );
            }
        }

        return panels;
    }

    /**
     * @name addPanel
     * @param panelId - panelId to add
     * @param label - label to add
     * @param config - config of the panel to add
     * @desc adds the panel to the layout
     */
    addPanel(panelId: string, label: string, config: any): void {
        const component = this.getComponent(panelId);

        // has it already been added?
        if (component !== undefined) {
            // update it
            this.updatePanelLabel(panelId, label);
            this.updatePanelConfig(panelId, config);

            return;
        }

        // add a new child if it is a strack or row
        if (this.layout.root.contentItems.length === 0) {
            this.layout.root.addChild({
                type: 'row',
                content: [],
            });
        }

        // check if there is a maimized item, if there is minimize it
        if (this.layout._maximisedItem) {
            this.layout._maximisedItem.toggleMaximise();
        }

        // if the root is not a row, convert it
        if (!this.layout.root.contentItems[0].isRow) {
            const child = this.layout.root.contentItems[0];

            // remove it
            this.layout.root.removeChild(child, true);

            // add a row
            this.layout.root.addChild({
                type: 'row',
                content: [],
            });

            // add it back
            this.layout.root.contentItems[0].addChild(child);
        }

        // add the new panel
        this.layout.root.contentItems[0].addChild({
            type: 'component', // this is required by golden layout
            title: label || '',
            componentName: 'panel', // this is required by golden layout
            componentState: {
                panelId: panelId,
                backgroundColor: config.backgroundColor,
                opacity: config.opacity,
            },
        });
    }

    /**
     * @name removePanel
     * @param panelId - which component
     * @desc closes the panel
     */
    removePanel(panelId: string): void {
        const component = this.getComponent(panelId);

        if (component) {
            component.close();
        }
    }

    /**
     * @name updatePanelLabel
     * @param panelId - panelId to update
     * @param label - new label of the panel
     * @desc update the panel name
     */
    updatePanelLabel(panelId: string, label: string): void {
        const component = this.getComponent(panelId);

        if (component) {
            component.setTitle(label);
        }
    }

    /**
     * @name updatePanelConfig
     * @param panelId - panelId to update
     * @desc update the panel config
     */
    updatePanelConfig(panelId: string, config: any): void {
        const component = this.getComponent(panelId);

        if (component) {
            component.container.extendState(config);

            this.updateComponent(component);
        }
    }
}
