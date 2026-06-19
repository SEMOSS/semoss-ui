import {
	ArrowUpRight,
	Calendar,
	Clock,
	ExternalLink,
	GitBranch,
	Github,
	Plus,
	RefreshCw,
	Trash2,
	User,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { Env } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldError,
	FieldLabel,
	Input,
	RadioGroup,
	RadioGroupItem,
	Spinner,
	toast,
} from "@semoss/ui/next";
import {
	type GithubProjectLink,
	getAllProjectLinks,
	repoHtmlUrl,
} from "@/api/github";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

interface GitHubManifestApp {
	appId?: string;
	slug?: string;
	appName?: string;
	ownerLogin?: string;
	htmlUrl?: string;
	webhookUrl?: string;
	clientId?: string;
	createdOn?: string;
	updatedOn?: string;
}

interface GitHubManifestAppsResponse {
	apps?: GitHubManifestApp[];
}

interface CreateGitHubAppFormValues {
	appName: string;
	createUnder: "account" | "organization";
	organization: string;
	visibility: "public" | "private";
}

const CREATE_FORM_DEFAULTS: CreateGitHubAppFormValues = {
	appName: "",
	createUnder: "account",
	organization: "",
	visibility: "private",
};

export const GitHubAppPage = () => {
	const { configStore } = useRootStore();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { t } = useTranslation("githubApp");
	const [apps, setApps] = useState<GitHubManifestApp[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isForbidden, setIsForbidden] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [appToDelete, setAppToDelete] = useState<GitHubManifestApp | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const [projects, setProjects] = useState<GithubProjectLink[]>([]);
	const [isProjectsLoading, setIsProjectsLoading] = useState(true);
	const appNameId = useId();
	const organizationId = useId();
	const accountId = useId();
	const orgId = useId();
	const publicId = useId();
	const privateId = useId();
	const {
		control,
		formState: { isSubmitting },
		handleSubmit,
		reset,
		watch,
	} = useForm<CreateGitHubAppFormValues>({
		defaultValues: CREATE_FORM_DEFAULTS,
	});
	const createUnder = watch("createUnder");
	const isAdmin = configStore.store.user.admin === true;

	const formatDate = (rawDate?: string) => {
		if (!rawDate) {
			return t("list.unknownDate");
		}

		const parsedDate = new Date(rawDate);
		if (Number.isNaN(parsedDate.getTime())) {
			return rawDate;
		}

		return parsedDate.toLocaleString();
	};

	const formatDateOnly = (rawDate?: string) => {
		if (!rawDate) {
			return t("list.unknownDate");
		}

		const parsedDate = new Date(rawDate);
		if (Number.isNaN(parsedDate.getTime())) {
			return rawDate;
		}

		return parsedDate.toLocaleDateString();
	};

	// Middle-truncate a long project id (GUID) for display, keeping the head and
	// tail recognizable. The full id is shown on hover via the title attribute.
	const truncateId = (id: string) =>
		id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-6)}` : id;

	const fetchGitHubApps = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`${Env.MODULE}/github/manifest/apps`, {
				method: "GET",
				credentials: "include",
				headers: {
					Accept: "application/json",
				},
			});

			if (response.status === 401 || response.status === 403) {
				setIsForbidden(true);
				setApps([]);
				toast.error(t("toasts.notPermitted"));
				return;
			}

			if (!response.ok) {
				throw new Error(
					`Failed to fetch GitHub apps. Status: ${response.status}`,
				);
			}

			const data = (await response.json()) as GitHubManifestAppsResponse;
			setApps(Array.isArray(data.apps) ? data.apps : []);
			setIsForbidden(false);
		} catch (error) {
			console.error("Error fetching GitHub apps:", error);
			setApps([]);
			setIsForbidden(false);
			toast.error(t("toasts.loadFailed"));
		} finally {
			setIsLoading(false);
		}
	}, [t]);

	const fetchProjects = useCallback(async () => {
		setIsProjectsLoading(true);
		try {
			setProjects(await getAllProjectLinks());
		} catch (error) {
			// The apps fetch already surfaces auth errors; avoid a duplicate toast.
			console.error("Error fetching linked projects:", error);
			setProjects([]);
		} finally {
			setIsProjectsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!isAdmin) {
			return;
		}

		fetchGitHubApps();
		fetchProjects();
	}, [fetchGitHubApps, fetchProjects, isAdmin]);

	// React to the create flow's redirect (?githubApp=created|error&reason=...).
	// The backend manifest callback bounces the admin back here, so surface the
	// outcome once and then strip the params so a refresh doesn't re-toast.
	const handledRedirectRef = useRef(false);
	useEffect(() => {
		if (handledRedirectRef.current) {
			return;
		}
		const status = searchParams.get("githubApp");
		if (!status) {
			return;
		}
		handledRedirectRef.current = true;

		if (status === "created") {
			toast.success(t("toasts.createSuccess"));
		} else if (status === "error") {
			const reason = searchParams.get("reason");
			const key =
				reason === "conversion_failed"
					? "toasts.createErrorConversion"
					: reason === "save_failed"
						? "toasts.createErrorSave"
						: "toasts.createError";
			toast.error(t(key));
		}

		const next = new URLSearchParams(searchParams);
		next.delete("githubApp");
		next.delete("reason");
		setSearchParams(next, { replace: true });
	}, [searchParams, setSearchParams, t]);

	const onCreateDialogOpenChange = (open: boolean) => {
		setIsCreateDialogOpen(open);
		if (!open) {
			reset(CREATE_FORM_DEFAULTS);
		}
	};

	const submitCreateGitHubApp = handleSubmit((values) => {
		const manifestUrl = new URL(
			`${Env.MODULE}/github/manifest/new`,
			window.location.origin,
		);
		const appName = values.appName.trim();
		const organization = values.organization.trim();

		if (appName) {
			manifestUrl.searchParams.set("name", appName);
		}

		if (values.createUnder === "organization" && organization) {
			manifestUrl.searchParams.set("org", organization);
		}

		manifestUrl.searchParams.set(
			"public",
			values.visibility === "public" ? "true" : "false",
		);

		toast.info(t("toasts.redirecting"));
		window.location.assign(manifestUrl.toString());
	});

	const deleteGitHubApp = async () => {
		if (!appToDelete) {
			return;
		}

		setIsDeleting(true);
		try {
			const deleteUrl = new URL(
				`${Env.MODULE}/github/manifest/app`,
				window.location.origin,
			);
			if (appToDelete.appId) {
				deleteUrl.searchParams.set("appId", appToDelete.appId);
			}

			const response = await fetch(deleteUrl.toString(), {
				method: "DELETE",
				credentials: "include",
				headers: {
					Accept: "application/json",
				},
			});

			if (response.status === 401 || response.status === 403) {
				toast.error(t("toasts.notPermitted"));
				return;
			}

			const data = (await response.json().catch(() => null)) as {
				status?: string;
				reason?: string;
				message?: string;
			} | null;

			if (!response.ok || data?.status !== "ok") {
				toast.error(data?.reason || t("toasts.deleteFailed"));
				return;
			}

			toast.success(data.message || t("toasts.deleteSuccess"));
			setAppToDelete(null);
			// Removing the app also drops its project links server-side, so
			// refresh both lists.
			await Promise.all([fetchGitHubApps(), fetchProjects()]);
		} catch (error) {
			console.error("Error deleting GitHub app:", error);
			toast.error(t("toasts.deleteFailed"));
		} finally {
			setIsDeleting(false);
		}
	};

	if (!isAdmin) {
		return <Navigate to="/settings" />;
	}

	return (
		<>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-1">
					<h2 className="font-semibold text-lg">
						{t("header.title")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("header.description")}
					</p>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2">
					<h3 className="font-medium text-base">{t("list.title")}</h3>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => {
								fetchGitHubApps();
								fetchProjects();
							}}
							disabled={isLoading}
						>
							<RefreshCw className="mr-2 size-4" />
							{t("buttons.refresh")}
						</Button>
						<Button onClick={() => setIsCreateDialogOpen(true)}>
							<Plus className="mr-2 size-4" />
							{t("buttons.create")}
						</Button>
					</div>
				</div>

				{isLoading ? (
					<div className="flex items-center gap-2 py-6 text-muted-foreground">
						<Spinner className="size-4" />
						<span>{t("status.loading")}</span>
					</div>
				) : null}

				{!isLoading && isForbidden ? (
					<div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
						{t("status.notPermitted")}
					</div>
				) : null}

				{!isLoading && !isForbidden && apps.length === 0 ? (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<div className="font-medium text-base">
							{t("list.emptyTitle")}
						</div>
						<p className="mt-1 text-muted-foreground text-sm">
							{t("list.emptyDescription")}
						</p>
						<div className="mt-4">
							<Button onClick={() => setIsCreateDialogOpen(true)}>
								<Plus className="mr-2 size-4" />
								{t("buttons.create")}
							</Button>
						</div>
					</div>
				) : null}

				{!isLoading && !isForbidden && apps.length > 0 ? (
					<div className="flex flex-col gap-3">
						{apps.map((app, idx) => {
							const appDisplayName =
								app.appName || app.slug || app.appId || "";
							const appKey =
								app.appId || app.slug || `app-${idx}`;

							return (
								<div
									key={appKey}
									className="rounded-lg border bg-card p-4"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="flex min-w-0 items-start gap-3">
											<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
												<Github className="size-5" />
											</div>
											<div className="flex min-w-0 flex-col gap-0.5">
												<div className="flex items-center gap-2">
													<h4 className="truncate font-semibold text-base">
														{appDisplayName}
													</h4>
													<Badge
														variant="outline"
														className="shrink-0 border-green-600/30 bg-green-600/10 text-green-600 dark:text-green-500"
													>
														{t("list.connected")}
													</Badge>
												</div>
												{app.appId ? (
													<p className="text-muted-foreground text-sm">
														{t("list.appId", {
															appId: app.appId,
														})}
													</p>
												) : null}
											</div>
										</div>
										<div className="flex items-center gap-2">
											{app.htmlUrl ? (
												<Button
													asChild
													variant="outline"
													size="sm"
												>
													<a
														href={app.htmlUrl}
														target="_blank"
														rel="noreferrer"
													>
														<ExternalLink className="mr-2 size-4" />
														{t("list.openInGithub")}
													</a>
												</Button>
											) : null}
											<Button
												variant="destructive"
												size="sm"
												onClick={() =>
													setAppToDelete(app)
												}
											>
												<Trash2 className="mr-2 size-4" />
												{t("buttons.remove")}
											</Button>
										</div>
									</div>

									<div className="my-4 border-t" />

									<div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
										<div className="flex items-center gap-1.5">
											<User className="size-4 text-muted-foreground" />
											<span className="text-muted-foreground">
												{t("list.owner")}
											</span>
											<span>{app.ownerLogin || "-"}</span>
										</div>
										<div className="flex items-center gap-1.5">
											<Calendar className="size-4 text-muted-foreground" />
											<span className="text-muted-foreground">
												{t("list.createdOn")}
											</span>
											<span>
												{formatDateOnly(app.createdOn)}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : null}

				{!isForbidden ? (
					<div className="flex flex-col gap-3">
						<h3 className="font-medium text-base">
							{t("projects.title")}
						</h3>
						{isProjectsLoading ? (
							<div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
								<Spinner className="size-4" />
								<span>{t("projects.loading")}</span>
							</div>
						) : projects.length === 0 ? (
							<div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
								{t("projects.empty")}
							</div>
						) : (
							<div className="flex flex-col gap-2">
								{projects.map((project) => (
									<div
										key={project.projectId}
										className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"
									>
										<div className="flex min-w-0 items-start gap-3">
											<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
												<GitBranch className="size-5" />
											</div>
											<div className="flex min-w-0 flex-col gap-0.5">
												{project.repoFullName ? (
													<a
														href={repoHtmlUrl(
															project.repoFullName,
														)}
														target="_blank"
														rel="noreferrer"
														className="flex items-center gap-1.5 font-medium hover:underline"
													>
														{project.repoFullName}
														<ExternalLink className="size-3.5" />
													</a>
												) : (
													<span className="font-medium">
														{t(
															"projects.unknownRepo",
														)}
													</span>
												)}
												<span
													className="truncate text-muted-foreground text-xs"
													title={project.projectId}
												>
													{truncateId(
														project.projectId,
													)}
												</span>
											</div>
										</div>
										<div className="flex flex-col items-end gap-2">
											<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
												<Clock className="size-3.5" />
												{t("projects.lastOpened", {
													date: formatDate(
														project.updatedOn ||
															project.createdOn,
													),
												})}
											</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													navigate(
														`/app/${project.projectId}/github`,
													)
												}
											>
												{t("projects.openTab")}
												<ArrowUpRight className="ml-2 size-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				) : null}
			</div>

			<Dialog
				open={isCreateDialogOpen}
				onOpenChange={onCreateDialogOpenChange}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t("dialog.title")}</DialogTitle>
						<DialogDescription>
							{t("dialog.description")}
						</DialogDescription>
					</DialogHeader>

					<form
						className="flex flex-col gap-4"
						onSubmit={submitCreateGitHubApp}
					>
						<Field>
							<FieldLabel htmlFor={appNameId}>
								{t("dialog.appNameLabel")}
							</FieldLabel>
							<Controller
								name="appName"
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										id={appNameId}
										placeholder={t(
											"dialog.appNamePlaceholder",
										)}
									/>
								)}
							/>
						</Field>

						<Field>
							<FieldLabel>
								{t("dialog.createUnderLabel")}
							</FieldLabel>
							<Controller
								name="createUnder"
								control={control}
								render={({ field }) => (
									<RadioGroup
										value={field.value}
										onValueChange={(value) =>
											field.onChange(
												value as CreateGitHubAppFormValues["createUnder"],
											)
										}
									>
										<Field
											orientation="horizontal"
											className="items-center gap-2"
										>
											<RadioGroupItem
												id={accountId}
												value="account"
											/>
											<FieldLabel htmlFor={accountId}>
												{t("dialog.myAccount")}
											</FieldLabel>
										</Field>
										<Field
											orientation="horizontal"
											className="items-center gap-2"
										>
											<RadioGroupItem
												id={orgId}
												value="organization"
											/>
											<FieldLabel htmlFor={orgId}>
												{t("dialog.organization")}
											</FieldLabel>
										</Field>
									</RadioGroup>
								)}
							/>
						</Field>

						{createUnder === "organization" ? (
							<Field>
								<FieldLabel htmlFor={organizationId}>
									{t("dialog.organizationLabel")}
								</FieldLabel>
								<Controller
									name="organization"
									control={control}
									rules={{
										validate: (value) => {
											if (
												createUnder !== "organization"
											) {
												return true;
											}

											return (
												value.trim().length > 0 ||
												t(
													"validation.organizationRequired",
												)
											);
										},
									}}
									render={({
										field,
										fieldState: { error },
									}) => (
										<>
											<Input
												{...field}
												id={organizationId}
												placeholder={t(
													"dialog.organizationPlaceholder",
												)}
												aria-invalid={!!error}
											/>
											{error ? (
												<FieldError>
													{error.message}
												</FieldError>
											) : null}
										</>
									)}
								/>
							</Field>
						) : null}

						<Field>
							<FieldLabel>
								{t("dialog.visibilityLabel")}
							</FieldLabel>
							<Controller
								name="visibility"
								control={control}
								render={({ field }) => (
									<RadioGroup
										value={field.value}
										onValueChange={(value) =>
											field.onChange(
												value as CreateGitHubAppFormValues["visibility"],
											)
										}
									>
										<Field
											orientation="horizontal"
											className="items-center gap-2"
										>
											<RadioGroupItem
												id={privateId}
												value="private"
											/>
											<FieldLabel htmlFor={privateId}>
												{t("dialog.private")}
											</FieldLabel>
										</Field>
										<Field
											orientation="horizontal"
											className="items-center gap-2"
										>
											<RadioGroupItem
												id={publicId}
												value="public"
											/>
											<FieldLabel htmlFor={publicId}>
												{t("dialog.public")}
											</FieldLabel>
										</Field>
									</RadioGroup>
								)}
							/>
							<p className="text-muted-foreground text-sm">
								{t("dialog.visibilityHelp")}
							</p>
						</Field>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onCreateDialogOpenChange(false)}
								disabled={isSubmitting}
							>
								{t("buttons.cancel")}
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting
									? t("buttons.creating")
									: t("buttons.create")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={appToDelete !== null}
				onOpenChange={(open) => {
					if (!open && !isDeleting) {
						setAppToDelete(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t("deleteDialog.title")}</DialogTitle>
						<DialogDescription>
							{t("deleteDialog.description", {
								appName:
									appToDelete?.appName ||
									appToDelete?.slug ||
									appToDelete?.appId ||
									"",
							})}
						</DialogDescription>
					</DialogHeader>

					{appToDelete?.htmlUrl ? (
						<Button
							asChild
							variant="outline"
							size="sm"
							className="self-start"
						>
							<a
								href={appToDelete.htmlUrl}
								target="_blank"
								rel="noreferrer"
							>
								<ExternalLink className="mr-2 size-4" />
								{t("deleteDialog.openInGithub")}
							</a>
						</Button>
					) : null}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setAppToDelete(null)}
							disabled={isDeleting}
						>
							{t("buttons.cancel")}
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={() => deleteGitHubApp()}
							disabled={isDeleting}
						>
							{isDeleting
								? t("buttons.removing")
								: t("buttons.remove")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
