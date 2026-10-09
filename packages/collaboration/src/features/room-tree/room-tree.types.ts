/** Saved room summaries; conversation contents are never loaded for navigation. */
export interface RoomTreeRoom {
	roomId: string;
	roomName?: string;
	dateCreated?: string;
	dateUpdated?: string;
	activityAt?: string;
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
