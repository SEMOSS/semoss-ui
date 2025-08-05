import { useMemo } from "react";
import {
    DateTimePicker as MuiDateTimePicker,
    LocalizationProvider,
    PickersDay,
    pickersDayClasses,
    PickersDayProps,
    DayCalendarSkeleton,
} from "@mui/x-date-pickers";
import { SxProps } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs";

export interface DateTimePickerProps {
    /** custom style object */
    sx?: SxProps;

    //** date time value */
    value: string | null | dayjs.Dayjs;

    //** onChange function for datepicker to intercept dayjs object */
    onChange: (e: string | null, c?: unknown) => void;

    /** Label for the input */
    label?: string;

    /** Format for the displayed date */
    format?: string;

    /** Disabled state */
    disabled?: boolean;

    /** Slot props for customization (MUI compatibility) */
    slotProps?: {
        textField?: any;
        [key: string]: any;
    };

    /**
     * Years rendered per row.
     * @default 4 on desktop, 3 on mobile
     */
    yearsPerRow?: 3 | 4;
}

const DayPicker = (props: PickersDayProps<dayjs.Dayjs>) => {
    return (
        <PickersDay
            sx={{
                [`&&.${pickersDayClasses.selected}`]: {
                    backgroundColor: "#40a0ff",
                },
            }}
            {...props}
        />
    );
};

export const DateTimePicker = (props: DateTimePickerProps) => {
    const { sx, value, onChange = () => null, label, format, disabled, slotProps, ...rest } = props;

    const memoValue = useMemo(() => {
        if (!value) return null;
        if (dayjs.isDayjs(value)) return value;
        return dayjs(value);
    }, [value]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MuiDateTimePicker
                sx={sx}
                label={label}
                format={format}
                disabled={disabled}
                slotProps={slotProps}
                {...rest}
                value={memoValue}
                onChange={(d, c) => onChange(d?.toISOString() || null, c)}
                slots={{ day: (props) => <DayPicker {...props} /> }}
                renderLoading={() => <DayCalendarSkeleton />}
            />
        </LocalizationProvider>
    );
};
