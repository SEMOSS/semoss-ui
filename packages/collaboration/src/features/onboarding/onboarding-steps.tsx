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
import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { Badge, Button, cn, Input, Label, Switch } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { PersonAvatar } from "../collaboration/components/person-avatar";
import {
	type AccountSuggestion,
	type Job,
	type KeepOutSuggestion,
	LOOK_DAYS,
	listPeople,
	type MailboxOverview,
	mailboxOverview,
	markPerson,
	type OnboardingPerson,
	type RuleKind,
	saveAccounts,
	savePeople,
	saveRules,
	saveTopics,
	startClassify,
	startImport,
	startTopicFiling,
	suggestAccounts,
	suggestTopics,
	type TopicSuggestion,
	type TopicSuggestions,
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
	/** "Step 4 of 7", from the shell */
	eyebrow: string;
}

const WINDOWS = [
	{ days: 7, label: "Last week", hint: "A quick look" },
	{ days: 30, label: "Last month", hint: "Recommended" },
];

const plural = (n: number, word: string) =>
	n === 1 ? word : word === "person" ? "people" : `${word}s`;
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

/** Before anything is read: what setup does, and a button to start it. */
export function WelcomeStep({ onStart }: { onStart: () => void }) {
	return (
		<>
			<StepHeader
				eyebrow="Before you start"
				title="Set up with your mail"
			>
				We look at your mailbox, you choose what stays out, then we
				import headers, sort your mail and suggest topics. Nothing is
				read until you start, and nothing is stored until the import
				step.
			</StepHeader>
			<ul className="space-y-2 text-muted-foreground text-sm">
				<li>A first look counts your mail from headers only.</li>
				<li>
					You keep out senders and domains before anything is read.
				</li>
				<li>
					Sorting sets automated mail aside; topics come from the mail
					that is left.
				</li>
			</ul>
			<StepActions>
				<Next onClick={onStart}>Start setup</Next>
			</StepActions>
		</>
	);
}

export function MailboxStep({
	actions,
	eyebrow,
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

	return (
		<>
			<StepHeader eyebrow={eyebrow} title="Here is your mailbox">
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
							label="People you wrote to"
							value={formatCount(overview.wroteTo)}
							hint={`in Sent, last ${LOOK_DAYS} days`}
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
								People who write to you most
							</h2>
							<p className="text-muted-foreground text-xs">
								Colleagues and people you wrote to;
								notifications and receipts are left out.
							</p>
							<ul className="divide-y rounded-2xl ring-1 ring-border/70">
								{senders.map((s) => (
									<li
										key={s.address}
										className="flex items-center gap-3 px-3 py-2"
									>
										<PersonAvatar
											name={s.name || s.address}
											className="size-7"
										/>
										<span className="min-w-0 flex-1 truncate text-sm">
											{s.name || s.address}
										</span>
										{s.youWrote && (
											<span className="shrink-0 text-muted-foreground text-xs">
												you wrote to them
											</span>
										)}
										<span className="w-10 shrink-0 text-right text-sm tabular-nums">
											{formatCount(s.count)}
										</span>
									</li>
								))}
								{senders.length === 0 && (
									<li className="px-3 py-2 text-muted-foreground text-sm">
										No people yet in this window.
									</li>
								)}
							</ul>
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
	eyebrow,
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
				eyebrow={eyebrow}
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
	{ steps: ["reading Teams chats"], label: "Reading Teams chats" },
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
	eyebrow,
	onNext,
	onBack,
	days,
	onManager,
}: StepProps & { days: number; onManager: (id: string) => void }) {
	const { job, error, follow } = useJob(actions, "import");
	const [starting, setStarting] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const [startedHere, setStartedHere] = useState(false);
	const [teams, setTeams] = useState(true);
	const teamsId = useId();
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
			follow(await startImport(actions, days, teams));
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
				eyebrow={eyebrow}
				title={`Bring in the last ${days} days`}
			>
				Inbox and Sent headers, and your Teams chats: who, when, and
				subject. One thread per conversation or chat, no message bodies.
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
					<div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 text-left ring-1 ring-border/70">
						<Switch
							id={teamsId}
							checked={teams}
							onCheckedChange={setTeams}
						/>
						<Label htmlFor={teamsId} className="text-sm">
							Include Teams chats
							<span className="block font-normal text-muted-foreground text-xs">
								1:1, group and meeting chats from the same days
							</span>
						</Label>
					</div>
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
			{active && typeof counts.teamsError === "string" && (
				<p className="rounded-xl bg-warning/10 px-4 py-3 text-sm">
					Teams chats could not be read, so only mail came in. Sign
					out of SEMOSS and back in, then import again. (
					{counts.teamsError})
				</p>
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

// suggested VIPs: the manager plus the strongest few, so there is never just one
const VIP_SUGGESTIONS = 3;

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
	followed,
	manager,
	onVip,
	onFollow,
	featured,
}: {
	person: OnboardingPerson;
	vip: boolean;
	followed: boolean;
	manager: boolean;
	onVip: () => void;
	onFollow: () => void;
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
				!followed && "opacity-55",
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
				{person.follow === "suggested" && person.followReason && (
					<div className="truncate text-muted-foreground text-xs">
						{person.followReason}
					</div>
				)}
				<div
					className={cn("mt-1.5 flex", featured && "justify-center")}
				>
					<StrengthMeter value={person.strength} />
				</div>
			</div>
			<div
				className={cn(
					"flex items-center gap-1",
					featured && "absolute top-2 right-2",
				)}
			>
				<button
					type="button"
					aria-pressed={vip}
					aria-label={`${person.name} is a VIP`}
					onClick={onVip}
					className={cn(
						"rounded-full p-2 transition-all hover:scale-110",
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
			<Button
				variant={followed ? "secondary" : "outline"}
				size="sm"
				aria-pressed={followed}
				disabled={vip}
				onClick={onFollow}
				className={featured ? "w-full" : undefined}
			>
				{followed ? "Following" : "Follow"}
			</Button>
		</div>
	);
}

/** Who you follow: Brain's suggestions from the org chart and two-way mail, VIPs starred among them. */
export function PeopleStep({
	actions,
	eyebrow,
	onNext,
	onBack,
	selfEmail,
	managerId,
}: StepProps & { selfEmail: string; managerId: string }) {
	const [people, setPeople] = useState<OnboardingPerson[] | null>(null);
	const [followed, setFollowed] = useState<Set<string>>(new Set());
	const [vips, setVips] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [showAll, setShowAll] = useState(false);
	// automated and list senders: never followed or starred, one tap makes one a person
	const [automated, setAutomated] = useState<OnboardingPerson[]>([]);
	const [showAutomated, setShowAutomated] = useState(false);
	// follow someone Brain did not suggest
	const [query, setQuery] = useState("");
	const [found, setFound] = useState<OnboardingPerson[]>([]);
	useEffect(() => {
		const self = selfEmail.toLowerCase();
		const mine = (p: OnboardingPerson) =>
			p.email.toLowerCase() !== self && !p.automated;
		Promise.all([
			listPeople(actions, { follow: "following" }),
			listPeople(actions, { follow: "suggested" }),
			listPeople(actions, { relationship: "automated" }),
		])
			.then(async ([following, suggested, bots]) => {
				let list = [...following, ...suggested].filter(mine);
				// data from before follow suggestions: the strongest contacts instead
				if (!list.length)
					list = (await listPeople(actions))
						.filter(mine)
						.slice(0, 24);
				list.sort((a, b) => b.strength - a.strength);
				setPeople(list);
				setAutomated(bots);
				setFollowed(
					new Set(
						list
							.filter((p) => p.follow !== "declined")
							.map((p) => p.id),
					),
				);
				const chosen = list.filter((p) => p.vip).map((p) => p.id);
				// nobody starred yet: suggest the manager and the strongest contacts
				if (!chosen.length) {
					if (managerId && list.some((p) => p.id === managerId))
						chosen.push(managerId);
					let strongest = 0;
					for (const p of list)
						if (
							strongest < VIP_SUGGESTIONS &&
							p.strength > 0 &&
							!chosen.includes(p.id)
						) {
							chosen.push(p.id);
							strongest++;
						}
				}
				setVips(new Set(chosen));
			})
			.catch((cause: unknown) => setError(message(cause)));
	}, [actions, selfEmail, managerId]);

	useEffect(() => {
		const q = query.trim();
		if (q.length < 2) {
			setFound([]);
			return;
		}
		const timer = setTimeout(() => {
			listPeople(actions, { query: q })
				.then((list) =>
					setFound(
						list.filter(
							(p) =>
								!p.automated &&
								p.email.toLowerCase() !==
									selfEmail.toLowerCase() &&
								!people?.some((known) => known.id === p.id),
						),
					),
				)
				.catch(() => setFound([]));
		}, 250);
		return () => clearTimeout(timer);
	}, [actions, query, people, selfEmail]);

	const add = (person: OnboardingPerson) => {
		setPeople((prev) => [...(prev ?? []), person]);
		setFollowed((prev) => new Set(prev).add(person.id));
		setFound((prev) => prev.filter((p) => p.id !== person.id));
	};

	const rescue = async (person: OnboardingPerson) => {
		setError(null);
		try {
			const mine = selfEmail.split("@")[1]?.toLowerCase();
			await markPerson(
				actions,
				person.id,
				mine && person.email.toLowerCase().endsWith(`@${mine}`)
					? "colleague"
					: "external",
			);
			setAutomated((prev) => prev.filter((p) => p.id !== person.id));
			add({ ...person, automated: false });
		} catch (cause) {
			setError(message(cause));
		}
	};

	const save = async () => {
		if (!people) return;
		setSaving(true);
		setError(null);
		try {
			const changes: {
				id: string;
				vip?: boolean;
				follow?: string | null;
			}[] = [];
			for (const p of people) {
				const vip = vips.has(p.id);
				// unfollowing a suggestion declines it, so Brain does not suggest it again
				const follow =
					vip || followed.has(p.id)
						? "following"
						: p.follow === "suggested" || p.follow === "following"
							? "declined"
							: p.follow;
				const change: {
					id: string;
					vip?: boolean;
					follow?: string | null;
				} = { id: p.id };
				if (vip !== p.vip) change.vip = vip;
				if (follow !== p.follow) change.follow = follow;
				if (Object.keys(change).length > 1) changes.push(change);
			}
			await savePeople(actions, changes);
			onNext();
		} catch (cause) {
			setError(message(cause));
		} finally {
			setSaving(false);
		}
	};

	const card = (p: OnboardingPerson, featured?: boolean) => (
		<PersonCard
			person={p}
			vip={vips.has(p.id)}
			followed={followed.has(p.id) || vips.has(p.id)}
			manager={p.id === managerId}
			onVip={() => {
				setVips((prev) => toggled(prev, p.id));
				setFollowed((prev) => new Set(prev).add(p.id));
			}}
			onFollow={() => setFollowed((prev) => toggled(prev, p.id))}
			featured={featured}
		/>
	);
	const following = new Set([...followed, ...vips]).size;

	return (
		<>
			<StepHeader
				eyebrow={eyebrow}
				title="Who you follow"
				aside={
					<div className="flex items-center gap-2 rounded-full bg-chart-4/15 px-3 py-1.5 font-medium text-sm">
						<Star
							className="size-4 fill-chart-4 text-chart-4"
							aria-hidden="true"
						/>
						{following} following - {vips.size} VIPs
					</div>
				}
			>
				Your people, from your org chart and the mail you trade both
				ways. Following someone ranks their asks above other mail in
				Work; star a VIP and their asks go to the top. Mail from people
				you do not follow still shows up, it is just not moved up. The
				bars show how much you write to each other.
			</StepHeader>
			{!people && !error && (
				<LoadingCards label="Finding your people..." count={6} />
			)}
			{people && people.length === 0 && (
				<p className="text-muted-foreground text-sm">
					No one yet; import first, or search below.
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
								<li key={p.id}>{card(p, true)}</li>
							))}
						</ul>
					</section>
					{people.length > 4 && (
						<section className="space-y-3">
							<h2 className="font-medium text-sm">
								Also suggested
							</h2>
							<ul className="grid gap-2 sm:grid-cols-2">
								{people
									.slice(4, showAll ? undefined : 14)
									.map((p) => (
										<li key={p.id}>{card(p)}</li>
									))}
							</ul>
							{!showAll && people.length > 14 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowAll(true)}
								>
									Show {people.length - 14} more
								</Button>
							)}
						</section>
					)}
				</>
			)}
			<section className="space-y-2">
				<h2 className="font-medium text-sm">Follow someone else</h2>
				<Input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search by name or email"
					aria-label="Search people to follow"
					className="max-w-sm"
				/>
				{found.length > 0 && (
					<ul className="grid gap-2 sm:grid-cols-2">
						{found.map((p) => (
							<li
								key={p.id}
								className="flex items-center gap-3 rounded-2xl p-2.5 ring-1 ring-border/70"
							>
								<PersonAvatar
									name={p.name}
									className="size-9"
								/>
								<div className="min-w-0 flex-1">
									<div className="truncate font-medium text-sm">
										{p.name}
									</div>
									<div className="truncate text-muted-foreground text-xs">
										{p.title || p.email}
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => add(p)}
								>
									Follow
								</Button>
							</li>
						))}
					</ul>
				)}
			</section>
			{automated.length > 0 && (
				<section className="space-y-3">
					<Button
						variant="ghost"
						size="sm"
						className="-ml-3 text-muted-foreground"
						aria-expanded={showAutomated}
						onClick={() => setShowAutomated((value) => !value)}
					>
						<Bot className="size-4" aria-hidden="true" />
						Automated and list senders ({automated.length})
					</Button>
					{showAutomated && (
						<>
							<p className="text-muted-foreground text-xs">
								Shared mailboxes, lists, and system senders.
								Never followed, and left out of topics and Work.
								Mark anyone who is really a person.
							</p>
							<ul className="grid gap-2 sm:grid-cols-2">
								{automated.map((p) => (
									<li
										key={p.id}
										className="flex items-center gap-3 rounded-2xl p-2.5 ring-1 ring-border/70"
									>
										<PersonAvatar
											name={p.name}
											className="size-9"
										/>
										<div className="min-w-0 flex-1">
											<div className="truncate font-medium text-sm">
												{p.name}
											</div>
											<div className="truncate text-muted-foreground text-xs">
												{p.title || p.email}
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => void rescue(p)}
										>
											A person
										</Button>
									</li>
								))}
							</ul>
						</>
					)}
				</section>
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

function AccountCard({
	account,
	index,
	selected,
	onToggle,
}: {
	account: AccountSuggestion;
	index: number;
	selected: boolean;
	onToggle: () => void;
}) {
	return (
		<SelectCard
			label={`Keep ${account.name}`}
			selected={selected}
			onToggle={onToggle}
		>
			<span
				className={cn(
					"flex size-10 shrink-0 items-center justify-center rounded-xl font-semibold text-sm text-white",
					dotColor(index),
				)}
			>
				{account.name.slice(0, 1).toUpperCase() || (
					<Building2 className="size-4" aria-hidden="true" />
				)}
			</span>
			<span className="min-w-0">
				<span
					className="block break-words font-medium"
					title={account.name}
				>
					{account.name}
				</span>
				<span
					className="block break-all text-muted-foreground text-xs"
					title={account.domain}
				>
					{account.domain}
				</span>
				<span className="mt-1 block text-muted-foreground text-xs">
					{account.people} {plural(account.people, "person")} -{" "}
					{account.threads} {plural(account.threads, "thread")}
					{account.twoWayThreads > 0 &&
						` - you wrote on ${account.twoWayThreads}`}
				</span>
			</span>
		</SelectCard>
	);
}

/** Outside organisations by email domain; your own organisation's domains are left out by the server. */
export function OutsideStep({ actions, onNext, onBack, eyebrow }: StepProps) {
	const [accounts, setAccounts] = useState<AccountSuggestion[] | null>(null);
	const [picked, setPicked] = useState<Set<string>>(new Set());
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		suggestAccounts(actions)
			.then((list) => {
				setAccounts(list);
				setPicked(
					new Set(
						list.filter((a) => a.suggested).map((a) => a.domain),
					),
				);
			})
			.catch((cause: unknown) => setError(message(cause)));
	}, [actions]);

	const save = async () => {
		if (!accounts) return;
		setBusy(true);
		setError(null);
		try {
			await saveAccounts(
				actions,
				accounts.filter((a) => picked.has(a.domain)),
			);
			onNext();
		} catch (cause) {
			setError(message(cause));
		} finally {
			setBusy(false);
		}
	};

	const strong = accounts?.filter((a) => a.suggested) ?? [];
	const weak = accounts?.filter((a) => !a.suggested) ?? [];
	const card = (a: AccountSuggestion, index: number) => (
		<AccountCard
			key={a.domain}
			account={a}
			index={index}
			selected={picked.has(a.domain)}
			onToggle={() => setPicked((prev) => toggled(prev, a.domain))}
		/>
	);
	return (
		<>
			<StepHeader eyebrow={eyebrow} title="Who you work with outside">
				Clients and partners, found by email domain. Ticked are the ones
				you wrote to or have a VIP at; tick any other that is real work.
			</StepHeader>
			{!accounts && !error && (
				<LoadingCards label="Finding organisations..." />
			)}
			{accounts && accounts.length === 0 && (
				<p className="text-muted-foreground text-sm">
					No outside organisations found.
				</p>
			)}
			{strong.length > 0 && (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{strong.map(card)}
				</div>
			)}
			{weak.length > 0 && (
				<section className="space-y-3">
					<h2 className="font-medium text-sm">Also seen</h2>
					<p className="text-muted-foreground text-xs">
						You have not written to anyone here. Keep any that are
						real work.
					</p>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{weak.map((a, i) => card(a, strong.length + i))}
					</div>
				</section>
			)}
			{error && <Failure error={error} />}
			<StepActions onBack={onBack}>
				<Next onClick={save} disabled={busy || !accounts}>
					{busy ? "Saving..." : `Keep ${picked.size} and continue`}
				</Next>
			</StepActions>
		</>
	);
}

function TopicCard({
	topic,
	index,
	keep,
	name,
	about,
	removed,
	onName,
	onAbout,
	onRemovePerson,
	onToggle,
}: {
	topic: TopicSuggestion;
	index: number;
	keep: boolean;
	name: string;
	about: string;
	removed: Set<string>;
	onName: (value: string) => void;
	onAbout: (value: string) => void;
	onRemovePerson: (personId: string) => void;
	onToggle: () => void;
}) {
	const people = topic.people.filter((p) => !removed.has(p.id));
	return (
		<div
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
						value={name}
						placeholder="Topic name"
						aria-label="Topic name"
						disabled={!keep}
						onChange={(event) => onName(event.target.value)}
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
					aria-label={`Keep ${topic.name || "new topic"}`}
					onClick={onToggle}
					className={cn(
						"mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
						keep
							? "border-primary bg-primary text-primary-foreground"
							: "border-border bg-background text-transparent hover:border-primary/50",
					)}
				>
					<Check className="size-3.5" strokeWidth={3} />
				</button>
			</div>
			<Input
				className="-ml-2 h-8 border-transparent bg-transparent px-2 text-muted-foreground text-sm shadow-none hover:border-border focus-visible:border-ring disabled:opacity-100"
				value={about}
				placeholder="What this topic covers"
				aria-label="What this topic covers"
				disabled={!keep}
				onChange={(event) => onAbout(event.target.value)}
			/>
			{topic.reason && (
				<p className="text-muted-foreground text-xs">{topic.reason}</p>
			)}
			{topic.sampleSubjects.length > 0 && (
				<ul className="mt-2 space-y-0.5 text-xs">
					{topic.sampleSubjects.map((subject) => (
						<li key={subject} className="truncate">
							{subject}
						</li>
					))}
				</ul>
			)}
			{(people.length > 0 || topic.domains.length > 0) && (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{people.map((p) => (
						<Badge
							key={p.id}
							variant="outline"
							className="gap-1 pr-1"
						>
							{p.name}
							{keep && (
								<button
									type="button"
									aria-label={`Remove ${p.name}`}
									onClick={() => onRemovePerson(p.id)}
									className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									<X className="size-3" />
								</button>
							)}
						</Badge>
					))}
					{topic.domains.map((d) => (
						<Badge key={d} variant="outline" className="gap-1">
							<Globe className="size-3" aria-hidden="true" />
							{d}
						</Badge>
					))}
				</div>
			)}
			<div className="mt-3 flex flex-wrap gap-1.5">
				{topic.threads > 0 ? (
					<Badge variant="secondary">
						{topic.threads} {plural(topic.threads, "thread")}
					</Badge>
				) : (
					<Badge variant="secondary">added by you</Badge>
				)}
				{topic.youWrote > 0 && (
					<Badge variant="secondary">
						you wrote on {topic.youWrote}
					</Badge>
				)}
				{topic.vipThreads > 0 && (
					<Badge variant="secondary">
						VIPs on {topic.vipThreads}
					</Badge>
				)}
			</div>
		</div>
	);
}

const ADDED = "added-";

function addedTopic(n: number): TopicSuggestion {
	return {
		id: `${ADDED}${n}`,
		name: "",
		kind: "",
		accountId: "",
		reason: "",
		threads: 0,
		members: 0,
		sampleSubjects: [],
		youWrote: 0,
		vipThreads: 0,
		suggested: true,
		about: "",
		people: [],
		domains: [],
	};
}

/**
 * Topics from the mail the sort kept: the ones you took part in, or with a VIP, are kept by default and the rest sit
 * under Maybe. Rename, describe, take people off, or add your own; the next step files your mail under them.
 */
export function TopicsStep({ actions, onNext, onBack, eyebrow }: StepProps) {
	const [result, setResult] = useState<TopicSuggestions | null>(null);
	const [added, setAdded] = useState<TopicSuggestion[]>([]);
	const [picked, setPicked] = useState<Set<string>>(new Set());
	const [names, setNames] = useState<Record<string, string>>({});
	const [abouts, setAbouts] = useState<Record<string, string>>({});
	const [removed, setRemoved] = useState<Record<string, Set<string>>>({});
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		let isCurrent = true;
		setResult(null);
		setAdded([]);
		setPicked(new Set());
		setNames({});
		setAbouts({});
		setRemoved({});
		setError(null);
		suggestTopics(actions)
			.then((suggestions) => {
				if (!isCurrent) return;
				setResult(suggestions);
				setPicked(
					new Set(
						suggestions.topics
							.filter((t) => t.suggested)
							.map((t) => t.id),
					),
				);
				setNames(
					Object.fromEntries(
						suggestions.topics.map((t) => [t.id, t.name]),
					),
				);
				setAbouts(
					Object.fromEntries(
						suggestions.topics.map((t) => [t.id, t.about]),
					),
				);
			})
			.catch((cause: unknown) => {
				if (isCurrent) setError(message(cause));
			});
		return () => {
			isCurrent = false;
		};
	}, [actions]);
	const topics = result?.topics ?? null;

	// kept-by-default topics first, in the server's order, then yours; the rest under Maybe
	const groups = useMemo(() => {
		const kept = (topics ?? []).filter((t) => t.suggested);
		const maybe = (topics ?? []).filter((t) => !t.suggested);
		return [
			{ label: "", topics: [...kept, ...added] },
			{ label: "Maybe", topics: maybe },
		].filter((g) => g.topics.length > 0);
	}, [topics, added]);

	const addTopic = () => {
		const topic = addedTopic(added.length + 1);
		setAdded((prev) => [...prev, topic]);
		setPicked((prev) => new Set(prev).add(topic.id));
	};

	const save = async () => {
		if (!topics) return;
		setBusy(true);
		setError(null);
		try {
			const all = [...topics, ...added];
			const accepted = all
				.filter(
					(t) => picked.has(t.id) && (names[t.id] ?? t.name).trim(),
				)
				.map((t) => {
					const about = (abouts[t.id] ?? t.about).trim();
					const mine = t.id.startsWith(ADDED);
					return {
						...(mine ? {} : { id: t.id }),
						name: (names[t.id] ?? t.name).trim(),
						...((mine && about) || (!mine && about !== t.about)
							? { description: about }
							: {}),
						...(removed[t.id]?.size
							? { removedPeople: [...removed[t.id]] }
							: {}),
					};
				});
			await saveTopics(
				actions,
				accepted,
				topics.filter((t) => !picked.has(t.id)).map((t) => t.id),
			);
			if (accepted.length > 0) await startTopicFiling(actions);
			onNext();
		} catch (cause) {
			setError(message(cause));
		} finally {
			setBusy(false);
		}
	};

	let index = 0;
	return (
		<>
			<StepHeader
				eyebrow={eyebrow}
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
				Grouped from the mail we sorted, headers only. Keep the topics
				that are real work, fix their names and what they cover, take
				off anyone who does not belong, or add your own. Your mail is
				filed under the ones you keep.
			</StepHeader>
			{!topics && !error && (
				<LoadingCards label="Finding topics in your mail..." />
			)}
			{result?.modelError && (
				<p className="text-muted-foreground text-sm">
					No topics were suggested because the topic model is not
					available ({result.modelError}). You can add topics below or
					in Brain later.
				</p>
			)}
			{topics && topics.length === 0 && !result?.modelError && (
				<p className="text-muted-foreground text-sm">
					No topics found; add your own below or in Brain later.
				</p>
			)}
			{groups.map((group) => (
				<section key={group.label} className="space-y-3">
					{group.label && (
						<h2 className="font-medium text-sm">{group.label}</h2>
					)}
					{group.label === "Maybe" && (
						<p className="text-muted-foreground text-xs">
							You have not written on these. Keep any that are
							real work.
						</p>
					)}
					<div className="grid gap-3 sm:grid-cols-2">
						{group.topics.map((t) => (
							<TopicCard
								key={t.id}
								topic={t}
								index={index++}
								keep={picked.has(t.id)}
								name={names[t.id] ?? t.name}
								about={abouts[t.id] ?? t.about}
								removed={removed[t.id] ?? new Set()}
								onName={(value) =>
									setNames((prev) => ({
										...prev,
										[t.id]: value,
									}))
								}
								onAbout={(value) =>
									setAbouts((prev) => ({
										...prev,
										[t.id]: value,
									}))
								}
								onRemovePerson={(personId) =>
									setRemoved((prev) => ({
										...prev,
										[t.id]: new Set(prev[t.id]).add(
											personId,
										),
									}))
								}
								onToggle={() =>
									setPicked((prev) => toggled(prev, t.id))
								}
							/>
						))}
					</div>
				</section>
			))}
			{topics && (
				<button
					type="button"
					onClick={addTopic}
					className="flex items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-muted-foreground text-sm transition-colors hover:border-primary/50 hover:text-foreground"
				>
					<Plus className="size-4" aria-hidden="true" />
					Add a topic
				</button>
			)}
			{error && <Failure error={error} />}
			<StepActions onBack={onBack}>
				<Next onClick={save} disabled={busy || !topics}>
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

export function WorkStep({ actions, onNext, onBack, eyebrow }: StepProps) {
	const { job, error, follow } = useJob(actions, "classify");
	const [startedHere, setStartedHere] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const [starting, setStarting] = useState(false);
	const running = job?.status === "running";
	// a run already going when the page opened counts as this one
	useEffect(() => {
		if (running) setStartedHere(true);
	}, [running]);
	// the sort itself, not the topic filing that may come after it
	const done = job?.status === "done" && job.mode !== "topics" && startedHere;
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
						Sorted
					</p>
					<h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
						Your mail is sorted
					</h1>
					<p className="max-w-md text-muted-foreground text-sm">
						{formatCount(summary.work.automated ?? 0)} automated
						threads set aside. Next, pick the topics your work is
						about from the mail that is left.
					</p>
				</div>
			) : (
				<StepHeader eyebrow={eyebrow} title="Sort your threads">
					Our classifier sets automated mail aside and works out whose
					turn it is on the rest. Anything it is unsure about comes to
					you. Topics come next, from the mail that is left.
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
				{done && <Next onClick={onNext}>Pick your topics</Next>}
			</StepActions>
		</>
	);
}

/** Last step: the kept topics file the sorted mail, then Work opens. */
export function FilingStep({ actions, onBack, eyebrow }: StepProps) {
	const { job, error } = useJob(actions, "classify");
	const filing = job?.mode === "topics";
	const running = filing && job?.status === "running";
	const topics = (filing ? (job?.counts.topics ?? {}) : {}) as Record<
		string,
		number
	>;
	const finish = () => {
		window.location.hash = "#/work";
		window.location.reload();
	};
	return (
		<>
			{running ? (
				<>
					<StepHeader eyebrow={eyebrow} title="Filing your mail">
						Each sorted thread is matched to the topics you kept.
					</StepHeader>
					<div className="flex flex-col items-center gap-3">
						<ProgressRing value={job?.progress ?? 0}>
							<span className="text-muted-foreground text-xs tabular-nums">
								{Number(job?.counts.done ?? 0)} of{" "}
								{Number(job?.counts.total ?? 0) || "..."}
							</span>
						</ProgressRing>
					</div>
				</>
			) : (
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
					{filing && job?.status === "done" && (
						<p className="max-w-md text-muted-foreground text-sm">
							{formatCount(topics.filed ?? 0)} threads filed under
							your topics.{" "}
							{topics.asked
								? `${formatCount(topics.asked)} are waiting for you to confirm in Brain.`
								: ""}
						</p>
					)}
				</div>
			)}
			{filing && job?.status === "failed" && (
				<Failure error={job.error || "Filing stopped."} />
			)}
			{error && <Failure error={error} />}
			<StepActions onBack={running ? undefined : onBack}>
				<Next onClick={finish} disabled={running}>
					Open Work
				</Next>
			</StepActions>
		</>
	);
}
