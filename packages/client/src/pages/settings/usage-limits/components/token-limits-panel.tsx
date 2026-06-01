import { Plus } from "lucide-react";
import { useState } from "react";
import {
	Button,
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
import { genId, TIME_PERIOD_LABELS } from "../constants";
import { useMockLimitsData } from "../hooks/use-mock-limits-data";
import type { ExceptionEntry, TimePeriod, TokenLimitEntry } from "../types";
import { AddLimitDialog } from "./add-limit-dialog";
import { EditableLimitRow } from "./editable-limit-row";
import { EntityDetailRow } from "./entity-detail-row";
import { ExceptionsSection } from "./exceptions-section";

interface TokenLimitsPanelProps {
	entityType: "MODEL" | "APP";
	entityId: string;
	entityName: string;
}

/**
 * Panel for configuring token-based limits (combined/input/output per time period)
 * on Models and Apps, with per-user and per-team sections plus exceptions.
 */
export function TokenLimitsPanel({
	entityType,
	entityId,
	entityName,
}: TokenLimitsPanelProps) {
	const { users, teams } = useMockLimitsData();

	// Per-user default limits
	const [userLimits, setUserLimits] = useState<TokenLimitEntry[]>([
		{
			id: genId(),
			period: "DAY",
			maxTokens: 100000,
			maxInputTokens: 60000,
			maxOutputTokens: 40000,
			isActive: true,
			_saved: {
				period: "DAY",
				maxTokens: 100000,
				maxInputTokens: 60000,
				maxOutputTokens: 40000,
				isActive: true,
			},
		},
	]);

	// Per-team default limits
	const [teamLimits, setTeamLimits] = useState<TokenLimitEntry[]>([
		{
			id: genId(),
			period: "DAY",
			maxTokens: 500000,
			maxInputTokens: 300000,
			maxOutputTokens: 200000,
			isActive: true,
			_saved: {
				period: "DAY",
				maxTokens: 500000,
				maxInputTokens: 300000,
				maxOutputTokens: 200000,
				isActive: true,
			},
		},
	]);

	// User exceptions
	const [userExceptions, setUserExceptions] = useState<ExceptionEntry[]>([
		{
			entityId: "ielnemr",
			entityName: "Ibrahim ElNemr",
			entityDetails: [
				{ label: "ID", value: "ielnemr" },
				{ label: "Email", value: "ielnemr@deloitte.com" },
			],
			combinedLimit: 250000,
			inputLimit: 150000,
			outputLimit: 100000,
			period: "DAY",
			isActive: true,
		},
	]);

	// Team exceptions
	const [teamExceptions, setTeamExceptions] = useState<ExceptionEntry[]>([
		{
			entityId: "team-eng",
			entityName: "Engineering",
			entityDetails: [
				{ label: "Team Type", value: "CUSTOM" },
				{ label: "Members", value: "8" },
			],
			combinedLimit: 1000000,
			inputLimit: 600000,
			outputLimit: 400000,
			period: "DAY",
			isActive: true,
		},
	]);

	// Add limit dialogs
	const [showUserAddDialog, setShowUserAddDialog] = useState(false);
	const [showTeamAddDialog, setShowTeamAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("HOUR");
	const [newMaxTokens, setNewMaxTokens] = useState("100000");
	const [newMaxInput, setNewMaxInput] = useState("60000");
	const [newMaxOutput, setNewMaxOutput] = useState("40000");

	const entityTypeLabel = entityType === "MODEL" ? "model" : "app";

	// --- user limit CRUD ---
	const userUsedPeriods = userLimits.map((l) => l.period);
	const userAvailPeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !userUsedPeriods.includes(p));

	const addUserLimit = () => {
		const t = parseInt(newMaxTokens, 10) || 100000;
		const i = parseInt(newMaxInput, 10) || 60000;
		const o = parseInt(newMaxOutput, 10) || 40000;
		setUserLimits([
			...userLimits,
			{
				id: genId(),
				period: newPeriod,
				maxTokens: t,
				maxInputTokens: i,
				maxOutputTokens: o,
				isActive: true,
				_saved: {
					period: newPeriod,
					maxTokens: t,
					maxInputTokens: i,
					maxOutputTokens: o,
					isActive: true,
				},
			},
		]);
		setShowUserAddDialog(false);
		toast.success("Per-user limit added");
	};

	// --- team limit CRUD ---
	const teamUsedPeriods = teamLimits.map((l) => l.period);
	const teamAvailPeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !teamUsedPeriods.includes(p));

	const addTeamLimit = () => {
		const t = parseInt(newMaxTokens, 10) || 500000;
		const i = parseInt(newMaxInput, 10) || 300000;
		const o = parseInt(newMaxOutput, 10) || 200000;
		setTeamLimits([
			...teamLimits,
			{
				id: genId(),
				period: newPeriod,
				maxTokens: t,
				maxInputTokens: i,
				maxOutputTokens: o,
				isActive: true,
				_saved: {
					period: newPeriod,
					maxTokens: t,
					maxInputTokens: i,
					maxOutputTokens: o,
					isActive: true,
				},
			},
		]);
		setShowTeamAddDialog(false);
		toast.success("Per-team limit added");
	};

	const isDirty = (l: TokenLimitEntry) =>
		l.period !== l._saved.period ||
		l.maxTokens !== l._saved.maxTokens ||
		l.maxInputTokens !== l._saved.maxInputTokens ||
		l.maxOutputTokens !== l._saved.maxOutputTokens ||
		l.isActive !== l._saved.isActive;

	const saveLimit = (
		list: TokenLimitEntry[],
		setter: (v: TokenLimitEntry[]) => void,
		id: string,
	) => {
		setter(
			list.map((l) =>
				l.id === id
					? {
							...l,
							_saved: {
								period: l.period,
								maxTokens: l.maxTokens,
								maxInputTokens: l.maxInputTokens,
								maxOutputTokens: l.maxOutputTokens,
								isActive: l.isActive,
							},
						}
					: l,
			),
		);
		toast.success("Limit saved");
	};

	const updateLimit = (
		list: TokenLimitEntry[],
		setter: (v: TokenLimitEntry[]) => void,
		id: string,
		updates: Partial<TokenLimitEntry>,
	) => {
		setter(list.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const removeLimit = (
		list: TokenLimitEntry[],
		setter: (v: TokenLimitEntry[]) => void,
		id: string,
	) => {
		setter(list.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const renderLimitRows = (
		limits: TokenLimitEntry[],
		setter: (v: TokenLimitEntry[]) => void,
		usedPeriods: TimePeriod[],
	) =>
		limits.map((limit) => (
			<EditableLimitRow
				key={limit.id}
				onDelete={() => removeLimit(limits, setter, limit.id)}
				onSave={() => saveLimit(limits, setter, limit.id)}
				isDirty={isDirty(limit)}
			>
				<div className="flex items-center gap-2">
					<Label className="whitespace-nowrap text-xs">
						Combined:
					</Label>
					<Input
						type="number"
						value={limit.maxTokens}
						onChange={(e) =>
							updateLimit(limits, setter, limit.id, {
								maxTokens: parseInt(e.target.value, 10) || 0,
							})
						}
						className="h-8 w-28"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Label className="whitespace-nowrap text-xs">Input:</Label>
					<Input
						type="number"
						value={limit.maxInputTokens ?? 0}
						onChange={(e) =>
							updateLimit(limits, setter, limit.id, {
								maxInputTokens:
									parseInt(e.target.value, 10) || 0,
							})
						}
						className="h-8 w-28"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Label className="whitespace-nowrap text-xs">Output:</Label>
					<Input
						type="number"
						value={limit.maxOutputTokens ?? 0}
						onChange={(e) =>
							updateLimit(limits, setter, limit.id, {
								maxOutputTokens:
									parseInt(e.target.value, 10) || 0,
							})
						}
						className="h-8 w-28"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Label className="text-xs">Period:</Label>
					<Select
						value={limit.period}
						onValueChange={(v: TimePeriod) =>
							updateLimit(limits, setter, limit.id, { period: v })
						}
					>
						<SelectTrigger className="h-8 w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(Object.keys(TIME_PERIOD_LABELS) as TimePeriod[])
								.filter(
									(p) =>
										p === limit.period ||
										!usedPeriods.includes(p),
								)
								.map((p) => (
									<SelectItem key={p} value={p}>
										{TIME_PERIOD_LABELS[p]}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<Label className="text-xs">Active:</Label>
					<Switch
						checked={limit.isActive}
						onCheckedChange={(v) =>
							updateLimit(limits, setter, limit.id, {
								isActive: v,
							})
						}
					/>
				</div>
			</EditableLimitRow>
		));

	return (
		<div
			className="flex w-full flex-col gap-8"
			data-testid="token-limits-panel"
		>
			{/* Header */}
			<div>
				<h2 className="font-semibold text-lg">
					Token Limits — {entityName}
				</h2>
				<p className="text-muted-foreground text-sm">
					Configure per-user and per-team token limits for this{" "}
					{entityTypeLabel}.
				</p>
			</div>

			{/* Per-User Limits */}
			<section>
				<div className="mb-3 flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-base">
							Per-User Token Limits
						</h3>
						<p className="text-muted-foreground text-sm">
							Default token budget for each user on this{" "}
							{entityTypeLabel}. Combined, input, and output
							tokens per time period.
						</p>
					</div>
					<Button
						onClick={() => {
							if (userAvailPeriods.length === 0) return;
							setNewPeriod(userAvailPeriods[0]);
							setNewMaxTokens("100000");
							setNewMaxInput("60000");
							setNewMaxOutput("40000");
							setShowUserAddDialog(true);
						}}
						disabled={userAvailPeriods.length === 0}
						size="sm"
					>
						<Plus className="mr-1 size-3" /> Add Limit
					</Button>
				</div>
				<div className="flex flex-col gap-2">
					{renderLimitRows(
						userLimits,
						setUserLimits,
						userUsedPeriods,
					)}
					{userLimits.length === 0 && (
						<p className="py-4 text-center text-muted-foreground text-sm">
							No per-user limits configured.
						</p>
					)}
				</div>

				<ExceptionsSection
					exceptions={userExceptions}
					entityLabel="User"
					entityOptions={users}
					renderEntityDetails={(user) => (
						<EntityDetailRow
							primary={user.name}
							details={[
								{ label: "ID", value: user.id },
								{ label: "Email", value: String(user.email) },
								{
									label: "Login",
									value: String(user.loginType),
								},
							]}
						/>
					)}
					onAdd={(user) =>
						setUserExceptions([
							...userExceptions,
							{
								entityId: user.id,
								entityName: user.name,
								entityDetails: [
									{ label: "ID", value: user.id },
									{
										label: "Email",
										value: String(user.email),
									},
								],
								combinedLimit: 200000,
								inputLimit: 120000,
								outputLimit: 80000,
								period: "DAY",
								isActive: true,
							},
						])
					}
					onRemove={(id) =>
						setUserExceptions(
							userExceptions.filter((e) => e.entityId !== id),
						)
					}
					onUpdate={(id, updates) =>
						setUserExceptions(
							userExceptions.map((e) =>
								e.entityId === id ? { ...e, ...updates } : e,
							),
						)
					}
				/>
			</section>

			{/* Per-Team Limits */}
			<section>
				<div className="mb-3 flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-base">
							Per-Team Token Limits
						</h3>
						<p className="text-muted-foreground text-sm">
							Shared team token pool on this {entityTypeLabel}.
							All team members draw from the same budget.
						</p>
					</div>
					<Button
						onClick={() => {
							if (teamAvailPeriods.length === 0) return;
							setNewPeriod(teamAvailPeriods[0]);
							setNewMaxTokens("500000");
							setNewMaxInput("300000");
							setNewMaxOutput("200000");
							setShowTeamAddDialog(true);
						}}
						disabled={teamAvailPeriods.length === 0}
						size="sm"
					>
						<Plus className="mr-1 size-3" /> Add Limit
					</Button>
				</div>
				<div className="flex flex-col gap-2">
					{renderLimitRows(
						teamLimits,
						setTeamLimits,
						teamUsedPeriods,
					)}
					{teamLimits.length === 0 && (
						<p className="py-4 text-center text-muted-foreground text-sm">
							No per-team limits configured.
						</p>
					)}
				</div>

				<ExceptionsSection
					exceptions={teamExceptions}
					entityLabel="Team"
					entityOptions={teams}
					renderEntityDetails={(team) => (
						<EntityDetailRow
							primary={team.name}
							details={[
								{
									label: "Team Type",
									value: String(team.teamType),
								},
								{
									label: "Members",
									value: String(team.memberCount),
								},
							]}
						/>
					)}
					onAdd={(team) =>
						setTeamExceptions([
							...teamExceptions,
							{
								entityId: team.id,
								entityName: team.name,
								entityDetails: [
									{
										label: "Team Type",
										value: String(team.teamType),
									},
									{
										label: "Members",
										value: String(team.memberCount),
									},
								],
								combinedLimit: 800000,
								inputLimit: 480000,
								outputLimit: 320000,
								period: "DAY",
								isActive: true,
							},
						])
					}
					onRemove={(id) =>
						setTeamExceptions(
							teamExceptions.filter((e) => e.entityId !== id),
						)
					}
					onUpdate={(id, updates) =>
						setTeamExceptions(
							teamExceptions.map((e) =>
								e.entityId === id ? { ...e, ...updates } : e,
							),
						)
					}
				/>
			</section>

			{/* Add limit dialogs */}
			<AddLimitDialog
				open={showUserAddDialog}
				onOpenChange={setShowUserAddDialog}
				onConfirm={addUserLimit}
			>
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<Label className="w-20 text-sm">Combined:</Label>
						<Input
							type="number"
							value={newMaxTokens}
							onChange={(e) => setNewMaxTokens(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="w-20 text-sm">Input:</Label>
						<Input
							type="number"
							value={newMaxInput}
							onChange={(e) => setNewMaxInput(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="w-20 text-sm">Output:</Label>
						<Input
							type="number"
							value={newMaxOutput}
							onChange={(e) => setNewMaxOutput(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="w-20 text-sm">Period:</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{userAvailPeriods.map((p) => (
									<SelectItem key={p} value={p}>
										{TIME_PERIOD_LABELS[p]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</AddLimitDialog>

			<AddLimitDialog
				open={showTeamAddDialog}
				onOpenChange={setShowTeamAddDialog}
				onConfirm={addTeamLimit}
			>
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<Label className="w-20 text-sm">Combined:</Label>
						<Input
							type="number"
							value={newMaxTokens}
							onChange={(e) => setNewMaxTokens(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="w-20 text-sm">Input:</Label>
						<Input
							type="number"
							value={newMaxInput}
							onChange={(e) => setNewMaxInput(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="w-20 text-sm">Output:</Label>
						<Input
							type="number"
							value={newMaxOutput}
							onChange={(e) => setNewMaxOutput(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="w-20 text-sm">Period:</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{teamAvailPeriods.map((p) => (
									<SelectItem key={p} value={p}>
										{TIME_PERIOD_LABELS[p]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</AddLimitDialog>
		</div>
	);
}
