import { LockIcon, RotateCcwIcon, UnlockIcon } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	cn,
	Field,
	FieldGroup,
	FieldLabel,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	Skeleton,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import {
	updateDatabaseSmssProperties,
	updateProjectSmssProperties,
} from "@/api";
import { useSettings } from "@/hooks";
import type { ALL_TYPES } from "@/types";

const Editor = lazy(() => import("@monaco-editor/react"));

interface UpdateSmssProps {
	/**
	 * Type of setting
	 */
	type: ALL_TYPES;

	/**
	 * Id of the setting
	 */
	id: string;

	/** Class name for the form */
	className?: string;
}

export const UpdateSmssForm = ({ type, id, className }: UpdateSmssProps) => {
	const { adminMode } = useSettings();

	const [initialValue, setInitialValue] = useState("");
	const [value, setValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isReadOnly, setIsReadOnly] = useState(true);

	const getEngineSMSS = usePixel<string>(
		type === "DATABASE" ||
			type === "STORAGE" ||
			type === "MODEL" ||
			type === "VECTOR" ||
			type === "FUNCTION"
			? adminMode
				? `AdminGetEngineSMSS(engine=['${id}'])`
				: `GetEngineSMSS(engine=['${id}'])`
			: type === "APP"
				? adminMode
					? `AdminGetProjectSMSS(project=['${id}'])`
					: `GetProjectSMSS(project=['${id}'])`
				: "",
		{
			onSuccess: (data) => {
				setIsReadOnly(true);
				setInitialValue(data);
				setValue(data);
			},
		},
	);

	/**
	 * @name updateSMSSProperties
	 * @desc hit endpoint to update smss file
	 */
	const updateSMSSProperties = async () => {
		try {
			setIsLoading(true);

			let response = null;
			if (type === "APP") {
				response = await updateProjectSmssProperties(id, value);
			} else {
				response = await updateDatabaseSmssProperties(id, value);
			}

			if (!response) {
				throw Error("No Response from server");
			}

			if (!response.data.success) {
				throw Error("Failed to update SMSS Properties");
			}

			// mark as readonly
			setIsReadOnly(true);

			// refresh it
			getEngineSMSS.refresh();
		} catch (error) {
			toast.error(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form
			className={cn(
				"mx-auto my-0 flex w-full max-w-3xl flex-1 flex-col items-start gap-6 px-12 py-6",
				className,
			)}
		>
			<FieldGroup>
				<Field orientation="responsive">
					<FieldLabel>Edit SMSS Properties</FieldLabel>
					<Button
						disabled={isReadOnly || initialValue === value}
						onClick={() => {
							updateSMSSProperties();
						}}
						data-test-id={`updateSMSS-updateSNSS-btn`}
					>
						{isLoading ? <Spinner /> : "Update"}
					</Button>
				</Field>

				<InputGroup>
					<Suspense fallback={<Skeleton className="h-80 w-full" />}>
						<Editor
							data-slot="input-group-control"
							className="h-80 p-0.5"
							defaultValue={""}
							options={{
								readOnly: isReadOnly,
								minimap: {
									enabled: false,
								},
							}}
							value={value}
							language={"plaintext"}
							onChange={(newValue) => {
								// Handle changes in the editor's content.
								setValue(newValue);
							}}
							data-test-id={`SMSS-editor`}
						/>
					</Suspense>
					<InputGroupAddon align="block-start" className="border-b">
						<Tooltip>
							<TooltipTrigger asChild>
								<InputGroupButton
									size="icon-xs"
									onClick={() => setIsReadOnly(!isReadOnly)}
								>
									{isReadOnly ? <UnlockIcon /> : <LockIcon />}
								</InputGroupButton>
							</TooltipTrigger>
							<TooltipContent>
								<span>
									{isReadOnly ? "Unlock SMSS" : "Lock SMSS"}
								</span>
							</TooltipContent>
						</Tooltip>

						<InputGroupText>
							{isReadOnly ? (
								<Badge variant="secondary">Read Only</Badge>
							) : (
								<Badge data-test-id={`SMSS-edit-mode-banner`}>
									Editing
								</Badge>
							)}
						</InputGroupText>

						<Tooltip>
							<TooltipTrigger asChild>
								<InputGroupButton
									className="ml-auto"
									size="icon-xs"
									onClick={() => setValue(initialValue)}
								>
									<RotateCcwIcon />
								</InputGroupButton>
							</TooltipTrigger>
							<TooltipContent>Reset SMSS</TooltipContent>
						</Tooltip>
					</InputGroupAddon>
				</InputGroup>
			</FieldGroup>
		</form>
	);
};
