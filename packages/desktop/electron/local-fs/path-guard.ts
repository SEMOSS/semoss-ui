import { existsSync, realpathSync, statSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import type { AllowedDirectory } from "./types";

export class PathAccessDeniedError extends Error {
	constructor(requestedPath: string) {
		super(`Access to "${requestedPath}" isn't allowed yet.`);
		this.name = "PathAccessDeniedError";
	}
}

/** True if `candidate` is `root` itself or a real descendant of it — a
 * plain startsWith would also match a sibling like "/allowed-evil" against
 * root "/allowed", so the separator boundary is checked explicitly. */
function isWithin(root: string, candidate: string): boolean {
	if (candidate === root) {
		return true;
	}
	const prefix = root.endsWith(sep) ? root : root + sep;
	return candidate.startsWith(prefix);
}

/**
 * Resolves `requestedPath` to an absolute path and verifies it falls
 * within one of `allowedDirectories`, throwing PathAccessDeniedError
 * otherwise. Every tool implementation in tools.ts calls this before
 * touching disk — it's the one enforcement point the sandbox actually
 * depends on.
 *
 * When the path already exists, its realpath is also checked, so a
 * symlink planted inside an allowed directory can't point outside it and
 * escape the sandbox. A not-yet-existing path (e.g. write_file's target)
 * has no realpath to resolve — only its resolved-but-unfollowed form is
 * checked, which still blocks `../` traversal but can't detect a symlinked
 * *parent* directory pointing outside the sandbox; that's a known gap in
 * this first pass, not a solved problem.
 */
export function assertPathAllowed(
	requestedPath: string,
	allowedDirectories: AllowedDirectory[],
): string {
	const resolved = resolve(requestedPath);
	let real = resolved;
	try {
		real = realpathSync(resolved);
	} catch {
		// Doesn't exist yet — resolved (non-symlink-following) path is all
		// there is to check.
	}
	const allowed = allowedDirectories.some((dir) => {
		const root = resolve(dir.path);
		return isWithin(root, real) || isWithin(root, resolved);
	});
	if (!allowed) {
		throw new PathAccessDeniedError(requestedPath);
	}
	return resolved;
}

/** Non-throwing version of assertPathAllowed, for the renderer's
 * "should I show a grant prompt?" pre-check (see main.ts's isPathAllowed
 * IPC handler). */
export function isPathAllowed(
	requestedPath: string,
	allowedDirectories: AllowedDirectory[],
): boolean {
	try {
		assertPathAllowed(requestedPath, allowedDirectories);
		return true;
	} catch {
		return false;
	}
}

/**
 * The directory a just-in-time access grant should actually cover: the
 * path itself if it's already an existing directory (e.g. list_directory
 * on a folder), otherwise its parent directory (a file, or a path that
 * doesn't exist yet — e.g. write_file creating something new). Granting
 * the containing folder rather than the exact file means a follow-up
 * question about a sibling file in the same folder doesn't re-prompt.
 */
export function resolveContainingDirectory(requestedPath: string): string {
	const resolved = resolve(requestedPath);
	if (existsSync(resolved) && statSync(resolved).isDirectory()) {
		return resolved;
	}
	return dirname(resolved);
}
