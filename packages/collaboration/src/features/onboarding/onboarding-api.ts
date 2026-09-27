import type { InsightActions } from "@/lib/pixel";
import { PixelError, pixel } from "@/lib/pixel";

// Onboarding reactors (reactor-contract.md, "Onboarding and classifier"); outputs are read leniently.

type Row = Record<string, unknown>;

const str = (value: unknown): string =>
	typeof value === "string" ? value : "";
const num = (value: unknown): number => {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
};
const rows = (value: unknown): Row[] =>
	Array.isArray(value) ? (value as Row[]) : [];

async function run(actions: InsightActions, statement: string): Promise<Row> {
	const response = await actions.run<[unknown]>(statement);
	const entry = response?.pixelReturn?.[0];
	if (!entry)
		throw new PixelError("SEMOSS returned an empty result.", statement);
	if (entry.operationType?.includes("ERROR"))
		throw new PixelError(String(entry.output), statement);
	return (entry.output ?? {}) as Row;
}

// the first look reads headers page by page; 90 days was too slow on a real mailbox
export const LOOK_DAYS = 30;

export interface KeepOutSuggestion {
	kind: "never_sender" | "never_domain";
	value: string;
	name: string;
	count: number;
	reason: string;
	alreadyKeptOut: boolean;
}

export interface MailboxOverview {
	address: string;
	name: string;
	counts: { inbox: Record<string, number>; sent: Record<string, number> };
	topSenders: {
		address: string;
		name: string;
		count: number;
		youWrote: boolean;
	}[];
	keepOut: KeepOutSuggestion[];
}

export async function mailboxOverview(
	actions: InsightActions,
): Promise<MailboxOverview> {
	const out = await run(
		actions,
		pixel("BrainMailboxOverview", { days: LOOK_DAYS }),
	);
	const mailbox = (out.mailbox ?? {}) as Row;
	const counts = (out.counts ?? {}) as Row;
	const window = (value: unknown) =>
		Object.fromEntries(
			Object.entries((value ?? {}) as Row).map(([k, v]) => [k, num(v)]),
		);
	return {
		address: str(mailbox.address),
		name: str(mailbox.name),
		counts: { inbox: window(counts.inbox), sent: window(counts.sentitems) },
		topSenders: rows(out.topSenders).map((s) => ({
			address: str(s.address),
			name: str(s.name),
			count: num(s.count),
			youWrote: s.youWrote === true,
		})),
		keepOut: rows(out.keepOut).map((k) => ({
			kind: k.kind === "never_domain" ? "never_domain" : "never_sender",
			value: str(k.value),
			name: str(k.name),
			count: num(k.count),
			reason: str(k.reason),
			alreadyKeptOut: k.alreadyKeptOut === true,
		})),
	};
}

export type RuleKind = "never_sender" | "never_domain" | "never_keyword";

export async function saveRules(
	actions: InsightActions,
	rules: { kind: RuleKind; value: string }[],
) {
	// one request per rule so a bad value names itself
	for (const rule of rules)
		await run(
			actions,
			pixel("BrainSaveRule", {
				rule: {
					kind: rule.kind,
					value: rule.value,
					note: "onboarding",
				},
			}),
		);
}

export interface Job {
	id: string;
	status: "running" | "done" | "failed" | "none";
	step: string;
	progress: number;
	counts: Record<string, unknown>;
	error: string;
	finishedAt: string;
}

function mapJob(out: Row): Job {
	const status = str(out.status);
	return {
		id: str(out.id),
		status:
			status === "running" || status === "done" || status === "failed"
				? status
				: "none",
		step: str(out.step),
		progress: num(out.progress),
		counts: (out.counts ?? {}) as Record<string, unknown>,
		error: str(out.error),
		finishedAt: str(out.finishedAt),
	};
}

export type JobKind = "import" | "classify";

export async function getJob(actions: InsightActions, kind: JobKind) {
	return mapJob(await run(actions, pixel("BrainGetJob", { kind })));
}

export async function startImport(actions: InsightActions, days: number) {
	return mapJob(await run(actions, pixel("BrainImportMail", { days })));
}

export async function startClassify(actions: InsightActions) {
	return mapJob(
		await run(actions, pixel("BrainClassifyThreads", { async: true })),
	);
}

export interface OnboardingPerson {
	id: string;
	name: string;
	email: string;
	title: string;
	relationship: string;
	strength: number;
	vip: boolean;
	automated: boolean;
}

/** Strongest first; with relationship "automated", only the automated and list senders. */
export async function listPeople(
	actions: InsightActions,
	relationship?: string,
): Promise<OnboardingPerson[]> {
	const out = await run(
		actions,
		pixel(
			"BrainListPeople",
			relationship ? { relationship, limit: 200 } : { limit: 60 },
		),
	);
	return rows(out.items).map((p) => ({
		id: str(p.id),
		name: str(p.name) || str(p.email),
		email: str(p.email),
		title: str(p.title),
		relationship: str(p.relationship),
		strength: num(p.strength),
		vip: p.vip === true,
		automated: p.automated === true,
	}));
}

/** The owner says this is a person after all. */
export async function markPerson(
	actions: InsightActions,
	id: string,
	relationship: "colleague" | "external",
) {
	await run(
		actions,
		pixel("BrainSavePerson", { person: { id, relationship } }),
	);
}

export async function saveVips(
	actions: InsightActions,
	changes: { id: string; vip: boolean }[],
) {
	for (const change of changes)
		await run(actions, pixel("BrainSavePerson", { person: change }));
}

export interface AccountSuggestion {
	name: string;
	domain: string;
	kind: string;
	people: number;
	threads: number;
	/** Threads the owner wrote on. */
	twoWayThreads: number;
	vips: number;
	/** Pre-checked: the owner writes to them, a VIP is there, or several people. */
	suggested: boolean;
}

export async function suggestAccounts(
	actions: InsightActions,
): Promise<AccountSuggestion[]> {
	const out = await run(actions, pixel("BrainSuggestAccounts"));
	return rows(out.accounts).map((a) => ({
		name: str(a.name),
		domain: str(a.domain),
		kind: str(a.kind) || "client",
		people: num(a.people),
		threads: num(a.threads),
		twoWayThreads: num(a.twoWayThreads),
		vips: num(a.vips),
		suggested: a.suggested === true,
	}));
}

export async function listAccounts(
	actions: InsightActions,
): Promise<{ id: string; name: string }[]> {
	const out = await run(actions, pixel("BrainListAccounts", { limit: 1000 }));
	return rows(out.items).map((a) => ({ id: str(a.id), name: str(a.name) }));
}

export async function saveAccounts(
	actions: InsightActions,
	accounts: AccountSuggestion[],
) {
	for (const a of accounts)
		await run(
			actions,
			pixel("BrainSaveAccount", {
				account: { name: a.name, domain: a.domain, kind: a.kind },
			}),
		);
}

export interface TopicSuggestion {
	id: string;
	name: string;
	kind: string;
	accountId: string;
	reason: string;
	threads: number;
	members: number;
	sampleSubjects: string[];
	/** Threads the owner wrote on, and threads with a VIP. */
	youWrote: number;
	vipThreads: number;
	/** Pre-checked: the owner took part, or a VIP is on it. */
	suggested: boolean;
}

export interface TopicSuggestions {
	topics: TopicSuggestion[];
	/** "model" when the text model grouped them, "rules" otherwise. */
	source: string;
	modelError?: string;
}

export async function suggestTopics(
	actions: InsightActions,
): Promise<TopicSuggestions> {
	const out = await run(actions, pixel("BrainSuggestTopics"));
	return {
		source: str(out.source) || "rules",
		modelError: out.modelError ? str(out.modelError) : undefined,
		topics: rows(out.topics).map((t) => ({
			id: str(t.id),
			name: str(t.name),
			kind: str(t.kind),
			accountId: str(t.accountId),
			reason: str(t.reason),
			threads: rows(t.threadIds).length,
			members: rows(t.memberIds).length,
			sampleSubjects: rows(t.sampleSubjects).map((x) => str(x)),
			youWrote: num(t.youWrote),
			vipThreads: num(t.vipThreads),
			suggested: t.suggested === true,
		})),
	};
}

/** Accepted topics go active under the owner's name; skipped ones are deleted. */
export async function saveTopics(
	actions: InsightActions,
	accepted: { id: string; name: string }[],
	skipped: string[],
) {
	for (const t of accepted)
		await run(
			actions,
			pixel("BrainSaveTopic", {
				topic: { id: t.id, name: t.name, status: "active" },
			}),
		);
	for (const id of skipped)
		await run(actions, pixel("BrainDeleteTopic", { topicId: id }));
}

// deletes everything this owner has in Collaboration except the Microsoft link
export async function resetMyData(actions: InsightActions): Promise<number> {
	const out = await run(
		actions,
		pixel("BrainResetMyData", { confirm: "reset" }),
	);
	return num(out.rows);
}
