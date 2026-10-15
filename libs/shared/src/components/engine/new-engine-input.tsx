import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useDebouncedValue,
} from "@semoss/ui/next";

interface NewEngineInputProps {
	/** Native field attributes for label, hint, error and focus associations. */
	inputProps?: Pick<
		ComponentProps<typeof InputGroupInput>,
		| "id"
		| "aria-label"
		| "aria-describedby"
		| "aria-invalid"
		| "ref"
		| "onBlur"
		| "name"
	>;
	/** css classes */
	className?: string;

	/** disabled */
	disabled?: boolean;

	/** required */
	required?: boolean;

	/** placeholder */
	placeholder?: string;

	/** Id of the selected engine */
	value: string;

	/** Update options on change */
	onChange: (value: string) => void;
}

export const NewEngineInput = ({
	inputProps,
	className,
	disabled,
	required,
	placeholder = "Enter name",
	value,
	onChange,
}: NewEngineInputProps) => {
	const debouncedEngineName = useDebouncedValue(value);
	const checkEngineName = usePixel<{ exists: boolean }>(
		debouncedEngineName ? `CheckEngineName("${debouncedEngineName}");` : "",
	);

	return (
		<InputGroup className={cn("w-full", className)}>
			<InputGroupInput
				{...inputProps}
				placeholder={placeholder}
				disabled={disabled}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required={required}
			/>

			<InputGroupAddon align="inline-end">
				{checkEngineName.status === "LOADING" && <Spinner />}
				{checkEngineName.status === "SUCCESS" &&
					debouncedEngineName.length > 0 &&
					!checkEngineName.data.exists && <CircleCheckIcon />}
				{checkEngineName.status === "SUCCESS" &&
					debouncedEngineName.length > 0 &&
					checkEngineName.data.exists && (
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<CircleAlertIcon className="text-destructive" />
							</TooltipTrigger>
							<TooltipContent>Name already exists</TooltipContent>
						</Tooltip>
					)}
				{checkEngineName.status === "ERROR" && (
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<CircleAlertIcon className="text-destructive" />
						</TooltipTrigger>
						<TooltipContent>
							{checkEngineName.error?.message}
						</TooltipContent>
					</Tooltip>
				)}
			</InputGroupAddon>
		</InputGroup>
	);
};
