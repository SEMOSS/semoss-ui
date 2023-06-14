/**
 * Extract the value and unit from a style
 *
 * @param value - value to extract
 *
 * @returns the number and unit for the value
 */
export function extractUnit(value: number | string): [number, string] {
    let unit = '';

    // convert o string
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
    } else if (value.slice(-2) === 'em') {
        value = value.slice(0, -2);
        unit = 'em';
    } else if (value.slice(-1) === '%') {
        value = value.slice(0, -1);
        unit = '%';
    }

    return [Number(value), unit];
}

/**
 * Convert a unit to the appropriate units
 *
 * @param value - value to convert
 * @param from - unit to convert to
 * @param to - unit to convert to
 * @param type - type of conversion
 * @returns a number in the new units
 */
export function convertUnit(
    value: number,
    from: string,
    to: string,
    type: string,
    ele: HTMLElement
): number {
    if (from === to) {
        // same unit
        return value;
    }

    if (from === '%' && to === 'px') {
        if (type === 'height') {
            return (value / 100) * ele.offsetHeight;
        } else if (type === 'width') {
            return (value / 100) * ele.offsetWidth;
        }
    } else if (from === 'px' && to === '%') {
        if (type === 'height') {
            return (value / ele.offsetHeight) * 100;
        } else if (type === 'width') {
            return (value / ele.offsetWidth) * 100;
        }
    }

    // don't have a conversion for it .... yet
    return value;
}

/**
 * Get the scale of the element
 * @param ele - element to get the scale from
 * @returns scaled value
 */
export function getScale(ele: HTMLElement) {
    return ele.getBoundingClientRect().width / ele.offsetWidth;
}
