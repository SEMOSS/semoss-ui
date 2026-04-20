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

export const TransformationCellInput: TransformationCellInputComponent = (
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
			<Select
				value={frame ? frame.cell.parameters.targetCell.id : ""}
				onValueChange={(val) => {
					const target = frame.options.find((f) => f.id === val);
					state.dispatch({
						message: ActionMessages.UPDATE_CELL,
						payload: {
							queryId: frame.cell.query.id,
							cellId: frame.cell.id,
							path: "parameters.targetCell",
							value: {
								id: target.id,
								frameVariableName:
									target.parameters.frameVariableName,
							},
						},
					});
				}}
			>
				<SelectTrigger className="h-[30px] w-[200px]">
					<Network className="mr-1 size-4 shrink-0" />
					<SelectValue placeholder="Select frame" />
				</SelectTrigger>
				<SelectContent>
					{frame?.options.map((c) => (
						<SelectItem key={c.id} value={c.id}>
							{c.parameters.frameVariableName}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<p className="font-bold text-sm leading-6">{display}</p>
			{children}
		</div>
	);
};
