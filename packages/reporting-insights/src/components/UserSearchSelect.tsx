/**
 * UserSearchSelect — a search-as-you-type picker for SEMOSS directory users.
 *
 * The full user directory is fetched ONCE (cached per session) and filtering
 * happens client-side as you type. This means: no network call per keystroke,
 * and search works even if the backend's getUsers endpoint ignores a search
 * term. Picking a result calls `onChange` with the chosen user.
 */
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui";
import { type DirectoryUser, getAllUsers } from "@/services/permissionsApi";

// Session-level cache so every picker instance (and remount) shares one fetch.
let usersCache: { admin: boolean; promise: Promise<DirectoryUser[]> } | null =
	null;
function loadAllUsers(admin: boolean): Promise<DirectoryUser[]> {
	if (!usersCache || usersCache.admin !== admin) {
		usersCache = {
			admin,
			promise: getAllUsers(admin).catch(() => [] as DirectoryUser[]),
		};
	}
	return usersCache.promise;
}

interface Props {
	isAdmin: boolean;
	/** User ids to hide from results (e.g. people already granted access). */
	excludeIds?: Set<string>;
	/** Currently selected user, or null. */
	selected: DirectoryUser | null;
	onChange: (user: DirectoryUser | null) => void;
	placeholder?: string;
}

export function UserSearchSelect({
	isAdmin,
	excludeIds,
	selected,
	onChange,
	placeholder = "Search users by name…",
}: Props) {
	const [q, setQ] = useState("");
	const [all, setAll] = useState<DirectoryUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);

	// One fetch of the whole directory, cached for the session.
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		loadAllUsers(isAdmin).then((users) => {
			if (cancelled) return;
			setAll(users);
			setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [isAdmin]);

	const term = q.trim().toLowerCase();
	const visible = useMemo(() => {
		const seen = new Set<string>();
		const out: DirectoryUser[] = [];
		for (const u of all) {
			if (excludeIds?.has(u.id) || seen.has(u.id)) continue;
			if (
				term &&
				!`${u.name} ${u.email ?? ""} ${u.id}`
					.toLowerCase()
					.includes(term)
			)
				continue;
			seen.add(u.id);
			out.push(u);
			if (out.length >= 50) break;
		}
		return out;
	}, [all, term, excludeIds]);

	if (selected) {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5">
				<span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">
					{selected.name}
					{selected.email ? (
						<span className="text-stone-400">
							{" "}
							({selected.email})
						</span>
					) : null}
				</span>
				<button
					type="button"
					onClick={() => {
						onChange(null);
						setQ("");
					}}
					title="Choose a different user"
					className="flex-shrink-0 rounded p-0.5 text-stone-400 hover:text-stone-700"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
		);
	}

	const rawTerm = q.trim();
	const exactInResults = visible.some((r) => r.id === rawTerm);

	return (
		<div className="relative">
			<div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20">
				<Search className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
				<Input
					value={q}
					onChange={(e) => {
						setQ(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => setTimeout(() => setOpen(false), 150)}
					placeholder={placeholder}
					className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-stone-300"
				/>
				{loading && (
					<Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-stone-300" />
				)}
			</div>
			{open && (
				<ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-soft-lg">
					{loading && (
						<li className="px-3 py-2 text-[12px] text-stone-400">
							Loading users…
						</li>
					)}
					{!loading && visible.length === 0 && (
						<li className="px-3 py-2 text-[12px] text-stone-400">
							{rawTerm
								? `No users found for “${rawTerm}”.`
								: "No users available."}
						</li>
					)}
					{visible.map((u) => (
						<li key={u.id}>
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									onChange(u);
									setOpen(false);
								}}
								className="flex w-full flex-col items-start px-3 py-1.5 text-left hover:bg-stone-50"
							>
								<span className="truncate text-[13px] text-stone-700">
									{u.name}
								</span>
								{u.email && (
									<span className="truncate text-[11px] text-stone-400">
										{u.email}
									</span>
								)}
							</button>
						</li>
					))}
					{/* Fallback: grant an exact id even if it isn't in the directory list. */}
					{rawTerm && !exactInResults && (
						<li className="border-stone-100 border-t">
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									onChange({ id: rawTerm, name: rawTerm });
									setOpen(false);
								}}
								className="w-full px-3 py-1.5 text-left text-[12px] text-indigo-600 hover:bg-indigo-50"
							>
								Use “{rawTerm}” as a user id
							</button>
						</li>
					)}
				</ul>
			)}
		</div>
	);
}
