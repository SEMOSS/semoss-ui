import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { P, Small } from "@semoss/ui/next";
import { OneDriveIcon, TeamsFilesIcon } from "@/components/common/app-icons";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import type { TopicFile } from "../state/collaboration.types";

interface TopicFilesProps {
	/** The OneDrive and Teams files linked to the topic. */
	files: TopicFile[];
	/** Under the empty text: the way to link a first file, where the topic can take one. */
	emptyAction?: ReactNode;
}

/** A topic's linked files, each opening where it lives in Microsoft 365. */
export function TopicFiles({ files, emptyAction }: TopicFilesProps) {
	if (files.length === 0)
		return (
			<div className="flex flex-col items-start gap-3 px-5 py-4">
				<P className="text-muted-foreground text-sm">
					No files in this topic yet. Link the OneDrive and Teams
					files this work runs on, and the assistant can read them in
					this topic’s chats.
				</P>
				{emptyAction}
			</div>
		);
	return (
		<>
			{/* the tab already says Files; this line only counts them */}
			<P className="px-4 py-3 text-muted-foreground text-sm tabular-nums md:px-5">
				{files.length} {files.length === 1 ? "file" : "files"}
			</P>
			<ul
				aria-label="Topic files"
				className="divide-y divide-border border-t"
			>
				{files.map((file) => {
					const isTeams = file.source === "teams";
					const Icon = isTeams ? TeamsFilesIcon : OneDriveIcon;
					const app = isTeams ? "Teams" : "OneDrive";
					// only an https address Microsoft 365 gave becomes a link
					const href = safeSourceUrl(file.webUrl);
					return (
						<li
							key={file.itemId}
							className="flex min-h-11 min-w-0 items-center gap-3 px-5 py-3 hover:bg-muted/30"
						>
							<Icon aria-hidden="true" />
							{href ? (
								<a
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									className="flex min-w-0 items-center gap-1.5 font-medium text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
								>
									<span className="wrap-anywhere min-w-0">
										{file.name}
									</span>
									<ExternalLink
										aria-hidden="true"
										className="size-3.5 shrink-0 text-muted-foreground"
									/>
									<span className="sr-only">
										{" "}
										(opens in {app})
									</span>
								</a>
							) : (
								<span className="wrap-anywhere min-w-0 font-medium text-sm">
									{file.name}
								</span>
							)}
							<Small className="ml-auto shrink-0 font-normal text-muted-foreground text-xs">
								{app}
							</Small>
						</li>
					);
				})}
			</ul>
		</>
	);
}
