import { Bell, Plus, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { formatDate } from "@semoss/utility/date";
import { getErrorMessage } from "@semoss/utility/error";
import {
	createMsGraphSubscription,
	deleteMsGraphSubscription,
	getMsGraphAvailability,
	listMsGraphSubscriptions,
	type MsGraphAvailability,
	type MsGraphResource,
	type MsGraphSubscription,
} from "@/api/ms-graph";

/** Props for {@link MicrosoftSubscriptions}. */
export interface MicrosoftSubscriptionsProps {
	/**
	 * Whether the signed-in user has a Microsoft login. The section renders
	 * nothing when they do not, since there is nothing they could subscribe with.
	 */
	signedIntoMicrosoft: boolean;
}

const RESOURCE_LABELS: Record<MsGraphResource, string> = {
	"me/messages": "Mail",
	"me/events": "Calendar",
};

/** The resources offered, in the order the picker lists them. */
const RESOURCES: readonly MsGraphResource[] = ["me/messages", "me/events"];

/**
 * Whether the deployment's Microsoft sign in allows subscribing to a resource.
 *
 * @param state - The availability the backend reported.
 * @param resource - The resource.
 * @return Whether its permission is in place.
 */
const allowsResource = (
	state: MsGraphAvailability,
	resource: MsGraphResource,
): boolean =>
	resource === "me/messages"
		? state.canSubscribeToMail
		: state.canSubscribeToEvents;

/**
 * Lets somebody see and manage what Microsoft notifies this deployment about on
 * their behalf.
 *
 * Subscriptions are per person and are created with their own Microsoft login,
 * so they can only ever watch what that person can already read. They also
 * expire within days, which is why the expiry is shown rather than hidden.
 *
 * Two prerequisites are the administrator's rather than the user's — the
 * deployment has to request a Microsoft permission that allows subscribing, and
 * Microsoft has to be able to reach the deployment over public https to run its
 * validation handshake. Both are reported as explanations rather than as a
 * disabled button with no reason.
 */
export const MicrosoftSubscriptions = ({
	signedIntoMicrosoft,
}: MicrosoftSubscriptionsProps) => {
	const [availability, setAvailability] =
		useState<MsGraphAvailability | null>(null);
	const [subscriptions, setSubscriptions] = useState<MsGraphSubscription[]>(
		[],
	);
	const [resource, setResource] = useState<MsGraphResource>("me/messages");
	const [isLoading, setIsLoading] = useState(true);
	const [isWorking, setIsWorking] = useState(false);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		try {
			const state = await getMsGraphAvailability();
			setAvailability(state);
			// start on a resource the deployment can subscribe to, so one it
			// cannot never holds the picker
			setResource((current) =>
				allowsResource(state, current)
					? current
					: (RESOURCES.find((value) =>
							allowsResource(state, value),
						) ?? current),
			);
			// only worth listing when there is a Microsoft login to list against;
			// otherwise the call would fail for a reason already being explained
			setSubscriptions(
				state.signedIntoMicrosoft
					? await listMsGraphSubscriptions()
					: [],
			);
		} catch (error) {
			toast.error(
				getErrorMessage(
					error,
					"Could not read your Microsoft subscriptions.",
				),
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (signedIntoMicrosoft) {
			void refresh();
		} else {
			setIsLoading(false);
		}
	}, [signedIntoMicrosoft, refresh]);

	if (!signedIntoMicrosoft) {
		return null;
	}

	const subscribe = async () => {
		setIsWorking(true);
		try {
			await createMsGraphSubscription(resource);
			toast.success(
				`Microsoft will now notify this app about your ${
					RESOURCE_LABELS[resource]
				}.`,
			);
			await refresh();
		} catch (error) {
			// Microsoft's own refusal is the useful message here: it is the only
			// thing that knows what the tenant actually consented to
			toast.error(
				getErrorMessage(error, "Could not create the subscription."),
			);
		} finally {
			setIsWorking(false);
		}
	};

	const unsubscribe = async (subscriptionId: string) => {
		setIsWorking(true);
		try {
			await deleteMsGraphSubscription(subscriptionId);
			toast.success("Subscription removed.");
			await refresh();
		} catch (error) {
			toast.error(
				getErrorMessage(error, "Could not remove the subscription."),
			);
		} finally {
			setIsWorking(false);
		}
	};

	const canSubscribeTo = (value: MsGraphResource): boolean =>
		availability?.available === true && allowsResource(availability, value);
	const canSubscribe = canSubscribeTo(resource);
	// when nothing can be subscribed to, the reasons above already say why;
	// otherwise name what is missing next to the picker
	const blockedResources =
		availability?.available === true
			? RESOURCES.filter((value) => !canSubscribeTo(value))
			: [];

	return (
		<div
			className="rounded-lg border bg-card px-6 py-5"
			data-testid="microsoftSubscriptions-section"
		>
			<h3 className="mb-1 flex items-center gap-2 font-semibold text-base">
				<Bell className="size-4" />
				Microsoft notifications
			</h3>
			<p className="mb-4 text-muted-foreground text-sm">
				Ask Microsoft to tell this app when your mail or calendar
				changes. Subscriptions are created with your own Microsoft login
				and expire after a few days.
			</p>
			<div className="flex flex-col gap-4">
				{availability && availability.reasons.length > 0 && (
					<Alert variant="destructive">
						<TriangleAlert className="size-4" />
						<AlertTitle>
							Subscriptions are not available on this deployment
						</AlertTitle>
						<AlertDescription>
							<ul className="list-disc pl-4">
								{availability.reasons.map((reason) => (
									<li key={reason}>{reason}</li>
								))}
							</ul>
						</AlertDescription>
					</Alert>
				)}

				<div className="flex items-end gap-2">
					<Select
						value={resource}
						onValueChange={(value) =>
							setResource(value as MsGraphResource)
						}
						disabled={availability?.available !== true || isWorking}
					>
						<SelectTrigger
							className="w-48"
							data-testid="microsoftSubscriptions-resource-select"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{RESOURCES.map((value) => (
								<SelectItem
									key={value}
									value={value}
									disabled={!canSubscribeTo(value)}
								>
									{RESOURCE_LABELS[value]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						onClick={() => void subscribe()}
						disabled={!canSubscribe || isWorking}
						data-testid="microsoftSubscriptions-subscribe-btn"
					>
						<Plus className="size-4" />
						Subscribe
					</Button>
					<Button
						variant="ghost"
						onClick={() => void refresh()}
						disabled={isLoading || isWorking}
						data-testid="microsoftSubscriptions-refresh-btn"
					>
						<RefreshCw className="size-4" />
						Refresh
					</Button>
				</div>
				{blockedResources.length > 0 && (
					<p
						className="text-muted-foreground text-sm"
						data-testid="microsoftSubscriptions-blocked"
					>
						{blockedResources
							.map((value) => RESOURCE_LABELS[value])
							.join(" and ")}{" "}
						notifications are not available: this deployment's
						Microsoft sign in does not include a permission for
						them. An administrator can add one, after which everyone
						has to sign in to Microsoft again.
					</p>
				)}

				{isLoading ? (
					<Spinner />
				) : subscriptions.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						You have no active subscriptions.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Watching</TableHead>
								<TableHead>Changes</TableHead>
								<TableHead>Expires</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{subscriptions.map((subscription) => (
								<TableRow key={subscription.subscriptionId}>
									<TableCell>
										{RESOURCE_LABELS[
											subscription.resource as MsGraphResource
										] ?? subscription.resource}
									</TableCell>
									<TableCell>
										<Badge variant="secondary">
											{subscription.changeType ??
												"created"}
										</Badge>
									</TableCell>
									<TableCell>
										{subscription.expirationDateTime
											? formatDate(
													subscription.expirationDateTime,
												)
											: "Unknown"}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon"
											disabled={isWorking}
											onClick={() =>
												void unsubscribe(
													subscription.subscriptionId,
												)
											}
											data-testid="microsoftSubscriptions-remove-btn"
										>
											<Trash2 className="size-4" />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
};
