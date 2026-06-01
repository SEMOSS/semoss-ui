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
	StorageException,
	StorageLimitConfig,
	TimePeriod,
} from "../types";

interface StorageLimitsPanelProps {
	entityId: string;
	entityName: string;
}

/**
 * Panel for configuring storage-specific limits with per-user and per-team exceptions.
 */
export function StorageLimitsPanel({
	entityId,
	entityName,
}: StorageLimitsPanelProps) {
	const { users, teams, getDefaultStorageLimits } = useMockLimitsData();

	const [config, setConfig] = useState<StorageLimitConfig>(
		getDefaultStorageLimits(),
	);
	const [saved, setSaved] = useState<StorageLimitConfig>({ ...config });

	// Exceptions
	const [userExceptions, setUserExceptions] = useState<StorageException[]>([
		{
			entityId: "ielnemr",
			entityName: "Ibrahim ElNemr",
			entityDetails: [
				{ label: "ID", value: "ielnemr" },
				{ label: "Email", value: "ielnemr@deloitte.com" },
			],
			uploadSizePerFileMB: 200,
			uploadSizePerWindowMB: 2000,
			downloadSizePerWindowMB: 10000,
			fileCountPerWindow: 200,
			totalUploadedSizeMB: 20000,
			isActive: true,
		},
	]);
	const [teamExceptions, setTeamExceptions] = useState<StorageException[]>([
		{
			entityId: "team-eng",
			entityName: "Engineering",
			entityDetails: [
				{ label: "Team Type", value: "CUSTOM" },
				{ label: "Members", value: "8" },
			],
			uploadSizePerFileMB: 500,
			uploadSizePerWindowMB: 10000,
			downloadSizePerWindowMB: 50000,
			fileCountPerWindow: 1000,
			totalUploadedSizeMB: 100000,
			isActive: true,
		},
	]);

	const [showUserDialog, setShowUserDialog] = useState(false);
	const [showTeamDialog, setShowTeamDialog] = useState(false);
	const [selectedEntity, setSelectedEntity] = useState("");

	const isDirty =
		config.uploadSizePerFileMB !== saved.uploadSizePerFileMB ||
		config.uploadSizePerWindowMB !== saved.uploadSizePerWindowMB ||
		config.downloadSizePerWindowMB !== saved.downloadSizePerWindowMB ||
		config.fileCountPerWindow !== saved.fileCountPerWindow ||
		config.totalUploadedSizeMB !== saved.totalUploadedSizeMB ||
		config.windowPeriod !== saved.windowPeriod ||
		config.isActive !== saved.isActive;

	const handleSave = () => {
		setSaved({ ...config });
		toast.success("Storage limits saved");
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
				uploadSizePerFileMB: config.uploadSizePerFileMB * 2,
				uploadSizePerWindowMB: config.uploadSizePerWindowMB * 2,
				downloadSizePerWindowMB: config.downloadSizePerWindowMB * 2,
				fileCountPerWindow: config.fileCountPerWindow * 2,
				totalUploadedSizeMB: config.totalUploadedSizeMB * 2,
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
				uploadSizePerFileMB: config.uploadSizePerFileMB * 5,
				uploadSizePerWindowMB: config.uploadSizePerWindowMB * 5,
				downloadSizePerWindowMB: config.downloadSizePerWindowMB * 5,
				fileCountPerWindow: config.fileCountPerWindow * 5,
				totalUploadedSizeMB: config.totalUploadedSizeMB * 5,
				isActive: true,
			},
		]);
		setShowTeamDialog(false);
		setSelectedEntity("");
		toast.success("Team exception added");
	};

	const renderException = (
		ex: StorageException,
		onRemove: () => void,
		onUpdate: (updates: Partial<StorageException>) => void,
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
						<Label className="text-xs">
							Upload/File (Ingress):
						</Label>
						<Input
							type="number"
							value={ex.uploadSizePerFileMB}
							onChange={(e) =>
								onUpdate({
									uploadSizePerFileMB:
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
						<Label className="text-xs">
							Upload/Window (Ingress):
						</Label>
						<Input
							type="number"
							value={ex.uploadSizePerWindowMB}
							onChange={(e) =>
								onUpdate({
									uploadSizePerWindowMB:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-24"
						/>
						<span className="text-muted-foreground text-xs">
							MB
						</span>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">
							Download/Window (Egress):
						</Label>
						<Input
							type="number"
							value={ex.downloadSizePerWindowMB}
							onChange={(e) =>
								onUpdate({
									downloadSizePerWindowMB:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-24"
						/>
						<span className="text-muted-foreground text-xs">
							MB
						</span>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">Files/Window:</Label>
						<Input
							type="number"
							value={ex.fileCountPerWindow}
							onChange={(e) =>
								onUpdate({
									fileCountPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-20"
						/>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">Total Uploaded:</Label>
						<Input
							type="number"
							value={ex.totalUploadedSizeMB}
							onChange={(e) =>
								onUpdate({
									totalUploadedSizeMB:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-24"
						/>
						<span className="text-muted-foreground text-xs">
							MB
						</span>
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
			data-testid="storage-limits-panel"
		>
			{/* Header */}
			<div>
				<h2 className="font-semibold text-lg">
					Storage Limits — {entityName}
				</h2>
				<p className="text-muted-foreground text-sm">
					Configure upload, download, and file count restrictions for
					this storage engine.
				</p>
			</div>

			{/* Upload Limits */}
			<section className="rounded-lg border p-6">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-base">
							Default Upload Limits (Ingress)
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
							Upload Size per File (Ingress)
						</Label>
						<p className="text-muted-foreground text-xs">
							Maximum size of a single uploaded file.
						</p>
						<Input
							type="number"
							value={config.uploadSizePerFileMB}
							onChange={(e) =>
								setConfig({
									...config,
									uploadSizePerFileMB:
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
							Upload Size per Window (Ingress)
						</Label>
						<p className="text-muted-foreground text-xs">
							Total upload volume allowed per time window.
						</p>
						<Input
							type="number"
							value={config.uploadSizePerWindowMB}
							onChange={(e) =>
								setConfig({
									...config,
									uploadSizePerWindowMB:
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
							File Count per Window
						</Label>
						<p className="text-muted-foreground text-xs">
							Maximum number of files uploaded per time window.
						</p>
						<Input
							type="number"
							value={config.fileCountPerWindow}
							onChange={(e) =>
								setConfig({
									...config,
									fileCountPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-48"
						/>
						<span className="text-muted-foreground text-xs">
							files
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Total Uploaded File Sizes
						</Label>
						<p className="text-muted-foreground text-xs">
							Maximum total of all uploaded file sizes (hard
							ceiling).
						</p>
						<Input
							type="number"
							value={config.totalUploadedSizeMB}
							onChange={(e) =>
								setConfig({
									...config,
									totalUploadedSizeMB:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-48"
						/>
						<span className="text-muted-foreground text-xs">
							MB
						</span>
					</div>
				</div>
			</section>

			{/* Download Limits */}
			<section className="rounded-lg border p-6">
				<div className="mb-4">
					<h3 className="font-semibold text-base">
						Download Limits (Egress)
					</h3>
					<p className="text-muted-foreground text-sm">
						Control download volume to manage egress costs and
						prevent bulk extraction.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Download Size per Window (Egress)
						</Label>
						<p className="text-muted-foreground text-xs">
							Total download volume allowed per time window.
						</p>
						<Input
							type="number"
							value={config.downloadSizePerWindowMB}
							onChange={(e) =>
								setConfig({
									...config,
									downloadSizePerWindowMB:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-48"
						/>
						<span className="text-muted-foreground text-xs">
							MB
						</span>
					</div>
				</div>
			</section>

			{/* Time Window + Save */}
			<section className="rounded-lg border p-6">
				<div className="mb-4">
					<h3 className="font-semibold text-base">Time Window</h3>
					<p className="text-muted-foreground text-sm">
						The period over which all windowed limits reset.
					</p>
				</div>
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
						{(Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]).map(
							(p) => (
								<SelectItem key={p} value={p}>
									{TIME_PERIOD_LABELS[p]}
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>
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
							access to this storage.
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
						Select a user to give them custom storage limits.
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
						Select a team to give them custom storage limits.
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
