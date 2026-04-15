import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { Input, Label, Spinner } from "@semoss/ui/next";
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

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 500);

	const labelText =
		typeof data.label !== "string"
			? JSON.stringify(data.label)
			: data.label;

	return (
		<div {...attrs} style={{ ...data.style }}>
			{labelText && <Label>{labelText}</Label>}
			<div className="relative">
				{data.multiline && data.rows > 1 ? (
					<textarea
						value={
							data.value !== null && data.value !== undefined
								? data.value
								: ""
						}
						rows={data.rows}
						required={Boolean(data.required)}
						disabled={Boolean(data?.disabled || data?.loading)}
						className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 resize-none"
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
								? data.value
								: ""
						}
						required={Boolean(data.required)}
						disabled={Boolean(data?.disabled || data?.loading)}
						onChange={(e) => {
							setData("value", e.target.value);
							debouncedCallback();
						}}
					/>
				)}
				{data?.loading && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						<Spinner className="size-4 text-muted-foreground" />
					</div>
				)}
			</div>
			{data?.hint && (
				<div className="text-xs text-muted-foreground mt-1">
					{data.hint}
				</div>
			)}
		</div>
	);
});
