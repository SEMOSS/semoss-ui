import { Check, ChevronsUpDown } from "lucide-react";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { debounced } from "@semoss/sdk/react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
} from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface SelectBlockDef extends BlockDef<"select"> {
	widget: "select";
	data: {
		multiple: boolean;
		style: CSSProperties;
		label: string;
		value: string | string[];
		required: boolean;
		disabled: boolean;
		options: string[];
		optionLabel?: string;
		optionSublabel?: string;
		optionValue?: string;
		hint?: string;
		loading?: boolean;
		show: boolean;
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
		onOpen: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const SelectBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<SelectBlockDef>(id);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const [open, setOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const stringifiedOptions: string[] = useMemo(() => {
		if (!data.options) return [];
		if (!Array.isArray(data.options)) {
			if (typeof data.options === "string") {
				let opts = (data.options as string).trim();
				if (opts.startsWith("[") && opts.endsWith("]")) {
					opts = opts.replace(/'/g, '"').replace(/,\s+/g, ",");
					try {
						return JSON.parse(opts).map((o: unknown) =>
							typeof o !== "string" ? JSON.stringify(o) : o,
						);
					} catch {
						return opts
							.slice(1, -1)
							.split(",")
							.map((s) => s.trim().replace(/^"|"$/g, ""));
					}
				}
			}
			return [];
		}
		return data.options.map((o) =>
			typeof o !== "string" ? JSON.stringify(o) : o,
		);
	}, [data.options]);

	const getOptionLabel = (option: string): string => {
		try {
			const parsed = JSON.parse(option);
			if (data.optionLabel && parsed[data.optionLabel]) {
				return parsed[data.optionLabel];
			}
		} catch {
			/* not JSON */
		}
		return option;
	};

	const getOptionSublabel = (option: string): string | null => {
		try {
			const parsed = JSON.parse(option);
			if (data.optionSublabel && parsed[data.optionSublabel]) {
				return parsed[data.optionSublabel];
			}
		} catch {
			/* not JSON */
		}
		return null;
	};

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 500);

	const handleOpen = () => {
		if (listeners?.onOpen) {
			setDropdownLoading(true);
			Promise.resolve(listeners.onOpen())
				.catch((e) => console.error("onOpen error:", e))
				.finally(() => setDropdownLoading(false));
		}
	};

	// Multi-select via Popover + Command
	if (data.multiple) {
		const selectedValues = Array.isArray(data.value) ? data.value : [];

		const toggleValue = (option: string) => {
			const label = getOptionLabel(option);
			const next = selectedValues.includes(label)
				? selectedValues.filter((v) => v !== label)
				: [...selectedValues, label];
			setData("value", next);
			debouncedCallback();
		};

		return (
			<div
				{...attrs}
				style={data.style}
				className="flex flex-col gap-1.5"
			>
				{data.label && (
					// biome-ignore lint/a11y/noLabelWithoutControl: label is associated via context
					<label className="font-medium text-sm">
						{data.label}
						{data.required && (
							<span className="ml-0.5 text-destructive">*</span>
						)}
					</label>
				)}
				<Popover
					open={open}
					onOpenChange={(o) => {
						setOpen(o);
						if (o) handleOpen();
					}}
				>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							disabled={data.disabled || data.loading}
							className="w-full justify-between"
						>
							<span className="truncate">
								{selectedValues.length > 0
									? selectedValues.join(", ")
									: "Select..."}
							</span>
							{data.loading || dropdownLoading ? (
								<Spinner className="ml-2 size-4 shrink-0" />
							) : (
								<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
						<Command>
							<CommandInput placeholder="Search..." />
							<CommandEmpty>No options found.</CommandEmpty>
							<CommandGroup>
								{stringifiedOptions.map((option) => {
									const label = getOptionLabel(option);
									const sublabel = getOptionSublabel(option);
									const isSelected =
										selectedValues.includes(label);
									return (
										<CommandItem
											key={option}
											value={label}
											onSelect={() => toggleValue(option)}
										>
											<Check
												className={`mr-2 size-4 ${isSelected ? "opacity-100" : "opacity-0"}`}
											/>
											<div className="flex flex-col">
												<span>{label}</span>
												{sublabel && (
													<span className="text-muted-foreground text-xs">
														{sublabel}
													</span>
												)}
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</Command>
					</PopoverContent>
				</Popover>
				{data.hint && (
					<span className="text-muted-foreground text-xs">
						{data.hint}
					</span>
				)}
			</div>
		);
	}

	// Single select
	const singleValue =
		typeof data.value === "string" ? data.value : (data.value?.[0] ?? "");

	return (
		<div {...attrs} style={data.style} className="flex flex-col gap-1.5">
			{data.label && (
				// biome-ignore lint/a11y/noLabelWithoutControl: label is associated via context
				<label className="font-medium text-sm">
					{data.label}
					{data.required && (
						<span className="ml-0.5 text-destructive">*</span>
					)}
				</label>
			)}
			<div className="relative">
				{(data.loading || dropdownLoading) && (
					<Spinner className="-translate-y-1/2 absolute top-1/2 left-3 z-10 size-4" />
				)}
				<Select
					value={singleValue}
					disabled={data.disabled || data.loading}
					onOpenChange={(o) => {
						if (o) handleOpen();
					}}
					onValueChange={(val) => {
						setData("value", val);
						debouncedCallback();
					}}
				>
					<SelectTrigger
						className={
							data.loading || dropdownLoading ? "pl-9" : ""
						}
					>
						<SelectValue placeholder="Select..." />
					</SelectTrigger>
					<SelectContent>
						{stringifiedOptions.map((option) => {
							const label = getOptionLabel(option);
							const sublabel = getOptionSublabel(option);
							return (
								<SelectItem key={option} value={label}>
									<div className="flex flex-col">
										<span>{label}</span>
										{sublabel && (
											<span className="text-muted-foreground text-xs">
												{sublabel}
											</span>
										)}
									</div>
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			</div>
			{data.hint && (
				<span className="text-muted-foreground text-xs">
					{data.hint}
				</span>
			)}
		</div>
	);
});
