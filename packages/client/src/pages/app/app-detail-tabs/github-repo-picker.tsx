import { ExternalLink, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Input,
	RadioGroup,
	RadioGroupItem,
	ScrollArea,
	Spinner,
	toast,
} from "@semoss/ui/next";
import {
	type GithubRepo,
	getInstallRepos,
	handleNeedsAuth,
} from "@/api/github";
import { GithubBranchSelect } from "./github-branch-select";

interface GithubRepoPickerProps {
	/** Project the repos are being listed for (used for the backend owner check). */
	projectId: string;
	/** Installation whose accessible repos are listed. */
	installationId: string;
	/** Currently-linked repo id, pre-selected when present. */
	currentRepoId?: number | string;
	/** Disables the confirm action while a select request is in flight. */
	isSubmitting?: boolean;
	/** Label for the confirm button (e.g. "Connect" vs "Change repository"). */
	confirmLabel: string;
	/** Called with the chosen repo and tracked branch when the user confirms. */
	onConfirm: (repo: GithubRepo, branch: string) => void;
	/**
	 * URL to the install flow for adjusting which repos the App can access (when
	 * the repo the user wants isn't in the list). Opened in a new tab so the
	 * picker stays open.
	 */
	manageOnGithubUrl: string;
}

/**
 * Searchable, scrollable single-select list of an installation's repos, followed
 * by a branch dropdown for the chosen repo (the tracked branch is required).
 * Shared by the "Change repository" dialog and the post-install select-repo
 * page. The parent owns the actual select request so it can decide what to do
 * afterwards (update state vs. navigate).
 */
export const GithubRepoPicker = ({
	projectId,
	installationId,
	currentRepoId,
	isSubmitting = false,
	confirmLabel,
	onConfirm,
	manageOnGithubUrl,
}: GithubRepoPickerProps) => {
	const { t } = useTranslation("githubApp");
	const [repos, setRepos] = useState<GithubRepo[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [selectedId, setSelectedId] = useState<string>(
		currentRepoId != null ? String(currentRepoId) : "",
	);
	const [selectedBranch, setSelectedBranch] = useState("");

	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		getInstallRepos(projectId, installationId)
			.then((next) => {
				if (!cancelled) {
					setRepos(next);
				}
			})
			.catch((error: Error) => {
				if (!cancelled) {
					// A needsAuth 401 redirects to re-authorize; only real
					// failures surface as a toast.
					if (
						handleNeedsAuth(
							error,
							projectId,
							t("project.toasts.needsAuth"),
						)
					) {
						return;
					}
					toast.error(
						error.message || t("project.toasts.reposFailed"),
					);
					setRepos([]);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [projectId, installationId, t]);

	const selectedRepo = useMemo(
		() => repos.find((r) => String(r.id) === selectedId),
		[repos, selectedId],
	);

	// Once repos load, seed the branch from a pre-selected repo's default branch.
	useEffect(() => {
		if (!selectedBranch && selectedRepo?.defaultBranch) {
			setSelectedBranch(selectedRepo.defaultBranch);
		}
	}, [selectedRepo, selectedBranch]);

	const filteredRepos = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) {
			return repos;
		}
		return repos.filter((repo) =>
			repo.fullName.toLowerCase().includes(term),
		);
	}, [repos, search]);

	const handleSelectRepo = (id: string) => {
		setSelectedId(id);
		// Default the branch to the newly chosen repo's default branch.
		const repo = repos.find((r) => String(r.id) === id);
		setSelectedBranch(repo?.defaultBranch ?? "");
	};

	const handleConfirm = () => {
		const branch = selectedBranch.trim();
		if (selectedRepo && branch) {
			onConfirm(selectedRepo, branch);
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={t("project.picker.searchPlaceholder")}
					className="pl-8"
				/>
			</div>

			{isLoading ? (
				<div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					<span>{t("project.picker.loading")}</span>
				</div>
			) : (
				<ScrollArea className="h-40 rounded-md border sm:h-52">
					{filteredRepos.length === 0 ? (
						<div className="p-4 text-center text-muted-foreground text-sm">
							{t("project.picker.noRepos")}
						</div>
					) : (
						<RadioGroup
							value={selectedId}
							onValueChange={handleSelectRepo}
							className="gap-0 p-1"
						>
							{filteredRepos.map((repo) => {
								const id = String(repo.id);
								return (
									<label
										key={id}
										htmlFor={`repo-${id}`}
										className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
									>
										<RadioGroupItem
											id={`repo-${id}`}
											value={id}
										/>
										<span className="truncate">
											{repo.fullName}
										</span>
									</label>
								);
							})}
						</RadioGroup>
					)}
				</ScrollArea>
			)}

			{selectedRepo ? (
				<div className="flex flex-col gap-1.5">
					<span className="font-medium text-sm">
						{t("project.picker.branchLabel")}
					</span>
					<GithubBranchSelect
						projectId={projectId}
						installationId={installationId}
						repoFullName={selectedRepo.fullName}
						value={selectedBranch}
						onChange={setSelectedBranch}
						disabled={isSubmitting}
					/>
					<span className="text-muted-foreground text-xs">
						{t("project.picker.branchHelp")}
					</span>
				</div>
			) : null}

			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<Button
					asChild
					variant="link"
					// `shrink min-w-0` overrides the Button base's `shrink-0` so
					// the link can shrink in the row and its (long, nowrap) text
					// truncates instead of pushing the confirm button past the
					// dialog's right edge.
					className="h-auto min-w-0 max-w-full shrink justify-start px-0"
				>
					<a
						href={manageOnGithubUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						<ExternalLink className="mr-2 size-4 shrink-0" />
						<span className="truncate">
							{t("project.picker.manageOnGithub")}
						</span>
					</a>
				</Button>
				<Button
					type="button"
					onClick={handleConfirm}
					disabled={
						!selectedId || !selectedBranch.trim() || isSubmitting
					}
					className="w-full shrink-0 sm:w-auto"
				>
					{isSubmitting ? <Spinner className="mr-2 size-4" /> : null}
					{confirmLabel}
				</Button>
			</div>
		</div>
	);
};
