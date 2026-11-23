import { Plus, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { type ModelUsageLimit, savePermissionBatches } from "@semoss/sdk";
import {
	EngineSubtypeIcon,
	OWNERS_ONLY_LIMIT_REASON,
	UsageLimitGuideButton,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	H4,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { getErrorMessage } from "@semoss/utility/error";
import { ResourceId } from "@/components/shared/resource-id";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import { UsageLimitDialog } from "@/features/bulk-access-management/usage-limit-dialog";
import { UsageLimitEditButton } from "@/features/bulk-access-management/usage-limit-edit-button";
import { UsageLimitSummary } from "@/features/bulk-access-management/usage-limit-summary";
import type { ENGINE_TYPES } from "@/types";
import { AddEngineEngineDialog } from "./add-engine-engine-dialog";
import {
	ENGINE_GRANTEE_LEVELS,
	type EngineGrantee,
	type EngineGranteeLevel,
	isEngineGranteeLevel,
	toEngineLevelBatch,
	toEngineLimitBatch,
	toRemoveEngineBatch,
} from "./engine-engine-permissions";
import { useEngineEnginePermissions } from "./use-engine-engine-permissions";

/**
 * A level picked for an engine, shown in its row from the pick until the
 * engines are read again, so the row never shows the level from before a save
 */
interface PendingLevel {
	/** The engine, as `type:id` */
	granteeKey: string;
	/** The level picked */
	level: EngineGranteeLevel;
	/** The engines as read when it was picked; it applies only while they are the ones shown */
	engines: readonly EngineGrantee[];
}

/** Props for {@link EngineEnginesTable}. */
export interface EngineEnginesTableProps {
	/** The engine's id */
	id: string;
	/**
	 * The engine's type. Only a model's engines have usage limits: its table has
	 * a Usage Limit column, and Add Engine offers the Engine Limit.
	 */
	type: ENGINE_TYPES;
	/**
	 * Whether the engines are read and saved in admin mode, where an admin can
	 * change any engine's engines; outside it an admin has only their own
	 * permissions
	 */
	admin?: boolean;
}

/**
 * @param grantee - an engine given a permission
 * @returns its key, by catalog type and id, since an id names one engine of a type
 */
const toGranteeKey = (grantee: EngineGrantee): string =>
	`${grantee.subject.type}:${grantee.subject.id}`;

/**
 * Lists the other engines an engine gives a permission to: the engines whose
 * own code can use it for people who have no access to it themselves, such as
 * a vector database that embeds with a model or a guardrail that asks a model
 * as its judge. The engine's editors and owners see the list, and so do admins
 * in admin mode. The engine's owners can add an engine, change its level
 * between Read-Only and Editor, and take its access away, and on a model set
 * its usage limit, shared by the engine or for each of its users. Where only
 * admins give access, an owner outside admin mode cannot add an engine. Every
 * change is one permission batch saved at once, and the engines are read again
 * after it. What the user may change, and whether a model has known prices,
 * come from the engine's permissions, so the controls follow the backend.
 */
export const EngineEnginesTable = ({
	id,
	type,
	admin = false,
}: EngineEnginesTableProps) => {
	const headingId = useId();
	const permissions = useEngineEnginePermissions(id, admin);
	const { engines, canChangeEngines } = permissions;
	const canAddEngines = canChangeEngines && !permissions.addsAreAdminOnly;
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [addDialogKey, setAddDialogKey] = useState(0);
	const [isChanging, setIsChanging] = useState(false);
	const [pendingLevel, setPendingLevel] = useState<PendingLevel | null>(null);
	const [levelError, setLevelError] = useState<string | null>(null);
	const [limitTarget, setLimitTarget] = useState<EngineGrantee | null>(null);
	const [limitDialogKey, setLimitDialogKey] = useState(0);
	const [removeTarget, setRemoveTarget] = useState<EngineGrantee | null>(
		null,
	);
	const [removeError, setRemoveError] = useState<string | null>(null);
	const addButtonRef = useRef<HTMLButtonElement>(null);
	const didRemoveRef = useRef(false);

	const hasLimits = type === "MODEL";
	const isCostAvailable = permissions.costLimitsAvailable;
	const canChangeLimit = canChangeEngines && permissions.canChangeModelLimits;
	const hasEndDates =
		engines?.some((grantee) => grantee.access.endDate) ?? false;
	const isBusy = isChanging || permissions.isLoading;
	const shownPendingLevel =
		pendingLevel !== null && pendingLevel.engines === engines
			? pendingLevel
			: null;
	const columnCount =
		2 +
		(hasLimits ? 1 : 0) +
		(hasEndDates ? 1 : 0) +
		(canChangeEngines ? 1 : 0);

	const reloadEngines = () => {
		setLevelError(null);
		permissions.refresh();
	};

	const handleLevelChange = async (grantee: EngineGrantee, value: string) => {
		if (
			!engines ||
			!isEngineGranteeLevel(value) ||
			value === grantee.access.level
		) {
			return;
		}
		setIsChanging(true);
		setLevelError(null);
		setPendingLevel({
			granteeKey: toGranteeKey(grantee),
			level: value,
			engines,
		});
		try {
			await savePermissionBatches(
				[toEngineLevelBatch(id, grantee, value)],
				admin,
			);
		} catch (e) {
			setPendingLevel(null);
			setLevelError(
				getErrorMessage(
					e,
					`Could not change the access of ${grantee.subject.name}`,
				),
			);
			setIsChanging(false);
			return;
		}
		setIsChanging(false);
		toast.success(
			`${grantee.subject.name} has ${getLevelLabel(value)} access`,
		);
		reloadEngines();
	};

	const handleOpenLimit = (grantee: EngineGrantee) => {
		setLimitDialogKey((key) => key + 1);
		setLimitTarget(grantee);
	};

	const handleSaveLimit = async (usageLimit: ModelUsageLimit | null) => {
		if (!limitTarget) {
			return;
		}
		await savePermissionBatches(
			[toEngineLimitBatch(id, limitTarget, usageLimit)],
			admin,
		);
		setLimitTarget(null);
		toast.success(`Saved the usage limit for ${limitTarget.subject.name}`);
		reloadEngines();
	};

	const handleOpenRemove = (grantee: EngineGrantee) => {
		setRemoveError(null);
		setRemoveTarget(grantee);
	};

	const handleRemove = async () => {
		if (!removeTarget) {
			return;
		}
		setIsChanging(true);
		setRemoveError(null);
		try {
			await savePermissionBatches(
				[toRemoveEngineBatch(id, removeTarget.subject)],
				admin,
			);
		} catch (e) {
			setRemoveError(
				getErrorMessage(e, "Could not remove the engine's access"),
			);
			setIsChanging(false);
			return;
		}
		setIsChanging(false);
		didRemoveRef.current = true;
		toast.success(`${removeTarget.subject.name} no longer has access`);
		setRemoveTarget(null);
		reloadEngines();
	};

	return (
		<div className="flex flex-col gap-4">
			{permissions.error ? (
				<Alert variant="destructive">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						<span>
							Could not read the engines that can use this engine.{" "}
							{permissions.error}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={permissions.isLoading}
							onClick={permissions.refresh}
						>
							Try Again
						</Button>
					</AlertDescription>
				</Alert>
			) : null}
			{canChangeEngines && permissions.addsAreAdminOnly ? (
				<Alert>
					<AlertDescription>
						Only admins can give engines access to this engine, from
						its settings page in admin mode. You can still change or
						take away the access engines have.
					</AlertDescription>
				</Alert>
			) : null}
			{levelError ? (
				<Alert variant="destructive">
					<AlertDescription>{levelError}</AlertDescription>
				</Alert>
			) : null}
			<div className="rounded-xl border border-border">
				<div className="flex items-start justify-between gap-4 rounded-t-xl border-border border-b bg-background px-6 py-3">
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<div className="flex flex-wrap items-center gap-2">
							<H4 id={headingId}>Engines</H4>
							{hasLimits ? (
								<UsageLimitGuideButton
									section="rules"
									viewer={{
										canSetModelLimits:
											permissions.canChangeModelLimits,
										isAdminMode: admin,
									}}
								/>
							) : null}
						</div>
						<Muted className="font-normal">
							Other engines that can call this one, even for
							people with no access to it, such as a vector
							database calling its embedding model.
						</Muted>
					</div>
					{canAddEngines ? (
						<Button
							ref={addButtonRef}
							type="button"
							size="sm"
							className="shrink-0"
							onClick={() => {
								setAddDialogKey((key) => key + 1);
								setIsAddOpen(true);
							}}
						>
							<Plus className="size-4" aria-hidden />
							Add Engine
						</Button>
					) : null}
				</div>
				<Table
					className="rounded-b-xl bg-background"
					aria-labelledby={headingId}
				>
					<TableHeader>
						<TableRow>
							<TableHead className="pr-4 pl-6">Engine</TableHead>
							<TableHead className="px-4">Permission</TableHead>
							{hasLimits ? (
								<TableHead className="px-4">
									Usage Limit
								</TableHead>
							) : null}
							{hasEndDates ? (
								<TableHead className="px-4">Ends</TableHead>
							) : null}
							{canChangeEngines ? (
								<TableHead className="w-px whitespace-nowrap px-4 text-center">
									Actions
								</TableHead>
							) : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{engines && engines.length > 0 ? (
							engines.map((grantee) => {
								const { id: granteeId, name } = grantee.subject;
								const granteeKey = toGranteeKey(grantee);
								const level =
									shownPendingLevel?.granteeKey === granteeKey
										? shownPendingLevel.level
										: grantee.access.level;
								const limitSummary = (
									<UsageLimitSummary
										limit={grantee.access.usageLimit}
										isChanged={false}
										source="ENGINE"
									/>
								);
								return (
									<TableRow key={granteeKey}>
										<TableCell className="pr-4 pl-6">
											<div className="flex max-w-xs items-center gap-3">
												<EngineSubtypeIcon
													engineType={
														grantee.subject.type
													}
													engineSubtype={
														grantee.subject
															.subtype ??
														undefined
													}
													alt=""
													className="size-8 shrink-0 object-contain"
												/>
												<div className="flex min-w-0 flex-col">
													<span className="wrap-break-word whitespace-normal font-medium">
														{name}
													</span>
													<ResourceId
														id={granteeId}
														name={name}
													/>
												</div>
											</div>
										</TableCell>
										<TableCell className="px-4">
											{isEngineGranteeLevel(level) ? (
												<Select
													value={level}
													disabled={
														!canChangeEngines ||
														isBusy
													}
													onValueChange={(value) =>
														handleLevelChange(
															grantee,
															value,
														)
													}
												>
													<SelectTrigger
														size="sm"
														className="w-36"
														aria-label={`Permission for ${name}`}
													>
														<SelectValue>
															{getLevelLabel(
																level,
															)}
														</SelectValue>
													</SelectTrigger>
													<SelectContent>
														{ENGINE_GRANTEE_LEVELS.map(
															(option) => (
																<SelectItem
																	key={option}
																	value={
																		option
																	}
																>
																	{getLevelLabel(
																		option,
																	)}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											) : (
												getLevelLabel(level)
											)}
										</TableCell>
										{hasLimits ? (
											<TableCell className="px-4 text-sm">
												{canChangeLimit ? (
													<UsageLimitEditButton
														disabled={isBusy}
														context={`Usage limit for ${name}`}
														onClick={() =>
															handleOpenLimit(
																grantee,
															)
														}
													>
														{limitSummary}
													</UsageLimitEditButton>
												) : (
													<span className="flex max-w-64 flex-col gap-0.5 whitespace-normal">
														{limitSummary}
														<span className="text-muted-foreground text-xs">
															{
																OWNERS_ONLY_LIMIT_REASON
															}
														</span>
													</span>
												)}
											</TableCell>
										) : null}
										{hasEndDates ? (
											<TableCell className="px-4">
												{formatLocalDateTime(
													grantee.access.endDate ??
														undefined,
												) ?? (
													<span className="text-muted-foreground">
														No end date
													</span>
												)}
											</TableCell>
										) : null}
										{canChangeEngines ? (
											<TableCell className="px-4 text-center">
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															type="button"
															variant="ghost"
															size="icon-sm"
															disabled={isBusy}
															aria-label={`Remove access for ${name}`}
															onClick={() =>
																handleOpenRemove(
																	grantee,
																)
															}
														>
															<Trash2
																className="size-4"
																aria-hidden
															/>
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														Remove Access
													</TooltipContent>
												</Tooltip>
											</TableCell>
										) : null}
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell
									colSpan={columnCount}
									className="text-center"
								>
									{permissions.isLoading ? (
										<span className="flex items-center justify-center gap-2 text-muted-foreground">
											<Spinner />
											Loading engines...
										</span>
									) : permissions.error ? null : (
										"No engines have access yet"
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{canChangeEngines ? (
				<AddEngineEngineDialog
					key={addDialogKey}
					open={isAddOpen}
					engineId={id}
					model={
						hasLimits
							? { isCostAvailable, canChangeLimit }
							: undefined
					}
					admin={admin}
					onClose={(granteeId) => {
						setIsAddOpen(false);
						if (granteeId) {
							reloadEngines();
						}
					}}
				/>
			) : null}

			{limitTarget ? (
				<UsageLimitDialog
					key={`limit-${limitDialogKey}`}
					open
					title={`Usage Limit for ${limitTarget.subject.name}`}
					description="Covers the calls this engine's own code makes to the model for people whose only way to it is the engine. Set an overall amount for the engine, an amount for each user, or both."
					source="ENGINE"
					defaultValue={limitTarget.access.usageLimit ?? null}
					isCostAvailable={isCostAvailable}
					saveLabel="Save Limit"
					onSave={handleSaveLimit}
					onClose={() => setLimitTarget(null)}
				/>
			) : null}

			{removeTarget ? (
				<Dialog
					open
					onOpenChange={(isOpen) => {
						if (!isOpen && !isChanging) {
							setRemoveTarget(null);
						}
					}}
				>
					<DialogContent
						onCloseAutoFocus={(event) => {
							if (didRemoveRef.current) {
								didRemoveRef.current = false;
								event.preventDefault();
								addButtonRef.current?.focus();
							}
						}}
					>
						<DialogHeader>
							<DialogTitle className="font-medium text-base leading-6">
								Remove Engine Access
							</DialogTitle>
							<DialogDescription>
								The own code of{" "}
								<span className="font-medium text-foreground">
									{removeTarget.subject.name}
								</span>{" "}
								stops using this engine for people who have no
								access to it themselves. People with their own
								access to the engine keep it.
							</DialogDescription>
						</DialogHeader>
						{removeError ? (
							<Alert variant="destructive">
								<AlertDescription>
									{removeError}
								</AlertDescription>
							</Alert>
						) : null}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								disabled={isChanging}
								onClick={() => setRemoveTarget(null)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="destructive"
								disabled={isChanging}
								onClick={handleRemove}
							>
								{isChanging ? "Removing..." : "Remove Access"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</div>
	);
};
