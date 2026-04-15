import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Progress } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

// Custom circular progress component
const CircularProgressIndicator = ({ 
	value = 0, 
	size = "40", 
	includeLabel = false 
}: { value: number; size: string; includeLabel: boolean }) => {
	const sizeNum = parseInt(size, 10) || 120;
	const strokeWidth = Math.max(4, sizeNum * 0.08);
	const radius = (sizeNum - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const progress = Math.max(0, Math.min(100, value));
	const offset = circumference - (progress / 100) * circumference;
	const center = sizeNum / 2;

	return (
		<div style={{
			position: "relative",
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			width: sizeNum,
			height: sizeNum,
		}}>
			<svg
				width={sizeNum}
				height={sizeNum}
				viewBox={`0 0 ${sizeNum} ${sizeNum}`}
				style={{ position: "absolute", transform: "rotate(-90deg)" }}
			>
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					stroke="#e0e0e0"
					strokeWidth={strokeWidth}
				/>
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					stroke="#2563eb"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
				/>
			</svg>
			{includeLabel && (
				<span style={{
					fontSize: Math.max(12, sizeNum * 0.18),
					fontWeight: 500,
					color: "#6b7280",
				}}>
					{`${Math.round(progress)}%`}
				</span>
			)}
		</div>
	);
};

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

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const progress = Math.max(0, Math.min(100, data.value ?? 0));

	if (data.type === "circular") {
		return (
			<div {...attrs} style={{ display: "inline-flex" }}>
				<CircularProgressIndicator 
					value={progress} 
					size={data.size ?? "120"}
					includeLabel={data.includeLabel}
				/>
			</div>
		);
	}

	return (
		<div {...attrs} style={{ width: data.size }} className="flex items-center gap-2">
			<div className="flex-1">
				<Progress value={progress} />
			</div>
			{data.includeLabel && (
				<div style={{ minWidth: "35px" }} className="text-sm text-muted-foreground">
					{`${Math.round(progress)}%`}
				</div>
			)}
		</div>
	);
});
