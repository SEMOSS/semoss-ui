import { useEffect, useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupInput,
	Label,
	P,
	Spinner,
	toast,
} from "@semoss/ui/next";

interface EditableFeatureFlag {
	flagId: string;
	flagKey: string;
	description: string;
	minVersion: number;
	defaultVersion: number;
}

interface FeatureFlagEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	appId: string;
	flag: EditableFeatureFlag | null;
	monolithStore: {
		runQuery: (query: string) => Promise<{
			pixelReturn: Array<{
				output: unknown;
				operationType: string;
			}>;
		}>;
	};
	onSaved: (updated: {
		minVersion: number;
		defaultVersion: number;
		description: string;
	}) => void;
}

export const FeatureFlagEditDialog = ({
	open,
	onOpenChange,
	appId,
	flag,
	monolithStore,
	onSaved,
}: FeatureFlagEditDialogProps) => {
	const [editMinVersion, setEditMinVersion] = useState("");
	const [editDefaultVersion, setEditDefaultVersion] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const minVersionId = useId();
	const defaultVersionId = useId();
	const editDescriptionId = useId();

	useEffect(() => {
		if (!open || !flag) return;
		setEditMinVersion(String(flag.minVersion));
		setEditDefaultVersion(String(flag.defaultVersion));
		setEditDescription(flag.description ?? "");
	}, [open, flag]);

	const handleSave = async () => {
		if (!flag || !appId) return;

		const min = parseInt(editMinVersion, 10);
		const def = parseInt(editDefaultVersion, 10);
		const description = editDescription.trim();
		const escapedDescription = description
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"');

		if (Number.isNaN(min) || Number.isNaN(def) || min < 0 || def < 0) {
			toast.error("Version values must be non-negative integers.");
			return;
		}

		setIsSaving(true);
		try {
			const response = await monolithStore.runQuery(
				`UpdateAppFeatureFlag(app="${appId}", flagId="${flag.flagId}", minVersion=${min}, defaultVersion=${def}, description="${escapedDescription}");`,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(
					typeof output === "string"
						? output
						: "Failed to update feature flag.",
				);
			}

			onSaved({
				minVersion: min,
				defaultVersion: def,
				description,
			});
			toast.success("Feature flag updated.");
			onOpenChange(false);
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to update feature flag.",
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Edit Feature Flag</DialogTitle>
					<DialogDescription>
						The flag is <strong>on</strong> for a user when their
						effective version {">="} min version. Unassigned users
						use the default version.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={editDescriptionId}>Description</Label>
						<InputGroup className="h-9">
							<InputGroupInput
								id={editDescriptionId}
								className="h-9"
								placeholder="Describe what this feature flag controls"
								value={editDescription}
								onChange={(e) =>
									setEditDescription(e.target.value)
								}
							/>
						</InputGroup>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor={minVersionId}>Min version</Label>
						<InputGroup className="h-9">
							<InputGroupInput
								id={minVersionId}
								className="h-9 font-mono"
								type="number"
								min={0}
								placeholder="1"
								value={editMinVersion}
								onChange={(e) =>
									setEditMinVersion(e.target.value)
								}
							/>
						</InputGroup>
						<P className="text-muted-foreground text-xs">
							Set to 0 to turn the flag off for everyone.
						</P>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor={defaultVersionId}>
							Default version
						</Label>
						<InputGroup className="h-9">
							<InputGroupInput
								id={defaultVersionId}
								className="h-9 font-mono"
								type="number"
								min={0}
								placeholder="0"
								value={editDefaultVersion}
								onChange={(e) =>
									setEditDefaultVersion(e.target.value)
								}
							/>
						</InputGroup>
						<P className="text-muted-foreground text-xs">
							Version assigned to users with no explicit bucket. 0
							= off by default.
						</P>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={
							isSaving || !editMinVersion || !editDefaultVersion
						}
					>
						{isSaving ? (
							<>
								<Spinner className="mr-2 size-4" />
								Saving...
							</>
						) : (
							"Save"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
