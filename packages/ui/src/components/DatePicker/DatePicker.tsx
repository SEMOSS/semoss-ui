import { useMemo } from "react";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { SxProps } from "@mui/system";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
    PickersDay,
    pickersDayClasses,
    PickersDayProps,
} from "@mui/x-date-pickers/PickersDay";
import { DayCalendarSkeleton } from "@mui/x-date-pickers/DayCalendarSkeleton";
import * as dayjs from "dayjs";

export interface _DatePickerProps {
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

export const DatePicker = (props: _DatePickerProps) => {
    const { sx, value, onChange = () => null } = props;

    const memoValue = useMemo(() => dayjs(value), [value]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MuiDatePicker
                sx={sx}
                {...props}
                value={memoValue}
                onChange={(d, c) => onChange(d.toISOString(), c)}
                slots={{ day: DayPicker }}
                renderLoading={() => <DayCalendarSkeleton />}
            />
        </LocalizationProvider>
    );
};
