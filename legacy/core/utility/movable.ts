import { extractUnit, convertUnit, getScale } from './style';
import { isMouseEvent, isTouchEvent } from './event';

type MovableDirection = 'auto' | 'horizontal' | 'vertical';

interface ResizableCallbackOptions {
    event: MouseEvent | TouchEvent;
}

export interface MovableConfig {
    handle?: HTMLElement | string;
    container?: HTMLElement | string;
    unit?: string;
    start?: (options: ResizableCallbackOptions) => void;
    on?: (options: ResizableCallbackOptions) => void;
    stop?: (options: ResizableCallbackOptions) => void;
    available?: MovableDirection;
    constrain?:
        | {
              top?: number | string;
              right?: number | string;
              bottom?: number | string;
              left?: number | string;
          }
        | HTMLElement
        | string
        | false;
    snap?: number | string | false;
}

export class Movable {
    private ele: HTMLElement;
    private handleEle: HTMLElement;
    private containerEle: HTMLElement;
    private events: {
        startMove: (event: MouseEvent | TouchEvent) => void;
        onMove: (event: MouseEvent | TouchEvent) => void;
        stopMove: (event: MouseEvent | TouchEvent) => void;
    };
    private disabled = false;
    private unit = '%';
    private callback = {
        start: (options: ResizableCallbackOptions) => {},
        on: (options: ResizableCallbackOptions) => {},
        stop: (options: ResizableCallbackOptions) => {},
    };
    private available: MovableDirection = 'auto';
    private constrain:
        | {
              top: number | string;
              right: number | string;
              bottom: number | string;
              left: number | string;
          }
        | HTMLElement
        | string
        | false = false;
    private snap: number | string | false = false;
    private active = false;

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
     * Set up the Movable class, which will allow an element to be dragged and repositioned
     *
     * @param ele - initial element (or string) to bind to
     * @param config - initial configuration object
     */
    constructor(ele: HTMLElement | string, config?: MovableConfig) {
        // register the ele
        if (typeof ele === 'string') {
            this.ele = document.querySelector(ele) as HTMLElement;
        } else {
            this.ele = ele;
        }

        // for now set the handle
        this.handleEle = this.ele;

        // for now set the container
        this.containerEle = this.ele.parentElement as HTMLElement;

        // bind the events
        this.events = {
            startMove: this.startMove.bind(this),
            onMove: this.onMove.bind(this),
            stopMove: this.stopMove.bind(this),
        };

        // set all of the options
        this.update(config);
    }

    /**
     * Update the configuration of Movable
     *
     * @param config - updated configuration object
     */
    update(config?: MovableConfig): void {
        // remove the events
        this.removeEvents();

        if (typeof config !== 'undefined') {
            if (typeof config.handle !== 'undefined') {
                if (typeof config.handle === 'string') {
                    this.handleEle = this.ele.querySelector(
                        config.handle
                    ) as HTMLElement;
                } else {
                    this.handleEle = config.handle;
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

            if (typeof config.available !== 'undefined') {
                this.available = config.available;
            }

            if (typeof config.constrain !== 'undefined') {
                if (config.constrain === false) {
                    this.constrain = false;
                } else if (typeof config.constrain === 'string') {
                    this.constrain = document.querySelector(
                        config.constrain
                    ) as HTMLElement;
                } else if (config.constrain instanceof Element) {
                    this.constrain = config.constrain;
                } else if (typeof config.constrain === 'object') {
                    this.constrain = {
                        top: -Infinity,
                        right: Infinity,
                        bottom: Infinity,
                        left: -Infinity,
                    };

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
        }

        // add the events
        this.addEvents();
    }

    /**
     * Enable the drag/repositioning
     */
    enable(): void {
        this.disabled = false;
    }

    /**
     * Disable the drag/repositioning
     */
    disable(): void {
        this.disabled = true;
    }

    /**
     * Destroy the instance of this class
     */
    destroy(): void {
        this.removeEvents();
    }

    /** Events */
    /**
     * Add Events to the element
     */
    private addEvents(): void {
        this.handleEle.addEventListener('mousedown', this.events.startMove);
        this.handleEle.addEventListener('touchstart', this.events.startMove);
    }

    /**
     * Remove Events from the element
     */
    private removeEvents(): void {
        this.handleEle.removeEventListener('mousedown', this.events.startMove);
        this.handleEle.removeEventListener('touchstart', this.events.startMove);
    }

    /**
     * Called on the start of moving
     *
     * @param event - MouseEvent or TouchEvent
     */
    private startMove(event: MouseEvent | TouchEvent): void {
        // cancel any animation
        if (this.animation) {
            window.cancelAnimationFrame(this.animation);
            this.animation = null;
        }

        if (this.disabled || this.active) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();

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

        // convert constrain to px
        if (this.constrain) {
            if (this.constrain instanceof Element) {
                this.px.constrain.top = 0;
                this.px.constrain.right = this.containerEle.offsetWidth;
                this.px.constrain.bottom = this.containerEle.offsetHeight;
                this.px.constrain.left = 0;
            } else if (typeof this.constrain === 'object') {
                let extracted: [number, string];

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
        });

        // mark as active
        this.active = true;

        document.addEventListener('mousemove', this.events.onMove);
        document.addEventListener('mouseup', this.events.stopMove);
        document.addEventListener('touchmove', this.events.onMove);
        document.addEventListener('touchend', this.events.stopMove);
    }

    /**
     * Called during move
     *
     * @param event - MouseEvent or TouchEvent
     */
    private onMove(event: MouseEvent | TouchEvent): void {
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
            // only move in the animation, so things re smoother
            this.animation = window.requestAnimationFrame(() => {
                let calculatedTop: number,
                    calculatedRight: number,
                    calculatedBottom: number,
                    calculatedLeft: number;

                // calculated values in px
                calculatedTop =
                    ((clientY - this.px.start.y) * 1) / this.px.start.scale +
                    this.px.start.top;
                calculatedLeft =
                    ((clientX - this.px.start.x) * 1) / this.px.start.scale +
                    this.px.start.left;

                // need to snap it to the grid
                if (this.snap && this.px.snap.y) {
                    calculatedTop =
                        Math.round(calculatedTop / this.px.snap.y) *
                        this.px.snap.y;
                }

                if (this.snap && this.px.snap.x) {
                    calculatedLeft =
                        Math.round(calculatedLeft / this.px.snap.x) *
                        this.px.snap.x;
                }

                // calculate the remaining values
                calculatedBottom = calculatedTop + this.px.start.height;
                calculatedRight = calculatedLeft + this.px.start.width;

                // check the constrain
                if (this.constrain) {
                    if (this.px.constrain.bottom < calculatedBottom) {
                        calculatedTop =
                            this.px.constrain.bottom - this.px.start.height;
                    }

                    if (this.px.constrain.right < calculatedRight) {
                        calculatedLeft =
                            this.px.constrain.right - this.px.start.width;
                    }

                    if (calculatedTop < this.px.constrain.top) {
                        calculatedTop = this.px.constrain.top;
                    }

                    if (calculatedLeft < this.px.constrain.left) {
                        calculatedLeft = this.px.constrain.left;
                    }
                }

                // save the rendered + update the style
                if (
                    this.available === 'auto' ||
                    this.available === 'vertical'
                ) {
                    this.ele.style.top =
                        convertUnit(
                            calculatedTop,
                            'px',
                            this.unit,
                            'height',
                            this.containerEle
                        ) + this.unit;
                }

                if (
                    this.available === 'auto' ||
                    this.available === 'horizontal'
                ) {
                    this.ele.style.left =
                        convertUnit(
                            calculatedLeft,
                            'px',
                            this.unit,
                            'width',
                            this.containerEle
                        ) + this.unit;
                }

                this.callback.on({
                    event: event,
                });

                // clear it out
                this.animation = null;
            });
        }
    }

    /**
     * Called at the end of move
     *
     * @param event - MouseEvent or TouchEvent
     */
    private stopMove(event: MouseEvent | TouchEvent): void {
        // cancel any animation
        if (this.animation) {
            window.cancelAnimationFrame(this.animation);
            this.animation = null;
        }

        document.removeEventListener('mousemove', this.events.onMove);
        document.removeEventListener('mouseup', this.events.stopMove);
        document.removeEventListener('touchmove', this.events.onMove);
        document.removeEventListener('touchend', this.events.stopMove);

        if (this.active) {
            this.callback.stop({
                event: event,
            });
        }

        this.active = false;
    }
}

export default Movable;
