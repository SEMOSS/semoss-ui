'use strict';

interface config {
    content: HTMLElement | string;
    container?: HTMLElement | string;
    unit?: string;
    disabled?: boolean;
    restrict: {
        minimumHeight?: number | string;
        maximumHeight?: number | string;
        minimumWidth?: number | string;
        maximumWidth?: number | string;
    };
    startBoundary?: number;
    endBoundary?: number;
    available?: ('N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW')[];
    start?: () => {};
    on?: (top: number, left: number, height: number, width: number) => void;
    stop?: (top: number, left: number, height: number, width: number) => void;
}

function Resizable(config: config) {
    let resize = {
            start: () => {},
            on: (
                top: number,
                left: number,
                height: number,
                width: number
            ) => {},
            stop: (
                top: number,
                left: number,
                height: number,
                width: number
            ) => {},
        },
        disabled = false,
        unit = 'px',
        startBoundary = 0,
        endBoundary = 8,
        available = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
        active = false,
        restrict: {
            minimumHeight: number | string;
            maximumHeight: number | string;
            minimumWidth: number | string;
            maximumWidth: number | string;
        } = {
            minimumHeight: 0,
            maximumHeight: Infinity,
            minimumWidth: 0,
            maximumWidth: Infinity,
        },
        startY = 0,
        startX = 0,
        startTop = 0,
        startLeft = 0,
        startHeight = 0,
        startWidth = 0,
        scale = 1,
        restrictMinimumHeight: number,
        restrictMaximumHeight: number,
        restrictMinimumWidth: number,
        restrictMaximumWidth: number,
        renderedTop = 0,
        renderedLeft = 0,
        renderedHeight = 0,
        renderedWidth = 0,
        direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | '' = '',
        contentEle: HTMLElement,
        containerEle: HTMLElement;

    /*** Events */
    /**
     * @name renderResize
     * @desc render the resize cursor
     * @param event - Mouse or touch Event
     */
    function renderResize(event: MouseEvent): void {
        if (disabled || active) {
            return;
        }

        const containerBoundingClientRect =
                containerEle.getBoundingClientRect(),
            cursorTop =
                event.clientY -
                contentEle.offsetTop -
                containerBoundingClientRect.top,
            cursorRight =
                contentEle.offsetWidth -
                (event.clientX -
                    contentEle.offsetLeft -
                    containerBoundingClientRect.left),
            cursorBottom =
                contentEle.offsetHeight -
                (event.clientY -
                    contentEle.offsetTop -
                    containerBoundingClientRect.top),
            cursorLeft =
                event.clientX -
                contentEle.offsetLeft -
                containerBoundingClientRect.left;

        // consider margin
        if (
            cursorTop < startBoundary ||
            cursorRight < startBoundary ||
            cursorBottom < startBoundary ||
            cursorLeft < startBoundary
        ) {
            direction = '';
            contentEle.style.cursor = '';
            return;
        }

        if (
            cursorTop < endBoundary &&
            cursorLeft > endBoundary &&
            cursorRight > endBoundary
        ) {
            // N
            direction = 'N';
        } else if (cursorTop < endBoundary && cursorRight < endBoundary) {
            // NE
            direction = 'NE';
        } else if (
            cursorTop > endBoundary &&
            cursorBottom > endBoundary &&
            cursorRight < endBoundary
        ) {
            // E
            direction = 'E';
        } else if (cursorBottom < endBoundary && cursorRight < endBoundary) {
            // SE
            direction = 'SE';
        } else if (
            cursorBottom < endBoundary &&
            cursorLeft > endBoundary &&
            cursorLeft > endBoundary
        ) {
            // S
            direction = 'S';
        } else if (cursorBottom < endBoundary && cursorLeft < endBoundary) {
            // SW
            direction = 'SW';
        } else if (
            cursorTop > endBoundary &&
            cursorBottom > endBoundary &&
            cursorLeft < endBoundary
        ) {
            // W
            direction = 'W';
        } else if (cursorTop < endBoundary && cursorLeft < endBoundary) {
            // NW
            direction = 'NW';
        } else {
            direction = '';
        }

        // check if we can actually resize in that direction
        if (!direction || available.indexOf(direction) === -1) {
            direction = '';
        }

        // change the cursor
        if (direction === 'N') {
            // N
            contentEle.style.cursor = 'n-resize';
        } else if (direction === 'NE') {
            // NE
            contentEle.style.cursor = 'ne-resize';
        } else if (direction === 'E') {
            // E
            contentEle.style.cursor = 'e-resize';
        } else if (direction === 'SE') {
            // SE
            contentEle.style.cursor = 'se-resize';
        } else if (direction === 'S') {
            // S
            contentEle.style.cursor = 's-resize';
        } else if (direction === 'SW') {
            // SW
            contentEle.style.cursor = 'sw-resize';
        } else if (direction === 'W') {
            // W
            contentEle.style.cursor = 'w-resize';
        } else if (direction === 'NW') {
            // NW
            contentEle.style.cursor = 'nw-resize';
        } else {
            contentEle.style.cursor = 'default';
        }
    }

    /**
     * @name startResize
     * @desc called when the element starts resizing
     * @param event - Mouse or touch Event
     */
    function startResize(event: MouseEvent | TouchEvent): void {
        if (disabled || active || !direction) {
            return;
        }

        let clientY = 0,
            clientX = 0,
            extracted: [number, string];

        event.preventDefault();
        event.stopPropagation();

        resize.start();

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

        // convert and calculate restrict to px
        extracted = extractUnit(restrict.minimumHeight);
        restrictMinimumHeight = convertUnits(
            extracted[0],
            extracted[1] || unit,
            'px',
            'height'
        );

        extracted = extractUnit(restrict.maximumHeight);
        restrictMaximumHeight = convertUnits(
            extracted[0],
            extracted[1] || unit,
            'px',
            'height'
        );

        extracted = extractUnit(restrict.minimumWidth);
        restrictMinimumWidth = convertUnits(
            extracted[0],
            extracted[1] || unit,
            'px',
            'width'
        );

        extracted = extractUnit(restrict.maximumWidth);
        restrictMaximumWidth = convertUnits(
            extracted[0],
            extracted[1] || unit,
            'px',
            'width'
        );

        active = true;

        document.addEventListener('mousemove', onResize, false);
        document.addEventListener('mouseup', stopResize, false);
        document.addEventListener('touchmove', onResize, false);
        document.addEventListener('touchend', stopResize, false);
    }

    /**
     * @name onResize
     * @desc called when the element is resizing
     * @param event - Mouse or touch Event
     */
    function onResize(event: MouseEvent | TouchEvent) {
        const containerBoundingClientRect =
            containerEle.getBoundingClientRect();

        let clientY = 0,
            clientX = 0,
            calculatedTop: number,
            calculatedLeft: number,
            calculatedHeight: number,
            calculatedWidth: number;

        // based on the event type
        if (isTouchEvent(event)) {
            clientY = event.touches[0].clientY;
            clientX = event.touches[0].clientX;
        } else if (isMouseEvent(event)) {
            clientY = event.clientY;
            clientX = event.clientX;
        }

        // calculate the base values in px
        calculatedTop = startTop;
        calculatedLeft = startLeft;
        calculatedHeight = startHeight;
        calculatedWidth = startWidth;

        if (direction === 'N' || direction === 'NE' || direction === 'NW') {
            calculatedTop = startTop + (clientY - startY) * scale;

            if (
                calculatedTop >
                startHeight + startTop - restrictMinimumHeight
            ) {
                calculatedTop = startHeight + startTop - restrictMinimumHeight;
            }

            if (
                calculatedTop <
                startHeight + startTop - restrictMaximumHeight
            ) {
                calculatedTop = startHeight + startTop - restrictMaximumHeight;
            }

            calculatedHeight = startHeight - (calculatedTop - startTop);
        }

        if (direction === 'E' || direction === 'NE' || direction === 'SE') {
            calculatedWidth = startWidth + (clientX - startX) * scale;

            if (calculatedWidth < restrictMinimumWidth) {
                calculatedWidth = restrictMinimumWidth;
            }

            if (calculatedWidth > restrictMaximumWidth) {
                calculatedWidth = restrictMaximumWidth;
            }
        }

        if (direction === 'S' || direction === 'SE' || direction === 'SW') {
            calculatedHeight = startHeight + (clientY - startY) * scale;

            if (calculatedHeight < restrictMinimumHeight) {
                calculatedHeight = restrictMinimumHeight;
            }

            if (calculatedHeight > restrictMaximumHeight) {
                calculatedHeight = restrictMaximumHeight;
            }
        }

        if (direction === 'W' || direction === 'NW' || direction === 'SW') {
            calculatedLeft = startLeft + (clientX - startX) * scale;

            if (
                calculatedLeft >
                startWidth + startLeft - restrictMinimumWidth
            ) {
                calculatedLeft = startWidth + startLeft - restrictMinimumWidth;
            }

            if (
                calculatedLeft <
                startWidth + startLeft - restrictMaximumWidth
            ) {
                calculatedLeft = startWidth + startLeft - restrictMaximumWidth;
            }

            calculatedWidth = startWidth - (calculatedLeft - startLeft);
        }

        // save the rendered
        renderedTop = convertUnits(calculatedTop, 'px', unit, 'height');
        renderedLeft = convertUnits(calculatedLeft, 'px', unit, 'width');
        renderedHeight = convertUnits(calculatedHeight, 'px', unit, 'height');
        renderedWidth = convertUnits(calculatedWidth, 'px', unit, 'width');

        // update the style
        contentEle.style.top = renderedTop + unit;
        contentEle.style.left = renderedLeft + unit;
        contentEle.style.height = renderedHeight + unit;
        contentEle.style.width = renderedWidth + unit;

        resize.on(renderedTop, renderedLeft, renderedHeight, renderedWidth);
    }

    /**
     * @name stopResize
     * @desc called when the element stops resizing
     */
    function stopResize(): void {
        document.removeEventListener('mousemove', onResize, false);
        document.removeEventListener('mouseup', stopResize, false);
        document.removeEventListener('touchmove', onResize, false);
        document.removeEventListener('touchend', stopResize, false);

        if (active) {
            resize.stop(
                renderedTop,
                renderedLeft,
                renderedHeight,
                renderedWidth
            );
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
    }

    /**
     * @name disable
     * @desc disable the moveable object
     */
    function disable(): void {
        disabled = true;
    }

    /**
     * @name destroy
     * @desc destroy the resizeable object
     */
    function destroy(): void {
        contentEle.removeEventListener('mousemove', renderResize);
        contentEle.removeEventListener('mousedown', startResize);
        contentEle.removeEventListener('touchstart', startResize);
    }

    /**
     * @name update
     * @desc called to update the config
     * @param options - updated config
     */
    function update(options: config): void {
        // only update if it is passed in and not set
        if (typeof options.content !== 'undefined') {
            if (typeof options.content === 'string') {
                contentEle = document.querySelector(
                    options.content
                ) as HTMLElement;
            } else {
                contentEle = options.content;
            }
        }

        if (typeof options.container !== 'undefined') {
            if (typeof options.container === 'string') {
                containerEle = document.querySelector(
                    options.container
                ) as HTMLElement;
            } else {
                containerEle = options.container;
            }
        } else {
            containerEle = contentEle.parentElement as HTMLElement;
        }

        if (options.hasOwnProperty('restrict')) {
            if (typeof options.restrict.minimumHeight !== 'undefined') {
                restrict.minimumHeight = options.restrict.minimumHeight;
            }
            if (typeof options.restrict.maximumHeight !== 'undefined') {
                restrict.maximumHeight = options.restrict.maximumHeight;
            }
            if (typeof options.restrict.minimumWidth !== 'undefined') {
                restrict.minimumWidth = options.restrict.minimumWidth;
            }
            if (typeof options.restrict.maximumWidth !== 'undefined') {
                restrict.maximumWidth = options.restrict.maximumWidth;
            }
        }

        if (typeof options.start !== 'undefined') {
            resize.start = options.start;
        }

        if (typeof options.on !== 'undefined') {
            resize.on = options.on;
        }

        if (typeof options.stop !== 'undefined') {
            resize.stop = options.stop;
        }

        if (typeof options.unit !== 'undefined') {
            unit = options.unit;
        }

        if (typeof options.startBoundary !== 'undefined') {
            startBoundary = options.startBoundary;
        }

        if (typeof options.endBoundary !== 'undefined') {
            endBoundary = options.endBoundary;
        }

        if (typeof options.available !== 'undefined') {
            available = options.available;
        }

        if (typeof options.disabled !== 'undefined') {
            disabled = options.disabled;
        }

        // enable or disable
        if (disabled) {
            disable();
        } else {
            enable();
        }
    }

    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        if (!config.hasOwnProperty('content')) {
            console.error('Resizable needs a content element');
            return;
        }

        // set all of the options
        update(config);

        contentEle.addEventListener('mousemove', renderResize);
        contentEle.addEventListener('mousedown', startResize);
        contentEle.addEventListener('touchstart', startResize);
    }

    initialize();

    return {
        enable: enable,
        disable: disable,
        update: update,
        destroy: destroy,
    };
}

export default Resizable;
