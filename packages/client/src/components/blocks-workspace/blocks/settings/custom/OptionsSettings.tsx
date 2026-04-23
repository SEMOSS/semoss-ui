import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import { Button, Input } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../BaseSettingSection";

interface OptionsSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;

	/**
	 * Settings label
	 */
	label?: string;

	/**
	 * Tooltip text
	 */
	tooltip?: string;
}

export const OptionsSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		label,
		tooltip = "",
	}: OptionsSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);

		// track the value
		const [options, setOptions] = useState<
			Array<{ display: string; value: string; id: string }>
		>([{ display: "", value: "", id: "" }]);

		// track the dragging state
		const [isDragging, setIsDragging] = useState<boolean>(false);

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return [{ display: "", value: "" }];
				}

				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return [{ display: "", value: "" }];
				} else if (Array.isArray(v) && v.length) {
					return v;
				}

				return [{ display: "", value: "" }];
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			// add unique id to the options
			const modifiedOptions = (computedValue || []).map(
				(option, index) => ({
					...option,
					id: `drag-item-${index}`,
				}),
			);
			setOptions(modifiedOptions);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChangeCustomOption = (
			currentOptions: Array<{
				display: string;
				value: string;
				id: string;
			}>,
			optionIndex: number,
			display: string,
			value: string,
			id: string,
		) => {
			// set the value
			const newOptions = [...currentOptions];
			newOptions[optionIndex] = {
				display: display,
				value: value,
				id: id,
			};
			setOptions(newOptions);

			// clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					if (display && value) {
						// set the value
						setData(
							path,
							newOptions as PathValue<D["data"], typeof path>,
						);
					}
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		const onRemoveCustomOption = (index: number) => {
			// set the value
			const newOptions = [
				...options.slice(0, index),
				...options.slice(index + 1),
			];
			setOptions(newOptions);

			// clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						path,
						newOptions as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		const reorder = ({ active, over }: DragEndEvent) => {
			setIsDragging(false);
			if (!options.length) {
				return;
			}

			if (active === over) {
				console.log("Invalid drop!");
				return;
			}

			// find the index of the active and over items in the options array
			const oldIndex = Number(
				options.findIndex((option) => option.id === active.id),
			);
			const newIndex = Number(
				options.findIndex((option) => option.id === over.id),
			);

			// Remove the item from the old index and add it to the new index
			const newOptions = Array.from(options);
			const [removed] = newOptions.splice(oldIndex, 1);
			newOptions.splice(newIndex, 0, removed);

			setOptions(newOptions);

			// clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						path,
						newOptions as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection
				label={label ?? "Options"}
				description={tooltip}
			>
				<div className="flex w-full flex-col gap-1">
					<DndContext
						collisionDetection={closestCenter}
						onDragEnd={reorder}
						onDragStart={() => setIsDragging(true)}
						modifiers={[restrictToParentElement]}
					>
						<SortableContext
							items={options.map((option) => option.id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="flex flex-col gap-1">
								{Array.from(
									options,
									(
										option: {
											display: string;
											value: string;
											id: string;
										},
										i,
									) => {
										return (
											<SortableItems
												key={option.id}
												id={option.id}
											>
												<div className="flex flex-row items-center gap-1">
													<Input
														disabled={isDragging}
														value={option.display}
														onChange={(e) => {
															// sync the data on change
															onChangeCustomOption(
																options,
																i,
																e.target.value,
																option.value,
																option.id,
															);
														}}
														placeholder="Display"
														autoComplete="off"
														className="w-full"
													/>
													<Input
														disabled={isDragging}
														value={option.value}
														onChange={(e) => {
															// sync the data on change
															onChangeCustomOption(
																options,
																i,
																option.display,
																e.target.value,
																option.id,
															);
														}}
														placeholder="Value"
														autoComplete="off"
														className="w-full"
													/>
													<Button
														variant="ghost"
														size="icon-sm"
														disabled={isDragging}
														onClick={() =>
															onRemoveCustomOption(
																i,
															)
														}
													>
														<Trash2 />
													</Button>
												</div>
											</SortableItems>
										);
									},
								)}
							</div>
						</SortableContext>
					</DndContext>
					<div className="flex flex-1 flex-row items-center justify-center">
						<Button
							size="sm"
							onClick={() =>
								setOptions([
									...options,
									{ display: "", value: "", id: "" },
								])
							}
						>
							<Plus className="mr-1 size-4" />
							Add {label ?? "Option"}
						</Button>
					</div>
				</div>
			</BaseSettingSection>
		);
	},
);

const SortableItems = ({
	id,
	children,
}: {
	id: string;
	children: React.ReactNode;
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		cursor: "grab",
	};

	return (
		<div ref={setNodeRef} style={style} className="flex items-center gap-1">
			{children}
			<div {...attributes} {...listeners} className="flex items-center">
				<GripVertical />
			</div>
		</div>
	);
};
