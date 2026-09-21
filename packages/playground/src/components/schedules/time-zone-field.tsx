import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Field,
	FieldError,
	FieldLabel,
	FormField,
	Popover,
	PopoverContent,
	PopoverTrigger,
	useFormContext,
} from "@semoss/ui/next";

/** Describe an IANA zone using its city and current UTC offset. */
const describeTimeZone = (value: string, date: Date) => {
	const offset =
		new Intl.DateTimeFormat("en", {
			timeZone: value,
			timeZoneName: "longOffset",
		})
			.formatToParts(date)
			.find((part) => part.type === "timeZoneName")
			?.value.replace("GMT", "UTC") || "UTC";
	const name = value.split("/").at(-1)?.replaceAll("_", " ") || value;
	const parts = offset.match(/([+-])(\d{2}):(\d{2})/);
	const minutes = parts
		? (Number(parts[2]) * 60 + Number(parts[3])) *
			(parts[1] === "-" ? -1 : 1)
		: 0;
	return {
		value,
		minutes,
		label: `(${offset === "UTC" ? "UTC+00:00" : offset}) ${name}`,
	};
};

/** Searchable time-zone field bound to the scheduling form. */
export const TimeZoneField = ({ disabled }: { disabled?: boolean }) => {
	const { control, watch } = useFormContext<{ timezone: string }>();
	const selected = watch("timezone");
	const [open, setOpen] = useState(false);
	const id = useId();
	const options = useMemo(() => {
		const date = new Date();
		const zones = new Set(Intl.supportedValuesOf("timeZone"));
		zones.add("UTC");
		if (selected) zones.add(selected);
		return Array.from(zones)
			.map((zone) => describeTimeZone(zone, date))
			.sort(
				(a, b) =>
					a.minutes - b.minutes || a.label.localeCompare(b.label),
			);
	}, [selected]);

	return (
		<FormField
			control={control}
			name="timezone"
			render={({ field, fieldState }) => (
				<Field className="min-w-0" data-invalid={!!fieldState.error}>
					<FieldLabel htmlFor={id}>Time zone</FieldLabel>
					<Popover open={open} onOpenChange={setOpen} modal>
						<PopoverTrigger asChild>
							<Button
								id={id}
								ref={field.ref}
								onBlur={field.onBlur}
								type="button"
								variant="outline"
								disabled={disabled}
								aria-invalid={!!fieldState.error}
								aria-describedby={
									fieldState.error ? `${id}-error` : undefined
								}
								className="w-full justify-between font-normal"
								title={
									options.find(
										(option) =>
											option.value === field.value,
									)?.label
								}
							>
								<span className="truncate">
									{options.find(
										(option) =>
											option.value === field.value,
									)?.label || "Select time zone"}
								</span>
								<ChevronsUpDownIcon
									aria-hidden
									className="size-4 shrink-0 text-muted-foreground"
								/>
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="start"
							className="flex max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) flex-col overflow-hidden p-0"
						>
							<Command className="min-h-0">
								<CommandInput
									aria-label="Search time zones"
									placeholder="Search city or time zone…"
								/>
								<CommandList className="h-60 max-h-60 overscroll-contain">
									<CommandEmpty>
										No time zones found.
									</CommandEmpty>
									<CommandGroup>
										{options.map((option) => (
											<CommandItem
												key={option.value}
												value={option.value}
												keywords={[option.label]}
												onSelect={() => {
													field.onChange(
														option.value,
													);
													setOpen(false);
												}}
											>
												<span className="min-w-0 flex-1">
													{option.label}
												</span>
												{option.value ===
													field.value && (
													<CheckIcon
														aria-hidden
														className="size-4 shrink-0"
													/>
												)}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
					{fieldState.error && (
						<FieldError id={`${id}-error`}>
							{fieldState.error.message}
						</FieldError>
					)}
				</Field>
			)}
		/>
	);
};
