import { Plus } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	H2,
	H3,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { agentImageUrl } from "@/features/agents/api/agent-image";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { twinChatPath, twinContentsPath } from "@/lib/workspace-paths";
import { type DigitalTwin, listTwins } from "./api/digital-twin";
import { useTwinRead } from "./use-twin-read";

/**
 * Where Digital Twins start: the signed-in person's own twin, or the way to
 * make one, and the twins other people shared with them, each with its chat.
 */
export function TwinHub() {
	const twins = useTwinRead(listTwins);
	const mineId = useId();
	const sharedId = useId();

	// a twin as a card: who it is, then what can be done with it
	const renderTwin = (
		twin: DigitalTwin,
		links: { to: string; label: string }[],
	) => (
		<li
			key={twin.id}
			className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-6"
		>
			<div className="flex min-w-0 items-center gap-4">
				<AgentAvatar
					agent={{ name: twin.name, avatar: agentImageUrl(twin.id) }}
					size="lg"
				/>
				<H3 className="wrap-anywhere line-clamp-3 min-w-0 font-medium text-base leading-snug">
					{twin.name}
				</H3>
			</div>
			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				{links.map(({ to, label }) => (
					<Button
						key={label}
						asChild
						variant="outline"
						size="sm"
						className="pointer-coarse:min-h-11"
					>
						{/* the name, so a list of twins does not read as "Chat, Chat, Chat" */}
						<Link to={to} aria-label={`${label}: ${twin.name}`}>
							{label}
						</Link>
					</Button>
				))}
			</div>
		</li>
	);

	return (
		<CollaborationPage>
			<CollaborationPageHeader
				title="Digital Twins"
				description="A Digital Twin answers questions about one person from the emails, Teams chats and files that person chose to copy into it. Only the people its owner names can chat with it."
			/>
			{twins.data ? (
				<div className="flex min-w-0 flex-col gap-10">
					<section
						aria-labelledby={mineId}
						className="flex flex-col gap-4"
					>
						<H2 id={mineId} className="font-medium text-lg">
							Your Digital Twin
						</H2>
						{twins.data.mine ? (
							<ul className="grid gap-4 md:max-w-xl">
								{renderTwin(twins.data.mine, [
									{ to: "/twins/mine", label: "Manage" },
									{
										to: twinContentsPath(),
										label: "What it knows",
									},
									{
										to: twinChatPath(twins.data.mine.id),
										label: "Chat",
									},
								])}
							</ul>
						) : (
							<div className="flex flex-col items-start gap-4 rounded-xl border border-dashed p-6 md:max-w-xl">
								<P className="text-muted-foreground text-sm">
									You have no Digital Twin yet. Create one,
									choose what it knows, then name the people
									who can ask it about you.
								</P>
								<Button
									asChild
									className="pointer-coarse:min-h-11"
								>
									<Link to="/twins/mine">
										<Plus aria-hidden="true" />
										Create your Digital Twin
									</Link>
								</Button>
							</div>
						)}
					</section>
					<section
						aria-labelledby={sharedId}
						className="flex flex-col gap-4"
					>
						<H2 id={sharedId} className="font-medium text-lg">
							Shared with you
						</H2>
						{twins.data.shared.length > 0 ? (
							<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{twins.data.shared.map((twin) =>
									renderTwin(twin, [
										{
											to: twinChatPath(twin.id),
											label: "Chat",
										},
									]),
								)}
							</ul>
						) : (
							<P className="rounded-xl border border-dashed p-6 text-muted-foreground text-sm">
								No one has shared a Digital Twin with you yet.
								When someone does, it shows here.
							</P>
						)}
					</section>
				</div>
			) : twins.error ? (
				<Alert variant="destructive">
					<AlertTitle>Could not load Digital Twins</AlertTitle>
					<AlertDescription>
						{twins.error}
						<Button
							type="button"
							variant="outline"
							onClick={twins.reload}
						>
							Try again
						</Button>
					</AlertDescription>
				</Alert>
			) : (
				<div className="flex flex-col gap-4">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-36 w-full md:max-w-xl" />
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-36 w-full" />
					<output className="sr-only">Loading Digital Twins…</output>
				</div>
			)}
		</CollaborationPage>
	);
}
