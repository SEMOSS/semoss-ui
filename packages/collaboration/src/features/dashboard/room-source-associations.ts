import { readRoomSourceAssociation } from "@/features/rooms/api/read-room-source-association";
import type { InsightActions } from "@/lib/pixel";

/** Only source identities are retained; room settings and source envelopes are not. */
type RoomSourceAssociation =
	| { status: "loading"; threadId?: string | null; topicIds?: string[] }
	| { status: "ready"; threadId: string | null; topicIds?: string[] }
	| {
			status: "error";
			error: string;
			threadId?: string | null;
			topicIds?: string[];
	  };

interface AssociationRead {
	activation: symbol;
	value: RoomSourceAssociation;
}

/** One visible topic Sessions panel owns its bounded metadata reads. */
interface RoomSourceActivation {
	retain: () => () => void;
	inspect: (roomIds: string[], retry?: boolean) => void;
	get: (roomId: string) => RoomSourceAssociation | undefined;
}

/** Shell-owned cache, replaced when the authenticated account or insight changes. */
export interface RoomSourceAssociations {
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => ReadonlyMap<string, AssociationRead>;
	createActivation: () => RoomSourceActivation;
}

/** Cache metadata while keeping reads lazy and abandoned activations inert. */
export function createRoomSourceAssociations(
	getActions: () => InsightActions,
): RoomSourceAssociations {
	let snapshot = new Map<string, AssociationRead>();
	const listeners = new Set<() => void>();
	const publish = (values: [string, AssociationRead][]) => {
		snapshot = new Map([...snapshot, ...values]);
		for (const listener of listeners) listener();
	};
	return {
		subscribe: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		getSnapshot: () => snapshot,
		createActivation: () => {
			const activation = Symbol("topic sessions");
			const requested = new Set<string>();
			let owners = 0;
			let generation = 0;
			const get = (roomId: string): RoomSourceAssociation | undefined => {
				// Readers share confirmed associations until an explicit retry.
				return snapshot.get(roomId)?.value;
			};
			return {
				get,
				retain: () => {
					owners += 1;
					return () => {
						owners -= 1;
						if (owners === 0) {
							generation += 1;
							requested.clear();
						}
					};
				},
				inspect: (roomIds, retry = false) => {
					if (owners === 0) return;
					const ids = roomIds.filter(
						(id) =>
							(!requested.has(id) &&
								get(id)?.status !== "ready") ||
							retry,
					);
					if (!ids.length) return;
					for (const id of ids) requested.add(id);
					publish(
						ids.map((id) => [
							id,
							{
								activation,
								value: {
									status: "loading",
									threadId: snapshot.get(id)?.value.threadId,
									topicIds: snapshot.get(id)?.value.topicIds,
								},
							},
						]),
					);
					const token = generation;
					const isActive = () => owners > 0 && generation === token;
					const read = async (): Promise<void> => {
						// Keep metadata fan-out bounded even for a full history page.
						for (
							let offset = 0;
							offset < ids.length && isActive();
							offset += 4
						) {
							await Promise.all(
								ids
									.slice(offset, offset + 4)
									.map(async (id) => {
										let value: RoomSourceAssociation;
										try {
											const association =
												await readRoomSourceAssociation(
													getActions(),
													id,
													retry,
												);
											value = {
												status: "ready",
												...association,
											};
										} catch (cause) {
											value = {
												status: "error",
												topicIds:
													snapshot.get(id)?.value
														.topicIds,
												threadId:
													snapshot.get(id)?.value
														.threadId,
												error:
													cause instanceof Error
														? cause.message
														: "Could not check this session's source link.",
											};
										}
										if (isActive())
											publish([
												[id, { activation, value }],
											]);
									}),
							);
						}
					};
					void read();
				},
			};
		},
	};
}
