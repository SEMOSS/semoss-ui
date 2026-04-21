import { useEffect, useMemo, useState } from "react";
import {
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
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
		if (cronValues.length < 6) return;
		if (Number.isNaN(cronValues[1]) || Number.isNaN(cronValues[2])) return;

		setTime(
			`${cronValues[2] === "0" ? "00" : cronValues[2].padStart(2, "0")}:${
				cronValues[1] === "0" ? "00" : cronValues[1].padStart(2, "0")
			}`,
		);

		if (
			cronValues[3] === "*" &&
			cronValues[4] === "*" &&
			(cronValues[5] === "*" || cronValues[5] === "?")
		) {
			setFrequency("Daily");
		} else if (cronValues[3] === "*" && cronValues[4] === "*") {
			setFrequency("Weekly");
			const dayOfWeekRecord = DaysOfWeek.find(
				(r) => r.value === Number.parseInt(cronValues[5], 10),
			);
			if (dayOfWeekRecord) setDayOfWeek(dayOfWeekRecord);
		} else if (
			cronValues[4] === "*" &&
			(cronValues[5] === "*" || cronValues[5] === "?")
		) {
			setFrequency("Monthly");
			const d = Number.parseInt(cronValues[3], 10);
			if (d >= 1 && d <= 31) setDayOfMonth(d);
		} else if (cronValues[5] === "*" || cronValues[5] === "?") {
			setFrequency("Yearly");
			const d = Number.parseInt(cronValues[3], 10);
			if (d >= 1 && d <= 31) setDayOfMonth(d);
			const monthRecord = Months.find(
				(r) => r.value === Number.parseInt(cronValues[4], 10),
			);
			if (monthRecord) setMonth(monthRecord);
		}
	}, [cronExpression]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - these are the actual trigger deps
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
					`0 ${minute === "00" ? "0" : minute} ${hour} * * ${dayOfWeek.value}`,
				);
				break;
			case "Monthly":
				setBuilderField(
					"cronExpression",
					`0 ${minute === "00" ? "0" : minute} ${hour} ${dayOfMonth} * ? *`,
				);
				break;
			case "Yearly":
				setBuilderField(
					"cronExpression",
					`0 ${minute === "00" ? "0" : minute} ${hour} ${dayOfMonth} ${month.value} ? *`,
				);
				break;
		}
	}, [time, dayOfWeek.value, dayOfMonth, month.value, setBuilderField]);

	const daysInMonth: number = useMemo(
		() => (month ? month.days : 31),
		[month],
	);

	return (
		<div className="flex w-full flex-col gap-4">
			<Select
				value={frequency}
				onValueChange={(val) => setFrequency(val as Frequencies)}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Frequency" />
				</SelectTrigger>
				<SelectContent>
					{FrequencyOptions.map((opt) => (
						<SelectItem key={opt} value={opt}>
							{opt}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{frequency === "Weekly" && (
				<Select
					value={String(dayOfWeek.value)}
					onValueChange={(val) => {
						const found = DaysOfWeek.find(
							(d) => d.value === Number(val),
						);
						if (found) setDayOfWeek(found);
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Day of Week" />
					</SelectTrigger>
					<SelectContent>
						{DaysOfWeek.map((d) => (
							<SelectItem key={d.value} value={String(d.value)}>
								{d.day}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			{frequency === "Yearly" && (
				<Select
					value={String(month.value)}
					onValueChange={(val) => {
						const found = Months.find(
							(m) => m.value === Number(val),
						);
						if (found) setMonth(found);
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Month" />
					</SelectTrigger>
					<SelectContent>
						{Months.map((m) => (
							<SelectItem key={m.value} value={String(m.value)}>
								{m.month}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			{(frequency === "Monthly" || frequency === "Yearly") && (
				<div className="flex flex-col gap-1">
					<Label className="text-xs">Day of Month</Label>
					<Input
						type="number"
						value={Number.isNaN(dayOfMonth) ? "" : dayOfMonth}
						min={1}
						max={daysInMonth}
						className={
							dayOfMonth
								? !(dayOfMonth <= daysInMonth && dayOfMonth > 0)
									? "border-destructive"
									: ""
								: ""
						}
						onChange={(e) =>
							setDayOfMonth(Number.parseInt(e.target.value, 10))
						}
					/>
				</div>
			)}

			<div className="flex flex-col gap-1">
				<Label className="text-xs">Time</Label>
				<Input
					type="time"
					value={time}
					onChange={(e) => setTime(e.target.value)}
				/>
			</div>
		</div>
	);
};
