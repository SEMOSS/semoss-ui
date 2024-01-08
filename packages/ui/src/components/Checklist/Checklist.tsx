import React, { useState, useEffect } from "react";
import { Checkbox, FormControlLabel, List } from "../..";

// Define a generic type for the option
interface Option<T> {
    id: T;
    label: string;
    checked?: boolean;
}

// Define a generic type for the checked state
type CheckedState<T> = T[];

export interface ChecklistProps<T> {
    options: Option<T>[];
    checked: CheckedState<T>;
    onChange: (checked: CheckedState<T>) => void;
    getKey: (option: Option<T>) => T;
}

export const Checklist = <T,>(props: ChecklistProps<T>) => {
    const {
        options: initialOptions,
        checked: initialChecked,
        onChange,
        getKey,
    } = props;

    // State to hold the array of options
    const [options, setOptions] = useState(initialOptions);
    // State to hold the array of checked options
    const [checked, setChecked] = useState(initialChecked || []);

    // Update the state when the options prop changes
    useEffect(() => {
        setOptions(initialOptions);
        // Reset the checked state when options change
        setChecked(initialChecked || []);
    }, [initialOptions, initialChecked]);

    // Function to handle checkbox toggling
    const handleCheckboxChange = (option: Option<T>) => {
        const optionKey = getKey(option);

        const newOpts = options.map((o) =>
            getKey(o) === optionKey ? { ...o, checked: !o.checked } : o,
        );

        const newChecked = checked.includes(optionKey)
            ? checked.filter((checkedKey) => checkedKey !== optionKey)
            : [...checked, optionKey];

        setChecked(newChecked);
        setOptions(newOpts);

        // Call the onChange prop with the updated checked options
        if (onChange) {
            onChange(newChecked);
        }
    };

    // JSX structure for the component
    return (
        <div>
            <List>
                {options.map((option, i) => (
                    <List.Item key={i}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={checked.includes(getKey(option))}
                                    onChange={() =>
                                        handleCheckboxChange(option)
                                    }
                                />
                            }
                            label={option.label}
                        />
                    </List.Item>
                ))}
            </List>
        </div>
    );
};
