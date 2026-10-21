import { useId, useState } from "react";
import {
	getPermissionsToCopy,
	type PermissionsToCopy,
	type PermissionTargetResource,
} from "@semoss/sdk";
import {
	type Engine,
	EngineSelect,
	EngineSubtypeIcon,
	ProjectSelect,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";

/** The resource picked to copy from */
interface PickedSource {
	/** Its id */
	id: string;
	/** Its name */
	name: string;
	/** An engine's type, for its icon */
	engineType?: Engine["engine_type"];
	/** An engine's subtype, for its icon */
	engineSubtype?: string;
}

export interface CopyAccessDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The project, engine or team being changed */
	target: PermissionTargetResource;
	/** Called with the people copied and the name of where they came from */
	onCopy: (rows: PermissionsToCopy[], sourceName: string) => void;
	/** Called when the dialog closes */
	onClose: () => void;
	/** Whether to read in admin mode; outside it an admin has only their own permissions */
	admin?: boolean;
}

/**
 * Copies the people given access directly to another app or engine into a
 * permission batch: onto a project or engine with their access level, end date and model
 * limits, or into a team as members. Its teams are not copied. Give it a new
 * key each time it opens so it starts empty.
 */
export const CopyAccessDialog = ({
	open,
	target,
	onCopy,
	onClose,
	admin = false,
}: CopyAccessDialogProps) => {
	const pickerId = useId();
	const [resourceType, setResourceType] = useState<"PROJECT" | "ENGINE">(
		"PROJECT",
	);
	const [source, setSource] = useState<PickedSource | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleCopy = async () => {
		if (!source) {
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const rows = await getPermissionsToCopy(
				{ resourceType, id: source.id },
				target,
				admin,
			);
			onCopy(rows, source.name);
		} catch (e) {
			setError(getErrorMessage(e, "Could not read who has access"));
			setIsLoading(false);
			return;
		}
		setIsLoading(false);
		onClose();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isLoading) {
					onClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Copy From an App or Engine
					</DialogTitle>
					<DialogDescription>
						{target.resourceType === "TEAM"
							? "Everyone given access to it directly becomes a member of this team. Its teams are not copied."
							: "Copies the people given access to it directly, with their access level, end date and model limits. Its teams are not copied."}{" "}
						Nothing is saved until you review and apply your
						changes.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-2">
					{/* one switch picks the resource type; the picker under it is labelled for screen readers */}
					<ToggleGroup
						type="single"
						variant="outline"
						value={resourceType}
						onValueChange={(value) => {
							if (value === "PROJECT" || value === "ENGINE") {
								setResourceType(value);
								setSource(null);
								setError(null);
							}
						}}
						aria-label="Copy from"
						className="w-full"
					>
						<ToggleGroupItem value="PROJECT" className="flex-1">
							App
						</ToggleGroupItem>
						<ToggleGroupItem value="ENGINE" className="flex-1">
							Engine
						</ToggleGroupItem>
					</ToggleGroup>
					<Label htmlFor={pickerId} className="sr-only">
						{resourceType === "PROJECT" ? "App" : "Engine"}
					</Label>
					{resourceType === "PROJECT" ? (
						<ProjectSelect
							id={pickerId}
							name={source?.name ?? ""}
							value={source?.id ?? ""}
							showProjectId
							showProjectImage
							modal
							onChange={(project) =>
								setSource({
									id: project.project_id,
									name:
										project.project_display_name ||
										project.project_name ||
										project.project_id,
								})
							}
						/>
					) : (
						<EngineSelect
							id={pickerId}
							name={source?.name ?? ""}
							value={source?.id ?? ""}
							showEngineId
							modal
							triggerIcon={
								source?.engineType ? (
									<EngineSubtypeIcon
										engineType={source.engineType}
										engineSubtype={source.engineSubtype}
										alt=""
										className="size-5 shrink-0 object-contain"
									/>
								) : null
							}
							onChange={(engine) =>
								setSource({
									id: engine.engine_id,
									name:
										engine.engine_display_name ||
										engine.engine_name ||
										engine.engine_id,
									engineType: engine.engine_type,
									engineSubtype: engine.engine_subtype,
								})
							}
						/>
					)}
				</div>

				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isLoading}
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={!source || isLoading}
						onClick={handleCopy}
					>
						{isLoading ? "Copying..." : "Copy People"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
