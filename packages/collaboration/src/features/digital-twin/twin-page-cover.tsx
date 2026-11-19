import type { ReactNode } from "react";
import { cn, H1, H2 } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { topicTone } from "@/features/collaboration/topic-tone";
import "./twin-gallery.css";

interface TwinPageCoverProps {
	/** Stable twin id for its fallback cover color. */
	twinId: string;
	/** Saved twin name and portrait, including any revision for a new upload. */
	name: string;
	portrait: string;
	/** A section inside an already titled twin page can use its own heading. */
	sectionTitle?: string;
	/** Introductory copy or actions below the name. */
	children: ReactNode;
}

/** The twin's portrait and heading across its chat, profile, and document library. */
export function TwinPageCover({
	twinId,
	name,
	portrait,
	sectionTitle,
	children,
}: TwinPageCoverProps) {
	const Heading = sectionTitle ? H2 : H1;
	return (
		<header className="twin-gallery-cover relative isolate @lg/twins:flex grid @3xl/twins:min-h-52 @lg/twins:min-h-48 min-w-0 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 overflow-hidden rounded-xl border @lg/twins:border-0 bg-card @lg/twins:p-8 p-4">
			<div
				aria-hidden="true"
				className={cn(
					"twin-gallery-art -z-10 pointer-events-none absolute inset-0 @lg/twins:block hidden overflow-hidden",
					topicTone(twinId),
				)}
			>
				<span
					className="twin-gallery-wash"
					style={{
						backgroundImage: `url("${portrait}")`,
					}}
				/>
			</div>
			<AgentAvatar
				agent={{ name, avatar: portrait }}
				size="lg"
				shape="rounded"
				className="twin-gallery-portrait size-14 @lg/twins:max-w-56"
			/>
			<div className="@lg/twins:relative @lg/twins:z-10 @lg/twins:flex contents @lg/twins:w-3/5 @lg/twins:flex-col @lg/twins:gap-3 @lg/twins:text-primary-foreground">
				<Heading className="wrap-anywhere min-w-0 font-display font-medium @3xl/twins:text-5xl @lg/twins:text-4xl text-3xl leading-none tracking-tight">
					{sectionTitle ?? name}
				</Heading>
				{children}
			</div>
		</header>
	);
}
