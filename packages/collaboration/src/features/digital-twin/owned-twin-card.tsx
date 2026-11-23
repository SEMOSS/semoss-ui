import { ArrowUpRight, Brain, Ellipsis, Settings } from "lucide-react";
import { Link } from "react-router";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	H3,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { agentImageUrl } from "@/features/agents/api/agent-image";
import { topicTone } from "@/features/collaboration/topic-tone";
import {
	twinChatPath,
	twinContentsPath,
	twinSettingsPath,
} from "@/lib/workspace-paths";
import type { DigitalTwin } from "./api/digital-twin";
import "./twin-gallery.css";

/** An owned twin's portrait, chat, knowledge and settings in the gallery. */
export function OwnedTwinCard({
	twin,
	updateCount,
}: {
	/** The twin its owner can open or manage. */
	twin: DigitalTwin;
	/** Source changes waiting for the owner to review. */
	updateCount: number;
}) {
	const portrait = agentImageUrl(twin.id);
	const links = [
		{
			to: twinContentsPath(undefined, twin.id),
			label: "What it knows",
			icon: <Brain aria-hidden="true" className="size-3.5" />,
		},
		{
			to: twinSettingsPath(twin.id),
			label: "Manage",
			icon: <Settings aria-hidden="true" className="size-3.5" />,
		},
	];
	const updates =
		updateCount === 1
			? "1 update to review"
			: `${updateCount} updates to review`;
	return (
		<li className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground">
			<div className="flex min-w-0 grow @lg/twins:flex-col items-center @lg/twins:items-stretch">
				<div className="twin-gallery-cover relative isolate flex @lg/twins:aspect-[2.15/1] min-w-0 grow @lg/twins:items-end items-center gap-3 overflow-hidden @5xl/twins:p-5 @lg/twins:p-4 p-2">
					<div
						aria-hidden="true"
						className={cn(
							"twin-gallery-art -z-10 pointer-events-none absolute inset-0 @lg/twins:block hidden overflow-hidden",
							topicTone(twin.id),
						)}
					>
						<span
							className="twin-gallery-wash"
							style={{ backgroundImage: `url("${portrait}")` }}
						/>
					</div>
					<AgentAvatar
						agent={{ name: twin.name, avatar: portrait }}
						shape="rounded"
						className="twin-gallery-portrait size-10"
					/>
					<H3 className="wrap-anywhere relative z-10 min-w-0 @lg/twins:max-w-3/5 @lg/twins:text-balance font-semibold @3xl/twins:text-3xl @6xl/twins:text-4xl @lg/twins:text-primary-foreground @lg/twins:text-xl text-sm @lg/twins:leading-none leading-tight tracking-tight">
						{twin.name}
					</H3>
				</div>
				<div className="flex shrink-0 flex-wrap items-center @lg/twins:justify-start justify-end gap-1 p-2 @lg/twins:px-3 @lg/twins:py-2.5">
					<Button
						asChild
						size="sm"
						className="@lg/twins:me-auto pointer-coarse:min-h-11 bg-foreground text-background hover:bg-foreground/85"
					>
						<Link
							to={twinChatPath(twin.id)}
							aria-label={`Chat: ${twin.name}`}
						>
							Chat <ArrowUpRight aria-hidden="true" />
						</Link>
					</Button>
					{links.map(({ to, label, icon }) => (
						<Button
							key={to}
							asChild
							size="sm"
							variant="ghost"
							className="@lg/twins:inline-flex hidden pointer-coarse:min-h-11 px-2 text-muted-foreground"
						>
							<Link to={to} aria-label={`${label}: ${twin.name}`}>
								{icon}
								{label}
							</Link>
						</Button>
					))}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								size="icon-sm"
								variant="ghost"
								aria-label={`More options for ${twin.name}`}
								className="@lg/twins:hidden pointer-coarse:size-11"
							>
								<Ellipsis aria-hidden="true" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{links.map(({ to, label, icon }) => (
								<DropdownMenuItem key={to} asChild>
									<Link to={to}>
										{icon}
										{label}
									</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			{updateCount > 0 && (
				<Link
					to={twinContentsPath("updates", twin.id)}
					aria-label={`${updates}: ${twin.name}`}
					className="focus-visible:-outline-offset-2 flex min-h-8 pointer-coarse:min-h-11 items-center border-t px-3 py-1 text-sm underline underline-offset-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
				>
					{updates}
				</Link>
			)}
		</li>
	);
}
