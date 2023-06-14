'use strict';

interface config {
    content: HTMLElement | string;
    handle: HTMLElement | string;
    container: HTMLElement | string;
    unit: string;
    disabled: boolean;
    restrict: {
        top: number | string;
        right: number | string;
        bottom: number | string;
        left: number | string;
    };
    start: () => {};
    on: (top: number, left: number) => {};
    stop: (top: number, left: number) => {};
}

function Movable(config: config) {
    let move = {
            start: () => {},
            on: (top: number, left: number) => {},
            stop: (top: number, left: number) => {},
        },
        disabled = false,
        unit = 'px',
        active = false,
        restrict: {
            top: number | string;
            right: number | string;
            bottom: number | string;
            left: number | string;
        } = {
            top: 0,
            right: -Infinity,
            bottom: -Infinity,
            left: 0,
        },
        startY = 0,
        startX = 0,
        startTop = 0,
        startLeft = 0,
        startHeight = 0,
        startWidth = 0,
        scale = 1,
        restrictTop: number,
        restrictRight: number,
        restrictBottom: number,
        restrictLeft: number,
        renderedTop = 0,
        renderedLeft = 0,
        handleEle: HTMLElement,
        contentEle: HTMLElement,
        containerEle: HTMLElement;

    /*** Events */
    /**
     * @name startMove
     * @desc called to start the moving
     * @param event - Mouse or touch Event
     */
    function startMove(event: MouseEvent | TouchEvent): void {
        if (disabled || active) {
            return;
        }

        let clientY = 0,
            clientX = 0,
            extracted: [number, string];

        event.preventDefault();
        event.stopPropagation();

        move.start();

        // set the scale value;
        scale = getScale(containerEle);

        // based on the event type
        if (isTouchEvent(event)) {
            clientY = event.touches[0].clientY;
            clientX = event.touches[0].clientX;
        } else if (isMouseEvent(event)) {
            clientY = event.clientY;
            clientX = event.clientX;
        }

        // get the start
        startY = clientY;
        startX = clientX;
        startTop = contentEle.offsetTop;
        startLeft = contentEle.offsetLeft;
        startHeight = contentEle.offsetHeight;
        startWidth = contentEle.offsetWidth;

        // convert restrict to px
        extracted = extractUnit(restrict.top);
        restrictTop = convertUnits(
            extracted[0],
            extracted[1] || unit,
            'px',
            'height'
        );

        extracted = extractUnit(restrict.right);
        restrictRight = convertUnits(
            extracted[0],
            extracted[1] || unit,
            'px',
            'width'
        );

        extracted = extractUnit(restrict.bottom);
        restrictBottom = convertUnits(
            extracted[0],
            extracted[1] || unit,
            'px',
            'height'
        );

        extracted = extractUnit(restrict.left);
        restrictLeft = convertUnits(
            extracted[0],
            extracted[1] || unit,
            'px',
            'width'
        );

        document.addEventListener('mousemove', onMove, false);
        document.addEventListener('mouseup', stopMove, false);
        document.addEventListener('touchmove', onMove, false);
        document.addEventListener('touchend', stopMove, false);
    }

    /**
     * @name onMove
     * @desc called when the element is moving
     * @param event - Mouse or touch Event
     */
    function onMove(event: MouseEvent | TouchEvent): void {
        let clientY = 0,
            clientX = 0,
            calculatedTop: number,
            calculatedRight: number,
            calculatedBottom: number,
            calculatedLeft: number;

        active = true;
        // based on the event type
        if (isTouchEvent(event)) {
            clientY = event.touches[0].clientY;
            clientX = event.touches[0].clientX;
        } else if (isMouseEvent(event)) {
            clientY = event.clientY;
            clientX = event.clientX;
        }

        // calculated values in px
        calculatedTop = (clientY - startY) * scale + startTop;
        calculatedLeft = (clientX - startX) * scale + startLeft;
        calculatedBottom =
            containerEle.clientHeight - (calculatedTop + startHeight);
        calculatedRight =
            containerEle.clientWidth - (calculatedLeft + startWidth);

        // check the restrict
        if (calculatedBottom < restrictBottom) {
            calculatedTop =
                containerEle.clientHeight - (restrictBottom + startHeight);
        }

        if (calculatedRight < restrictRight) {
            calculatedLeft =
                containerEle.clientWidth - (restrictRight + startWidth);
        }

        if (calculatedTop < restrictTop) {
            calculatedTop = restrictTop;
        }

        if (calculatedLeft < restrictLeft) {
            calculatedLeft = restrictLeft;
        }

        // save the rendered
        renderedTop = convertUnits(calculatedTop, 'px', unit, 'height');
        renderedLeft = convertUnits(calculatedLeft, 'px', unit, 'width');

        // update the style
        contentEle.style.top = renderedTop + unit;
        contentEle.style.left = renderedLeft + unit;

        // trigger the callback
        move.on(renderedTop, renderedLeft);
    }

    /**
     * @name stopMove
     * @desc called when the element stops moving
     */
    function stopMove(): void {
        document.removeEventListener('mousemove', onMove, false);
        document.removeEventListener('mouseup', stopMove, false);
        document.removeEventListener('touchmove', onMove, false);
        document.removeEventListener('touchend', stopMove, false);

        if (active) {
            move.stop(renderedTop, renderedLeft);
        }

        active = false;
    }

    /** Utility */
    /**
     * @name extractUnit
     * @param value - value to extract
     * @returns the number and unit for the value
     */
    function extractUnit(value: string | number): [number, string] {
        let unit = '';

        // convert value to a string
        value = String(value);

        if (!value) {
            return [0, unit];
        }

        // remove white space
        value = value.trim();

        // check endings
        if (value.slice(-2) === 'px') {
            value = value.slice(0, -2);
            unit = 'px';
        } else if (value.slice(-1) === '%') {
            value = value.slice(0, -1);
            unit = '%';
        }

        return [Number(value), unit];
    }
    /**
     * @name convertUnits
     * @desc convert to the appropriate units
     * @param value - value to convert
     * @param from - unit to convert to
     * @param to - unit to convert to
     * @param type - type of conversion
     */
    function convertUnits(
        value: number,
        from: string,
        to: string,
        type: string
    ): number {
        if (from === to) {
            // same unit
            return value;
        }

        if (from === '%' && to === 'px') {
            const containerBoundingClientRect =
                containerEle.getBoundingClientRect();
            if (type === 'height') {
                return (value / 100) * containerBoundingClientRect.height;
            } else if (type === 'width') {
                return (value / 100) * containerBoundingClientRect.width;
            }
        } else if (from === 'px' && to === '%') {
            const containerBoundingClientRect =
                containerEle.getBoundingClientRect();
            if (type === 'height') {
                return (value / containerBoundingClientRect.height) * 100;
            } else if (type === 'width') {
                return (value / containerBoundingClientRect.width) * 100;
            }
        }

        // don't have a conversion for it .... yet
        return value;
    }

    /**
     * @name isMouseEvent
     * @desc checks if it is a mouse event
     * @param event - MouseEvent or TouchEvent
     */
    function isMouseEvent(event: MouseEvent | TouchEvent): event is MouseEvent {
        return (
            event.type === 'mousedown' ||
            event.type === 'mousemove' ||
            event.type === 'mouseup'
        );
    }

    /**
     * @name isTouchEvent
     * @desc checks if it is a touch event
     * @param event - MouseEvent or TouchEvent
     */
    function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
        return (
            event.type === 'touchstart' ||
            event.type === 'touchmove' ||
            event.type === 'touchend'
        );
    }

    /**
     * @name getScale
     * @desc convert to the appropriate units
     * @param ele - ele to extract
     */
    function getScale(ele: HTMLElement): number {
        if (ele.style.transform) {
            const matches = ele.style.transform.match(
                /matrix\(\s*(-?\d*\.?\d*),\s*(-?\d*\.?\d*),\s*(-?\d*\.?\d*),\s*(-?\d*\.?\d*),\s*(-?\d*\.?\d*),\s*(-?\d*\.?\d*)\)/
            );
            if (matches) {
                const scale = Number(matches[1]);
                if (typeof scale === 'number' && !isNaN(scale)) {
                    // invert it
                    return 1 / scale;
                }
            }
        }

        return 1;
    }

    /** API */
    /**
     * @name enable
     * @desc enable the moveable object
     */
    function enable(): void {
        disabled = false;

        handleEle.style.cursor = 'move';
    }

    /**
     * @name disable
     * @desc disable the moveable object
     */
    function disable(): void {
        disabled = true;

        handleEle.style.cursor = '';
    }

    /**
     * @name destroy
     * @desc destroy the moveable object
     */
    function destroy(): void {
        handleEle.removeEventListener('mousedown', startMove);
        handleEle.removeEventListener('touchstart', startMove);
    }

    /**
     * @name update
     * @desc called to update the config
     * @param options - updated config
     */
    function update(options: config): void {
        // only update if it is passed in and not set
        if (options.hasOwnProperty('content')) {
            if (typeof options.content === 'string') {
                contentEle = document.querySelector(
                    options.content
                ) as HTMLElement;
            } else {
                contentEle = options.content;
            }
        }

        if (options.hasOwnProperty('handle')) {
            if (typeof options.handle === 'string') {
                handleEle = contentEle.querySelector(
                    options.handle
                ) as HTMLElement;
            } else {
                handleEle = options.handle;
            }
        } else if (typeof handleEle === 'undefined') {
            handleEle = contentEle;
        }

        if (options.hasOwnProperty('container')) {
            if (typeof options.container === 'string') {
                containerEle = document.querySelector(
                    options.container
                ) as HTMLElement;
            } else {
                containerEle = options.container;
            }
        } else if (typeof containerEle === 'undefined') {
            containerEle = contentEle.parentElement as HTMLElement;
        }

        if (options.hasOwnProperty('restrict')) {
            if (options.restrict.hasOwnProperty('top')) {
                restrict.top = options.restrict.top;
            }
            if (options.restrict.hasOwnProperty('right')) {
                restrict.right = options.restrict.right;
            }
            if (options.restrict.hasOwnProperty('bottom')) {
                restrict.bottom = options.restrict.bottom;
            }
            if (options.restrict.hasOwnProperty('left')) {
                restrict.left = options.restrict.left;
            }
        }

        if (options.hasOwnProperty('start')) {
            move.start = options.start;
        }

        if (options.hasOwnProperty('on')) {
            move.on = options.on;
        }

        if (options.hasOwnProperty('stop')) {
            move.stop = options.stop;
        }

        if (options.hasOwnProperty('unit')) {
            unit = options.unit;
        }

        if (options.hasOwnProperty('disabled')) {
            disabled = options.disabled;
        }

        // enable or disable
        if (disabled) {
            disable();
        } else {
            enable();
        }
    }

    /** initialize */
    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        if (!config.hasOwnProperty('content')) {
            console.error('Movable needs a content element');
            return;
        }

        // set all of the options
        update(config);

        handleEle.addEventListener('mousedown', startMove);
        handleEle.addEventListener('touchstart', startMove);
    }

    initialize();

    return {
        enable: enable,
        disable: disable,
        update: update,
        destroy: destroy,
    };
}

export default Movable;
