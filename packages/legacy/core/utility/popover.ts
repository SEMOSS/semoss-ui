export type PopoverType = 'click' | 'hover' | 'focus' | 'manual';
export type PopoverPosition = 'S' | 'N' | 'E' | 'W' | 'NE' | 'SE' | 'SW' | 'NW';
export type PopoverVerticalAlign = 'auto' | 'top' | 'middle' | 'bottom';
export type PopoverHorizontalAlign = 'auto' | 'left' | 'middle' | 'right';

export interface PopoverCoordinates {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface PopoverConfig {
    type?: PopoverType;
    append?: HTMLElement;
    positions?: PopoverPosition[];
    verticalAlign?: PopoverVerticalAlign;
    horizontalAlign?: PopoverHorizontalAlign;
    spacing?: number;
    onShow?: () => void;
    onHide?: () => void;
    onStartPosition?: () => void;
    onEndPosition?: () => void;
}

export class Popover {
    private targetEle: HTMLElement;
    private contentEle: HTMLElement;
    private model = false;
    private disabled = false;
    private callback = {
        onShow: () => {},
        onHide: () => {},
        onStartPosition: () => {},
        onEndPosition: () => {},
    };
    private type: PopoverType = 'click';
    private appendEle: HTMLElement = document.body;
    private positions: PopoverPosition[] = [
        'N',
        'S',
        'E',
        'W',
        'NE',
        'SE',
        'SW',
        'NW',
    ];
    private verticalAlign: PopoverVerticalAlign = 'auto';
    private horizontalAlign: PopoverHorizontalAlign = 'auto';
    private spacing = 0;

    /**
     * Set up the Popover class, which will allow an element to be 'popped over' other elements
     *
     * @param target - initial target element (or string) to bind to
     * @param content - initial content element (or string) to bind to
     * @param config - initial configuration object
     */
    constructor(
        target: HTMLElement | string,
        content: HTMLElement | string,
        config?: PopoverConfig
    ) {
        // register the ele
        if (typeof target === 'string') {
            this.targetEle = document.querySelector(target) as HTMLElement;
        } else {
            this.targetEle = target;
        }

        if (typeof content === 'string') {
            this.contentEle = document.querySelector(content) as HTMLElement;
        } else {
            this.contentEle = content;
        }

        // update the config
        if (typeof config !== 'undefined') {
            this.update(config);
        }

        // initially the content should be removed
        this.removeContent();
    }

    /**
     * Update the configuration of the popover
     *
     * @param config - updated config
     */
    update = (config: PopoverConfig) => {
        // hide if open
        if (this.model) {
            this.hide();
        }

        // remove the listeners
        this.removeTargetEvents();

        // update the config accordingly
        if (typeof config.append !== 'undefined') {
            this.appendEle = config.append;
        }

        if (typeof config.type !== 'undefined') {
            this.type = config.type;
        }

        if (typeof config.positions !== 'undefined') {
            this.positions = config.positions;
        }

        if (typeof config.verticalAlign !== 'undefined') {
            this.verticalAlign = config.verticalAlign;
        }

        if (typeof config.horizontalAlign !== 'undefined') {
            this.horizontalAlign = config.horizontalAlign;
        }

        if (typeof config.spacing !== 'undefined') {
            this.spacing = config.spacing;
        }

        if (typeof config.onShow !== 'undefined') {
            this.callback.onShow = config.onShow;
        }

        if (typeof config.onHide !== 'undefined') {
            this.callback.onHide = config.onHide;
        }

        if (typeof config.onStartPosition !== 'undefined') {
            this.callback.onStartPosition = config.onStartPosition;
        }

        if (typeof config.onEndPosition !== 'undefined') {
            this.callback.onEndPosition = config.onEndPosition;
        }

        // add the listeners
        this.addTargetEvents();

        // show if open
        if (this.model) {
            this.show();
        }
    };

    /**
     * Toggle the popover open or closed based on the model
     *
     * @param model - is the popover open?
     *
     * @returns a boolean, if the model has succesfully updated
     */
    set = (model: boolean) => {
        if (model !== this.model) {
            // update the view
            if (model) {
                this.show();
            } else {
                this.hide();
            }

            // set the data
            this.model = model;

            // call the appropriate callback
            if (this.model) {
                this.callback.onShow();
            } else {
                this.callback.onHide();
            }
        }
    };

    /**
     * Reposition the popover
     */
    reposition = () => {
        if (this.model) {
            this.positionContent();
        }
    };

    /**
     * Enable the popover
     */
    enable(): void {
        this.disabled = false;
    }

    /**
     * Disable the popover
     */
    disable(): void {
        this.disabled = true;
    }

    /**
     * Destroy the instance of this class
     */
    destroy = () => {
        // hide the content
        this.hide();

        //remove listeners
        this.removeTargetEvents();
    };

    /**
     * Called to show the content
     */
    private show = () => {
        // add the content back
        this.addContent();

        // add the events
        window.addEventListener('resize', this.positionContent);
        document.addEventListener('scroll', this.positionContent, true);

        if (this.type === 'click') {
            this.addDocumentEvents();
        }
    };

    /**
     * Called to hide the content
     */
    private hide = () => {
        // remove the popover
        this.removeContent();

        // remove the events
        window.removeEventListener('resize', this.positionContent);
        document.removeEventListener('scroll', this.positionContent, true);

        if (this.type === 'click') {
            this.removeDocumentEvents();
        }
    };

    /** Content **/
    /**
     * Add the content to the view
     */
    private addContent = () => {
        // we want to hide it, but add it to the dom to get its height and width
        this.contentEle.style.visibility = 'hidden';
        this.contentEle.style.opacity = '0';

        // add the listener
        this.contentEle.addEventListener('keydown', this.onContentKeydown);
        this.contentEle.addEventListener('click', this.onContentClick);

        // append it
        this.appendEle.appendChild(this.contentEle);

        // position it
        this.positionContent();

        // show it
        this.contentEle.style.visibility = 'visible';
        this.contentEle.style.opacity = '1';
    };

    /**
     * Remove the content from the view
     */
    private removeContent = () => {
        // hide it
        this.contentEle.style.visibility = 'hidden';
        this.contentEle.style.opacity = '0';

        // remove the listener
        this.contentEle.removeEventListener('keydown', this.onContentKeydown);
        this.contentEle.removeEventListener('click', this.onContentClick);

        // remove it
        if (this.contentEle.parentNode !== null) {
            this.contentEle.parentNode.removeChild(this.contentEle);
        }
    };

    /**
     * Called when keydown on the content. This will stop propagation of the event, so it isn't mistakenly caught by the target listeners.
     *
     * @param event - event that was called
     */
    private onContentKeydown = (event: KeyboardEvent) => {
        event.stopPropagation();

        if (event.key === 'Escape') {
            event.preventDefault();

            // close the popup
            this.set(false);
        }
    };

    /**
     * Called when click on the content. This will stop propagation of the event, so it isn't mistakenly caught by the target listeners.
     *
     * @param event - event that was called
     */
    private onContentClick = (event: MouseEvent) => {
        event.stopPropagation();
    };

    /**
     * Position the content
     */
    private positionContent = () => {
        // trigger the call back
        this.callback.onStartPosition();

        const targetRect = this.targetEle.getBoundingClientRect(),
            eleRect = this.contentEle.getBoundingClientRect(),
            appendRect = this.appendEle.getBoundingClientRect();

        // store all of the calculations, there is a max of 8
        const storedCoordinates: {
            [count: number]: PopoverCoordinates[];
        } = {
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
            8: [],
        };

        for (
            let positionIdx = 0, positionLen = this.positions.length;
            positionIdx < positionLen;
            positionIdx++
        ) {
            const position = this.positions[positionIdx];

            const coordinates = this.calculatePosition(
                position,
                targetRect,
                eleRect
            );

            let count = 0;
            if (coordinates.top >= appendRect.top) {
                count++;
            }

            if (coordinates.right <= appendRect.left + appendRect.width) {
                count++;
            }

            if (coordinates.bottom <= appendRect.top + appendRect.height) {
                count++;
            }

            if (coordinates.left >= appendRect.left) {
                count++;
            }

            if (coordinates.top >= 0) {
                count++;
            }

            if (coordinates.right <= window.innerWidth) {
                count++;
            }

            if (coordinates.bottom <= window.innerHeight) {
                count++;
            }

            if (coordinates.left >= 0) {
                count++;
            }

            // store it
            storedCoordinates[count].push(coordinates);

            // perfect match! (we do 8 calculations.... so it's 8)
            if (count === 8) {
                break;
            }
        }

        let count = 8,
            coordinates: PopoverCoordinates | null = null;

        while (count > 0) {
            if (storedCoordinates[count].length > 0) {
                coordinates = storedCoordinates[count][0];
                break;
            }

            count--;
        }

        if (coordinates) {
            // set the dimentions
            this.contentEle.style.top = `${coordinates.top - appendRect.top}px`;
            this.contentEle.style.left = `${
                coordinates.left - appendRect.left
            }px`;
        }

        // trigger the call back
        this.callback.onEndPosition();
    };

    /**
     * Calculate coordinates of the content
     *
     * @param position - position to calculate
     * @param targetRect - target rect
     * @param eleRect - content rect
     *
     * @returns possible coordinates for the content
     */
    private calculatePosition = (
        position: string,
        targetRect: ClientRect,
        eleRect: ClientRect
    ): PopoverCoordinates => {
        let topPos = 0,
            leftPos = 0;

        //position top
        if (position === 'NW' || position === 'N' || position === 'NE') {
            topPos += targetRect.top;

            if (this.verticalAlign === 'auto') {
                topPos += -eleRect.height - this.spacing;
            }
        } else if (position === 'E' || position === 'W') {
            topPos += targetRect.top + targetRect.height / 2;

            if (this.verticalAlign === 'auto') {
                topPos += -eleRect.height / 2;
            }
        } else if (position === 'SE' || position === 'S' || position === 'SW') {
            topPos += targetRect.top + targetRect.height;

            if (this.verticalAlign === 'auto') {
                topPos += this.spacing;
            }
        }

        if (this.verticalAlign === 'top') {
            topPos += 0;
        } else if (this.verticalAlign === 'middle') {
            topPos += -eleRect.height / 2;
        } else if (this.verticalAlign === 'bottom') {
            topPos += -eleRect.height;
        }

        //position left
        if (position === 'NW' || position === 'W' || position === 'SW') {
            leftPos += targetRect.left;

            if (this.horizontalAlign === 'auto') {
                if (position === 'W') {
                    leftPos += -eleRect.width - this.spacing;
                } else {
                    leftPos += 0;
                }
            }
        } else if (position === 'N' || position === 'S') {
            leftPos += targetRect.left + targetRect.width / 2;

            if (this.horizontalAlign === 'auto') {
                leftPos += -eleRect.width / 2;
            }
        } else if (position === 'NE' || position === 'E' || position === 'SE') {
            leftPos += targetRect.left + targetRect.width;

            if (this.horizontalAlign === 'auto') {
                if (position === 'E') {
                    leftPos += this.spacing;
                } else {
                    leftPos += -eleRect.width;
                }
            }
        }

        if (this.horizontalAlign === 'left') {
            leftPos += 0;
        } else if (this.horizontalAlign === 'middle') {
            leftPos += -eleRect.width / 2;
        } else if (this.horizontalAlign === 'right') {
            leftPos += -eleRect.width;
        }

        return {
            top: topPos,
            right: leftPos + eleRect.width,
            bottom: topPos + eleRect.height,
            left: leftPos,
        };
    };

    /** Target **/
    /**
     * Update the target element
     *
     * @param targetEle - element to target
     */
    updateTarget = (targetEle: HTMLElement) => {
        // remove it if added
        this.removeTargetEvents();

        this.targetEle = targetEle;

        // add it back
        this.addTargetEvents();

        // if open, resposition
        if (this.model) {
            this.positionContent();
        }
    };

    /**
     * Add events to the target
     */
    private addTargetEvents = () => {
        if (this.type === 'click') {
            this.targetEle.addEventListener('click', this.onTargetClick);
        } else if (this.type === 'hover') {
            this.targetEle.addEventListener('mouseenter', this.onTargetShow);
            this.targetEle.addEventListener('mouseleave', this.onTargetHide);
        } else if (this.type === 'focus') {
            this.targetEle.addEventListener('focus', this.onTargetShow);
            this.targetEle.addEventListener('blur', this.onTargetHide);
        }
    };

    /**
     * Remove events from the target
     */
    private removeTargetEvents = () => {
        if (this.type === 'click') {
            this.targetEle.removeEventListener('click', this.onTargetClick);
        } else if (this.type === 'hover') {
            this.targetEle.removeEventListener('mouseenter', this.onTargetShow);
            this.targetEle.removeEventListener('mouseleave', this.onTargetHide);
        } else if (this.type === 'focus') {
            this.targetEle.removeEventListener('focus', this.onTargetShow);
            this.targetEle.removeEventListener('blur', this.onTargetHide);
        }
    };

    /**
     * Called when target is clicked
     *
     * @param event - event that was called
     */
    private onTargetClick = (event: MouseEvent | TouchEvent) => {
        if (this.disabled) {
            return;
        }

        // ignore if it is on the content (bubbling)
        if (
            event &&
            event.target &&
            this.contentEle.contains(event.target as HTMLElement)
        ) {
            return;
        }

        // set the popup open or closed
        this.set(!this.model);
    };

    /**
     * Called when an event wants to show the popover
     */
    private onTargetShow = () => {
        if (this.disabled) {
            return;
        }

        this.set(true);
    };

    /**
     * Called when an event wants to hide the popover
     */
    private onTargetHide = () => {
        if (this.disabled) {
            return;
        }

        this.set(false);
    };

    /** Document **/
    /**
     * Called to add the document events
     */
    private addDocumentEvents = () => {
        document.addEventListener('mousedown', this.onDocumentClick, true);
        document.addEventListener('touchstart', this.onDocumentClick, true);
    };

    /**
     * Called to remove the document events
     */
    private removeDocumentEvents = () => {
        //remove listeners
        document.removeEventListener('mousedown', this.onDocumentClick, true);
        document.removeEventListener('touchstart', this.onDocumentClick, true);
    };

    /**
     * Called when the document is clicked
     *
     * @param event - event that was called
     */
    private onDocumentClick = (event: MouseEvent | TouchEvent) => {
        // ignore if it is on the target or content (bubbling)
        if (
            event &&
            event.target &&
            (this.targetEle.contains(event.target as HTMLElement) ||
                this.contentEle.contains(event.target as HTMLElement))
        ) {
            return;
        }

        // close the popup
        this.set(false);
    };
}

export default Popover;
