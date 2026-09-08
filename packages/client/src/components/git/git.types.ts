/** Current branch, commit, and working-tree state for a Git repository. */
export interface GitStatus {
	branch: string | null;
	detached: boolean;
}

/** A working-tree index mutation supported by the Git UI. */
export type GitStageAction = "STAGE" | "UNSTAGE";

/** A working-tree comparison supported by the Git UI. */
export type GitDiffSide = "STAGED" | "UNSTAGED";

/** Unified diff returned for a staged or unstaged file. */
export interface GitDiff {
	path: string;
	side: GitDiffSide;
	diff: string;
	isBinary: boolean;
	isTruncated: boolean;
}

/** Author information returned with a Git commit. */
export interface GitCommitAuthor {
	userId: string;
	userEmail: string;
}

/** A repository commit displayed in Git history. */
export interface GitCommit {
	commitId: string;
	author: GitCommitAuthor;
	date: string;
	commitMessage: string;
	parentCommitIds: string[];
	refs?: GitRef[];
	tags?: string[];
}

/** A branch or tag pointing to a Git commit. */
export interface GitRef {
	name: string;
	type: "LOCAL_BRANCH" | "REMOTE_BRANCH" | "TAG";
}

/** A file changed by a historical commit. */
export interface GitCommitFile {
	fileName: string;
	changeType: "ADD" | "MODIFY" | "DELETE" | "RENAME" | "COPY";
	oldPath: string | null;
	newPath: string | null;
	diff?: string;
	isBinary?: boolean;
	isTruncated?: boolean;
}

/** A local or remote Git branch. */
export interface GitBranch {
	name: string;
	fullName: string;
	remote: boolean;
	current: boolean;
	commitId: string;
	upstream: string | null;
	ahead: number | null;
	behind: number | null;
}

/** Branches and current checkout state for a Git repository. */
export interface GitBranches {
	currentBranch: string | null;
	detached: boolean;
	branches: GitBranch[];
}
