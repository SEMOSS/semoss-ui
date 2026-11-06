import { BookOpen, FileText, Sparkles, Wrench } from "lucide-react";
import { type ReactNode, useId } from "react";
import { type MCPConfig, splitMcpByType } from "@semoss/shared";
import {
	cn,
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
	FormField,
	FormInput,
	FormTextarea,
	H3,
	P,
	RadioGroup,
	RadioGroupItem,
	ToggleGroup,
	ToggleGroupItem,
	useFormContext,
} from "@semoss/ui/next";
import { CapabilityPicker } from "@/features/agents/components/capability-picker";
import { CapabilitySection } from "@/features/agents/components/capability-section";
import {
	type CatalogSkill,
	CUSTOM_ROUTINE_DELIVERIES,
	type CustomRoutineSettings,
	DELIVERY_LABELS,
	IS_ROUTINE_KNOWLEDGE_ENABLED,
	MAX_ROUTINE_TOOLS,
} from "./custom-routine-schema";
import { ROUTINE_DAY_NAMES, ROUTINE_DAYS } from "./routine-schema";
import { RoutineTimeFields } from "./routine-time-fields";

/** What each delivery means, under its choice. */
const DELIVERY_DETAILS = {
	email: "In your inbox, with any files it makes attached.",
	teams: "A message in your own Teams chat. Text only.",
	none: "Only here, under Latest result.",
} as const;

// a chosen day must read as chosen at a glance; the outline toggle's pale accent fill barely shows on a card
const CHOSEN_DAY =
	"data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground";

interface CustomRoutineFieldsProps {
	/** The owner's skill catalog; the routine can load any of them. */
	skills: CatalogSkill[];
	/**
	 * The routine's reference documents, or null while they are not shown. Leave it out for a routine that is not saved
	 * yet, which has none.
	 */
	files?: ReactNode;
}

/** A routine's setup as four questions: what it does, when it runs, where the result goes, and what it can use. */
export function CustomRoutineFields({
	skills,
	files,
}: CustomRoutineFieldsProps) {
	const id = useId();
	const form = useFormContext<CustomRoutineSettings>();
	const skillNames = new Map(skills.map((skill) => [skill.id, skill.name]));
	const skillOptions = {
		options: skills.map((skill) => ({
			name: skill.name,
			value: skill.id,
			detail: skill.description,
		})),
		isLoading: false,
		error: null,
	};
	return (
		<div className="flex min-w-0 max-w-3xl flex-col gap-10">
			<FieldSet className="min-w-0">
				<FieldLegend>What should it do?</FieldLegend>
				<FieldGroup className="min-w-0">
					<FormInput name="name" label="Name (required)" required />
					<FormTextarea
						name="prompt"
						label="Task (required)"
						description="Write it the way you would ask your assistant, such as: summarize what my clients asked for since yesterday, grouped by client."
						rows={5}
					/>
				</FieldGroup>
			</FieldSet>
			<FieldSet className="min-w-0">
				<FieldLegend>When should it run?</FieldLegend>
				<FieldGroup className="min-w-0">
					<FormField
						control={form.control}
						name="days"
						render={({ field, fieldState }) => (
							<Field data-invalid={Boolean(fieldState.error)}>
								<FieldLabel id={`${id}-days-label`}>
									Days (required)
								</FieldLabel>
								<ToggleGroup
									type="multiple"
									variant="outline"
									spacing={1}
									className="flex-wrap"
									value={field.value}
									onValueChange={field.onChange}
									onBlur={field.onBlur}
									aria-labelledby={`${id}-days-label`}
									aria-invalid={Boolean(fieldState.error)}
								>
									{ROUTINE_DAYS.map((day) => (
										<ToggleGroupItem
											key={day}
											value={day}
											aria-label={ROUTINE_DAY_NAMES[day]}
											className={cn(
												"min-h-11 min-w-11",
												CHOSEN_DAY,
											)}
										>
											{ROUTINE_DAY_NAMES[day].slice(0, 3)}
										</ToggleGroupItem>
									))}
								</ToggleGroup>
								{fieldState.error && (
									<FieldError>
										{fieldState.error.message}
									</FieldError>
								)}
							</Field>
						)}
					/>
					<RoutineTimeFields />
				</FieldGroup>
			</FieldSet>
			<FieldSet className="min-w-0">
				<FieldLegend id={`${id}-delivery`}>
					Where should the result go?
				</FieldLegend>
				<FormField
					control={form.control}
					name="delivery"
					render={({ field }) => (
						<RadioGroup
							aria-labelledby={`${id}-delivery`}
							name={field.name}
							value={field.value}
							onValueChange={field.onChange}
							className="grid gap-3 md:grid-cols-3"
						>
							{CUSTOM_ROUTINE_DELIVERIES.map((delivery) => (
								<FieldLabel
									key={delivery}
									htmlFor={`${id}-delivery-${delivery}`}
								>
									<Field orientation="horizontal">
										<RadioGroupItem
											value={delivery}
											id={`${id}-delivery-${delivery}`}
										/>
										<FieldContent>
											<FieldTitle>
												{DELIVERY_LABELS[delivery]}
											</FieldTitle>
											<FieldDescription>
												{DELIVERY_DETAILS[delivery]}
											</FieldDescription>
										</FieldContent>
									</Field>
								</FieldLabel>
							))}
						</RadioGroup>
					)}
				/>
			</FieldSet>
			<FieldSet className="min-w-0">
				<FieldLegend>What can it use?</FieldLegend>
				<FieldDescription>
					Skills shape how it works, tools reach your other systems,
					and files give it reference material. All are optional.
				</FieldDescription>
				<div className="flex min-w-0 flex-col gap-6">
					<FormField
						control={form.control}
						name="skills"
						render={({ field }) => {
							// a skill the owner lost access to keeps a row, so they can remove it
							const attached = field.value.map((skillId) => ({
								id: skillId,
								name:
									skillNames.get(skillId) ??
									"A skill you can no longer use",
								type: "PROJECT" as const,
							}));
							return (
								<CapabilitySection
									title="Skills"
									description="Instructions from your skill catalog that the routine follows, such as the layout of its result."
									emptyText="No skills added."
									icon={Sparkles}
									items={attached}
									onRemove={(skillId) =>
										field.onChange(
											field.value.filter(
												(value) => value !== skillId,
											),
										)
									}
								>
									<CapabilityPicker
										kind="SKILL"
										values={attached}
										onChange={(values) =>
											field.onChange(
												values.map((value) => value.id),
											)
										}
										skills={skillOptions}
									/>
								</CapabilitySection>
							);
						}}
					/>
					<FormField
						control={form.control}
						name="tools"
						render={({ field }) => {
							// knowledge bases and toolboxes share the routine's tools, as they share a room's mcp list
							const { knowledge, toolbox } = splitMcpByType(
								field.value,
							);
							// only these fields are saved; a catalog row carries more
							const save = (values: MCPConfig[]) =>
								field.onChange(
									values.map(({ id, name, type }) => ({
										id,
										name,
										type,
									})),
								);
							const remove = (toolId: string) =>
								field.onChange(
									field.value.filter(
										(tool) => tool.id !== toolId,
									),
								);
							// the server refuses more, hidden knowledge included; removing stays open
							const isFull =
								field.value.length >= MAX_ROUTINE_TOOLS;
							const limit = isFull
								? `A routine can use up to ${MAX_ROUTINE_TOOLS} tools and knowledge bases. Remove one to add another.`
								: null;
							return (
								<>
									{IS_ROUTINE_KNOWLEDGE_ENABLED && (
										<CapabilitySection
											title="Knowledge"
											description={
												limit ??
												"Knowledge bases the routine can search, such as your team's policy documents."
											}
											emptyText="No knowledge added."
											icon={BookOpen}
											items={knowledge}
											onRemove={remove}
										>
											<CapabilityPicker
												kind="KNOWLEDGE"
												values={knowledge}
												disabled={isFull}
												onChange={(values) =>
													save([
														...toolbox,
														...values,
													])
												}
											/>
										</CapabilitySection>
									)}
									<CapabilitySection
										title="Tools"
										description={
											limit ??
											"Toolboxes the routine can use, such as a database. A tool that asks for your approval does not run in a routine."
										}
										emptyText="No tools added."
										icon={Wrench}
										items={toolbox}
										onRemove={remove}
									>
										<CapabilityPicker
											kind="TOOLBOX"
											values={toolbox}
											disabled={isFull}
											onChange={(values) =>
												save([...values, ...knowledge])
											}
										/>
									</CapabilitySection>
								</>
							);
						}}
					/>
					<section
						aria-labelledby={`${id}-files`}
						className="flex min-w-0 flex-col gap-3"
					>
						<div className="flex items-start gap-3">
							<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
								<FileText
									className="size-4"
									aria-hidden="true"
								/>
							</div>
							<div className="min-w-0 flex-1">
								<H3
									id={`${id}-files`}
									className="font-medium text-base"
								>
									Files
								</H3>
								<P className="mt-1 text-muted-foreground text-sm">
									Reference files the routine reads on every
									run, such as a template or a policy. Only
									you see them.
									{files === undefined &&
										" You can add them once the routine is created."}
								</P>
							</div>
						</div>
						{files}
					</section>
				</div>
			</FieldSet>
		</div>
	);
}
