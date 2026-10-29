import { Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	editEngineUserPermissions,
	editProjectUserPermissions,
	getUserEnginePermission,
	getUserProjectPermission,
	type ModelUsageLimit,
	type PostUser,
	type Role,
	runPixel,
} from "@semoss/sdk";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import { useCostLimitsAvailable } from "../../hooks/use-cost-limits-available";
import { useIsCurrentLogin } from "../../hooks/use-is-current-login";
import { findModelUsageLimitProblem } from "../model-usage-limit/model-usage-limit-checks";
import {
	ModelUsageLimitEditor,
	type ModelUsageLimitEditorHandle,
} from "../model-usage-limit/model-usage-limit-editor";
import { toExplicitUsageLimit } from "../model-usage-limit/model-usage-limit-format";
import { UsageLimitGuideButton } from "../model-usage-limit/usage-limit-guide-button";
import { OWNERS_ONLY_LIMIT_REASON } from "../model-usage-limit/usage-limit-labels";
import { AddMembersOverlay, type AddMembersPeopleSource } from "./add-members";
import {
	getAccessLevelLabel,
	MembersList,
	type MembersListSource,
	type MemberUser,
} from "./members-list";
import { PersonIdentity } from "./person-identity";

/**
 * Where the table reads, removes and adds members, for a host whose members are
 * not a project's or engine's, such as a team's members or managers. Make it
 * with useMemo so the table does not reload on every render.
 */
export interface MembersSource extends MembersListSource {
	/** Lists and adds people in the add dialog */
	people: AddMembersPeopleSource;
	/** The add button's label, in place of "Add Members" */
	addLabel?: string;
}

/** Props for {@link MembersTable}. */
export interface MembersTableProps {
	/** Id of the project or engine; unused with `source` */
	id?: string;
	/** Kind of resource; unused with `source` */
	type?:
		| "PROJECT"
		| "ENGINE"
		| "DATABASE"
		| "STORAGE"
		| "MODEL"
		| "VECTOR"
		| "FUNCTION"
		| "WORKSPACE"
		| "GUARDRAIL";
	/** Called after the viewer changes their own access level, which can change what they may do */
	onChange?: () => void;
	/** Whether the viewer is an owner; the table also reads the viewer's access level itself */
	isOwner?: boolean;
	/** Whether to use the admin endpoints, where the viewer can change anyone */
	adminMode?: boolean;
	/** The signed in user's id; the table reads it itself when left out */
	currentUserId?: string;
	/**
	 * Read-only mode:
	 *   - hides the "Add Members" button
	 *   - hides per-row Actions (edit/delete) and bulk selection
	 *   - renders the Permission column as static text (no dropdown)
	 */
	readOnly?: boolean;
	/**
	 * Whether the server can search the organization's Microsoft directory
	 * (`msGraphLookup` in the system config). When true, adding members offers
	 * a choice between existing users and the whole organization.
	 */
	isDirectoryAvailable?: boolean;
	/**
	 * Reads, removes and adds members through the host instead of a project's
	 * or engine's endpoints. The table then has no permissions, and readOnly
	 * decides whether the viewer can change the members.
	 */
	source?: MembersSource;
}

/** The access levels the edit dialog offers */
const ACCESS_LEVELS: readonly Role[] = ["READ_ONLY", "EDIT", "OWNER"];

/**
 * A searchable table of a project's or engine's members, or of a host's
 * `source`, with buttons to add, edit and remove them as the viewer may. On a
 * model, the edit dialog and the add dialog set each person's usage limit.
 */
export const MembersTable = ({
	id,
	type,
	onChange,
	isOwner = false,
	adminMode = false,
	currentUserId,
	readOnly = false,
	isDirectoryAvailable = false,
	source,
}: MembersTableProps) => {
	const [openAddMembers, setOpenAddMembers] = useState<boolean>(false);
	const [listRefreshKey, setListRefreshKey] = useState<number>(0);
	const [searchKey, setSearchKey] = useState<string>("");
	const debouncedValue = useDebouncedValue(searchKey, 300);

	// Self-fetch current user's ID and permission
	const [myUserId, setMyUserId] = useState<string>("");
	const [myPermission, setMyPermission] = useState<string>("");
	const effectiveIsOwner = isOwner || myPermission === "OWNER";
	const effectiveCurrentUserId = currentUserId ?? myUserId;
	const isCurrentLogin = useIsCurrentLogin();
	const isModel = !source && type === "MODEL";
	const isCostAvailable = useCostLimitsAvailable(
		isModel && id ? id : null,
		adminMode,
	);

	useEffect(() => {
		runPixel<[Record<string, { id: string; name: string; email: string }>]>(
			"META | GetUserInfo();",
		)
			.then((result) => {
				if (!result) return;
				const output = result.pixelReturn[0]?.output ?? {};
				const providerData = output[Object.keys(output)[0]];
				if (providerData?.id) setMyUserId(providerData.id);
			})
			.catch(() => undefined);
	}, []);

	useEffect(() => {
		// a host's members have no project or engine permission to read
		if (source || !id) return;
		const isProject = type === "PROJECT" || type === "WORKSPACE";
		const fetchPermission = isProject
			? getUserProjectPermission(id)
			: getUserEnginePermission(id);
		fetchPermission
			.then((perm) => {
				if (perm) setMyPermission(perm);
			})
			.catch(() => undefined);
	}, [id, type, source]);

	// Edit dialog state
	const [editUser, setEditUser] = useState<MemberUser | null>(null);
	const [editPermission, setEditPermission] = useState<Role>("READ_ONLY");
	const [editLimit, setEditLimit] = useState<ModelUsageLimit | null>(null);
	// the limit's problems show from the first save they stop
	const [shouldShowLimitProblems, setShouldShowLimitProblems] =
		useState(false);
	const [isSavingEdit, setIsSavingEdit] = useState(false);
	const limitEditorRef = useRef<ModelUsageLimitEditorHandle>(null);
	// only owners, and admins in admin mode, set usage limits; an editor still
	// changes levels, and the limit is sent back as it is
	const canChangeEditLimit = adminMode || effectiveIsOwner;
	const editLimitProblem =
		isModel && canChangeEditLimit
			? findModelUsageLimitProblem(editLimit, {
					source: "DIRECT",
					isCostAvailable,
				})
			: null;

	const openEditDialog = (user: MemberUser) => {
		setEditUser(user);
		setEditPermission(
			ACCESS_LEVELS.find((level) => level === user.permission) ??
				"READ_ONLY",
		);
		setEditLimit(user.usage_limit ?? null);
		setShouldShowLimitProblems(false);
	};

	const saveUserEdit = async () => {
		if (!editUser || !id) return;
		if (editLimitProblem) {
			setShouldShowLimitProblems(true);
			limitEditorRef.current?.focusFirstProblem();
			return;
		}
		const isProject = type === "PROJECT" || type === "WORKSPACE";
		// a limit the viewer may not change is sent back as it was
		const limit = canChangeEditLimit
			? editLimit
			: (editUser.usage_limit ?? null);
		const payload: PostUser = {
			userid: editUser.id,
			permission: editPermission,
			...(isModel ? { usageLimit: toExplicitUsageLimit(limit) } : {}),
		};

		setIsSavingEdit(true);
		const success = await (isProject
			? editProjectUserPermissions(id, [payload], adminMode)
			: editEngineUserPermissions(id, [payload], adminMode)
		).catch((error: Error) => {
			toast.error(error?.message || "Error updating user.");
			return false;
		});
		setIsSavingEdit(false);

		if (success) {
			toast.success("User updated successfully.");
			// Editing your own permission can change what you're allowed to see/do
			// here (and in ancestors gating on it), so let them resync, unlike
			// adding a member, which never changes your own permission.
			if (editUser.id === myUserId) {
				setMyPermission(editPermission);
				onChange?.();
			}
			setEditUser(null);
			setListRefreshKey((prev) => prev + 1);
		}
	};

	return (
		<div className="w-full">
			{/* Header Section */}
			<div className="flex flex-column gap-2.5 rounded-xl rounded-ee-none rounded-es-none border-border border-b bg-muted p-4 align-start">
				<div className="flex h-9 w-full flex-column gap-2">
					<InputGroup className="flex h-auto gap-1 self-stretch bg-background px-2 py-1 align-center">
						<InputGroupInput
							aria-label="Search"
							placeholder="Search"
							value={searchKey}
							onChange={(e) => setSearchKey(e.target.value)}
						/>
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
					{!readOnly &&
						(source ||
							adminMode ||
							myPermission === "OWNER" ||
							myPermission === "EDIT") && (
							<Button
								type="button"
								size="sm"
								className="flex h-auto flex-column gap-2 align-center"
								onClick={() => setOpenAddMembers(true)}
							>
								<div className="flex flex-column items-center gap-2">
									<Plus />
									<span>
										{source?.addLabel ?? "Add Members"}
									</span>
								</div>
							</Button>
						)}
				</div>
			</div>

			{/* Members List Section */}
			<MembersList
				id={id}
				type={type}
				refreshList={listRefreshKey}
				search={debouncedValue}
				onEdit={openEditDialog}
				isOwner={effectiveIsOwner}
				adminMode={adminMode}
				currentUserId={effectiveCurrentUserId}
				myPermission={myPermission}
				readOnly={readOnly}
				source={source}
			/>

			{/** Add members overlay */}
			<AddMembersOverlay
				className="w-full"
				id={id}
				type={type}
				open={openAddMembers}
				onClose={(success) => {
					setOpenAddMembers(false);
					// Adding a member never changes your own permission, so unlike
					// editing, this doesn't need to notify ancestors via onChange.
					if (success) {
						setListRefreshKey((prev) => prev + 1);
					}
				}}
				adminMode={adminMode}
				isDirectoryAvailable={isDirectoryAvailable}
				people={source?.people}
				isCostAvailable={isCostAvailable}
			/>

			{/* Edit member dialog: rendered here, outside the table */}
			{editUser && (
				<Dialog open onOpenChange={() => setEditUser(null)}>
					<DialogContent className="sm:max-w-2xl">
						<DialogTitle className="font-medium text-base leading-6">
							Edit Member
						</DialogTitle>
						<DialogDescription>
							{isModel
								? "Update this member's permission level and usage limit for the model."
								: "Update this member's permission level for the resource."}
						</DialogDescription>
						<div className="flex flex-col gap-4 py-2">
							{/* User card */}
							<div className="rounded-md border bg-muted/40 px-3 py-2.5">
								<PersonIdentity
									name={editUser.name}
									type={editUser.type}
									id={editUser.id}
									email={editUser.email}
									isCurrentLogin={isCurrentLogin(
										editUser.type,
										editUser.id,
									)}
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<Label>Permission</Label>
								<Select
									value={editPermission}
									onValueChange={(value) => {
										const level = ACCESS_LEVELS.find(
											(option) => option === value,
										);
										if (level) {
											setEditPermission(level);
										}
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue>
											{getAccessLevelLabel(
												editPermission,
											)}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="w-full">
										<SelectItem value="READ_ONLY">
											Read-Only
										</SelectItem>
										<SelectItem value="EDIT">
											Editor
										</SelectItem>
										{(effectiveIsOwner || adminMode) && (
											<SelectItem value="OWNER">
												Author
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>

							{isModel ? (
								<div className="flex flex-col gap-1">
									<ModelUsageLimitEditor
										key={editUser.id}
										ref={limitEditorRef}
										defaultValue={
											editUser.usage_limit ?? null
										}
										onChange={setEditLimit}
										source="DIRECT"
										isCostAvailable={isCostAvailable}
										readOnlyReason={
											canChangeEditLimit
												? null
												: OWNERS_ONLY_LIMIT_REASON
										}
										shouldShowProblems={
											shouldShowLimitProblems
										}
										disabled={isSavingEdit}
									/>
									<UsageLimitGuideButton
										className="self-start"
										section="modes"
										viewer={{
											canSetModelLimits:
												canChangeEditLimit,
											isAdminMode: adminMode,
										}}
									/>
								</div>
							) : null}
						</div>
						<DialogFooter>
							<Button
								variant="ghost"
								onClick={() => setEditUser(null)}
							>
								Cancel
							</Button>
							<Button
								onClick={saveUserEdit}
								disabled={isSavingEdit}
							>
								{isSavingEdit ? "Saving..." : "Save"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
};
