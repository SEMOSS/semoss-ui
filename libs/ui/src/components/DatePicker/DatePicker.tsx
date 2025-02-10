import { useMemo } from "react";
import {
    DatePicker as MuiDatePicker,
    LocalizationProvider,
    PickersDay,
    pickersDayClasses,
    PickersDayProps,
    DayCalendarSkeleton,
} from "@mui/x-date-pickers";
import { SxProps } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs";

export interface DatePickerProps {
    /** custom style object */
    sx?: SxProps;

    //** date value */
    value: string;

    //** onChange function for datepicket to intercept dayjs object */
    onChange: (e: string, c: unknown) => void;

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

export const DatePicker = (props: DatePickerProps) => {
    const { sx, value, onChange = () => null } = props;

    const memoValue = useMemo(() => dayjs(value), [value]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MuiDatePicker
                sx={sx}
                {...props}
                value={memoValue}
                onChange={(d, c) => onChange(d.toISOString(), c)}
                slots={{ day: (props) => <DayPicker {...props} /> }}
                renderLoading={() => <DayCalendarSkeleton />}
            />
        </LocalizationProvider>
    );
};
