interface GuidelinePos {
    top: number;
    right: number;
    bottom: number;
    left: number;
    height: number;
    width: number;
    horizontal: number;
    vertical: number;
}

export interface GuidelineConfig {
    container?: HTMLElement | string;
    active?: HTMLElement | string;
    threshold?: number;
    line?: {
        class?: string;
        color?: string;
        size?: number;
        overflow?: number;
    };
}

export interface GuidelineRenderOptions {
    items?: HTMLElement[] | string[];
    lock?: ('N' | 'E' | 'W' | 'S')[];
}

export type GuidelineDirectionsHorizontal = 'top' | 'horizontal' | 'bottom';
export type GuidelineDirectionsVertical = 'left' | 'vertical' | 'right';

export type GuidelineLine = {
    offset: number;
    min: number;
    max: number;
};

const DIRECTIONS: {
    HORIZONTAL: GuidelineDirectionsHorizontal[];
    VERTICAL: GuidelineDirectionsVertical[];
} = {
    HORIZONTAL: ['top', 'horizontal', 'bottom'],
    VERTICAL: ['left', 'vertical', 'right'],
};

export class Guideline {
    private activeEle: HTMLElement = document.createElement('div');
    private containerEle: HTMLElement = document.body;
    private wrapperEle: HTMLElement = document.createElement('div');
    private threshold = 10;
    private line: {
        class: string;
        color: string;
        size: number;
        overflow: number;
    } = {
        class: '',
        color: 'red',
        size: 1,
        overflow: 10,
    };
    private renderOptions: {
        itemEles: HTMLElement[];
        lock: ('N' | 'E' | 'W' | 'S')[];
    } = {
        itemEles: [],
        lock: [],
    };

    /**
     * Set up the Guideline class, which will draw lines when an element is moved/resized
     *
     * @param config - initial configuration object
     */
    constructor(config?: GuidelineConfig) {
        // create the wrapper
        this.wrapperEle = document.createElement('div');
        this.wrapperEle.style.position = 'absolute';
        this.wrapperEle.style.top = '0';
        this.wrapperEle.style.right = '0';
        this.wrapperEle.style.bottom = '0';
        this.wrapperEle.style.left = '0';
        this.wrapperEle.style.height = '100%';
        this.wrapperEle.style.width = '100%';

        this.update(config);
    }

    /**
     * Update the alignment config
     */
    update = (config?: GuidelineConfig): void => {
        // set all of the options
        if (typeof config !== 'undefined') {
            if (typeof config.active !== 'undefined') {
                if (typeof config.active === 'string') {
                    this.activeEle = document.querySelector(
                        config.active
                    ) as HTMLElement;
                } else {
                    this.activeEle = config.active;
                }
            }

            if (typeof config.container !== 'undefined') {
                if (typeof config.container === 'string') {
                    this.containerEle = document.querySelector(
                        config.container
                    ) as HTMLElement;
                } else {
                    this.containerEle = config.container;
                }
            }

            if (typeof config.threshold !== 'undefined') {
                this.threshold = config.threshold;
            }

            if (typeof config.line !== 'undefined') {
                if (typeof config.line.class !== 'undefined') {
                    this.line.class = config.line.class;
                }

                if (typeof config.line.color !== 'undefined') {
                    this.line.color = config.line.color;
                }

                if (typeof config.line.size !== 'undefined') {
                    this.line.size = config.line.size;
                }

                if (typeof config.line.overflow !== 'undefined') {
                    this.line.overflow = config.line.overflow;
                }
            }
        }
    };

    /**
     * Destroy the instance of this class
     */
    destroy = (): void => {
        // remove the wrapper
        this.removeWrapper();

        // set as null
        this.wrapperEle = document.createElement('div');
    };

    /** Render */
    /**
     * Start rendering the alignment lines
     *
     * options - options to consider for the guideline
     */
    startRender = (options?: GuidelineRenderOptions): void => {
        // clear it out
        this.renderOptions = {
            lock: [],
            itemEles: [],
        };

        if (typeof options !== 'undefined') {
            if (typeof options.items !== 'undefined') {
                this.renderOptions.itemEles = [];
                for (
                    let itemIdx = 0, itemLen = options.items.length;
                    itemIdx < itemLen;
                    itemIdx++
                ) {
                    const item = options.items[itemIdx];

                    let itemEle: HTMLElement;
                    if (typeof item === 'string') {
                        itemEle = document.querySelector(item) as HTMLElement;
                    } else {
                        itemEle = item;
                    }

                    if (itemEle) {
                        this.renderOptions.itemEles.push(itemEle);
                    }
                }
            }

            if (typeof options.lock !== 'undefined') {
                this.renderOptions.lock = options.lock;
            }
        }
    };

    /**
     * Try to render of the alignment lines
     */
    runRender = (): void => {
        // detach wrapper from the DOM
        this.removeWrapper();

        // clear the old lines
        while (this.wrapperEle.firstChild) {
            this.wrapperEle.removeChild(this.wrapperEle.firstChild);
        }

        // calculate the lines
        this.renderLines('horizontal');
        this.renderLines('vertical');

        // add the wrapper to the DOM
        this.addWrapper();
    };

    /**
     * Remove the lines from the DOM
     */
    stopRender = (): void => {
        // remove the wrapper
        this.removeWrapper();
    };

    /** Wrapper */
    /**
     * Add the wrapper
     */
    private addWrapper = (): void => {
        // remove the lines (if they exist)
        this.removeWrapper();

        // append it
        this.containerEle.appendChild(this.wrapperEle);
    };

    /**
     * Remove the wrapper
     */
    private removeWrapper = (): void => {
        if (this.wrapperEle.parentNode) {
            this.wrapperEle.parentNode.removeChild(this.wrapperEle);
        }
    };

    /** Active */
    /**
     * Determine the active lines and add them to the wrapper
     * @param type - is it a horizontal or vertical line?
     * @param lines - lines to adjust to
     *
     * @returns the lines that are visible
     */
    private adjustActive = (
        type: 'horizontal' | 'vertical',
        lines: GuidelineLine[]
    ) => {
        const start = type === 'horizontal' ? 'top' : 'left',
            mid = type === 'horizontal' ? 'horizontal' : 'vertical',
            end = type === 'horizontal' ? 'bottom' : 'right',
            dim = type === 'horizontal' ? 'height' : 'width',
            lockStart =
                type === 'horizontal'
                    ? this.renderOptions.lock.indexOf('N') > -1
                    : this.renderOptions.lock.indexOf('W') > -1,
            lockEnd =
                type === 'horizontal'
                    ? this.renderOptions.lock.indexOf('S') > -1
                    : this.renderOptions.lock.indexOf('E') > -1;

        // get the active position
        const activePosition: GuidelinePos = this.getPosition(this.activeEle);

        // for the line, adjust the element if it is in range
        for (
            let lineIdx = 0, lineLen = lines.length;
            lineIdx < lineLen;
            lineIdx++
        ) {
            const line = lines[lineIdx];

            if (
                Math.abs(activePosition[start] - line.offset) < this.threshold
            ) {
                if (lockStart && lockEnd) {
                    // noop
                } else if (lockStart) {
                    // noop - can't move this one
                } else if (lockEnd) {
                    this.activeEle.style[start] = `${line.offset}px`;
                    this.activeEle.style[dim] = `${
                        activePosition[dim] +
                        activePosition[start] -
                        line.offset
                    }px`;
                } else {
                    this.activeEle.style[start] = `${line.offset}px`;
                }
            } else if (
                Math.abs(activePosition[mid] - line.offset) < this.threshold
            ) {
                if (lockStart && lockEnd) {
                    // noop
                } else if (lockStart) {
                    // noop
                } else if (lockEnd) {
                    // noop
                } else {
                    this.activeEle.style[start] = `${
                        line.offset - activePosition[dim] / 2
                    }px`;
                }
            } else if (
                Math.abs(activePosition[end] - line.offset) < this.threshold
            ) {
                if (lockStart && lockEnd) {
                    // noop
                } else if (lockStart) {
                    this.activeEle.style[dim] = `${
                        line.offset - activePosition[start]
                    }px`;
                } else if (lockEnd) {
                    // noop - can't move this one
                } else {
                    this.activeEle.style[start] = `${
                        line.offset - activePosition[dim]
                    }px`;
                }
            }
        }
    };

    /** Lines */
    /**
     * Render the closest line elements and add them to the wrapper
     *
     * @param type - is it a horizontal or vertical line?
     *
     * @returns return the closest line element
     */
    private renderLines = (type: 'horizontal' | 'vertical') => {
        // store the lines
        const closest = this.getClosestLines(type);

        // adjust the active to the closest lines
        this.adjustActive(type, closest);

        // get the visible lines
        const visible = this.getVisibleLines(type, closest);

        // build the visible lines
        this.buildLines(type, visible);
    };

    /**
     * Find the closest lines to the active element
     *
     * @param type - is it a horizontal or vertical line?
     *
     * @returns the lines
     */
    private getClosestLines = (
        type: 'horizontal' | 'vertical'
    ): GuidelineLine[] => {
        const directions =
                type === 'horizontal'
                    ? DIRECTIONS.HORIZONTAL
                    : DIRECTIONS.VERTICAL,
            min = type === 'horizontal' ? 'left' : 'top',
            max = type === 'horizontal' ? 'right' : 'bottom';

        // get the active position
        const activePosition: GuidelinePos = this.getPosition(this.activeEle);

        // store the lines
        const lines: {
            [key: string]: GuidelineLine;
        } = {};

        // for each direction, find the closest ones
        for (
            let activeDirectionIdx = 0, activeDirectionLen = directions.length;
            activeDirectionIdx < activeDirectionLen;
            activeDirectionIdx++
        ) {
            const activeDirection = directions[activeDirectionIdx],
                activeOffset = activePosition[activeDirection];

            // track the local difference
            let difference = Infinity;

            // go through the sibilngs
            for (
                let itemIdx = 0, itemLen = this.renderOptions.itemEles.length;
                itemIdx < itemLen;
                itemIdx++
            ) {
                const itemEle = this.renderOptions.itemEles[itemIdx];

                // skip this, we are matching to this
                if (itemEle === this.activeEle) {
                    continue;
                }

                // get the item position
                const itemPosition = this.getPosition(itemEle);

                // check each direction
                for (
                    let itemDirectionIdx = 0,
                        itemDirectionLen = directions.length;
                    itemDirectionIdx < itemDirectionLen;
                    itemDirectionIdx++
                ) {
                    const itemOffset =
                        itemPosition[directions[itemDirectionIdx]];

                    // calculate the difference
                    const itemDifference = Math.abs(activeOffset - itemOffset);

                    // not the closest
                    if (itemDifference > difference) {
                        continue;
                    }

                    // it is less, reset it
                    if (itemDifference < difference) {
                        lines[activeDirection] = {
                            offset: itemOffset,
                            min: Infinity,
                            max: -Infinity,
                        };

                        difference = itemDifference;
                    }

                    // set it
                    lines[activeDirection].min = Math.min.apply(this, [
                        lines[activeDirection].min,
                        itemPosition[min],
                        activePosition[min],
                    ]);
                    lines[activeDirection].max = Math.max.apply(this, [
                        lines[activeDirection].max,
                        itemPosition[max],
                        activePosition[max],
                    ]);
                }
            }
        }

        // flatten to be a list of lines
        const closest: GuidelineLine[] = [];
        for (const direction in lines) {
            if (lines.hasOwnProperty(direction)) {
                closest.push(lines[direction]);
            }
        }

        return closest;
    };

    /**
     * Get the visible lines
     *
     * @param type - is it a horizontal or vertical line?
     * @param lines - lines to adjust to
     *
     * @returns the lines
     */
    private getVisibleLines = (
        type: 'horizontal' | 'vertical',
        lines: GuidelineLine[]
    ): GuidelineLine[] => {
        const start = type === 'horizontal' ? 'top' : 'left',
            mid = type === 'horizontal' ? 'horizontal' : 'vertical',
            end = type === 'horizontal' ? 'bottom' : 'right';

        // get the active position
        const activePosition: GuidelinePos = this.getPosition(this.activeEle);

        const visible: GuidelineLine[] = [];
        for (
            let lineIdx = 0, lineLen = lines.length;
            lineIdx < lineLen;
            lineIdx++
        ) {
            const line = lines[lineIdx];

            if (
                activePosition[start] === line.offset ||
                activePosition[mid] === line.offset ||
                activePosition[end] === line.offset
            ) {
                visible.push(line);
            }
        }

        return visible;
    };

    /**
     * Build the actual line element and append to the wrapper
     *
     * @param type - is it a horizontal or vertical line?
     * @param lines - lines to adjust to
     */
    private buildLines = (
        type: 'horizontal' | 'vertical',
        lines: GuidelineLine[]
    ) => {
        for (
            let lineIdx = 0, lineLen = lines.length;
            lineIdx < lineLen;
            lineIdx++
        ) {
            const line = lines[lineIdx];

            // create the ele
            const lineEle = document.createElement('div');
            lineEle.style.position = 'absolute';

            // use the class if its there
            if (this.line.class) {
                lineEle.classList.add(this.line.class);
            } else if (this.line.color) {
                lineEle.style.color;
            }

            if (type === 'horizontal') {
                lineEle.style.top = `${line.offset}px`;
                lineEle.style.left = `${line.min - this.line.overflow}px`;
                lineEle.style.height = `${this.line.size}px`;
                lineEle.style.width = `${
                    line.max +
                    this.line.overflow -
                    (line.min - this.line.overflow)
                }px`;
                lineEle.style.transform = 'translateY(-50%);';
            } else if (type === 'vertical') {
                lineEle.style.top = `${line.min - this.line.overflow}px`;
                lineEle.style.left = `${line.offset}px`;
                lineEle.style.height = `${
                    line.max +
                    this.line.overflow -
                    (line.min - this.line.overflow)
                }px`;
                lineEle.style.width = `${this.line.size}px`;
                lineEle.style.transform = 'translateX(-50%);';
            }

            // add to wrapper
            this.wrapperEle.appendChild(lineEle);
        }
    };

    /** Utility */
    /**
     * Get the element's position (rounded)
     */
    private getPosition = (ele: HTMLElement): GuidelinePos => {
        return {
            top: Math.round(ele.offsetTop),
            right: Math.round(ele.offsetLeft + ele.offsetWidth),
            bottom: Math.round(ele.offsetTop + ele.offsetHeight),
            left: Math.round(ele.offsetLeft),
            height: ele.offsetHeight,
            width: ele.offsetWidth,
            horizontal: Math.round(ele.offsetTop + ele.offsetHeight / 2),
            vertical: Math.round(ele.offsetLeft + ele.offsetWidth / 2),
        };
    };
}

export default Guideline;
