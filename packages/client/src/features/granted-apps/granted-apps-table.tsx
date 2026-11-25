import { Plus, Trash2 } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import {
	OWNERS_ONLY_LIMIT_REASON,
	UsageLimitGuideButton,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	H4,
	Muted,
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
} from "@semoss/ui/next";
import { capitalize } from "@semoss/utility/text";
import { UsageLimitDialog } from "@/features/bulk-access-management/usage-limit-dialog";
import { GrantEndDate } from "@/features/grants/grant-end-date";
import { GrantLevelCell } from "@/features/grants/grant-level-cell";
import {
	describeGrantLevels,
	getTargetNoun,
} from "@/features/grants/grant-levels";
import { GrantResource } from "@/features/grants/grant-resource";
import { getTypePlural } from "@/features/grants/grant-types";
import { GrantUsageLimitCell } from "@/features/grants/grant-usage-limit-cell";
import { type GrantTarget, isAgent } from "@/features/grants/grants";
import { RemoveGrantDialog } from "@/features/grants/remove-grant-dialog";
import { useGrantChanges } from "@/features/grants/use-grant-changes";
import { useResourceGrants } from "@/features/grants/use-resource-grants";
import { AddGrantedAppsDialog } from "./add-granted-apps-dialog";

/** Props for {@link GrantedAppsTable}. */
export interface GrantedAppsTableProps {
	/** The engine or project that gives the permissions */
	target: GrantTarget;
	/**
	 * An engine's type or a project's type, such as MODEL or SKILL. Only a
	 * model's permissions have usage limits: its table has a Usage Limit
	 * column, and Add offers the App Limit. A project's type names it in the
	 * table's words, such as "this skill".
	 */
	type: string;
	/**
	 * Whether the list is read and saved in admin mode, where an admin can
	 * change any engine's or project's; outside it an admin has only their own
	 * permissions
	 */
	admin?: boolean;
}

/**
 * Lists the apps and agents an engine or a project gives a permission to: the
 * apps whose custom reactors, and the agents whose runs, can use it for people
 * who have no access to it themselves, such as an agent given a skill. Its
 * editors and owners see the list, and so do admins in admin mode. Its owners
 * can add apps and agents, change a level between Read-Only and Editor, and
 * take access away, and on a model set the usage limit, shared by the app or
 * agent or for each of its users. Where only admins give access, an owner
 * outside admin mode cannot add one. Every change is one permission batch
 * saved at once, and the list is read again after it. What the user may
 * change, and whether a model has known prices, come from the target's
 * permissions, so the controls follow the backend.
 */
export const GrantedAppsTable = ({
	target,
	type,
	admin = false,
}: GrantedAppsTableProps) => {
	const headingId = useId();
	const grants = useResourceGrants(target, admin);
	const { canChangeEngines } = grants;
	const apps = useMemo(
		() =>
			grants.grantees?.filter(
				(grantee) => grantee.subject.type === "PROJECT",
			) ?? null,
		[grants.grantees],
	);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [addDialogKey, setAddDialogKey] = useState(0);
	const addButtonRef = useRef<HTMLButtonElement>(null);
	const didRemoveRef = useRef(false);
	const changes = useGrantChanges({
		rows: apps,
		admin,
		onSaved: grants.refresh,
		onRemoved: () => {
			didRemoveRef.current = true;
		},
	});

	const canAddApps = canChangeEngines && !grants.addsAreAdminOnly;
	const hasLimits = target.resourceType === "ENGINE" && type === "MODEL";
	const noun = getTargetNoun(target.resourceType, type);
	const isCostAvailable = grants.costLimitsAvailable;
	const canChangeLimit = canChangeEngines && grants.canChangeModelLimits;
	const hasEndDates = apps?.some((app) => app.access.endDate) ?? false;
	const isBusy = changes.isChanging || grants.isLoading;
	const columnCount =
		2 +
		(hasLimits ? 1 : 0) +
		(hasEndDates ? 1 : 0) +
		(canChangeEngines ? 1 : 0);
	const removeRow = changes.removeRow;
	const limitRow = changes.limitRow;

	return (
		<div className="flex flex-col gap-4">
			{grants.error ? (
				<Alert variant="destructive">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						<span>
							Could not read the apps and agents that can use this{" "}
							{noun}. {grants.error}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={grants.isLoading}
							onClick={grants.refresh}
						>
							Try Again
						</Button>
					</AlertDescription>
				</Alert>
			) : null}
			{canChangeEngines && grants.addsAreAdminOnly ? (
				<Alert>
					<AlertDescription>
						Only admins can give access to{" "}
						{getTypePlural(target.resourceType, type)}, from this
						page in admin mode. You can still change or take away
						the access apps and agents already have.
					</AlertDescription>
				</Alert>
			) : null}
			{changes.levelError ? (
				<Alert variant="destructive">
					<AlertDescription>{changes.levelError}</AlertDescription>
				</Alert>
			) : null}
			<div className="rounded-xl border border-border">
				<div className="flex flex-wrap items-start justify-between gap-4 rounded-t-xl border-border border-b bg-background px-6 py-3">
					<div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
						<div className="flex flex-wrap items-center gap-2">
							<H4 id={headingId}>
								Apps and Agents That Can Use This{" "}
								{capitalize(noun)}
							</H4>
							{hasLimits ? (
								<UsageLimitGuideButton
									section="rules"
									viewer={{
										canSetModelLimits:
											grants.canChangeModelLimits,
										isAdminMode: admin,
									}}
								/>
							) : null}
						</div>
						<Muted className="font-normal">
							Apps whose custom reactors, and agents whose runs,
							can use this {noun}, even for people with no access
							to it. {describeGrantLevels(target.resourceType)}
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
							Add App or Agent
						</Button>
					) : null}
				</div>
				<Table
					className="rounded-b-xl bg-background"
					aria-labelledby={headingId}
				>
					<TableHeader>
						<TableRow>
							<TableHead className="pr-4 pl-6">
								App or Agent
							</TableHead>
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
								const row = { target, grantee: app };
								return (
									<TableRow key={appId}>
										<TableCell className="pr-4 pl-6">
											<GrantResource
												type={app.subject.type}
												id={appId}
												name={name}
												subtype={app.subject.subtype}
											/>
										</TableCell>
										<TableCell className="px-4">
											<GrantLevelCell
												resourceType={
													target.resourceType
												}
												level={changes.levelOf(row)}
												disabled={
													!canChangeEngines || isBusy
												}
												label={`Permission for ${name}`}
												onChange={(value) =>
													changes.changeLevel(
														row,
														value,
													)
												}
											/>
										</TableCell>
										{hasLimits ? (
											<TableCell className="px-4 text-sm">
												<GrantUsageLimitCell
													limit={
														app.access.usageLimit
													}
													source="APP"
													isModel
													disabled={isBusy}
													context={`Usage limit for ${name}`}
													readOnlyNote={
														OWNERS_ONLY_LIMIT_REASON
													}
													onEdit={
														canChangeLimit
															? () =>
																	changes.openLimit(
																		row,
																	)
															: undefined
													}
												/>
											</TableCell>
										) : null}
										{hasEndDates ? (
											<TableCell className="px-4">
												<GrantEndDate
													endDate={app.access.endDate}
												/>
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
																changes.openRemove(
																	row,
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
									{grants.isLoading ? (
										<span className="flex items-center justify-center gap-2 text-muted-foreground">
											<Spinner />
											Loading apps and agents...
										</span>
									) : grants.error ? null : (
										"No apps or agents have access yet"
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{canChangeEngines ? (
				<AddGrantedAppsDialog
					key={addDialogKey}
					open={isAddOpen}
					target={target}
					targetNoun={noun}
					model={
						hasLimits
							? { isCostAvailable, canChangeLimit }
							: undefined
					}
					admin={admin}
					grantedAppIds={apps?.map((app) => app.subject.id) ?? []}
					onClose={(appIds) => {
						setIsAddOpen(false);
						if (appIds && appIds.length > 0) {
							grants.refresh();
						}
					}}
				/>
			) : null}

			{limitRow ? (
				<UsageLimitDialog
					key={`limit-${changes.limitDialogKey}`}
					open
					title={`Usage Limit for ${limitRow.grantee.subject.name}`}
					description={
						isAgent(limitRow.grantee)
							? "Covers the calls this agent's runs make to the model for people whose only way to it is the agent. Set an overall amount for the agent, an amount for each user, or both."
							: "Covers the calls this app's custom reactors make to the model for people whose only way to it is the app. Set an overall amount for the app, an amount for each user, or both."
					}
					source="APP"
					defaultValue={limitRow.grantee.access.usageLimit ?? null}
					isCostAvailable={isCostAvailable}
					saveLabel="Save Limit"
					onSave={changes.saveLimit}
					onClose={changes.closeLimit}
				/>
			) : null}

			{removeRow ? (
				<RemoveGrantDialog
					description={
						<>
							{isAgent(removeRow.grantee)
								? "The runs of "
								: "The custom reactors of "}
							<span className="font-medium text-foreground">
								{removeRow.grantee.subject.name}
							</span>{" "}
							stop using this {noun} for people who have no access
							to it themselves. People with their own access to
							the {noun} keep it.
						</>
					}
					error={changes.removeError}
					isRemoving={changes.isChanging}
					onConfirm={changes.remove}
					onCancel={changes.closeRemove}
					onCloseAutoFocus={(event) => {
						if (didRemoveRef.current) {
							didRemoveRef.current = false;
							event.preventDefault();
							addButtonRef.current?.focus();
						}
					}}
				/>
			) : null}
		</div>
	);
};
