export interface InputOptions<V> {
    /** ID of the input */
    id?: string;

    /** Value of the input */
    value?: V;

    /** Default Value of the input */
    defaultValue?: V;

    /** Callback that is triggered when the value changes */
    onChange?: (value: V) => void;

    /** Mark the input in a disabled/enabled state */
    disabled?: boolean;

    /** Mark the input in a valid/invalid state */
    valid?: boolean;
}
