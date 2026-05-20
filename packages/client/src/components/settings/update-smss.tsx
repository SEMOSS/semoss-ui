import { LockIcon, RefreshCwIcon, UnlockIcon } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { MonacoEditor } from "@semoss/shared/monaco";
import {
	Button,
	Label,
	Muted,
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

interface UpdateSMSSFormProps {
	/**
	 * Type of setting
	 */
	type: ALL_TYPES;

	/**
	 * Id of the setting
	 */
	id: string;
}

export const UpdateSMSS: React.FC<UpdateSMSSFormProps> = ({ type, id }) => {
	const { adminMode } = useSettings();

	const [value, setValue] = useState("");
	const [readOnly, setReadOnly] = useState(true);

	const getSMSS = usePixel<string>(
		type === "DATABASE" ||
			type === "STORAGE" ||
			type === "MODEL" ||
			type === "VECTOR" ||
			type === "GUARDRAIL" ||
			type === "FUNCTION"
			? adminMode
				? `AdminGetEngineSMSS(engine=['${id}'])`
				: `GetEngineSMSS(engine=['${id}'])`
			: type === "PROJECT"
				? adminMode
					? `AdminGetProjectSMSS(project=['${id}'])`
					: `GetProjectSMSS(project=['${id}'])`
				: "",
	);

	useEffect(() => {
		import("@semoss/shared/monaco").then((mod) => {
			// See exactly what is exported!
			console.log("Export from @semoss/shared/monaco:", mod);
		});
	}, []);

	useEffect(() => {
		if (getSMSS.status !== "SUCCESS") {
			return;
		}

		setValue(getSMSS.data);
	}, [getSMSS.status, getSMSS.data]);

	const editorHeight = useMemo(() => {
		const lineCount = Math.max(1, value.split(/\r?\n/).length);
		const LINE_HEIGHT = 22;
		const BASE_PADDING = 24;
		const MIN_HEIGHT = 240;
		const MAX_HEIGHT = 720;

		const computedHeight = lineCount * LINE_HEIGHT + BASE_PADDING;
		return `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, computedHeight))}px`;
	}, [value]);

	/**
	 * @name updateSMSSProperties
	 * @desc hit endpoint to update smss file
	 */
	const updateSMSSProperties = async () => {
		try {
			let response = null;
			if (type === "PROJECT") {
				response = await updateProjectSmssProperties(id, value);
			} else {
				response = await updateDatabaseSmssProperties(id, value);
			}

			if (!response) {
				throw Error("No Response from server");
			}

			if (response.data.success) {
				setReadOnly(true);
				// refresh it
				getSMSS.refresh();

				toast.success("Successfully updated SMSS Properties");
			} else {
				toast.error("Unable to update SMSS Properties");
			}
		} catch (error) {
			toast.error(`${error}: Unable to update SMSS Properties`);
		}
	};

	return (
		<div className="w-full overflow-hidden rounded-md border border-input bg-transparent dark:bg-input/30">
			<div className="flex w-full flex-row items-center gap-1 border-input border-b bg-primary-foreground p-4">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => getSMSS.refresh()}
						>
							<RefreshCwIcon className="size-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Refresh</TooltipContent>
				</Tooltip>
				<Label className="flex-1 truncate">SMSS Editor</Label>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							aria-label={
								readOnly ? "Unlock Editor" : "Lock Editor"
							}
							variant="ghost"
							size="icon-sm"
							onClick={() => {
								const updated = !readOnly;
								if (updated) {
									setValue(getSMSS.data);
								}
								setReadOnly(!readOnly);
							}}
							data-test-id="updateSMSS-updateSNSS-btn"
						>
							{readOnly ? <LockIcon /> : <UnlockIcon />}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{readOnly ? "Unlock" : "Lock"}
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							aria-label={"Update SMSS Properties"}
							disabled={readOnly || getSMSS.data === value}
							onClick={() => {
								updateSMSSProperties();
							}}
							data-test-id="updateSMSS-editSNSS-btn"
						>
							Save
						</Button>
					</TooltipTrigger>
					<TooltipContent>Save</TooltipContent>
				</Tooltip>
			</div>

			<Suspense
				fallback={
					<div
						className="flex w-full items-center justify-center"
						style={{ height: editorHeight }}
					>
						<Spinner />
					</div>
				}
			>
				{getSMSS.status === "LOADING" && (
					<div
						className="flex w-full items-center justify-center"
						style={{ height: editorHeight }}
					>
						<Spinner />
					</div>
				)}
				{getSMSS.status === "ERROR" && (
					<div
						className="flex w-full items-center justify-center"
						style={{ height: editorHeight }}
					>
						<Muted className="text-destructive">
							{getSMSS.error?.message || "Failed to load SMSS"}
						</Muted>
					</div>
				)}
				{getSMSS.status === "SUCCESS" && (
					<Suspense
						fallback={
							<div className="p-4 text-muted-foreground">
								Loading editor...
							</div>
						}
					>
						<MonacoEditor
							width={"100%"}
							height={editorHeight}
							options={{
								minimap: {
									enabled: false,
								},
								scrollBeyondLastLine: false,
								readOnly: readOnly,
								contextmenu: false,
							}}
							value={value}
							language={"plaintext"}
							onChange={(newValue) => {
								setValue(newValue);
							}}
							data-test-id="SMSS-editor"
						/>
					</Suspense>
				)}
			</Suspense>
		</div>
	);
};
