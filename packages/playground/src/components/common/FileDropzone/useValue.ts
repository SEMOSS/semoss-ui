import { useState, useRef, useCallback } from 'react';

export interface useValueProps<V> {
    /** Value to track */
    value?: V;

    /** Default Value of the input */
    defaultValue?: V;

    /** Value if no value is set */
    initialValue: V;

    /** Callback that is triggered when the value changes */
    onChange?: (value: V) => void;
}

/**
 * Merge the default value with the normal value and update when either change
 * @param props
 * @returns the value and a method to set it
 */
export function useValue<V>(
    props: useValueProps<V>,
): [V, (updated: V) => void] {
    const { value, defaultValue, initialValue, onChange } = props;

    // check if its controlled or not
    const controlled = value !== undefined;
    const controlRef = useRef(controlled);
    const [uncontrolledValue, setUncontrolledValue] = useState<V | undefined>(
        () => {
            // use the defaultValue if it is defined
            if (defaultValue !== undefined) {
                return defaultValue;
            }

            return initialValue;
        },
    );

    // throw an error if the controlled switches
    if (controlled !== controlRef.current) {
        console.warn(
            `WARNING ::: Component switched from controlled/uncontrolled to uncontrolled/controlled`,
        );
    }

    // value to use
    const internalValue = controlRef.current
        ? (value as V)
        : (uncontrolledValue as V);

    /**
     * Trigger the change
     * @param updated - new / updated value
     */
    const triggerChange = useCallback(
        (updated: V) => {
            // update the value if it isn't there
            if (!controlRef.current) {
                setUncontrolledValue(updated);
            }

            if (onChange) {
                onChange(updated);
            }
        },
        [onChange],
    );

    return [internalValue, triggerChange];
}
