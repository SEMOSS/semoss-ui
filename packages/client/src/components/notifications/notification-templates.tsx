import type * as React from "react";
import { determineUserPermission } from "../app";
import type { NotificationRecord, NotificationType } from "./types";

const Message = ({ children }: { children: React.ReactNode }) => (
	<span className="inline text-sm leading-[1.43] tracking-[0.17px]">
		{children}
	</span>
);

const Bold = ({ children }: { children: React.ReactNode }) => (
	<span className="inline font-bold text-sm leading-[1.43] tracking-[0.17px]">
		{children}
	</span>
);

const FullStop = () => <Message>.</Message>;

const isSafe = (v?: string | null) => (v === null || v === undefined ? "" : v);

export const getNotificationMessage = (
	n: NotificationRecord,
	loggedInUser?: string,
) => {
	const type = (n.notification_type || "").trim() as NotificationType;
	const isSelf = !!loggedInUser && loggedInUser === n.recipient_user_id;
	const isAuthor =
		!!loggedInUser && loggedInUser === n.notification_createdby;
	const user = <Bold>{isSafe(n.recipient_user_name)}</Bold>;
	const member = <Bold>{isSafe(n.recipient_user_name)}'s</Bold>;
	const capitalizeFirst = (str) => {
		if (!str) return "";
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	};

	const existingPermission = determineUserPermission(n.user_existingrole) ? (
		<Bold>
			{capitalizeFirst(determineUserPermission(n.user_existingrole))}
		</Bold>
	) : null;

	const newPermission = (
		<Bold>{capitalizeFirst(determineUserPermission(n.user_newrole))}</Bold>
	);
	const app = <Bold>{n.catalog_name}</Bold>;
	const by = n.notification_createdby ? (
		<Bold>{n.notification_createdby}</Bold>
	) : null;

	switch (type) {
		case "USER_REQUEST":
			if (isSelf) {
				return (
					<>
						<Message>You have requested</Message> {newPermission}{" "}
						<Message>permissions on</Message> {app}
						<FullStop />
					</>
				);
			}
			return (
				<>
					{user} <Message>has requested</Message> {newPermission}{" "}
					<Message>permissions on</Message> {app}
					<FullStop />
				</>
			);

		case "REQUEST_APPROVAL":
			if (isSelf) {
				return (
					<>
						<Message>Your request for</Message> {newPermission}{" "}
						<Message>permission on</Message> {app}{" "}
						<Message>has been approved by</Message> {by}
						<FullStop />
					</>
				);
			} else if (isAuthor) {
				return (
					<>
						{member}
						<Message> access request to</Message> {newPermission}{" "}
						<Message>permission on</Message> {app}{" "}
						<Message>has been approved by</Message> you
						<FullStop />
					</>
				);
			}
			return (
				<>
					{member}
					<Message> access request to</Message> {newPermission}{" "}
					<Message>permission on</Message> {app}{" "}
					<Message>was approved by</Message> {by}
					<FullStop />
				</>
			);

		case "USER_ADDITION":
			if (isSelf) {
				return (
					<>
						<Message>You are added as</Message> {newPermission}{" "}
						<Message>to</Message> {app} <Message>by</Message> {by}
						<FullStop />
					</>
				);
			} else if (isAuthor) {
				return (
					<>
						{user} <Message>has been added as</Message>{" "}
						{newPermission} <Message>to</Message> {app}{" "}
						<Message>by</Message> you
						<FullStop />
					</>
				);
			}
			return (
				<>
					{member} <Message>has been added as</Message>{" "}
					{newPermission} <Message>to</Message> {app}{" "}
					<Message>by</Message> {by}
					<FullStop />
				</>
			);

		case "PERMISSION_CHANGE":
			if (isAuthor && isSelf) {
				return (
					<>
						<Message>Your role has been changed from</Message>{" "}
						{existingPermission} <Message>to</Message>{" "}
						{newPermission} <Message>on</Message> {app}{" "}
						<Message>by</Message> you
						<FullStop />
					</>
				);
			} else if (isSelf) {
				return (
					<>
						<Message>Your role has been changed from</Message>{" "}
						{existingPermission} <Message>to</Message>{" "}
						{newPermission} <Message>on</Message> {app}{" "}
						<Message>by</Message> {by}
						<FullStop />
					</>
				);
			} else if (isAuthor) {
				return (
					<>
						{member}
						<Message> role was changed from</Message>{" "}
						{existingPermission} <Message>to</Message>{" "}
						{newPermission} <Message>on</Message> {app}{" "}
						<Message>by</Message> you
						<FullStop />
					</>
				);
			}
			return (
				<>
					{member}
					<Message> role was changed from</Message>{" "}
					{existingPermission} <Message>to</Message> {newPermission}{" "}
					<Message>on</Message> {app} <Message>by</Message> {by}
					<FullStop />
				</>
			);

		case "REQUEST_DENIAL":
			if (isSelf) {
				return (
					<>
						<Message>Your request for</Message> {newPermission}{" "}
						<Message>permission on</Message> {app}{" "}
						<Message>has been denied by</Message> {by}
						<FullStop />
					</>
				);
			} else if (isAuthor) {
				return (
					<>
						{member}
						<Message> access request to</Message> {newPermission}{" "}
						<Message>permission on</Message> {app}{" "}
						<Message>has been denied by</Message> you
						<FullStop />
					</>
				);
			}
			return (
				<>
					{member}
					<Message> access request to</Message> {newPermission}{" "}
					<Message>permission on</Message> {app}{" "}
					<Message>was denied by</Message> {by}
					<FullStop />
				</>
			);
		case "SMSS_UPDATE":
			if (isAuthor) {
				return (
					<>
						<Message>The SMSS file of</Message> {app}{" "}
						<Message>has been updated by</Message> you
						<FullStop />
					</>
				);
			}
			return (
				<>
					<Message>The SMSS file of</Message> {app}{" "}
					<Message>has been updated by</Message> {by}
				</>
			);

		default:
			return null;
	}
};
