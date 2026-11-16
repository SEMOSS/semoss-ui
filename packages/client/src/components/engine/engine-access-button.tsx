import { Eye, LockKeyhole, Pencil, Plus, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Role } from "@semoss/sdk";
import { useSessionInsight } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	RadioGroup,
	Textarea,
	toast,
} from "@semoss/ui/next";
import type { MyAccessRequest } from "@/api/user-access";
import { PERMISSION_DESCRIPTION_MAP } from "@/constants";
import { useEngine } from "@/hooks/useEngine";
import { PermissionCard } from "./permission-card";

/** Props for {@link EngineAccessButton}. */
export interface EngineAccessButtonProps {
	/**
	 * Whether the button is shown from an app: an outline button and a Submit
	 * action, shown to owners too
	 */
	fromApp?: boolean;
	/** The user's own request that waits for a decision, or null */
	request: MyAccessRequest | null;
	/** Whether the user's request is still being read */
	isRequestLoading: boolean;
	/** Whether the request dialog is open */
	open: boolean;
	/** Opens or closes the request dialog; a stable setter, such as a state setter */
	onOpenChange: (open: boolean) => void;
	/** Called after the user asks for access, or changes what they asked for */
	onSuccess: () => void;
}

/**
 * Requests access to the current engine, or a change to the viewer's access,
 * through a dialog that asks for the role and a reason. With a request
 * waiting, it changes that request: the dialog starts from the level and
 * reason the user gave, and asking again replaces it.
 */
export const EngineAccessButton = ({
	fromApp,
	request,
	isRequestLoading,
	open,
	onOpenChange,
	onSuccess,
}: EngineAccessButtonProps) => {
	const { type, engine, permission } = useEngine();

	const { run: runPixel } = useSessionInsight();

	const [requestedRole, setRequestedRole] = useState<Role>("READ_ONLY");
	const [comment, setComment] = useState<string>("");
	const previousEngineId = useRef(engine.engine_id);

	// close when the id changes
	useEffect(() => {
		if (previousEngineId.current !== engine.engine_id) {
			previousEngineId.current = engine.engine_id;
			onOpenChange(false);
		}
	}, [engine.engine_id, onOpenChange]);

	useEffect(() => {
		if (!open) {
			return;
		}
		setRequestedRole(request?.permission ?? "READ_ONLY");
		setComment(
			request?.comment ??
				`I am requesting access to ${engine.engine_display_name || "this engine"} for [please provide a reason]`,
		);
	}, [open, request, engine.engine_display_name]);

	/**
	 * Request the new access
	 */
	const requestAccess = async () => {
		try {
			const response = await runPixel(
				`META | RequestEngine(engine=['${
					engine.engine_id
				}'], permission=['${requestedRole}']${
					comment && `, comment=["<encode>${comment}</encode>"]`
				})`,
			);

			const { operationType, output } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(String(output));

				return;
			}

			toast.success(String(output));

			onOpenChange(false);
			onSuccess();
		} catch (e) {
			console.log(e);
		}
	};

	// cannot request access if the owner
	if (permission === "OWNER" && !fromApp) {
		return null;
	}
	const handleOpen = () => onOpenChange(true);
	const isAsking = permission === "DISCOVERABLE" || !permission;
	return (
		<>
			{fromApp ? (
				<Button
					variant="outline"
					disabled={isRequestLoading}
					onClick={handleOpen}
				>
					{request
						? "Change Request"
						: isAsking
							? "Request Access"
							: "Change Access"}
				</Button>
			) : isAsking && !request ? (
				<Button
					variant="default"
					className="gap-2"
					disabled={isRequestLoading}
					onClick={handleOpen}
				>
					<LockKeyhole className="size-4" />
					Request Access
				</Button>
			) : (
				<Button
					variant="outline"
					disabled={isRequestLoading}
					onClick={handleOpen}
				>
					<Plus className="size-4" />
					{request ? "Change Request" : "Change Access"}
				</Button>
			)}

			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					aria-describedby={undefined}
					className="max-h-[90vh] overflow-auto sm:max-w-2xl"
				>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							{request
								? "Change Request"
								: permission === "DISCOVERABLE"
									? "Request Access"
									: "Change Access"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<RadioGroup
							value={requestedRole}
							onValueChange={(value) => {
								setRequestedRole(value as Role);
							}}
							className="space-y-2"
						>
							<PermissionCard
								icon={<User className="size-4" />}
								title="Author"
								description={
									PERMISSION_DESCRIPTION_MAP[type].author
								}
								value="OWNER"
							/>
							<PermissionCard
								icon={<Pencil className="size-4" />}
								title="Editor"
								description={
									PERMISSION_DESCRIPTION_MAP[type].editor
								}
								value="EDIT"
							/>
							<PermissionCard
								icon={<Eye className="size-4" />}
								title="Read-Only"
								description={
									PERMISSION_DESCRIPTION_MAP[type].readonly
								}
								value="READ_ONLY"
							/>
						</RadioGroup>

						<div className="space-y-2">
							<Label>Reason For Access</Label>
							<Textarea
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								onOpenChange(false);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={
								!requestedRole || requestedRole === permission
							}
							onClick={() => {
								requestAccess();
							}}
						>
							{fromApp ? "Submit" : "Request"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
