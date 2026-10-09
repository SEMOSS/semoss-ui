import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { MAIL_SENT_EVENT } from "@/features/connectors/api/microsoft";
import { readTopic, readTopicItems } from "@/features/topics/api/topic-api";
import type { InsightActions } from "@/lib/pixel";
import type {
	CollaborationCommand,
	CollaborationState,
} from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import {
	type MailSyncResult,
	type ResourceRows,
	type ResourceScope,
	readResourceRows,
	syncMail,
} from "./live-state";
import type { LiveSync } from "./live-sync";
import {
	COLLABORATION_SAVED,
	type ResourceStatus,
	WorkUpdatesContext,
} from "./work-updates.context";

/** Ids changed after a request began. */
export function changedSince<T extends { id: string }>(
	before: T[],
	now: T[],
): string[] {
	const prior = new Map(before.map((row) => [row.id, JSON.stringify(row)]));
	return now
		.filter((row) => prior.get(row.id) !== JSON.stringify(row))
		.map((row) => row.id);
}

/** One account's resource cache, shared by existing pages and editors. Reads are demand-driven. */
export function WorkUpdatesProvider({
	actions,
	sync,
	children,
}: {
	actions: InsightActions;
	sync?: LiveSync;
	children: ReactNode;
}) {
	const { state, dispatch } = useCollaborationSession();
	const latest = useRef(state);
	latest.current = state;
	const [resources, setResources] = useState<
		Partial<Record<ResourceScope, ResourceStatus>>
	>({});
	const cache = useRef<Partial<Record<ResourceScope, ResourceStatus>>>({});
	const pending = useRef(new Map<ResourceScope, Promise<void>>());
	const queued = useRef(new Set<ResourceScope>());
	const generation = useRef(0);
	const [mail, setMail] = useState({
		isSyncing: false,
		lastSync: null as MailSyncResult | null,
		syncError: "",
	});
	const syncing = useRef(false);
	const publish = useCallback(
		(scope: ResourceScope, value: ResourceStatus) => {
			cache.current = { ...cache.current, [scope]: value };
			setResources(cache.current);
		},
		[],
	);
	const loadResource = useCallback(
		(scope: ResourceScope, force = false): Promise<void> => {
			const inFlight = pending.current.get(scope);
			if (inFlight) {
				if (force) queued.current.add(scope);
				return inFlight;
			}
			const old = cache.current[scope];
			if (!force && old) return Promise.resolve();
			const token = generation.current;
			publish(scope, {
				...old,
				isLoading: true,
				error: "",
				complete: old?.complete ?? false,
			});
			const request = (async () => {
				await sync?.settled();
				if (token !== generation.current) return;
				const baseline = latest.current;
				const localId = sync?.localId ?? ((id: string) => id);
				const serverId = sync?.serverId ?? ((id: string) => id);
				const id = scope.includes(":")
					? scope.slice(scope.indexOf(":") + 1)
					: "";
				let rows: ResourceRows;
				if (scope.startsWith("topic:"))
					rows = { topics: [await readTopic(actions, serverId(id))] };
				else if (scope.startsWith("topic-work:"))
					rows = {
						items: await readTopicItems(
							actions,
							serverId(id),
							(items) => {
								if (token !== generation.current) return;
								dispatch({
									type: "topic.work.received",
									topicId: id,
									complete: false,
									items: items.map((item) => ({
										...item,
										id: localId(item.id),
										topicIds: item.topicIds.map(localId),
										linkTopicId: item.linkTopicId
											? localId(item.linkTopicId)
											: null,
										assignee: item.assignee
											? localId(item.assignee)
											: null,
									})),
									baseline: {
										topicExists: baseline.topics.some(
											(topic) => topic.id === id,
										),
										items: baseline.items,
									},
									keepItemIds: changedSince(
										baseline.items,
										latest.current.items,
									),
								});
							},
							() => token !== generation.current,
						),
					};
				else
					rows = await readResourceRows(
						actions,
						id ? `topic-context:${serverId(id)}` : scope,
						() => token !== generation.current,
					);
				await sync?.settled();
				if (token !== generation.current) return;
				// Preserve identities belonging to earlier optimistic creates, including nested associations.
				rows = JSON.parse(
					JSON.stringify(rows, (key, value) => {
						if (
							[
								"id",
								"topicId",
								"personId",
								"noteId",
								"refId",
								"replacesId",
								"assignee",
								"linkTopicId",
							].includes(key) &&
							typeof value === "string"
						)
							return localId(value);
						if (
							[
								"topicIds",
								"topics",
								"participants",
								"vips",
							].includes(key) &&
							Array.isArray(value) &&
							value.every((id) => typeof id === "string")
						)
							return value.map(localId);
						return value;
					}),
				) as ResourceRows;
				dispatch({ type: "resource.received", scope, rows, baseline });
				publish(scope, {
					isLoading: false,
					error: "",
					complete: true,
					checkedAt: new Date().toISOString(),
					total: Object.values(rows).reduce(
						(sum, values) => sum + values.length,
						0,
					),
				});
			})()
				.catch((cause: unknown) => {
					if (token === generation.current)
						publish(scope, {
							...old,
							isLoading: false,
							complete: old?.complete ?? false,
							error:
								cause instanceof Error
									? cause.message
									: "Could not load this information.",
						});
				})
				.finally(() => {
					if (token !== generation.current) return;
					pending.current.delete(scope);
					if (queued.current.delete(scope))
						void loadRef.current(scope, true);
				});
			pending.current.set(scope, request);
			return request;
		},
		[actions, sync, dispatch, publish],
	);
	const loadRef = useRef(loadResource);
	loadRef.current = loadResource;
	const refresh = useCallback(() => {
		void loadResource("directory", true);
	}, [loadResource]);
	const syncNow = useCallback(() => {
		if (syncing.current) return;
		const token = generation.current;
		syncing.current = true;
		setMail((current) => ({ ...current, isSyncing: true, syncError: "" }));
		void syncMail(actions)
			.then((result) => {
				if (token !== generation.current) return;
				setMail({ isSyncing: false, lastSync: result, syncError: "" });
				for (const scope of Object.keys(
					cache.current,
				) as ResourceScope[])
					void loadResource(scope, true);
			})
			.catch((cause: unknown) => {
				if (token === generation.current)
					setMail((current) => ({
						...current,
						isSyncing: false,
						syncError:
							cause instanceof Error
								? cause.message
								: "Could not check mail.",
					}));
			})
			.finally(() => {
				if (token === generation.current) syncing.current = false;
			});
	}, [actions, loadResource]);
	useEffect(() => {
		void loadResource("directory");
		return () => {
			generation.current++;
			pending.current.clear();
			queued.current.clear();
			cache.current = {};
		};
	}, [loadResource]);
	useEffect(() => {
		// Saves identify the collections they changed. Re-read only already-used resources.
		const onSaved = (event: Event) => {
			const detail = (
				event as CustomEvent<{
					actions: InsightActions;
					commands: CollaborationCommand[];
					previous?: CollaborationState;
				}>
			).detail;
			if (!detail || detail.actions !== actions) return;
			const { commands, previous } = detail;
			const affected = new Set<ResourceScope>();
			const topicIds = new Set<string>();
			for (const command of commands) {
				if ("topicId" in command) topicIds.add(command.topicId);
				if (command.type === "topic.save" && command.topic.id)
					topicIds.add(command.topic.id);
				if (command.type === "topic.merge") {
					topicIds.add(command.sourceId);
					topicIds.add(command.targetId);
				}
				if (
					command.type.startsWith("topic.") ||
					command.type === "review.resolve"
				)
					affected.add("directory");
				if (command.type.startsWith("item.")) {
					affected.add("items");
					if ("itemId" in command) {
						const item =
							latest.current.items.find(
								(row) => row.id === command.itemId,
							) ??
							previous?.items.find(
								(row) => row.id === command.itemId,
							);
						for (const id of [
							...(item?.topicIds ?? []),
							...(item?.linkTopicId ? [item.linkTopicId] : []),
						]) {
							affected.add(`topic-work:${id}`);
							affected.add(`topic:${id}`);
						}
					}
				}
				if (command.type.startsWith("thread.")) affected.add("threads");
				if (command.type.startsWith("memory.")) {
					affected.add("memories");
					const memory =
						command.type === "memory.save"
							? command.memory
							: "memoryId" in command
								? (latest.current.memories.find(
										(row) => row.id === command.memoryId,
									) ??
									previous?.memories.find(
										(row) => row.id === command.memoryId,
									))
								: undefined;
					for (const ref of memory?.about ?? [])
						if (ref.type === "topic")
							affected.add(`topic-context:${ref.id}`);
				}
				if (command.type.startsWith("person.")) {
					affected.add("people");
					if ("personId" in command) {
						for (const person of [
							latest.current.people.find(
								(row) => row.id === command.personId,
							),
							previous?.people.find(
								(row) => row.id === command.personId,
							),
						]) {
							for (const id of person?.topics ?? [])
								affected.add(`topic-context:${id}`);
						}
					}
				}
				if (command.type.startsWith("rule.")) affected.add("rules");
				if (command.type.startsWith("review.")) affected.add("reviews");
			}
			for (const id of topicIds) {
				if (!latest.current.topics.some((topic) => topic.id === id))
					continue;
				affected.add(`topic:${id}`);
				affected.add(`topic-context:${id}`);
				affected.add(`topic-work:${id}`);
			}
			for (const scope of affected)
				if (cache.current[scope]) void loadResource(scope, true);
		};
		window.addEventListener(COLLABORATION_SAVED, onSaved);
		window.addEventListener(MAIL_SENT_EVENT, syncNow);
		return () => {
			window.removeEventListener(COLLABORATION_SAVED, onSaved);
			window.removeEventListener(MAIL_SENT_EVENT, syncNow);
		};
	}, [actions, loadResource, syncNow]);
	const directory = resources.directory;
	return (
		<WorkUpdatesContext.Provider
			value={{
				...mail,
				resources,
				loadResource,
				isRefreshing: directory?.isLoading ?? true,
				lastUpdated: directory?.checkedAt ?? null,
				error: directory?.error ?? "",
				lastMailCheck: null,
				pendingCoverage:
					resources.reviews?.complete && resources.memories?.complete
						? {
								reviews: state.reviews.length,
								suggestedMemories: state.memories.filter(
									(memory) => memory.state === "suggested",
								).length,
							}
						: null,
				refresh,
				syncMail: syncNow,
				settled: sync?.settled,
				localId: sync?.localId,
				serverId: sync?.serverId,
			}}
		>
			{children}
		</WorkUpdatesContext.Provider>
	);
}
