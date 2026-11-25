import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import type { GranteePermission } from "@semoss/sdk";
import { UsageLimitGuideButton } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	H3,
	Muted,
	P,
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
import { GrantTypeSelect } from "@/features/grants/grant-type-select";
import { ALL_GRANT_TYPES } from "@/features/grants/grant-types";
import { GrantUsageLimitCell } from "@/features/grants/grant-usage-limit-cell";
import { granteeKey } from "@/features/grants/grants";
import { RemoveGrantDialog } from "@/features/grants/remove-grant-dialog";
import {
	type GrantRow,
	useGrantChanges,
} from "@/features/grants/use-grant-changes";
import { GRANTS_PAGE_SIZE, type GrantKind } from "./grant-pairs";
import { useGrantedAccess } from "./use-granted-access";

/** Props for {@link GrantSection}. */
export interface GrantSectionProps {
	/** The kind of access the section lists, which names it and its columns and limits its filters */
	grantKind: GrantKind;
	/** The page's search: text the name or id of either side contains */
	search: string;
	/**
	 * Whether to list and change every engine's and project's permissions, in
	 * admin mode; outside it an admin has only their own permissions
	 */
	admin: boolean;
	/** A count the page bumps to read every section again */
	version: number;
}

/**
 * @param grant - a permission the section lists
 * @returns it as a row the shared grant changes take
 */
const toRow = (grant: GranteePermission): GrantRow => ({
	target: grant.target,
	grantee: { subject: grant.subject, access: grant.access },
});

/**
 * One kind of the permissions engines and projects give: what apps and agents
 * use of projects, what they use of engines, or what engines use of engines.
 * The section filters its two sides by type and pages its own list, read with
 * the page's search; its title counts what matches. Each row reads "this app,
 * agent or engine can use this engine or project", with its level and what the
 * level allows, a model's usage limit and the end date. A row's `canChange`
 * (the target's owners, and admin mode) lets the user change its level or its
 * limit in place, or take it away after a confirmation; everyone else sees it
 * read-only.
 */
export const GrantSection = ({
	grantKind,
	search,
	admin,
	version,
}: GrantSectionProps) => {
	const { title, description, grantee, target } = grantKind;
	const headingId = useId();
	const [targetType, setTargetType] = useState(ALL_GRANT_TYPES);
	const [granteeType, setGranteeType] = useState(ALL_GRANT_TYPES);
	const [offset, setOffset] = useState(0);
	const [lastSearch, setLastSearch] = useState(search);
	if (lastSearch !== search) {
		setLastSearch(search);
		setOffset(0);
	}
	const { grants, total, isLoading, error, refresh } = useGrantedAccess(
		{
			search,
			targetKind: target.kind,
			targetType: targetType === ALL_GRANT_TYPES ? "" : targetType,
			granteeKind: grantee.kind,
			granteeType: granteeType === ALL_GRANT_TYPES ? "" : granteeType,
			limit: GRANTS_PAGE_SIZE,
			offset,
		},
		admin,
		version,
	);
	const changes = useGrantChanges({ rows: grants, admin, onSaved: refresh });

	const shown = grants ?? [];
	const hasLimits = shown.some((grant) => grant.target.type === "MODEL");
	const hasEndDates = shown.some((grant) => grant.access.endDate);
	const canChangeAny = shown.some((grant) => grant.canChange);
	const isBusy = changes.isChanging || isLoading;
	const firstShown = offset + 1;
	const lastShown = offset + shown.length;
	const columnCount =
		3 +
		(hasLimits ? 1 : 0) +
		(hasEndDates ? 1 : 0) +
		(canChangeAny ? 1 : 0);
	const limitSource = grantee.kind === "PROJECT" ? "APP" : "ENGINE";
	const { limitRow, removeRow } = changes;

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<div className="flex flex-wrap items-center gap-2">
					<H3 id={headingId} className="font-medium text-lg">
						{title} {grants ? `(${total})` : null}
					</H3>
					{hasLimits ? (
						<UsageLimitGuideButton
							section="rules"
							viewer={{
								canSetModelLimits: canChangeAny,
								isAdminMode: admin,
							}}
						/>
					) : null}
				</div>
				<Muted className="font-normal">
					{description} {describeGrantLevels(target.kind)}
				</Muted>
			</div>

			<div className="flex flex-wrap items-end gap-3">
				<GrantTypeSelect
					label={`${grantee.noun} Type`}
					options={grantee.typeOptions}
					value={granteeType}
					className="w-full sm:w-56"
					onChange={(value) => {
						setGranteeType(value);
						setOffset(0);
					}}
				/>
				<GrantTypeSelect
					label="Can Use Type"
					options={target.typeOptions}
					value={targetType}
					className="w-full sm:w-56"
					onChange={(value) => {
						setTargetType(value);
						setOffset(0);
					}}
				/>
			</div>

			{error ? (
				<Alert variant="destructive">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						<span>Could not read these permissions. {error}</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isLoading}
							onClick={refresh}
						>
							Try Again
						</Button>
					</AlertDescription>
				</Alert>
			) : null}
			{changes.levelError ? (
				<Alert variant="destructive">
					<AlertDescription>{changes.levelError}</AlertDescription>
				</Alert>
			) : null}

			<div className="rounded-xl border border-border">
				<Table
					className="rounded-xl bg-background"
					aria-labelledby={headingId}
				>
					<TableHeader>
						<TableRow>
							<TableHead className="pr-4 pl-6">
								{grantee.noun}
							</TableHead>
							<TableHead className="px-4">Can Use</TableHead>
							<TableHead className="px-4">Permission</TableHead>
							{hasLimits ? (
								<TableHead className="px-4">
									Usage Limit
								</TableHead>
							) : null}
							{hasEndDates ? (
								<TableHead className="px-4">Ends</TableHead>
							) : null}
							{canChangeAny ? (
								<TableHead className="w-px whitespace-nowrap px-4 text-center">
									Actions
								</TableHead>
							) : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{shown.length > 0 ? (
							shown.map((grant) => {
								const row = toRow(grant);
								const pair = `${grant.subject.name} on ${grant.target.name}`;
								return (
									<TableRow
										key={granteeKey(
											grant.target,
											grant.subject,
										)}
									>
										<TableCell className="pr-4 pl-6">
											<GrantResource
												type={grant.subject.type}
												id={grant.subject.id}
												name={grant.subject.name}
												subtype={grant.subject.subtype}
											/>
										</TableCell>
										<TableCell className="px-4">
											<GrantResource
												type={grant.target.type}
												id={grant.target.id}
												name={grant.target.name}
												subtype={grant.target.subtype}
											/>
										</TableCell>
										<TableCell className="px-4">
											<GrantLevelCell
												resourceType={
													grant.target.resourceType
												}
												level={changes.levelOf(row)}
												disabled={isBusy}
												label={`Permission for ${pair}`}
												onChange={
													grant.canChange
														? (value) =>
																changes.changeLevel(
																	row,
																	value,
																)
														: undefined
												}
											/>
										</TableCell>
										{hasLimits ? (
											<TableCell className="px-4 text-sm">
												<GrantUsageLimitCell
													limit={
														grant.access.usageLimit
													}
													source={limitSource}
													isModel={
														grant.target.type ===
														"MODEL"
													}
													disabled={isBusy}
													context={`Usage limit for ${pair}`}
													readOnlyNote="Set by the model's owners"
													onEdit={
														grant.canChange
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
														grant.access.endDate
													}
												/>
											</TableCell>
										) : null}
										{canChangeAny ? (
											<TableCell className="px-4 text-center">
												{grant.canChange ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																type="button"
																variant="ghost"
																size="icon-sm"
																disabled={
																	isBusy
																}
																aria-label={`Remove access for ${pair}`}
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
												) : null}
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
									{isLoading ? (
										<span className="flex items-center justify-center gap-2 text-muted-foreground">
											<Spinner />
											Loading permissions...
										</span>
									) : error ? null : (
										"No permissions match"
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{total > GRANTS_PAGE_SIZE || offset > 0 ? (
				<footer className="flex flex-wrap items-center justify-between gap-2">
					<output>
						<P className="text-muted-foreground text-sm">
							{isLoading
								? "Loading permissions..."
								: `Showing ${firstShown}-${lastShown} of ${total} permissions`}
						</P>
					</output>
					<nav
						aria-label={`${title} pagination`}
						className="flex flex-wrap items-center gap-2"
					>
						<Button
							type="button"
							variant="outline"
							size="icon"
							aria-label="Previous"
							title="Previous page"
							disabled={isBusy || offset === 0}
							onClick={() =>
								setOffset((current) =>
									Math.max(0, current - GRANTS_PAGE_SIZE),
								)
							}
						>
							<ChevronLeft
								aria-hidden="true"
								className="size-4"
							/>
						</Button>
						<span className="min-w-16 text-center text-sm">
							Page {Math.floor(offset / GRANTS_PAGE_SIZE) + 1}
						</span>
						<Button
							type="button"
							variant="outline"
							size="icon"
							aria-label="Next"
							title="Next page"
							disabled={
								isBusy || Boolean(error) || lastShown >= total
							}
							onClick={() =>
								setOffset(
									(current) => current + GRANTS_PAGE_SIZE,
								)
							}
						>
							<ChevronRight
								aria-hidden="true"
								className="size-4"
							/>
						</Button>
					</nav>
				</footer>
			) : null}

			{limitRow ? (
				<UsageLimitDialog
					key={`limit-${changes.limitDialogKey}`}
					open
					title={`Usage Limit for ${limitRow.grantee.subject.name}`}
					description={`Covers the calls ${limitRow.grantee.subject.name} makes to ${limitRow.target.name} for people whose only way to the model is this permission. Set an overall amount, an amount for each user, or both.`}
					source={limitSource}
					defaultValue={limitRow.grantee.access.usageLimit ?? null}
					isCostAvailable
					saveLabel="Save Limit"
					onSave={changes.saveLimit}
					onClose={changes.closeLimit}
				/>
			) : null}

			{removeRow ? (
				<RemoveGrantDialog
					description={
						<>
							<span className="font-medium text-foreground">
								{removeRow.grantee.subject.name}
							</span>{" "}
							stops using{" "}
							<span className="font-medium text-foreground">
								{removeRow.target.name}
							</span>{" "}
							for people who have no access to it themselves.
							People with their own access keep it.
						</>
					}
					error={changes.removeError}
					isRemoving={changes.isChanging}
					onConfirm={changes.remove}
					onCancel={changes.closeRemove}
				/>
			) : null}
		</section>
	);
};
