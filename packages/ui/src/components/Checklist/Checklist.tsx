import React, { useState } from "react";
import { Checkbox } from "../../";

export const Checklist = (props) => {
    const { options, onChange } = props;

    const [checkedItems, setCheckedItems] = useState({});

    const handleToggle = (item) => {
        setCheckedItems((prevCheckedItems) => ({
            ...prevCheckedItems,
            [item]: !prevCheckedItems[item],
        }));
    };

    return (
        <div>
            {options.map((opt, i) => {
                return (
                    <Checkbox
                        key={i}
                        label={opt}
                        checked={checkedItems[opt] || false}
                        onChange={() => handleToggle(opt)}
                    />
                );
            })}
        </div>
    );
};
