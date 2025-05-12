import { CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import { TextField, Typography, styled } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { TimeField } from "@mui/x-date-pickers/TimeField";
import { DigitalClock } from "@mui/x-date-pickers/DigitalClock";
import dayjs from "dayjs";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";

const StyledContainer = styled("div")(({ theme }) => ({
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
}));

const StyledLabel = styled(Typography)(({ theme }) => ({
    fontSize: "14px",
    fontWeight: 500,
}));

export interface TimePickerBlockDef extends BlockDef<"timepicker"> {
    widget: "timepicker";
    data: {
        style: CSSProperties;
        label: string;
        value: string; // ISO string
        variant: "field" | "picker" | "digital";
        ampm: boolean;
        format: string;
        disabled: boolean;
        required: boolean;
        fullWidth: boolean;
        placeholder: string;
        clearable: boolean;
        size: "small" | "medium";
        views: ("hours" | "minutes" | "seconds")[];
    };
    listeners: {
        onChange: true;
    };
}

export const TimePickerBlock: BlockComponent = observer(({ id }) => {
    try {
        const { attrs, data, setData, listeners } =
            useBlock<TimePickerBlockDef>(id);

        // Parse the value string to a dayjs object, default to null if invalid
        const timeValue = data.value ? dayjs(data.value) : null;

        const handleChange = (newValue: dayjs.Dayjs | null) => {
            // Convert to ISO string for storage or null if no value
            setData("value", newValue ? newValue.toISOString() : "");

            listeners.onChange();
        };

        // Common props for all time components
        const commonProps = {
            value: timeValue,
            onChange: handleChange,
            ampm: data.ampm,
            disabled: data.disabled,
            required: data.required,
            format: data.format || undefined,
            slotProps: {
                textField: {
                    size: data.size,
                    fullWidth: data.fullWidth,
                    placeholder: data.placeholder,
                    variant: "outlined" as const,
                },
            },
            clearable: data.clearable,
        };

        // Render the appropriate time component based on variant
        const renderTimeComponent = () => {
            switch (data.variant) {
                case "field":
                    return <TimeField {...commonProps} />;
                case "digital":
                    return (
                        <DigitalClock
                            value={timeValue}
                            onChange={handleChange}
                            ampm={data.ampm}
                            disabled={data.disabled}
                            skipDisabled={true}
                            timeStep={1}
                        />
                    );
                case "picker":
                default:
                    return <TimePicker {...commonProps} views={data.views} />;
            }
        };

        return (
            <StyledContainer {...attrs} style={data.style}>
                {data.label && <StyledLabel>{data.label}</StyledLabel>}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    {renderTimeComponent()}
                </LocalizationProvider>
            </StyledContainer>
        );
    } catch (error) {
        console.error("Error in TimeBlock:", error);
        return <div>Error loading Time component</div>;
    }
});
