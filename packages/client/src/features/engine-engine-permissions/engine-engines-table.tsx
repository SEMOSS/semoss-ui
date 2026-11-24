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
import { UsageLimitDialog } from "@/features/bulk-access-management/usage-limit-dialog";
import { GrantEndDate } from "@/features/grants/grant-end-date";
import { GrantLevelCell } from "@/features/grants/grant-level-cell";
import { describeGrantLevels } from "@/features/grants/grant-levels";
import { GrantResource } from "@/features/grants/grant-resource";
import { getTypePlural } from "@/features/grants/grant-types";
import { GrantUsageLimitCell } from "@/features/grants/grant-usage-limit-cell";
import type { GrantTarget } from "@/features/grants/grants";
import { RemoveGrantDialog } from "@/features/grants/remove-grant-dialog";
import { useGrantChanges } from "@/features/grants/use-grant-changes";
import { useResourceGrants } from "@/features/grants/use-resource-grants";
import type { ENGINE_TYPES } from "@/types";
import { AddEngineEngineDialog } from "./add-engine-engine-dialog";

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
	const target: GrantTarget = { resourceType: "ENGINE", id };
	const grants = useResourceGrants(target, admin);
	const { canChangeEngines } = grants;
	const engines = useMemo(
		() =>
			grants.grantees?.filter(
				(grantee) => grantee.subject.type !== "PROJECT",
			) ?? null,
		[grants.grantees],
	);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [addDialogKey, setAddDialogKey] = useState(0);
	const addButtonRef = useRef<HTMLButtonElement>(null);
	const didRemoveRef = useRef(false);
	const changes = useGrantChanges({
		rows: engines,
		admin,
		onSaved: grants.refresh,
		onRemoved: () => {
			didRemoveRef.current = true;
		},
	});

	const canAddEngines = canChangeEngines && !grants.addsAreAdminOnly;
	const hasLimits = type === "MODEL";
	const isCostAvailable = grants.costLimitsAvailable;
	const canChangeLimit = canChangeEngines && grants.canChangeModelLimits;
	const hasEndDates =
		engines?.some((grantee) => grantee.access.endDate) ?? false;
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
							Could not read the engines that can use this engine.{" "}
							{grants.error}
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
						{getTypePlural("ENGINE", type)}, from this page in admin
						mode. You can still change or take away the access
						engines already have.
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
								Engines That Can Use This Engine
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
							Other engines that can call this one, even for
							people with no access to it, such as a vector
							database calling its embedding model.{" "}
							{describeGrantLevels("ENGINE")}
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
								const { name } = grantee.subject;
								const row = { target, grantee };
								return (
									<TableRow
										key={`${grantee.subject.type}:${grantee.subject.id}`}
									>
										<TableCell className="pr-4 pl-6">
											<GrantResource
												type={grantee.subject.type}
												id={grantee.subject.id}
												name={name}
												subtype={
													grantee.subject.subtype
												}
											/>
										</TableCell>
										<TableCell className="px-4">
											<GrantLevelCell
												resourceType="ENGINE"
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
														grantee.access
															.usageLimit
													}
													source="ENGINE"
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
													endDate={
														grantee.access.endDate
													}
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
											Loading engines...
										</span>
									) : grants.error ? null : (
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
					granted={
						engines?.map((grantee) => ({
							id: grantee.subject.id,
							type: grantee.subject.type,
						})) ?? []
					}
					onClose={(granteeIds) => {
						setIsAddOpen(false);
						if (granteeIds && granteeIds.length > 0) {
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
					description="Covers the calls this engine's own code makes to the model for people whose only way to it is the engine. Set an overall amount for the engine, an amount for each user, or both."
					source="ENGINE"
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
							The own code of{" "}
							<span className="font-medium text-foreground">
								{removeRow.grantee.subject.name}
							</span>{" "}
							stops using this engine for people who have no
							access to it themselves. People with their own
							access to the engine keep it.
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
