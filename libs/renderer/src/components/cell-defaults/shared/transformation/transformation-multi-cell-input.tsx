import { Network } from "lucide-react";
import type React from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlocks } from "../../../../hooks";
import { ActionMessages } from "../../../../store";

type TransformationCellInputComponent = React.FunctionComponent<{
	isExpanded?: boolean;
	display: string;
	Icon: React.FunctionComponent;
	children: React.ReactNode;
	frame?: {
		// biome-ignore lint/suspicious/noExplicitAny: external API type
		cell: any;
		// biome-ignore lint/suspicious/noExplicitAny: external API type
		options: Record<string, any>[];
	};
}>;

export const TransformationMultiCellInput: TransformationCellInputComponent = (
	props,
) => {
	const { children, frame, display, Icon, isExpanded } = props;
	const { state } = useBlocks();

	if (!isExpanded) {
		return (
			<div className="w-full py-0.5">
				<span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
					<Icon />
					{display}
				</span>
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-2 py-0.5">
			<div className="flex flex-row gap-2">
				<Select
					value={frame.cell.parameters.fromTargetCell.id}
					onValueChange={(val) => {
						const target = frame.options.find((f) => f.id === val);
						state.dispatch({
							message: ActionMessages.UPDATE_CELL,
							payload: {
								queryId: frame.cell.query.id,
								cellId: frame.cell.id,
								path: "parameters.fromTargetCell",
								value: {
									id: target.id,
									frameVariableName:
										target.parameters.frameVariableName,
								},
							},
						});
					}}
				>
					<SelectTrigger className="h-9 w-[200px] min-w-0">
						<div className="flex min-w-0 flex-1 items-center gap-1">
							<Network className="size-4 shrink-0" />
							<SelectValue placeholder="From frame" />
						</div>
					</SelectTrigger>
					<SelectContent>
						{Array.from(
							new Map(
								frame.options.map((c) => [c.id, c]),
							).values(),
						).map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.parameters.frameVariableName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={frame.cell.parameters.toTargetCell.id}
					onValueChange={(val) => {
						const target = frame.options.find((f) => f.id === val);
						state.dispatch({
							message: ActionMessages.UPDATE_CELL,
							payload: {
								queryId: frame.cell.query.id,
								cellId: frame.cell.id,
								path: "parameters.toTargetCell",
								value: {
									id: target.id,
									frameVariableName:
										target.parameters.frameVariableName,
								},
							},
						});
					}}
				>
					<SelectTrigger className="h-9 w-[200px] min-w-0">
						<div className="flex min-w-0 flex-1 items-center gap-1">
							<Network className="size-4 shrink-0" />
							<SelectValue placeholder="To frame" />
						</div>
					</SelectTrigger>
					<SelectContent>
						{Array.from(
							new Map(
								frame.options.map((c) => [c.id, c]),
							).values(),
						).map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.parameters.frameVariableName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<p className="font-bold text-sm leading-6">{display}</p>
			{children}
		</div>
	);
};
