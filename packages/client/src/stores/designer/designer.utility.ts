//TODO: We are using attributes to get the block id. Should we use __reactFiber?

/**
 * Get relative size of an element
 *
 * @param element - element that we are getting the relative size for
 * @param parent - parent element that we are getting the size in relation to
 *
 * @returns the relative size of the element
 */
export const getRelativeSize = (
    element: Element,
    parent: Element,
): {
    top: number;
    left: number;
    height: number;
    width: number;
} => {
    const elementBoundingClientRect = element.getBoundingClientRect();
    const parentBloundingClientRect = parent.getBoundingClientRect();

    return {
        top:
            elementBoundingClientRect.top -
            parentBloundingClientRect.top +
            parent.scrollTop,
        left:
            elementBoundingClientRect.left -
            parentBloundingClientRect.left +
            parent.scrollLeft,
        height: elementBoundingClientRect.height,
        width: elementBoundingClientRect.width,
    };
};

/** Root **/
/**
 * Get the root element
 *
 * @returns the root element
 */
export const getRootElement = (): Element => {
    const rootElement = document.querySelector(`[data-block="root"]`);
    if (!rootElement) {
        throw `ERROR ::: Cannot find Root`;
    }

    return rootElement;
};

/** Widget **/
/**
 * Get the block element
 *
 * @param id - id of the block that we want to find
 *
 * @returns the element of the block if found
 */
export const getBlockElement = (id: string): Element | null => {
    // get the root
    const rootElement = getRootElement();

    // get the block
    return rootElement.querySelector(`[data-block="${id}"]`);
};

/**
 * Get the nearest block from the starting element. This will go up until a block is found.
 *
 * @param element - element that we are starting with
 *
 * @returns id of the nearest block if found
 */
export const getNearestBlock = (element: Element | null): string => {
    const blockElement = getNearestBlockElement(element);
    if (!blockElement) {
        return '';
    }

    return blockElement.getAttribute('data-block') as string;
};

/**
 * Get the nearest block element from the starting element.
 *
 * @param element - element that we are starting with
 *
 * @returns element of the nearest block if found
 */
export const getNearestBlockElement = (
    element: Element | null,
): Element | null => {
    // there is no element or we have reached the top
    if (!element) {
        return null;
    }

    // get the block's id
    const id = element.getAttribute('data-block');

    // we have reached the root can't go up more
    if (id === 'root') {
        return null;
    }

    // found the id
    if (id) {
        return element;
    }

    return getNearestBlockElement(element.parentElement);
};

/** Slot **/
/**
 * Get the slot element
 *
 * @param id - id the block that we are searching
 * @param slot - slot of the block that we want to find
 *
 * @returns the element of the slot if found
 */
export const getSlotElement = (id: string, slot: string): Element | null => {
    const blockElement = getBlockElement(id);

    const queue = [blockElement];
    while (queue.length) {
        const currentElement = queue.shift();

        if (!currentElement) {
            continue;
        }

        const currentSlot = currentElement.getAttribute('data-slot');
        if (currentSlot === slot) {
            return null;
        }

        // look at the children that are not blocks to find the slot
        let childElement = currentElement.firstElementChild;
        while (childElement) {
            // get the block's id
            const id = childElement.getAttribute('data-block');

            if (!id) {
                queue.push(childElement);
            }

            childElement = childElement.nextElementSibling;
        }
    }

    return null;
};

/**
 * Get the nearest slot element from the starting element.
 *
 * @param element - element that we are starting with
 *
 * @returns element of the nearest slot if found
 */
export const getNearestSlot = (element: Element | null): string | null => {
    const slotElement = getNearestSlotElement(element);
    if (!slotElement) {
        return null;
    }

    return slotElement.getAttribute('data-slot') as string;
};

/**
 * Get the nearest slot element from the starting element.
 *
 * @param element - element that we are starting with
 *
 * @returns element of the nearest slot if found
 */
export const getNearestSlotElement = (
    element: Element | null,
): Element | null => {
    // there is no element or we have reached the top
    if (!element) {
        return null;
    }

    // get the block's id
    const id = element.getAttribute('data-block');
    if (id) {
        return null;
    }

    // get slot if possible
    const slot = element.getAttribute('data-slot');
    if (slot) {
        return element;
    }

    return getNearestSlotElement(element.parentElement);
};
