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
import type { TimePeriod, VectorException, VectorLimitConfig } from "../types";

interface VectorLimitsPanelProps {
	entityId: string;
	entityName: string;
}

/**
 * Panel for configuring vector-specific limits with per-user and per-team exceptions.
 */
export function VectorLimitsPanel({
	entityId,
	entityName,
}: VectorLimitsPanelProps) {
	const { users, teams, getDefaultVectorLimits } = useMockLimitsData();

	const [config, setConfig] = useState<VectorLimitConfig>(
		getDefaultVectorLimits(),
	);
	const [saved, setSaved] = useState<VectorLimitConfig>({ ...config });

	// Exceptions
	const [userExceptions, setUserExceptions] = useState<VectorException[]>([
		{
			entityId: "ielnemr",
			entityName: "Ibrahim ElNemr",
			entityDetails: [
				{ label: "ID", value: "ielnemr" },
				{ label: "Email", value: "ielnemr@deloitte.com" },
			],
			chunksPerRetrieval: 50,
			chunkSizeCap: 4000,
			retrievalsPerWindow: 2000,
			indexingDocsPerWindow: 1000,
			indexingSizeMBPerWindow: 200,
			embeddingTokensPerWindow: 2000000,
			isActive: true,
		},
	]);
	const [teamExceptions, setTeamExceptions] = useState<VectorException[]>([
		{
			entityId: "team-eng",
			entityName: "Engineering",
			entityDetails: [
				{ label: "Team Type", value: "CUSTOM" },
				{ label: "Members", value: "8" },
			],
			chunksPerRetrieval: 100,
			chunkSizeCap: 8000,
			retrievalsPerWindow: 10000,
			indexingDocsPerWindow: 5000,
			indexingSizeMBPerWindow: 1000,
			embeddingTokensPerWindow: 10000000,
			isActive: true,
		},
	]);

	const [showUserDialog, setShowUserDialog] = useState(false);
	const [showTeamDialog, setShowTeamDialog] = useState(false);
	const [selectedEntity, setSelectedEntity] = useState("");

	const isDirty =
		config.chunksPerRetrieval !== saved.chunksPerRetrieval ||
		config.chunkSizeCap !== saved.chunkSizeCap ||
		config.retrievalsPerWindow !== saved.retrievalsPerWindow ||
		config.windowPeriod !== saved.windowPeriod ||
		config.indexingDocsPerWindow !== saved.indexingDocsPerWindow ||
		config.indexingSizeMBPerWindow !== saved.indexingSizeMBPerWindow ||
		config.embeddingTokensPerWindow !== saved.embeddingTokensPerWindow ||
		config.isActive !== saved.isActive;

	const handleSave = () => {
		setSaved({ ...config });
		toast.success("Vector limits saved");
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
				chunksPerRetrieval: config.chunksPerRetrieval * 2,
				chunkSizeCap: config.chunkSizeCap * 2,
				retrievalsPerWindow: config.retrievalsPerWindow * 2,
				indexingDocsPerWindow: config.indexingDocsPerWindow * 2,
				indexingSizeMBPerWindow: config.indexingSizeMBPerWindow * 2,
				embeddingTokensPerWindow: config.embeddingTokensPerWindow * 2,
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
				chunksPerRetrieval: config.chunksPerRetrieval * 5,
				chunkSizeCap: config.chunkSizeCap * 5,
				retrievalsPerWindow: config.retrievalsPerWindow * 5,
				indexingDocsPerWindow: config.indexingDocsPerWindow * 5,
				indexingSizeMBPerWindow: config.indexingSizeMBPerWindow * 5,
				embeddingTokensPerWindow: config.embeddingTokensPerWindow * 5,
				isActive: true,
			},
		]);
		setShowTeamDialog(false);
		setSelectedEntity("");
		toast.success("Team exception added");
	};

	const renderException = (
		ex: VectorException,
		onRemove: () => void,
		onUpdate: (updates: Partial<VectorException>) => void,
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
						<Label className="text-xs">Chunks/Retrieval:</Label>
						<Input
							type="number"
							value={ex.chunksPerRetrieval}
							onChange={(e) =>
								onUpdate({
									chunksPerRetrieval:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-20"
						/>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">Chunk Size Cap:</Label>
						<Input
							type="number"
							value={ex.chunkSizeCap}
							onChange={(e) =>
								onUpdate({
									chunkSizeCap:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-20"
						/>
						<span className="text-muted-foreground text-xs">
							chars
						</span>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">Retrievals/Window:</Label>
						<Input
							type="number"
							value={ex.retrievalsPerWindow}
							onChange={(e) =>
								onUpdate({
									retrievalsPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-24"
						/>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">Docs/Window:</Label>
						<Input
							type="number"
							value={ex.indexingDocsPerWindow}
							onChange={(e) =>
								onUpdate({
									indexingDocsPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="h-7 w-20"
						/>
					</div>
					<div className="flex items-center gap-1">
						<Label className="text-xs">Index Size/Window:</Label>
						<Input
							type="number"
							value={ex.indexingSizeMBPerWindow}
							onChange={(e) =>
								onUpdate({
									indexingSizeMBPerWindow:
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
						<Label className="text-xs">Embed Tokens/Window:</Label>
						<Input
							type="number"
							value={ex.embeddingTokensPerWindow}
							onChange={(e) =>
								onUpdate({
									embeddingTokensPerWindow:
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
			data-testid="vector-limits-panel"
		>
			{/* Header */}
			<div>
				<h2 className="font-semibold text-lg">
					Vector Limits — {entityName}
				</h2>
				<p className="text-muted-foreground text-sm">
					Configure retrieval, indexing, and embedding restrictions
					for this vector engine.
				</p>
			</div>

			{/* Retrieval Limits */}
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

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Chunks per Retrieval
						</Label>
						<p className="text-muted-foreground text-xs">
							Maximum vector chunks returned in a single search.
						</p>
						<Input
							type="number"
							value={config.chunksPerRetrieval}
							onChange={(e) =>
								setConfig({
									...config,
									chunksPerRetrieval:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-40"
						/>
						<span className="text-muted-foreground text-xs">
							chunks
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Chunk Size Cap
						</Label>
						<p className="text-muted-foreground text-xs">
							Maximum character length per returned chunk.
						</p>
						<Input
							type="number"
							value={config.chunkSizeCap}
							onChange={(e) =>
								setConfig({
									...config,
									chunkSizeCap:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-40"
						/>
						<span className="text-muted-foreground text-xs">
							characters
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Retrievals per Window
						</Label>
						<p className="text-muted-foreground text-xs">
							Total vector search requests allowed per period.
						</p>
						<Input
							type="number"
							value={config.retrievalsPerWindow}
							onChange={(e) =>
								setConfig({
									...config,
									retrievalsPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-40"
						/>
						<span className="text-muted-foreground text-xs">
							searches
						</span>
					</div>
				</div>
			</section>

			{/* Indexing Limits */}
			<section className="rounded-lg border p-6">
				<div className="mb-4">
					<h3 className="font-semibold text-base">Indexing Limits</h3>
					<p className="text-muted-foreground text-sm">
						Control how much data can be embedded and indexed per
						time window.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Documents per Window
						</Label>
						<p className="text-muted-foreground text-xs">
							Maximum documents that can be indexed per period.
						</p>
						<Input
							type="number"
							value={config.indexingDocsPerWindow}
							onChange={(e) =>
								setConfig({
									...config,
									indexingDocsPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-40"
						/>
						<span className="text-muted-foreground text-xs">
							documents
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Indexing Size per Window
						</Label>
						<p className="text-muted-foreground text-xs">
							Maximum total data size indexed per period.
						</p>
						<Input
							type="number"
							value={config.indexingSizeMBPerWindow}
							onChange={(e) =>
								setConfig({
									...config,
									indexingSizeMBPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-40"
						/>
						<span className="text-muted-foreground text-xs">
							MB
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="font-medium text-sm">
							Embedding Tokens per Window
						</Label>
						<p className="text-muted-foreground text-xs">
							Total tokens sent to embedding models per period.
						</p>
						<Input
							type="number"
							value={config.embeddingTokensPerWindow}
							onChange={(e) =>
								setConfig({
									...config,
									embeddingTokensPerWindow:
										parseInt(e.target.value, 10) || 0,
								})
							}
							className="w-40"
						/>
						<span className="text-muted-foreground text-xs">
							tokens
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
							access to this vector database.
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
						Select a user to give them custom vector limits.
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
						Select a team to give them custom vector limits.
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
