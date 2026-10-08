import { ChevronDown, ChevronUp } from "lucide-react";
import { useId } from "react";
import {
	Button,
	Checkbox,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FormCheckbox,
	FormField,
	FormInput,
	FormSelect,
	FormTextarea,
	H3,
	P,
	SelectItem,
	useFormContext,
} from "@semoss/ui/next";
import type { TopicOrganizationProposal } from "./topic-organization-api";
import type { TopicOrganizationProposalValues } from "./topic-organization-proposal-form";
import type { TopicDraft } from "./topic-review-api";

interface TopicOrganizationGroupEditorProps {
	index: number;
	original: TopicOrganizationProposal["groups"][number];
	topics: TopicDraft[];
	isExpanded: boolean;
	isBusy: boolean;
	onToggle: () => void;
}

/** Compact assistant proposal with owner-editable scope, contributing topics and retained identity. */
export function TopicOrganizationGroupEditor({
	index,
	original,
	topics,
	isExpanded,
	isBusy,
	onToggle,
}: TopicOrganizationGroupEditorProps) {
	const id = useId();
	const form = useFormContext<TopicOrganizationProposalValues>();
	const value = form.watch(`groups.${index}`);
	const candidates = topics.filter((topic) =>
		original.topicKeys.includes(topic.key),
	);
	return (
		<section
			className="space-y-3 border-t pt-4"
			aria-labelledby={`${id}-heading`}
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<H3 id={`${id}-heading`} className="min-w-0 flex-1 text-base">
					<Button
						type="button"
						variant="ghost"
						className="h-auto min-h-11 w-full justify-start whitespace-normal text-left"
						aria-expanded={isExpanded}
						aria-controls={`${id}-editor`}
						aria-label={`Edit proposed ${value.name || "topic"}`}
						disabled={isBusy}
						onClick={onToggle}
					>
						<span className="min-w-0 flex-1 break-words">
							{value.name || "New topic"}
						</span>
						{isExpanded ? (
							<ChevronUp aria-hidden="true" />
						) : (
							<ChevronDown aria-hidden="true" />
						)}
					</Button>
				</H3>
				<FormCheckbox
					name={`groups.${index}.selected`}
					label={`Use ${value.name || "this proposal"}`}
					disabled={isBusy}
				/>
			</div>
			<P className="break-words text-muted-foreground text-sm">
				{original.reason}
			</P>
			<P className="break-words text-sm">
				{value.topicKeys
					.map(
						(key) =>
							topics.find((topic) => topic.key === key)?.name,
					)
					.filter(Boolean)
					.join(" · ")}
			</P>
			<div id={`${id}-editor`} hidden={!isExpanded}>
				{isExpanded && (
					<div className="space-y-4">
						<FormInput
							name={`groups.${index}.name`}
							label="Proposed topic name"
							required={value.selected}
							maxLength={255}
							disabled={isBusy || !value.selected}
						/>
						<FormTextarea
							name={`groups.${index}.description`}
							label="What the proposed topic covers"
							rows={3}
							maxLength={12000}
							disabled={isBusy || !value.selected}
						/>
						<FormTextarea
							name={`groups.${index}.terms`}
							label="Proposed project names and clues"
							rows={2}
							maxLength={4000}
							disabled={isBusy || !value.selected}
						/>
						<FormField
							control={form.control}
							name={`groups.${index}.topicKeys`}
							render={({ field, fieldState }) => (
								<FieldSet
									aria-describedby={
										fieldState.error
											? `${id}-choices-error`
											: undefined
									}
								>
									<FieldLegend>
										Topics contributing to this scope
									</FieldLegend>
									{candidates.map((topic, item) => (
										<div
											key={topic.key}
											className="flex items-center gap-2"
										>
											<Checkbox
												id={`${id}-choice-${item}`}
												ref={
													item === 0
														? field.ref
														: undefined
												}
												aria-invalid={
													!!fieldState.error
												}
												aria-describedby={
													fieldState.error
														? `${id}-choices-error`
														: undefined
												}
												disabled={
													isBusy || !value.selected
												}
												checked={field.value.includes(
													topic.key,
												)}
												onBlur={field.onBlur}
												onCheckedChange={(
													isChecked,
												) => {
													const keys =
														isChecked === true
															? [
																	...field.value,
																	topic.key,
																]
															: field.value.filter(
																	(key) =>
																		key !==
																		topic.key,
																);
													field.onChange(keys);
													if (
														!keys.includes(
															value.targetKey,
														)
													)
														form.setValue(
															`groups.${index}.targetKey`,
															keys[0] ?? "",
															{
																shouldDirty: true,
															},
														);
												}}
											/>
											<FieldLabel
												htmlFor={`${id}-choice-${item}`}
											>
												{topic.name || "New topic"}
											</FieldLabel>
										</div>
									))}
									{fieldState.error?.message && (
										<FieldError id={`${id}-choices-error`}>
											{fieldState.error.message}
										</FieldError>
									)}
								</FieldSet>
							)}
						/>
						<FormSelect
							name={`groups.${index}.targetKey`}
							label="Profile to retain"
							disabled={isBusy || !value.selected}
						>
							{candidates
								.filter((topic) =>
									value.topicKeys.includes(topic.key),
								)
								.map((topic) => (
									<SelectItem
										key={topic.key}
										value={topic.key}
									>
										{topic.name || "New topic"}
									</SelectItem>
								))}
						</FormSelect>
					</div>
				)}
			</div>
		</section>
	);
}
