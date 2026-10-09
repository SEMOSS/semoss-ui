/** Saved room summaries; conversation contents are never loaded for navigation. */
export interface RoomTreeRoom {
	roomId: string;
	roomName?: string;
	dateCreated?: string;
	dateUpdated?: string;
	activityAt?: string;
	/** Server-owned pin state, retained independently of sidebar pagination. */
	pinned?: boolean;
	/** Every surviving source topic, sorted by name then identity. */
	topics: RoomTreeTopic[];
	/** Browser-only activity that has not been viewed in this account. */
	isUnread?: boolean;
	topicUnavailable?: boolean;
}

export interface RoomTreeTopic {
	topicId: string;
	name: string;
	short?: string;
}

export interface RoomTreeResponse {
	rooms: RoomTreeRoom[];
	/** Partial association failures leave the affected rooms visible without topic labels. */
	warning?: string;
}

export interface RoomTreeSnapshot {
	rooms: RoomTreeRoom[];
	/** Undefined until the first successful pin read; includes later sidebar pages. */
	pinnedRoomIds?: readonly string[];
	hasMore: boolean;
	isLoading: boolean;
	error: string;
}

/** Shared by the desktop sidebar and mobile drawer. */
export interface RoomTreeState extends RoomTreeSnapshot {
	refresh: () => void;
	loadMore: () => void;
	retry: () => void;
	scrollTop: { current: number };
}
