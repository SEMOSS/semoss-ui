import { X } from "lucide-react";
import { useId, useState } from "react";
import { savePermissionBatches, validatePermissionBatches } from "@semoss/sdk";
import {
	Alert,
	AlertDescription,
	Button,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Form,
	FormField,
	RadioGroup,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import { GrantDialog } from "@/features/grants/grant-dialog";
import { GrantDialogFooter } from "@/features/grants/grant-dialog-footer";
import { GrantLevelSelect } from "@/features/grants/grant-level-select";
import {
	DEFAULT_GRANT_LEVEL,
	describeGrantLevels,
	GRANT_LEVELS,
} from "@/features/grants/grant-levels";
import { GrantLimitField } from "@/features/grants/grant-limit-field";
import { GrantQueue } from "@/features/grants/grant-queue";
import { GrantResource } from "@/features/grants/grant-resource";
import {
	type GrantPickerTypes,
	GrantResourcePicker,
} from "@/features/grants/grant-resource-picker";
import { GrantTypeSelect } from "@/features/grants/grant-type-select";
import { ALL_GRANT_TYPES } from "@/features/grants/grant-types";
import {
	type PickedResource,
	resourceKey,
} from "@/features/grants/picked-resource";
import { useGrantLimit } from "@/features/grants/use-grant-limit";
import { getEngineLabel, getProjectLabel } from "@/utility/catalog";
import { GrantChoiceCard } from "./grant-choice-card";
import {
	findRefusedPairs,
	GRANT_KINDS,
	type GrantKind,
	type GrantSide,
	type RefusedPair,
	SHARED_ENGINE_TYPES,
	SHARED_PROJECT_TYPES,
	toGrantBatches,
} from "./grant-pairs";
import { useShareableKinds } from "./use-shareable-kinds";

const schema = z.object({
	start: z.custom<PickedResource | null>().refine((value) => value !== null, {
		message: "Pick one to start from",
	}),
	picks: z
		.array(z.custom<PickedResource>())
		.min(1, "Pick at least one to add"),
	level: z.enum(GRANT_LEVELS),
});

type AddGrantedAccessValues = z.infer<typeof schema>;

/**
 * Which side the dialog starts from: the one that gets access (then what it
 * can use), or the one that is shared (then who can use it)
 */
type StartFrom = "GETS_ACCESS" | "SHARED";

/**
 * @param side - a side of a kind of access
 * @param type - the type chosen, or ALL
 * @returns what the side's picker offers for it
 */
const toPickerTypes = (side: GrantSide, type: string): GrantPickerTypes =>
	side.kind === "PROJECT"
		? {
				kind: side.kind,
				types: side.types.filter(
					(option) => type === ALL_GRANT_TYPES || option === type,
				),
			}
		: {
				kind: side.kind,
				types: side.types.filter(
					(option) => type === ALL_GRANT_TYPES || option === type,
				),
			};

/**
 * @param resource - an engine or project on the list
 * @returns its type's name, for its badge
 */
const typeLabelOf = (resource: PickedResource): string =>
	resource.resourceType === "PROJECT"
		? getProjectLabel(
				SHARED_PROJECT_TYPES.find((type) => type === resource.subtype),
			)
		: getEngineLabel(
				SHARED_ENGINE_TYPES.find((type) => type === resource.type),
			);

/** Props for {@link AddGrantedAccessDialog}. */
export interface AddGrantedAccessDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/**
	 * Whether to list every engine, project and app and save in admin mode;
	 * outside it an admin has only their own permissions
	 */
	admin?: boolean;
	/** Called when the dialog closes: true when permissions were given */
	onClose: (didSave?: boolean) => void;
}

/**
 * Gives access in one of two directions. The user first chooses where to
 * start: from what gets access (an app, agent or engine, then everything it
 * can use) or from what is shared (an engine or project, then everyone who can
 * use it), and the kind of access, the same three the page lists in sections:
 * apps and agents using projects, apps and agents using engines, and engines
 * using engines. The kind limits both pickers to its types, so every pair can
 * be given. The user picks the one to start from, then adds to a list, each
 * picker narrowed by a type select. Everything on the list gets one level,
 * with what each level allows said under the select, and on a model one usage
 * limit. Changing the direction or the kind starts the picks over. Authorize
 * Access validates the permission batches, one for each engine or project,
 * first: a change the backend refuses, such as on one the user does not own or
 * one that already gives access, is listed with its reason and nothing is
 * saved, so the user can take it off and try again. The list stays while the
 * user changes the picks, until it is closed, the direction or the kind
 * changes, or Authorize Access is pressed again, which shows only what that
 * attempt finds. Then every change is saved
 * together, or none is. Pressing it with nothing picked, or with a limit that
 * is not complete, shows what is missing. Outside admin mode the side that is
 * shared lists only what the user owns, and only the types the user can share
 * (`useShareableKinds`): a kind with none is not offered, and a note under the
 * kinds names what only admins share. Render it only when that leaves a kind
 * to offer, and give it a new key each time it opens so it starts empty.
 */
export const AddGrantedAccessDialog = ({
	open,
	admin = false,
	onClose,
}: AddGrantedAccessDialogProps) => {
	const startFieldId = useId();
	const startHintId = useId();
	const startErrorId = useId();
	const pickFieldId = useId();
	const pickHintId = useId();
	const pickErrorId = useId();
	const form = useForm<AddGrantedAccessValues>({
		resolver: zodResolver(schema),
		defaultValues: { start: null, picks: [], level: DEFAULT_GRANT_LEVEL },
	});
	const { errors, isSubmitting, isSubmitted } = form.formState;
	const start = form.watch("start");
	const picks = form.watch("picks");
	const { kinds, adminOnlyNote } = useShareableKinds(admin);
	const [startFrom, setStartFrom] = useState<StartFrom>("GETS_ACCESS");
	const [grantKindId, setGrantKindId] = useState<GrantKind["id"]>(
		GRANT_KINDS[0].id,
	);
	const [startType, setStartType] = useState(ALL_GRANT_TYPES);
	const [pickType, setPickType] = useState(ALL_GRANT_TYPES);
	const [pickNote, setPickNote] = useState<string | null>(null);
	const [refused, setRefused] = useState<RefusedPair[]>([]);

	const grantKind =
		kinds.find((option) => option.id === grantKindId) ?? kinds[0];
	const isFromGrantee = startFrom === "GETS_ACCESS";
	const ownedHint = admin ? "" : " Only the ones you own are listed.";
	const startSide = isFromGrantee ? grantKind.grantee : grantKind.target;
	const pickSide = isFromGrantee ? grantKind.target : grantKind.grantee;
	const targets = isFromGrantee ? picks : start ? [start] : [];
	const hasModel = targets.some((target) => target.type === "MODEL");
	const limitSource = grantKind.grantee.kind === "PROJECT" ? "APP" : "ENGINE";
	const limit = useGrantLimit({
		isOffered: hasModel,
		source: limitSource,
		isCostAvailable: true,
		isSubmitting,
	});
	const startLabel = isFromGrantee
		? grantKind.grantee.noun
		: `${grantKind.target.noun} to Share`;
	const pickLabel = isFromGrantee
		? `${grantKind.target.noun} It Can Use`
		: `${grantKind.grantee.noun} That Can Use It`;

	/** Starts the picks over, when the direction or the kind changes */
	const startOver = () => {
		form.setValue("start", null);
		form.setValue("picks", []);
		form.clearErrors();
		setStartType(ALL_GRANT_TYPES);
		setPickType(ALL_GRANT_TYPES);
		setPickNote(null);
		setRefused([]);
	};

	/**
	 * Picks the one to start from, in place of any picked before.
	 *
	 * @param picked - what was picked
	 */
	const handlePickStart = (picked: PickedResource) => {
		if (picks.some((other) => resourceKey(other) === resourceKey(picked))) {
			setPickNote(`${picked.name} is already on the list.`);
			return;
		}
		setPickNote(null);
		form.setValue("start", picked, { shouldValidate: isSubmitted });
	};

	/**
	 * Adds a pick to the list, or takes it off when it is on the list already,
	 * as its check in the picker shows. The one started from stays off, and the
	 * field says why.
	 *
	 * @param picked - what was picked
	 */
	const handlePick = (picked: PickedResource) => {
		if (start && resourceKey(start) === resourceKey(picked)) {
			setPickNote(`${picked.name} is the one you started from.`);
			return;
		}
		const queued = form.getValues("picks");
		const isQueued = queued.some(
			(other) => resourceKey(other) === resourceKey(picked),
		);
		setPickNote(null);
		form.setValue(
			"picks",
			isQueued
				? queued.filter(
						(other) => resourceKey(other) !== resourceKey(picked),
					)
				: [...queued, picked],
			{ shouldValidate: isSubmitted },
		);
	};

	/**
	 * Takes a pick off the list.
	 *
	 * @param picked - what to take off
	 */
	const handleRemove = (picked: PickedResource) => {
		setPickNote(null);
		form.setValue(
			"picks",
			form
				.getValues("picks")
				.filter((other) => resourceKey(other) !== resourceKey(picked)),
			{ shouldValidate: isSubmitted },
		);
	};

	/**
	 * Validates the batches, then saves them all. A refused change stops the
	 * save and is listed; a limit that is not complete stops it before.
	 */
	const handleSubmit = async (
		values: AddGrantedAccessValues,
	): Promise<void> => {
		setRefused([]);
		if (limit.stopsSubmit() || !values.start) {
			return;
		}
		const valueGrantees = isFromGrantee ? [values.start] : values.picks;
		const valueTargets = isFromGrantee ? values.picks : [values.start];
		const { batches } = toGrantBatches(
			valueTargets,
			valueGrantees,
			values.level,
			hasModel ? limit.usageLimit : null,
		);
		try {
			const validations = await validatePermissionBatches(batches, admin);
			const refusedPairs = findRefusedPairs(
				batches,
				validations,
				valueTargets,
				valueGrantees,
			);
			setRefused(refusedPairs);
			if (refusedPairs.length > 0) {
				return;
			}
			await savePermissionBatches(batches, admin);
		} catch (e: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(e, "Could not give the access"),
			});
			return;
		}
		const levelLabel = getLevelLabel(values.level);
		toast.success(
			values.picks.length === 1
				? `${valueGrantees[0].name} has ${levelLabel} access to ${valueTargets[0].name}`
				: isFromGrantee
					? `${values.start.name} has ${levelLabel} access to ${values.picks.length} more`
					: `${values.picks.length} have ${levelLabel} access to ${values.start.name}`,
		);
		onClose(true);
	};

	return (
		<GrantDialog
			open={open}
			isSubmitting={isSubmitting}
			onClose={() => onClose()}
			className="sm:max-w-2xl"
		>
			<Form
				form={form}
				onSubmit={handleSubmit}
				onError={() => {
					setRefused([]);
					limit.showProblems();
				}}
				noValidate
				aria-busy={isSubmitting}
				className="flex min-w-0 flex-col gap-4"
			>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Add Access
					</DialogTitle>
					<DialogDescription>
						An app uses what it is given through its custom
						reactors, an agent through its runs, and an engine
						through its own code, even for people with no access of
						their own.
					</DialogDescription>
				</DialogHeader>

				<FieldSet>
					<FieldLegend variant="label" className="mb-2">
						Start From
					</FieldLegend>
					<RadioGroup
						value={startFrom}
						disabled={isSubmitting}
						onValueChange={(value) => {
							setStartFrom(
								value === "SHARED" ? "SHARED" : "GETS_ACCESS",
							);
							startOver();
						}}
						className="sm:grid-cols-2"
					>
						<GrantChoiceCard
							value="GETS_ACCESS"
							title="What Gets Access"
							description="Pick an app, agent or engine, then add what it can use."
						/>
						<GrantChoiceCard
							value="SHARED"
							title="What Is Shared"
							description="Pick an engine or project, then add who can use it."
						/>
					</RadioGroup>
				</FieldSet>

				<FieldSet>
					<FieldLegend variant="label" className="mb-2">
						Kind of Access
					</FieldLegend>
					<RadioGroup
						value={grantKind.id}
						disabled={isSubmitting}
						onValueChange={(value) => {
							setGrantKindId(
								(
									kinds.find(
										(option) => option.id === value,
									) ?? kinds[0]
								).id,
							);
							startOver();
						}}
					>
						{kinds.map((option) => (
							<GrantChoiceCard
								key={option.id}
								value={option.id}
								title={option.title}
								description={option.description}
							/>
						))}
					</RadioGroup>
					{adminOnlyNote ? (
						<FieldDescription className="mt-2">
							{adminOnlyNote}
						</FieldDescription>
					) : null}
				</FieldSet>

				<div className="grid gap-4 sm:grid-cols-3">
					<GrantTypeSelect
						label="Type"
						options={startSide.typeOptions}
						value={startType}
						disabled={isSubmitting}
						onChange={setStartType}
					/>
					<FormField
						control={form.control}
						name="start"
						render={({ field, fieldState }) => (
							<Field
								className="sm:col-span-2"
								data-invalid={Boolean(fieldState.error)}
							>
								<FieldLabel htmlFor={startFieldId}>
									{startLabel}
								</FieldLabel>
								<GrantResourcePicker
									{...toPickerTypes(startSide, startType)}
									ref={field.ref}
									id={startFieldId}
									aria-invalid={Boolean(fieldState.error)}
									aria-describedby={
										fieldState.error
											? `${startHintId} ${startErrorId}`
											: startHintId
									}
									picked={start}
									disabled={isSubmitting}
									admin={admin}
									isOwnedOnly={!isFromGrantee}
									onPick={handlePickStart}
								/>
								<FieldDescription id={startHintId}>
									{isFromGrantee
										? "Gets access to everything on the list below."
										: `Everything on the list below can use it.${ownedHint}`}
								</FieldDescription>
								{fieldState.error?.message ? (
									<FieldError id={startErrorId}>
										{fieldState.error.message}
									</FieldError>
								) : null}
							</Field>
						)}
					/>
				</div>
				{start ? (
					<div className="rounded-md border border-border px-3 py-2">
						<GrantResource
							type={start.type}
							id={start.id}
							name={start.name}
							subtype={start.subtype}
							isLinked={false}
						/>
					</div>
				) : null}

				<div className="grid gap-4 sm:grid-cols-3">
					<GrantTypeSelect
						label="Type to Add"
						options={pickSide.typeOptions}
						value={pickType}
						disabled={isSubmitting}
						onChange={setPickType}
					/>
					<FormField
						control={form.control}
						name="picks"
						render={({ field, fieldState }) => (
							<Field
								className="sm:col-span-2"
								data-invalid={Boolean(fieldState.error)}
							>
								<FieldLabel htmlFor={pickFieldId}>
									{pickLabel}
								</FieldLabel>
								<GrantResourcePicker
									{...toPickerTypes(pickSide, pickType)}
									ref={field.ref}
									id={pickFieldId}
									aria-invalid={Boolean(fieldState.error)}
									aria-describedby={
										fieldState.error
											? `${pickHintId} ${pickErrorId}`
											: pickHintId
									}
									picked={null}
									selectedIds={picks.map((pick) => pick.id)}
									disabled={isSubmitting}
									admin={admin}
									isOwnedOnly={isFromGrantee}
									onPick={handlePick}
								/>
								<FieldDescription id={pickHintId}>
									Pick as many as you need: each one joins the
									list below, and picking it again takes it
									off.{isFromGrantee ? ownedHint : ""}
								</FieldDescription>
								{pickNote ? (
									<output className="block text-muted-foreground text-xs">
										{pickNote}
									</output>
								) : null}
								{fieldState.error?.message ? (
									<FieldError id={pickErrorId}>
										{fieldState.error.message}
									</FieldError>
								) : null}
							</Field>
						)}
					/>
				</div>

				<GrantQueue
					heading={isFromGrantee ? "It Can Use" : "Can Use It"}
					emptyText="Nothing picked yet"
					items={picks}
					badgeOf={typeLabelOf}
					disabled={isSubmitting}
					onRemove={handleRemove}
				/>

				<GrantLevelSelect
					description={`Everything on the list gets this permission. ${describeGrantLevels(grantKind.target.kind)}`}
					disabled={isSubmitting}
				/>

				{hasModel ? (
					<GrantLimitField
						canSetLimit
						source={limitSource}
						label={
							limitSource === "APP" ? "App Limit" : "Engine Limit"
						}
						isCostAvailable
						onChange={limit.setUsageLimit}
						editorRef={limit.editorRef}
						shouldShowProblems={limit.shouldShowProblems}
						copyNote="Each one given access gets its own copy of this limit on each model. Only a model's owners, and admins in admin mode, set it, so leave No Limit Defined on a model you do not own."
						disabled={isSubmitting}
						admin={admin}
					/>
				) : null}

				{refused.length > 0 ? (
					<Alert variant="destructive">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close the refused changes"
							className="absolute top-2 right-2 size-7"
							onClick={() => setRefused([])}
						>
							<X className="size-4" aria-hidden />
						</Button>
						<AlertDescription className="flex flex-col gap-1 pr-8">
							<span>
								Nothing was saved. Take these off the list and
								try again:
							</span>
							<ul className="list-disc pl-5">
								{refused.map((pair) => (
									<li
										key={`${pair.granteeName}|${pair.targetName}|${pair.reason}`}
									>
										{pair.granteeName} on {pair.targetName}:{" "}
										{pair.reason}
									</li>
								))}
							</ul>
						</AlertDescription>
					</Alert>
				) : null}
				{errors.root?.server?.message ? (
					<Alert variant="destructive">
						<AlertDescription>
							{errors.root.server.message}
						</AlertDescription>
					</Alert>
				) : null}
				{limit.shouldShowProblems && limit.limitProblem ? (
					<p className="text-destructive text-xs">
						{limit.limitProblem}
					</p>
				) : null}

				<GrantDialogFooter
					isSubmitting={isSubmitting}
					onCancel={() => onClose()}
				/>
			</Form>
		</GrantDialog>
	);
};
