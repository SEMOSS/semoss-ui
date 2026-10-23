/**
 * Built-in reactor inventory at Semoss 12781b2478eb97e2a27a911e9bdbc94b6f34ee88.
 * Named keys include inherited constructors and reachable execution/helper reads.
 * Required inputs are included where reachable organizeKeys/checkOptional enforces
 * them. Output shapes follow source values and PixelStreamUtility. Remaining value,
 * validation, and nested-shape gaps are explicit in contract-gaps.json; audited
 * contracts override these base contracts in catalog.ts.
 */
import type { SourceParameters } from "./source-parameters";
import type { ReactorContract } from "./value-types";

export interface NotificationReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/notification/CreateAppNotificationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateAppNotification: ReactorContract<
		SourceParameters<
			"message" | "priority" | "project" | "title",
			"both",
			["project", "title", "message"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/notification/DeleteNotificationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteNotification: ReactorContract<
		SourceParameters<"notificationId" | "scopeId" | "scopeType", "both">,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/notification/FetchAppNotificationsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FetchAppNotifications: ReactorContract<
		SourceParameters<"limit" | "offset", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/notification/FetchNotificationsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FetchNotifications: ReactorContract<
		SourceParameters<
			"limit" | "markRead" | "offset" | "scopeId" | "scopeType",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/notification/MarkNotificationReadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MarkNotificationRead: ReactorContract<
		SourceParameters<"notificationId" | "scopeId" | "scopeType", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/notification/PollAppNotificationsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PollAppNotifications: ReactorContract<
		SourceParameters<never, "named">,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/notification/PollNotificationsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PollNotifications: ReactorContract<
		SourceParameters<"scopeId" | "scopeType", "both">,
		number,
		false
	>;
}
