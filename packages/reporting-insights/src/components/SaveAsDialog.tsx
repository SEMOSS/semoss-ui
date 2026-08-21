import { BookOpen, Globe, Loader2, Lock, Plus, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserSearchSelect } from "@/components/UserSearchSelect";
import { Button, Input, Select } from "@/components/ui";
import { TagInput } from "@/components/ui/TagInput";
import { useToast } from "@/components/ui/Toast";
import {
	type DirectoryUser,
	type GroupInfo,
	getGroups,
	grantProjectGroup,
	grantProjectUser,
	type Role,
} from "@/services/permissionsApi";
import { LANDING_PAGE_TAG } from "@/services/projectStore";
import type { Dashboard } from "@/types/dashboard";
import { useWorkspace } from "@/workspace/WorkspaceProvider";

const ACCESS_ROLES: Role[] = ["READ_ONLY", "EDIT", "OWNER"];
const roleLabel = (r: string) =>
	(
		({
			READ_ONLY: "Viewer",
			EDIT: "Editor",
			EDITOR: "Editor",
			OWNER: "Owner",
		}) as Record<string, string>
	)[r] ?? r;

export function SaveAsDialog({
	dashboard,
	onClose,
}: {
	dashboard: Dashboard;
	onClose: () => void;
}) {
	const { createDashboard, folders, isAdmin } = useWorkspace();
	const toast = useToast();
	const navigate = useNavigate();

	const [name, setName] = useState(`${dashboard.name} (copy)`);

	// Seed tags from source, stripping system tags so they're never shown as chips
	const seedTags = useMemo(
		() => (dashboard.tags ?? []).filter((t) => t !== LANDING_PAGE_TAG),
		[dashboard.tags],
	);
	const [tags, setTags] = useState<string[]>(seedTags);
	const tagsRef = useRef<string[]>(seedTags);
	const applyTags = useCallback((next: string[]) => {
		tagsRef.current = next;
		setTags(next);
	}, []);

	const [publishVisibility, setPublishVisibility] = useState<
		"public" | "private" | "landing"
	>("public");
	const [grants, setGrants] = useState<
		{ id: string; role: Role; name?: string }[]
	>([]);
	const [pendingUser, setPendingUser] = useState<DirectoryUser | null>(null);
	const [addRole, setAddRole] = useState<Role>("READ_ONLY");
	const [teamGrants, setTeamGrants] = useState<string[]>([]);
	const [allGroups, setAllGroups] = useState<GroupInfo[]>([]);
	const [addTeam, setAddTeam] = useState("");
	const [saving, setSaving] = useState(false);

	const tagSuggestions = useMemo(
		() => Array.from(new Set(folders.map((f) => f.name))).sort(),
		[folders],
	);

	// Lazily fetch groups when private is selected
	useEffect(() => {
		if (publishVisibility !== "private" || allGroups.length) return;
		getGroups(isAdmin)
			.then(setAllGroups)
			.catch(() => setAllGroups([]));
	}, [publishVisibility, isAdmin, allGroups.length]);

	const nameInvalid = !name.trim() || name.trim() === dashboard.name.trim();
	const saveDisabled =
		saving ||
		nameInvalid ||
		(publishVisibility === "landing" && tagsRef.current.length === 0);

	const handleSave = async () => {
		if (!name.trim()) return;
		if (name.trim() === dashboard.name.trim()) {
			toast.error(
				"Choose a different name — the copy cannot share the same name as the original.",
				"Duplicate name",
			);
			return;
		}
		if (publishVisibility === "landing" && tagsRef.current.length === 0) {
			toast.error(
				"Add a folder tag so this insight appears in the correct Landing Page category.",
				"Folder required for Landing Page",
			);
			return;
		}
		setSaving(true);
		try {
			const copy: Dashboard = {
				...structuredClone(dashboard),
				id: "pending",
				name: name.trim(),
			};
			const isPublic =
				publishVisibility === "public" ||
				publishVisibility === "landing";
			const saveTags = [
				...tagsRef.current,
				...(publishVisibility === "landing" ? [LANDING_PAGE_TAG] : []),
			];
			const newId = await createDashboard(copy, {
				published: isPublic,
				tags: saveTags,
			});
			if (!isPublic) {
				await Promise.all(
					grants.map((g) =>
						grantProjectUser(isAdmin, newId, g.id, g.role).catch(
							() => null,
						),
					),
				);
				await Promise.all(
					teamGrants.map((gid) =>
						grantProjectGroup(
							isAdmin,
							newId,
							gid,
							allGroups.find((g) => g.id === gid)?.type,
							"READ_ONLY",
						).catch(() => null),
					),
				);
			}
			toast.success(
				isPublic
					? "Dashboard copied and published."
					: "Dashboard copied (private).",
				"Saved",
			);
			onClose();
			navigate(`/dashboard/${newId}`);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Failed to save copy.";
			toast.error(msg);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			onClick={onClose}
		>
			<div
				className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stone-200 bg-white p-5 shadow-soft-lg"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					disabled={saving}
					title="Close"
					className="absolute top-3 right-3 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:pointer-events-none"
				>
					<X className="h-4 w-4" />
				</button>

				<h2 className="pr-8 font-bold text-lg text-stone-900">
					Save as new dashboard
				</h2>
				<p className="mt-0.5 text-[13px] text-stone-500">
					Copying &ldquo;{dashboard.name}&rdquo;
				</p>

				{/* Name */}
				<div className="mt-4">
					<label className="mb-1 block font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
						Name <span className="text-red-400">*</span>
					</label>
					<div className="relative">
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Dashboard name"
							className={`w-full rounded-md border px-2.5 py-1.5 pr-20 font-semibold text-[14px] text-stone-800 placeholder:font-normal placeholder:text-stone-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
								nameInvalid
									? "border-amber-300 bg-amber-50/50"
									: "border-stone-200 bg-white"
							}`}
						/>
						{nameInvalid && (
							<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 font-semibold text-[10px] text-amber-600 uppercase tracking-wide">
								{!name.trim() ? "Required" : "Different name"}
							</span>
						)}
					</div>
				</div>

				{/* Folder tag */}
				<div className="mt-4">
					<label className="mb-1 block font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
						Folders (tags)
					</label>
					<TagInput
						value={tags}
						onChange={applyTags}
						suggestions={tagSuggestions}
						placeholder="Add a folder tag…"
						max={1}
						preventEmpty={publishVisibility === "landing"}
					/>
					{publishVisibility === "landing" && tags.length === 0 ? (
						<p className="mt-1 text-[11px] text-violet-600">
							A folder tag is required — it determines which
							category this insight appears under in the portal.
						</p>
					) : tags.length >= 1 ? (
						<p className="mt-1 text-[11px] text-stone-400">
							Remove the current tag to move this copy to a
							different folder.
						</p>
					) : (
						<p className="mt-1 text-[11px] text-stone-400">
							Tags become folders everyone with access sees. One
							folder per dashboard.
						</p>
					)}
				</div>

				{/* Visibility */}
				<div className="mt-4">
					<label className="mb-1 block font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
						Who can access
					</label>
					<div
						className={`grid gap-2 ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}
					>
						<button
							type="button"
							onClick={() => setPublishVisibility("public")}
							className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${publishVisibility === "public" ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-500/20" : "border-stone-200 hover:border-stone-300"}`}
						>
							<Globe
								className={`mt-0.5 h-4 w-4 ${publishVisibility === "public" ? "text-indigo-600" : "text-stone-400"}`}
							/>
							<span>
								<span
									className={`block font-semibold text-[13px] ${publishVisibility === "public" ? "text-indigo-900" : "text-stone-800"}`}
								>
									Public
								</span>
								<span className="block text-[11px] text-stone-500">
									Everyone who uses this app
								</span>
							</span>
						</button>
						<button
							type="button"
							onClick={() => setPublishVisibility("private")}
							className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${publishVisibility === "private" ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-500/20" : "border-stone-200 hover:border-stone-300"}`}
						>
							<Lock
								className={`mt-0.5 h-4 w-4 ${publishVisibility === "private" ? "text-indigo-600" : "text-stone-400"}`}
							/>
							<span>
								<span
									className={`block font-semibold text-[13px] ${publishVisibility === "private" ? "text-indigo-900" : "text-stone-800"}`}
								>
									Private
								</span>
								<span className="block text-[11px] text-stone-500">
									Only you — share with people after
								</span>
							</span>
						</button>
						{isAdmin && (
							<button
								type="button"
								onClick={() => setPublishVisibility("landing")}
								className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${publishVisibility === "landing" ? "border-violet-400 bg-violet-50/60 ring-1 ring-violet-500/20" : "border-stone-200 hover:border-stone-300"}`}
							>
								<BookOpen
									className={`mt-0.5 h-4 w-4 ${publishVisibility === "landing" ? "text-violet-600" : "text-stone-400"}`}
								/>
								<span>
									<span
										className={`block font-semibold text-[13px] ${publishVisibility === "landing" ? "text-violet-900" : "text-stone-800"}`}
									>
										Landing Page
									</span>
									<span className="block text-[11px] text-stone-500">
										Pinned to the Insights Portal
									</span>
								</span>
							</button>
						)}
					</div>

					{/* Private sub-panel */}
					{publishVisibility === "private" && (
						<div className="mt-3 space-y-2.5 rounded-lg border border-stone-200 bg-stone-50/60 p-3">
							<p className="text-[12px] text-stone-500">
								Pick who can access it. Only these people (and
								you) will see the dashboard and its folder.
							</p>
							<div className="flex flex-wrap items-end gap-2">
								<div className="min-w-[200px] flex-1">
									<UserSearchSelect
										isAdmin={isAdmin}
										excludeIds={
											new Set(grants.map((g) => g.id))
										}
										selected={pendingUser}
										onChange={setPendingUser}
									/>
								</div>
								<div className="w-28">
									<Select
										value={addRole}
										onChange={(e) =>
											setAddRole(e.target.value as Role)
										}
										className="py-1.5"
										aria-label="Role"
									>
										{ACCESS_ROLES.map((r) => (
											<option key={r} value={r}>
												{roleLabel(r)}
											</option>
										))}
									</Select>
								</div>
								<Button
									size="sm"
									disabled={
										!pendingUser ||
										grants.some(
											(g) => g.id === pendingUser?.id,
										)
									}
									onClick={() => {
										if (!pendingUser) return;
										setGrants((prev) => [
											...prev,
											{
												id: pendingUser.id,
												role: addRole,
												name: pendingUser.name,
											},
										]);
										setPendingUser(null);
									}}
								>
									<Plus className="h-3.5 w-3.5" /> Add
								</Button>
							</div>
							{grants.length > 0 && (
								<ul className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
									{grants.map((g) => (
										<li
											key={g.id}
											className="flex items-center gap-2 px-3 py-1.5"
										>
											<span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">
												{g.name || g.id}
											</span>
											<span className="rounded bg-stone-100 px-1.5 py-0.5 font-semibold text-[10px] text-stone-500">
												{roleLabel(g.role)}
											</span>
											<button
												onClick={() =>
													setGrants((prev) =>
														prev.filter(
															(x) =>
																x.id !== g.id,
														),
													)
												}
												title="Remove"
												className="rounded-md p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
											>
												<X className="h-3.5 w-3.5" />
											</button>
										</li>
									))}
								</ul>
							)}

							{/* Teams */}
							<div className="border-stone-200 border-t pt-3">
								<div className="mb-1.5 flex items-center gap-1.5">
									<Users className="h-3.5 w-3.5 text-stone-400" />
									<p className="font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
										Teams (view only)
									</p>
								</div>
								<div className="flex items-end gap-2">
									<div className="min-w-[150px] flex-1">
										{allGroups.length > 0 ? (
											<Select
												value={addTeam}
												onChange={(e) =>
													setAddTeam(e.target.value)
												}
												className="py-1.5"
												aria-label="Select team"
											>
												<option value="">
													Select a team…
												</option>
												{allGroups
													.filter(
														(g) =>
															!teamGrants.includes(
																g.id,
															),
													)
													.map((g) => (
														<option
															key={g.id}
															value={g.id}
														>
															{g.name}
														</option>
													))}
											</Select>
										) : (
											<Input
												value={addTeam}
												onChange={(e) =>
													setAddTeam(e.target.value)
												}
												placeholder="Enter a team id"
												className="py-1.5"
											/>
										)}
									</div>
									<Button
										size="sm"
										disabled={
											!addTeam.trim() ||
											teamGrants.includes(addTeam.trim())
										}
										onClick={() => {
											setTeamGrants((prev) => [
												...prev,
												addTeam.trim(),
											]);
											setAddTeam("");
										}}
									>
										<Plus className="h-3.5 w-3.5" /> Add
										team
									</Button>
								</div>
								{teamGrants.length > 0 && (
									<ul className="mt-2 divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
										{teamGrants.map((gid) => (
											<li
												key={gid}
												className="flex items-center gap-2 px-3 py-1.5"
											>
												<span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">
													{allGroups.find(
														(g) => g.id === gid,
													)?.name ?? gid}
												</span>
												<span className="rounded bg-stone-100 px-1.5 py-0.5 font-semibold text-[10px] text-stone-500">
													Viewer
												</span>
												<button
													onClick={() =>
														setTeamGrants((prev) =>
															prev.filter(
																(x) =>
																	x !== gid,
															),
														)
													}
													title="Remove"
													className="rounded-md p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
												>
													<X className="h-3.5 w-3.5" />
												</button>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="mt-5 flex justify-end gap-2 border-stone-100 border-t pt-4">
					<Button
						variant="secondary"
						size="sm"
						onClick={onClose}
						disabled={saving}
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={() => void handleSave()}
						disabled={saveDisabled}
					>
						{saving && (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						)}
						{publishVisibility === "private"
							? "Save (private)"
							: "Save & publish"}
					</Button>
				</div>
			</div>
		</div>
	);
}
