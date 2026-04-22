import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../../BaseSettingSection";
import {
	FourByFourIcon,
	OneByThreeIcon,
	OneByTwoIcon,
	ThreeByThreeIcon,
	TwoByTwoIcon,
} from "./icons";

interface GridSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;

	/**
	 *Default value for the property
	 */
	defaultValue?: string;
}

interface GridLayoutOption {
	value: string;
	config: { rows: number; cols: number };
	// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
	icon: any;
}

export const GridSettings = observer(
	<D extends BlockDef = BlockDef>({ id, path }: GridSettingsProps<D>) => {
		const gridLayouts: GridLayoutOption[] = [
			{
				value: "layout-0",
				config: { rows: 1, cols: 2 },
				icon: OneByTwoIcon,
			},
			{
				value: "layout-1",
				config: { rows: 1, cols: 3 },
				icon: OneByThreeIcon,
			},
			{
				value: "layout-2",
				config: { rows: 2, cols: 2 },
				icon: TwoByTwoIcon,
			},
			{
				value: "layout-3",
				config: { rows: 3, cols: 3 },
				icon: ThreeByThreeIcon,
			},
			{
				value: "layout-4",
				config: { rows: 4, cols: 4 },
				icon: FourByFourIcon,
			},
		];
		const { data, setData } = useBlockSettings(id);

		// track the value
		const [value, setValue] = useState<string>(
			JSON.stringify(gridLayouts[0].value) || "",
		);

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return {
						value: "layout-0",
						config: { rows: 1, cols: 2 },
					};
				}

				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return {
						value: "layout-0",
						config: { rows: 1, cols: 2 },
					};
				} else if (typeof v === "string") {
					return JSON.parse(v);
				}

				return v;
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue.value);
		}, [computedValue]);

		const handleChange = (newLayoutId: string) => {
			const newLayout = gridLayouts.find(
				(layout) => layout.value === newLayoutId,
			);

			// set the value
			setValue(newLayoutId);

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
						newLayout as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection label="Grid">
				<Select value={value} onValueChange={handleChange}>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{gridLayouts.map((layout) => (
							<SelectItem key={layout.value} value={layout.value}>
								<div className="flex flex-row items-center gap-2">
									<layout.icon color="disabled" />
									<span>{`${layout.config.rows}x${layout.config.cols}`}</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</BaseSettingSection>
		);
	},
);
