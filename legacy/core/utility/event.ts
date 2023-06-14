/**
 * Checks if the event is a MouseEvent
 *
 * @param event - event to check
 *
 * @returns true if it is a MouseEvent
 */
export function isMouseEvent(
    event: MouseEvent | TouchEvent
): event is MouseEvent {
    return (
        event.type === 'mousedown' ||
        event.type === 'mousemove' ||
        event.type === 'mouseup'
    );
}

/**
 * Checks if the event is a TouchEvent
 *
 * @param event - event to check
 *
 * @returns true if it is a TouchEvent
 */
export function isTouchEvent(
    event: MouseEvent | TouchEvent
): event is TouchEvent {
    return (
        event.type === 'touchstart' ||
        event.type === 'touchmove' ||
        event.type === 'touchend'
    );
}
