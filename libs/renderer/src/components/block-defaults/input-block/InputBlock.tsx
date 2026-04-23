import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { Input, Spinner } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface InputBlockDef extends BlockDef<"input"> {
	widget: "input";
	data: {
		style: CSSProperties;
		label: string;
		value: string | number;
		type: string;
		rows: number;
		multiline: boolean;
		required: boolean;
		disabled: boolean;
		hint?: string;
		loading?: boolean;
		show: string;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onChange: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const InputBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<InputBlockDef>(id);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 500);

	const isMultiline = data.rows > 1 && data.type === "text";

	return (
		<div className="flex flex-col gap-1.5" {...attrs} style={data.style}>
			{data.label && (
				// biome-ignore lint/a11y/noLabelWithoutControl: label is associated via context
				<label className="font-medium text-sm">
					{typeof data.label !== "string"
						? JSON.stringify(data.label)
						: data.label}
					{data.required && (
						<span className="ml-0.5 text-destructive">*</span>
					)}
				</label>
			)}
			<div className="relative">
				{data?.loading && (
					<Spinner className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
				)}
				{isMultiline ? (
					<textarea
						rows={data.rows}
						value={
							data.value !== null && data.value !== undefined
								? String(data.value)
								: ""
						}
						required={Boolean(data.required)}
						disabled={Boolean(data?.disabled || data?.loading)}
						className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50${data?.loading ? "pl-9" : ""}`}
						onChange={(e) => {
							setData("value", e.target.value);
							debouncedCallback();
						}}
					/>
				) : (
					<Input
						type={data.type}
						value={
							data.value !== null && data.value !== undefined
								? String(data.value)
								: ""
						}
						required={Boolean(data.required)}
						disabled={Boolean(data?.disabled || data?.loading)}
						className={data?.loading ? "pl-9" : ""}
						onChange={(e) => {
							setData("value", e.target.value);
							debouncedCallback();
						}}
					/>
				)}
			</div>
			{data?.hint && (
				<span className="text-muted-foreground text-xs">
					{data.hint}
				</span>
			)}
		</div>
	);
});
