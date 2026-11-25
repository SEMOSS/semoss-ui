import { useId } from "react";
import { UsageLimitGuideButton } from "@semoss/shared";
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
} from "@semoss/ui/next";
import { capitalize } from "@semoss/utility/text";
import { GrantEndDate } from "@/features/grants/grant-end-date";
import { GrantLevelCell } from "@/features/grants/grant-level-cell";
import { getTargetNoun } from "@/features/grants/grant-levels";
import { GrantResource } from "@/features/grants/grant-resource";
import { GrantUsageLimitCell } from "@/features/grants/grant-usage-limit-cell";
import { useResourceGrants } from "@/features/grants/use-resource-grants";

/** Props for {@link AccessToEnginesTable}. */
export interface AccessToEnginesTableProps {
	/** PROJECT for a project's Access Control tab, ENGINE for an engine's */
	resourceType: "PROJECT" | "ENGINE";
	/** The project's or engine's id */
	id: string;
	/**
	 * A project's type, such as WORKSPACE, or an engine's, which names it in
	 * the table's words, such as "this agent"
	 */
	type: string;
	/**
	 * Whether the list is read in admin mode, where an admin sees any
	 * project's or engine's; outside it an admin has only their own permissions
	 */
	admin?: boolean;
}

/**
 * Lists the engines and projects an app, an agent or an engine can use because
 * each one gives it a permission: the other direction from the tables that
 * list who can use an engine or a project. An app's custom reactors, an
 * agent's runs, or an engine's own code, use each one at its level even for
 * people with no access to it, and each row says what that level allows. The
 * permission is set on the engine or project that gives it, so the table only
 * shows it; each name opens its catalog page in a new tab, whose Access
 * Control tab is where its owners change it. The editors and owners see the
 * list, and so do admins in admin mode.
 */
export const AccessToEnginesTable = ({
	resourceType,
	id,
	type,
	admin = false,
}: AccessToEnginesTableProps) => {
	const headingId = useId();
	const { accessToEngines, isLoading, error, refresh } = useResourceGrants(
		{ resourceType, id },
		admin,
	);
	const isProject = resourceType === "PROJECT";
	const noun = getTargetNoun(resourceType, type);
	const limitSource = isProject ? "APP" : "ENGINE";
	const whoUsesIt = !isProject
		? "Its own code uses each one at that level, even for people with no access to it, such as a model running a guardrail."
		: type === "WORKSPACE"
			? "Its runs use each one at that level, even for people with no access to it, such as a skill its users cannot open."
			: "Its custom reactors use each one at that level, even for people with no access to it.";
	const hasLimits =
		accessToEngines?.some((entry) => entry.target.type === "MODEL") ??
		false;
	const hasEndDates =
		accessToEngines?.some((entry) => entry.access.endDate) ?? false;
	const columnCount = 2 + (hasLimits ? 1 : 0) + (hasEndDates ? 1 : 0);

	return (
		<div className="flex flex-col gap-4">
			{error ? (
				<Alert variant="destructive">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						<span>
							Could not read what this {noun} can use. {error}
						</span>
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
			<div className="rounded-xl border border-border">
				<div className="flex flex-col gap-1 rounded-t-xl border-border border-b bg-background px-6 py-3">
					<div className="flex flex-wrap items-center gap-2">
						<H4 id={headingId}>
							What This {capitalize(noun)} Can Use
						</H4>
						{hasLimits ? (
							<UsageLimitGuideButton
								section="rules"
								viewer={{
									canSetModelLimits: false,
									isAdminMode: admin,
								}}
							/>
						) : null}
					</div>
					<Muted className="font-normal">
						Engines and projects that give this {noun} a permission.{" "}
						{whoUsesIt} Each one's owners change it on its Access
						Control tab.
					</Muted>
				</div>
				<Table
					className="rounded-b-xl bg-background"
					aria-labelledby={headingId}
				>
					<TableHeader>
						<TableRow>
							<TableHead className="pr-4 pl-6">
								Engine or Project
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
						</TableRow>
					</TableHeader>
					<TableBody>
						{accessToEngines && accessToEngines.length > 0 ? (
							accessToEngines.map(({ target, access }) => (
								<TableRow
									key={`${target.resourceType}:${target.type}:${target.id}`}
								>
									<TableCell className="pr-4 pl-6">
										<GrantResource
											type={target.type}
											id={target.id}
											name={target.name}
											subtype={target.subtype}
										/>
									</TableCell>
									<TableCell className="px-4">
										<GrantLevelCell
											resourceType={target.resourceType}
											level={access.level}
											label={`Permission on ${target.name}`}
										/>
									</TableCell>
									{hasLimits ? (
										<TableCell className="px-4 text-sm">
											<GrantUsageLimitCell
												limit={access.usageLimit}
												source={limitSource}
												isModel={
													target.type === "MODEL"
												}
												context={`Usage limit on ${target.name}`}
												readOnlyNote="Set by the model's owners"
											/>
										</TableCell>
									) : null}
									{hasEndDates ? (
										<TableCell className="px-4">
											<GrantEndDate
												endDate={access.endDate}
											/>
										</TableCell>
									) : null}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columnCount}
									className="text-center"
								>
									{isLoading ? (
										<span className="flex items-center justify-center gap-2 text-muted-foreground">
											<Spinner />
											Loading...
										</span>
									) : error ? null : (
										`No engine or project gives this ${noun} a permission yet`
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};
