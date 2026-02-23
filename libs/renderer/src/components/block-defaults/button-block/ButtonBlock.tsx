import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useMemo } from "react";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useBlock, useBlocks } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface ButtonBlockDef extends BlockDef<"button"> {
	widget: "button";
	data: {
		style: CSSProperties;
		label: string;
		loading?: boolean;
		disabled?: boolean;
		variant: "contained" | "outlined" | "text";
		color: "primary" | "secondary" | "success" | "warning" | "error";
		show: string;
		type: "button" | "submit" | "reset";
		requiredBlocks?: string[];
	};
	listeners: {
		onClick: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const variantMap: Record<
	ButtonBlockDef["data"]["variant"],
	"default" | "outline" | "ghost"
> = {
	contained: "default",
	outlined: "outline",
	text: "ghost",
};

export const ButtonBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<ButtonBlockDef>(id);
	const { state } = useBlocks();

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, [listeners]);

	// Validate required blocks
	const validation = useMemo(() => {
		const requiredBlocks = data.requiredBlocks || [];

		if (requiredBlocks.length === 0) {
			return { isValid: true, invalidBlockLabels: [] };
		}

		const invalidBlockLabels: string[] = [];

		for (const blockId of requiredBlocks) {
			const block = state.getBlock(blockId);
			if (!block) {
				// Block doesn't exist, skip it
				continue;
			}

			const blockData = block.data || {};
			const value =
				blockData.value ??
				blockData.defaultValue ??
				(Array.isArray(blockData.value) ? blockData.value : "");

			const isEmpty =
				value === "" ||
				value === null ||
				typeof value === "undefined" ||
				(Array.isArray(value) && value.length === 0);

			if (isEmpty) {
				const label =
					blockData.label && typeof blockData.label === "string"
						? blockData.label
						: blockId;
				invalidBlockLabels.push(label);
			}
		}

		return {
			isValid: invalidBlockLabels.length === 0,
			invalidBlockLabels,
		};
	}, [data.requiredBlocks, state]);

	const tooltipTitle = !validation.isValid
		? `Please fill required fields: ${validation.invalidBlockLabels.join(", ")}`
		: "";

	return (
		<TooltipProvider>
			<div {...attrs} className="p-0.5">
				{!validation.isValid ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<span>
								<Button
									variant={
										variantMap[data.variant] ?? "default"
									}
									disabled={
										data?.disabled ||
										data?.loading ||
										!validation.isValid
									}
									type={data?.type}
									style={data.style}
									onClick={() => {
										listeners.onClick();
									}}
								>
									{data?.loading && (
										<Spinner className="mr-1 size-4" />
									)}
									<span
										style={{
											visibility: data?.loading
												? "hidden"
												: "visible",
										}}
									>
										{data.label}
									</span>
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>{tooltipTitle}</TooltipContent>
					</Tooltip>
				) : (
					<Button
						variant={variantMap[data.variant] ?? "default"}
						disabled={
							data?.disabled ||
							data?.loading ||
							!validation.isValid
						}
						type={data?.type}
						style={data.style}
						onClick={() => {
							listeners.onClick();
						}}
					>
						{data?.loading && <Spinner className="mr-1 size-4" />}
						<span
							style={{
								visibility: data?.loading
									? "hidden"
									: "visible",
							}}
						>
							{data.label}
						</span>
					</Button>
				)}
			</div>
		</TooltipProvider>
	);
});
