import { useId, useRef, useState } from "react";
import { savePermissionBatches } from "@semoss/sdk";
import { type Engine, EngineSelect } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	Form,
	FormField,
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
import { GrantTypeSelect } from "@/features/grants/grant-type-select";
import {
	ALL_GRANT_TYPES,
	GRANTEE_ENGINE_TYPES,
	toEngineTypeOptions,
} from "@/features/grants/grant-types";
import {
	type GranteeRef,
	type GrantModel,
	toAddGranteesBatch,
} from "@/features/grants/grants";
import {
	type PickedResource,
	resourceKey,
	toPickedEngine,
} from "@/features/grants/picked-resource";
import { useGrantLimit } from "@/features/grants/use-grant-limit";
import { getEngineLabel } from "@/utility/catalog";

const schema = z.object({
	grantees: z
		.array(z.custom<PickedResource>())
		.min(1, "Pick at least one engine"),
	level: z.enum(GRANT_LEVELS),
});

type AddEngineEngineValues = z.infer<typeof schema>;

/** The types the Engine Type select offers */
const TYPE_OPTIONS = toEngineTypeOptions(GRANTEE_ENGINE_TYPES);

/** The message for an engine picked to be given a permission on itself */
const ITSELF_PROBLEM = "An engine cannot be given a permission on itself";

/** Props for {@link AddEngineEngineDialog}. */
export interface AddEngineEngineDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The engine that gives the other engines a permission */
	engineId: string;
	/**
	 * The engines that already have a permission on the engine, which the list
	 * does not take: their permission is changed in the table
	 */
	granted?: readonly GranteeRef[];
	/**
	 * On a model, what the engines' usage limit needs; the dialog then shows the
	 * Engine Limit below the permission, starting at No Limit Defined
	 */
	model?: GrantModel;
	/**
	 * Whether to list every engine and save in admin mode; outside it an admin
	 * has only their own permissions
	 */
	admin?: boolean;
	/**
	 * Called when the dialog closes: with the ids of the engines given a
	 * permission, or nothing
	 */
	onClose: (granteeIds?: string[]) => void;
}

/**
 * Lets an owner of an engine give other engines a permission on it, so each
 * can call it, even for people with no access to it, such as a vector database
 * calling its embedding model or a guardrail calling its judge model. The owner
 * narrows the picker to one engine type or keeps every type, and each engine
 * picked, of the ones they can see or any engine in admin mode, joins a list.
 * Every engine on the list gets the same level, Read-Only or Editor, with what
 * each level allows said under the select, and on a model the same usage
 * limit, each engine its own copy, shared by the engine or for each of its
 * users. The list is saved at once as one permission batch, so every engine on
 * it is given access or none is: a refusal shows in the dialog, which stays
 * open. The engine itself, an engine that already has access, or one already
 * on the list is not added, and the field says why. Authorize Access stays
 * enabled, and pressing it with an empty list, or with a limit that is not
 * complete, shows what is missing. Give it a new key each time it opens so it
 * starts empty.
 */
export const AddEngineEngineDialog = ({
	open,
	engineId,
	granted = [],
	model,
	admin = false,
	onClose,
}: AddEngineEngineDialogProps) => {
	const engineFieldId = useId();
	const engineHintId = useId();
	const engineErrorId = useId();
	const form = useForm<AddEngineEngineValues>({
		resolver: zodResolver(schema),
		defaultValues: { grantees: [], level: DEFAULT_GRANT_LEVEL },
	});
	const { errors, isSubmitting, isSubmitted } = form.formState;
	const grantees = form.watch("grantees");
	const [typeFilter, setTypeFilter] = useState<string>(ALL_GRANT_TYPES);
	const [pickNote, setPickNote] = useState<string | null>(null);
	const pickerRef = useRef<HTMLButtonElement | null>(null);
	const canGiveLimit = model?.canChangeLimit === true;
	const limit = useGrantLimit({
		isOffered: canGiveLimit,
		source: "ENGINE",
		isCostAvailable: model?.isCostAvailable ?? true,
		isSubmitting,
	});
	const pickedType =
		GRANTEE_ENGINE_TYPES.find((type) => type === typeFilter) ?? null;

	/**
	 * Puts a picked engine on the list, or takes it off when it is on the list
	 * already, as its check in the picker shows. This engine, or one that
	 * already has access, stays off, and the field says why.
	 *
	 * @param engine - the engine picked
	 */
	const handlePick = (engine: Engine) => {
		const picked = toPickedEngine(engine);
		if (!picked) {
			return;
		}
		const isSame = (other: { id: string; type: string }) =>
			other.id === picked.id && other.type === picked.type;
		if (picked.id === engineId) {
			setPickNote(ITSELF_PROBLEM);
			return;
		}
		if (granted.some(isSame)) {
			setPickNote(
				`${picked.name} already has access. Change its permission in the table.`,
			);
			return;
		}
		const queued = form.getValues("grantees");
		setPickNote(null);
		form.setValue(
			"grantees",
			queued.some(isSame)
				? queued.filter((other) => !isSame(other))
				: [...queued, picked],
			{ shouldValidate: isSubmitted },
		);
	};

	/**
	 * Takes an engine off the list and moves focus back to the picker.
	 *
	 * @param grantee - the engine to take off
	 */
	const handleRemove = (grantee: PickedResource) => {
		setPickNote(null);
		form.setValue(
			"grantees",
			form
				.getValues("grantees")
				.filter((other) => resourceKey(other) !== resourceKey(grantee)),
			{ shouldValidate: isSubmitted },
		);
		pickerRef.current?.focus();
	};

	/**
	 * Gives every engine on the list its permission, in one permission batch. An
	 * Engine Limit that is not complete stops it.
	 */
	const handleSubmit = async (
		values: AddEngineEngineValues,
	): Promise<void> => {
		if (limit.stopsSubmit()) {
			return;
		}
		try {
			await savePermissionBatches(
				[
					toAddGranteesBatch(
						{ resourceType: "ENGINE", id: engineId },
						values.grantees,
						values.level,
						canGiveLimit ? limit.usageLimit : null,
					),
				],
				admin,
			);
		} catch (e: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(
					e,
					"Could not give the engines access",
				),
			});
			return;
		}
		const level = getLevelLabel(values.level);
		toast.success(
			values.grantees.length === 1
				? `${values.grantees[0].name} has ${level} access`
				: `${values.grantees.length} engines have ${level} access`,
		);
		onClose(values.grantees.map((grantee) => grantee.id));
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
				onError={limit.showProblems}
				noValidate
				aria-busy={isSubmitting}
				className="flex min-w-0 flex-col gap-4"
			>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Add Engines
					</DialogTitle>
					<DialogDescription>
						Each engine on the list can call this one, even for
						people with no access to it. They all get the same
						permission.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 sm:grid-cols-3">
					<GrantTypeSelect
						label="Engine Type"
						options={TYPE_OPTIONS}
						value={typeFilter}
						disabled={isSubmitting}
						onChange={setTypeFilter}
					/>
					<FormField
						control={form.control}
						name="grantees"
						render={({ field, fieldState }) => (
							<Field
								className="sm:col-span-2"
								data-invalid={Boolean(fieldState.error)}
							>
								<FieldLabel htmlFor={engineFieldId}>
									Engine
								</FieldLabel>
								<EngineSelect
									ref={(node) => {
										field.ref(node);
										pickerRef.current = node;
									}}
									id={engineFieldId}
									aria-invalid={Boolean(fieldState.error)}
									aria-describedby={
										fieldState.error
											? `${engineHintId} ${engineErrorId}`
											: engineHintId
									}
									name={
										grantees.length > 0
											? `${grantees.length} picked`
											: ""
									}
									value=""
									disabled={isSubmitting}
									engineTypes={
										pickedType
											? [pickedType]
											: GRANTEE_ENGINE_TYPES
									}
									admin={admin}
									showEngineId
									modal
									selectedIds={grantees.map(
										(grantee) => grantee.id,
									)}
									onChange={handlePick}
								/>
								<FieldDescription id={engineHintId}>
									Pick as many as you need: each one joins the
									list below, and picking it again takes it
									off.
								</FieldDescription>
								{pickNote ? (
									<output className="block text-muted-foreground text-xs">
										{pickNote}
									</output>
								) : null}
								{fieldState.error?.message ? (
									<FieldError id={engineErrorId}>
										{fieldState.error.message}
									</FieldError>
								) : null}
							</Field>
						)}
					/>
				</div>

				<GrantQueue
					heading="Engines to Authorize"
					emptyText="No engines picked yet"
					items={grantees}
					badgeOf={(grantee) =>
						getEngineLabel(
							GRANTEE_ENGINE_TYPES.find(
								(type) => type === grantee.type,
							),
						)
					}
					disabled={isSubmitting}
					onRemove={handleRemove}
				/>

				<GrantLevelSelect
					description={`Every engine on the list gets this permission. ${describeGrantLevels("ENGINE")}`}
					disabled={isSubmitting}
				/>

				{model ? (
					<GrantLimitField
						canSetLimit={canGiveLimit}
						source="ENGINE"
						label="Engine Limit"
						isCostAvailable={model.isCostAvailable}
						onChange={limit.setUsageLimit}
						editorRef={limit.editorRef}
						shouldShowProblems={limit.shouldShowProblems}
						copyNote="Every engine on the list gets its own copy of this limit."
						disabled={isSubmitting}
						admin={admin}
					/>
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
