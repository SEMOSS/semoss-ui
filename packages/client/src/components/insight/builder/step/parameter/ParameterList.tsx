import { Copy, Filter, Pencil, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@semoss/ui/next";
import { copyTextToClipboard } from "@/utility";
import type { FilterParameter } from "../../../insight.types";

interface ParameterListProps {
	parameters: FilterParameter[];
	onEdit: (param: FilterParameter) => void;
	onDelete: (id: string) => void;
	onAdd: () => void;
}

const getInputTypeLabel = (type: FilterParameter["inputType"]): string => {
	const labels = {
		text: "Text",
		number: "Number",
		date: "Date",
		toggle: "Toggle",
		radio: "Radio",
		select: "Select",
	};
	return labels[type];
};

export const ParameterList = (props: ParameterListProps) => {
	const { parameters, onEdit, onDelete, onAdd } = props;

	if (parameters?.length === 0) {
		return (
			<Card className="h-full overflow-auto p-4">
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-lg">Parameters</h3>
						<Button onClick={onAdd}>Add Parameter</Button>
					</div>
					<div className="flex h-full flex-col items-center justify-center p-8 text-center">
						<Filter className="mb-4 size-16 text-muted-foreground" />
						<h4 className="mb-2 font-semibold text-lg text-muted-foreground">
							No Parameters Defined
						</h4>
						<p className="mb-4 text-muted-foreground text-sm">
							Parameters allow users to dynamically filter data in
							queries.
							<br />
							Create your first parameter to get started.
						</p>
					</div>
				</div>
			</Card>
		);
	}

	return (
		<Card className="h-full overflow-auto p-4">
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-lg">
						Parameters ({parameters?.length})
					</h3>
					<Button onClick={onAdd}>Add Parameter</Button>
				</div>

				<ul className="flex flex-col gap-0">
					{parameters?.map((param) => (
						<li
							key={param.id}
							className="mb-2 flex w-full items-center justify-between rounded-md border border-border p-3"
						>
							{/* <button
								type="button"
								className="mb-2 flex w-full cursor-pointer items-center justify-between rounded-md border border-border p-3 transition-all hover:border-primary hover:bg-accent"
								onClick={() => onEdit(param)}
							> */}
							<div className="flex-1">
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-2">
										<span className="font-medium text-base">
											{param.name}
										</span>
										<Badge variant="secondary">
											{getInputTypeLabel(param.inputType)}
										</Badge>
										{param.required && (
											<Badge
												variant="outline"
												className="border-red-500 text-red-500"
											>
												Required
											</Badge>
										)}
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="w-fit text-muted-foreground text-sm"
										onClick={() =>
											copyTextToClipboard(
												`{{${param.name}}}`,
											)
										}
									>
										<Copy className="mr-1 size-3" />
										{`{{${param.name}}}`}
									</Button>
									{param.inputType === "select" &&
										param.optionsSourceType && (
											<p className="text-muted-foreground text-xs">
												Options:{" "}
												{param.optionsSourceType ===
												"manual"
													? "Manual"
													: param.optionsSourceType ===
															"existingQuery"
														? "From Query"
														: "Separate Query"}
												{param.multiple &&
													" (Multi-select)"}
											</p>
										)}
								</div>
							</div>
							<div className="flex gap-2">
								<Button
									size="icon-sm"
									variant="ghost"
									onClick={(
										e: React.MouseEvent<HTMLButtonElement>,
									) => {
										e.stopPropagation();
										onEdit(param);
									}}
									title="Edit Parameter"
								>
									<Pencil className="size-4" />
								</Button>
								<Button
									size="icon-sm"
									variant="ghost"
									onClick={(
										e: React.MouseEvent<HTMLButtonElement>,
									) => {
										e.stopPropagation();
										if (
											confirm(
												`Are you sure you want to delete parameter "${param.name}"?`,
											)
										) {
											onDelete(param.id);
										}
									}}
									title="Delete Parameter"
									className="text-destructive hover:text-destructive"
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
							{/* </button> */}
						</li>
					))}
				</ul>
			</div>
		</Card>
	);
};
