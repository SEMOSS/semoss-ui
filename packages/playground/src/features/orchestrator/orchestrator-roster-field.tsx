import { BotIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
} from "@semoss/ui/next";
import type { Workspace } from "@/types";

type RosterWorkspace = Pick<Workspace, "workspace_id" | "name" | "is_active">;

interface OrchestratorRosterFieldProps {
	workspaceId: string;
	value: { workspaceId: string }[];
	disabled?: boolean;
	onChange: (value: { workspaceId: string }[]) => void;
}

/** Excludes the Orchestrator and agents already present in its roster. */
export const getAvailableSpecialists = (
	workspaces: RosterWorkspace[],
	orchestratorId: string,
	roster: { workspaceId: string }[],
): RosterWorkspace[] => {
	const selectedIds = new Set(roster.map((entry) => entry.workspaceId));
	return workspaces.filter(
		(workspace) =>
			workspace.is_active &&
			workspace.workspace_id !== orchestratorId &&
			!selectedIds.has(workspace.workspace_id),
	);
};

/** Adds a specialist while rejecting blank, duplicate, and self references. */
export const addSpecialistToRoster = (
	roster: { workspaceId: string }[],
	specialistId: string,
	orchestratorId: string,
): { workspaceId: string }[] => {
	if (
		!specialistId ||
		specialistId === orchestratorId ||
		roster.some((entry) => entry.workspaceId === specialistId)
	) {
		return roster;
	}
	return [...roster, { workspaceId: specialistId }];
};

/** Edits the Orchestrator's ordered, duplicate-free specialist allowlist. */
export const OrchestratorRosterField = ({
	workspaceId,
	value,
	disabled = false,
	onChange,
}: OrchestratorRosterFieldProps) => {
	const { t } = useTranslation("workspace");
	const [candidateId, setCandidateId] = useState("");
	const workspaces = usePixel<{ workspaces: RosterWorkspace[] }>(
		"ListWorkspaces();",
		{ data: { workspaces: [] } },
	);
	const workspaceEntries = workspaces.data?.workspaces ?? [];
	const workspaceById = useMemo(
		() =>
			new Map(
				workspaceEntries.map((workspace) => [
					workspace.workspace_id,
					workspace,
				]),
			),
		[workspaceEntries],
	);
	const options = getAvailableSpecialists(
		workspaceEntries,
		workspaceId,
		value,
	);

	const handleAdd = (): void => {
		const next = addSpecialistToRoster(value, candidateId, workspaceId);
		if (next === value) return;
		onChange(next);
		setCandidateId("");
	};

	const handleRemove = (specialistId: string): void => {
		onChange(value.filter((entry) => entry.workspaceId !== specialistId));
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2 sm:flex-row">
				<Select
					value={candidateId}
					onValueChange={setCandidateId}
					disabled={disabled || workspaces.status === "LOADING"}
				>
					<SelectTrigger
						aria-label={t("orchestrator.selectSpecialist", {
							defaultValue: "Specialist agent",
						})}
						className="min-w-0 flex-1"
					>
						<SelectValue
							placeholder={t("orchestrator.selectPlaceholder", {
								defaultValue: "Select an agent",
							})}
						/>
					</SelectTrigger>
					<SelectContent>
						{options.map((workspace) => (
							<SelectItem
								key={workspace.workspace_id}
								value={workspace.workspace_id}
							>
								{workspace.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					type="button"
					variant="outline"
					disabled={disabled || !candidateId}
					onClick={handleAdd}
				>
					<PlusIcon aria-hidden="true" />
					{t("orchestrator.addSpecialist", {
						defaultValue: "Add specialist",
					})}
				</Button>
			</div>

			{workspaces.status === "LOADING" && value.length === 0 ? (
				<div className="flex min-h-32 items-center justify-center">
					<Spinner />
				</div>
			) : null}
			{workspaces.status === "ERROR" ? (
				<Alert variant="destructive">
					<AlertDescription>
						{t("orchestrator.loadError", {
							defaultValue: "Unable to load available agents.",
						})}
					</AlertDescription>
				</Alert>
			) : null}
			{workspaces.status !== "LOADING" && value.length === 0 ? (
				<Muted>
					{t("orchestrator.emptyRoster", {
						defaultValue: "No specialist agents are configured.",
					})}
				</Muted>
			) : null}
			{value.length > 0 ? (
				<ul className="flex flex-col divide-y divide-border rounded-md border border-border">
					{value.map((entry) => {
						const workspace = workspaceById.get(entry.workspaceId);
						const name = workspace?.name || entry.workspaceId;
						return (
							<li
								key={entry.workspaceId}
								className="flex min-w-0 items-center gap-3 p-3"
							>
								<BotIcon
									className="size-5 shrink-0 text-muted-foreground"
									aria-hidden="true"
								/>
								<span
									className="min-w-0 flex-1 truncate text-sm"
									title={name}
								>
									{name}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={disabled}
									aria-label={t(
										"orchestrator.removeSpecialist",
										{
											defaultValue: `Remove ${name}`,
											name,
										},
									)}
									onClick={() =>
										handleRemove(entry.workspaceId)
									}
								>
									<Trash2Icon aria-hidden="true" />
								</Button>
							</li>
						);
					})}
				</ul>
			) : null}
		</div>
	);
};
