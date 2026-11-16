import type {
	ConnectorSavedFile,
	ConnectorViewerService,
} from "@semoss/connectors";
import { StoreState } from "@semoss/utility/store";

/**
 * A file in the chat's own files, waiting to go with the next message, such
 * as an email a Microsoft 365 viewer saved there.
 */
export interface ContextItem {
	/** Identifies the item in the list; the file's path. */
	readonly id: string;
	/** The file's name, shown on its chip. */
	readonly name: string;
	/** Where the file is in the chat's files, as a message's `media` takes it. */
	readonly path: string;
	/** The viewer it came from; none for a file added from Chat Files itself. */
	readonly service?: ConnectorViewerService;
}

/** What {@link ContextItemsStore} holds. */
export interface ContextItemsSnapshot {
	/** The queued files, oldest first. */
	readonly items: readonly ContextItem[];
}

const INITIAL: ContextItemsSnapshot = { items: [] };

/**
 * The files queued for one room's next message. Each is already in the chat's
 * own files: a connector viewer saved it there, or the user picked it in Chat
 * Files. `RoomStore.askMessage` sends them as `media` with the next message
 * and puts them back when the send fails.
 *
 * Owned by the room store, and so as long lived as the room. The new-chat page
 * queues on its temporary room; the room it creates takes the queue through
 * {@link ContextItemsStore.adopt}. React reads it with `useContextItems`.
 */
export class ContextItemsStore {
	private readonly state = new StoreState<ContextItemsSnapshot>(INITIAL);

	getSnapshot = (): ContextItemsSnapshot => this.state.getSnapshot();
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The queued files, for reads outside React. */
	get items(): readonly ContextItem[] {
		return this.state.getSnapshot().items;
	}

	/**
	 * Queue a file from the chat's own files for the next message. A file
	 * already queued is not added twice.
	 *
	 * @param file - The file, as a viewer saved it, or as Chat Files lists it
	 * (with no `service`), its path relative to the chat's folder.
	 */
	add = (
		file: Pick<ConnectorSavedFile, "path" | "name"> &
			Partial<Pick<ConnectorSavedFile, "service">>,
	): void => {
		this.state.update((current) =>
			current.items.some((item) => item.path === file.path)
				? current
				: {
						items: [
							...current.items,
							{
								id: file.path,
								name: file.name,
								path: file.path,
								service: file.service,
							},
						],
					},
		);
	};

	/**
	 * Take a file off the queue for the next message. It stays in the chat's
	 * files.
	 *
	 * @param id - The queued item.
	 */
	remove = (id: string): void => {
		this.state.update((current) =>
			current.items.some((item) => item.id === id)
				? { items: current.items.filter((item) => item.id !== id) }
				: current,
		);
	};

	/**
	 * Hand over the files queued for the next message and clear the queue.
	 *
	 * @returns The queued files.
	 */
	take = (): readonly ContextItem[] => {
		const { items } = this.state.getSnapshot();
		if (items.length > 0) {
			this.state.set(INITIAL);
		}
		return items;
	};

	/**
	 * Put files back on the queue after the message they were taken for could
	 * not be sent, ahead of anything queued since.
	 *
	 * @param items - The files taken for the message.
	 */
	restore = (items: readonly ContextItem[]): void => {
		if (items.length === 0) {
			return;
		}
		const restored = new Set(items.map((item) => item.id));
		this.state.update((current) => ({
			items: [
				...items,
				...current.items.filter((item) => !restored.has(item.id)),
			],
		}));
	};

	/**
	 * Take over the files a draft queued once the real room exists, before
	 * the room's first message, so that message carries them.
	 *
	 * @param draft - The new-chat page's queue.
	 */
	adopt = (draft: ContextItemsStore): void => {
		this.restore(draft.take());
	};
}
