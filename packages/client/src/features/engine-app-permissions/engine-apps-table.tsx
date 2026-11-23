import { Plus, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { type ModelUsageLimit, savePermissionBatches } from "@semoss/sdk";
import {
	AppCatalogAvatar,
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
import { AddEngineAppDialog } from "./add-engine-app-dialog";
import {
	ENGINE_APP_LEVELS,
	type EngineApp,
	type EngineAppLevel,
	isEngineAppLevel,
	toAppLevelBatch,
	toAppLimitBatch,
	toRemoveAppBatch,
} from "./engine-app-permissions";
import { useEngineAppPermissions } from "./use-engine-app-permissions";

/**
 * A level picked for an app, shown in its row from the pick until the apps are
 * read again, so the row never shows the level from before a save
 */
interface PendingLevel {
	/** The app */
	appId: string;
	/** The level picked */
	level: EngineAppLevel;
	/** The apps as read when it was picked; it applies only while they are the ones shown */
	apps: readonly EngineApp[];
}

/** Props for {@link EngineAppsTable}. */
export interface EngineAppsTableProps {
	/** The engine's id */
	id: string;
	/**
	 * The engine's type. Only a model's apps have usage limits: its table has a
	 * Usage Limit column, and Add App offers the App Limit.
	 */
	type: ENGINE_TYPES;
	/**
	 * Whether the apps are read and saved in admin mode, where an admin can
	 * change any engine's apps; outside it an admin has only their own
	 * permissions
	 */
	admin?: boolean;
}

/**
 * Lists the apps an engine gives a permission to: the apps whose custom
 * reactors can use the engine for people who have no access to it themselves.
 * The engine's editors and owners see the list, and so do admins in admin
 * mode. The engine's owners can add an app, change its level between Read-Only
 * and Editor, and take its access away, and on a model set its usage limit,
 * shared by the app or for each of its users. Where only admins give access,
 * an owner outside admin mode cannot add an app. Every change is one permission batch saved at once, and
 * the apps are read again after it. What the user may change, and whether a
 * model has known prices, come from the engine's permissions, so the controls
 * follow the backend.
 */
export const EngineAppsTable = ({
	id,
	type,
	admin = false,
}: EngineAppsTableProps) => {
	const headingId = useId();
	const permissions = useEngineAppPermissions(id, admin);
	const { apps, canChangeEngines } = permissions;
	const canAddApps = canChangeEngines && !permissions.addsAreAdminOnly;
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [addDialogKey, setAddDialogKey] = useState(0);
	const [isChanging, setIsChanging] = useState(false);
	const [pendingLevel, setPendingLevel] = useState<PendingLevel | null>(null);
	const [levelError, setLevelError] = useState<string | null>(null);
	const [limitTarget, setLimitTarget] = useState<EngineApp | null>(null);
	const [limitDialogKey, setLimitDialogKey] = useState(0);
	const [removeTarget, setRemoveTarget] = useState<EngineApp | null>(null);
	const [removeError, setRemoveError] = useState<string | null>(null);
	const addButtonRef = useRef<HTMLButtonElement>(null);
	const didRemoveRef = useRef(false);

	const hasLimits = type === "MODEL";
	const isCostAvailable = permissions.costLimitsAvailable;
	const canChangeLimit = canChangeEngines && permissions.canChangeModelLimits;
	const hasEndDates = apps?.some((app) => app.access.endDate) ?? false;
	const isBusy = isChanging || permissions.isLoading;
	const shownPendingLevel =
		pendingLevel !== null && pendingLevel.apps === apps
			? pendingLevel
			: null;
	const columnCount =
		2 +
		(hasLimits ? 1 : 0) +
		(hasEndDates ? 1 : 0) +
		(canChangeEngines ? 1 : 0);

	const reloadApps = () => {
		setLevelError(null);
		permissions.refresh();
	};

	const handleLevelChange = async (app: EngineApp, value: string) => {
		if (!apps || !isEngineAppLevel(value) || value === app.access.level) {
			return;
		}
		setIsChanging(true);
		setLevelError(null);
		setPendingLevel({ appId: app.subject.id, level: value, apps });
		try {
			await savePermissionBatches(
				[toAppLevelBatch(id, app, value)],
				admin,
			);
		} catch (e) {
			setPendingLevel(null);
			setLevelError(
				getErrorMessage(
					e,
					`Could not change the access of ${app.subject.name}`,
				),
			);
			setIsChanging(false);
			return;
		}
		setIsChanging(false);
		toast.success(`${app.subject.name} has ${getLevelLabel(value)} access`);
		reloadApps();
	};

	const handleOpenLimit = (app: EngineApp) => {
		setLimitDialogKey((key) => key + 1);
		setLimitTarget(app);
	};

	const handleSaveLimit = async (usageLimit: ModelUsageLimit | null) => {
		if (!limitTarget) {
			return;
		}
		await savePermissionBatches(
			[toAppLimitBatch(id, limitTarget, usageLimit)],
			admin,
		);
		setLimitTarget(null);
		toast.success(`Saved the usage limit for ${limitTarget.subject.name}`);
		reloadApps();
	};

	const handleOpenRemove = (app: EngineApp) => {
		setRemoveError(null);
		setRemoveTarget(app);
	};

	const handleRemove = async () => {
		if (!removeTarget) {
			return;
		}
		setIsChanging(true);
		setRemoveError(null);
		try {
			await savePermissionBatches(
				[toRemoveAppBatch(id, removeTarget.subject.id)],
				admin,
			);
		} catch (e) {
			setRemoveError(
				getErrorMessage(e, "Could not remove the app's access"),
			);
			setIsChanging(false);
			return;
		}
		setIsChanging(false);
		didRemoveRef.current = true;
		toast.success(`${removeTarget.subject.name} no longer has access`);
		setRemoveTarget(null);
		reloadApps();
	};

	return (
		<div className="flex flex-col gap-4">
			{permissions.error ? (
				<Alert variant="destructive">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						<span>
							Could not read the apps that can use this engine.{" "}
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
						Only admins can give apps access to this engine, from
						its settings page in admin mode. You can still change or
						take away the access apps have.
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
							<H4 id={headingId}>Apps</H4>
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
							Apps whose custom reactors can call this engine,
							even for people with no access to it.
						</Muted>
					</div>
					{canAddApps ? (
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
							Add App
						</Button>
					) : null}
				</div>
				<Table
					className="rounded-b-xl bg-background"
					aria-labelledby={headingId}
				>
					<TableHeader>
						<TableRow>
							<TableHead className="pr-4 pl-6">App</TableHead>
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
						{apps && apps.length > 0 ? (
							apps.map((app) => {
								const { id: appId, name } = app.subject;
								const level =
									shownPendingLevel?.appId === appId
										? shownPendingLevel.level
										: app.access.level;
								const limitSummary = (
									<UsageLimitSummary
										limit={app.access.usageLimit}
										isChanged={false}
										source="APP"
									/>
								);
								return (
									<TableRow key={appId}>
										<TableCell className="pr-4 pl-6">
											<div className="flex max-w-xs items-center gap-3">
												<AppCatalogAvatar
													projectId={appId}
													name={name}
													className="size-8 shrink-0 rounded-md text-xs"
												/>
												<div className="flex min-w-0 flex-col">
													<span className="wrap-break-word whitespace-normal font-medium">
														{name}
													</span>
													<ResourceId
														id={appId}
														name={name}
													/>
												</div>
											</div>
										</TableCell>
										<TableCell className="px-4">
											{isEngineAppLevel(level) ? (
												<Select
													value={level}
													disabled={
														!canChangeEngines ||
														isBusy
													}
													onValueChange={(value) =>
														handleLevelChange(
															app,
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
														{ENGINE_APP_LEVELS.map(
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
															handleOpenLimit(app)
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
													app.access.endDate ??
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
																	app,
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
											Loading apps...
										</span>
									) : permissions.error ? null : (
										"No apps have access yet"
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{canChangeEngines ? (
				<AddEngineAppDialog
					key={addDialogKey}
					open={isAddOpen}
					engineId={id}
					model={
						hasLimits
							? { isCostAvailable, canChangeLimit }
							: undefined
					}
					admin={admin}
					onClose={(appId) => {
						setIsAddOpen(false);
						if (appId) {
							reloadApps();
						}
					}}
				/>
			) : null}

			{limitTarget ? (
				<UsageLimitDialog
					key={`limit-${limitDialogKey}`}
					open
					title={`Usage Limit for ${limitTarget.subject.name}`}
					description="Covers the calls this app's custom reactors make to the model for people whose only way to it is the app. Set an overall amount for the app, an amount for each user, or both."
					source="APP"
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
								Remove App Access
							</DialogTitle>
							<DialogDescription>
								The custom reactors of{" "}
								<span className="font-medium text-foreground">
									{removeTarget.subject.name}
								</span>{" "}
								stop using this engine for people who have no
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
