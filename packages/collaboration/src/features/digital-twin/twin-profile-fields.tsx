import { Sparkles, Wrench } from "lucide-react";
import {
	FieldGroup,
	FormField,
	FormInput,
	FormSwitch,
	FormTextarea,
	P,
	useFormContext,
} from "@semoss/ui/next";
import { CapabilityPicker } from "@/features/agents/components/capability-picker";
import { CapabilitySection } from "@/features/agents/components/capability-section";
import type { CatalogSkill } from "@/features/routines/custom-routine-schema";
import type { TwinProfile } from "./api/digital-twin";
import { TwinImageField } from "./twin-image-field";
import { TwinSkillCreate } from "./twin-skill-create";
import { TwinSkillView } from "./twin-skill-view";

/** Profile field groups used by the create flow and the saved profile editor. */
export type TwinFieldGroup =
	| "identity"
	| "voice"
	| "conversation"
	| "about"
	| "abilities";

interface TwinProfileFieldsProps {
	/** The fields to show: one group, as a step of the create flow does, or all of them when left out. */
	group?: TwinFieldGroup;
	/** The owner's skill catalog; the twin can follow any of them. */
	skills: CatalogSkill[];
	/** Keep a created skill available through every step and after saving. */
	onSkillCreated: (skill: CatalogSkill) => void;
	/** The saved twin's image, shown until another is chosen. */
	imageUrl?: string;
	/** The owner's note could not be read: it is not shown, and cannot be changed until it can. */
	isNoteUnread?: boolean;
	/** Whether the owner has a persona, which this twin can then be switched off from using. */
	hasPersona?: boolean;
}

/**
 * A Digital Twin's profile fields, for the form around them: who it is (image
 * and name), how it answers (its owner's persona, instructions, greeting and
 * their note about themself), and what it can use (skills and toolboxes).
 */
export function TwinProfileFields({
	group,
	skills,
	onSkillCreated,
	imageUrl,
	isNoteUnread = false,
	hasPersona = false,
}: TwinProfileFieldsProps) {
	const form = useFormContext<TwinProfile>();
	const isSubmitting = !imageUrl && form.formState.isSubmitting;
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
			{group !== "abilities" && (
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
					{shows("voice") &&
						(hasPersona ? (
							<FormSwitch
								name="usePersona"
								label="Use my persona"
								disabled={isSubmitting}
								description="On, this twin answers in your voice and can give its read of how you would see something. Off, it answers plainly from its copies."
							/>
						) : (
							<P className="text-muted-foreground text-sm">
								You have no persona yet. Write one from the
								Digital Twins page, and every twin you share
								answers in your voice.
							</P>
						))}
					{(shows("voice") || group === "conversation") && (
						<>
							<FormTextarea
								name="instructions"
								label="Instructions"
								disabled={isSubmitting}
								rows={group === "conversation" ? 4 : 10}
								description={
									group === "conversation"
										? "Tell your twin what to focus on. People you share it with can read these instructions."
										: `${
												hasPersona
													? "Anything this twin should do besides what your persona says."
													: "How your twin sounds and what it pays attention to."
											} It always says it is an AI, answers only from what you gave it and names its sources, whatever is written here. The people you share it with can read these.`
								}
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
					{(shows("voice") || group === "about") && (
						<FormTextarea
							name="about"
							label="About you"
							disabled={isSubmitting || isNoteUnread}
							rows={group === "about" ? 5 : 8}
							placeholder={
								"What I do:\nWhat I am working on:\nWho to ask instead:\nHow to reach me:"
							}
							description={
								isNoteUnread
									? "Your note could not be read just now, so it is not shown here and saving leaves it as it is. Reload the page to try again."
									: group === "about"
										? "A note your twin reads about your work. People you share this twin with can open it."
										: "Optional. A note your twin reads with everything else it knows: what you do, what you are working on, who to ask instead and how to reach you. The people you share it with can open it."
							}
						/>
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
									actions={
										<TwinSkillCreate
											disabled={isSubmitting}
											onCreated={(skill) => {
												onSkillCreated(skill);
												field.onChange([
													...form.getValues("skills"),
													skill.id,
												]);
											}}
										/>
									}
									itemAction={(skill) => (
										<TwinSkillView skill={skill} />
									)}
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
										disabled={isSubmitting}
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
