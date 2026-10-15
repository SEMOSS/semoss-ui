import { useId, useRef } from "react";
import {
	Button,
	Checkbox,
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	Small,
} from "@semoss/ui/next";
import { type AgendaMeetingOption, meetingKey } from "./agenda-meeting-options";

interface AgendaMeetingListProps {
	/** Names the list for assistive technology, such as "Recurring meetings". */
	label: string;
	/** Shown when the list has no meetings. */
	emptyText: string;
	/** The list's meetings, soonest first, without ignored ones. */
	options: AgendaMeetingOption[];
	/** Keys of the chosen meetings, from meetingKey. */
	chosen: ReadonlySet<string>;
	/** One line under a meeting, such as when it next meets. */
	describe: (option: AgendaMeetingOption) => string;
	/** Locks every control while a save is pending. */
	disabled: boolean;
	/** No more meetings can be chosen, so unchosen rows are locked. */
	limitReached: boolean;
	/** No more meetings can be ignored. */
	ignoreLimitReached: boolean;
	/** Marks the checkboxes invalid while the field has an error. */
	invalid: boolean;
	/** Focus target for a validation error, set on the first row. */
	inputRef?: (element: HTMLButtonElement | null) => void;
	/** Receives a meeting checked or cleared. */
	onToggle: (title: string, checked: boolean) => void;
	/** Receives a meeting to hide from the lists. */
	onIgnore: (title: string) => void;
	/** Marks the field touched when focus leaves a checkbox. */
	onBlur: () => void;
}

/** A scrolling list of meetings to choose or ignore, chosen ones first. */
export function AgendaMeetingList({
	label,
	emptyText,
	options,
	chosen,
	describe,
	disabled,
	limitReached,
	ignoreLimitReached,
	invalid,
	inputRef,
	onToggle,
	onIgnore,
	onBlur,
}: AgendaMeetingListProps) {
	const id = useId();
	const boxRef = useRef<HTMLDivElement>(null);
	const isChosen = (option: AgendaMeetingOption) =>
		chosen.has(meetingKey(option.title));
	const sorted = [
		...options.filter(isChosen),
		...options.filter((option) => !isChosen(option)),
	];

	// the box stays mounted when empty, so focus has somewhere to land after the last row goes
	return (
		<div
			ref={boxRef}
			tabIndex={-1}
			className="max-h-80 overflow-y-auto rounded-md border p-3 outline-none"
		>
			{sorted.length === 0 && (
				<Small className="text-muted-foreground">{emptyText}</Small>
			)}
			<ul aria-label={label} className="flex flex-col gap-3">
				{sorted.map((option, index) => {
					const checked = isChosen(option);
					return (
						<li key={meetingKey(option.title)}>
							<Field
								orientation="horizontal"
								className="items-start"
							>
								<Checkbox
									id={`${id}-${index}`}
									ref={index === 0 ? inputRef : undefined}
									checked={checked}
									onCheckedChange={(next) =>
										onToggle(option.title, next === true)
									}
									onBlur={onBlur}
									disabled={
										disabled || (!checked && limitReached)
									}
									aria-invalid={invalid}
									aria-describedby={`${id}-${index}-when`}
								/>
								<FieldContent className="min-w-0">
									<FieldLabel
										htmlFor={`${id}-${index}`}
										className="break-words font-normal"
									>
										{option.title}
									</FieldLabel>
									<FieldDescription
										id={`${id}-${index}-when`}
									>
										{describe(option)}
									</FieldDescription>
								</FieldContent>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="shrink-0 text-muted-foreground"
									disabled={disabled || ignoreLimitReached}
									aria-label={`Ignore ${option.title}`}
									onClick={() => {
										onIgnore(option.title);
										// the row is gone, so focus stays on its list
										boxRef.current?.focus();
									}}
								>
									Ignore
								</Button>
							</Field>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
