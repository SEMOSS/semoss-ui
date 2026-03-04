import { useEffect, useMemo, useState } from "react";
import { Autocomplete, Stack, TextField } from "@semoss/ui";
import { DaysOfWeek, FrequencyOptions, Months } from "./job.constants";
import type { DayOfWeekDef, Frequencies, MonthsDef } from "./job.types";

export const JobStandardFrequencyBuilder = (props: {
	cronExpression: string;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
	const { cronExpression, setBuilderField } = props;

	const [frequency, setFrequency] = useState<Frequencies>("Daily");
	const [time, setTime] = useState<string>("12:00");
	const [dayOfWeek, setDayOfWeek] = useState<DayOfWeekDef>(DaysOfWeek[0]);
	const [dayOfMonth, setDayOfMonth] = useState<number>(1);
	const [month, setMonth] = useState<MonthsDef>(Months[0]);

	useEffect(() => {
		const cronValues = cronExpression.split(" ");
		if (cronValues.length < 6) {
			// make sure it's valid cron syntax
			return;
		} else if (Number.isNaN(cronValues[1]) || Number.isNaN(cronValues[2])) {
			// make sure there's a valid numbered time
			return;
		}

		// set time
		setTime(
			`${cronValues[2] === "0" ? "00" : cronValues[2].padStart(2, "0")}:${
				cronValues[1] === "0" ? "00" : cronValues[1].padStart(2, "0")
			}`,
		);

		// check frequency type
		if (
			cronValues[3] === "*" &&
			cronValues[4] === "*" &&
			(cronValues[5] === "*" || cronValues[5] === "?")
		) {
			setFrequency("Daily");
		} else if (cronValues[3] === "*" && cronValues[4] === "*") {
			setFrequency("Weekly");
			const dayOfWeekValue = parseInt(cronValues[5], 10);
			const dayOfWeekRecord = DaysOfWeek.find(
				(record) => record.value === dayOfWeekValue,
			);
			if (dayOfWeekRecord) {
				setDayOfWeek(dayOfWeekRecord);
			}
		} else if (
			cronValues[4] === "*" &&
			(cronValues[5] === "*" || cronValues[5] === "?")
		) {
			setFrequency("Monthly");
			const dayOfMonthValue = parseInt(cronValues[3], 10);
			if (dayOfMonthValue <= 31 && dayOfMonthValue >= 1) {
				setDayOfMonth(dayOfMonthValue);
			}
		} else if (cronValues[5] === "*" || cronValues[5] === "?") {
			setFrequency("Yearly");
			const dayOfMonthValue = parseInt(cronValues[3], 10);
			if (dayOfMonthValue <= 31 && dayOfMonthValue >= 1) {
				setDayOfMonth(dayOfMonthValue);
			}
			const monthValue = parseInt(cronValues[4], 10);
			const monthRecord = Months.find(
				(record) => record.value === monthValue,
			);
			if (monthRecord) {
				setMonth(monthRecord);
			}
		}
	}, [cronExpression]);
	useEffect(() => {
		const [hour, minute] = time ? time.split(":") : [0, 0];
		switch (frequency) {
			case "Daily":
				setBuilderField(
					"cronExpression",
					`0 ${minute === "00" ? "0" : minute} ${hour} * * ? *`,
				);
				break;
			case "Weekly":
				setBuilderField(
					"cronExpression",
					`0 ${minute === "00" ? "0" : minute} ${hour} * * ${
						dayOfWeek.value
					}`,
				);
				break;
			case "Monthly":
				setBuilderField(
					"cronExpression",
					`0 ${
						minute === "00" ? "0" : minute
					} ${hour} ${dayOfMonth} * ? *`,
				);
				break;
			case "Yearly":
				setBuilderField(
					"cronExpression",
					`0 ${minute === "00" ? "0" : minute} ${hour} ${dayOfMonth} ${
						month.value
					} ? *`,
				);
				break;
		}
	}, [time, dayOfWeek.value, dayOfMonth, month.value, setBuilderField]);

	const daysInMonth: number | null = useMemo(() => {
		if (month) {
			return month.days;
		} else {
			return 31;
		}
	}, [month]);

	return (
		<Stack spacing={2} width="100%">
			<Autocomplete
				size="small"
				options={FrequencyOptions}
				multiple={false}
				value={frequency}
				renderInput={(params) => {
					return <TextField {...params} label="Frequency" />;
				}}
				fullWidth
				onChange={(_, value) => setFrequency(value as Frequencies)}
			/>
			{frequency === "Weekly" && (
				<Autocomplete
					size="small"
					options={DaysOfWeek}
					value={dayOfWeek}
					multiple={false}
					renderInput={(params) => {
						return <TextField {...params} label="Day of Week" />;
					}}
					fullWidth
					isOptionEqualToValue={(
						option: DayOfWeekDef,
						value: DayOfWeekDef,
					) => option.value === value.value}
					getOptionLabel={(option: DayOfWeekDef) => option.day}
					onChange={(_, value: DayOfWeekDef) => setDayOfWeek(value)}
				/>
			)}
			{frequency === "Yearly" && (
				<Autocomplete
					size="small"
					options={Months}
					value={month}
					multiple={false}
					renderInput={(params) => {
						return <TextField {...params} label="Month" />;
					}}
					fullWidth
					isOptionEqualToValue={(
						option: MonthsDef,
						value: MonthsDef,
					) => option.value === value.value}
					getOptionLabel={(option: MonthsDef) => option.month}
					onChange={(_, value: MonthsDef) => setMonth(value)}
				/>
			)}
			{(frequency === "Monthly" || frequency === "Yearly") && (
				<TextField
					size="small"
					value={isNaN(dayOfMonth) ? "" : dayOfMonth}
					type="number"
					label="Day of Month"
					error={
						dayOfMonth
							? !(dayOfMonth <= daysInMonth && dayOfMonth > 0)
							: false
					}
					fullWidth
					onChange={(e) =>
						setDayOfMonth(parseInt(e.target.value, 10) ?? 0)
					}
				/>
			)}
			<TextField
				label="Time"
				size="small"
				value={time}
				type="time"
				fullWidth
				onChange={(e) => setTime(e.target.value)}
			/>
		</Stack>
	);
};
