import { Plus } from "lucide-react";
import { useId } from "react";
import {
	H3,
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
	P,
} from "@semoss/ui/next";
import { DELIVERY_LABELS } from "./custom-routine-schema";
import { RoutineAgentAvatar } from "./routine-agent-avatar";
import { describeDays, formatRunTime } from "./routine-schedule-summary";
import { ROUTINE_TEMPLATES, type RoutineTemplate } from "./routine-templates";

interface RoutineTemplatePickerProps {
	/** Fills the new routine from an idea, or from nothing for a blank routine. */
	onPick: (template: RoutineTemplate | null) => void;
}

/** A blank start first, then ideas for a first or next routine, each with its real task and schedule. */
export function RoutineTemplatePicker({ onPick }: RoutineTemplatePickerProps) {
	const id = useId();
	return (
		<section
			aria-labelledby={`${id}-title`}
			className="flex flex-col gap-4"
		>
			<div className="flex flex-col gap-1">
				<H3 id={`${id}-title`} className="font-medium text-base">
					Start with an idea
				</H3>
				<P className="text-muted-foreground text-sm">
					Pick one to fill in the routine, then change anything you
					like before you create it.
				</P>
			</div>
			<ul className="grid gap-3 md:grid-cols-2">
				<li className="flex min-w-0">
					<Item
						asChild
						variant="outline"
						className="w-full items-start border-dashed hover:bg-accent/50"
					>
						<button
							type="button"
							onClick={() => onPick(null)}
							className="cursor-pointer text-start"
						>
							<ItemMedia
								variant="icon"
								className="size-10 rounded-md"
							>
								<Plus aria-hidden="true" />
							</ItemMedia>
							<ItemContent className="min-w-0">
								<ItemTitle>Start from scratch</ItemTitle>
								<ItemDescription>
									Write your own task and choose when it runs.
								</ItemDescription>
							</ItemContent>
						</button>
					</Item>
				</li>
				{ROUTINE_TEMPLATES.map((template) => (
					<li key={template.id} className="flex min-w-0">
						<Item
							asChild
							variant="outline"
							className="w-full items-start hover:bg-accent/50"
						>
							<button
								type="button"
								aria-labelledby={`${id}-${template.id}`}
								aria-describedby={`${id}-${template.id}-task ${id}-${template.id}-when`}
								onClick={() => onPick(template)}
								className="cursor-pointer text-start"
							>
								<ItemMedia variant="image">
									<RoutineAgentAvatar
										routineId={template.id}
									/>
								</ItemMedia>
								<ItemContent className="min-w-0">
									<ItemTitle id={`${id}-${template.id}`}>
										{template.name}
									</ItemTitle>
									<ItemDescription
										id={`${id}-${template.id}-task`}
									>
										{template.prompt}
									</ItemDescription>
									<span
										id={`${id}-${template.id}-when`}
										className="text-muted-foreground text-xs"
									>
										{describeDays(template.days)} at{" "}
										{formatRunTime(template.time)} ·{" "}
										{DELIVERY_LABELS[template.delivery]}
									</span>
								</ItemContent>
							</button>
						</Item>
					</li>
				))}
			</ul>
		</section>
	);
}
