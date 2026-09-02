/** A file reported by the project repository status. */
export interface ProjectGitFile {
	path: string;
	status: "ADDED" | "MODIFIED" | "DELETED" | "UNTRACKED" | "CONFLICTED";
}

/** The latest commit at the project repository's HEAD. */
export interface ProjectGitCommitSummary {
	commitId: string;
	message: string;
	author: string;
	authorEmail: string;
	date: string;
}

/** Current branch, commit, and working-tree state for a project. */
export interface ProjectGitStatus {
	branch: string | null;
	detached: boolean;
	headCommitId: string | null;
	lastCommit: ProjectGitCommitSummary | null;
	staged: ProjectGitFile[];
	unstaged: ProjectGitFile[];
	untracked: ProjectGitFile[];
	conflicted: ProjectGitFile[];
	clean: boolean;
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
	tags: string[];
}

/** A file changed by a historical commit. */
export interface ProjectGitCommitFile {
	fileName: string;
	changeType: "ADD" | "MODIFY" | "DELETE" | "RENAME" | "COPY";
	oldPath: string | null;
	newPath: string | null;
}

/** Content returned for a conflicted working-tree file. */
export interface ProjectGitConflictDiff {
	path: string;
	side: "CONFLICT";
	diff: string;
	isBinary: boolean;
	isTruncated: boolean;
	base: string | null;
	ours: string | null;
	theirs: string | null;
	result: string;
}

/** A conflict resolution accepted by the backend reactor. */
export type ProjectGitConflictResolution =
	| "OURS"
	| "THEIRS"
	| "BOTH"
	| "MANUAL";

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
