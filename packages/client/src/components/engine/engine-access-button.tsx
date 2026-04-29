import { Eye, LockKeyhole, Pencil, Plus, User } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
	Button,
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	RadioGroup,
	RadioGroupItem,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { PERMISSION_DESCRIPTION_MAP } from "@/constants";
import { useEngine, useRootStore } from "@/hooks";
import type { Role } from "@/types";

type EngineAccessButtonProps = {
	fromApp?: boolean;
};

const PermissionCard = ({
	icon,
	title,
	description,
	value,
}: {
	icon: ReactNode;
	title: string;
	description: string;
	value: string;
}) => {
	return (
		<Card className="rounded-xl p-2">
			<CardHeader className="px-3 py-2">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-start gap-3">
						<div className="mt-0.5 flex h-6 w-6 items-center justify-center text-muted-foreground">
							{icon}
						</div>
						<div className="space-y-1">
							<CardTitle className="text-base">{title}</CardTitle>
							<CardDescription className="text-sm">
								{description}
							</CardDescription>
						</div>
					</div>
					<RadioGroupItem value={value} />
				</div>
			</CardHeader>
		</Card>
	);
};

export const EngineAccessButton = ({ fromApp }: EngineAccessButtonProps) => {
	const { type, active } = useEngine();

	const { monolithStore } = useRootStore();

	const [open, setOpen] = useState(false);
	const [requestedRole, setRequestedRole] = useState<Role>("READ_ONLY");
	const [comment, setComment] = useState<string>("");

	// close when the id changes
	useEffect(() => {
		setOpen(false);
	}, [active.id]);

	const handleOpen = () => {
		setRequestedRole("READ_ONLY");
		setComment(
			`I am requesting access to ${active.name || "this engine"} for [please provide a reason]`,
		);
		setOpen(true);
	};

	/**
	 * Request the new access
	 */
	const requestAccess = async () => {
		try {
			const response = await monolithStore.runQuery(
				`META | RequestEngine(engine=['${
					active.id
				}'], permission=['${requestedRole}']${
					comment && `, comment=['${comment}']`
				})`,
			);

			const { operationType, output } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(String(output));

				return;
			}

			toast.success(String(output));

			setOpen(false);
		} catch (e) {
			console.log(e);
		}
	};

	// cannot request access if the owner
	if (active?.role === "OWNER" && !fromApp) {
		return null;
	}
	return (
		<>
			{fromApp ? (
				<Button
					variant="outline"
					className="h-[30px] rounded-xl border-primary px-6 text-(--primary) text-[13px]"
					onClick={handleOpen}
				>
					{active?.role === "DISCOVERABLE" || !active.role
						? "Request Access"
						: "Change Access"}
				</Button>
			) : active?.role === "DISCOVERABLE" || !active.role ? (
				<Button
					variant="default"
					className="gap-2"
					onClick={handleOpen}
				>
					<LockKeyhole className="size-4" />
					Request Access
				</Button>
			) : (
				<Button
					variant="outline"
					onClick={handleOpen}
					className="border-(--primary) bg-transparent text-(--primary) hover:text-(--primary)"
				>
					<Plus className="size-4" />
					Change Access
				</Button>
			)}

			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
				}}
			>
				<DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{active?.role === "DISCOVERABLE"
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
								setOpen(false);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={
								!requestedRole || requestedRole === active?.role
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
