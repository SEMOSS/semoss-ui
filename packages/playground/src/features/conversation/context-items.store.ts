import { makeAutoObservable, observable } from "mobx";
import type {
	ConnectorSavedFile,
	ConnectorViewerService,
} from "@semoss/connectors";

/**
 * A file in the chat's own files, waiting to go with the next message, such
 * as an email a Microsoft 365 viewer saved there.
 */
export interface ContextItem {
	/** Identifies the item in the list; the file's path. */
	id: string;
	/** The file's name, shown on its chip. */
	name: string;
	/** Where the file is in the chat's files, as a message's `media` takes it. */
	path: string;
	/**
	 * The viewer it came from; none for a file added from Chat Files itself.
	 */
	service?: ConnectorViewerService;
}

/**
 * The files queued for one room's next message. Each is already in the chat's
 * own files: a connector viewer saved it there, or the user picked it in Chat
 * Files. `RoomStore.askMessage` sends them as `media` with the next message
 * and puts them back when the send fails.
 *
 * Owned by the room store, and so as long lived as the room. The new-chat page
 * queues on its temporary room; the room it creates takes the queue through
 * {@link ContextItemsStore.adopt}.
 */
export class ContextItemsStore {
	/** The queued files, oldest first. */
	items: ContextItem[] = [];

	constructor() {
		makeAutoObservable(this, { items: observable.ref });
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
		if (this.items.some((item) => item.path === file.path)) {
			return;
		}
		this.items = [
			...this.items,
			{
				id: file.path,
				name: file.name,
				path: file.path,
				service: file.service,
			},
		];
	};

	/**
	 * Take a file off the queue for the next message. It stays in the chat's
	 * files.
	 *
	 * @param id - The queued item.
	 */
	remove = (id: string): void => {
		this.items = this.items.filter((item) => item.id !== id);
	};

	/**
	 * Hand over the files queued for the next message and clear the queue.
	 *
	 * @return The queued files.
	 */
	take = (): ContextItem[] => {
		const items = this.items;
		this.items = [];
		return items;
	};

	/**
	 * Put files back on the queue after the message they were taken for could
	 * not be sent, ahead of anything queued since.
	 *
	 * @param items - The files taken for the message.
	 */
	restore = (items: ContextItem[]): void => {
		const restored = new Set(items.map((item) => item.id));
		this.items = [
			...items,
			...this.items.filter((item) => !restored.has(item.id)),
		];
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
