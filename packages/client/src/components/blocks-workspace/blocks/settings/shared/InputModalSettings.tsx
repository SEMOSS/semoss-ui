import { ExternalLink } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../BaseSettingSection";

interface InputModalSettingsProps<D extends BlockDef = BlockDef> {
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

	/**
	 * Placeholder for text field
	 */
	placeholder?: string;
}

export const InputModalSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "",
		path,
		placeholder = "",
	}: InputModalSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const inputId = useId();

		// track the value
		const [value, setValue] = useState("");
		// track the modal
		const [open, setOpen] = useState(false);

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}

				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (value: string) => {
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
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<BaseSettingSection label={label} htmlFor={inputId}>
					<Input
						id={inputId}
						placeholder={placeholder}
						value={value}
						onChange={(e) => {
							// sync the data on change
							onChange(e.target.value);
						}}
						type={
							Object.hasOwn(data, "type") && path === "value"
								? (data.type as string)
								: undefined
						}
						autoComplete="off"
					/>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<DialogTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label={`Expand ${label.toLowerCase()} editor`}
								>
									<ExternalLink
										className="size-4"
										aria-hidden="true"
									/>
								</Button>
							</DialogTrigger>
						</TooltipTrigger>
						<TooltipContent>{`Expand ${label.toLowerCase()} editor`}</TooltipContent>
					</Tooltip>
				</BaseSettingSection>
				<DialogContent
					className={
						Object.hasOwn(data, "type") && data.type === "date"
							? "max-w-sm"
							: "max-w-4xl"
					}
				>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">{`Edit ${label}`}</DialogTitle>
						<DialogDescription>
							Changes are saved automatically.
						</DialogDescription>
					</DialogHeader>
					<div className="border-b" />
					<div className="p-4">
						<Textarea
							aria-label={label}
							placeholder={placeholder}
							rows={
								Object.hasOwn(data, "type") &&
								data.type === "date"
									? 1
									: 15
							}
							value={value}
							onChange={(e) => {
								// sync the data on change
								onChange(e.target.value);
							}}
							className="field-sizing-fixed w-full resize-y"
							autoComplete="off"
						/>
					</div>
				</DialogContent>
			</Dialog>
		);
	},
);
