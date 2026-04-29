/** biome-ignore-all lint/a11y/noNoninteractiveTabindex: TODO */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: TODO */
/** biome-ignore-all lint/nursery/useSortedClasses: TODO */
import { ExternalLinkIcon, TrashIcon } from "lucide-react";
import type React from "react";
import { Badge, Button, cn } from "@semoss/ui/next";
import { formatDate } from "@/utility/general";
import { getNotificationMessage } from "./notification-templates";
import type { NotificationRecord } from "./types";

interface NotificationItemProps {
	notifications: NotificationRecord[];
	getHrefFromNotification: (n: NotificationRecord) => string | null;
	onMarkAsRead: (id: string) => void;
	onDelete: (id: string) => void;
	onLinkClick: () => void;
	onLoadMore?: () => void;
	hasMore?: boolean;
	loading?: boolean;
	loggedInUser?: string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
	notifications,
	getHrefFromNotification,
	onMarkAsRead,
	onDelete,
	onLinkClick,
	onLoadMore,
	hasMore,
	loading,
	loggedInUser,
}) => {
	// Empty state
	if (!notifications || notifications.length === 0) {
		return (
			<div className="flex justify-center items-center p-8">
				<p className="text-sm text-muted-foreground">
					No notifications yet.
				</p>
			</div>
		);
	}

	return (
		<>
			{notifications.map((n) => {
				const href =
					n.notification_type === "USER_REQUEST"
						? getHrefFromNotification(n)
						: null;

				const priorityColor =
					n.notification_priority === "HIGH"
						? "bg-(--destructive)"
						: n.notification_priority === "MEDIUM"
							? "bg-(--chart-4)"
							: "bg-(--accent)";

				return (
					<div
						key={n.notification_id}
						data-testid="notification-item"
						className={cn(
							"relative flex flex-col justify-center p-2 text-sm rounded-lg border cursor-pointer transition-shadow hover:shadow-sm group",
							n.notification_isread
								? "border-border"
								: "border border-border border-l-[5px] border-l-(--primary)",
						)}
						onClick={() => onMarkAsRead(n.notification_id)}
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onMarkAsRead(n.notification_id);
							}
						}}
					>
						<div className="flex items-center justify-between gap-1">
							<div>
								<div className="pb-1">
									<Badge
										className={cn(
											"text-white font-normal",
											priorityColor,
										)}
									>
										{n.notification_priority
											? n.notification_priority
													.charAt(0)
													.toUpperCase() +
												n.notification_priority
													.slice(1)
													.toLowerCase()
											: ""}
									</Badge>
								</div>

								<div className="text-sm">
									{getNotificationMessage(n, loggedInUser)}
								</div>

								{n.notification_createddate && (
									<div
										className="mt-1 flex flex-row items-center justify-start gap-3 text-sm text-muted-foreground"
										title={n.notification_createddate}
									>
										{formatDate(n.notification_createddate)}
										{href && (
											<a
												href={href}
												data-testid="notification-link"
												className="no-underline flex items-center ml-2"
												onClick={(e) => {
													e.stopPropagation();
													onMarkAsRead(
														n.notification_id,
													);
													onLinkClick();
												}}
											>
												<Button
													variant="ghost"
													size="icon-sm"
													className="h-[18px] w-[18px] p-0"
												>
													<ExternalLinkIcon className="w-[18px] h-[18px] text-primary" />
												</Button>
											</a>
										)}
									</div>
								)}
							</div>

							<Button
								variant="ghost"
								size="icon-sm"
								className="hidden group-hover:inline-flex"
								data-testid="delete-notification"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(n.notification_id);
								}}
							>
								<TrashIcon className="w-4 h-4 text-destructive" />
							</Button>
						</div>
					</div>
				);
			})}

			{hasMore && (
				<div className="flex justify-center p-1">
					<Button
						variant="ghost"
						onClick={onLoadMore}
						disabled={loading}
						data-testid="load-more"
					>
						{loading ? "Loading…" : "Load more"}
					</Button>
				</div>
			)}
		</>
	);
};
