import type { SxProps } from "@mui/material";
import {
	DayCalendarSkeleton,
	LocalizationProvider,
	DatePicker as MuiDatePicker,
	PickersDay,
	type PickersDayProps,
	pickersDayClasses,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useMemo } from "react";

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
					backgroundColor: (theme) => theme.palette.primary.main,
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
