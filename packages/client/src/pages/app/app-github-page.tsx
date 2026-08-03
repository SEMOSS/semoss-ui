import {
	Clock,
	ExternalLink,
	FolderOpen,
	GitBranch,
	Github,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
	TriangleAlert,
	Unplug,
	Webhook,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import {
	buildInstallAppUrl,
	disconnectProject,
	type GithubInstallation,
	type GithubInstallationCheck,
	type GithubLink,
	type GithubRepo,
	type GithubWebhookDelivery,
	getProjectLink,
	handleNeedsAuth,
	isGithubAvailable,
	repoHtmlUrl,
	selectRepo,
	setProjectBranch,
} from "@/api/github";
import { useProject, useRootStore } from "@/hooks";
import { GithubBranchSelect } from "./app-detail-tabs/github-branch-select";
import { GithubInstallationPicker } from "./app-detail-tabs/github-installation-picker";
import { GithubRepoPicker } from "./app-detail-tabs/github-repo-picker";

/** How many recent webhook deliveries to request for the health panel. */
const DELIVERY_LIMIT = 20;

/**
 * "GitHub" tab on the App (project) detail view. Lets a user connect the
 * project to a GitHub repository, see the current link, and change or
 * disconnect it. When connected it also surfaces installation health
 * (`GitHubCheckInstallation`) and recent webhook deliveries
 * (`GitHubWebhookDeliveries`). State is driven off the project's `githubLink`
 * (from ProjectInfo); the post-install repo picker lives at the
 * `github/select-repo` sub-route ({@link AppGithubSelectRepoPage}).
 */
export const AppGithubPage = () => {
	const { t } = useTranslation("githubApp");
	const { project } = useProject();
	const appId = project.project_id;
	const { monolithStore } = useRootStore();
	const location = useLocation();

	// Seed from router state (set when the select-repo page links a repo and
	// navigates back) for an instant connected view; the fetch below reconciles.
	const initialLink =
		(location.state as { githubLink?: GithubLink } | null)?.githubLink ??
		null;

	const [link, setLink] = useState<GithubLink | null>(
		initialLink?.linked ? initialLink : null,
	);
	const [isLinkLoading, setIsLinkLoading] = useState(true);
	const [available, setAvailable] = useState<boolean | null>(null);
	const [isConnectOpen, setIsConnectOpen] = useState(false);
	const [isChangeOpen, setIsChangeOpen] = useState(false);
	const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
	const [isBranchOpen, setIsBranchOpen] = useState(false);
	const [branchInput, setBranchInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Installation health + webhook diagnostics (only meaningful when connected).
	const [installationValid, setInstallationValid] = useState<boolean | null>(
		null,
	);
	const [deliveries, setDeliveries] = useState<GithubWebhookDelivery[]>([]);
	const [isDeliveriesLoading, setIsDeliveriesLoading] = useState(false);

	// Load the project's current link from the backend. ProjectInfo doesn't
	// carry it, so we read it directly — otherwise the tab always renders
	// "not connected" even for a project that is linked.
	useEffect(() => {
		let cancelled = false;
		setIsLinkLoading(true);
		getProjectLink(appId)
			.then((next) => {
				if (!cancelled) {
					setLink(next.linked ? next : null);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setLink(null);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsLinkLoading(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [appId]);

	// Pre-flight whether GitHub is set up for this instance — only matters for
	// the not-connected state, so skip it while loading or once linked.
	useEffect(() => {
		if (isLinkLoading || link?.linked) {
			return;
		}
		let cancelled = false;
		setAvailable(null);
		isGithubAvailable().then((next) => {
			if (!cancelled) {
				setAvailable(next);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [isLinkLoading, link?.linked]);

	// Is the linked GitHub App installation still valid (not uninstalled)?
	const loadInstallationHealth = useCallback(async () => {
		try {
			const res = await monolithStore.runQuery<[GithubInstallationCheck]>(
				`GitHubCheckInstallation(project=["${appId}"]);`,
			);
			if (res.errors.length) {
				throw new Error(res.errors[0]);
			}
			const output = res.pixelReturn?.[0]?.output as
				| GithubInstallationCheck
				| undefined;
			setInstallationValid(output?.installationValid ?? null);
		} catch {
			// Leave as "unknown" — don't block the rest of the tab on this check.
			setInstallationValid(null);
		}
	}, [appId, monolithStore]);

	// Recent webhook deliveries for this project's installation.
	const loadDeliveries = useCallback(async () => {
		setIsDeliveriesLoading(true);
		try {
			const res = await monolithStore.runQuery<
				[{ deliveries?: GithubWebhookDelivery[] }]
			>(
				`GitHubWebhookDeliveries(project=["${appId}"], limit=[${DELIVERY_LIMIT}]);`,
			);
			if (res.errors.length) {
				throw new Error(res.errors[0]);
			}
			const output = res.pixelReturn?.[0]?.output as
				| { deliveries?: GithubWebhookDelivery[] }
				| undefined;
			setDeliveries(
				Array.isArray(output?.deliveries) ? output.deliveries : [],
			);
		} catch (error) {
			toast.error(
				(error as Error).message ||
					t("project.toasts.deliveriesFailed"),
			);
			setDeliveries([]);
		} finally {
			setIsDeliveriesLoading(false);
		}
	}, [appId, monolithStore, t]);

	// Load health + deliveries whenever the project becomes connected.
	useEffect(() => {
		if (!link?.linked) {
			setInstallationValid(null);
			setDeliveries([]);
			return;
		}
		loadInstallationHealth();
		loadDeliveries();
	}, [link?.linked, loadInstallationHealth, loadDeliveries]);

	const connect = () => {
		window.location.assign(buildInstallAppUrl(appId));
	};

	const openBranchDialog = () => {
		setBranchInput(link?.branch || "main");
		setIsBranchOpen(true);
	};

	const saveBranch = async () => {
		const branch = branchInput.trim();
		if (!branch || !link) {
			return;
		}
		setIsSubmitting(true);
		try {
			await setProjectBranch(appId, branch);
			// Refresh from the link endpoint so the displayed branch reflects
			// exactly what was persisted.
			const fresh = await getProjectLink(appId);
			setLink(fresh.linked ? fresh : null);
			setIsBranchOpen(false);
			toast.success(t("project.toasts.branchUpdated"));
		} catch (error) {
			toast.error(
				(error as Error).message || t("project.toasts.branchFailed"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatDelivered = (iso?: string) => {
		if (!iso) {
			return t("project.webhooks.unknownTime");
		}
		const parsed = new Date(iso);
		return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
	};

	const changeRepo = async (
		repo: GithubRepo,
		branch: string,
		subdir: string,
	) => {
		if (!link?.installationId) {
			return;
		}
		setIsSubmitting(true);
		try {
			const result = await selectRepo({
				projectId: appId,
				installationId: link.installationId,
				repoId: repo.id,
				branch,
				subdir,
			});
			setLink({
				...link,
				repoId: repo.id,
				repoFullName: result.repoFullName,
				branch,
				subdir: subdir || undefined,
				htmlUrl: repoHtmlUrl(result.repoFullName),
			});
			setIsChangeOpen(false);
			toast.success(t("project.toasts.changed"));
		} catch (error) {
			if (handleNeedsAuth(error, appId, t("project.toasts.needsAuth"))) {
				return;
			}
			toast.error(
				(error as Error).message || t("project.toasts.changeFailed"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Connect flow (installation picker): persist the chosen installation + repo,
	// then re-read the link so the tab reflects exactly what the backend stored.
	const connectRepo = async (
		installation: GithubInstallation,
		repo: GithubRepo,
		branch: string,
		subdir: string,
	) => {
		setIsSubmitting(true);
		try {
			await selectRepo({
				projectId: appId,
				installationId: installation.installationId,
				repoId: repo.id,
				branch,
				subdir,
			});
			const fresh = await getProjectLink(appId);
			setLink(fresh.linked ? fresh : null);
			setIsConnectOpen(false);
			toast.success(t("project.toasts.connected"));
		} catch (error) {
			if (handleNeedsAuth(error, appId, t("project.toasts.needsAuth"))) {
				return;
			}
			toast.error(
				(error as Error).message || t("project.toasts.connectFailed"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const disconnect = async () => {
		setIsSubmitting(true);
		try {
			await disconnectProject(appId);
			setLink(null);
			setIsDisconnectOpen(false);
			toast.success(t("project.toasts.disconnected"));
		} catch (error) {
			toast.error(
				(error as Error).message ||
					t("project.toasts.disconnectFailed"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex w-full flex-col gap-4">
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2 font-semibold text-base">
					<Github className="size-4" />
					<span>{t("project.title")}</span>
				</div>
				<p className="text-muted-foreground text-sm">
					{t("project.description")}
				</p>
			</div>

			{isLinkLoading ? (
				<div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					<span>{t("project.loading")}</span>
				</div>
			) : link?.linked ? (
				<>
					{installationValid === false ? (
						<div className="flex flex-wrap items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
							<ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="font-medium text-destructive">
									{t("project.installation.invalidTitle")}
								</span>
								<span className="text-muted-foreground text-sm">
									{t(
										"project.installation.invalidDescription",
									)}
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={connect}
							>
								{t("project.installation.reconnect")}
							</Button>
						</div>
					) : null}

					<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
						<div className="flex flex-col gap-1">
							<span className="text-muted-foreground text-sm">
								{t("project.connectedRepo")}
							</span>
							<a
								href={
									link.htmlUrl ||
									repoHtmlUrl(link.repoFullName ?? "")
								}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-1.5 font-medium hover:underline"
							>
								<Github className="size-4" />
								{link.repoFullName}
								<ExternalLink className="size-3.5" />
							</a>
							<span className="mt-1 flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm">
								<GitBranch className="size-3.5" />
								<span>{t("project.branch.label")}</span>
								<span className="font-medium text-foreground">
									{link.branch || t("project.branch.default")}
								</span>
								<Button
									variant="link"
									size="sm"
									className="h-auto px-1"
									onClick={openBranchDialog}
								>
									{t("project.branch.change")}
								</Button>
							</span>
							{link.subdir ? (
								<span className="mt-1 flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm">
									<FolderOpen className="size-3.5" />
									<span>{t("project.subdir.display")}</span>
									<code className="font-medium text-foreground text-xs">
										{link.subdir}
									</code>
								</span>
							) : null}
							{installationValid === true ? (
								<span className="mt-1 flex items-center gap-1.5 text-green-600 text-xs dark:text-green-500">
									<ShieldCheck className="size-3.5" />
									{t("project.installation.valid")}
								</span>
							) : null}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsChangeOpen(true)}
							>
								<RefreshCw className="mr-2 size-4" />
								{t("project.changeRepo")}
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setIsDisconnectOpen(true)}
							>
								<Unplug className="mr-2 size-4" />
								{t("project.disconnect")}
							</Button>
						</div>
					</div>

					<div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 text-xs dark:text-amber-400">
						<TriangleAlert className="mt-0.5 size-4 shrink-0" />
						<span>{t("project.syncWarning")}</span>
					</div>

					<div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="flex items-center gap-2 font-medium">
								<Webhook className="size-4" />
								{t("project.webhooks.title")}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => loadDeliveries()}
								disabled={isDeliveriesLoading}
							>
								<RefreshCw className="mr-2 size-4" />
								{t("project.webhooks.refresh")}
							</Button>
						</div>
						<p className="text-muted-foreground text-sm">
							{t("project.webhooks.description")}
						</p>

						{isDeliveriesLoading ? (
							<div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
								<Spinner className="size-4" />
								<span>{t("project.webhooks.loading")}</span>
							</div>
						) : deliveries.length === 0 ? (
							<div className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-sm">
								{t("project.webhooks.empty")}
							</div>
						) : (
							<div className="flex flex-col divide-y">
								{deliveries.map((delivery) => {
									const ok =
										typeof delivery.statusCode ===
											"number" &&
										delivery.statusCode >= 200 &&
										delivery.statusCode < 300;
									return (
										<div
											key={
												delivery.id ??
												delivery.guid ??
												`${delivery.event}-${delivery.deliveredAt}`
											}
											className="flex items-center gap-3 py-2 text-sm"
										>
											<div className="flex min-w-0 flex-1 items-center gap-2">
												<Badge
													variant="outline"
													className={`w-14 shrink-0 justify-center ${
														ok
															? "border-green-600/30 bg-green-600/10 text-green-600 dark:text-green-500"
															: "border-destructive/30 bg-destructive/10 text-destructive"
													}`}
												>
													{delivery.statusCode ??
														delivery.status ??
														"—"}
												</Badge>
												<span className="min-w-0 truncate">
													<span className="text-muted-foreground">
														{t(
															"project.webhooks.eventLabel",
														)}{" "}
													</span>
													<span className="font-medium">
														{delivery.event || "—"}
														{delivery.action
															? `.${delivery.action}`
															: ""}
													</span>
												</span>
												{delivery.redelivery ? (
													<Badge
														variant="outline"
														className="text-muted-foreground"
													>
														{t(
															"project.webhooks.redelivery",
														)}
													</Badge>
												) : null}
											</div>
											<span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-muted-foreground text-xs">
												<Clock className="size-3.5" />
												{formatDelivered(
													delivery.deliveredAt,
												)}
											</span>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</>
			) : available === null ? (
				<div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					<span>{t("project.checking")}</span>
				</div>
			) : available === false ? (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<div className="font-medium">
						{t("project.unavailableTitle")}
					</div>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("project.unavailableDescription")}
					</p>
				</div>
			) : (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<div className="font-medium">
						{t("project.notConnectedTitle")}
					</div>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("project.notConnectedDescription")}
					</p>
					<div className="mt-4">
						<Button onClick={() => setIsConnectOpen(true)}>
							<Github className="mr-2 size-4" />
							{t("project.connect")}
						</Button>
					</div>
				</div>
			)}

			<Dialog
				open={isConnectOpen}
				onOpenChange={(open: boolean) => {
					if (!isSubmitting) {
						setIsConnectOpen(open);
					}
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{t("project.connectDialog.title")}
						</DialogTitle>
						<DialogDescription>
							{t("project.connectDialog.description")}
						</DialogDescription>
					</DialogHeader>
					<GithubInstallationPicker
						projectId={appId}
						isSubmitting={isSubmitting}
						confirmLabel={t("project.connectDialog.confirm")}
						onConfirm={connectRepo}
						onInstallNew={connect}
					/>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isChangeOpen}
				onOpenChange={(open: boolean) => {
					if (!isSubmitting) {
						setIsChangeOpen(open);
					}
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{t("project.changeDialog.title")}
						</DialogTitle>
						<DialogDescription>
							{t("project.changeDialog.description")}
						</DialogDescription>
					</DialogHeader>
					{link?.installationId ? (
						<GithubRepoPicker
							projectId={appId}
							installationId={String(link.installationId)}
							currentRepoId={link.repoId}
							currentSubdir={link.subdir}
							isSubmitting={isSubmitting}
							confirmLabel={t("project.changeDialog.confirm")}
							onConfirm={changeRepo}
							manageOnGithubUrl={buildInstallAppUrl(appId)}
						/>
					) : null}
				</DialogContent>
			</Dialog>

			<Dialog
				open={isDisconnectOpen}
				onOpenChange={(open: boolean) => {
					if (!isSubmitting) {
						setIsDisconnectOpen(open);
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{t("project.disconnectDialog.title")}
						</DialogTitle>
						<DialogDescription>
							{t("project.disconnectDialog.description")}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDisconnectOpen(false)}
							disabled={isSubmitting}
						>
							{t("project.disconnectDialog.cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={() => disconnect()}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<Spinner className="mr-2 size-4" />
							) : null}
							{t("project.disconnectDialog.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isBranchOpen}
				onOpenChange={(open: boolean) => {
					if (!isSubmitting) {
						setIsBranchOpen(open);
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{t("project.branchDialog.title")}
						</DialogTitle>
						<DialogDescription>
							{t("project.branchDialog.description")}
						</DialogDescription>
					</DialogHeader>
					{link?.installationId && link.repoFullName ? (
						<GithubBranchSelect
							projectId={appId}
							installationId={String(link.installationId)}
							repoFullName={link.repoFullName}
							value={branchInput}
							onChange={setBranchInput}
							disabled={isSubmitting}
						/>
					) : null}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsBranchOpen(false)}
							disabled={isSubmitting}
						>
							{t("project.branchDialog.cancel")}
						</Button>
						<Button
							onClick={() => saveBranch()}
							disabled={isSubmitting || !branchInput.trim()}
						>
							{isSubmitting ? (
								<Spinner className="mr-2 size-4" />
							) : null}
							{t("project.branchDialog.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
