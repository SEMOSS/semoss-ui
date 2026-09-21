import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useId, useState } from "react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FormField,
	Popover,
	PopoverContent,
	PopoverTrigger,
	useFormContext,
} from "@semoss/ui/next";

interface SearchableSelectOption {
	value: string;
	label: string;
}

interface SearchableSelectFieldProps {
	name: string;
	label: string;
	description: string;
	placeholder: string;
	searchPlaceholder: string;
	emptyMessage: string;
	options: SearchableSelectOption[];
	disabled?: boolean;
}

/** Searchable single-select field for longer scheduling option lists. */
export const SearchableSelectField = ({
	name,
	label,
	description,
	placeholder,
	searchPlaceholder,
	emptyMessage,
	options,
	disabled,
}: SearchableSelectFieldProps) => {
	const { control } = useFormContext();
	const [open, setOpen] = useState(false);
	const id = useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const selected = options.find(
					(option) => option.value === field.value,
				);
				return (
					<Field
						className="min-w-0"
						data-invalid={!!fieldState.error}
					>
						<FieldLabel htmlFor={id}>{label}</FieldLabel>
						<Popover open={open} onOpenChange={setOpen} modal>
							<PopoverTrigger asChild>
								<Button
									id={id}
									ref={field.ref}
									type="button"
									role="combobox"
									variant="outline"
									aria-expanded={open}
									aria-invalid={!!fieldState.error}
									disabled={disabled}
									onBlur={field.onBlur}
									className="w-full justify-between font-normal"
								>
									<span className="truncate">
										{selected?.label || placeholder}
									</span>
									<ChevronsUpDownIcon
										aria-hidden
										className="size-4 shrink-0 text-muted-foreground"
									/>
								</Button>
							</PopoverTrigger>
							<PopoverContent
								align="start"
								className="w-(--radix-popover-trigger-width) p-0"
							>
								<Command>
									<CommandInput
										placeholder={searchPlaceholder}
									/>
									<CommandList className="max-h-60 overscroll-contain">
										<CommandEmpty>
											{emptyMessage}
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
													<span className="min-w-0 flex-1 truncate">
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
						<FieldDescription>{description}</FieldDescription>
						{fieldState.error?.message && (
							<FieldError>{fieldState.error.message}</FieldError>
						)}
					</Field>
				);
			}}
		/>
	);
};
