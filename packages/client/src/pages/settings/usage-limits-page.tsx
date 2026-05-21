import {
	Check,
	Clock,
	Database,
	HardDrive,
	LayoutGrid,
	Plus,
	Save,
	Settings2,
	Trash2,
	Users,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
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
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { useSettings } from "@/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimePeriod = "HOUR" | "DAY" | "ALL_TIME";

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
	HOUR: "Per Hour",
	DAY: "Per Day",
	ALL_TIME: "All Time",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS = [
	{
		id: "ielnemr",
		name: "Ibrahim ElNemr",
		email: "ielnemr@deloitte.com",
		loginType: "NATIVE",
	},
	{
		id: "ajohnson",
		name: "Alice Johnson",
		email: "ajohnson@deloitte.com",
		loginType: "NATIVE",
	},
	{
		id: "bsmith",
		name: "Bob Smith",
		email: "bsmith@deloitte.com",
		loginType: "SSO",
	},
	{
		id: "dprince",
		name: "Diana Prince",
		email: "dprince@deloitte.com",
		loginType: "NATIVE",
	},
	{
		id: "ewilliams",
		name: "Eve Williams",
		email: "ewilliams@deloitte.com",
		loginType: "SSO",
	},
];

const MOCK_TEAMS = [
	{
		id: "team-demo",
		name: "Demo Team",
		teamType: "CUSTOM",
		memberCount: 3,
	},
	{
		id: "team-eng",
		name: "Engineering",
		teamType: "CUSTOM",
		memberCount: 8,
	},
	{
		id: "team-prod",
		name: "Product",
		teamType: "CUSTOM",
		memberCount: 5,
	},
	{
		id: "team-exec",
		name: "Executive",
		teamType: "DEFAULT",
		memberCount: 4,
	},
];

const MOCK_APPS = [
	{
		id: "857e7266-3d49-4380-8a99-45f2c56ff3cb",
		name: "Vibe Model Token Limit",
		type: "App",
	},
	{
		id: "b446e953-7ee7-4f3a-a946-702f5a405a9a",
		name: "Playwright Single App",
		type: "App",
	},
	{
		id: "c27165e3-7b1e-4737-b9cd-6a6ba89259d9",
		name: "GCS Certification Review",
		type: "App",
	},
	{
		id: "d8832abc-4e01-4d32-987c-2f5a6b123456",
		name: "Customer Support Bot",
		type: "App",
	},
];

const MOCK_ROOMS = [
	{ id: "room-general-001", name: "General Chat", type: "Room" },
	{ id: "room-eng-002", name: "Engineering Discussion", type: "Room" },
	{ id: "room-prod-003", name: "Product Planning", type: "Room" },
];

const MOCK_DATABASES = [
	{
		id: "5dc23fc5-8dff-491f-a015-eae5f11871a7",
		name: "GlobalAssetDB",
		type: "Database",
	},
	{
		id: "a1b2c3d4-5678-9012-3456-789012345678",
		name: "Production Analytics DB",
		type: "Database",
	},
	{
		id: "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
		name: "Reporting Warehouse",
		type: "Database",
	},
];

const MOCK_VECTORS = [
	{
		id: "a7d4548b-5d4d-449a-9b6b-0c3121aed493",
		name: "Core-Documentation",
		vectorType: "PGVector",
	},
	{
		id: "b8e5659c-6e5e-550b-a7c8-1d4232bfe504",
		name: "Product Docs Index",
		vectorType: "Weaviate",
	},
	{
		id: "c9f6760d-7f6f-661c-b8d9-2e5343c0f615",
		name: "Code Embeddings",
		vectorType: "FAISS",
	},
];

const MOCK_STORAGES = [
	{
		id: "stor-primary-001",
		name: "Primary File Storage",
		type: "Storage",
	},
	{ id: "stor-media-002", name: "Media Assets", type: "Storage" },
	{ id: "stor-user-003", name: "User Uploads", type: "Storage" },
];

const MOCK_AGENTS = [
	{
		id: "a7d45s8b-5d4d-449a-9b6b-0a3121aeds93",
		name: "Orchestrator Agent",
		type: "Agent",
	},
	{
		id: "b8e56t9c-6e5e-550b-a7c8-1d4232bfet04",
		name: "Code Review Agent",
		type: "Agent",
	},
	{
		id: "c9f67u0d-7f6f-661c-b8d9-2e5343c0fu15",
		name: "Daily Report Summarizer",
		type: "Agent",
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 0;
const genId = () => `limit-${++_idCounter}-${Date.now()}`;

// ─── Generic Components ───────────────────────────────────────────────────────

/** Detail row for an entity (user, team, engine, etc.) */
function EntityDetailRow({
	primary,
	details,
	compact,
}: {
	primary: string;
	details: { label: string; value: string }[];
	compact?: boolean;
}) {
	return (
		<div
			className={
				compact ? "flex flex-col gap-0.5" : "flex flex-col gap-1"
			}
		>
			<span className="font-medium text-sm">{primary}</span>
			<div className="flex flex-wrap gap-x-4 gap-y-0.5">
				{details.map((d) => (
					<span
						key={d.label}
						className="text-muted-foreground text-xs"
					>
						<span className="font-medium">{d.label}:</span>{" "}
						{d.value}
					</span>
				))}
			</div>
		</div>
	);
}

/** Editable limit row with a save button */
function EditableLimitRow({
	children,
	onDelete,
	onSave,
	isDirty,
}: {
	children: React.ReactNode;
	onDelete: () => void;
	onSave: () => void;
	isDirty: boolean;
}) {
	return (
		<div className="flex items-center gap-3 rounded-lg border p-3">
			<div className="flex flex-1 flex-wrap items-center gap-3">
				{children}
			</div>
			<div className="flex shrink-0 items-center gap-1">
				{isDirty && (
					<Button
						variant="ghost"
						size="icon"
						className="text-primary"
						onClick={onSave}
						title="Save changes"
					>
						<Save className="size-4" />
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="text-destructive"
					onClick={onDelete}
					title="Remove"
				>
					<Trash2 className="size-4" />
				</Button>
			</div>
		</div>
	);
}

/** Add limit confirmation dialog */
function AddLimitDialog({
	open,
	onOpenChange,
	onConfirm,
	children,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onConfirm: () => void;
	children: React.ReactNode;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Limit</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-2">{children}</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={onConfirm}>
						<Check className="mr-1 size-3" /> Save Limit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** Exceptions section with detailed entity display and editable limits */
function ExceptionsSection<
	T extends { id: string; name: string; [key: string]: unknown },
>({
	exceptions,
	entityLabel,
	entityOptions,
	renderEntityDetails,
	onAdd,
	onRemove,
	onUpdate,
}: {
	exceptions: ExceptionEntry[];
	entityLabel: string;
	entityOptions: T[];
	renderEntityDetails: (entity: T) => React.ReactNode;
	onAdd: (entity: T) => void;
	onRemove: (id: string) => void;
	onUpdate: (id: string, updates: Partial<ExceptionEntry>) => void;
}) {
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [selectedEntity, setSelectedEntity] = useState("");

	const availableOptions = entityOptions.filter(
		(o) => !exceptions.some((e) => e.entityId === o.id),
	);

	return (
		<div className="mt-4 rounded-lg border p-4">
			<div className="mb-3 flex items-center justify-between">
				<h4 className="font-medium text-sm">Exceptions</h4>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setShowAddDialog(true)}
					disabled={availableOptions.length === 0}
				>
					<Plus className="mr-1 size-3" /> Add Exception
				</Button>
			</div>
			{exceptions.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					No exceptions configured. The limits above apply to all{" "}
					{entityLabel.toLowerCase()}s.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{exceptions.map((ex) => (
						<ExceptionRow
							key={ex.entityId}
							exception={ex}
							onRemove={() => onRemove(ex.entityId)}
							onUpdate={(updates) =>
								onUpdate(ex.entityId, updates)
							}
						/>
					))}
				</div>
			)}

			<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Add {entityLabel} Exception</DialogTitle>
					</DialogHeader>
					<div className="flex max-h-64 flex-col gap-2 overflow-y-auto py-2">
						{availableOptions.map((entity) => (
							<button
								type="button"
								key={entity.id}
								className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
									selectedEntity === entity.id
										? "border-primary bg-accent"
										: ""
								}`}
								onClick={() => setSelectedEntity(entity.id)}
							>
								{renderEntityDetails(entity)}
							</button>
						))}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowAddDialog(false)}
						>
							Cancel
						</Button>
						<Button
							disabled={!selectedEntity}
							onClick={() => {
								const entity = entityOptions.find(
									(o) => o.id === selectedEntity,
								);
								if (entity) {
									onAdd(entity);
								}
								setSelectedEntity("");
								setShowAddDialog(false);
							}}
						>
							Add as Exception
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

/** Single exception row with editable fields */
function ExceptionRow({
	exception,
	onRemove,
	onUpdate,
}: {
	exception: ExceptionEntry;
	onRemove: () => void;
	onUpdate: (updates: Partial<ExceptionEntry>) => void;
}) {
	const [localLimit, setLocalLimit] = useState(String(exception.customLimit));
	const [localPeriod, setLocalPeriod] = useState(exception.period);
	const [localActive, setLocalActive] = useState(exception.isActive);

	const isDirty =
		localLimit !== String(exception.customLimit) ||
		localPeriod !== exception.period ||
		localActive !== exception.isActive;

	const handleSave = () => {
		onUpdate({
			customLimit: parseInt(localLimit, 10) || 0,
			period: localPeriod,
			isActive: localActive,
		});
		toast.success("Exception updated");
	};

	return (
		<div className="flex items-center gap-3 rounded-lg border p-3">
			<div className="flex flex-1 flex-col gap-2">
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
					<span className="font-medium text-sm">
						{exception.entityName}
					</span>
					{exception.entityDetails.map((d) => (
						<span
							key={d.label}
							className="text-muted-foreground text-xs"
						>
							<span className="font-medium">{d.label}:</span>{" "}
							{d.value}
						</span>
					))}
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-1.5">
						<Label className="whitespace-nowrap text-xs">
							Limit:
						</Label>
						<Input
							type="number"
							value={localLimit}
							onChange={(e) => setLocalLimit(e.target.value)}
							className="h-7 w-24 text-xs"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<Label className="text-xs">Period:</Label>
						<Select
							value={localPeriod}
							onValueChange={(v: TimePeriod) => setLocalPeriod(v)}
						>
							<SelectTrigger className="h-7 w-24 text-xs">
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
					<div className="flex items-center gap-1.5">
						<Label className="text-xs">Active:</Label>
						<Switch
							checked={localActive}
							onCheckedChange={setLocalActive}
						/>
					</div>
				</div>
			</div>
			<div className="flex shrink-0 flex-col items-center gap-1">
				{isDirty && (
					<Button
						variant="ghost"
						size="icon"
						className="size-7 text-primary"
						onClick={handleSave}
						title="Save changes"
					>
						<Save className="size-3.5" />
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="size-7 text-destructive"
					onClick={onRemove}
					title="Remove exception"
				>
					<Trash2 className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}

// ─── Exception Types ──────────────────────────────────────────────────────────

interface ExceptionEntry {
	entityId: string;
	entityName: string;
	entityDetails: { label: string; value: string }[];
	customLimit: number;
	period: TimePeriod;
	isActive: boolean;
}

// ─── Tab 1: Query Rate Limits ─────────────────────────────────────────────────

interface QueryRateEntry {
	id: string;
	period: TimePeriod;
	maxQueries: number;
	isActive: boolean;
	_saved: { period: TimePeriod; maxQueries: number; isActive: boolean };
}

function QueryRateLimitsTab() {
	const [limits, setLimits] = useState<QueryRateEntry[]>([
		{
			id: genId(),
			period: "HOUR",
			maxQueries: 50,
			isActive: true,
			_saved: { period: "HOUR", maxQueries: 50, isActive: true },
		},
		{
			id: genId(),
			period: "DAY",
			maxQueries: 500,
			isActive: true,
			_saved: { period: "DAY", maxQueries: 500, isActive: true },
		},
	]);
	const [exceptions, setExceptions] = useState<ExceptionEntry[]>([
		{
			entityId: "ajohnson",
			entityName: "Alice Johnson",
			entityDetails: [
				{ label: "ID", value: "ajohnson" },
				{ label: "Email", value: "ajohnson@deloitte.com" },
				{ label: "Login Type", value: "NATIVE" },
			],
			customLimit: 100,
			period: "HOUR",
			isActive: true,
		},
	]);

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("HOUR");
	const [newMaxQueries, setNewMaxQueries] = useState("50");

	const usedPeriods = limits.map((l) => l.period);
	const availablePeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !usedPeriods.includes(p));

	const openAddDialog = () => {
		if (availablePeriods.length === 0) return;
		setNewPeriod(availablePeriods[0]);
		setNewMaxQueries("50");
		setShowAddDialog(true);
	};

	const confirmAdd = () => {
		const entry: QueryRateEntry = {
			id: genId(),
			period: newPeriod,
			maxQueries: parseInt(newMaxQueries, 10) || 50,
			isActive: true,
			_saved: {
				period: newPeriod,
				maxQueries: parseInt(newMaxQueries, 10) || 50,
				isActive: true,
			},
		};
		setLimits([...limits, entry]);
		setShowAddDialog(false);
		toast.success("Query rate limit added");
	};

	const removeLimit = (id: string) => {
		setLimits(limits.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const updateLimit = (id: string, updates: Partial<QueryRateEntry>) => {
		setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const saveLimit = (id: string) => {
		setLimits(
			limits.map((l) =>
				l.id === id
					? {
							...l,
							_saved: {
								period: l.period,
								maxQueries: l.maxQueries,
								isActive: l.isActive,
							},
						}
					: l,
			),
		);
		toast.success("Limit saved");
	};

	const isDirty = (l: QueryRateEntry) =>
		l.period !== l._saved.period ||
		l.maxQueries !== l._saved.maxQueries ||
		l.isActive !== l._saved.isActive;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-base">
						Query Rate Limits
					</h3>
					<p className="text-muted-foreground text-sm">
						Maximum number of queries per time period. Applies to
						all users unless specified as an exception.
					</p>
				</div>
				<Button
					onClick={openAddDialog}
					disabled={availablePeriods.length === 0}
					size="sm"
				>
					<Plus className="mr-1 size-3" /> Add Limit
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{limits.map((limit) => (
					<EditableLimitRow
						key={limit.id}
						onDelete={() => removeLimit(limit.id)}
						onSave={() => saveLimit(limit.id)}
						isDirty={isDirty(limit)}
					>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Queries:
							</Label>
							<Input
								type="number"
								value={limit.maxQueries}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxQueries:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-24"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="text-xs">Period:</Label>
							<Select
								value={limit.period}
								onValueChange={(v: TimePeriod) =>
									updateLimit(limit.id, { period: v })
								}
							>
								<SelectTrigger className="h-8 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(
											TIME_PERIOD_LABELS,
										) as TimePeriod[]
									)
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
									updateLimit(limit.id, { isActive: v })
								}
							/>
						</div>
					</EditableLimitRow>
				))}
				{limits.length === 0 && (
					<p className="py-4 text-center text-muted-foreground text-sm">
						No rate limits configured.
					</p>
				)}
			</div>

			<ExceptionsSection
				exceptions={exceptions}
				entityLabel="User"
				entityOptions={MOCK_USERS}
				renderEntityDetails={(user) => (
					<EntityDetailRow
						primary={user.name}
						details={[
							{ label: "ID", value: user.id },
							{ label: "Email", value: user.email },
							{ label: "Login Type", value: user.loginType },
						]}
					/>
				)}
				onAdd={(user) =>
					setExceptions([
						...exceptions,
						{
							entityId: user.id,
							entityName: user.name,
							entityDetails: [
								{ label: "ID", value: user.id },
								{ label: "Email", value: user.email },
								{
									label: "Login Type",
									value: user.loginType,
								},
							],
							customLimit: 100,
							period: "HOUR",
							isActive: true,
						},
					])
				}
				onRemove={(id) =>
					setExceptions(exceptions.filter((e) => e.entityId !== id))
				}
				onUpdate={(id, updates) =>
					setExceptions(
						exceptions.map((e) =>
							e.entityId === id ? { ...e, ...updates } : e,
						),
					)
				}
			/>

			<AddLimitDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				onConfirm={confirmAdd}
			>
				<div className="flex flex-col gap-3">
					<div>
						<Label>Max Queries</Label>
						<Input
							type="number"
							value={newMaxQueries}
							onChange={(e) => setNewMaxQueries(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Time Period</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availablePeriods.map((p) => (
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

// ─── Tab 2: App Limits ────────────────────────────────────────────────────────

interface AppLimitEntry {
	id: string;
	period: TimePeriod;
	maxTokens: number;
	maxInputTokens: number;
	maxOutputTokens: number;
	isActive: boolean;
	_saved: {
		period: TimePeriod;
		maxTokens: number;
		maxInputTokens: number;
		maxOutputTokens: number;
		isActive: boolean;
	};
}

function AppLimitsTab() {
	const [limits, setLimits] = useState<AppLimitEntry[]>([
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
	const [exceptions, setExceptions] = useState<ExceptionEntry[]>([
		{
			entityId: "857e7266-3d49-4380-8a99-45f2c56ff3cb",
			entityName: "Vibe Model Token Limit",
			entityDetails: [
				{
					label: "ID",
					value: "857e7266-3d49-4380-8a99-45f2c56ff3cb",
				},
				{ label: "Type", value: "App" },
			],
			customLimit: 1000000,
			period: "DAY",
			isActive: true,
		},
	]);

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("HOUR");
	const [newMaxTokens, setNewMaxTokens] = useState("500000");
	const [newMaxInput, setNewMaxInput] = useState("300000");
	const [newMaxOutput, setNewMaxOutput] = useState("200000");

	const usedPeriods = limits.map((l) => l.period);
	const availablePeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !usedPeriods.includes(p));

	const openAddDialog = () => {
		if (availablePeriods.length === 0) return;
		setNewPeriod(availablePeriods[0]);
		setNewMaxTokens("500000");
		setNewMaxInput("300000");
		setNewMaxOutput("200000");
		setShowAddDialog(true);
	};

	const confirmAdd = () => {
		const t = parseInt(newMaxTokens, 10) || 500000;
		const i = parseInt(newMaxInput, 10) || 300000;
		const o = parseInt(newMaxOutput, 10) || 200000;
		const entry: AppLimitEntry = {
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
		};
		setLimits([...limits, entry]);
		setShowAddDialog(false);
		toast.success("App limit added");
	};

	const removeLimit = (id: string) => {
		setLimits(limits.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const updateLimit = (id: string, updates: Partial<AppLimitEntry>) => {
		setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const saveLimit = (id: string) => {
		setLimits(
			limits.map((l) =>
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

	const isDirty = (l: AppLimitEntry) =>
		l.period !== l._saved.period ||
		l.maxTokens !== l._saved.maxTokens ||
		l.maxInputTokens !== l._saved.maxInputTokens ||
		l.maxOutputTokens !== l._saved.maxOutputTokens ||
		l.isActive !== l._saved.isActive;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-base">
						App Default Limits
					</h3>
					<p className="text-muted-foreground text-sm">
						Default token limits applied across all apps. Set by
						system admin — app creators cannot override.
					</p>
				</div>
				<Button
					onClick={openAddDialog}
					disabled={availablePeriods.length === 0}
					size="sm"
				>
					<Plus className="mr-1 size-3" /> Add Limit
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{limits.map((limit) => (
					<EditableLimitRow
						key={limit.id}
						onDelete={() => removeLimit(limit.id)}
						onSave={() => saveLimit(limit.id)}
						isDirty={isDirty(limit)}
					>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Total:
							</Label>
							<Input
								type="number"
								value={limit.maxTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxTokens:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-28"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Input:
							</Label>
							<Input
								type="number"
								value={limit.maxInputTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxInputTokens:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-28"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Output:
							</Label>
							<Input
								type="number"
								value={limit.maxOutputTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
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
									updateLimit(limit.id, { period: v })
								}
							>
								<SelectTrigger className="h-8 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(
											TIME_PERIOD_LABELS,
										) as TimePeriod[]
									)
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
									updateLimit(limit.id, { isActive: v })
								}
							/>
						</div>
					</EditableLimitRow>
				))}
			</div>

			<ExceptionsSection
				exceptions={exceptions}
				entityLabel="App"
				entityOptions={MOCK_APPS}
				renderEntityDetails={(app) => (
					<EntityDetailRow
						primary={app.name}
						details={[
							{ label: "ID", value: app.id },
							{ label: "Type", value: app.type },
						]}
					/>
				)}
				onAdd={(app) =>
					setExceptions([
						...exceptions,
						{
							entityId: app.id,
							entityName: app.name,
							entityDetails: [
								{ label: "ID", value: app.id },
								{ label: "Type", value: app.type },
							],
							customLimit: 1000000,
							period: "DAY",
							isActive: true,
						},
					])
				}
				onRemove={(id) =>
					setExceptions(exceptions.filter((e) => e.entityId !== id))
				}
				onUpdate={(id, updates) =>
					setExceptions(
						exceptions.map((e) =>
							e.entityId === id ? { ...e, ...updates } : e,
						),
					)
				}
			/>

			<AddLimitDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				onConfirm={confirmAdd}
			>
				<div className="flex flex-col gap-3">
					<div>
						<Label>Total Tokens</Label>
						<Input
							type="number"
							value={newMaxTokens}
							onChange={(e) => setNewMaxTokens(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Input Tokens</Label>
						<Input
							type="number"
							value={newMaxInput}
							onChange={(e) => setNewMaxInput(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Output Tokens</Label>
						<Input
							type="number"
							value={newMaxOutput}
							onChange={(e) => setNewMaxOutput(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Time Period</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availablePeriods.map((p) => (
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

// ─── Tab 3: Team Limits ───────────────────────────────────────────────────────

interface TeamLimitEntry {
	id: string;
	period: TimePeriod;
	maxTokens: number;
	isActive: boolean;
	_saved: { period: TimePeriod; maxTokens: number; isActive: boolean };
}

function TeamLimitsTab() {
	const [limits, setLimits] = useState<TeamLimitEntry[]>([
		{
			id: genId(),
			period: "DAY",
			maxTokens: 1000000,
			isActive: true,
			_saved: { period: "DAY", maxTokens: 1000000, isActive: true },
		},
	]);
	const [exceptions, setExceptions] = useState<ExceptionEntry[]>([
		{
			entityId: "team-exec",
			entityName: "Executive",
			entityDetails: [
				{ label: "Team Type", value: "DEFAULT" },
				{ label: "Members", value: "4" },
			],
			customLimit: 5000000,
			period: "DAY",
			isActive: true,
		},
	]);

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("HOUR");
	const [newMaxTokens, setNewMaxTokens] = useState("1000000");

	const usedPeriods = limits.map((l) => l.period);
	const availablePeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !usedPeriods.includes(p));

	const openAddDialog = () => {
		if (availablePeriods.length === 0) return;
		setNewPeriod(availablePeriods[0]);
		setNewMaxTokens("1000000");
		setShowAddDialog(true);
	};

	const confirmAdd = () => {
		const t = parseInt(newMaxTokens, 10) || 1000000;
		setLimits([
			...limits,
			{
				id: genId(),
				period: newPeriod,
				maxTokens: t,
				isActive: true,
				_saved: { period: newPeriod, maxTokens: t, isActive: true },
			},
		]);
		setShowAddDialog(false);
		toast.success("Team limit added");
	};

	const removeLimit = (id: string) => {
		setLimits(limits.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const updateLimit = (id: string, updates: Partial<TeamLimitEntry>) => {
		setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const saveLimit = (id: string) => {
		setLimits(
			limits.map((l) =>
				l.id === id
					? {
							...l,
							_saved: {
								period: l.period,
								maxTokens: l.maxTokens,
								isActive: l.isActive,
							},
						}
					: l,
			),
		);
		toast.success("Limit saved");
	};

	const isDirty = (l: TeamLimitEntry) =>
		l.period !== l._saved.period ||
		l.maxTokens !== l._saved.maxTokens ||
		l.isActive !== l._saved.isActive;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-base">
						Team Platform-Wide Limits
					</h3>
					<p className="text-muted-foreground text-sm">
						Token limits applied per team. Applies to all teams
						unless specified as an exception.
					</p>
				</div>
				<Button
					onClick={openAddDialog}
					disabled={availablePeriods.length === 0}
					size="sm"
				>
					<Plus className="mr-1 size-3" /> Add Limit
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{limits.map((limit) => (
					<EditableLimitRow
						key={limit.id}
						onDelete={() => removeLimit(limit.id)}
						onSave={() => saveLimit(limit.id)}
						isDirty={isDirty(limit)}
					>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Tokens:
							</Label>
							<Input
								type="number"
								value={limit.maxTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxTokens:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-32"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="text-xs">Period:</Label>
							<Select
								value={limit.period}
								onValueChange={(v: TimePeriod) =>
									updateLimit(limit.id, { period: v })
								}
							>
								<SelectTrigger className="h-8 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(
											TIME_PERIOD_LABELS,
										) as TimePeriod[]
									)
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
									updateLimit(limit.id, { isActive: v })
								}
							/>
						</div>
					</EditableLimitRow>
				))}
			</div>

			<ExceptionsSection
				exceptions={exceptions}
				entityLabel="Team"
				entityOptions={MOCK_TEAMS}
				renderEntityDetails={(team) => (
					<EntityDetailRow
						primary={team.name}
						details={[
							{ label: "Team Type", value: team.teamType },
							{
								label: "Members",
								value: String(team.memberCount),
							},
						]}
					/>
				)}
				onAdd={(team) =>
					setExceptions([
						...exceptions,
						{
							entityId: team.id,
							entityName: team.name,
							entityDetails: [
								{
									label: "Team Type",
									value: team.teamType,
								},
								{
									label: "Members",
									value: String(team.memberCount),
								},
							],
							customLimit: 2000000,
							period: "DAY",
							isActive: true,
						},
					])
				}
				onRemove={(id) =>
					setExceptions(exceptions.filter((e) => e.entityId !== id))
				}
				onUpdate={(id, updates) =>
					setExceptions(
						exceptions.map((e) =>
							e.entityId === id ? { ...e, ...updates } : e,
						),
					)
				}
			/>

			<AddLimitDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				onConfirm={confirmAdd}
			>
				<div className="flex flex-col gap-3">
					<div>
						<Label>Max Tokens</Label>
						<Input
							type="number"
							value={newMaxTokens}
							onChange={(e) => setNewMaxTokens(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Time Period</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availablePeriods.map((p) => (
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

// ─── Tab 4: User Limits ───────────────────────────────────────────────────────

interface UserLimitEntry {
	id: string;
	period: TimePeriod;
	maxTokens: number;
	isActive: boolean;
	_saved: { period: TimePeriod; maxTokens: number; isActive: boolean };
}

function UserLimitsTab() {
	const [limits, setLimits] = useState<UserLimitEntry[]>([
		{
			id: genId(),
			period: "DAY",
			maxTokens: 200000,
			isActive: true,
			_saved: { period: "DAY", maxTokens: 200000, isActive: true },
		},
		{
			id: genId(),
			period: "HOUR",
			maxTokens: 50000,
			isActive: true,
			_saved: { period: "HOUR", maxTokens: 50000, isActive: true },
		},
	]);
	const [exceptions, setExceptions] = useState<ExceptionEntry[]>([
		{
			entityId: "dprince",
			entityName: "Diana Prince",
			entityDetails: [
				{ label: "ID", value: "dprince" },
				{ label: "Email", value: "dprince@deloitte.com" },
				{ label: "Login Type", value: "NATIVE" },
			],
			customLimit: 500000,
			period: "DAY",
			isActive: true,
		},
	]);

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("HOUR");
	const [newMaxTokens, setNewMaxTokens] = useState("200000");

	const usedPeriods = limits.map((l) => l.period);
	const availablePeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !usedPeriods.includes(p));

	const openAddDialog = () => {
		if (availablePeriods.length === 0) return;
		setNewPeriod(availablePeriods[0]);
		setNewMaxTokens("200000");
		setShowAddDialog(true);
	};

	const confirmAdd = () => {
		const t = parseInt(newMaxTokens, 10) || 200000;
		setLimits([
			...limits,
			{
				id: genId(),
				period: newPeriod,
				maxTokens: t,
				isActive: true,
				_saved: { period: newPeriod, maxTokens: t, isActive: true },
			},
		]);
		setShowAddDialog(false);
		toast.success("User limit added");
	};

	const removeLimit = (id: string) => {
		setLimits(limits.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const updateLimit = (id: string, updates: Partial<UserLimitEntry>) => {
		setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const saveLimit = (id: string) => {
		setLimits(
			limits.map((l) =>
				l.id === id
					? {
							...l,
							_saved: {
								period: l.period,
								maxTokens: l.maxTokens,
								isActive: l.isActive,
							},
						}
					: l,
			),
		);
		toast.success("Limit saved");
	};

	const isDirty = (l: UserLimitEntry) =>
		l.period !== l._saved.period ||
		l.maxTokens !== l._saved.maxTokens ||
		l.isActive !== l._saved.isActive;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-base">
						User Platform-Wide Limits
					</h3>
					<p className="text-muted-foreground text-sm">
						Token limits applied per user across the platform.
						Applies to all users unless specified as an exception.
					</p>
				</div>
				<Button
					onClick={openAddDialog}
					disabled={availablePeriods.length === 0}
					size="sm"
				>
					<Plus className="mr-1 size-3" /> Add Limit
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{limits.map((limit) => (
					<EditableLimitRow
						key={limit.id}
						onDelete={() => removeLimit(limit.id)}
						onSave={() => saveLimit(limit.id)}
						isDirty={isDirty(limit)}
					>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Tokens:
							</Label>
							<Input
								type="number"
								value={limit.maxTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxTokens:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-32"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="text-xs">Period:</Label>
							<Select
								value={limit.period}
								onValueChange={(v: TimePeriod) =>
									updateLimit(limit.id, { period: v })
								}
							>
								<SelectTrigger className="h-8 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(
											TIME_PERIOD_LABELS,
										) as TimePeriod[]
									)
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
									updateLimit(limit.id, { isActive: v })
								}
							/>
						</div>
					</EditableLimitRow>
				))}
			</div>

			<ExceptionsSection
				exceptions={exceptions}
				entityLabel="User"
				entityOptions={MOCK_USERS}
				renderEntityDetails={(user) => (
					<EntityDetailRow
						primary={user.name}
						details={[
							{ label: "ID", value: user.id },
							{ label: "Email", value: user.email },
							{ label: "Login Type", value: user.loginType },
						]}
					/>
				)}
				onAdd={(user) =>
					setExceptions([
						...exceptions,
						{
							entityId: user.id,
							entityName: user.name,
							entityDetails: [
								{ label: "ID", value: user.id },
								{ label: "Email", value: user.email },
								{
									label: "Login Type",
									value: user.loginType,
								},
							],
							customLimit: 500000,
							period: "DAY",
							isActive: true,
						},
					])
				}
				onRemove={(id) =>
					setExceptions(exceptions.filter((e) => e.entityId !== id))
				}
				onUpdate={(id, updates) =>
					setExceptions(
						exceptions.map((e) =>
							e.entityId === id ? { ...e, ...updates } : e,
						),
					)
				}
			/>

			<AddLimitDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				onConfirm={confirmAdd}
			>
				<div className="flex flex-col gap-3">
					<div>
						<Label>Max Tokens</Label>
						<Input
							type="number"
							value={newMaxTokens}
							onChange={(e) => setNewMaxTokens(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Time Period</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availablePeriods.map((p) => (
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

// ─── Tab 5: Room Limits ───────────────────────────────────────────────────────

interface RoomLimitEntry {
	id: string;
	period: TimePeriod;
	maxTokens: number;
	maxInputTokens: number;
	maxOutputTokens: number;
	isActive: boolean;
	_saved: {
		period: TimePeriod;
		maxTokens: number;
		maxInputTokens: number;
		maxOutputTokens: number;
		isActive: boolean;
	};
}

function RoomLimitsTab() {
	const [limits, setLimits] = useState<RoomLimitEntry[]>([
		{
			id: genId(),
			period: "DAY",
			maxTokens: 300000,
			maxInputTokens: 200000,
			maxOutputTokens: 100000,
			isActive: true,
			_saved: {
				period: "DAY",
				maxTokens: 300000,
				maxInputTokens: 200000,
				maxOutputTokens: 100000,
				isActive: true,
			},
		},
	]);
	const [exceptions, setExceptions] = useState<ExceptionEntry[]>([]);

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("HOUR");
	const [newMaxTokens, setNewMaxTokens] = useState("300000");
	const [newMaxInput, setNewMaxInput] = useState("200000");
	const [newMaxOutput, setNewMaxOutput] = useState("100000");

	const usedPeriods = limits.map((l) => l.period);
	const availablePeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !usedPeriods.includes(p));

	const openAddDialog = () => {
		if (availablePeriods.length === 0) return;
		setNewPeriod(availablePeriods[0]);
		setNewMaxTokens("300000");
		setNewMaxInput("200000");
		setNewMaxOutput("100000");
		setShowAddDialog(true);
	};

	const confirmAdd = () => {
		const t = parseInt(newMaxTokens, 10) || 300000;
		const i = parseInt(newMaxInput, 10) || 200000;
		const o = parseInt(newMaxOutput, 10) || 100000;
		setLimits([
			...limits,
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
		setShowAddDialog(false);
		toast.success("Room limit added");
	};

	const removeLimit = (id: string) => {
		setLimits(limits.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const updateLimit = (id: string, updates: Partial<RoomLimitEntry>) => {
		setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const saveLimit = (id: string) => {
		setLimits(
			limits.map((l) =>
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

	const isDirty = (l: RoomLimitEntry) =>
		l.period !== l._saved.period ||
		l.maxTokens !== l._saved.maxTokens ||
		l.maxInputTokens !== l._saved.maxInputTokens ||
		l.maxOutputTokens !== l._saved.maxOutputTokens ||
		l.isActive !== l._saved.isActive;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-base">
						Room Platform-Wide Limits
					</h3>
					<p className="text-muted-foreground text-sm">
						Token limits applied per room. Applies to all rooms
						unless specified as an exception.
					</p>
				</div>
				<Button
					onClick={openAddDialog}
					disabled={availablePeriods.length === 0}
					size="sm"
				>
					<Plus className="mr-1 size-3" /> Add Limit
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{limits.map((limit) => (
					<EditableLimitRow
						key={limit.id}
						onDelete={() => removeLimit(limit.id)}
						onSave={() => saveLimit(limit.id)}
						isDirty={isDirty(limit)}
					>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Total:
							</Label>
							<Input
								type="number"
								value={limit.maxTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxTokens:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-28"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Input:
							</Label>
							<Input
								type="number"
								value={limit.maxInputTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxInputTokens:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-28"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Output:
							</Label>
							<Input
								type="number"
								value={limit.maxOutputTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
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
									updateLimit(limit.id, { period: v })
								}
							>
								<SelectTrigger className="h-8 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(
											TIME_PERIOD_LABELS,
										) as TimePeriod[]
									)
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
									updateLimit(limit.id, { isActive: v })
								}
							/>
						</div>
					</EditableLimitRow>
				))}
			</div>

			<ExceptionsSection
				exceptions={exceptions}
				entityLabel="Room"
				entityOptions={MOCK_ROOMS}
				renderEntityDetails={(room) => (
					<EntityDetailRow
						primary={room.name}
						details={[
							{ label: "ID", value: room.id },
							{ label: "Type", value: room.type },
						]}
					/>
				)}
				onAdd={(room) =>
					setExceptions([
						...exceptions,
						{
							entityId: room.id,
							entityName: room.name,
							entityDetails: [
								{ label: "ID", value: room.id },
								{ label: "Type", value: room.type },
							],
							customLimit: 500000,
							period: "DAY",
							isActive: true,
						},
					])
				}
				onRemove={(id) =>
					setExceptions(exceptions.filter((e) => e.entityId !== id))
				}
				onUpdate={(id, updates) =>
					setExceptions(
						exceptions.map((e) =>
							e.entityId === id ? { ...e, ...updates } : e,
						),
					)
				}
			/>

			<AddLimitDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				onConfirm={confirmAdd}
			>
				<div className="flex flex-col gap-3">
					<div>
						<Label>Total Tokens</Label>
						<Input
							type="number"
							value={newMaxTokens}
							onChange={(e) => setNewMaxTokens(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Input Tokens</Label>
						<Input
							type="number"
							value={newMaxInput}
							onChange={(e) => setNewMaxInput(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Output Tokens</Label>
						<Input
							type="number"
							value={newMaxOutput}
							onChange={(e) => setNewMaxOutput(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Time Period</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availablePeriods.map((p) => (
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

// ─── Tab 6: Database Limits ───────────────────────────────────────────────────

interface DatabaseLimitEntry {
	id: string;
	maxRecordsPerQuery: number;
	maxDataSizePerQueryMB: number;
	period: TimePeriod;
	isActive: boolean;
	_saved: {
		maxRecordsPerQuery: number;
		maxDataSizePerQueryMB: number;
		period: TimePeriod;
		isActive: boolean;
	};
}

function DatabaseLimitsTab() {
	const [limits, setLimits] = useState<DatabaseLimitEntry[]>([
		{
			id: genId(),
			maxRecordsPerQuery: 10000,
			maxDataSizePerQueryMB: 50,
			period: "DAY",
			isActive: true,
			_saved: {
				maxRecordsPerQuery: 10000,
				maxDataSizePerQueryMB: 50,
				period: "DAY",
				isActive: true,
			},
		},
	]);
	const [exceptions, setExceptions] = useState<ExceptionEntry[]>([]);

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("HOUR");
	const [newRecords, setNewRecords] = useState("10000");
	const [newSize, setNewSize] = useState("50");

	const usedPeriods = limits.map((l) => l.period);
	const availablePeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !usedPeriods.includes(p));

	const openAddDialog = () => {
		if (availablePeriods.length === 0) return;
		setNewPeriod(availablePeriods[0]);
		setNewRecords("10000");
		setNewSize("50");
		setShowAddDialog(true);
	};

	const confirmAdd = () => {
		const r = parseInt(newRecords, 10) || 10000;
		const s = parseInt(newSize, 10) || 50;
		setLimits([
			...limits,
			{
				id: genId(),
				maxRecordsPerQuery: r,
				maxDataSizePerQueryMB: s,
				period: newPeriod,
				isActive: true,
				_saved: {
					maxRecordsPerQuery: r,
					maxDataSizePerQueryMB: s,
					period: newPeriod,
					isActive: true,
				},
			},
		]);
		setShowAddDialog(false);
		toast.success("Database limit added");
	};

	const removeLimit = (id: string) => {
		setLimits(limits.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const updateLimit = (id: string, updates: Partial<DatabaseLimitEntry>) => {
		setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const saveLimit = (id: string) => {
		setLimits(
			limits.map((l) =>
				l.id === id
					? {
							...l,
							_saved: {
								maxRecordsPerQuery: l.maxRecordsPerQuery,
								maxDataSizePerQueryMB: l.maxDataSizePerQueryMB,
								period: l.period,
								isActive: l.isActive,
							},
						}
					: l,
			),
		);
		toast.success("Limit saved");
	};

	const isDirty = (l: DatabaseLimitEntry) =>
		l.maxRecordsPerQuery !== l._saved.maxRecordsPerQuery ||
		l.maxDataSizePerQueryMB !== l._saved.maxDataSizePerQueryMB ||
		l.period !== l._saved.period ||
		l.isActive !== l._saved.isActive;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-base">
						Database Platform-Wide Limits
					</h3>
					<p className="text-muted-foreground text-sm">
						Control max records per query and data size per query
						for all databases.
					</p>
				</div>
				<Button
					onClick={openAddDialog}
					disabled={availablePeriods.length === 0}
					size="sm"
				>
					<Plus className="mr-1 size-3" /> Add Limit
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{limits.map((limit) => (
					<EditableLimitRow
						key={limit.id}
						onDelete={() => removeLimit(limit.id)}
						onSave={() => saveLimit(limit.id)}
						isDirty={isDirty(limit)}
					>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Records/Query:
							</Label>
							<Input
								type="number"
								value={limit.maxRecordsPerQuery}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxRecordsPerQuery:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-28"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Size (MB):
							</Label>
							<Input
								type="number"
								value={limit.maxDataSizePerQueryMB}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxDataSizePerQueryMB:
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
									updateLimit(limit.id, { period: v })
								}
							>
								<SelectTrigger className="h-8 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(
											TIME_PERIOD_LABELS,
										) as TimePeriod[]
									)
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
									updateLimit(limit.id, { isActive: v })
								}
							/>
						</div>
					</EditableLimitRow>
				))}
			</div>

			<ExceptionsSection
				exceptions={exceptions}
				entityLabel="Database"
				entityOptions={MOCK_DATABASES}
				renderEntityDetails={(db) => (
					<EntityDetailRow
						primary={db.name}
						details={[
							{ label: "ID", value: db.id },
							{ label: "Type", value: db.type },
						]}
					/>
				)}
				onAdd={(db) =>
					setExceptions([
						...exceptions,
						{
							entityId: db.id,
							entityName: db.name,
							entityDetails: [
								{ label: "ID", value: db.id },
								{ label: "Type", value: db.type },
							],
							customLimit: 50000,
							period: "DAY",
							isActive: true,
						},
					])
				}
				onRemove={(id) =>
					setExceptions(exceptions.filter((e) => e.entityId !== id))
				}
				onUpdate={(id, updates) =>
					setExceptions(
						exceptions.map((e) =>
							e.entityId === id ? { ...e, ...updates } : e,
						),
					)
				}
			/>

			<AddLimitDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				onConfirm={confirmAdd}
			>
				<div className="flex flex-col gap-3">
					<div>
						<Label>Max Records per Query</Label>
						<Input
							type="number"
							value={newRecords}
							onChange={(e) => setNewRecords(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Max Data Size per Query (MB)</Label>
						<Input
							type="number"
							value={newSize}
							onChange={(e) => setNewSize(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Time Period</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availablePeriods.map((p) => (
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

// ─── Tab 7: Vector Engine Limits ──────────────────────────────────────────────

interface VectorLimitEntry {
	id: string;
	period: TimePeriod;
	maxRequestsPerPeriod: number;
	maxChunksReturned: number;
	maxEmbeddedTokens: number;
	isActive: boolean;
	_saved: {
		period: TimePeriod;
		maxRequestsPerPeriod: number;
		maxChunksReturned: number;
		maxEmbeddedTokens: number;
		isActive: boolean;
	};
}

function VectorLimitsTab() {
	const [limits, setLimits] = useState<VectorLimitEntry[]>([
		{
			id: genId(),
			period: "HOUR",
			maxRequestsPerPeriod: 500,
			maxChunksReturned: 20,
			maxEmbeddedTokens: 5000000,
			isActive: true,
			_saved: {
				period: "HOUR",
				maxRequestsPerPeriod: 500,
				maxChunksReturned: 20,
				maxEmbeddedTokens: 5000000,
				isActive: true,
			},
		},
		{
			id: genId(),
			period: "DAY",
			maxRequestsPerPeriod: 5000,
			maxChunksReturned: 20,
			maxEmbeddedTokens: 50000000,
			isActive: true,
			_saved: {
				period: "DAY",
				maxRequestsPerPeriod: 5000,
				maxChunksReturned: 20,
				maxEmbeddedTokens: 50000000,
				isActive: true,
			},
		},
	]);
	const [exceptions, setExceptions] = useState<ExceptionEntry[]>([]);

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("ALL_TIME");
	const [newRequests, setNewRequests] = useState("500");
	const [newChunks, setNewChunks] = useState("20");
	const [newEmbedded, setNewEmbedded] = useState("5000000");

	const usedPeriods = limits.map((l) => l.period);
	const availablePeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !usedPeriods.includes(p));

	const openAddDialog = () => {
		if (availablePeriods.length === 0) return;
		setNewPeriod(availablePeriods[0]);
		setNewRequests("500");
		setNewChunks("20");
		setNewEmbedded("5000000");
		setShowAddDialog(true);
	};

	const confirmAdd = () => {
		const r = parseInt(newRequests, 10) || 500;
		const c = parseInt(newChunks, 10) || 20;
		const e = parseInt(newEmbedded, 10) || 5000000;
		setLimits([
			...limits,
			{
				id: genId(),
				period: newPeriod,
				maxRequestsPerPeriod: r,
				maxChunksReturned: c,
				maxEmbeddedTokens: e,
				isActive: true,
				_saved: {
					period: newPeriod,
					maxRequestsPerPeriod: r,
					maxChunksReturned: c,
					maxEmbeddedTokens: e,
					isActive: true,
				},
			},
		]);
		setShowAddDialog(false);
		toast.success("Vector limit added");
	};

	const removeLimit = (id: string) => {
		setLimits(limits.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const updateLimit = (id: string, updates: Partial<VectorLimitEntry>) => {
		setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const saveLimit = (id: string) => {
		setLimits(
			limits.map((l) =>
				l.id === id
					? {
							...l,
							_saved: {
								period: l.period,
								maxRequestsPerPeriod: l.maxRequestsPerPeriod,
								maxChunksReturned: l.maxChunksReturned,
								maxEmbeddedTokens: l.maxEmbeddedTokens,
								isActive: l.isActive,
							},
						}
					: l,
			),
		);
		toast.success("Limit saved");
	};

	const isDirty = (l: VectorLimitEntry) =>
		l.period !== l._saved.period ||
		l.maxRequestsPerPeriod !== l._saved.maxRequestsPerPeriod ||
		l.maxChunksReturned !== l._saved.maxChunksReturned ||
		l.maxEmbeddedTokens !== l._saved.maxEmbeddedTokens ||
		l.isActive !== l._saved.isActive;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-base">
						Vector Engine Platform-Wide Limits
					</h3>
					<p className="text-muted-foreground text-sm">
						Limits on vector search requests, chunks returned, and
						total embedded tokens.
					</p>
				</div>
				<Button
					onClick={openAddDialog}
					disabled={availablePeriods.length === 0}
					size="sm"
				>
					<Plus className="mr-1 size-3" /> Add Limit
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{limits.map((limit) => (
					<EditableLimitRow
						key={limit.id}
						onDelete={() => removeLimit(limit.id)}
						onSave={() => saveLimit(limit.id)}
						isDirty={isDirty(limit)}
					>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Requests:
							</Label>
							<Input
								type="number"
								value={limit.maxRequestsPerPeriod}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxRequestsPerPeriod:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-24"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Chunks:
							</Label>
							<Input
								type="number"
								value={limit.maxChunksReturned}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxChunksReturned:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-20"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Embedded:
							</Label>
							<Input
								type="number"
								value={limit.maxEmbeddedTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxEmbeddedTokens:
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
									updateLimit(limit.id, { period: v })
								}
							>
								<SelectTrigger className="h-8 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(
											TIME_PERIOD_LABELS,
										) as TimePeriod[]
									)
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
									updateLimit(limit.id, { isActive: v })
								}
							/>
						</div>
					</EditableLimitRow>
				))}
			</div>

			<ExceptionsSection
				exceptions={exceptions}
				entityLabel="Vector Engine"
				entityOptions={MOCK_VECTORS}
				renderEntityDetails={(vec) => (
					<EntityDetailRow
						primary={vec.name}
						details={[
							{ label: "ID", value: vec.id },
							{ label: "Type", value: vec.vectorType },
						]}
					/>
				)}
				onAdd={(vec) =>
					setExceptions([
						...exceptions,
						{
							entityId: vec.id,
							entityName: vec.name,
							entityDetails: [
								{ label: "ID", value: vec.id },
								{ label: "Type", value: vec.vectorType },
							],
							customLimit: 10000,
							period: "DAY",
							isActive: true,
						},
					])
				}
				onRemove={(id) =>
					setExceptions(exceptions.filter((e) => e.entityId !== id))
				}
				onUpdate={(id, updates) =>
					setExceptions(
						exceptions.map((e) =>
							e.entityId === id ? { ...e, ...updates } : e,
						),
					)
				}
			/>

			<AddLimitDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				onConfirm={confirmAdd}
			>
				<div className="flex flex-col gap-3">
					<div>
						<Label>Max Requests per Period</Label>
						<Input
							type="number"
							value={newRequests}
							onChange={(e) => setNewRequests(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Max Chunks Returned</Label>
						<Input
							type="number"
							value={newChunks}
							onChange={(e) => setNewChunks(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Max Embedded Tokens</Label>
						<Input
							type="number"
							value={newEmbedded}
							onChange={(e) => setNewEmbedded(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Time Period</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availablePeriods.map((p) => (
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

// ─── Tab 8: Storage Engine Limits ─────────────────────────────────────────────

interface StorageLimitEntry {
	id: string;
	maxUploadSizeMB: number;
	maxDownloadSizeMB: number;
	period: TimePeriod;
	isActive: boolean;
	_saved: {
		maxUploadSizeMB: number;
		maxDownloadSizeMB: number;
		period: TimePeriod;
		isActive: boolean;
	};
}

function StorageLimitsTab() {
	const [limits, setLimits] = useState<StorageLimitEntry[]>([
		{
			id: genId(),
			maxUploadSizeMB: 100,
			maxDownloadSizeMB: 500,
			period: "DAY",
			isActive: true,
			_saved: {
				maxUploadSizeMB: 100,
				maxDownloadSizeMB: 500,
				period: "DAY",
				isActive: true,
			},
		},
	]);
	const [exceptions, setExceptions] = useState<ExceptionEntry[]>([]);

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("HOUR");
	const [newUpload, setNewUpload] = useState("100");
	const [newDownload, setNewDownload] = useState("500");

	const usedPeriods = limits.map((l) => l.period);
	const availablePeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !usedPeriods.includes(p));

	const openAddDialog = () => {
		if (availablePeriods.length === 0) return;
		setNewPeriod(availablePeriods[0]);
		setNewUpload("100");
		setNewDownload("500");
		setShowAddDialog(true);
	};

	const confirmAdd = () => {
		const u = parseInt(newUpload, 10) || 100;
		const d = parseInt(newDownload, 10) || 500;
		setLimits([
			...limits,
			{
				id: genId(),
				maxUploadSizeMB: u,
				maxDownloadSizeMB: d,
				period: newPeriod,
				isActive: true,
				_saved: {
					maxUploadSizeMB: u,
					maxDownloadSizeMB: d,
					period: newPeriod,
					isActive: true,
				},
			},
		]);
		setShowAddDialog(false);
		toast.success("Storage limit added");
	};

	const removeLimit = (id: string) => {
		setLimits(limits.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const updateLimit = (id: string, updates: Partial<StorageLimitEntry>) => {
		setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const saveLimit = (id: string) => {
		setLimits(
			limits.map((l) =>
				l.id === id
					? {
							...l,
							_saved: {
								maxUploadSizeMB: l.maxUploadSizeMB,
								maxDownloadSizeMB: l.maxDownloadSizeMB,
								period: l.period,
								isActive: l.isActive,
							},
						}
					: l,
			),
		);
		toast.success("Limit saved");
	};

	const isDirty = (l: StorageLimitEntry) =>
		l.maxUploadSizeMB !== l._saved.maxUploadSizeMB ||
		l.maxDownloadSizeMB !== l._saved.maxDownloadSizeMB ||
		l.period !== l._saved.period ||
		l.isActive !== l._saved.isActive;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-base">
						Storage Engine Platform-Wide Limits
					</h3>
					<p className="text-muted-foreground text-sm">
						Limits on upload and download sizes per time period.
					</p>
				</div>
				<Button
					onClick={openAddDialog}
					disabled={availablePeriods.length === 0}
					size="sm"
				>
					<Plus className="mr-1 size-3" /> Add Limit
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{limits.map((limit) => (
					<EditableLimitRow
						key={limit.id}
						onDelete={() => removeLimit(limit.id)}
						onSave={() => saveLimit(limit.id)}
						isDirty={isDirty(limit)}
					>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Upload Limit (MB):
							</Label>
							<Input
								type="number"
								value={limit.maxUploadSizeMB}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxUploadSizeMB:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-24"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Download Limit (MB):
							</Label>
							<Input
								type="number"
								value={limit.maxDownloadSizeMB}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxDownloadSizeMB:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-24"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="text-xs">Period:</Label>
							<Select
								value={limit.period}
								onValueChange={(v: TimePeriod) =>
									updateLimit(limit.id, { period: v })
								}
							>
								<SelectTrigger className="h-8 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(
											TIME_PERIOD_LABELS,
										) as TimePeriod[]
									)
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
									updateLimit(limit.id, { isActive: v })
								}
							/>
						</div>
					</EditableLimitRow>
				))}
			</div>

			<ExceptionsSection
				exceptions={exceptions}
				entityLabel="Storage Engine"
				entityOptions={MOCK_STORAGES}
				renderEntityDetails={(stor) => (
					<EntityDetailRow
						primary={stor.name}
						details={[
							{ label: "ID", value: stor.id },
							{ label: "Type", value: stor.type },
						]}
					/>
				)}
				onAdd={(stor) =>
					setExceptions([
						...exceptions,
						{
							entityId: stor.id,
							entityName: stor.name,
							entityDetails: [
								{ label: "ID", value: stor.id },
								{ label: "Type", value: stor.type },
							],
							customLimit: 1000,
							period: "DAY",
							isActive: true,
						},
					])
				}
				onRemove={(id) =>
					setExceptions(exceptions.filter((e) => e.entityId !== id))
				}
				onUpdate={(id, updates) =>
					setExceptions(
						exceptions.map((e) =>
							e.entityId === id ? { ...e, ...updates } : e,
						),
					)
				}
			/>

			<AddLimitDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				onConfirm={confirmAdd}
			>
				<div className="flex flex-col gap-3">
					<div>
						<Label>Upload Limit (MB)</Label>
						<Input
							type="number"
							value={newUpload}
							onChange={(e) => setNewUpload(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Download Limit (MB)</Label>
						<Input
							type="number"
							value={newDownload}
							onChange={(e) => setNewDownload(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Time Period</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availablePeriods.map((p) => (
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

// ─── Tab 9: Agent/Workspace Limits ────────────────────────────────────────────

interface AgentLimitEntry {
	id: string;
	period: TimePeriod;
	maxTokens: number;
	maxToolCalls: number;
	isActive: boolean;
	_saved: {
		period: TimePeriod;
		maxTokens: number;
		maxToolCalls: number;
		isActive: boolean;
	};
}

function AgentLimitsTab() {
	const [limits, setLimits] = useState<AgentLimitEntry[]>([
		{
			id: genId(),
			period: "DAY",
			maxTokens: 50000,
			maxToolCalls: 100,
			isActive: true,
			_saved: {
				period: "DAY",
				maxTokens: 50000,
				maxToolCalls: 100,
				isActive: true,
			},
		},
		{
			id: genId(),
			period: "HOUR",
			maxTokens: 10000,
			maxToolCalls: 30,
			isActive: true,
			_saved: {
				period: "HOUR",
				maxTokens: 10000,
				maxToolCalls: 30,
				isActive: true,
			},
		},
	]);
	const [exceptions, setExceptions] = useState<ExceptionEntry[]>([
		{
			entityId: "b8e56t9c-6e5e-550b-a7c8-1d4232bfet04",
			entityName: "Code Review Agent",
			entityDetails: [
				{
					label: "ID",
					value: "b8e56t9c-6e5e-550b-a7c8-1d4232bfet04",
				},
				{ label: "Type", value: "Agent" },
			],
			customLimit: 100000,
			period: "DAY",
			isActive: true,
		},
	]);

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newPeriod, setNewPeriod] = useState<TimePeriod>("ALL_TIME");
	const [newMaxTokens, setNewMaxTokens] = useState("50000");
	const [newMaxToolCalls, setNewMaxToolCalls] = useState("100");

	const usedPeriods = limits.map((l) => l.period);
	const availablePeriods = (
		Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]
	).filter((p) => !usedPeriods.includes(p));

	const openAddDialog = () => {
		if (availablePeriods.length === 0) return;
		setNewPeriod(availablePeriods[0]);
		setNewMaxTokens("50000");
		setNewMaxToolCalls("100");
		setShowAddDialog(true);
	};

	const confirmAdd = () => {
		const t = parseInt(newMaxTokens, 10) || 50000;
		const c = parseInt(newMaxToolCalls, 10) || 100;
		setLimits([
			...limits,
			{
				id: genId(),
				period: newPeriod,
				maxTokens: t,
				maxToolCalls: c,
				isActive: true,
				_saved: {
					period: newPeriod,
					maxTokens: t,
					maxToolCalls: c,
					isActive: true,
				},
			},
		]);
		setShowAddDialog(false);
		toast.success("Agent limit added");
	};

	const removeLimit = (id: string) => {
		setLimits(limits.filter((l) => l.id !== id));
		toast.success("Limit removed");
	};

	const updateLimit = (id: string, updates: Partial<AgentLimitEntry>) => {
		setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
	};

	const saveLimit = (id: string) => {
		setLimits(
			limits.map((l) =>
				l.id === id
					? {
							...l,
							_saved: {
								period: l.period,
								maxTokens: l.maxTokens,
								maxToolCalls: l.maxToolCalls,
								isActive: l.isActive,
							},
						}
					: l,
			),
		);
		toast.success("Limit saved");
	};

	const isDirty = (l: AgentLimitEntry) =>
		l.period !== l._saved.period ||
		l.maxTokens !== l._saved.maxTokens ||
		l.maxToolCalls !== l._saved.maxToolCalls ||
		l.isActive !== l._saved.isActive;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-base">
						Agent/Workspace Platform-Wide Limits
					</h3>
					<p className="text-muted-foreground text-sm">
						Token and tool-call limits for autonomous agents per
						time period.
					</p>
				</div>
				<Button
					onClick={openAddDialog}
					disabled={availablePeriods.length === 0}
					size="sm"
				>
					<Plus className="mr-1 size-3" /> Add Limit
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{limits.map((limit) => (
					<EditableLimitRow
						key={limit.id}
						onDelete={() => removeLimit(limit.id)}
						onSave={() => saveLimit(limit.id)}
						isDirty={isDirty(limit)}
					>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Tokens:
							</Label>
							<Input
								type="number"
								value={limit.maxTokens}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxTokens:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-28"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="whitespace-nowrap text-xs">
								Max Tool Calls:
							</Label>
							<Input
								type="number"
								value={limit.maxToolCalls}
								onChange={(e) =>
									updateLimit(limit.id, {
										maxToolCalls:
											parseInt(e.target.value, 10) || 0,
									})
								}
								className="h-8 w-24"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="text-xs">Period:</Label>
							<Select
								value={limit.period}
								onValueChange={(v: TimePeriod) =>
									updateLimit(limit.id, { period: v })
								}
							>
								<SelectTrigger className="h-8 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(
											TIME_PERIOD_LABELS,
										) as TimePeriod[]
									)
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
									updateLimit(limit.id, { isActive: v })
								}
							/>
						</div>
					</EditableLimitRow>
				))}
			</div>

			<ExceptionsSection
				exceptions={exceptions}
				entityLabel="Agent"
				entityOptions={MOCK_AGENTS}
				renderEntityDetails={(agent) => (
					<EntityDetailRow
						primary={agent.name}
						details={[
							{ label: "ID", value: agent.id },
							{ label: "Type", value: agent.type },
						]}
					/>
				)}
				onAdd={(agent) =>
					setExceptions([
						...exceptions,
						{
							entityId: agent.id,
							entityName: agent.name,
							entityDetails: [
								{ label: "ID", value: agent.id },
								{ label: "Type", value: agent.type },
							],
							customLimit: 100000,
							period: "DAY",
							isActive: true,
						},
					])
				}
				onRemove={(id) =>
					setExceptions(exceptions.filter((e) => e.entityId !== id))
				}
				onUpdate={(id, updates) =>
					setExceptions(
						exceptions.map((e) =>
							e.entityId === id ? { ...e, ...updates } : e,
						),
					)
				}
			/>

			<AddLimitDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				onConfirm={confirmAdd}
			>
				<div className="flex flex-col gap-3">
					<div>
						<Label>Max Tokens</Label>
						<Input
							type="number"
							value={newMaxTokens}
							onChange={(e) => setNewMaxTokens(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Max Tool Calls</Label>
						<Input
							type="number"
							value={newMaxToolCalls}
							onChange={(e) => setNewMaxToolCalls(e.target.value)}
							className="mt-1"
						/>
					</div>
					<div>
						<Label>Time Period</Label>
						<Select
							value={newPeriod}
							onValueChange={(v: TimePeriod) => setNewPeriod(v)}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availablePeriods.map((p) => (
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

// ─── Main Page ────────────────────────────────────────────────────────────────

const TAB_CONFIG = [
	{
		value: "query-rate",
		label: "Query Rate",
		icon: <Clock className="size-3.5" />,
	},
	{
		value: "app",
		label: "App",
		icon: <LayoutGrid className="size-3.5" />,
	},
	{ value: "team", label: "Team", icon: <Users className="size-3.5" /> },
	{
		value: "user",
		label: "User",
		icon: <Users className="size-3.5" />,
	},
	{
		value: "room",
		label: "Room",
		icon: <Settings2 className="size-3.5" />,
	},
	{
		value: "database",
		label: "Database",
		icon: <Database className="size-3.5" />,
	},
	{
		value: "vector",
		label: "Vector",
		icon: <Zap className="size-3.5" />,
	},
	{
		value: "storage",
		label: "Storage",
		icon: <HardDrive className="size-3.5" />,
	},
	{
		value: "agent",
		label: "Agent",
		icon: <Settings2 className="size-3.5" />,
	},
] as const;

export const UsageLimitsPage = () => {
	const { adminMode } = useSettings();
	const [activeTab, setActiveTab] = useState<string>("query-rate");

	if (!adminMode) {
		return <Navigate to="/settings" replace />;
	}

	return (
		<div className="flex w-full flex-col gap-4">
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList className="mb-4 flex w-full flex-wrap gap-1">
					{TAB_CONFIG.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							className="flex items-center gap-1.5 text-xs"
							data-testid={`usage-limits-tab-${tab.value}`}
						>
							{tab.icon}
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="query-rate">
					<QueryRateLimitsTab />
				</TabsContent>
				<TabsContent value="app">
					<AppLimitsTab />
				</TabsContent>
				<TabsContent value="team">
					<TeamLimitsTab />
				</TabsContent>
				<TabsContent value="user">
					<UserLimitsTab />
				</TabsContent>
				<TabsContent value="room">
					<RoomLimitsTab />
				</TabsContent>
				<TabsContent value="database">
					<DatabaseLimitsTab />
				</TabsContent>
				<TabsContent value="vector">
					<VectorLimitsTab />
				</TabsContent>
				<TabsContent value="storage">
					<StorageLimitsTab />
				</TabsContent>
				<TabsContent value="agent">
					<AgentLimitsTab />
				</TabsContent>
			</Tabs>
		</div>
	);
};
