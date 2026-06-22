import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
} from "@semoss/ui/next";
import { getInstallBranches, handleNeedsAuth } from "@/api/github";

interface GithubBranchSelectProps {
	projectId: string;
	installationId: string;
	repoFullName: string;
	/** Currently selected branch (controlled). */
	value: string;
	onChange: (branch: string) => void;
	disabled?: boolean;
}

/**
 * Branch picker for a project's GitHub repo. Loads the repo's branches from
 * `/install/branches` (which hits GitHub) into a dropdown. If that fails — e.g.
 * 502 when GitHub is unreachable or the repo isn't accessible — it falls back
 * to a free-text input plus a retry, so the user can still set a branch.
 */
export const GithubBranchSelect = ({
	projectId,
	installationId,
	repoFullName,
	value,
	onChange,
	disabled = false,
}: GithubBranchSelectProps) => {
	const { t } = useTranslation("githubApp");
	const [branches, setBranches] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	// Read the latest value/onChange via refs so the fetch only re-runs when the
	// repo/installation changes — not on every keystroke or parent re-render.
	const valueRef = useRef(value);
	valueRef.current = value;
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	const loadBranches = useCallback(async () => {
		if (!repoFullName || !installationId) {
			return;
		}
		setIsLoading(true);
		setHasError(false);
		try {
			const next = await getInstallBranches(
				projectId,
				installationId,
				repoFullName,
			);
			setBranches(next);
			// Keep the current value if still valid; otherwise default to the
			// first branch so the (required) field is never left empty silently.
			if (next.length > 0 && !next.includes(valueRef.current)) {
				onChangeRef.current(next[0]);
			}
		} catch (error) {
			// A needsAuth 401 redirects to re-authorize; other failures (e.g. 502
			// when GitHub is unreachable) fall back to free-text entry.
			if (
				handleNeedsAuth(error, projectId, t("project.toasts.needsAuth"))
			) {
				return;
			}
			setHasError(true);
			setBranches([]);
		} finally {
			setIsLoading(false);
		}
	}, [projectId, installationId, repoFullName, t]);

	useEffect(() => {
		loadBranches();
	}, [loadBranches]);

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
				<Spinner className="size-4" />
				<span>{t("branchSelect.loading")}</span>
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<Input
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={t("branchSelect.placeholder")}
						aria-label={t("branchSelect.label")}
						disabled={disabled}
					/>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={() => loadBranches()}
						aria-label={t("branchSelect.retry")}
						disabled={disabled}
					>
						<RefreshCw className="size-4" />
					</Button>
				</div>
				<span className="text-muted-foreground text-xs">
					{t("branchSelect.errorFallback")}
				</span>
			</div>
		);
	}

	return (
		<Select value={value} onValueChange={onChange} disabled={disabled}>
			<SelectTrigger className="w-full">
				<SelectValue placeholder={t("branchSelect.placeholder")} />
			</SelectTrigger>
			<SelectContent>
				{branches.map((branch) => (
					<SelectItem key={branch} value={branch}>
						{branch}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
