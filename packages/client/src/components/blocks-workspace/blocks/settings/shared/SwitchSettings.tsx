import { CircleHelp } from "lucide-react";
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
	Muted,
	Switch,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface SwitchSettingsProps<D extends BlockDef = BlockDef> {
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

	resetValueOnChange?: boolean;

	/**
	 * Desciption that will show on tooltip, to inform user about the setting
	 */
	description?: string;
}

export const SwitchSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "",
		description = "",
		path,
		resetValueOnChange = false,
	}: SwitchSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);

		// track the value
		const [value, setValue] = useState<boolean>(false);

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return false;
				}

				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return false;
				} else if (typeof v === "string") {
					return v === "true";
				} else if (typeof v === "boolean") {
					return v;
				}

				return JSON.stringify(v) === "true";
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (value: boolean) => {
			// set the value
			setValue(value);

			// clear out he old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					// set the value
					setData(path, value as PathValue<D["data"], typeof path>);
					if (resetValueOnChange) {
						setData(
							"value" as Paths<Block<D>["data"], 4>,
							undefined,
						);
					}
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<div>
				<div className="mt-2 flex flex-row items-center gap-2">
					<div className="flex w-full flex-row items-center gap-0.5">
						<Muted className="break-words">{label}</Muted>
						{description && (
							<Tooltip>
								<TooltipTrigger asChild>
									<CircleHelp
										style={{
											color: "action",
											marginLeft: "5px",
										}}
										className="size-4"
									/>
								</TooltipTrigger>
								<TooltipContent>{description}</TooltipContent>
							</Tooltip>
						)}
					</div>
					<div className="flex h-4 flex-row items-center justify-end">
						<Switch
							checked={value}
							onCheckedChange={(checked) => {
								// sync the data on change
								onChange(checked);
							}}
						/>
					</div>
				</div>
			</div>
		);
	},
);
