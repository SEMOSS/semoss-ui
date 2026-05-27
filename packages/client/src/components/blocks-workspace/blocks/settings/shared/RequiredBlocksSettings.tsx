import { Check, ChevronsUpDown, X } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	BLOCK_TYPE_INPUT,
	type Block,
	type BlockDef,
	DefaultBlocks,
	getValueByPath,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import {
	Badge,
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../BaseSettingSection";

interface RequiredBlocksSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label to pass into the input
	 */
	label: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;
}

const isDefaultBlockWidget = (
	widget: string,
): widget is keyof typeof DefaultBlocks => {
	return widget in DefaultBlocks;
};

const defaultBlockRegistry = DefaultBlocks as Record<string, { type: string }>;

export const RequiredBlocksSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "",
		path,
	}: RequiredBlocksSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const { state } = useBlocks();

		// track the value
		const [value, setValue] = useState<string[]>([]);
		const [open, setOpen] = useState(false);

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// get available input blocks
		const blockOptions = useMemo(() => {
			const allBlocks = Object.values(state.blocks || {});
			const inputBlocks = allBlocks.filter((block: Block) => {
				if (!isDefaultBlockWidget(block.widget)) {
					return false;
				}

				const blockConfig = defaultBlockRegistry[block.widget];
				return blockConfig && blockConfig.type === BLOCK_TYPE_INPUT;
			});

			return inputBlocks.map((block: Block) => ({
				id: block.id,
				label: block.data?.label
					? `${block.id} - ${block.data.label}`
					: `${block.id} - ${block.widget}`,
			}));
		}, [state.blocks]);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return [];
				}

				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return [];
				}

				return Array.isArray(v) ? v : [];
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue as string[]);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (selectedIds: string[]) => {
			// set the value
			setValue(selectedIds);

			// clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					// set the value
					setData(
						path,
						selectedIds as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
					console.error(e);
				}
			}, 300);
		};

		/**
		 * Toggle selection of a block ID
		 */
		const toggleSelection = (blockId: string) => {
			const newValue = value.includes(blockId)
				? value.filter((id) => id !== blockId)
				: [...value, blockId];
			onChange(newValue);
		};

		/**
		 * Remove a selected block
		 */
		const removeBlock = (blockId: string) => {
			onChange(value.filter((id) => id !== blockId));
		};

		return (
			<BaseSettingSection label={label}>
				<div className="flex flex-col gap-2">
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={open}
								className="w-full justify-between"
							>
								{value.length > 0
									? `${value.length} block${value.length > 1 ? "s" : ""} selected`
									: "Select required blocks"}
								<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full p-0" align="start">
							<Command>
								<CommandInput placeholder="Search blocks..." />
								<CommandList>
									<CommandEmpty>
										No blocks found.
									</CommandEmpty>
									<CommandGroup>
										{blockOptions.map((option) => (
											<CommandItem
												key={option.id}
												value={option.id}
												onSelect={() => {
													toggleSelection(option.id);
												}}
											>
												<Check
													className={cn(
														"mr-2 size-4",
														value.includes(
															option.id,
														)
															? "opacity-100"
															: "opacity-0",
													)}
												/>
												{option.label}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{value.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{value.map((blockId) => {
								const option = blockOptions.find(
									(opt) => opt.id === blockId,
								);
								return (
									<Badge
										key={blockId}
										variant="secondary"
										className="gap-1 pr-1"
									>
										{option?.label || blockId}
										<button
											type="button"
											onClick={() => removeBlock(blockId)}
											className="ml-1 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
										>
											<X className="size-3" />
										</button>
									</Badge>
								);
							})}
						</div>
					)}
				</div>
			</BaseSettingSection>
		);
	},
);
