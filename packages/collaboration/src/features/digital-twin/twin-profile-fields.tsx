import { Sparkles, Wrench } from "lucide-react";
import {
	FieldGroup,
	FormField,
	FormInput,
	FormTextarea,
	useFormContext,
} from "@semoss/ui/next";
import { CapabilityPicker } from "@/features/agents/components/capability-picker";
import { CapabilitySection } from "@/features/agents/components/capability-section";
import type { CatalogSkill } from "@/features/routines/custom-routine-schema";
import type { TwinProfile } from "./api/digital-twin";
import { TwinImageField } from "./twin-image-field";

/** The profile's fields, as the create flow splits them over its steps. */
export type TwinFieldGroup = "identity" | "voice" | "abilities";

interface TwinProfileFieldsProps {
	/** The fields to show: one group, as a step of the create flow does, or all of them when left out. */
	group?: TwinFieldGroup;
	/** The owner's skill catalog; the twin can follow any of them. */
	skills: CatalogSkill[];
	/** The saved twin's image, shown until another is chosen. */
	imageUrl?: string;
}

/**
 * A Digital Twin's profile fields, for the form around them: who it is (image
 * and name), how it answers (instructions and greeting), and what it can use
 * (skills and toolboxes).
 */
export function TwinProfileFields({
	group,
	skills,
	imageUrl,
}: TwinProfileFieldsProps) {
	const form = useFormContext<TwinProfile>();
	const { isSubmitting } = form.formState;
	const shows = (candidate: TwinFieldGroup): boolean =>
		!group || group === candidate;
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
		<div className="flex min-w-0 flex-col gap-8">
			{(shows("identity") || shows("voice")) && (
				<FieldGroup className="min-w-0">
					{shows("identity") && (
						<>
							<TwinImageField imageUrl={imageUrl} />
							<FormInput
								name="name"
								label="Name (required)"
								required
								disabled={isSubmitting}
								description="What people see. Start with a letter, then use letters, numbers, spaces, hyphens and underscores."
							/>
						</>
					)}
					{shows("voice") && (
						<>
							<FormTextarea
								name="instructions"
								label="Instructions"
								disabled={isSubmitting}
								rows={10}
								description="How your twin answers. The people you share it with can read these."
							/>
							<FormTextarea
								name="greeting"
								label="Greeting"
								disabled={isSubmitting}
								rows={3}
								description="The first thing people see when they start a chat with your twin. Leave it empty for none."
							/>
						</>
					)}
				</FieldGroup>
			)}
			{shows("abilities") && (
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
									description="Instructions from your skill catalog that your twin follows. They run for everyone you share it with."
									emptyText="No skills added."
									icon={Sparkles}
									items={attached}
									disabled={isSubmitting}
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
						name="toolboxes"
						render={({ field }) => (
							<CapabilitySection
								title="Toolboxes"
								description="Toolboxes your twin can use, such as a database. One works only for the people who already have access to it."
								emptyText="No toolboxes added."
								icon={Wrench}
								items={field.value}
								disabled={isSubmitting}
								onRemove={(toolId) =>
									field.onChange(
										field.value.filter(
											(tool) => tool.id !== toolId,
										),
									)
								}
							>
								<CapabilityPicker
									kind="TOOLBOX"
									values={field.value}
									// only these fields are saved; a catalog row carries more
									onChange={(values) =>
										field.onChange(
											values.map(
												({ id, name, type }) => ({
													id,
													name,
													type,
												}),
											),
										)
									}
								/>
							</CapabilitySection>
						)}
					/>
				</div>
			)}
		</div>
	);
}
