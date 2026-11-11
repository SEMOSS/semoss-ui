import { useId } from "react";
import {
	Field,
	FieldContent,
	FieldLabel,
	Input,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import {
	DaysOfWeek,
	FrequencyOptions,
	Months,
	timezones,
} from "./job.constants";
import type { Frequencies, JobBuilder } from "./job.types";
import { buildCron, buildStandardCron, parseCron } from "./job.utils";
import { RequiredMark } from "./required-mark";

// "?" is Quartz's "no specific value", used where a day field gives way to the other
const isWildcard = (val: string) => val === "*" || val === "?";

interface JobTimeZoneProps {
	/** The job being added or edited */
	builder: JobBuilder;

	/** Set one field of the job */
	setBuilderField: (
		field: keyof JobBuilder,
		value: string | string[] | boolean,
	) => void;

	/** Standard picks a common frequency; Custom gives full cron control */
	scheduleType: "Standard" | "Custom";

	/** How a Custom schedule is entered: dropdowns or a cron expression */
	customMode: "dropdown" | "expression";

	/** Switch how a Custom schedule is entered */
	setCustomMode: (mode: "dropdown" | "expression") => void;
}

/**
 * The job's time zone and schedule. Every control writes the cron expression
 * back to the job, so it stays the one source of truth for the schedule.
 */
export const JobTimeZone = (props: JobTimeZoneProps) => {
	const {
		builder,
		setBuilderField,
		scheduleType,
		customMode,
		setCustomMode,
	} = props;

	const dropdownModeId = useId();
	const expressionModeId = useId();

	const parsed = parseCron(builder.cronExpression);

	const minutes = Array.from({ length: 60 }, (_, i) => `${i}`);
	const hours = Array.from({ length: 24 }, (_, i) => `${i}`);
	const daysOfMonth = Array.from({ length: 31 }, (_, i) => `${i + 1}`);

	const timeZoneSelect = (
		<Field className="w-full">
			<FieldLabel>
				Time Zone <RequiredMark />
			</FieldLabel>
			<FieldContent>
				<Select
					value={builder.cronTz}
					onValueChange={(v) => setBuilderField("cronTz", v)}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select Timezone" />
					</SelectTrigger>
					<SelectContent>
						{timezones.map((tz: string) => (
							<SelectItem key={tz} value={tz}>
								{tz.replaceAll("_", " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</FieldContent>
		</Field>
	);

	if (scheduleType === "Standard") {
		const frequency: Frequencies = parsed.frequency ?? "Daily";
		const timeValue = `${parsed.hour.padStart(2, "0")}:${parsed.minute.padStart(2, "0")}`;

		const rebuildStandard = (next: {
			frequency?: Frequencies;
			hour?: string;
			minute?: string;
			dayOfWeek?: string;
			dayOfMonth?: string;
			month?: string;
		}) => {
			const freq = next.frequency ?? frequency;
			const hour = next.hour ?? parsed.hour;
			const minute = next.minute ?? parsed.minute;
			const dayOfWeek =
				next.dayOfWeek ??
				(isWildcard(parsed.dayOfWeek) ? "0" : parsed.dayOfWeek);
			const dayOfMonth =
				next.dayOfMonth ??
				(isWildcard(parsed.dayOfMonth) ? "1" : parsed.dayOfMonth);
			const month =
				next.month ?? (parsed.month === "*" ? "1" : parsed.month);
			setBuilderField(
				"cronExpression",
				buildStandardCron(freq, hour, minute, {
					dayOfWeek,
					dayOfMonth,
					month,
				}),
			);
		};

		const handleTimeChange = (value: string) => {
			const [h, m] = value.split(":");
			if (h === undefined || m === undefined) return;
			rebuildStandard({
				hour: String(parseInt(h, 10)),
				minute: String(parseInt(m, 10)),
			});
		};

		return (
			<div className="flex flex-col gap-6">
				<div className="flex gap-5">
					{timeZoneSelect}

					<Field className="w-full">
						<FieldLabel>
							Frequency <RequiredMark />
						</FieldLabel>
						<FieldContent>
							<Select
								value={frequency}
								onValueChange={(v) =>
									rebuildStandard({
										frequency: v as Frequencies,
									})
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select Frequency" />
								</SelectTrigger>
								<SelectContent>
									{FrequencyOptions.map((f: string) => (
										<SelectItem key={f} value={f}>
											{f}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FieldContent>
					</Field>
				</div>

				<Field>
					<FieldLabel>
						Time <RequiredMark />
					</FieldLabel>
					<FieldContent>
						<Input
							type="time"
							value={timeValue}
							onChange={(e) => handleTimeChange(e.target.value)}
						/>
					</FieldContent>
				</Field>

				{frequency === "Weekly" && (
					<Field>
						<FieldLabel>
							Day of Week <RequiredMark />
						</FieldLabel>
						<FieldContent>
							<Select
								value={
									isWildcard(parsed.dayOfWeek)
										? "0"
										: parsed.dayOfWeek
								}
								onValueChange={(v) =>
									rebuildStandard({ dayOfWeek: v })
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Day" />
								</SelectTrigger>
								<SelectContent>
									{DaysOfWeek.map((d) => (
										<SelectItem
											key={d.value}
											value={`${d.value}`}
										>
											{d.day}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FieldContent>
					</Field>
				)}

				{frequency === "Monthly" && (
					<Field>
						<FieldLabel>
							Day of Month <RequiredMark />
						</FieldLabel>
						<FieldContent>
							<Select
								value={
									isWildcard(parsed.dayOfMonth)
										? "1"
										: parsed.dayOfMonth
								}
								onValueChange={(v) =>
									rebuildStandard({ dayOfMonth: v })
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Day" />
								</SelectTrigger>
								<SelectContent>
									{daysOfMonth.map((d) => (
										<SelectItem key={d} value={d}>
											{d}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FieldContent>
					</Field>
				)}

				{frequency === "Yearly" && (
					<div className="flex gap-5">
						<Field className="w-full">
							<FieldLabel>
								Month <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										parsed.month === "*"
											? "1"
											: parsed.month
									}
									onValueChange={(v) =>
										rebuildStandard({ month: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Month" />
									</SelectTrigger>
									<SelectContent>
										{Months.map((m) => (
											<SelectItem
												key={m.value}
												value={`${m.value}`}
											>
												{m.month}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
						<Field className="w-full">
							<FieldLabel>
								Day of Month <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										isWildcard(parsed.dayOfMonth)
											? "1"
											: parsed.dayOfMonth
									}
									onValueChange={(v) =>
										rebuildStandard({ dayOfMonth: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Day" />
									</SelectTrigger>
									<SelectContent>
										{daysOfMonth.map((d) => (
											<SelectItem key={d} value={d}>
												{d}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
					</div>
				)}
			</div>
		);
	}

	const rebuildDropdown = (next: Partial<typeof parsed>) => {
		const merged = {
			minute: parsed.minute,
			hour: parsed.hour,
			dayOfMonth: parsed.dayOfMonth,
			month: parsed.month,
			dayOfWeek: parsed.dayOfWeek,
			...next,
		};
		if (next.dayOfMonth && !isWildcard(next.dayOfMonth)) {
			merged.dayOfWeek = "?";
		}
		if (next.dayOfWeek && !isWildcard(next.dayOfWeek)) {
			merged.dayOfMonth = "?";
		}
		setBuilderField("cronExpression", buildCron(merged));
	};

	return (
		<div className="flex flex-col gap-6">
			<Field>
				<FieldLabel>Schedule Builder</FieldLabel>
				<FieldContent>
					<RadioGroup
						value={customMode}
						onValueChange={(v) =>
							setCustomMode(v as "dropdown" | "expression")
						}
					>
						<div className="flex gap-6">
							<div className="flex items-center gap-2">
								<RadioGroupItem
									value="dropdown"
									id={dropdownModeId}
								/>
								<label
									htmlFor={dropdownModeId}
									className="cursor-pointer text-sm"
								>
									Use Dropdown For Schedule
								</label>
							</div>
							<div className="flex items-center gap-2">
								<RadioGroupItem
									value="expression"
									id={expressionModeId}
								/>
								<label
									htmlFor={expressionModeId}
									className="cursor-pointer text-sm"
								>
									Custom Cron Expression
								</label>
							</div>
						</div>
					</RadioGroup>
				</FieldContent>
			</Field>

			{customMode === "dropdown" && (
				<div className="flex flex-col gap-5">
					<div className="flex gap-5">
						{timeZoneSelect}

						<Field className="w-full">
							<FieldLabel>
								Minute <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										minutes.includes(parsed.minute)
											? parsed.minute
											: undefined
									}
									onValueChange={(v) =>
										rebuildDropdown({ minute: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Minute" />
									</SelectTrigger>
									<SelectContent>
										{minutes.map((m) => (
											<SelectItem key={m} value={m}>
												{m}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
					</div>

					<div className="flex gap-5">
						<Field className="w-full">
							<FieldLabel>
								Hour <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										hours.includes(parsed.hour)
											? parsed.hour
											: undefined
									}
									onValueChange={(v) =>
										rebuildDropdown({ hour: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Hour" />
									</SelectTrigger>
									<SelectContent>
										{hours.map((h) => (
											<SelectItem key={h} value={h}>
												{h}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>

						<Field className="w-full">
							<FieldLabel>
								Day of Month <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										isWildcard(parsed.dayOfMonth)
											? "*"
											: daysOfMonth.includes(
														parsed.dayOfMonth,
													)
												? parsed.dayOfMonth
												: undefined
									}
									onValueChange={(v) =>
										rebuildDropdown({ dayOfMonth: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Day" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="*">Any</SelectItem>
										{daysOfMonth.map((d) => (
											<SelectItem key={d} value={d}>
												{d}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
					</div>

					<div className="flex gap-5">
						<Field className="w-full">
							<FieldLabel>
								Month <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={parsed.month}
									onValueChange={(v) =>
										rebuildDropdown({ month: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Month" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="*">Any</SelectItem>
										{Months.map((m) => (
											<SelectItem
												key={m.value}
												value={`${m.value}`}
											>
												{m.month}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>

						<Field className="w-full">
							<FieldLabel>
								Day of Week <RequiredMark />
							</FieldLabel>
							<FieldContent>
								<Select
									value={
										isWildcard(parsed.dayOfWeek)
											? "?"
											: parsed.dayOfWeek
									}
									onValueChange={(v) =>
										rebuildDropdown({ dayOfWeek: v })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Day" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="?">Any</SelectItem>
										{DaysOfWeek.map((d) => (
											<SelectItem
												key={d.value}
												value={`${d.value}`}
											>
												{d.day}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FieldContent>
						</Field>
					</div>
				</div>
			)}

			{customMode === "expression" && (
				<div className="flex flex-col gap-5">
					{timeZoneSelect}

					<Field>
						<FieldLabel>
							Cron Expression <RequiredMark />
						</FieldLabel>
						<FieldContent>
							<Textarea
								rows={3}
								value={builder.cronExpression}
								onChange={(e) =>
									setBuilderField(
										"cronExpression",
										e.target.value,
									)
								}
							/>
						</FieldContent>
					</Field>
				</div>
			)}
		</div>
	);
};
