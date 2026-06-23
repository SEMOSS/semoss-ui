import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { Button, toast } from "@semoss/ui/next";
import {
	buildInstallAppUrl,
	type GithubRepo,
	handleNeedsAuth,
	repoHtmlUrl,
	selectRepo,
} from "@/api/github";
import { useNavigate } from "@/hooks/useNavigate";
import { GithubRepoPicker } from "./app-detail-tabs/github-repo-picker";

/**
 * Post-install repo picker. The install callback redirects the browser here
 * (`#/app/<projectId>/github/select-repo?installation_id=<id>`) when the
 * installation granted access to more than one repo, so the user must pick
 * which repo this project uses. On confirm we persist the link and return to
 * the GitHub tab (state 2).
 */
export const AppGithubSelectRepoPage = () => {
	const { t } = useTranslation("githubApp");
	const { appId } = useParams();
	const [params] = useSearchParams();
	const navigate = useNavigate();

	const projectId = appId || "";
	const installationId = params.get("installation_id") || "";
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleConfirm = async (repo: GithubRepo, branch: string) => {
		setIsSubmitting(true);
		try {
			const result = await selectRepo({
				projectId,
				installationId,
				repoId: repo.id,
				branch,
			});
			toast.success(t("project.toasts.connected"));
			navigate(`/app/${projectId}/github`, {
				state: {
					githubLink: {
						linked: true,
						repoId: repo.id,
						repoFullName: result.repoFullName,
						installationId,
						branch,
						htmlUrl: repoHtmlUrl(result.repoFullName),
					},
				},
			});
		} catch (error) {
			if (
				handleNeedsAuth(error, projectId, t("project.toasts.needsAuth"))
			) {
				return;
			}
			toast.error(
				(error as Error).message || t("project.toasts.connectFailed"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="mx-auto flex w-full max-w-xl flex-col gap-4">
			<div className="flex flex-col gap-1">
				<h3 className="font-semibold text-base">
					{t("project.selectRepo.title")}
				</h3>
				<p className="text-muted-foreground text-sm">
					{t("project.selectRepo.description")}
				</p>
			</div>

			{installationId ? (
				<GithubRepoPicker
					projectId={projectId}
					installationId={installationId}
					isSubmitting={isSubmitting}
					confirmLabel={t("project.selectRepo.confirm")}
					onConfirm={handleConfirm}
					manageOnGithubUrl={buildInstallAppUrl(projectId)}
				/>
			) : (
				<div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
					{t("project.selectRepo.missingInstallation")}
					<div className="mt-3">
						<Button
							variant="outline"
							onClick={() => navigate(`/app/${projectId}/github`)}
						>
							{t("project.selectRepo.back")}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};
