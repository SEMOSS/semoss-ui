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
						>
							<div className="space-y-2">
								<Card className="m-2 rounded-xl p-2">
									<CardHeader className="px-2">
										<div className="flex flex-col gap-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<Avatar className="h-5 w-5 font-bold text-xs">
														<AvatarFallback className="bg-black/50 text-white">
															A
														</AvatarFallback>
													</Avatar>
													<CardTitle className="text-base">
														Author
													</CardTitle>
												</div>
												<RadioGroupItem value="OWNER" />
											</div>
											<CardDescription className="ml-8 text-sm">
												{
													PERMISSION_DESCRIPTION_MAP[
														type
													].author
												}
											</CardDescription>
										</div>
									</CardHeader>
								</Card>

								<Card className="m-2 rounded-xl p-2">
									<CardHeader className="px-2">
										<div className="flex flex-col gap-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="flex h-6 w-6 items-center justify-center text-black/50">
														<Edit className="h-5 w-5" />
													</div>
													<CardTitle className="text-base">
														Editor
													</CardTitle>
												</div>
												<RadioGroupItem value="EDIT" />
											</div>
											<CardDescription className="ml-9 text-sm">
												{
													PERMISSION_DESCRIPTION_MAP[
														type
													].editor
												}
											</CardDescription>
										</div>
									</CardHeader>
								</Card>

								<Card className="m-2 rounded-xl p-2">
									<CardHeader className="px-2">
										<div className="flex flex-col gap-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="flex h-6 w-6 items-center justify-center text-black/50">
														<Eye className="h-5 w-5" />
													</div>
													<CardTitle className="text-base">
														Read-Only
													</CardTitle>
												</div>
												<RadioGroupItem value="READ_ONLY" />
											</div>
											<CardDescription className="ml-9 text-sm">
												{
													PERMISSION_DESCRIPTION_MAP[
														type
													].readonly
												}
											</CardDescription>
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
