import { Edit, Eye, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Avatar,
	AvatarFallback,
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

export const EngineAccessButton = ({ fromApp }: EngineAccessButtonProps) => {
	const { type, active } = useEngine();

	const { monolithStore } = useRootStore();

	// track if open
	const [open, setOpen] = useState(false);
	const [requestedRole, setRequestedRole] = useState<Role>(active.role);

	const [comment, setComment] = useState<string>("");

	// close when the id changes
	useEffect(() => {
		setOpen(false);
	}, [active.id]);

	// update the requested whenever the role changes
	useEffect(() => {
		setRequestedRole(active.role);
	}, [active.role]);

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

			// close is
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
					onClick={() => setOpen(true)}
				>
					{active?.role === "DISCOVERABLE" || !active.role
						? "Request Access"
						: "Change Access"}
				</Button>
			) : (
				<Button
					variant="outline"
					onClick={() => setOpen(true)}
					className="border-(--primary) bg-transparet text-(--primary) hover:text-(--primary)"
				>
					<Plus className="size-4" />
					{active?.role === "DISCOVERABLE" || !active.role
						? "Request Access"
						: "Change Access"}
				</Button>
			)}

			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
				}}
			>
				<DialogContent className="max-w-2xl">
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
						>
							<div className="space-y-2">
								<Card className="rounded-xl">
									<CardHeader className="pb-4">
										<div className="flex items-start justify-between">
											<div className="flex items-start gap-3">
												<Avatar className="mt-0.5 size-[22px] bg-black/50 font-bold text-[12px]">
													<AvatarFallback>
														A
													</AvatarFallback>
												</Avatar>
												<div>
													<CardTitle className="text-base">
														Author
													</CardTitle>
													<CardDescription className="mt-1 text-sm">
														{
															PERMISSION_DESCRIPTION_MAP[
																type
															].author
														}
													</CardDescription>
												</div>
											</div>
											<RadioGroupItem value="OWNER" />
										</div>
									</CardHeader>
								</Card>

								<Card className="rounded-xl">
									<CardHeader className="pb-4">
										<div className="flex items-start justify-between">
											<div className="flex items-start gap-3">
												<div className="mt-0.5 inline-flex text-black/50">
													<Edit className="size-[22px]" />
												</div>
												<div>
													<CardTitle className="text-base">
														Editor
													</CardTitle>
													<CardDescription className="mt-1 text-sm">
														{
															PERMISSION_DESCRIPTION_MAP[
																type
															].editor
														}
													</CardDescription>
												</div>
											</div>
											<RadioGroupItem value="EDIT" />
										</div>
									</CardHeader>
								</Card>

								<Card className="rounded-xl">
									<CardHeader className="pb-4">
										<div className="flex items-start justify-between">
											<div className="flex items-start gap-3">
												<div className="mt-0.5 inline-flex text-black/50">
													<Eye className="size-[22px]" />
												</div>
												<div>
													<CardTitle className="text-base">
														Read-Only
													</CardTitle>
													<CardDescription className="mt-1 text-sm">
														{
															PERMISSION_DESCRIPTION_MAP[
																type
															].readonly
														}
													</CardDescription>
												</div>
											</div>
											<RadioGroupItem value="READ_ONLY" />
										</div>
									</CardHeader>
								</Card>
							</div>
						</RadioGroup>

						<div className="space-y-2">
							<Label>Comment:</Label>
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
