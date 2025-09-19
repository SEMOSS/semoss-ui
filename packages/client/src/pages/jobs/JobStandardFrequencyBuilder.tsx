import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Stack, TextField } from "@semoss/ui";
import { DaysOfWeek, FrequencyOptions, Months } from "./job.constants";
import type { DayOfWeek, Frequencies, JobBuilder, Month } from "./job.types";

export const JobStandardFrequencyBuilder = (props: {
	builder: JobBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
	const { builder, setBuilderField } = props;

	// Flag to prevent circular updates
	const isParsingCron = useRef(false);

	const [frequency, setFrequency] = useState<Frequencies>("Daily");
	const [time, setTime] = useState<string>("12:00");
	const [dayOfWeek, setDayOfWeek] = useState<{
		day: DayOfWeek;
		value: 0 | 1 | 2 | 3 | 4 | 5 | 6;
	}>(DaysOfWeek[0]);
	const [dayOfMonth, setDayOfMonth] = useState<number>(1);
	const [month, setMonth] = useState<{
		month: Month;
		value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
		days: 28 | 29 | 30 | 31;
	}>(Months[0]);

	useEffect(() => {
		const cronValues = builder.cronExpression.split(" ");
		if (cronValues.length < 6) {
			// make sure it's valid cron syntax
			return;
		} else if (
			Number.isNaN(parseInt(cronValues[1])) ||
			Number.isNaN(parseInt(cronValues[2]))
		) {
			// make sure there's a valid numbered time
			return;
		}

		// Set flag to prevent circular updates
		isParsingCron.current = true;

		// set time - cronValues[2] is hours, cronValues[1] is minutes
		const hours = cronValues[2].padStart(2, "0");
		const minutes = cronValues[1].padStart(2, "0");
		setTime(`${hours}:${minutes}`);

		// check frequency type
		if (
			cronValues[3] === "*" &&
			cronValues[4] === "*" &&
			(cronValues[5] === "*" || cronValues[5] === "?")
		) {
			setFrequency("Daily");
		} else if (
			(cronValues[3] === "*" || cronValues[3] === "?") &&
			cronValues[4] === "*"
		) {
			setFrequency("Weekly");
			const dayOfWeekValue = parseInt(cronValues[5]);
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
			const dayOfMonthValue = parseInt(cronValues[3]);
			if (dayOfMonthValue <= 31 && dayOfMonthValue >= 1) {
				setDayOfMonth(dayOfMonthValue);
			}
		} else if (cronValues[5] === "*" || cronValues[5] === "?") {
			setFrequency("Yearly");
			const dayOfMonthValue = parseInt(cronValues[3]);
			if (dayOfMonthValue <= 31 && dayOfMonthValue >= 1) {
				setDayOfMonth(dayOfMonthValue);
			}
			const monthValue = parseInt(cronValues[4]);
			const monthRecord = Months.find(
				(record) => record.value === monthValue,
			);
			if (monthRecord) {
				setMonth(monthRecord);
			}
		}

		// Reset flag after state updates have been queued
		setTimeout(() => {
			isParsingCron.current = false;
		}, 0);
	}, [builder.cronExpression]);
	useEffect(() => {
		// Don't update cron expression if we're currently parsing one
		if (isParsingCron.current) {
			return;
		}

		const [hour, minute] = time ? time.split(":") : ["0", "0"];
		const hourNum = parseInt(hour);
		const minuteNum = parseInt(minute);

		switch (frequency) {
			case "Daily":
				setBuilderField(
					"cronExpression",
					`0 ${minuteNum} ${hourNum} * * ? *`,
				);
				break;
			case "Weekly":
				setBuilderField(
					"cronExpression",
					`0 ${minuteNum} ${hourNum} ? * ${dayOfWeek.value}`,
				);
				break;
			case "Monthly":
				setBuilderField(
					"cronExpression",
					`0 ${minuteNum} ${hourNum} ${dayOfMonth} * ? *`,
				);
				break;
			case "Yearly":
				setBuilderField(
					"cronExpression",
					`0 ${minuteNum} ${hourNum} ${dayOfMonth} ${month.value} ? *`,
				);
				break;
		}
	}, [
		frequency,
		time,
		dayOfWeek.value,
		dayOfMonth,
		month.value,
		setBuilderField,
	]);

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
				value={frequency}
				multiple={false}
				renderInput={(params) => {
					return <TextField {...params} label="Frequency" />;
				}}
				fullWidth
				onChange={(_, value) => setFrequency(value as Frequencies)}
			/>
			{frequency === "Weekly" ? (
				<Autocomplete
					size="small"
					options={DaysOfWeek}
					value={dayOfWeek as any} // Type assertion needed due to complex generic inference with MUI Autocomplete
					multiple={false}
					renderInput={(params) => {
						return <TextField {...params} label="Day of Week" />;
					}}
					fullWidth
					isOptionEqualToValue={(option, value) =>
						option.value === value.value
					}
					getOptionLabel={(option) => option.day}
					onChange={(_, value) => setDayOfWeek(value)}
				/>
			) : null}
			{frequency === "Yearly" ? (
				<Autocomplete
					size="small"
					options={Months}
					value={month as any} // Type assertion needed due to complex generic inference with MUI Autocomplete
					multiple={false}
					renderInput={(params) => {
						return <TextField {...params} label="Month" />;
					}}
					fullWidth
					isOptionEqualToValue={(option, value) =>
						option.value === value.value
					}
					getOptionLabel={(option) => option.month}
					onChange={(_, value) => setMonth(value)}
				/>
			) : null}
			{frequency === "Monthly" || frequency === "Yearly" ? (
				<TextField
					size="small"
					value={Number.isNaN(dayOfMonth) ? "" : dayOfMonth}
					type="number"
					label="Day of Month"
					error={
						dayOfMonth
							? !(dayOfMonth <= daysInMonth && dayOfMonth > 0)
							: false
					}
					fullWidth
					onChange={(e) =>
						setDayOfMonth(parseInt(e.target.value) ?? 0)
					}
				/>
			) : null}
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
