import { Check } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Checkbox,
	cn,
	H1,
	Input,
	Muted,
	P,
	Progress,
	Spinner,
	Switch,
} from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { setLiveData } from "../collaboration/live/live-state";
import {
	type AccountSuggestion,
	type Job,
	type KeepOutSuggestion,
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
import { useJob } from "./use-job";

const STEPS = [
	"Your mailbox",
	"Keep out",
	"Import",
	"People",
	"Topics",
	"Work",
];
const WINDOWS = [7, 30, 90];

const message = (cause: unknown) =>
	cause instanceof Error ? cause.message : String(cause);

/** First run with real mail: look, keep out, import headers, people, topics, then sort into Work. */
export function Onboarding() {
	const { actions } = useInsight();
	const [step, setStep] = useState(0);
	const [days, setDays] = useState(30);
	const [overview, setOverview] = useState<MailboxOverview | null>(null);
	const [managerId, setManagerId] = useState("");
	const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

	return (
		<div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-4 md:p-8">
			<header className="space-y-2">
				<span className="font-bold text-lg tracking-tight">
					collaboration<span className="text-primary">.</span>
				</span>
				<H1 className="font-semibold text-xl">Set up with your mail</H1>
				<P className="text-muted-foreground">
					Headers first: nothing is read past who, when, and subject
					until your keep-out rules are saved.
				</P>
			</header>
			<ol className="flex flex-wrap gap-2" aria-label="Setup steps">
				{STEPS.map((label, index) => (
					<li
						key={label}
						aria-current={index === step ? "step" : undefined}
						className={cn(
							"flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
							index === step && "border-primary text-foreground",
							index !== step && "text-muted-foreground",
						)}
					>
						{index < step ? (
							<Check className="size-3.5" aria-hidden="true" />
						) : (
							<span className="text-xs">{index + 1}</span>
						)}
						{label}
					</li>
				))}
			</ol>
			<main className="space-y-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50 md:p-6">
				{step === 0 && (
					<MailboxStep
						actions={actions}
						days={days}
						onDays={setDays}
						onLoaded={setOverview}
						onNext={next}
					/>
				)}
				{step === 1 && (
					<KeepOutStep
						actions={actions}
						suggestions={overview?.keepOut ?? []}
						onNext={next}
					/>
				)}
				{step === 2 && (
					<ImportStep
						actions={actions}
						days={days}
						onManager={setManagerId}
						onNext={next}
					/>
				)}
				{step === 3 && (
					<PeopleStep
						actions={actions}
						selfEmail={overview?.address ?? ""}
						managerId={managerId}
						onNext={next}
					/>
				)}
				{step === 4 && <TopicsStep actions={actions} onNext={next} />}
				{step === 5 && <WorkStep actions={actions} />}
			</main>
			{step > 0 && step < 5 && (
				<div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setStep((s) => s - 1)}
					>
						Back
					</Button>
				</div>
			)}
		</div>
	);
}

function StepHeader({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<div className="space-y-1">
			<h2 className="font-medium text-base">{title}</h2>
			<Muted>{children}</Muted>
		</div>
	);
}

function Failure({ error, onRetry }: { error: string; onRetry?: () => void }) {
	return (
		<Alert variant="destructive">
			<AlertDescription className="flex items-center justify-between gap-2">
				<span>{error}</span>
				{onRetry && (
					<Button size="sm" variant="outline" onClick={onRetry}>
						Retry
					</Button>
				)}
			</AlertDescription>
		</Alert>
	);
}

function Loading({ children }: { children: ReactNode }) {
	return (
		<div className="flex items-center gap-2 text-muted-foreground text-sm">
			<Spinner /> {children}
		</div>
	);
}

function MailboxStep({
	actions,
	days,
	onDays,
	onLoaded,
	onNext,
}: {
	actions: InsightActions;
	days: number;
	onDays: (days: number) => void;
	onLoaded: (overview: MailboxOverview) => void;
	onNext: () => void;
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

	return (
		<>
			<StepHeader title="Your mailbox">
				Counts and top senders from message headers. Nothing is stored
				yet.
			</StepHeader>
			{error && (
				<Failure
					error={error}
					onRetry={() => setAttempt((a) => a + 1)}
				/>
			)}
			{!overview && !error && (
				<Loading>Reading your mailbox headers...</Loading>
			)}
			{overview && (
				<>
					<P>
						<span className="font-medium">
							{overview.name || overview.address}
						</span>{" "}
						<span className="text-muted-foreground">
							{overview.address}
						</span>
					</P>
					<table className="w-full max-w-md text-sm">
						<thead>
							<tr className="text-left text-muted-foreground">
								<th className="font-normal">Messages</th>
								{WINDOWS.map((w) => (
									<th
										key={w}
										className="text-right font-normal"
									>
										{w} days
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{(
								[
									["Inbox", overview.counts.inbox],
									["Sent", overview.counts.sent],
								] as const
							).map(([label, counts]) => (
								<tr key={label}>
									<td>{label}</td>
									{WINDOWS.map((w) => (
										<td
											key={w}
											className="text-right tabular-nums"
										>
											{counts[String(w)] ?? 0}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
					{overview.topSenders.length > 0 && (
						<div className="space-y-1">
							<Muted>Top senders</Muted>
							<ul className="grid gap-x-6 gap-y-0.5 text-sm sm:grid-cols-2">
								{overview.topSenders.slice(0, 10).map((s) => (
									<li
										key={s.address}
										className="flex justify-between gap-2"
									>
										<span className="truncate">
											{s.name || s.address}
										</span>
										<span className="text-muted-foreground tabular-nums">
											{s.count}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}
					<div className="space-y-2">
						<Muted>How far back to import</Muted>
						<div className="flex gap-2">
							{WINDOWS.map((w) => (
								<Button
									key={w}
									size="sm"
									variant={w === days ? "default" : "outline"}
									aria-pressed={w === days}
									onClick={() => onDays(w)}
								>
									{w} days
								</Button>
							))}
						</div>
					</div>
					{lastImport?.status === "done" && (
						<Muted>
							Imported before on{" "}
							{new Date(lastImport.finishedAt).toLocaleString()}.
							Importing again only adds new mail.
						</Muted>
					)}
					<Button onClick={onNext}>Continue</Button>
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

function KeepOutStep({
	actions,
	suggestions,
	onNext,
}: {
	actions: InsightActions;
	suggestions: KeepOutSuggestion[];
	onNext: () => void;
}) {
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

	const toggle = (key: string, on: boolean) =>
		setChecked((prev) => {
			const nextSet = new Set(prev);
			if (on) nextSet.add(key);
			else nextSet.delete(key);
			return nextSet;
		});

	const save = async () => {
		setSaving(true);
		setError(null);
		try {
			await saveRules(actions, [
				...suggestions
					.filter((s) => !s.alreadyKeptOut && checked.has(s.value))
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
			<StepHeader title="Keep out first">
				Mail from these is never imported, read, or sent to a model.
				Suggested from automated and bulk senders; untick any you want
				kept.
			</StepHeader>
			{suggestions.length === 0 && (
				<Muted>No suggestions for this mailbox.</Muted>
			)}
			<ul className="space-y-2">
				{suggestions.map((s) => (
					<li
						key={s.value}
						className="flex items-start gap-3 text-sm"
					>
						<Checkbox
							id={`keep-${s.value}`}
							className="mt-0.5"
							checked={s.alreadyKeptOut || checked.has(s.value)}
							disabled={s.alreadyKeptOut}
							onCheckedChange={(on) =>
								toggle(s.value, on === true)
							}
						/>
						<label
							htmlFor={`keep-${s.value}`}
							className="space-y-0.5"
						>
							<span className="block">
								{s.name && s.name !== s.value
									? `${s.name} `
									: ""}
								<span className="text-muted-foreground">
									{s.value}
								</span>
								{s.kind === "never_domain" && (
									<Badge variant="outline" className="ml-2">
										domain
									</Badge>
								)}
							</span>
							<Muted className="block">
								{s.alreadyKeptOut
									? "Already kept out"
									: `${s.reason} (${s.count} messages)`}
							</Muted>
						</label>
					</li>
				))}
				{added.map((a) => (
					<li
						key={`${a.kind}:${a.value}`}
						className="flex items-center gap-3 text-sm"
					>
						<Checkbox checked disabled className="mt-0.5" />
						<span>
							{a.value}{" "}
							<Badge variant="outline">
								{KINDS.find((k) => k.kind === a.kind)?.label}
							</Badge>
						</span>
						<Button
							size="sm"
							variant="ghost"
							onClick={() =>
								setAdded((list) => list.filter((x) => x !== a))
							}
						>
							Remove
						</Button>
					</li>
				))}
			</ul>
			<form
				className="flex flex-wrap items-center gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					const text = value.trim().toLowerCase();
					if (!text || (kind === "never_keyword" && text.length < 3))
						return;
					setAdded((list) => [...list, { kind, value: text }]);
					setValue("");
				}}
			>
				<div className="flex gap-1">
					{KINDS.map((k) => (
						<Button
							key={k.kind}
							type="button"
							size="sm"
							variant={k.kind === kind ? "default" : "outline"}
							aria-pressed={k.kind === kind}
							onClick={() => setKind(k.kind)}
						>
							{k.label}
						</Button>
					))}
				</div>
				<Input
					className="h-8 max-w-64"
					value={value}
					placeholder={KINDS.find((k) => k.kind === kind)?.hint}
					aria-label="Add to keep out"
					onChange={(event) => setValue(event.target.value)}
				/>
				<Button type="submit" size="sm" variant="outline">
					Add
				</Button>
			</form>
			{error && <Failure error={error} />}
			<Button onClick={save} disabled={saving}>
				{saving ? "Saving..." : "Save and continue"}
			</Button>
		</>
	);
}

function JobProgress({
	job,
	labels,
}: {
	job: Job;
	labels: [string, string][];
}) {
	return (
		<div className="space-y-2">
			<Progress value={job.status === "done" ? 100 : job.progress} />
			<Muted>
				{job.status === "done" ? "Done" : job.step || "Starting"}
			</Muted>
			<dl className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-sm sm:grid-cols-3">
				{labels
					.filter(([key]) => job.counts[key] !== undefined)
					.map(([key, label]) => (
						<div key={key} className="flex justify-between gap-2">
							<dt className="text-muted-foreground">{label}</dt>
							<dd className="tabular-nums">
								{Number(job.counts[key])}
							</dd>
						</div>
					))}
			</dl>
		</div>
	);
}

function ImportStep({
	actions,
	days,
	onManager,
	onNext,
}: {
	actions: InsightActions;
	days: number;
	onManager: (id: string) => void;
	onNext: () => void;
}) {
	const { job, error, follow } = useJob(actions, "import");
	const [starting, setStarting] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const [startedHere, setStartedHere] = useState(false);
	const manager = String(job?.counts.managerPersonId ?? "");
	useEffect(() => {
		if (manager) onManager(manager);
	}, [manager, onManager]);

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

	const running = job?.status === "running";
	const done = job?.status === "done";
	useEffect(() => {
		if (running) setStartedHere(true);
	}, [running]);
	return (
		<>
			<StepHeader title="Import">
				Inbox and Sent headers for the last {days} days: people, one
				thread per conversation, and who was on each message. No message
				bodies.
			</StepHeader>
			{!job && !error && (
				<Loading>Checking for an earlier import...</Loading>
			)}
			{job && job.status !== "none" && (
				<JobProgress
					job={job}
					labels={[
						["messages", "Messages"],
						["imported", "Imported"],
						["alreadyImported", "Already imported"],
						["keptOut", "Kept out"],
						["threads", "Threads"],
						["newPeople", "New people"],
					]}
				/>
			)}
			{job?.status === "failed" && (
				<Failure error={job.error || "The import stopped."} />
			)}
			{(startError || error) && (
				<Failure error={startError || error || ""} />
			)}
			<div className="flex gap-2">
				{!running && (!done || !startedHere) && (
					<Button onClick={start} disabled={starting || !job}>
						{done
							? `Import again (${days} days)`
							: `Import ${days} days`}
					</Button>
				)}
				{done && (
					<Button
						variant={startedHere ? "default" : "outline"}
						onClick={onNext}
					>
						Continue
					</Button>
				)}
			</div>
		</>
	);
}

function PeopleStep({
	actions,
	selfEmail,
	managerId,
	onNext,
}: {
	actions: InsightActions;
	selfEmail: string;
	managerId: string;
	onNext: () => void;
}) {
	const [people, setPeople] = useState<OnboardingPerson[] | null>(null);
	const [vips, setVips] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	useEffect(() => {
		listPeople(actions)
			.then((all) => {
				const self = selfEmail.toLowerCase();
				const list = all
					.filter((p) => p.email.toLowerCase() !== self)
					.slice(0, 25);
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
			<StepHeader title="People">
				Ranked by how much you write to each other. VIPs rank higher in
				Work.
			</StepHeader>
			{!people && !error && <Loading>Ranking people...</Loading>}
			{people && people.length === 0 && (
				<Muted>No people yet; import first.</Muted>
			)}
			{people && people.length > 0 && (
				<ul className="divide-y">
					{people.map((p) => (
						<li
							key={p.id}
							className="flex items-center gap-3 py-2 text-sm"
						>
							<div className="min-w-0 flex-1">
								<span className="block truncate">
									{p.name}
									{p.id === managerId && (
										<Badge
											variant="outline"
											className="ml-2"
										>
											your manager
										</Badge>
									)}
								</span>
								<Muted className="block truncate">
									{[p.title, p.relationship, p.email]
										.filter(Boolean)
										.join(" - ")}
								</Muted>
							</div>
							<div
								className="hidden w-24 sm:block"
								title={`Strength ${p.strength}`}
							>
								<Progress value={p.strength} />
							</div>
							<div className="flex items-center gap-2">
								<span
									aria-hidden="true"
									className="text-muted-foreground text-xs"
								>
									VIP
								</span>
								<Switch
									checked={vips.has(p.id)}
									aria-label={`${p.name} is a VIP`}
									onCheckedChange={(on) =>
										setVips((prev) => {
											const nextSet = new Set(prev);
											if (on) nextSet.add(p.id);
											else nextSet.delete(p.id);
											return nextSet;
										})
									}
								/>
							</div>
						</li>
					))}
				</ul>
			)}
			{error && <Failure error={error} />}
			<Button onClick={save} disabled={saving || !people}>
				{saving ? "Saving..." : "Save and continue"}
			</Button>
		</>
	);
}

function TopicsStep({
	actions,
	onNext,
}: {
	actions: InsightActions;
	onNext: () => void;
}) {
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

	const flip = (set: Set<string>, key: string, on: boolean) => {
		const nextSet = new Set(set);
		if (on) nextSet.add(key);
		else nextSet.delete(key);
		return nextSet;
	};

	if (!topics)
		return (
			<>
				<StepHeader title="Accounts">
					Outside organisations you work with, found by email domain.
					Topics are suggested per account next.
				</StepHeader>
				{!accounts && !error && <Loading>Finding accounts...</Loading>}
				{accounts && accounts.length === 0 && (
					<Muted>No outside organisations found.</Muted>
				)}
				<ul className="space-y-2">
					{accounts?.map((a) => (
						<li
							key={a.domain}
							className="flex items-center gap-3 text-sm"
						>
							<Checkbox
								id={`account-${a.domain}`}
								checked={pickedAccounts.has(a.domain)}
								onCheckedChange={(on) =>
									setPickedAccounts((prev) =>
										flip(prev, a.domain, on === true),
									)
								}
							/>
							<label htmlFor={`account-${a.domain}`}>
								{a.name}{" "}
								<span className="text-muted-foreground">
									{a.domain} - {a.people} people, {a.threads}{" "}
									threads
								</span>
							</label>
						</li>
					))}
				</ul>
				{error && <Failure error={error} />}
				<Button onClick={toTopics} disabled={busy || !accounts}>
					{busy ? "Finding topics..." : "Save and suggest topics"}
				</Button>
			</>
		);

	return (
		<>
			<StepHeader title="Topics">
				What your mail is about, from recurring subjects. Only topics
				you keep are used to sort threads; rename any.
			</StepHeader>
			{topics.length === 0 && (
				<Muted>No topics found; you can add them in Brain later.</Muted>
			)}
			<ul className="space-y-3">
				{topics.map((t) => (
					<li key={t.id} className="flex items-start gap-3 text-sm">
						<Checkbox
							className="mt-2"
							checked={picked.has(t.id)}
							aria-label={`Keep ${t.name}`}
							onCheckedChange={(on) =>
								setPicked((prev) =>
									flip(prev, t.id, on === true),
								)
							}
						/>
						<div className="min-w-0 flex-1 space-y-1">
							<Input
								className="h-8"
								value={names[t.id] ?? t.name}
								aria-label="Topic name"
								disabled={!picked.has(t.id)}
								onChange={(event) =>
									setNames((prev) => ({
										...prev,
										[t.id]: event.target.value,
									}))
								}
							/>
							<Muted className="block">
								{[
									t.reason,
									`${t.threads} threads`,
									t.members ? `${t.members} people` : "",
								]
									.filter(Boolean)
									.join(" - ")}
							</Muted>
						</div>
					</li>
				))}
			</ul>
			{error && <Failure error={error} />}
			<Button onClick={save} disabled={busy}>
				{busy ? "Saving..." : `Keep ${picked.size} topics and continue`}
			</Button>
		</>
	);
}

function WorkStep({ actions }: { actions: InsightActions }) {
	const { job, error, follow } = useJob(actions, "classify");
	const [startedHere, setStartedHere] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const [starting, setStarting] = useState(false);
	const summary = useMemo(() => {
		const counts = job?.counts ?? {};
		const topics = (counts.topics ?? {}) as Record<string, number>;
		const work = (counts.work ?? {}) as Record<string, number>;
		return { topics, work };
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

	const running = job?.status === "running";
	// a run already going when the page opened counts as this one
	useEffect(() => {
		if (running) setStartedHere(true);
	}, [running]);
	const done = job?.status === "done" && startedHere;
	return (
		<>
			<StepHeader title="Work">
				The classifier files each thread under a topic and decides
				whether it needs you, is waiting on someone, or is just for your
				information. Unsure calls go to Brain review.
			</StepHeader>
			{job && job.status !== "none" && (startedHere || running) && (
				<JobProgress
					job={job}
					labels={[
						["total", "Threads"],
						["done", "Sorted"],
						["errors", "Errors"],
					]}
				/>
			)}
			{done && (
				<dl className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-sm sm:grid-cols-3">
					{(
						[
							["needs_me", "Needs you", summary.work],
							["waiting", "Waiting on others", summary.work],
							["fyi", "For your information", summary.work],
							["automated", "Automated", summary.work],
							["filed", "Filed under a topic", summary.topics],
							["asked", "Topic to confirm", summary.topics],
						] as const
					).map(([key, label, source]) => (
						<div key={key} className="flex justify-between gap-2">
							<dt className="text-muted-foreground">{label}</dt>
							<dd className="tabular-nums">
								{Number(source[key] ?? 0)}
							</dd>
						</div>
					))}
				</dl>
			)}
			{job?.status === "failed" && startedHere && (
				<Failure error={job.error || "Sorting stopped."} />
			)}
			{(startError || error) && (
				<Failure error={startError || error || ""} />
			)}
			<div className="flex gap-2">
				{!running && !done && (
					<Button onClick={start} disabled={starting || !job}>
						Sort my threads
					</Button>
				)}
				{done && <Button onClick={finish}>Open Work</Button>}
				{!done && (
					<Button variant="ghost" onClick={finish}>
						Skip for now
					</Button>
				)}
			</div>
		</>
	);
}
