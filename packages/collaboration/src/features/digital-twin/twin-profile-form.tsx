import { Blocks, ContactRound, Image, MessageSquareText } from "lucide-react";
import {
	type Ref,
	useEffect,
	useId,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Alert,
	AlertDescription,
	Button,
	Form,
	H2,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import type { CatalogSkill } from "@/features/routines/custom-routine-schema";
import { type FormAutosave, useFormAutosave } from "@/lib/use-form-autosave";
import {
	saveTwinChanges,
	type TwinProfile,
	type TwinProfileCheckpoint,
} from "./api/digital-twin";
import type { TwinPersona } from "./persona/api/persona";
import { TwinProfileFields } from "./twin-profile-fields";
import { TwinProfilePersona } from "./twin-profile-persona";
import { twinProfileSchema } from "./twin-profile-schema";

const PROFILE_GROUPS = [
	{
		id: "identity",
		title: "Name and portrait",
		icon: Image,
		fields: ["name", "image"],
	},
	{
		id: "conversation",
		title: "Instructions and greeting",
		icon: MessageSquareText,
		fields: ["instructions", "greeting"],
	},
	{ id: "about", title: "About you", icon: ContactRound, fields: ["about"] },
	{
		id: "abilities",
		title: "Skills and toolboxes",
		icon: Blocks,
		fields: ["skills", "toolboxes"],
	},
] as const;

/** One line to scan or hear when an editor is folded. The form retains the full text. */
function profileExcerpt(value: string): string {
	const line = value.trim().replace(/\s+/gu, " ");
	const characters = Array.from(line);
	return characters.length > 120
		? `${characters.slice(0, 120).join("").trimEnd()}…`
		: line;
}

// Generated portraits can have identical filenames, sizes, and timestamps.
const portraitKeys = new WeakMap<File, number>();
let nextPortraitKey = 0;

function profileKey({ image, ...fields }: TwinProfile): string {
	if (image && !portraitKeys.has(image))
		portraitKeys.set(image, ++nextPortraitKey);
	return JSON.stringify({
		...fields,
		image: image ? portraitKeys.get(image) : null,
	});
}

export type TwinSaveControl = Pick<
	FormAutosave<TwinProfile>,
	"flush" | "hasUnsavedChanges"
>;

interface TwinProfileFormProps {
	/** The saved twin and what it holds; the form starts from it. */
	twin: { id: string; profile: TwinProfile };
	/** The owner's skill catalog; the twin can follow any of them. */
	skills: CatalogSkill[];
	/** The twin's saved image, shown until another is chosen. */
	imageUrl: string;
	/** The owner's note could not be read: the form shows none and leaves the twin's as it is. */
	isNoteUnread?: boolean;
	/** Whether the owner has a persona; without one the form shows no switch and leaves the twin's as it is. */
	hasPersona?: boolean;
	/** The owner’s saved persona or null if it could not be read. */
	persona?: TwinPersona | null;
	/** The acknowledged name and changes the surrounding page needs to refresh. */
	onSaved: (
		name: string,
		noteChanged: boolean,
		imageChanged: boolean,
	) => void;
	/** Lets navigation finish the current twin’s edits before loading another page. */
	saveControl?: Ref<TwinSaveControl>;
}

/**
 * A saved Digital Twin's profile on one page: its image, name, whether it
 * uses its owner's persona, instructions, greeting, its owner's note, skills
 * and toolboxes. Valid edits are saved together after a short pause.
 */
export function TwinProfileForm({
	twin,
	skills,
	imageUrl,
	isNoteUnread = false,
	persona,
	hasPersona = persona?.exists ?? false,
	onSaved,
	saveControl,
}: TwinProfileFormProps) {
	const { actions } = useInsight();
	const id = useId();
	const [expanded, setExpanded] = useState<string[]>([]);
	const checkpoint = useRef<TwinProfileCheckpoint>({
		profile: twin.profile,
		about: isNoteUnread ? undefined : twin.profile.about,
		usePersona: hasPersona ? twin.profile.usePersona : undefined,
	});
	const published = useRef({
		about: checkpoint.current.about,
		image: checkpoint.current.image,
	});
	const [createdSkills, setCreatedSkills] = useState<CatalogSkill[]>([]);
	const form = useForm<TwinProfile>({
		resolver: zodResolver(twinProfileSchema),
		shouldFocusError: false,
		defaultValues: { ...twin.profile, image: null },
	});
	const { errors } = form.formState;
	const autosave = useFormAutosave({
		form,
		getKey: profileKey,
		onSave: async (values) => {
			// Preserve spaces and caret position while saving the schema’s normalized values.
			const draft = form.getValues();
			const saved = checkpoint.current;
			await saveTwinChanges(actions, twin.id, values, saved);
			onSaved(
				values.name,
				saved.about !== published.current.about,
				saved.image !== published.current.image,
			);
			published.current = { about: saved.about, image: saved.image };
			return { ...draft, image: null };
		},
	});
	useImperativeHandle(
		saveControl,
		() => ({
			flush: autosave.flush,
			hasUnsavedChanges: autosave.hasUnsavedChanges,
		}),
		[autosave.flush, autosave.hasUnsavedChanges],
	);
	const { status, hasUnsavedChanges } = autosave;
	useEffect(() => {
		if (status === "saved" || status === "idle") return;
		const handleUnload = (event: BeforeUnloadEvent): void => {
			if (!hasUnsavedChanges()) return;
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handleUnload);
		return () => window.removeEventListener("beforeunload", handleUnload);
	}, [status, hasUnsavedChanges]);
	const saveLabel = {
		idle: "Changes save automatically",
		saving: "Saving…",
		saved: "Saved",
		invalid: "Check fields",
		error: "Not saved",
	}[autosave.status];
	const [name, instructions, greeting, about, selectedSkills, toolboxes] =
		form.watch([
			"name",
			"instructions",
			"greeting",
			"about",
			"skills",
			"toolboxes",
		]);
	const summaries = {
		identity: name.trim() || "A name is required",
		conversation:
			instructions.trim() ||
			greeting.trim() ||
			"No instructions or greeting yet",
		about: isNoteUnread
			? "Your note could not be loaded"
			: about.trim() || "No note added",
		abilities: `${selectedSkills.length} ${selectedSkills.length === 1 ? "skill" : "skills"} · ${toolboxes.length} ${toolboxes.length === 1 ? "toolbox" : "toolboxes"}`,
	};

	return (
		<Form
			form={form}
			onSubmit={autosave.handleSubmit}
			noValidate
			className="@container/profile flex min-w-0 flex-col gap-4"
		>
			<div className="grid min-w-0 @3xl/profile:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-5">
				<section aria-labelledby={`${id}-settings`} className="min-w-0">
					<div className="mb-3 flex min-h-8 flex-wrap items-center justify-between gap-2">
						<H2
							id={`${id}-settings`}
							className="font-semibold text-lg"
						>
							Profile details
						</H2>
						<output
							aria-label="Save status"
							className="text-muted-foreground text-xs"
						>
							{saveLabel}
						</output>
					</div>
					{errors.root?.server?.message && (
						<Alert variant="destructive" className="mb-3">
							<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
								{errors.root.server.message}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={autosave.retry}
									className="pointer-coarse:min-h-11"
									aria-label="Retry save"
								>
									Retry
								</Button>
							</AlertDescription>
						</Alert>
					)}
					<Accordion
						type="multiple"
						value={expanded}
						onValueChange={setExpanded}
						className="rounded-xl border bg-card @lg/profile:px-5 px-4 text-card-foreground"
					>
						{PROFILE_GROUPS.map(
							({ id: group, title, icon: Icon, fields }) => (
								<AccordionItem key={group} value={group}>
									<AccordionTrigger
										aria-label={title}
										aria-describedby={`${id}-${group}-summary`}
										className="min-w-0 items-center justify-start gap-3 py-3.5 hover:no-underline"
									>
										<span
											className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
											aria-hidden="true"
										>
											<Icon className="size-4" />
										</span>
										<span className="flex min-w-0 flex-1 flex-col gap-0.5">
											<span className="font-semibold text-sm">
												{title}
											</span>
											<span
												id={`${id}-${group}-summary`}
												className="block truncate font-normal text-muted-foreground text-sm"
											>
												{profileExcerpt(
													fields
														.map(
															(field) =>
																errors[field]
																	?.message,
														)
														.find(Boolean) ||
														summaries[group],
												)}
											</span>
										</span>
									</AccordionTrigger>
									{/* Keep generated portraits and drafts when an editor is folded. */}
									<AccordionContent
										forceMount
										hidden={!expanded.includes(group)}
										className="min-w-0 pt-2 pb-5"
									>
										{group === "abilities" &&
											(errors.skills ||
												errors.toolboxes) && (
												<Alert
													variant="destructive"
													className="mb-3"
												>
													<AlertDescription>
														Check the selected
														skills and toolboxes
														before saving.
													</AlertDescription>
												</Alert>
											)}
										<TwinProfileFields
											group={group}
											skills={[
												...skills,
												...createdSkills,
											]}
											onSkillCreated={(skill) =>
												setCreatedSkills((current) => [
													...current,
													skill,
												])
											}
											imageUrl={imageUrl}
											isNoteUnread={isNoteUnread}
											hasPersona={hasPersona}
										/>
									</AccordionContent>
								</AccordionItem>
							),
						)}
					</Accordion>
				</section>
				<TwinProfilePersona persona={persona} hasPersona={hasPersona} />
			</div>
		</Form>
	);
}
