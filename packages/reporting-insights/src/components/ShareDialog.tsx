/**
 * ShareDialog — publish & share a dashboard (SEMOSS project).
 *
 *   • Visibility: Public (global — everyone) or Private (only specific users).
 *   • Tags: assign organizational tags → these ARE the folders, shared across all
 *     users because they live on the project's server-side metadata.
 *   • Private apps: grant individual SEMOSS users View / Edit / Owner access.
 *     Users without access never see the app (MyProjects filters by permission).
 */

import { Globe, Loader2, Lock, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@semoss/ui/next";
import { UserSearchSelect } from "@/components/UserSearchSelect";
import { Button, Input, Select } from "@/components/ui";
import { TagInput } from "@/components/ui/TagInput";
import { useToast } from "@/components/ui/Toast";
import {
	type DirectoryUser,
	type EngineMember,
	type GroupInfo,
	type GroupMember,
	getGroups,
	getProjectGroups,
	getProjectUsers,
	grantProjectGroup,
	grantProjectUser,
	type Role,
	revokeProjectGroup,
	revokeProjectUser,
} from "@/services/permissionsApi";
import type { Dashboard } from "@/types/dashboard";
import { useWorkspace } from "@/workspace/WorkspaceProvider";

const ROLES: Role[] = ["READ_ONLY", "EDIT", "OWNER"];
const roleLabel = (r: string) =>
	(
		({
			READ_ONLY: "Viewer",
			EDIT: "Editor",
			EDITOR: "Editor",
			OWNER: "Owner",
			VIEWER: "Viewer",
		}) as Record<string, string>
	)[r] ?? r;

export function ShareDialog({
	dashboard,
	onClose,
}: {
	dashboard: Dashboard;
	onClose: () => void;
}) {
	const { isAdmin, folders, setDashboardTags, publishDashboard } =
		useWorkspace();
	const toast = useToast();

	const [visibility, setVisibility] = useState<"public" | "private">(
		dashboard.published ? "public" : "private",
	);
	const [tags, setTags] = useState<string[]>(dashboard.tags ?? []);
	const tagsRef = useRef<string[]>(dashboard.tags ?? []);
	const applyTags = useCallback((next: string[]) => {
		tagsRef.current = next;
		setTags(next);
	}, []);
	const [members, setMembers] = useState<EngineMember[] | null>(null);
	const [pendingUser, setPendingUser] = useState<DirectoryUser | null>(null);
	const [role, setRole] = useState<Role>("READ_ONLY");
	const [busyUser, setBusyUser] = useState(false);
	const [saving, setSaving] = useState(false);

	// Teams / groups (granted View only).
	const [groups, setGroups] = useState<GroupInfo[]>([]);
	const [teamMembers, setTeamMembers] = useState<GroupMember[] | null>(null);
	const [addGroup, setAddGroup] = useState("");
	const [busyGroup, setBusyGroup] = useState(false);

	const tagSuggestions = useMemo(
		() => Array.from(new Set(folders.map((f) => f.name))).sort(),
		[folders],
	);

	useEffect(() => {
		let cancelled = false;
		getProjectUsers(isAdmin, dashboard.id)
			.then((m) => !cancelled && setMembers(m))
			.catch(() => !cancelled && setMembers([]));
		getGroups(isAdmin)
			.then((g) => !cancelled && setGroups(g))
			.catch(() => !cancelled && setGroups([]));
		getProjectGroups(dashboard.id)
			.then((g) => !cancelled && setTeamMembers(g))
			.catch(() => !cancelled && setTeamMembers([]));
		return () => {
			cancelled = true;
		};
	}, [dashboard.id, isAdmin]);

	const grantedSet = new Set((members ?? []).map((m) => m.id));

	const grant = async () => {
		const u = pendingUser;
		if (!u?.id) return;
		setBusyUser(true);
		try {
			await grantProjectUser(isAdmin, dashboard.id, u.id, role);
			setMembers((prev) => {
				const next = (prev ?? []).filter((m) => m.id !== u.id);
				return [
					...next,
					{ id: u.id, name: u.name || u.id, permission: role },
				];
			});
			setPendingUser(null);
		} catch (e: any) {
			toast.error(
				e?.message ?? "Could not grant access.",
				"Share failed",
			);
		} finally {
			setBusyUser(false);
		}
	};

	const revoke = async (uid: string) => {
		try {
			await revokeProjectUser(isAdmin, dashboard.id, uid);
			setMembers((prev) => (prev ?? []).filter((m) => m.id !== uid));
		} catch (e: any) {
			toast.error(
				e?.message ?? "Could not revoke access.",
				"Share failed",
			);
		}
	};

	const groupName = (id: string) =>
		groups.find((g) => g.id === id)?.name ?? id;
	const grantedGroupSet = new Set((teamMembers ?? []).map((g) => g.id));
	const availableGroups = groups.filter((g) => !grantedGroupSet.has(g.id));

	// Teams are always granted View (read-only) — never owner/editor.
	const grantTeam = async () => {
		const gid = addGroup.trim();
		if (!gid) return;
		const g = groups.find((x) => x.id === gid);
		setBusyGroup(true);
		try {
			await grantProjectGroup(
				isAdmin,
				dashboard.id,
				gid,
				g?.type,
				"READ_ONLY",
			);
			setTeamMembers((prev) => {
				const next = (prev ?? []).filter((m) => m.id !== gid);
				return [
					...next,
					{
						id: gid,
						name: groupName(gid),
						type: g?.type,
						permission: "READ_ONLY",
					},
				];
			});
			setAddGroup("");
		} catch (e: any) {
			toast.error(
				e?.message ?? "Could not grant team access.",
				"Share failed",
			);
		} finally {
			setBusyGroup(false);
		}
	};

	const revokeTeam = async (gid: string) => {
		const g = (teamMembers ?? []).find((x) => x.id === gid);
		try {
			await revokeProjectGroup(isAdmin, dashboard.id, gid, g?.type);
			setTeamMembers((prev) => (prev ?? []).filter((m) => m.id !== gid));
		} catch (e: any) {
			toast.error(
				e?.message ?? "Could not revoke team access.",
				"Share failed",
			);
		}
	};

	const save = async () => {
		setSaving(true);
		try {
			setDashboardTags(dashboard.id, tagsRef.current);
			// Flip global only if it changed, to avoid an unnecessary re-release.
			if ((visibility === "public") !== !!dashboard.published) {
				await publishDashboard(dashboard.id, visibility === "public");
			}
			toast.success(
				visibility === "public"
					? "Now visible to everyone."
					: "Sharing updated.",
				"Sharing updated",
			);
			onClose();
		} catch (e: any) {
			toast.error(
				e?.message ?? "Failed to save sharing settings.",
				"Save failed",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open
			onOpenChange={(o) => {
				if (!o) onClose();
			}}
		>
			<DialogContent className="max-h-[88vh] w-full max-w-lg overflow-y-auto">
				<DialogTitle className="font-bold text-lg text-stone-900">
					Share &amp; access
				</DialogTitle>
				<DialogDescription className="mt-0.5 text-[13px] text-stone-500">
					“{dashboard.name}”
				</DialogDescription>

				{/* Tags / folder */}
				<div className="mt-4">
					<label className="mb-1 block font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
						Folders (tags)
					</label>
					<TagInput
						value={tags}
						onChange={applyTags}
						suggestions={tagSuggestions}
						placeholder="Add a folder tag…"
					/>
					<p className="mt-1 text-[11px] text-stone-400">
						Tags become folders that everyone with access sees.
					</p>
				</div>

				{/* Visibility */}
				<div className="mt-4">
					<label className="mb-1 block font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
						Who can access
					</label>
					<div className="grid grid-cols-2 gap-2">
						<VisCard
							active={visibility === "public"}
							onClick={() => setVisibility("public")}
							icon={<Globe className="h-4 w-4" />}
							title="Public"
							desc="Everyone who uses this app"
						/>
						<VisCard
							active={visibility === "private"}
							onClick={() => setVisibility("private")}
							icon={<Lock className="h-4 w-4" />}
							title="Private"
							desc="Only people you choose"
						/>
					</div>
				</div>

				{/* Private → user permissions */}
				{visibility === "private" && (
					<div className="mt-4 space-y-3 rounded-lg border border-stone-200 bg-stone-50/60 p-3">
						<div className="flex flex-wrap items-end gap-2">
							<div className="min-w-[200px] flex-1">
								<label className="mb-1 block font-medium text-[11px] text-stone-500">
									Add person
								</label>
								<UserSearchSelect
									isAdmin={isAdmin}
									excludeIds={grantedSet}
									selected={pendingUser}
									onChange={setPendingUser}
								/>
							</div>
							<div className="w-28">
								<label className="mb-1 block font-medium text-[11px] text-stone-500">
									Role
								</label>
								<Select
									value={role}
									onChange={(e) =>
										setRole(e.target.value as Role)
									}
									className="py-1.5"
									aria-label="Role"
								>
									{ROLES.map((r) => (
										<option key={r} value={r}>
											{roleLabel(r)}
										</option>
									))}
								</Select>
							</div>
							<Button
								size="sm"
								disabled={!pendingUser || busyUser}
								onClick={() => void grant()}
							>
								{busyUser ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Plus className="h-3.5 w-3.5" />
								)}{" "}
								Add
							</Button>
						</div>

						<div>
							<p className="mb-1.5 font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
								People with access
							</p>
							{members === null ? (
								<div className="flex items-center gap-2 py-3 text-sm text-stone-400">
									<Loader2 className="h-4 w-4 animate-spin" />{" "}
									Loading…
								</div>
							) : members.length === 0 ? (
								<p className="py-3 text-center text-[13px] text-stone-400">
									Only you can see this app. Add people above.
								</p>
							) : (
								<ul className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
									{members.map((m) => (
										<li
											key={m.id}
											className="flex items-center gap-2 px-3 py-2"
										>
											<span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">
												{m.name || m.id}
											</span>
											<span className="rounded bg-stone-100 px-1.5 py-0.5 font-semibold text-[10px] text-stone-500">
												{roleLabel(m.permission)}
											</span>
											<button
												onClick={() =>
													void revoke(m.id)
												}
												title="Remove"
												className="rounded-md p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</li>
									))}
								</ul>
							)}
						</div>

						{/* Teams — granted View only */}
						<div className="border-stone-200 border-t pt-3">
							<div className="mb-1.5 flex items-center gap-1.5">
								<Users className="h-3.5 w-3.5 text-stone-400" />
								<p className="font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
									Teams (view only)
								</p>
							</div>
							<div className="flex flex-wrap items-end gap-2">
								<div className="min-w-[160px] flex-1">
									{groups.length > 0 ? (
										<Select
											value={addGroup}
											onChange={(e) =>
												setAddGroup(e.target.value)
											}
											className="py-1.5"
											aria-label="Select team"
										>
											<option value="">
												{availableGroups.length
													? "Select a team…"
													: "All teams already added"}
											</option>
											{availableGroups.map((g) => (
												<option key={g.id} value={g.id}>
													{g.name}
												</option>
											))}
										</Select>
									) : (
										<Input
											value={addGroup}
											onChange={(e) =>
												setAddGroup(e.target.value)
											}
											placeholder="Enter a team id"
											className="py-1.5"
										/>
									)}
								</div>
								<Button
									size="sm"
									disabled={!addGroup.trim() || busyGroup}
									onClick={() => void grantTeam()}
								>
									{busyGroup ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<Plus className="h-3.5 w-3.5" />
									)}{" "}
									Add team
								</Button>
							</div>
							<div className="mt-2">
								{teamMembers === null ? (
									<div className="flex items-center gap-2 py-2 text-sm text-stone-400">
										<Loader2 className="h-4 w-4 animate-spin" />{" "}
										Loading…
									</div>
								) : teamMembers.length === 0 ? (
									<p className="py-2 text-center text-[13px] text-stone-400">
										No teams added.
									</p>
								) : (
									<ul className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
										{teamMembers.map((g) => (
											<li
												key={g.id}
												className="flex items-center gap-2 px-3 py-2"
											>
												<Users className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
												<span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">
													{groupName(g.id)}
												</span>
												<span className="rounded bg-stone-100 px-1.5 py-0.5 font-semibold text-[10px] text-stone-500">
													{roleLabel(g.permission)}
												</span>
												<button
													onClick={() =>
														void revokeTeam(g.id)
													}
													title="Remove"
													className="rounded-md p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					</div>
				)}

				<div className="mt-5 flex justify-end gap-2 border-stone-100 border-t pt-4">
					<Button variant="secondary" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={() => void save()}
						disabled={saving}
					>
						{saving && (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						)}{" "}
						Save
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function VisCard({
	active,
	onClick,
	icon,
	title,
	desc,
}: {
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	title: string;
	desc: string;
}) {
	return (
		<button
			onClick={onClick}
			className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${active ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-500/20" : "border-stone-200 bg-white hover:border-stone-300"}`}
		>
			<span
				className={`mt-0.5 ${active ? "text-indigo-600" : "text-stone-400"}`}
			>
				{icon}
			</span>
			<span className="min-w-0">
				<span
					className={`block font-semibold text-[13px] ${active ? "text-indigo-900" : "text-stone-800"}`}
				>
					{title}
				</span>
				<span className="block text-[11px] text-stone-500">{desc}</span>
			</span>
		</button>
	);
}
