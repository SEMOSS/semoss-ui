import {
	ArrowLeft,
	Building2,
	Github,
	Plus,
	RefreshCw,
	User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Button,
	RadioGroup,
	RadioGroupItem,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	type GithubInstallation,
	GithubNeedsAuthError,
	type GithubRepo,
	getInstallInstallations,
	installationSettingsUrl,
	redirectToGithubAuthorize,
} from "@/api/github";
import { GithubRepoPicker } from "./github-repo-picker";

interface GithubInstallationPickerProps {
	/** Project being connected (used for the backend owner check). */
	projectId: string;
	/** Disables confirm while the parent's select request is in flight. */
	isSubmitting?: boolean;
	/** Label for the final confirm button (e.g. "Connect repository"). */
	confirmLabel: string;
	/**
	 * Called with the chosen installation, repo, tracked branch, and optional
	 * subdir once the user confirms. The parent owns the actual `selectRepo` call.
	 */
	onConfirm: (
		installation: GithubInstallation,
		repo: GithubRepo,
		branch: string,
		subdir: string,
	) => void;
	/**
	 * Kicks off a fresh GitHub App install on a new account (the existing install
	 * redirect). Used both for the empty state and the "install on another
	 * account" secondary action.
	 */
	onInstallNew: () => void;
}

/**
 * Connect-flow picker: lists the GitHub App installations the user can link to
 * (by account), then drops into {@link GithubRepoPicker} for the chosen
 * installation. This replaces the old install-redirect-only flow, which only
 * worked on the very first install — explicitly picking an installation lets a
 * second project (or an already-installed app) connect without a redirect.
 *
 * When installations can't be read it shows the backend reason with a retry;
 * when there are none it falls back to the install redirect.
 */
export const GithubInstallationPicker = ({
	projectId,
	isSubmitting = false,
	confirmLabel,
	onConfirm,
	onInstallNew,
}: GithubInstallationPickerProps) => {
	const { t } = useTranslation("githubApp");
	const [installations, setInstallations] = useState<GithubInstallation[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [needsAuth, setNeedsAuth] = useState(false);
	const [selectedId, setSelectedId] = useState<string>("");

	const loadInstallations = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		setNeedsAuth(false);
		try {
			setInstallations(await getInstallInstallations(projectId));
		} catch (err) {
			// needsAuth is a recoverable re-auth gate, not an error — surface the
			// "Authorize GitHub" button rather than an error message.
			if (err instanceof GithubNeedsAuthError) {
				setNeedsAuth(true);
			} else {
				setError(
					(err as Error).message ||
						t("project.installPicker.loadFailed"),
				);
				setInstallations([]);
			}
		} finally {
			setIsLoading(false);
		}
	}, [projectId, t]);

	useEffect(() => {
		loadInstallations();
	}, [loadInstallations]);

	const selectedInstallation = installations.find(
		(i) => String(i.installationId) === selectedId,
	);

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
				<Spinner className="size-4" />
				<span>{t("project.installPicker.loading")}</span>
			</div>
		);
	}

	// Re-auth gate: the user must authorize their GitHub access before we can
	// list their installations. A full-page redirect to the authorize flow that
	// returns them here, where this same load path then succeeds.
	if (needsAuth) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
				<div className="font-medium">
					{t("project.installPicker.authTitle")}
				</div>
				<p className="text-muted-foreground text-sm">
					{t("project.installPicker.authDescription")}
				</p>
				<Button onClick={() => redirectToGithubAuthorize(projectId)}>
					<Github className="mr-2 size-4" />
					{t("project.installPicker.authorize")}
				</Button>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col gap-3">
				<div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">
					{error}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={loadInstallations}
					>
						<RefreshCw className="mr-2 size-4" />
						{t("project.installPicker.retry")}
					</Button>
					<Button variant="link" size="sm" onClick={onInstallNew}>
						{t("project.installPicker.installAnother")}
					</Button>
				</div>
			</div>
		);
	}

	if (installations.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
				<div className="font-medium">
					{t("project.installPicker.emptyTitle")}
				</div>
				<p className="text-muted-foreground text-sm">
					{t("project.installPicker.emptyDescription")}
				</p>
				<Button onClick={onInstallNew}>
					<Plus className="mr-2 size-4" />
					{t("project.installPicker.installApp")}
				</Button>
			</div>
		);
	}

	// Step 2: an installation is chosen — pick a repo within it.
	if (selectedInstallation) {
		return (
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-auto px-1"
						onClick={() => setSelectedId("")}
						disabled={isSubmitting}
					>
						<ArrowLeft className="mr-1.5 size-4" />
						{t("project.installPicker.backToInstallations")}
					</Button>
					<span className="truncate text-muted-foreground text-sm">
						{selectedInstallation.account}
					</span>
				</div>
				<GithubRepoPicker
					projectId={projectId}
					installationId={String(selectedInstallation.installationId)}
					isSubmitting={isSubmitting}
					confirmLabel={confirmLabel}
					onConfirm={(repo, branch, subdir) =>
						onConfirm(selectedInstallation, repo, branch, subdir)
					}
					manageOnGithubUrl={installationSettingsUrl(
						selectedInstallation,
					)}
				/>
			</div>
		);
	}

	// Step 1: choose an installation.
	return (
		<div className="flex flex-col gap-3">
			<span className="font-medium text-sm">
				{t("project.installPicker.selectLabel")}
			</span>
			<ScrollArea className="max-h-52 rounded-md border">
				<RadioGroup
					value={selectedId}
					onValueChange={setSelectedId}
					className="gap-0 p-1"
				>
					{installations.map((installation) => {
						const id = String(installation.installationId);
						const isOrg =
							installation.accountType === "Organization";
						const disabled = installation.suspended === true;
						const row = (
							<label
								key={id}
								htmlFor={`installation-${id}`}
								className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
									disabled
										? "cursor-not-allowed opacity-60"
										: "cursor-pointer hover:bg-muted"
								}`}
							>
								<RadioGroupItem
									id={`installation-${id}`}
									value={id}
									disabled={disabled}
								/>
								{isOrg ? (
									<Building2 className="size-4 shrink-0 text-muted-foreground" />
								) : (
									<User className="size-4 shrink-0 text-muted-foreground" />
								)}
								<span className="flex min-w-0 flex-col">
									<span className="truncate font-medium">
										{installation.account}
									</span>
									<span className="text-muted-foreground text-xs">
										{isOrg
											? t(
													"project.installPicker.accountTypeOrganization",
												)
											: t(
													"project.installPicker.accountTypeUser",
												)}
									</span>
								</span>
								{disabled ? (
									<Badge
										variant="outline"
										className="ml-auto shrink-0 border-amber-500/40 text-amber-600 dark:text-amber-400"
									>
										{t("project.installPicker.suspended")}
									</Badge>
								) : null}
							</label>
						);
						return disabled ? (
							<Tooltip key={id}>
								<TooltipTrigger asChild>{row}</TooltipTrigger>
								<TooltipContent>
									{t(
										"project.installPicker.suspendedTooltip",
									)}
								</TooltipContent>
							</Tooltip>
						) : (
							row
						);
					})}
				</RadioGroup>
			</ScrollArea>

			<Button
				variant="link"
				size="sm"
				className="h-auto justify-start px-0"
				onClick={onInstallNew}
			>
				<Plus className="mr-2 size-4" />
				{t("project.installPicker.installAnother")}
			</Button>
		</div>
	);
};
