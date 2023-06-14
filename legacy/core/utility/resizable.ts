import { extractUnit, convertUnit, getScale } from './style';
import { isMouseEvent, isTouchEvent } from './event';

type ResizableDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

interface ResizableCallbackOptions {
    event: MouseEvent | TouchEvent;
    direction: ResizableDirection;
}

export interface ResizableConfig {
    container?: HTMLElement | string;
    handles?: {
        [key in ResizableDirection]?: HTMLElement | string;
    };
    unit?: string;
    start?: (options: ResizableCallbackOptions) => void;
    on?: (options: ResizableCallbackOptions) => void;
    stop?: (options: ResizableCallbackOptions) => void;
    constrain?:
        | {
              minimumHeight?: number | string;
              maximumHeight?: number | string;
              minimumWidth?: number | string;
              maximumWidth?: number | string;
              top?: number | string;
              right?: number | string;
              bottom?: number | string;
              left?: number | string;
          }
        | false;
    snap?: number | string | false;
    boundary?: {
        start?: number;
        end?: number;
    };
}

export class Resizable {
    private ele: HTMLElement;
    private containerEle: HTMLElement;
    private handlesEle: {
        [key in ResizableDirection]?: HTMLElement;
    } = {};
    private events: {
        startResize: {
            [key in ResizableDirection]: (
                event: MouseEvent | TouchEvent
            ) => void;
        };
        onResize: (event: MouseEvent | TouchEvent) => void;
        stopResize: (event: MouseEvent | TouchEvent) => void;
    };
    private disabled = false;
    private unit = '%';
    private callback = {
        start: (options: ResizableCallbackOptions) => {},
        on: (options: ResizableCallbackOptions) => {},
        stop: (options: ResizableCallbackOptions) => {},
    };
    private constrain:
        | {
              minimumHeight: number | string;
              maximumHeight: number | string;
              minimumWidth: number | string;
              maximumWidth: number | string;
              top: number | string;
              right: number | string;
              bottom: number | string;
              left: number | string;
          }
        | false = false;
    private snap: number | string | false = false;
    private boundary: {
        start: number;
        end: number;
    } = {
        start: 0,
        end: 8,
    };
    private active = false;
    private direction: ResizableDirection = 'N';

    // this stores of all of the 'px' values
    private px = {
        start: {
            y: 0,
            x: 0,
            top: 0,
            left: 0,
            height: 0,
            width: 0,
            scale: 1,
        },
        constrain: {
            minimumHeight: 0,
            maximumHeight: Infinity,
            minimumWidth: 0,
            maximumWidth: Infinity,
            top: -Infinity,
            right: Infinity,
            bottom: Infinity,
            left: -Infinity,
        },
        snap: {
            y: 1,
            x: 1,
        },
    };

    private animation: ReturnType<typeof window.requestAnimationFrame> | null =
        null;

    /**
     * Set up the Resizable class, which will allow an element to be resized
     *
     * @param ele - initial element (or string) to bind to
     * @param config - initial configuration object
     */
    constructor(ele: HTMLElement | string, config?: ResizableConfig) {
        // register the ele
        if (typeof ele === 'string') {
            this.ele = document.querySelector(ele) as HTMLElement;
        } else {
            this.ele = ele;
        }

        // for now set the container
        this.containerEle = this.ele.parentElement as HTMLElement;

        // bind the events
        this.events = {
            startResize: {
                N: this.startResize.bind(this, 'N'),
                NE: this.startResize.bind(this, 'NE'),
                E: this.startResize.bind(this, 'E'),
                SE: this.startResize.bind(this, 'SE'),
                S: this.startResize.bind(this, 'S'),
                SW: this.startResize.bind(this, 'SW'),
                W: this.startResize.bind(this, 'W'),
                NW: this.startResize.bind(this, 'NW'),
            },
            onResize: this.onResize.bind(this),
            stopResize: this.stopResize.bind(this),
        };

        // set all of the options
        this.update(config);
    }

    /**
     * Update the configuration of Movable
     *
     * @param config - updated configuration object
     */
    update(config?: ResizableConfig): void {
        // remove the events
        this.removeEvents();

        if (typeof config !== 'undefined') {
            // update the container
            if (typeof config.container !== 'undefined') {
                if (typeof config.container === 'string') {
                    this.containerEle = document.querySelector(
                        config.container
                    ) as HTMLElement;
                } else {
                    this.containerEle = config.container;
                }
            }

            // attach listeners to the handles
            if (typeof config.handles !== 'undefined') {
                // clear it out
                this.handlesEle = {};

                // add the handles
                for (const direction in config.handles) {
                    const handle = config.handles[direction];

                    let handleEle: HTMLElement;
                    if (typeof handle === 'string') {
                        handleEle = document.querySelector(
                            handle
                        ) as HTMLElement;
                    } else {
                        handleEle = handle;
                    }

                    // store it
                    if (handleEle) {
                        this.handlesEle[direction] = handleEle;
                    }
                }
            }

            if (typeof config.unit !== 'undefined') {
                this.unit = config.unit;
            }

            if (typeof config.start !== 'undefined') {
                this.callback.start = config.start;
            }

            if (typeof config.on !== 'undefined') {
                this.callback.on = config.on;
            }

            if (typeof config.stop !== 'undefined') {
                this.callback.stop = config.stop;
            }

            if (typeof config.constrain !== 'undefined') {
                if (config.constrain === false) {
                    this.constrain = false;
                } else if (typeof config.constrain === 'object') {
                    this.constrain = {
                        minimumHeight: 0,
                        maximumHeight: Infinity,
                        minimumWidth: 0,
                        maximumWidth: Infinity,
                        top: -Infinity,
                        right: Infinity,
                        bottom: Infinity,
                        left: -Infinity,
                    };

                    if (typeof config.constrain.minimumHeight !== 'undefined') {
                        this.constrain.minimumHeight =
                            config.constrain.minimumHeight;
                    }
                    if (typeof config.constrain.maximumHeight !== 'undefined') {
                        this.constrain.maximumHeight =
                            config.constrain.maximumHeight;
                    }
                    if (typeof config.constrain.minimumWidth !== 'undefined') {
                        this.constrain.minimumWidth =
                            config.constrain.minimumWidth;
                    }
                    if (typeof config.constrain.maximumWidth !== 'undefined') {
                        this.constrain.maximumWidth =
                            config.constrain.maximumWidth;
                    }
                    if (typeof config.constrain.top !== 'undefined') {
                        this.constrain.top = config.constrain.top;
                    }
                    if (typeof config.constrain.right !== 'undefined') {
                        this.constrain.right = config.constrain.right;
                    }
                    if (typeof config.constrain.bottom !== 'undefined') {
                        this.constrain.bottom = config.constrain.bottom;
                    }
                    if (typeof config.constrain.left !== 'undefined') {
                        this.constrain.left = config.constrain.left;
                    }
                }
            }

            if (typeof config.snap !== 'undefined') {
                this.snap = config.snap;
            }

            if (typeof config.boundary !== 'undefined') {
                if (typeof config.boundary.start !== 'undefined') {
                    this.boundary.start = config.boundary.start;
                }

                if (typeof config.boundary.end !== 'undefined') {
                    this.boundary.end = config.boundary.end;
                }
            }
        }

        // add the events
        this.addEvents();
    }

    /**
     * Enable the resizing
     */
    enable(): void {
        this.disabled = false;
    }

    /**
     * Disable the resizing
     */
    disable(): void {
        this.disabled = true;
    }

    /**
     * Destroy the instance of this class
     */
    destroy(): void {
        // remove the events
        this.removeEvents();
    }

    /** Events */
    /**
     * Add Events to the element
     */
    private addEvents(): void {
        for (const direction in this.handlesEle) {
            const handleEle = this.handlesEle[direction];

            // remove the listeners
            handleEle.addEventListener(
                'mousedown',
                this.events.startResize[direction]
            );
            handleEle.addEventListener(
                'touchstart',
                this.events.startResize[direction]
            );
        }
    }

    /**
     * Remove Events from the element
     */
    private removeEvents(): void {
        for (const direction in this.handlesEle) {
            const handleEle = this.handlesEle[direction];

            // remove the listeners
            handleEle.removeEventListener(
                'mousedown',
                this.events.startResize[direction]
            );
            handleEle.removeEventListener(
                'touchstart',
                this.events.startResize[direction]
            );
        }
    }

    /**
     * Called on the start of resize
     *
     * @param direction - direction that we are resizing in
     * @param event - MouseEvent or TouchEvent
     */
    private startResize(
        direction: ResizableDirection,
        event: MouseEvent | TouchEvent
    ): void {
        // cancel any animation
        if (this.animation) {
            window.cancelAnimationFrame(this.animation);
            this.animation = null;
        }

        if (this.disabled || this.active) {
            return;
        }

        // set the direction
        this.direction = direction;

        let clientY = 0,
            clientX = 0;

        event.stopPropagation();
        event.preventDefault();

        // based on the event type
        if (isTouchEvent(event)) {
            clientY = event.touches[0].clientY;
            clientX = event.touches[0].clientX;
        } else if (isMouseEvent(event)) {
            clientY = event.clientY;
            clientX = event.clientX;
        }

        // store the start values
        this.px.start = {
            y: clientY,
            x: clientX,
            top: this.ele.offsetTop,
            left: this.ele.offsetLeft,
            height: this.ele.offsetHeight,
            width: this.ele.offsetWidth,
            scale: getScale(this.ele),
        };

        // convert and calculate constrain to px
        if (this.constrain) {
            if (typeof this.constrain === 'object') {
                let extracted: [number, string];

                extracted = extractUnit(this.constrain.minimumHeight);
                this.px.constrain.minimumHeight = convertUnit(
                    extracted[0],
                    extracted[1] || this.unit,
                    'px',
                    'height',
                    this.containerEle
                );

                extracted = extractUnit(this.constrain.maximumHeight);
                this.px.constrain.maximumHeight = convertUnit(
                    extracted[0],
                    extracted[1] || this.unit,
                    'px',
                    'height',
                    this.containerEle
                );

                extracted = extractUnit(this.constrain.minimumWidth);
                this.px.constrain.minimumWidth = convertUnit(
                    extracted[0],
                    extracted[1] || this.unit,
                    'px',
                    'width',
                    this.containerEle
                );

                extracted = extractUnit(this.constrain.maximumWidth);
                this.px.constrain.maximumWidth = convertUnit(
                    extracted[0],
                    extracted[1] || this.unit,
                    'px',
                    'width',
                    this.containerEle
                );

                extracted = extractUnit(this.constrain.top);
                this.px.constrain.top = convertUnit(
                    extracted[0],
                    extracted[1] || this.unit,
                    'px',
                    'height',
                    this.containerEle
                );

                extracted = extractUnit(this.constrain.right);
                this.px.constrain.right = convertUnit(
                    extracted[0],
                    extracted[1] || this.unit,
                    'px',
                    'width',
                    this.containerEle
                );

                extracted = extractUnit(this.constrain.bottom);
                this.px.constrain.bottom = convertUnit(
                    extracted[0],
                    extracted[1] || this.unit,
                    'px',
                    'height',
                    this.containerEle
                );

                extracted = extractUnit(this.constrain.left);
                this.px.constrain.left = convertUnit(
                    extracted[0],
                    extracted[1] || this.unit,
                    'px',
                    'width',
                    this.containerEle
                );
            }
        }

        // convert and calculate the snap
        if (this.snap) {
            let extracted: [number, string];

            extracted = extractUnit(this.snap);
            this.px.snap.y = convertUnit(
                extracted[0],
                extracted[1] || this.unit,
                'px',
                'height',
                this.containerEle
            );

            extracted = extractUnit(this.snap);
            this.px.snap.x = convertUnit(
                extracted[0],
                extracted[1] || this.unit,
                'px',
                'width',
                this.containerEle
            );
        }

        this.callback.start({
            event: event,
            direction: this.direction,
        });

        // mark as active
        this.active = true;

        document.addEventListener('mousemove', this.events.onResize);
        document.addEventListener('mouseup', this.events.stopResize);
        document.addEventListener('touchmove', this.events.onResize);
        document.addEventListener('touchend', this.events.stopResize);
    }

    /**
     * Called during resize
     *
     * @param event - MouseEvent or TouchEvent
     */
    private onResize(event: MouseEvent | TouchEvent) {
        if (this.disabled) {
            return;
        }
        let clientY = 0,
            clientX = 0;

        // based on the event type
        if (isTouchEvent(event)) {
            clientY = event.touches[0].clientY;
            clientX = event.touches[0].clientX;
        } else if (isMouseEvent(event)) {
            clientY = event.clientY;
            clientX = event.clientX;
        }

        if (!this.animation) {
            // only move in the animation, so things are smoother
            this.animation = window.requestAnimationFrame(() => {
                let calculatedTop: number,
                    calculatedLeft: number,
                    calculatedHeight: number,
                    calculatedWidth: number;

                // calculate the base values in px
                calculatedTop = this.px.start.top;
                calculatedLeft = this.px.start.left;
                calculatedHeight = this.px.start.height;
                calculatedWidth = this.px.start.width;

                if (
                    this.direction === 'N' ||
                    this.direction === 'NE' ||
                    this.direction === 'NW'
                ) {
                    calculatedTop =
                        this.px.start.top +
                        ((clientY - this.px.start.y) * 1) / this.px.start.scale;

                    if (this.snap && this.px.snap.y) {
                        calculatedTop =
                            Math.round(calculatedTop / this.px.snap.y) *
                            this.px.snap.y;
                    }

                    if (this.constrain) {
                        if (
                            calculatedTop >
                            this.px.start.height +
                                this.px.start.top -
                                this.px.constrain.minimumHeight
                        ) {
                            calculatedTop =
                                this.px.start.height +
                                this.px.start.top -
                                this.px.constrain.minimumHeight;
                        }

                        if (
                            calculatedTop <
                            this.px.start.height +
                                this.px.start.top -
                                this.px.constrain.maximumHeight
                        ) {
                            calculatedTop =
                                this.px.start.height +
                                this.px.start.top -
                                this.px.constrain.maximumHeight;
                        }

                        if (calculatedTop < this.px.constrain.top) {
                            calculatedTop = this.px.constrain.top;
                        }
                    }

                    calculatedHeight =
                        this.px.start.height -
                        (calculatedTop - this.px.start.top);
                }

                if (
                    this.direction === 'E' ||
                    this.direction === 'NE' ||
                    this.direction === 'SE'
                ) {
                    calculatedWidth =
                        this.px.start.width +
                        ((clientX - this.px.start.x) * 1) / this.px.start.scale;

                    if (this.snap && this.px.snap.x) {
                        calculatedWidth =
                            Math.round(calculatedWidth / this.px.snap.x) *
                            this.px.snap.x;
                    }

                    if (this.constrain) {
                        if (calculatedWidth < this.px.constrain.minimumWidth) {
                            calculatedWidth = this.px.constrain.minimumWidth;
                        }

                        if (calculatedWidth > this.px.constrain.maximumWidth) {
                            calculatedWidth = this.px.constrain.maximumWidth;
                        }

                        if (
                            this.px.constrain.right <
                            this.px.start.left + calculatedWidth
                        ) {
                            calculatedWidth =
                                this.px.constrain.right - this.px.start.left;
                        }
                    }
                }

                if (
                    this.direction === 'S' ||
                    this.direction === 'SE' ||
                    this.direction === 'SW'
                ) {
                    calculatedHeight =
                        this.px.start.height +
                        ((clientY - this.px.start.y) * 1) / this.px.start.scale;

                    if (this.snap && this.px.snap.y) {
                        calculatedHeight =
                            Math.round(calculatedHeight / this.px.snap.y) *
                            this.px.snap.y;
                    }

                    if (this.constrain) {
                        if (
                            calculatedHeight < this.px.constrain.minimumHeight
                        ) {
                            calculatedHeight = this.px.constrain.minimumHeight;
                        }

                        if (
                            calculatedHeight > this.px.constrain.maximumHeight
                        ) {
                            calculatedHeight = this.px.constrain.maximumHeight;
                        }

                        if (
                            this.px.constrain.bottom <
                            this.px.start.top + calculatedHeight
                        ) {
                            calculatedHeight =
                                this.px.constrain.bottom - this.px.start.top;
                        }
                    }
                }

                if (
                    this.direction === 'W' ||
                    this.direction === 'NW' ||
                    this.direction === 'SW'
                ) {
                    calculatedLeft =
                        this.px.start.left +
                        ((clientX - this.px.start.x) * 1) / this.px.start.scale;

                    if (this.snap && this.px.snap.x) {
                        calculatedLeft =
                            Math.round(calculatedLeft / this.px.snap.x) *
                            this.px.snap.x;
                    }

                    if (this.constrain) {
                        if (
                            calculatedLeft >
                            this.px.start.width +
                                this.px.start.left -
                                this.px.constrain.minimumWidth
                        ) {
                            calculatedLeft =
                                this.px.start.width +
                                this.px.start.left -
                                this.px.constrain.minimumWidth;
                        }

                        if (
                            calculatedLeft <
                            this.px.start.width +
                                this.px.start.left -
                                this.px.constrain.maximumWidth
                        ) {
                            calculatedLeft =
                                this.px.start.width +
                                this.px.start.left -
                                this.px.constrain.maximumWidth;
                        }

                        if (calculatedLeft < this.px.constrain.left) {
                            calculatedLeft = this.px.constrain.left;
                        }
                    }

                    calculatedWidth =
                        this.px.start.width -
                        (calculatedLeft - this.px.start.left);
                }

                // update the element
                this.ele.style.top =
                    convertUnit(
                        calculatedTop,
                        'px',
                        this.unit,
                        'height',
                        this.containerEle
                    ) + this.unit;
                this.ele.style.left =
                    convertUnit(
                        calculatedLeft,
                        'px',
                        this.unit,
                        'width',
                        this.containerEle
                    ) + this.unit;
                this.ele.style.height =
                    convertUnit(
                        calculatedHeight,
                        'px',
                        this.unit,
                        'height',
                        this.containerEle
                    ) + this.unit;
                this.ele.style.width =
                    convertUnit(
                        calculatedWidth,
                        'px',
                        this.unit,
                        'width',
                        this.containerEle
                    ) + this.unit;

                this.callback.on({
                    event: event,
                    direction: this.direction,
                });

                // clear it out
                this.animation = null;
            });
        }
    }

    /**
     * Called at the end of resize
     *
     * @param event - MouseEvent or TouchEvent
     */
    private stopResize(event: MouseEvent | TouchEvent): void {
        // cancel any animation
        if (this.animation) {
            window.cancelAnimationFrame(this.animation);
            this.animation = null;
        }

        document.removeEventListener('mousemove', this.events.onResize);
        document.removeEventListener('mouseup', this.events.stopResize);
        document.removeEventListener('touchmove', this.events.onResize);
        document.removeEventListener('touchend', this.events.stopResize);

        if (this.active) {
            this.callback.stop({
                event: event,
                direction: this.direction,
            });
        }

        this.active = false;
    }
}

export default Resizable;
