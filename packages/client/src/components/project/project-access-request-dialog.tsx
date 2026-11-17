import { Ban, Eye, Pencil, User } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { Role } from "@semoss/sdk";
import { runPixel, usePixel } from "@semoss/sdk/react";
import type { CatalogDependency, Project } from "@semoss/shared";
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
	Field,
	FieldLabel,
	RadioGroup,
	RadioGroupItem,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { MyAccessRequest } from "@/api/user-access";
import OPEN_AI from "@/assets/img/OPEN_AI.svg";
import { PERMISSION_DESCRIPTION_MAP } from "@/constants";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";

interface ProjectAccessRequestDialogProps {
	/** Project details */
	project: Project;

	/** Current role of the user */
	permission: Role;

	/** Track if the dialog is open */
	open: boolean;

	/** Callback that is fired on close */
	onClose: (success: boolean) => void;

	/**
	 * The user's own request that waits for a decision, or null. With one, the
	 * dialog starts from the level and reason it gives, so the user changes it.
	 */
	request?: MyAccessRequest | null;
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

export const ProjectAccessRequestDialog = ({
	project,
	permission,
	open,
	onClose,
	request = null,
}: ProjectAccessRequestDialogProps) => {
	const [tabValue, setTabValue] = useState("permissions");
	const [requestedDeps, setRequestedDeps] = useState<Set<string>>(new Set());
	const [requestedPermission, setRequestedPermission] = useState<Role | "">(
		"",
	);
	const [roleChangeComment, setRoleChangeComment] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const getDependencies = usePixel<{
		dependencies: CatalogDependency[];
		dependencyIds: string[];
	}>(
		open
			? `GetCatalogDependencies(catalogId="${project.project_id}", catalogType="${project.project_type}");`
			: "",
		{
			data: {
				dependencies: [],
				dependencyIds: [],
			},
		},
	);
	const dependencies: CatalogDependency[] =
		getDependencies.data?.dependencies ?? [];

	const isAllRequested = useMemo(() => {
		return dependencies.every((dep) => requestedDeps.has(dep.catalog_id));
	}, [dependencies, requestedDeps]);

	/**
	 * Request access for a single dependency.
	 * @param depId
	 * @returns
	 */
	const handleSingleDependencyRequest = async (depId: string) => {
		try {
			setIsLoading(true);

			if (!requestedPermission) {
				toast.error(
					"Please select a permission role on the first tab before requesting access.",
				);
				setTabValue("permissions");
				return;
			}

			const response = await runPixel(
				`META | RequestEngine(engine=['${depId}'], permission=['${requestedPermission}']${
					roleChangeComment
						? `, comment=["<encode>${roleChangeComment}</encode>"]`
						: ""
				})`,
			);

			const { pixelReturn } = response;
			const r = pixelReturn[0];
			if (r.operationType.indexOf("ERROR") === -1) {
				setRequestedDeps((prev) => new Set(prev).add(depId));
				toast.success(`Dependency ${depId}: ${r.output}`);
			} else {
				toast.error(`Dependency ${depId}: ${r.output}`);
			}
		} catch (e) {
			toast.error(
				getErrorMessage(e, "Request failed for the dependency."),
			);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Request access for all dependencies that do not have the requested permission and have not been requested yet.
	 * @returns
	 */
	const handleRequestAllAccess = async () => {
		setIsLoading(true);

		try {
			if (!requestedPermission) {
				toast.error(
					"Please select a permission role on the first tab before requesting access.",
				);
				setTabValue("permissions");
				return;
			}

			const dependenciesToRequest = dependencies.filter(
				(dep) =>
					dep.permission_name !== requestedPermission &&
					!requestedDeps.has(dep.catalog_id),
			);

			if (dependenciesToRequest.length === 0) {
				toast.info("No new dependencies require access request.");
				return;
			}

			let pixel = ``;
			for (const dep of dependenciesToRequest) {
				pixel += `META | RequestEngine(engine=['${dep.catalog_id}'], permission=['${requestedPermission}']${
					roleChangeComment
						? `, comment=["<encode>${roleChangeComment}</encode>"]`
						: ""
				})`;
			}

			const response = await runPixel(pixel);
			const { pixelReturn } = response;

			for (const [rIdx, r] of pixelReturn.entries()) {
				if (r.operationType.indexOf("ERROR") === -1) {
					setRequestedDeps((prev) =>
						new Set(prev).add(
							dependenciesToRequest[rIdx].catalog_id,
						),
					);
					toast.success(
						`Dependency ${dependenciesToRequest[rIdx].catalog_id}: ${r.output}`,
					);
				} else {
					toast.error(
						`Dependency ${dependenciesToRequest[rIdx].catalog_id}: ${r.output}`,
					);
				}
			}
		} catch (e) {
			toast.error(
				getErrorMessage(e, "Request failed for the dependency."),
			);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Change access for the project.
	 * @returns
	 */
	const handleChangeAccess = async () => {
		const current = permission;
		const requested = requestedPermission;
		const comment = roleChangeComment;
		const id = project.project_id;

		if (requested === current || requested === "") {
			toast.error(
				"No change in Access has been requested. Please select another and try again.",
			);
			return;
		}

		try {
			setIsLoading(true);

			const response = await runPixel(
				`RequestProject(project=['${id}'], permission=['${requested}'], comment=["<encode>${comment}</encode>"])`,
			);

			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				toast.error(String(output));
				return;
			}

			toast.success(String(output));
			onClose(true);
		} catch (_e) {
			toast.error("Request failed.");
			onClose(false);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (!open) {
			return;
		}

		setRequestedPermission(request?.permission ?? permission);
		setRoleChangeComment(
			request?.comment ??
				`I am requesting access to for [please provide a reason]`,
		);
		setRequestedDeps(new Set());
		setTabValue("permissions");
	}, [open, permission, request]);

	return (
		<Dialog
			open={open}
			onOpenChange={(open) => {
				if (!open) {
					onClose(false);
					setTabValue("permissions");
				}
			}}
		>
			<DialogContent
				aria-describedby={undefined}
				className="max-h-[90vh] overflow-auto sm:max-w-2xl"
			>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						{permission === "DISCOVERABLE"
							? "Request Access"
							: "Change Access"}
					</DialogTitle>
				</DialogHeader>

				<Tabs value={tabValue} onValueChange={setTabValue}>
					{permission !== "DISCOVERABLE" ? (
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
						<RadioGroup
							value={requestedPermission}
							onValueChange={(value) => {
								setRequestedPermission(
									value as
										| "OWNER"
										| "EDIT"
										| "READ_ONLY"
										| "",
								);
							}}
							className="space-y-2"
						>
							<PermissionCard
								icon={<User className="size-4" />}
								title="Author"
								description={
									PERMISSION_DESCRIPTION_MAP.PROJECT.author
								}
								value="OWNER"
							/>
							<PermissionCard
								icon={<Pencil className="size-4" />}
								title="Editor"
								description={
									PERMISSION_DESCRIPTION_MAP.PROJECT.editor
								}
								value="EDIT"
							/>
							<PermissionCard
								icon={<Eye className="size-4" />}
								title="Read-Only"
								description={
									PERMISSION_DESCRIPTION_MAP.PROJECT.readonly
								}
								value="READ_ONLY"
							/>
						</RadioGroup>

						<Field>
							<FieldLabel>Request Comment (Optional)</FieldLabel>
							<Textarea
								rows={3}
								placeholder="Optional"
								value={roleChangeComment ?? ""}
								onChange={(event) => {
									setRoleChangeComment(event.target.value);
								}}
							/>
						</Field>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => onClose(false)}
							>
								Cancel
							</Button>
							{permission !== "DISCOVERABLE" ? (
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

					{permission !== "DISCOVERABLE" ? (
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
										isLoading ||
										dependencies.some(
											(dep) => dep.access_permission,
										)
									}
								>
									{isLoading
										? "Requesting..."
										: "Request All Access"}
								</Button>
							</div>

							<div className="space-y-3">
								{dependencies.map((dep) => (
									<div
										key={dep.catalog_id}
										className="flex flex-col gap-3 rounded-xl border bg-background p-4"
									>
										<div className="flex flex-wrap items-start justify-between gap-4">
											<div className="flex items-start gap-4">
												<img
													src={OPEN_AI}
													alt={dep.catalog_name}
													className="h-12 w-12 rounded-lg object-cover"
												/>
												<div className="space-y-1">
													<Link
														to={`${getDependencyTypeConfig(dep.catalog_type).route}/${dep.catalog_id}`}
														className="text-primary"
													>
														<p className="font-medium text-sm">
															{dep.catalog_name}
														</p>
													</Link>
													<PermissionBadge
														permission={
															dep.permission_name
														}
													/>
												</div>
											</div>

											<div className="flex flex-wrap items-center gap-2">
												{dep.catalog_global ? (
													<Badge variant="outline">
														Public
													</Badge>
												) : dep.catalog_discoverable ? (
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
													{
														getDependencyTypeConfig(
															dep.catalog_type,
														).label
													}
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
											requestedDeps.has(
												dep.catalog_id,
											) ? (
												<Button
													variant="outline"
													disabled
												>
													Pending Access
												</Button>
											) : !dep.permission_name ? (
												<Button
													variant="outline"
													onClick={() =>
														handleSingleDependencyRequest(
															dep.catalog_id,
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
															dep.catalog_id,
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
