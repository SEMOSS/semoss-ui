import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	toast,
} from "@semoss/ui/next";
import { TIME_PERIOD_LABELS } from "../constants";
import { useMockLimitsData } from "../hooks/use-mock-limits-data";
import type {
	DatabaseException,
	DatabaseLimitConfig,
	TimePeriod,
} from "../types";

interface DatabaseLimitsPanelProps {
	entityId: string;
	entityName: string;
}

/**
 * Panel for configuring database-specific retrieval limits with
 * per-user and per-team exceptions.
 */
export function DatabaseLimitsPanel({
	entityId,
	entityName,
}: DatabaseLimitsPanelProps) {
	const { users, teams, getDefaultDatabaseLimits } = useMockLimitsData();

	const [config, setConfig] = useState<DatabaseLimitConfig>(
		getDefaultDatabaseLimits(),
	);
	const [saved, setSaved] = useState<DatabaseLimitConfig>({ ...config });

	// Exceptions
	const [userExceptions, setUserExceptions] = useState<DatabaseException[]>([
		{
			entityId: "ielnemr",
			entityName: "Ibrahim ElNemr",
			entityDetails: [
				{ label: "ID", value: "ielnemr" },
				{ label: "Email", value: "ielnemr@deloitte.com" },
			],
			recordsPerQuery: 50000,
			dataSizePerQueryMB: 200,
			recordsPerWindow: 500000,
			isActive: true,
		},
	]);
	const [teamExceptions, setTeamExceptions] = useState<DatabaseException[]>([
		{
			entityId: "team-eng",
			entityName: "Engineering",
			entityDetails: [
				{ label: "Team Type", value: "CUSTOM" },
				{ label: "Members", value: "8" },
			],
			recordsPerQuery: 100000,
			dataSizePerQueryMB: 500,
			recordsPerWindow: 1000000,
			isActive: true,
		},
	]);

	const [showUserDialog, setShowUserDialog] = useState(false);
	const [showTeamDialog, setShowTeamDialog] = useState(false);
	const [selectedEntity, setSelectedEntity] = useState("");

	const isDirty =
		config.recordsPerQuery !== saved.recordsPerQuery ||
		config.dataSizePerQueryMB !== saved.dataSizePerQueryMB ||
		config.recordsPerWindow !== saved.recordsPerWindow ||
		config.windowPeriod !== saved.windowPeriod ||
		config.isActive !== saved.isActive;

	const handleSave = () => {
		setSaved({ ...config });
		toast.success("Database limits saved");
	};

	const handleReset = () => {
		setConfig({ ...saved });
	};

	const availableUsers = users.filter(
		(u) => !userExceptions.some((e) => e.entityId === u.id),
	);
	const availableTeams = teams.filter(
		(t) => !teamExceptions.some((e) => e.entityId === t.id),
	);

	const addUserException = () => {
		const user = users.find((u) => u.id === selectedEntity);
		if (!user) return;
		setUserExceptions([
			...userExceptions,
			{
				entityId: user.id,
				entityName: user.name,
				entityDetails: [
					{ label: "ID", value: user.id },
					{ label: "Email", value: user.email },
				],
				recordsPerQuery: config.recordsPerQuery * 2,
				dataSizePerQueryMB: config.dataSizePerQueryMB * 2,
				recordsPerWindow: config.recordsPerWindow * 2,
				isActive: true,
			},
		]);
		setShowUserDialog(false);
		setSelectedEntity("");
		toast.success("User exception added");
	};

	const addTeamException = () => {
		const team = teams.find((t) => t.id === selectedEntity);
		if (!team) return;
		setTeamExceptions([
			...teamExceptions,
			{
				entityId: team.id,
				entityName: team.name,
				entityDetails: [
					{ label: "Team Type", value: team.teamType },
					{ label: "Members", value: String(team.memberCount) },
				],
				recordsPerQuery: config.recordsPerQuery * 5,
				dataSizePerQueryMB: config.dataSizePerQueryMB * 5,
				recordsPerWindow: config.recordsPerWindow * 5,
				isActive: true,
			},
		]);
		setShowTeamDialog(false);
		setSelectedEntity("");
		toast.success("Team exception added");
	};

	const renderException = (
		ex: DatabaseException,
		onRemove: () => void,
		onUpdate: (updates: Partial<DatabaseException>) => void,
	) => (
		<div
			key={ex.entityId}
			className="flex items-start gap-3 rounded-lg border p-3"
		>
			<div className="flex flex-1 flex-col gap-2">
				<div className="flex flex-col">
					<span className="font-medium text-sm">{ex.entityName}</span>
					<div className="flex gap-3 text-muted-foreground text-xs">
						{ex.entityDetails.map((d) => (
							<span key={d.label}>
								{d.label}: {d.value}
							</span>
						))}
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-1">
						<Label className="text-xs">Records/Query:</Label>
						<Input
							type="number"
							value={ex.recordsPerQuery}
							onChange={(e) =>
								onUpdate({
									recordsPerQuery:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-24"
						/>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">Size/Query:</Label>
						<Input
							type="number"
							value={ex.dataSizePerQueryMB}
							onChange={(e) =>
								onUpdate({
									dataSizePerQueryMB:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-20"
						/>
						<span className="text-muted-foreground text-xs">
							MB
						</span>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">Records/Window:</Label>
						<Input
							type="number"
							value={ex.recordsPerWindow}
							onChange={(e) =>
								onUpdate({
									recordsPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-28"
						/>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">Active:</Label>
						<Switch
							checked={ex.isActive}
							onCheckedChange={(v) => onUpdate({ isActive: v })}
						/>
					</div>
				</div>
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="shrink-0 text-destructive"
				onClick={onRemove}
			>
				<Trash2 className="size-4" />
			</Button>
		</div>
	);

	return (
		<div
			className="flex w-full flex-col gap-8"
			data-testid="database-limits-panel"
		>
			{/* Header */}
			<div>
				<h2 className="font-semibold text-lg">
					Database Limits — {entityName}
				</h2>
				<p className="text-muted-foreground text-sm">
					Configure retrieval and data size restrictions for this
					database engine.
				</p>
			</div>

			{/* Default Limits */}
			<section className="rounded-lg border p-6">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-base">
							Default Retrieval Limits
						</h3>
						<p className="text-muted-foreground text-sm">
							These limits apply to all users and teams unless
							overridden by an exception below.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Label className="text-sm">Active:</Label>
						<Switch
							checked={config.isActive}
							onCheckedChange={(v) =>
								setConfig({ ...config, isActive: v })
							}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Records per Query
						</Label>
						<p className="text-muted-foreground text-xs">
							Maximum rows returned in a single query.
						</p>
						<Input
							type="number"
							value={config.recordsPerQuery}
							onChange={(e) =>
								setConfig({
									...config,
									recordsPerQuery:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-48"
						/>
						<span className="text-muted-foreground text-xs">
							rows
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Data Size per Query
						</Label>
						<p className="text-muted-foreground text-xs">
							Maximum payload size returned per request.
						</p>
						<Input
							type="number"
							value={config.dataSizePerQueryMB}
							onChange={(e) =>
								setConfig({
									...config,
									dataSizePerQueryMB:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-48"
						/>
						<span className="text-muted-foreground text-xs">
							MB
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Records per Time Window
						</Label>
						<p className="text-muted-foreground text-xs">
							Total rows retrievable within the configured period.
						</p>
						<Input
							type="number"
							value={config.recordsPerWindow}
							onChange={(e) =>
								setConfig({
									...config,
									recordsPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-48"
						/>
						<span className="text-muted-foreground text-xs">
							rows
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Time Window
						</Label>
						<p className="text-muted-foreground text-xs">
							Period over which the records-per-window limit
							resets.
						</p>
						<Select
							value={config.windowPeriod}
							onValueChange={(v: TimePeriod) =>
								setConfig({ ...config, windowPeriod: v })
							}
						>
							<SelectTrigger className="w-48">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{(
									Object.keys(
										TIME_PERIOD_LABELS,
									) as TimePeriod[]
								).map((p) => (
									<SelectItem key={p} value={p}>
										{TIME_PERIOD_LABELS[p]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="mt-6 flex items-center gap-3">
					<Button onClick={handleSave} disabled={!isDirty} size="sm">
						Save Changes
					</Button>
					{isDirty && (
						<Button
							variant="outline"
							onClick={handleReset}
							size="sm"
						>
							Reset
						</Button>
					)}
				</div>
			</section>

			{/* Per-User Exceptions */}
			<section className="rounded-lg border p-6">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-base">
							Per-User Exceptions
						</h3>
						<p className="text-muted-foreground text-sm">
							Override default limits for specific users who have
							access to this database.
						</p>
					</div>
					<Button
						size="sm"
						onClick={() => setShowUserDialog(true)}
						disabled={availableUsers.length === 0}
					>
						<Plus className="mr-1 size-3" /> Add User Exception
					</Button>
				</div>
				{userExceptions.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						No user exceptions. Default limits apply to all users.
					</p>
				) : (
					<div className="flex flex-col gap-2">
						{userExceptions.map((ex) =>
							renderException(
								ex,
								() =>
									setUserExceptions(
										userExceptions.filter(
											(e) => e.entityId !== ex.entityId,
										),
									),
								(updates) =>
									setUserExceptions(
										userExceptions.map((e) =>
											e.entityId === ex.entityId
												? { ...e, ...updates }
												: e,
										),
									),
							),
						)}
					</div>
				)}
			</section>

			{/* Per-Team Exceptions */}
			<section className="rounded-lg border p-6">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-base">
							Per-Team Exceptions
						</h3>
						<p className="text-muted-foreground text-sm">
							Override default limits for specific teams. All team
							members share the exception limits.
						</p>
					</div>
					<Button
						size="sm"
						onClick={() => setShowTeamDialog(true)}
						disabled={availableTeams.length === 0}
					>
						<Plus className="mr-1 size-3" /> Add Team Exception
					</Button>
				</div>
				{teamExceptions.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						No team exceptions. Default limits apply to all teams.
					</p>
				) : (
					<div className="flex flex-col gap-2">
						{teamExceptions.map((ex) =>
							renderException(
								ex,
								() =>
									setTeamExceptions(
										teamExceptions.filter(
											(e) => e.entityId !== ex.entityId,
										),
									),
								(updates) =>
									setTeamExceptions(
										teamExceptions.map((e) =>
											e.entityId === ex.entityId
												? { ...e, ...updates }
												: e,
										),
									),
							),
						)}
					</div>
				)}
			</section>

			{/* Add User Exception Dialog */}
			<Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Add User Exception</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Select a user who has access to this database to give
						them custom limits.
					</p>
					<div className="flex max-h-64 flex-col gap-2 overflow-y-auto py-2">
						{availableUsers.map((user) => (
							<button
								key={user.id}
								type="button"
								className={`rounded-md border p-3 text-left transition-colors ${
									selectedEntity === user.id
										? "border-primary bg-primary/5"
										: "hover:bg-muted"
								}`}
								onClick={() => setSelectedEntity(user.id)}
							>
								<div className="font-medium text-sm">
									{user.name}
								</div>
								<div className="text-muted-foreground text-xs">
									{user.email}
								</div>
							</button>
						))}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowUserDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={addUserException}
							disabled={!selectedEntity}
						>
							Add Exception
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add Team Exception Dialog */}
			<Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Add Team Exception</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Select a team with access to this database to give them
						custom limits.
					</p>
					<div className="flex max-h-64 flex-col gap-2 overflow-y-auto py-2">
						{availableTeams.map((team) => (
							<button
								key={team.id}
								type="button"
								className={`rounded-md border p-3 text-left transition-colors ${
									selectedEntity === team.id
										? "border-primary bg-primary/5"
										: "hover:bg-muted"
								}`}
								onClick={() => setSelectedEntity(team.id)}
							>
								<div className="font-medium text-sm">
									{team.name}
								</div>
								<div className="text-muted-foreground text-xs">
									{team.teamType} · {team.memberCount} members
								</div>
							</button>
						))}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowTeamDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={addTeamException}
							disabled={!selectedEntity}
						>
							Add Exception
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
