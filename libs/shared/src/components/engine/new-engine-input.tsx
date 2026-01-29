import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
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
						<Tooltip>
							<TooltipTrigger asChild>
								<CircleAlertIcon className="text-destructive" />
							</TooltipTrigger>
							<TooltipContent>Name already exists</TooltipContent>
						</Tooltip>
					)}
				{checkEngineName.status === "ERROR" && (
					<Tooltip>
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
