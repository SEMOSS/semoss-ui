import React, { useState } from "react";
import { Checkbox, FormControlLabel, Stack } from "../..";
import { SxProps } from "@mui/material";

interface ChecklistProps {
    options: string[];

    checked: string[];

    onChange: (opts: string[]) => void;

    direction?: "row" | "column";

    sx?: SxProps;
}

export const Checklist = (props: ChecklistProps) => {
    const { options, checked, direction = "row", onChange, sx } = props;

    const [selectedValues, setSelectedValues] =
        React.useState<string[]>(checked);

    const handleCheckboxChange = (value) => {
        const newSelectedValues = [...selectedValues];
        const itemIndex = newSelectedValues.indexOf(value);

        if (itemIndex > -1) {
            // Item is already selected, remove it
            newSelectedValues.splice(itemIndex, 1);
        } else {
            // Item is not selected, add it
            newSelectedValues.push(value);
        }

        setSelectedValues(newSelectedValues);
        onChange(newSelectedValues); // Call the callback with updated selection
    };

    return (
        <Stack direction={direction} gap={0} sx={sx}>
            {options.map((opt) => (
                <FormControlLabel
                    key={opt}
                    control={
                        <Checkbox
                            checked={selectedValues.indexOf(opt) > -1}
                            onChange={() => handleCheckboxChange(opt)}
                        />
                    }
                    label={opt}
                />
            ))}
        </Stack>
    );
};
