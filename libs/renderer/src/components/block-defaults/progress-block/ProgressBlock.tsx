import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Progress, Spinner } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface ProgressBlockDef extends BlockDef<"progress"> {
	widget: "progress";
	data: {
		type: "linear" | "circular";
		value: number;
		includeLabel: boolean;
		size: string;
		show: string;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
	slots: never;
}

export const ProgressBlock: BlockComponent = observer(({ id }) => {
	const { data, attrs, listeners } = useBlock<ProgressBlockDef>(id);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	if (data.type === "circular") {
		return (
			<div {...attrs} className="relative inline-flex">
				<Spinner
					className="text-primary"
					style={{
						width: data.size ?? undefined,
						height: data.size ?? undefined,
					}}
				/>
				{data.includeLabel && (
					<div className="absolute inset-0 flex items-center justify-center">
						<span className="text-muted-foreground text-xs">
							{`${Math.round(data.value)}%`}
						</span>
					</div>
				)}
			</div>
		);
	} else {
		return (
			<div
				{...attrs}
				className="flex items-center gap-2"
				style={{ width: data.size ?? undefined }}
			>
				<div className="w-full">
					<Progress value={data.value ?? 0} />
				</div>
				{data.includeLabel && (
					<span className="min-w-[35px] text-muted-foreground text-sm">
						{`${Math.round(data.value)}%`}
					</span>
				)}
			</div>
		);
	}
});
