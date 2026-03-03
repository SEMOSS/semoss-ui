import { Ban, Eye, Pencil, User } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { Link } from "react-router-dom";
import {
	Badge,
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
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	toast,
} from "@semoss/ui/next";
import OPEN_AI from "@/assets/img/OPEN_AI.png";
import type { modelledDependency } from "@/components/app";
import { PERMISSION_DESCRIPTION_MAP } from "@/constants";
import { useRootStore } from "@/hooks";
import type { AppDetailsFormTypes } from "./app-details.utility";

interface ChangeAccessModalProps {
	open: boolean;
	onClose: (refresh?: boolean) => void;
	control: Control<AppDetailsFormTypes>;
	getValues;
	dependencies: modelledDependency[];
	onSuccess: () => void;
	permission: string;
}

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

const PermissionBadge = ({ permission }: { permission?: string }) => {
	let Icon = Ban;
	if (permission === "OWNER") {
		Icon = User;
	} else if (permission === "EDIT") {
		Icon = Pencil;
	} else if (permission === "READ_ONLY") {
		Icon = Eye;
	}

	const label = permission
		? permission.charAt(0) + permission.slice(1).toLowerCase()
		: "None";

	return (
		<div className="flex items-center gap-2 text-muted-foreground text-xs">
			<Icon className="size-3.5" />
			<span>{label}</span>
		</div>
	);
};

export const ChangeAccessModal = (props: ChangeAccessModalProps) => {
	const {
		open,
		onClose,
		control,
		getValues,
		dependencies,
		onSuccess,
		permission,
	} = props;
	const permissionDescriptions = PERMISSION_DESCRIPTION_MAP.PROJECT;
	const { monolithStore } = useRootStore();
	const [tabValue, setTabValue] = useState("permissions");
	const [requestedDeps, setRequestedDeps] = useState<Set<string>>(new Set());

	const requestAccessForDependency = async (
		depId: string,
		requestedRole: string,
		comment?: string,
	) => {
		try {
			const res = await monolithStore.runQuery(
				`META | RequestEngine(engine=['${depId}'], permission=['${requestedRole}']${
					comment ? `, comment=['${comment}']` : ""
				})`,
			);
			const { operationType, output } = res.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				return { depId, success: false, message: output };
			} else {
				return { depId, success: true, message: output };
			}
		} catch (error) {
			return {
				depId,
				success: false,
				message: (error as Error).message,
			};
		}
	};

	const handleChangeAccess = async () => {
		const current = getValues("permission");
		const requested = getValues("requestedPermission");
		const comment = getValues("roleChangeComment");
		const id = getValues("appId");

		if (requested === current || requested === "") {
			toast.error(
				"No change in Access has been requested. Please select another and try again.",
			);
			return;
		}

		try {
			const res = await monolithStore.runQuery(
				`RequestProject(project=['${id}'], permission=['${requested}'], comment=['${comment}'])`,
			);

			const { operationType, output } = res.pixelReturn[0];

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(String(output));
				return;
			}

			toast.success(String(output));

			onSuccess();
			onClose(true); // Close modal after successful RequestProject call
		} catch (_e) {
			toast.error("Request failed.");
		}
	};

	const [isRequestAllLoading, setIsRequestAllLoading] = useState(false);

	const isAllRequested = useMemo(() => {
		return dependencies.every((dep) => requestedDeps.has(dep.id));
	}, [dependencies, requestedDeps]);

	const handleRequestAllAccess = async () => {
		setIsRequestAllLoading(true);
		try {
			const requestedRole = getValues("requestedPermission");
			const comment = getValues("roleChangeComment");

			if (!requestedRole || requestedRole === "") {
				toast.error(
					"Please select a permission role on the first tab before requesting access.",
				);
				setTabValue("permissions");
				return;
			}

			const dependenciesToRequest = dependencies.filter(
				(dep) =>
					dep.userPermission !== requestedRole &&
					!requestedDeps.has(dep.id),
			);

			if (dependenciesToRequest.length === 0) {
				toast.info("No new dependencies require access request.");
				return;
			}

			const promises = dependenciesToRequest.map((dep) =>
				requestAccessForDependency(dep.id, requestedRole, comment),
			);

			const results = await Promise.allSettled(promises);
			results.forEach((result) => {
				if (result.status === "fulfilled") {
					const { depId, success, message } = result.value;
					if (success) {
						setRequestedDeps((prev) => new Set(prev).add(depId));
						toast.success(`Dependency ${depId}: ${message}`);
					} else {
						toast.error(`Dependency ${depId}: ${message}`);
					}
				} else {
					toast.error("Request failed for a dependency.");
				}
			});
		} finally {
			setIsRequestAllLoading(false);
		}
	};

	// Handle single dependency request button click
	const handleSingleDependencyRequest = async (depId: string) => {
		const requestedRole = getValues("requestedPermission");
		const comment = getValues("roleChangeComment");

		if (!requestedRole || requestedRole === "") {
			toast.error(
				"Please select a permission role on the first tab before requesting access.",
			);
			setTabValue("permissions");
			return;
		}

		const { success, message } = await requestAccessForDependency(
			depId,
			requestedRole,
			comment,
		);

		if (success) {
			setRequestedDeps((prev) => new Set(prev).add(depId));
			toast.success(`Dependency ${depId}: ${message}`);
			// onSuccess();
		} else {
			toast.error(`Dependency ${depId}: ${message}`);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose(false);
					setTabValue("permissions");
				}
			}}
		>
			<DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{getValues("requestedPermission") === "discoverable"
							? "Request Access"
							: "Change Access"}
					</DialogTitle>
				</DialogHeader>

				<Tabs value={tabValue} onValueChange={setTabValue}>
					{permission !== "discoverable" ? (
						<TabsList className="mb-4">
							<TabsTrigger value="permissions">
								App Permissions
							</TabsTrigger>
							<TabsTrigger value="dependencies">
								Dependency Permissions
							</TabsTrigger>
						</TabsList>
					) : null}

					<TabsContent value="permissions" className="space-y-4">
						<Controller
							name="requestedPermission"
							control={control}
							render={({ field }) => (
								<RadioGroup
									value={field.value}
									onValueChange={field.onChange}
									className="space-y-2"
								>
									<PermissionCard
										icon={<User className="size-4" />}
										title="Author"
										description={
											permissionDescriptions.author
										}
										value="OWNER"
									/>
									<PermissionCard
										icon={<Pencil className="size-4" />}
										title="Editor"
										description={
											permissionDescriptions.editor
										}
										value="EDIT"
									/>
									<PermissionCard
										icon={<Eye className="size-4" />}
										title="Read-Only"
										description={
											permissionDescriptions.readonly
										}
										value="READ_ONLY"
									/>
								</RadioGroup>
							)}
						/>

						<div className="space-y-2">
							<Label>Reason For Access</Label>
							<Controller
								name="roleChangeComment"
								control={control}
								render={({ field }) => (
									<Textarea
										rows={3}
										placeholder="Optional"
										value={field.value ?? ""}
										onChange={(event) =>
											field.onChange(event.target.value)
										}
									/>
								)}
							/>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => onClose(false)}
							>
								Cancel
							</Button>
							{permission !== "discoverable" ? (
								<Button
									onClick={() => setTabValue("dependencies")}
								>
									Next
								</Button>
							) : (
								<Button onClick={handleChangeAccess}>
									Submit
								</Button>
							)}
						</DialogFooter>
					</TabsContent>

					{permission !== "discoverable" ? (
						<TabsContent value="dependencies" className="space-y-4">
							<p className="text-muted-foreground text-sm">
								The app will not work for you without having at
								least read-only access to the following
								dependencies. Click request access to be
								provisioned as a read-only user.
							</p>

							<div className="flex justify-end">
								<Button
									variant="outline"
									onClick={handleRequestAllAccess}
									disabled={
										isAllRequested ||
										isRequestAllLoading ||
										dependencies.some(
											(dep) => dep.access_permission,
										)
									}
								>
									{isRequestAllLoading
										? "Requesting..."
										: "Request All Access"}
								</Button>
							</div>

							<div className="space-y-3">
								{dependencies.map((dep) => (
									<div
										key={dep.id}
										className="flex flex-col gap-3 rounded-xl border bg-background p-4"
									>
										<div className="flex flex-wrap items-start justify-between gap-4">
											<div className="flex items-start gap-4">
												<img
													src={OPEN_AI}
													alt={dep.name}
													className="h-12 w-12 rounded-lg object-cover"
												/>
												<div className="space-y-1">
													<Link
														to={`/engine/${dep.type}/${dep.id}`}
														className="text-primary"
													>
														<p className="font-medium text-sm">
															{dep.name}
														</p>
													</Link>
													<PermissionBadge
														permission={
															dep.userPermission
														}
													/>
												</div>
											</div>

											<div className="flex flex-wrap items-center gap-2">
												{dep.isPublic ? (
													<Badge variant="outline">
														Public
													</Badge>
												) : dep.isDiscoverable ? (
													<Badge variant="outline">
														Discoverable
													</Badge>
												) : (
													<>
														<Badge variant="outline">
															Non-Discoverable
														</Badge>
														<Badge variant="outline">
															Private
														</Badge>
													</>
												)}
												<Badge variant="outline">
													{dep.type}
												</Badge>
											</div>
										</div>

										<p className="text-muted-foreground text-sm">
											{dep.description?.trim()
												? dep.description
												: "No Description Available"}
										</p>

										<div className="flex justify-end">
											{dep.access_permission ||
											requestedDeps.has(dep.id) ? (
												<Button
													variant="outline"
													disabled
												>
													Pending Access
												</Button>
											) : !dep.userPermission ? (
												<Button
													variant="outline"
													onClick={() =>
														handleSingleDependencyRequest(
															dep.id,
														)
													}
												>
													Request Access
												</Button>
											) : (
												<Button
													variant="outline"
													onClick={() =>
														handleSingleDependencyRequest(
															dep.id,
														)
													}
												>
													Change Access
												</Button>
											)}
										</div>
									</div>
								))}
							</div>

							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => {
										onClose(false);
										setTabValue("permissions");
									}}
								>
									Cancel
								</Button>
								<Button onClick={handleChangeAccess}>
									Submit
								</Button>
							</DialogFooter>
						</TabsContent>
					) : null}
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
