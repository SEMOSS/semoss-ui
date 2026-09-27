import {
	ArrowRight,
	Bot,
	Building2,
	Check,
	Clock,
	Globe,
	Hash,
	Inbox,
	Mail,
	Pencil,
	Plus,
	Send,
	Sparkles,
	Star,
	UserRound,
	X,
	Zap,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Badge, Button, cn, Input } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { PersonAvatar } from "../collaboration/components/person-avatar";
import { setLiveData } from "../collaboration/live/live-state";
import {
	type AccountSuggestion,
	type Job,
	type KeepOutSuggestion,
	LOOK_DAYS,
	listPeople,
	type MailboxOverview,
	mailboxOverview,
	type OnboardingPerson,
	type RuleKind,
	saveAccounts,
	saveRules,
	saveTopics,
	saveVips,
	startClassify,
	startImport,
	suggestAccounts,
	suggestTopics,
	type TopicSuggestion,
} from "./onboarding-api";
import {
	dotColor,
	Failure,
	formatCount,
	LoadingCards,
	message,
	PhaseRow,
	ProgressRing,
	SelectCard,
	StatTile,
	StepActions,
	StepHeader,
} from "./onboarding-ui";
import { useJob } from "./use-job";

interface StepProps {
	actions: InsightActions;
	onNext: () => void;
	onBack?: () => void;
}

const WINDOWS = [
	{ days: 7, label: "Last week", hint: "A quick look" },
	{ days: 30, label: "Last month", hint: "Recommended" },
];

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);
const capitalize = (text: string) =>
	text.charAt(0).toUpperCase() + text.slice(1);
const hostOf = (s: KeepOutSuggestion) =>
	s.kind === "never_domain" ? s.value : (s.value.split("@")[1] ?? "");

function toggled(set: Set<string>, key: string) {
	const next = new Set(set);
	if (next.has(key)) next.delete(key);
	else next.add(key);
	return next;
}

function Next({
	children,
	...props
}: { children: ReactNode } & React.ComponentProps<typeof Button>) {
	return (
		<Button size="lg" {...props}>
			{children}
			<ArrowRight aria-hidden="true" />
		</Button>
	);
}

export function MailboxStep({
	actions,
	onNext,
	days,
	onDays,
	onLoaded,
}: StepProps & {
	days: number;
	onDays: (days: number) => void;
	onLoaded: (overview: MailboxOverview) => void;
}) {
	const [overview, setOverview] = useState<MailboxOverview | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [attempt, setAttempt] = useState(0);
	const lastImport = useJob(actions, "import").job;
	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt re-runs the read
	useEffect(() => {
		setError(null);
		mailboxOverview(actions)
			.then((out) => {
				setOverview(out);
				onLoaded(out);
			})
			.catch((cause: unknown) => setError(message(cause)));
	}, [actions, attempt]);

	const senders = overview?.topSenders.slice(0, 8) ?? [];
	const most = Math.max(1, ...senders.map((s) => s.count));
	const circle = overview?.topSenders.filter((s) => s.youWrote).length ?? 0;

	return (
		<>
			<StepHeader eyebrow="Step 1 of 6" title="Here is your mailbox">
				Counted from message headers only. Nothing is stored until you
				import.
			</StepHeader>
			{error && (
				<Failure
					error={error}
					onRetry={() => setAttempt((a) => a + 1)}
				/>
			)}
			{!overview && !error && (
				<LoadingCards label="Reading your mailbox headers..." />
			)}
			{overview && (
				<>
					<div className="flex items-center gap-4">
						<PersonAvatar
							name={overview.name || overview.address}
							className="size-14 text-base ring-4 ring-primary/10"
						/>
						<div className="min-w-0">
							<div className="truncate font-semibold text-lg">
								{overview.name || overview.address}
							</div>
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<span className="truncate">
									{overview.address}
								</span>
								<span className="inline-flex items-center gap-1.5 rounded-full bg-chart-2/10 px-2 py-0.5 font-medium text-chart-2 text-xs">
									<span className="size-1.5 rounded-full bg-chart-2" />
									Connected
								</span>
							</div>
						</div>
					</div>
					<div className="grid gap-3 sm:grid-cols-3">
						<StatTile
							label={`Inbox, ${LOOK_DAYS} days`}
							value={formatCount(
								overview.counts.inbox[String(LOOK_DAYS)],
							)}
							hint={`${formatCount(overview.counts.inbox["7"])} this week`}
							icon={
								<Inbox className="size-4" aria-hidden="true" />
							}
							tone="primary"
						/>
						<StatTile
							label={`Sent, ${LOOK_DAYS} days`}
							value={formatCount(
								overview.counts.sent[String(LOOK_DAYS)],
							)}
							hint={`${formatCount(overview.counts.sent["7"])} this week`}
							icon={
								<Send className="size-4" aria-hidden="true" />
							}
							tone="teal"
						/>
						<StatTile
							label="Two-way contacts"
							value={circle}
							hint={`of your top ${overview.topSenders.length} senders`}
							icon={
								<UserRound
									className="size-4"
									aria-hidden="true"
								/>
							}
							tone="amber"
						/>
					</div>
					<div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
						<fieldset className="space-y-3">
							<legend className="mb-3 font-medium text-sm">
								How far back should we look?
							</legend>
							{WINDOWS.map((w) => {
								const selected = w.days === days;
								const count =
									(overview.counts.inbox[String(w.days)] ??
										0) +
									(overview.counts.sent[String(w.days)] ?? 0);
								return (
									<button
										key={w.days}
										type="button"
										aria-pressed={selected}
										onClick={() => onDays(w.days)}
										className={cn(
											"flex w-full items-center gap-4 rounded-2xl p-4 text-left ring-1 ring-border/70 transition-all hover:ring-border",
											selected &&
												"bg-primary/[0.05] ring-2 ring-primary/70",
										)}
									>
										<span
											className={cn(
												"flex size-4 shrink-0 items-center justify-center rounded-full border-2",
												selected
													? "border-primary"
													: "border-border",
											)}
										>
											{selected && (
												<span className="size-2 rounded-full bg-primary" />
											)}
										</span>
										<span className="flex-1">
											<span className="block font-medium text-sm">
												{w.label}
											</span>
											<span
												className={cn(
													"block text-xs",
													w.days === 30
														? "text-primary"
														: "text-muted-foreground",
												)}
											>
												{w.hint}
											</span>
										</span>
										<span className="text-right">
											<span className="block font-semibold tabular-nums">
												{formatCount(count)}
											</span>
											<span className="block text-muted-foreground text-xs">
												messages
											</span>
										</span>
									</button>
								);
							})}
						</fieldset>
						<div className="space-y-3">
							<h2 className="font-medium text-sm">
								Who writes to you most
							</h2>
							<ul className="space-y-2.5">
								{senders.map((s) => (
									<li
										key={s.address}
										className="flex items-center gap-3"
									>
										<PersonAvatar
											name={s.name || s.address}
											className="size-7"
										/>
										<div className="min-w-0 flex-1">
											<div className="flex items-baseline justify-between gap-2 text-sm">
												<span className="truncate">
													{s.name || s.address}
												</span>
												<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
													{s.count}
												</span>
											</div>
											<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
												<div
													className={cn(
														"h-full rounded-full",
														s.youWrote
															? "bg-primary"
															: "bg-muted-foreground/40",
													)}
													style={{
														width: `${(100 * s.count) / most}%`,
													}}
												/>
											</div>
										</div>
									</li>
								))}
							</ul>
							<p className="flex items-center gap-3 text-muted-foreground text-xs">
								<span className="inline-flex items-center gap-1.5">
									<span className="size-2 rounded-full bg-primary" />{" "}
									you write back
								</span>
								<span className="inline-flex items-center gap-1.5">
									<span className="size-2 rounded-full bg-muted-foreground/40" />{" "}
									one way
								</span>
							</p>
						</div>
					</div>
					<StepActions
						note={
							lastImport?.status === "done"
								? `Imported before on ${new Date(lastImport.finishedAt).toLocaleDateString()}. Importing again only adds new mail.`
								: undefined
						}
					>
						<Next onClick={onNext}>Continue</Next>
					</StepActions>
				</>
			)}
		</>
	);
}

const KINDS: { kind: RuleKind; label: string; hint: string }[] = [
	{ kind: "never_sender", label: "Sender", hint: "name@example.com" },
	{ kind: "never_domain", label: "Domain", hint: "example.com" },
	{ kind: "never_keyword", label: "Keyword", hint: "at least 3 letters" },
];

export function KeepOutStep({
	actions,
	onNext,
	onBack,
	suggestions,
}: StepProps & { suggestions: KeepOutSuggestion[] }) {
	const [checked, setChecked] = useState(
		() =>
			new Set(
				suggestions
					.filter((s) => !s.alreadyKeptOut)
					.map((s) => s.value),
			),
	);
	const [added, setAdded] = useState<{ kind: RuleKind; value: string }[]>([]);
	const [kind, setKind] = useState<RuleKind>("never_sender");
	const [value, setValue] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isKept = (s: KeepOutSuggestion) =>
		s.alreadyKeptOut || checked.has(s.value);
	// a kept domain covers its senders and subdomains; they fold into its card
	const coverOf = (s: KeepOutSuggestion) =>
		suggestions
			.filter(
				(d) =>
					d.kind === "never_domain" &&
					d.value !== s.value &&
					isKept(d) &&
					(hostOf(s) === d.value ||
						hostOf(s).endsWith(`.${d.value}`)),
			)
			.sort((a, b) => a.value.length - b.value.length)[0];
	const visible = suggestions.filter((s) => !coverOf(s));
	const coveredBy = (d: KeepOutSuggestion) =>
		suggestions.filter((s) => coverOf(s)?.value === d.value);
	const kept = visible.filter(isKept);
	const keptMessages = kept.reduce(
		(sum, s) =>
			sum +
			Math.max(
				s.count,
				coveredBy(s).reduce((n, c) => n + c.count, 0),
			),
		0,
	);

	const save = async () => {
		setSaving(true);
		setError(null);
		try {
			await saveRules(actions, [
				...kept
					.filter((s) => !s.alreadyKeptOut)
					.map((s) => ({ kind: s.kind, value: s.value })),
				...added,
			]);
			onNext();
		} catch (cause) {
			setError(message(cause));
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<StepHeader
				eyebrow="Step 2 of 6"
				title="Keep the noise out"
				aside={
					<div className="rounded-2xl bg-primary/[0.07] px-4 py-3 text-right ring-1 ring-primary/20">
						<div className="font-semibold text-2xl tabular-nums">
							{formatCount(keptMessages)}
						</div>
						<div className="text-muted-foreground text-xs">
							{plural(keptMessages, "message")} kept out
						</div>
					</div>
				}
			>
				Mail from these is never imported, read, or sent to a model. We
				picked automated and bulk senders; tap any you want to keep.
			</StepHeader>
			{suggestions.length === 0 && (
				<p className="text-muted-foreground text-sm">
					Nothing to suggest for this mailbox.
				</p>
			)}
			<div className="grid gap-2.5 sm:grid-cols-2">
				{visible.map((s) => {
					const selected = isKept(s);
					const Icon = s.kind === "never_domain" ? Globe : Bot;
					const covered = coveredBy(s);
					const title =
						s.name && s.name !== s.value ? s.name : s.value;
					return (
						<SelectCard
							key={s.value}
							label={`Keep out ${s.value}`}
							selected={selected}
							disabled={s.alreadyKeptOut}
							onToggle={() =>
								setChecked((prev) => toggled(prev, s.value))
							}
						>
							<span
								className={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
									selected
										? "bg-primary/10 text-primary"
										: "bg-muted text-muted-foreground",
								)}
							>
								<Icon className="size-4" aria-hidden="true" />
							</span>
							<span className="min-w-0">
								<span className="block truncate font-medium text-sm">
									{s.kind === "never_domain"
										? `@${s.value}`
										: title}
								</span>
								{s.kind !== "never_domain" &&
									title !== s.value && (
										<span className="block truncate text-muted-foreground text-xs">
											{s.value}
										</span>
									)}
								<span className="mt-1 block text-muted-foreground text-xs">
									{s.alreadyKeptOut
										? "Already kept out"
										: covered.length
											? `Whole domain - covers ${covered.length} ${covered.length === 1 ? "sender" : "senders"}`
											: `${capitalize(s.reason)} - ${s.count} ${plural(s.count, "message")}`}
								</span>
							</span>
						</SelectCard>
					);
				})}
			</div>
			<div className="space-y-3 rounded-2xl border border-dashed p-4">
				<div className="font-medium text-sm">Add your own</div>
				{added.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{added.map((a) => (
							<span
								key={`${a.kind}:${a.value}`}
								className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pr-1 pl-3 text-primary text-sm"
							>
								{a.kind === "never_keyword" && (
									<Hash
										className="size-3"
										aria-hidden="true"
									/>
								)}
								{a.value}
								<button
									type="button"
									aria-label={`Remove ${a.value}`}
									className="rounded-full p-0.5 hover:bg-primary/15"
									onClick={() =>
										setAdded((list) =>
											list.filter((x) => x !== a),
										)
									}
								>
									<X
										className="size-3.5"
										aria-hidden="true"
									/>
								</button>
							</span>
						))}
					</div>
				)}
				<form
					className="flex flex-wrap items-center gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						const text = value.trim().toLowerCase();
						if (
							!text ||
							(kind === "never_keyword" && text.length < 3)
						)
							return;
						setAdded((list) => [...list, { kind, value: text }]);
						setValue("");
					}}
				>
					<div className="inline-flex rounded-lg bg-muted p-0.5">
						{KINDS.map((k) => (
							<button
								key={k.kind}
								type="button"
								aria-pressed={k.kind === kind}
								onClick={() => setKind(k.kind)}
								className={cn(
									"rounded-md px-3 py-1 font-medium text-xs transition-colors",
									k.kind === kind
										? "bg-card text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{k.label}
							</button>
						))}
					</div>
					<Input
						className="h-9 min-w-48 flex-1"
						value={value}
						placeholder={KINDS.find((k) => k.kind === kind)?.hint}
						aria-label="Add to keep out"
						onChange={(event) => setValue(event.target.value)}
					/>
					<Button type="submit" variant="outline">
						<Plus aria-hidden="true" /> Add
					</Button>
				</form>
			</div>
			{error && <Failure error={error} />}
			<StepActions onBack={onBack}>
				<Next onClick={save} disabled={saving}>
					{saving ? "Saving..." : "Save and continue"}
				</Next>
			</StepActions>
		</>
	);
}

const IMPORT_PHASES = [
	{ steps: ["queued", "mailbox"], label: "Connecting to your mailbox" },
	{ steps: ["reading inbox"], label: "Reading Inbox headers" },
	{ steps: ["reading sentitems"], label: "Reading Sent headers" },
	{ steps: ["importing"], label: "Building threads and people" },
	{ steps: ["threads", "people"], label: "Ranking who matters" },
];

function phaseOf(job: Job, phases: { steps: string[] }[]) {
	if (job.status === "done") return phases.length;
	const index = phases.findIndex((p) => p.steps.includes(job.step));
	return index < 0 ? 0 : index;
}

export function ImportStep({
	actions,
	onNext,
	onBack,
	days,
	onManager,
}: StepProps & { days: number; onManager: (id: string) => void }) {
	const { job, error, follow } = useJob(actions, "import");
	const [starting, setStarting] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const [startedHere, setStartedHere] = useState(false);
	const manager = String(job?.counts.managerPersonId ?? "");
	useEffect(() => {
		if (manager) onManager(manager);
	}, [manager, onManager]);

	const running = job?.status === "running";
	const done = job?.status === "done";
	useEffect(() => {
		if (running) setStartedHere(true);
	}, [running]);

	const start = async () => {
		setStarting(true);
		setStartError(null);
		try {
			follow(await startImport(actions, days));
			setStartedHere(true);
		} catch (cause) {
			setStartError(message(cause));
		} finally {
			setStarting(false);
		}
	};

	const active = job && (startedHere || done) && job.status !== "none";
	const phase = job ? phaseOf(job, IMPORT_PHASES) : 0;
	const counts = job?.counts ?? {};
	return (
		<>
			<StepHeader
				eyebrow="Step 3 of 6"
				title={`Bring in the last ${days} days`}
			>
				Inbox and Sent headers: who, when, and subject. One thread per
				conversation, no message bodies.
			</StepHeader>
			{active ? (
				<div className="grid items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)]">
					<div className="flex justify-center">
						<ProgressRing value={done ? 100 : (job?.progress ?? 0)}>
							<span className="text-muted-foreground text-xs">
								{done ? "complete" : "importing"}
							</span>
						</ProgressRing>
					</div>
					<ol className="space-y-3">
						{IMPORT_PHASES.map((p, index) => (
							<PhaseRow
								key={p.label}
								state={
									index < phase
										? "done"
										: index === phase && running
											? "active"
											: "todo"
								}
							>
								{p.label}
							</PhaseRow>
						))}
					</ol>
				</div>
			) : (
				<div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/40 px-6 py-10 text-center">
					<span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<Mail className="size-6" aria-hidden="true" />
					</span>
					<p className="max-w-sm text-muted-foreground text-sm">
						{done
							? "You imported before. Importing again picks up anything new and skips what is already here."
							: "Takes under a minute for most mailboxes. You can watch it happen."}
					</p>
					<div className="flex flex-wrap justify-center gap-2">
						{[
							"Inbox and Sent",
							"Headers only",
							"Keep-out rules applied",
						].map((chip) => (
							<span
								key={chip}
								className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs ring-1 ring-border/70"
							>
								<Check
									className="size-3 text-primary"
									strokeWidth={3}
									aria-hidden="true"
								/>
								{chip}
							</span>
						))}
					</div>
					<Button
						size="lg"
						onClick={start}
						disabled={starting || !job}
					>
						{done ? `Import again` : `Start import`}
					</Button>
				</div>
			)}
			{active && (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<StatTile
						label="Messages"
						value={formatCount(counts.messages)}
					/>
					<StatTile
						label="Threads"
						value={formatCount(counts.threads ?? 0)}
						tone="primary"
					/>
					<StatTile
						label="People"
						value={formatCount(counts.newPeople ?? 0)}
						tone="teal"
					/>
					<StatTile
						label="Kept out"
						value={formatCount(counts.keptOut ?? 0)}
						tone="muted"
					/>
				</div>
			)}
			{job?.status === "failed" && (
				<Failure
					error={job.error || "The import stopped."}
					onRetry={start}
				/>
			)}
			{(startError || error) && (
				<Failure error={startError || error || ""} />
			)}
			<StepActions onBack={running ? undefined : onBack}>
				{done && (
					<Next
						onClick={onNext}
						variant={startedHere ? "default" : "outline"}
					>
						Continue
					</Next>
				)}
			</StepActions>
		</>
	);
}

function StrengthMeter({ value }: { value: number }) {
	const filled = Math.max(1, Math.round(value / 20));
	return (
		<span className="flex gap-0.5" title={`Strength ${value} of 100`}>
			{[1, 2, 3, 4, 5].map((n) => (
				<span
					key={n}
					className={cn(
						"h-1.5 w-3 rounded-full",
						n <= filled ? "bg-primary" : "bg-muted",
					)}
				/>
			))}
		</span>
	);
}

function PersonCard({
	person,
	vip,
	manager,
	onToggle,
	featured,
}: {
	person: OnboardingPerson;
	vip: boolean;
	manager: boolean;
	onToggle: () => void;
	featured?: boolean;
}) {
	const org = person.email.split("@")[1]?.split(".")[0] ?? "";
	const subtitle = manager
		? "Your manager"
		: person.title ||
			[capitalize(person.relationship), capitalize(org)]
				.filter(Boolean)
				.join(" - ");
	return (
		<div
			className={cn(
				"relative flex h-full items-center gap-3 rounded-2xl ring-1 ring-border/70 transition-all",
				featured ? "flex-col p-4 pt-5 text-center" : "p-2.5",
				vip && "bg-chart-4/[0.07] ring-chart-4/40",
			)}
		>
			<PersonAvatar
				name={person.name}
				className={featured ? "size-14 text-base" : "size-9"}
			/>
			<div className={cn("min-w-0", featured ? "w-full" : "flex-1")}>
				<div className="truncate font-medium text-sm">
					{person.name}
				</div>
				<div className="truncate text-muted-foreground text-xs">
					{subtitle}
				</div>
				<div
					className={cn("mt-1.5 flex", featured && "justify-center")}
				>
					<StrengthMeter value={person.strength} />
				</div>
			</div>
			<button
				type="button"
				aria-pressed={vip}
				aria-label={`${person.name} is a VIP`}
				onClick={onToggle}
				className={cn(
					"rounded-full p-2 transition-all hover:scale-110",
					featured && "absolute top-2 right-2",
					vip
						? "text-chart-4"
						: "text-muted-foreground/40 hover:text-chart-4",
				)}
			>
				<Star
					className={cn("size-5", vip && "fill-chart-4")}
					aria-hidden="true"
				/>
			</button>
		</div>
	);
}

export function PeopleStep({
	actions,
	onNext,
	onBack,
	selfEmail,
	managerId,
}: StepProps & { selfEmail: string; managerId: string }) {
	const [people, setPeople] = useState<OnboardingPerson[] | null>(null);
	const [vips, setVips] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [showAll, setShowAll] = useState(false);
	useEffect(() => {
		listPeople(actions)
			.then((all) => {
				const self = selfEmail.toLowerCase();
				const list = all
					.filter((p) => p.email.toLowerCase() !== self)
					.slice(0, 24);
				setPeople(list);
				const chosen = list.filter((p) => p.vip).map((p) => p.id);
				// nobody marked yet: suggest the manager and the strongest contacts
				if (!chosen.length) {
					if (managerId && list.some((p) => p.id === managerId))
						chosen.push(managerId);
					for (const p of list)
						if (
							chosen.length < 4 &&
							p.strength >= 50 &&
							!chosen.includes(p.id)
						)
							chosen.push(p.id);
				}
				setVips(new Set(chosen));
			})
			.catch((cause: unknown) => setError(message(cause)));
	}, [actions, selfEmail, managerId]);

	const save = async () => {
		if (!people) return;
		setSaving(true);
		setError(null);
		try {
			await saveVips(
				actions,
				people
					.filter((p) => p.vip !== vips.has(p.id))
					.map((p) => ({ id: p.id, vip: vips.has(p.id) })),
			);
			onNext();
		} catch (cause) {
			setError(message(cause));
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<StepHeader
				eyebrow="Step 4 of 6"
				title="The people you work with"
				aside={
					<div className="flex items-center gap-2 rounded-full bg-chart-4/15 px-3 py-1.5 font-medium text-sm">
						<Star
							className="size-4 fill-chart-4 text-chart-4"
							aria-hidden="true"
						/>
						{vips.size} VIPs
					</div>
				}
			>
				Ranked by how much you write to each other. Star your VIPs:
				their asks rise to the top of Work.
			</StepHeader>
			{!people && !error && (
				<LoadingCards label="Ranking people..." count={6} />
			)}
			{people && people.length === 0 && (
				<p className="text-muted-foreground text-sm">
					No people yet; import first.
				</p>
			)}
			{people && people.length > 0 && (
				<>
					<section className="space-y-3">
						<h2 className="font-medium text-sm">
							Your inner circle
						</h2>
						<ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
							{people.slice(0, 4).map((p) => (
								<li key={p.id}>
									<PersonCard
										person={p}
										vip={vips.has(p.id)}
										manager={p.id === managerId}
										onToggle={() =>
											setVips((prev) =>
												toggled(prev, p.id),
											)
										}
										featured
									/>
								</li>
							))}
						</ul>
					</section>
					{people.length > 4 && (
						<section className="space-y-3">
							<h2 className="font-medium text-sm">
								Also in your mail
							</h2>
							<ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								{people
									.slice(4, showAll ? undefined : 13)
									.map((p) => (
										<li key={p.id}>
											<PersonCard
												person={p}
												vip={vips.has(p.id)}
												manager={p.id === managerId}
												onToggle={() =>
													setVips((prev) =>
														toggled(prev, p.id),
													)
												}
											/>
										</li>
									))}
							</ul>
							{!showAll && people.length > 13 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowAll(true)}
								>
									Show {people.length - 13} more
								</Button>
							)}
						</section>
					)}
				</>
			)}
			{error && <Failure error={error} />}
			<StepActions onBack={onBack}>
				<Next onClick={save} disabled={saving || !people}>
					{saving ? "Saving..." : "Save and continue"}
				</Next>
			</StepActions>
		</>
	);
}

export function TopicsStep({ actions, onNext, onBack }: StepProps) {
	const [accounts, setAccounts] = useState<AccountSuggestion[] | null>(null);
	const [pickedAccounts, setPickedAccounts] = useState<Set<string>>(
		new Set(),
	);
	const [topics, setTopics] = useState<TopicSuggestion[] | null>(null);
	const [picked, setPicked] = useState<Set<string>>(new Set());
	const [names, setNames] = useState<Record<string, string>>({});
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		suggestAccounts(actions)
			.then((list) => {
				setAccounts(list);
				setPickedAccounts(new Set(list.map((a) => a.domain)));
			})
			.catch((cause: unknown) => setError(message(cause)));
	}, [actions]);

	const toTopics = async () => {
		if (!accounts) return;
		setBusy(true);
		setError(null);
		try {
			await saveAccounts(
				actions,
				accounts.filter((a) => pickedAccounts.has(a.domain)),
			);
			const list = await suggestTopics(actions);
			setTopics(list);
			setPicked(new Set(list.map((t) => t.id)));
			setNames(Object.fromEntries(list.map((t) => [t.id, t.name])));
		} catch (cause) {
			setError(message(cause));
		} finally {
			setBusy(false);
		}
	};

	const save = async () => {
		if (!topics) return;
		setBusy(true);
		setError(null);
		try {
			await saveTopics(
				actions,
				topics
					.filter((t) => picked.has(t.id))
					.map((t) => ({
						id: t.id,
						name: names[t.id]?.trim() || t.name,
					})),
				topics.filter((t) => !picked.has(t.id)).map((t) => t.id),
			);
			onNext();
		} catch (cause) {
			setError(message(cause));
		} finally {
			setBusy(false);
		}
	};

	if (!topics)
		return (
			<>
				<StepHeader
					eyebrow="Step 5 of 6"
					title="Who you work with outside"
				>
					Organisations found by email domain. Each one you keep gets
					its own topic suggestions next.
				</StepHeader>
				{!accounts && !error && (
					<LoadingCards label="Finding organisations..." />
				)}
				{accounts && accounts.length === 0 && (
					<p className="text-muted-foreground text-sm">
						No outside organisations found.
					</p>
				)}
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{accounts?.map((a, index) => (
						<SelectCard
							key={a.domain}
							label={`Keep ${a.name}`}
							selected={pickedAccounts.has(a.domain)}
							onToggle={() =>
								setPickedAccounts((prev) =>
									toggled(prev, a.domain),
								)
							}
						>
							<span
								className={cn(
									"flex size-10 shrink-0 items-center justify-center rounded-xl font-semibold text-sm text-white",
									dotColor(index),
								)}
							>
								{a.name.slice(0, 1).toUpperCase() || (
									<Building2
										className="size-4"
										aria-hidden="true"
									/>
								)}
							</span>
							<span className="min-w-0">
								<span className="block truncate font-medium">
									{a.name}
								</span>
								<span className="block truncate text-muted-foreground text-xs">
									{a.domain}
								</span>
								<span className="mt-1 block text-muted-foreground text-xs">
									{a.people} people - {a.threads} threads
								</span>
							</span>
						</SelectCard>
					))}
				</div>
				{error && <Failure error={error} />}
				<StepActions onBack={onBack}>
					<Next onClick={toTopics} disabled={busy || !accounts}>
						{busy ? "Finding topics..." : "Suggest topics"}
					</Next>
				</StepActions>
			</>
		);

	return (
		<>
			<StepHeader
				eyebrow="Step 5 of 6"
				title="What your work is about"
				aside={
					<div className="rounded-2xl bg-primary/[0.07] px-4 py-3 text-right ring-1 ring-primary/20">
						<div className="font-semibold text-2xl tabular-nums">
							{picked.size}
						</div>
						<div className="text-muted-foreground text-xs">
							topics kept
						</div>
					</div>
				}
			>
				Found in your recurring subjects. Only the topics you keep sort
				your mail. Click a name to rename it.
			</StepHeader>
			{topics.length === 0 && (
				<p className="text-muted-foreground text-sm">
					No topics found; add them in Brain later.
				</p>
			)}
			<div className="grid gap-3 sm:grid-cols-2">
				{topics.map((t, index) => {
					const keep = picked.has(t.id);
					return (
						<div
							key={t.id}
							className={cn(
								"group relative overflow-hidden rounded-2xl py-4 pr-4 pl-5 ring-1 transition-all",
								keep
									? "bg-card ring-border/70 hover:shadow-md"
									: "bg-muted/40 opacity-55 ring-border/40",
							)}
						>
							<span
								aria-hidden="true"
								className={cn(
									"absolute inset-y-0 left-0 w-1.5",
									dotColor(index),
								)}
							/>
							<div className="flex items-start gap-2">
								<div className="relative min-w-0 flex-1">
									<Input
										className="-ml-2 h-9 border-transparent bg-transparent px-2 pr-8 font-semibold shadow-none hover:border-border focus-visible:border-ring disabled:opacity-100"
										value={names[t.id] ?? t.name}
										aria-label="Topic name"
										disabled={!keep}
										onChange={(event) =>
											setNames((prev) => ({
												...prev,
												[t.id]: event.target.value,
											}))
										}
									/>
									{keep && (
										<Pencil
											aria-hidden="true"
											className="pointer-events-none absolute top-2.5 right-2 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
										/>
									)}
								</div>
								<button
									type="button"
									aria-pressed={keep}
									aria-label={`Keep ${t.name}`}
									onClick={() =>
										setPicked((prev) => toggled(prev, t.id))
									}
									className={cn(
										"mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
										keep
											? "border-primary bg-primary text-primary-foreground"
											: "border-border bg-background text-transparent hover:border-primary/50",
									)}
								>
									<Check
										className="size-3.5"
										strokeWidth={3}
									/>
								</button>
							</div>
							<p className="text-muted-foreground text-xs">
								{t.reason}
							</p>
							<div className="mt-3 flex flex-wrap gap-1.5">
								<Badge variant="secondary">
									{t.threads} {plural(t.threads, "thread")}
								</Badge>
								{t.members > 0 && (
									<Badge variant="secondary">
										{t.members}{" "}
										{plural(t.members, "person").replace(
											"persons",
											"people",
										)}
									</Badge>
								)}
							</div>
						</div>
					);
				})}
			</div>
			{error && <Failure error={error} />}
			<StepActions onBack={() => setTopics(null)}>
				<Next onClick={save} disabled={busy}>
					{busy ? "Saving..." : `Keep ${picked.size} topics`}
				</Next>
			</StepActions>
		</>
	);
}

const LANES = [
	{
		key: "needs_me",
		label: "Needs you",
		hint: "Asks waiting on your reply",
		icon: Zap,
		tone: "primary",
		ink: "text-primary",
	},
	{
		key: "waiting",
		label: "Waiting on others",
		hint: "You asked, they owe you",
		icon: Clock,
		tone: "teal",
		ink: "text-chart-2",
	},
	{
		key: "suggested",
		label: "Might need you",
		hint: "Your call, one tap each",
		icon: Sparkles,
		tone: "amber",
		ink: "text-chart-5",
	},
	{
		key: "fyi",
		label: "For your information",
		hint: "Worth knowing, no action",
		icon: Inbox,
		tone: "slate",
		ink: "text-chart-3",
	},
] as const;

export function WorkStep({ actions, onBack }: StepProps) {
	const { job, error, follow } = useJob(actions, "classify");
	const [startedHere, setStartedHere] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const [starting, setStarting] = useState(false);
	const running = job?.status === "running";
	// a run already going when the page opened counts as this one
	useEffect(() => {
		if (running) setStartedHere(true);
	}, [running]);
	const done = job?.status === "done" && startedHere;
	const summary = useMemo(() => {
		const counts = job?.counts ?? {};
		return {
			topics: (counts.topics ?? {}) as Record<string, number>,
			work: (counts.work ?? {}) as Record<string, number>,
			done: Number(counts.done ?? 0),
			total: Number(counts.total ?? 0),
		};
	}, [job]);

	const start = async () => {
		setStarting(true);
		setStartError(null);
		try {
			follow(await startClassify(actions));
			setStartedHere(true);
		} catch (cause) {
			setStartError(message(cause));
		} finally {
			setStarting(false);
		}
	};

	const finish = () => {
		setLiveData(true);
		window.location.hash = "#/work";
		window.location.reload();
	};

	return (
		<>
			{done ? (
				<div className="flex flex-col items-center gap-3 text-center">
					<span className="zoom-in-50 flex size-16 animate-in items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-lg shadow-primary/30 duration-500">
						<Sparkles className="size-7" aria-hidden="true" />
					</span>
					<p className="font-medium text-primary text-xs uppercase tracking-widest">
						All set
					</p>
					<h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
						Your Work is ready
					</h1>
					<p className="max-w-md text-muted-foreground text-sm">
						{formatCount(summary.topics.filed ?? 0)} threads filed
						under your topics.{" "}
						{summary.topics.asked
							? `${formatCount(summary.topics.asked)} are waiting for you to confirm in Brain.`
							: ""}
					</p>
				</div>
			) : (
				<StepHeader eyebrow="Step 6 of 6" title="Sort your threads">
					Our classifier files every thread under a topic and works
					out whose turn it is. Anything it is unsure about comes to
					you.
				</StepHeader>
			)}
			{running && (
				<div className="flex flex-col items-center gap-3">
					<ProgressRing value={job?.progress ?? 0}>
						<span className="text-muted-foreground text-xs tabular-nums">
							{summary.done} of {summary.total || "..."}
						</span>
					</ProgressRing>
					<p className="text-muted-foreground text-sm">
						Sorting your threads...
					</p>
				</div>
			)}
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{LANES.map((lane) => (
					<StatTile
						key={lane.key}
						label={lane.label}
						value={
							done ? (
								formatCount(summary.work[lane.key] ?? 0)
							) : (
								<lane.icon
									className={cn("size-7", lane.ink)}
									aria-hidden="true"
								/>
							)
						}
						hint={lane.hint}
						tone={lane.tone}
					/>
				))}
			</div>
			{job?.status === "failed" && startedHere && (
				<Failure
					error={job.error || "Sorting stopped."}
					onRetry={start}
				/>
			)}
			{(startError || error) && (
				<Failure error={startError || error || ""} />
			)}
			<StepActions onBack={running || done ? undefined : onBack}>
				{!done && (
					<Button variant="ghost" onClick={finish} disabled={running}>
						Skip for now
					</Button>
				)}
				{!running && !done && (
					<Next onClick={start} disabled={starting || !job}>
						Sort my threads
					</Next>
				)}
				{done && <Next onClick={finish}>Open Work</Next>}
			</StepActions>
		</>
	);
}
