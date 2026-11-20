import {
	AudioLines,
	BookOpenText,
	ChevronRight,
	ClipboardCheck,
	Flag,
	Hand,
	MessagesSquare,
	Pencil,
	Plus,
	Scale,
	Trash2,
	Users,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Form,
	FormActions,
	FormTextarea,
	H2,
	H3,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useFieldArray,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	PERSONA_SECTIONS,
	type PersonaSections,
	personaSectionsSchema,
} from "./api/persona";
import { parsePersonaPoints, serializePersonaPoints } from "./persona-points";

const pointsSchema = z.object({
	points: z.array(z.object({ prefix: z.string(), text: z.string() })),
});
type PointFields = z.infer<typeof pointsSchema>;

const SECTION_ICONS = {
	short: BookOpenText,
	voice: AudioLines,
	decide: Scale,
	review: ClipboardCheck,
	stands: Flag,
	people: Users,
	limits: Hand,
	examples: MessagesSquare,
} satisfies Record<keyof PersonaSections, typeof Pencil>;

interface PersonaSectionReaderProps {
	/** The owner's last saved sections, including empty ones. */
	sections: PersonaSections;
	/** Publishes the change and returns the sections as saved. */
	onSave: (sections: Partial<PersonaSections>) => Promise<PersonaSections>;
}

/** Read and edit a single part of the persona, keeping its other sections intact. */
export function PersonaSectionReader({
	sections,
	onSave,
}: PersonaSectionReaderProps) {
	const [section, setSection] = useState(() => {
		const hasVoice = Boolean(sections.voice.trim());
		return (
			PERSONA_SECTIONS.find(({ key }) =>
				hasVoice ? key === "voice" : Boolean(sections[key].trim()),
			) ?? PERSONA_SECTIONS[0]
		);
	});
	const [isEditing, setIsEditing] = useState(false);
	const id = useId();
	const currentText = sections[section.key];
	const points = parsePersonaPoints(currentText);
	const form = useForm<PointFields>({
		resolver: zodResolver(pointsSchema),
		defaultValues: { points: [] },
	});
	const { fields, append, remove, replace } = useFieldArray({
		control: form.control,
		name: "points",
	});
	const { isSubmitting, errors } = form.formState;
	const { setFocus } = form;
	const editButton = useRef<HTMLButtonElement>(null);
	const addButton = useRef<HTMLButtonElement>(null);
	const returnFocus = useRef<"edit" | "add" | null>(null);
	const focusPoint = useRef<number | null>(null);
	useEffect(() => {
		if (
			isEditing &&
			focusPoint.current !== null &&
			fields[focusPoint.current]
		) {
			setFocus(`points.${focusPoint.current}.text`);
			focusPoint.current = null;
		} else if (!isEditing && returnFocus.current) {
			const trigger =
				returnFocus.current === "add"
					? addButton.current
					: editButton.current;
			(trigger ?? editButton.current)?.focus();
			returnFocus.current = null;
		}
	}, [isEditing, fields, setFocus]);

	const startEditing = (action: "edit" | "add"): void => {
		const draft = points.map(({ text, prefix }) => ({ text, prefix }));
		if (!draft.length || action === "add") {
			draft.push({ text: "", prefix: draft.length ? "- " : "" });
		}
		returnFocus.current = action;
		focusPoint.current = action === "add" ? draft.length - 1 : 0;
		form.reset({ points: draft });
		setIsEditing(true);
	};
	const handleRemove = (index: number): void => {
		focusPoint.current = Math.max(0, Math.min(index, fields.length - 2));
		if (fields.length === 1) replace([{ text: "", prefix: "" }]);
		else remove(index);
	};
	const handleSave = async (values: PointFields): Promise<void> => {
		const text = serializePersonaPoints(values.points);
		const parsed = personaSectionsSchema.shape[section.key].safeParse(text);
		if (
			!parsed.success ||
			!Object.values({ ...sections, [section.key]: text }).some((value) =>
				value.trim(),
			)
		) {
			form.setError(
				"points.0.text",
				{
					type: "validate",
					message: parsed.success
						? "Write at least one section first."
						: parsed.error.issues[0].message,
				},
				{ shouldFocus: true },
			);
			return;
		}
		try {
			// The server merges this section with the latest copy of the other seven.
			await onSave({ [section.key]: text });
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "Your persona could not be saved.",
			});
			return;
		}
		setIsEditing(false);
	};
	const Icon = SECTION_ICONS[section.key];

	return (
		<section
			aria-labelledby={id}
			className="@container/reader min-w-0 space-y-3"
		>
			<H2 id={id} className="font-semibold text-lg">
				Persona sections
			</H2>
			<div className="flex min-w-0 @2xl/reader:flex-row flex-col overflow-hidden rounded-xl border bg-card text-card-foreground">
				<div className="@2xl/reader:hidden border-b p-3">
					<Select
						value={section.key}
						disabled={isEditing}
						onValueChange={(key) => {
							const next = PERSONA_SECTIONS.find(
								(entry) => entry.key === key,
							);
							if (next) setSection(next);
						}}
					>
						<SelectTrigger
							aria-label="Choose a persona section"
							className="pointer-coarse:min-h-11 w-full"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PERSONA_SECTIONS.map((entry) => (
								<SelectItem key={entry.key} value={entry.key}>
									{entry.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<nav
					aria-label="Choose a persona section"
					className="@2xl/reader:flex hidden w-64 shrink-0 flex-col gap-0.5 border-e bg-muted/20 p-2"
				>
					{PERSONA_SECTIONS.map((entry) => {
						const isActive = section.key === entry.key;
						const ItemIcon = SECTION_ICONS[entry.key];
						return (
							<Button
								key={entry.key}
								type="button"
								variant="ghost"
								disabled={isEditing}
								aria-pressed={isActive}
								aria-controls={`${id}-detail`}
								className={cn(
									"h-auto min-h-9 pointer-coarse:min-h-11 w-full justify-start gap-3 whitespace-normal px-3 py-2 text-start font-normal",
									isActive &&
										"bg-assistant/10 font-semibold hover:bg-assistant/15",
								)}
								onClick={() => setSection(entry)}
							>
								<ItemIcon
									aria-hidden="true"
									className={cn(
										"size-4 text-muted-foreground",
										isActive && "text-assistant",
									)}
								/>
								<span className="min-w-0 flex-1">
									{entry.label}
								</span>
								{isActive && (
									<ChevronRight
										aria-hidden="true"
										className="size-4 text-assistant rtl:rotate-180"
									/>
								)}
							</Button>
						);
					})}
				</nav>
				<div
					id={`${id}-detail`}
					className="min-w-0 flex-1 space-y-5 @2xl/reader:p-6 @4xl/reader:p-8 p-4"
				>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<span
								aria-hidden="true"
								className="grid size-9 shrink-0 place-items-center rounded-lg bg-assistant/10 text-assistant"
							>
								<Icon className="size-5" />
							</span>
							<H3
								id={`${id}-section`}
								className="wrap-anywhere font-display font-medium text-2xl leading-tight"
							>
								{section.label}
							</H3>
						</div>
						{!isEditing && (
							<Button
								ref={editButton}
								type="button"
								size="sm"
								variant="outline"
								className="pointer-coarse:min-h-11"
								onClick={() => startEditing("edit")}
							>
								<Pencil aria-hidden="true" />
								{currentText.trim() ? "Edit" : "Write section"}
							</Button>
						)}
					</div>
					{isEditing ? (
						<Form
							form={form}
							onSubmit={handleSave}
							aria-busy={isSubmitting}
							noValidate
							className="flex min-w-0 flex-col gap-4"
						>
							<P
								id={`${id}-hint`}
								className="max-w-prose text-muted-foreground text-sm"
							>
								{section.hint}
							</P>
							<div className="space-y-3">
								{fields.map((field, index) => (
									<div
										key={field.id}
										className="flex items-start gap-1"
									>
										<FormTextarea
											name={`points.${index}.text`}
											aria-label={
												fields.length === 1
													? section.label
													: `${section.label} point ${index + 1}`
											}
											aria-describedby={
												errors.root?.server
													? `${id}-hint ${id}-error`
													: `${id}-hint`
											}
											className={cn(
												"min-w-0 flex-1",
												fields.length === 1 &&
													"[&_textarea]:min-h-28",
											)}
											rows={fields.length === 1 ? 4 : 2}
											readOnly={isSubmitting}
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="pointer-coarse:size-11 shrink-0 text-muted-foreground"
											aria-label={`Remove point ${index + 1}`}
											disabled={isSubmitting}
											onClick={() => handleRemove(index)}
										>
											<Trash2 aria-hidden="true" />
										</Button>
									</div>
								))}
							</div>
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="pointer-coarse:min-h-11 self-start"
								disabled={isSubmitting}
								onClick={() =>
									append(
										{ text: "", prefix: "- " },
										{
											focusName: `points.${fields.length}.text`,
										},
									)
								}
							>
								<Plus aria-hidden="true" />
								Add point
							</Button>
							{errors.root?.server?.message && (
								<Alert variant="destructive">
									<AlertDescription id={`${id}-error`}>
										{errors.root.server.message}
									</AlertDescription>
								</Alert>
							)}
							<FormActions
								isSubmitting={isSubmitting}
								submitLabel={isSubmitting ? "Saving…" : "Save"}
								onCancel={() => setIsEditing(false)}
								className="flex-wrap pointer-coarse:[&_button]:min-h-11"
							/>
						</Form>
					) : (
						<>
							{points.some((point) => point.prefix) ? (
								<ul
									aria-label={`${section.label} points`}
									className="divide-y border-y"
								>
									{points.map(({ text, offset }) => (
										<li
											key={offset}
											dir="auto"
											className="py-3"
										>
											<P className="wrap-anywhere max-w-prose whitespace-pre-wrap leading-relaxed">
												{text}
											</P>
										</li>
									))}
								</ul>
							) : (
								<P
									dir="auto"
									className={cn(
										"wrap-anywhere max-w-prose whitespace-pre-wrap leading-relaxed",
										!currentText.trim() &&
											"text-muted-foreground",
									)}
								>
									{currentText.trim()
										? currentText
										: section.hint}
								</P>
							)}
							{points.length > 0 && (
								<Button
									ref={addButton}
									type="button"
									variant="outline"
									size="sm"
									className="pointer-coarse:min-h-11"
									onClick={() => startEditing("add")}
								>
									<Plus aria-hidden="true" />
									Add point
								</Button>
							)}
						</>
					)}
				</div>
			</div>
		</section>
	);
}
