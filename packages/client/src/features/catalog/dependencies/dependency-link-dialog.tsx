import { useId, useMemo, useRef, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FieldError,
	FieldGroup,
	FieldLegend,
	FieldSet,
	Form,
	FormField,
	FormInput,
	FormTextarea,
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { DependencyItemImage } from "@/features/dependency-map/dependency-item-image";
import { getDependencyTypeConfig } from "./catalog-dependency";
import {
	type DependencyOption,
	type DraftLink,
	type DraftLinkFields,
	getDependencyNameProblem,
} from "./catalog-dependency-draft";
import { DependencyTargetPicker } from "./dependency-target-picker";

/**
 * The link's fields. A repeated name is checked against the names the
 * draft's other links have, ignoring case and spaces at the ends, as the
 * draft and the backend check it.
 *
 * @param takenNames - The other links' names, trimmed and in lower case.
 * @returns The schema.
 */
const createLinkSchema = (takenNames: readonly string[]) =>
	z.object({
		target: z
			.custom<DependencyOption | null>()
			.refine((target) => target !== null, "Pick an engine or project"),
		dependency_name: z
			.string()
			.trim()
			.min(1, "Enter a name")
			.superRefine((name, context) => {
				const problem = getDependencyNameProblem(name, (key) =>
					takenNames.includes(key),
				);
				if (problem) {
					context.addIssue({ code: "custom", message: problem });
				}
			}),
		dependency_description: z.string().trim(),
	});

type LinkValues = z.infer<ReturnType<typeof createLinkSchema>>;

/** Props for {@link DependencyLinkDialog}. */
interface DependencyLinkDialogProps {
	/** The owner, which is never offered as a target */
	catalogId: string;
	/** The link to edit; left out to add one, picking its target here */
	link?: DraftLink;
	/** The targets the draft already links to, which cannot be added again */
	linkedIds: ReadonlySet<string>;
	/** The names the draft's other links have, trimmed and in lower case */
	takenNames: readonly string[];
	/**
	 * What stops the draft being saved on this link, such as a name another
	 * link has; shown on the name as the dialog opens
	 */
	problem?: string;
	/** Puts the link in the draft: its target, name and description */
	onSubmit: (target: DependencyOption, fields: DraftLinkFields) => void;
	/** Closes the dialog without a change */
	onClose: () => void;
}

/**
 * A manual dependency's form, in a dialog, for adding one and for editing
 * one alike: the target (picked when adding, shown when editing), its name,
 * which is required and unique per owner since a Code app reads the target's
 * id by it, and an optional description. Picking a target names the link
 * after it until the user types a name of their own. Submitting puts it in
 * the draft; the toolbar's Save sends the draft.
 */
export const DependencyLinkDialog = ({
	catalogId,
	link,
	linkedIds,
	takenNames,
	problem,
	onSubmit,
	onClose,
}: DependencyLinkDialogProps) => {
	const targetErrorId = useId();
	const searchRef = useRef<HTMLInputElement>(null);
	const isEditing = link !== undefined;
	// the name the last pick gave the link, so a new pick replaces it until
	// the user types one of their own
	const [pickedName, setPickedName] = useState<string | null>(null);
	// the draft's problem with this link, kept as one object so react-hook-form
	// sets it once as the dialog opens rather than on every render
	const openingErrors = useMemo(
		() =>
			problem
				? { dependency_name: { type: "draft", message: problem } }
				: undefined,
		[problem],
	);
	// react-hook-form reads its options again on every render, so the
	// resolver always checks against the other links' current names
	const form = useForm<LinkValues>({
		resolver: zodResolver(createLinkSchema(takenNames)),
		// a link that opens with a problem is checked as the name is typed
		mode: problem ? "onChange" : "onSubmit",
		errors: openingErrors,
		defaultValues: {
			target: link ?? null,
			dependency_name: link?.dependency_name ?? "",
			dependency_description: link?.dependency_description ?? "",
		},
	});

	const handleSubmit = ({
		target,
		dependency_name,
		dependency_description,
	}: LinkValues): void => {
		if (target) {
			onSubmit(target, { dependency_name, dependency_description });
		}
	};

	/**
	 * Picks a target, and names the link after it while it has no name or
	 * only the one an earlier pick gave it.
	 */
	const handlePick = (option: DependencyOption): void => {
		form.setValue("target", option, {
			shouldDirty: true,
			shouldValidate: form.formState.isSubmitted,
		});
		const current = form.getValues("dependency_name");
		if (!current.trim() || current === pickedName) {
			const name = option.catalog_name || option.catalog_id;
			form.setValue("dependency_name", name, {
				shouldDirty: true,
				shouldValidate: form.formState.isSubmitted,
			});
			setPickedName(name);
		}
	};

	const shownTarget = link
		? {
				id: link.catalog_id,
				name: link.catalog_name,
				config: getDependencyTypeConfig(link.catalog_type),
				type: link.catalog_type,
				subtype: link.catalog_subtype ?? null,
			}
		: null;

	return (
		<Dialog
			open={true}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					onClose();
				}
			}}
		>
			<DialogContent
				className="sm:max-w-lg"
				// adding starts in the search, as a picker does; editing, in
				// the dialog's first field
				onOpenAutoFocus={(event) => {
					if (searchRef.current) {
						event.preventDefault();
						searchRef.current.focus();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Dependency" : "Add Dependency"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Change its name or description. Save in the toolbar to keep the change."
							: "Pick what this depends on and name the link. Save in the toolbar to keep it."}
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					className="flex flex-col gap-6"
				>
					<FieldGroup className="gap-4">
						{shownTarget ? (
							<Item variant="outline" size="sm">
								<ItemMedia>
									<DependencyItemImage
										node={{
											id: shownTarget.id,
											kind: shownTarget.config.kind,
											type: shownTarget.type,
											subtype: shownTarget.subtype,
											name: shownTarget.name,
										}}
										className="size-8"
									/>
								</ItemMedia>
								<ItemContent className="min-w-0 gap-0">
									<ItemTitle className="w-full truncate">
										{shownTarget.name}
									</ItemTitle>
									<ItemDescription className="text-xs">
										{shownTarget.config.label}
									</ItemDescription>
								</ItemContent>
							</Item>
						) : (
							<FormField
								control={form.control}
								name="target"
								render={({ field, fieldState }) => (
									<FieldSet>
										<FieldLegend variant="label">
											Dependency
										</FieldLegend>
										<DependencyTargetPicker
											searchRef={searchRef}
											catalogId={catalogId}
											linkedIds={linkedIds}
											value={
												field.value?.catalog_id ?? null
											}
											onChange={handlePick}
											isInvalid={fieldState.invalid}
											errorId={targetErrorId}
										/>
										{fieldState.error ? (
											<FieldError
												id={targetErrorId}
												errors={[fieldState.error]}
											/>
										) : null}
									</FieldSet>
								)}
							/>
						)}
						<FormInput
							name="dependency_name"
							label="Name"
							required
							description="The key a Code app reads this item's id by."
							autoComplete="off"
						/>
						<FormTextarea
							name="dependency_description"
							label="Description (Optional)"
							rows={2}
						/>
					</FieldGroup>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button type="submit">
							{isEditing ? "Update Dependency" : "Add Dependency"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
