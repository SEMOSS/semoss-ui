import { ChevronDown } from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { createElement } from "react";

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
		accordion: object;
		setAccordion: (accordion: object) => void;
	}) => {
		return (
			<div className="flex flex-col">
				{props.sectionTitle !== "" && (
					<div className="py-1.5 pr-3 pl-2">
						<span className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
							{props.sectionTitle}
						</span>
					</div>
				)}
				{props.menu.map((s, sIdx) => {
					const key = `section--${sIdx}`;
					const isOpen = !!props.accordion[key];

					return (
						<React.Fragment key={key}>
							<div className="border-b last:border-b-0">
								<button
									type="button"
									className="flex w-full cursor-pointer items-center justify-between py-1.5 pr-3 pl-2 text-left transition-colors hover:bg-muted/40"
									onClick={() =>
										props.setAccordion({
											...props.accordion,
											[key]: !isOpen,
										})
									}
								>
									<span className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
										{s.name}
									</span>
									<ChevronDown
										className={`size-3 shrink-0 text-muted-foreground/60 transition-transform duration-200 ${
											isOpen ? "rotate-180" : ""
										}`}
									/>
								</button>
								{isOpen && s.children.length > 0 && (
									<div className="flex flex-col gap-1 pb-3 pl-3">
										{s.children.map((c, cIdx) =>
											createElement(c.render, {
												key: cIdx,
												id: props.id,
											}),
										)}
									</div>
								)}
							</div>
						</React.Fragment>
					);
				})}
			</div>
		);
	},
);
