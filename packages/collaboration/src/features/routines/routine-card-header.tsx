import { Check, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Badge,
	CardDescription,
	CardHeader,
	CardTitle,
	H2,
} from "@semoss/ui/next";
import type { RoutineStatus } from "./routine-schema";

type RoutineCardHeaderProps = {
	/** The routine's name, rendered as the card's level-2 heading. */
	title: string;
	/** One sentence on what the routine produces. */
	description: string;
	/** Persisted state that decides the Scheduled, Paused, or Not enabled badge. */
	routine: Pick<RoutineStatus, "enabled" | "configured">;
	/** A stable save indicator supplied by the routine form. */
	saveStatus?: ReactNode;
	/** The badge of an enabled routine; a routine that runs on mail is "On", not "Scheduled". */
	enabledLabel?: string;
} & (
	| {
			/** Decorative icon shown before the title. */
			icon: LucideIcon;
			avatar?: never;
	  }
	| {
			/** A 40px avatar shown before the title, in place of the icon. */
			avatar: ReactNode;
			icon?: never;
	  }
);

/** A routine card's title, saved-state badge, and summary. */
export function RoutineCardHeader({
	icon: Icon,
	avatar,
	title,
	description,
	routine,
	saveStatus,
	enabledLabel = "Scheduled",
}: RoutineCardHeaderProps) {
	const status = routine.enabled
		? enabledLabel
		: routine.configured
			? "Paused"
			: "Not enabled";
	return (
		<CardHeader className="gap-3 border-b py-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					{Icon ? (
						<Icon
							className="size-5 shrink-0 text-muted-foreground"
							aria-hidden="true"
						/>
					) : (
						<div className="size-10 shrink-0">{avatar}</div>
					)}
					<CardTitle>
						<H2 className="font-medium text-xl">{title}</H2>
					</CardTitle>
				</div>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					<Badge variant={routine.enabled ? "outline" : "secondary"}>
						{routine.enabled && <Check aria-hidden="true" />}
						{status}
					</Badge>
					{saveStatus}
				</div>
			</div>
			<CardDescription>{description}</CardDescription>
		</CardHeader>
	);
}
