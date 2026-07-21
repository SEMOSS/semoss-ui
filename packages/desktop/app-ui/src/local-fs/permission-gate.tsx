import { type ReactNode, useCallback, useRef, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

export interface PermissionRequest {
	/** Human-readable description of exactly what's about to happen, shown verbatim in the dialog — e.g. `Write to the file "notes.txt"`. */
	description: string;
	/** Cache key for "Always Allow" — see each mode's own doc below for what it should be scoped to. */
	cacheKey: string;
	/**
	 * "grant" (2 buttons: Allow/Deny) — a path isn't in the allowlist yet;
	 * approving both grants its containing directory AND completes the
	 * action described, in one step. This is the just-in-time, in-chat
	 * counterpart to Settings → Local Files' manual "Add Folder" — a user
	 * should never have to visit Settings before asking about a file.
	 *
	 * "confirm" (3 buttons: Deny/Allow Once/Always Allow This Session) — a
	 * write on a path that's *already* allowed still needs a live decision
	 * every time, unless the user has chosen to trust it for the rest of
	 * this session.
	 */
	mode: "grant" | "confirm";
}

/**
 * Session-scoped (this running app process only, never persisted to disk)
 * cache of "Always Allow" decisions — module-level state, not component
 * state, so it survives switching chat rooms (each room's ChatProvider
 * remounts, see chat-shell.tsx's `key={activeRoomId ?? "new"}`) and is only
 * ever cleared by quitting the app. Matches the Allow-once/Always-this-
 * session/Deny model the app's local filesystem tools use.
 */
const sessionAllowlist = new Set<string>();

export interface LocalFsPermissionGate {
	/** Resolves true if the operation may proceed (already cached, or the
	 * user just approved it this time), false if denied. Never rejects. */
	requestPermission(request: PermissionRequest): Promise<boolean>;
	/** Render once, anywhere in the tree — shows the Allow/Deny modal
	 * whenever a request is pending. */
	dialog: ReactNode;
}

/**
 * Owns the confirmation modal that gates every local-fs write tool call
 * (see tool-executor.ts) — instantiate once per app session (in
 * ChatShellInner, which persists across room switches, not per-room), not
 * once per ChatProvider.
 */
export function useLocalFsPermissionGate(): LocalFsPermissionGate {
	const [pending, setPending] = useState<PermissionRequest | null>(null);
	const resolverRef = useRef<((allowed: boolean) => void) | null>(null);

	const requestPermission = useCallback(
		(request: PermissionRequest): Promise<boolean> => {
			if (sessionAllowlist.has(request.cacheKey)) {
				return Promise.resolve(true);
			}
			return new Promise((resolve) => {
				resolverRef.current = resolve;
				setPending(request);
			});
		},
		[],
	);

	const decide = (
		outcome: "allow" | "allow-once" | "allow-session" | "deny",
	) => {
		if (!pending) {
			return;
		}
		if (outcome === "allow-session") {
			sessionAllowlist.add(pending.cacheKey);
		}
		resolverRef.current?.(outcome !== "deny");
		resolverRef.current = null;
		setPending(null);
	};

	const dialog = (
		<Dialog
			open={pending !== null}
			onOpenChange={(open) => {
				if (!open) {
					decide("deny");
				}
			}}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{pending?.mode === "grant"
							? "Access needed"
							: "Confirm write"}
					</DialogTitle>
					<DialogDescription>
						{pending?.description}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="flex-wrap gap-2 sm:justify-between">
					<Button variant="outline" onClick={() => decide("deny")}>
						Deny
					</Button>
					{pending?.mode === "grant" ? (
						<Button onClick={() => decide("allow")}>Allow</Button>
					) : (
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => decide("allow-once")}
							>
								Allow Once
							</Button>
							<Button onClick={() => decide("allow-session")}>
								Always Allow This Session
							</Button>
						</div>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	return { requestPermission, dialog };
}
