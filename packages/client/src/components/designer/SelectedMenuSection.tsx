import { ChevronDown } from "lucide-react";
import { observer } from "mobx-react-lite";
import { createElement, type JSX } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	H3,
	H4,
} from "@semoss/ui/next";

export const SelectedMenuSection = observer(
	(props: {
		id: string;
		sectionTitle: string;
		menu: {
			name: string;
			children: {
				description: string;
				render: (props: { id: string }) => JSX.Element;
			}[];
		}[];
		accordion: Record<string, boolean>;
		setAccordion: (accordion: Record<string, boolean>) => void;
	}) => {
		return (
			<div className="flex min-w-0 flex-col">
				{props.sectionTitle !== "" && (
					<H3 className="px-2 py-2 font-bold text-foreground text-sm">
						{props.sectionTitle}
					</H3>
				)}
				{props.menu.map((s, sIdx) => {
					const key = `section--${sIdx}`;
					const isOpen = !!props.accordion[key];

					return (
						<Collapsible
							key={key}
							open={isOpen}
							onOpenChange={(open) =>
								props.setAccordion({
									...props.accordion,
									[key]: open,
								})
							}
							className="border-border border-b last:border-b-0"
						>
							<H4 className="flex text-sm">
								<CollapsibleTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-auto min-h-8 w-full justify-between whitespace-normal px-2 py-1 text-left font-bold text-foreground text-sm"
									>
										{s.name}
										<ChevronDown
											aria-hidden="true"
											className={cn(
												"size-4 text-muted-foreground transition-transform motion-reduce:transition-none",
												isOpen && "rotate-180",
											)}
										/>
									</Button>
								</CollapsibleTrigger>
							</H4>
							<CollapsibleContent>
								{s.children.length > 0 && (
									<div className="flex min-w-0 flex-col gap-2 px-2 pt-1 pb-2">
										{s.children.map((c, cIdx) =>
											createElement(c.render, {
												key: cIdx,
												id: props.id,
											}),
										)}
									</div>
								)}
							</CollapsibleContent>
						</Collapsible>
					);
				})}
			</div>
		);
	},
);
