import { BookOpen, Sparkles, Wrench } from "lucide-react";
import { useId } from "react";
import { type MCPConfig, splitMcpByType } from "@semoss/shared";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FormField,
	FormInput,
	FormSelect,
	FormTextarea,
	SelectItem,
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
} from "./custom-routine-schema";
import { ROUTINE_DAY_NAMES, ROUTINE_DAYS } from "./routine-schema";
import { RoutineTimeFields } from "./routine-time-fields";

interface CustomRoutineFieldsProps {
	/** The owner's skill catalog; the routine can load any of them. */
	skills: CatalogSkill[];
}

/** What, when, and where of one of the owner's routines, and the skills, knowledge and tools it uses. */
export function CustomRoutineFields({ skills }: CustomRoutineFieldsProps) {
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
		<FieldGroup className="min-w-0">
			<FormInput name="name" label="Name (required)" required />
			<FormTextarea
				name="prompt"
				label="What should it do? (required)"
				description="Write it the way you would ask your assistant, such as: summarize what my clients asked for since yesterday, grouped by client."
				rows={4}
			/>
			<FormSelect name="delivery" label="Send the result">
				{CUSTOM_ROUTINE_DELIVERIES.map((delivery) => (
					<SelectItem key={delivery} value={delivery}>
						{DELIVERY_LABELS[delivery]}
					</SelectItem>
				))}
			</FormSelect>
			<FormField
				control={form.control}
				name="days"
				render={({ field, fieldState }) => (
					<Field data-invalid={Boolean(fieldState.error)}>
						<FieldLabel id={`${id}-days-label`}>
							Run on (required)
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
									className="min-h-11 min-w-11"
								>
									{ROUTINE_DAY_NAMES[day].slice(0, 3)}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
						{fieldState.error && (
							<FieldError>{fieldState.error.message}</FieldError>
						)}
					</Field>
				)}
			/>
			<RoutineTimeFields />
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
					const { knowledge, toolbox } = splitMcpByType(field.value);
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
							field.value.filter((tool) => tool.id !== toolId),
						);
					return (
						<>
							{IS_ROUTINE_KNOWLEDGE_ENABLED && (
								<CapabilitySection
									title="Knowledge"
									description="Knowledge bases the routine can search, such as your team's policy documents."
									emptyText="No knowledge added."
									icon={BookOpen}
									items={knowledge}
									onRemove={remove}
								>
									<CapabilityPicker
										kind="KNOWLEDGE"
										values={knowledge}
										onChange={(values) =>
											save([...toolbox, ...values])
										}
									/>
								</CapabilitySection>
							)}
							<CapabilitySection
								title="Tools"
								description="Toolboxes the routine can use, such as a database. A tool that asks for your approval does not run in a routine."
								emptyText="No tools added."
								icon={Wrench}
								items={toolbox}
								onRemove={remove}
							>
								<CapabilityPicker
									kind="TOOLBOX"
									values={toolbox}
									onChange={(values) =>
										save([...values, ...knowledge])
									}
								/>
							</CapabilitySection>
						</>
					);
				}}
			/>
		</FieldGroup>
	);
}
