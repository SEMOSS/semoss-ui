/** Current branch, commit, and working-tree state for a project. */
export interface ProjectGitStatus {
	branch: string | null;
	detached: boolean;
}

/** A working-tree index mutation supported by the Git UI. */
export type ProjectGitStageAction = "STAGE" | "UNSTAGE";

/** A working-tree comparison supported by ProjectGitDiff. */
export type ProjectGitDiffSide = "STAGED" | "UNSTAGED";

/** Unified diff returned for a staged or unstaged file. */
export interface ProjectGitDiff {
	path: string;
	side: ProjectGitDiffSide;
	diff: string;
	isBinary: boolean;
	isTruncated: boolean;
}

/** Author information returned with a project commit. */
export interface ProjectGitCommitAuthor {
	userId: string;
	userEmail: string;
}

/** A project repository commit returned by ProjectCommitDetails. */
export interface ProjectGitCommit {
	commitId: string;
	author: ProjectGitCommitAuthor;
	date: string;
	commitMessage: string;
	parentCommitIds: string[];
	refs: ProjectGitRef[];
	tags: string[];
}

/** A branch or tag pointing to a project commit. */
export interface ProjectGitRef {
	name: string;
	type: "LOCAL_BRANCH" | "REMOTE_BRANCH" | "TAG";
}

/** A file changed by a historical commit. */
export interface ProjectGitCommitFile {
	fileName: string;
	changeType: "ADD" | "MODIFY" | "DELETE" | "RENAME" | "COPY";
	oldPath: string | null;
	newPath: string | null;
	diff?: string;
	isBinary?: boolean;
	isTruncated?: boolean;
}

/** A local or remote branch returned by ProjectGitBranches. */
export interface ProjectGitBranch {
	name: string;
	fullName: string;
	remote: boolean;
	current: boolean;
	commitId: string;
	upstream: string | null;
	ahead: number | null;
	behind: number | null;
}

/** Branches and current checkout state for a project repository. */
export interface ProjectGitBranches {
	currentBranch: string | null;
	detached: boolean;
	branches: ProjectGitBranch[];
}
