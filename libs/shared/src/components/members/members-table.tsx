import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Env, get, post, runPixel } from "@semoss/sdk";
import {
	Avatar,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	Input,
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
import { AddMembersOverlay } from "./add-members";
import { MembersList, type MemberUser } from "./members-list";

interface MembersProps {
	id: string;
	type:
		| "PROJECT"
		| "ENGINE"
		| "DATABASE"
		| "STORAGE"
		| "MODEL"
		| "VECTOR"
		| "FUNCTION"
		| "WORKSPACE"
		| "GUARDRAIL";
	onChange?: () => void;
	isOwner?: boolean;
	adminMode?: boolean;
	currentUserId?: string;
}

function formatNum(val: string): string {
	const digits = val.replace(/[^0-9]/g, "");
	if (!digits) return "";
	return Number(digits).toLocaleString();
}

function parseNum(val: string): string {
	return val.replace(/[^0-9]/g, "");
}

export const MembersTable = ({
	id,
	type,
	onChange,
	isOwner = false,
	adminMode = false,
	currentUserId,
}: MembersProps) => {
	const [openAddMembers, setOpenAddMembers] = useState<boolean>(false);
	const [listRefreshKey, setListRefreshKey] = useState<number>(0);
	const [searchKey, setSearchKey] = useState<string>("");
	const debouncedValue = useDebouncedValue(searchKey, 300);

	// Self-fetch current user's ID and permission
	const [myUserId, setMyUserId] = useState<string>("");
	const [myPermission, setMyPermission] = useState<string>("");
	const effectiveIsOwner = isOwner || myPermission === "OWNER";
	const effectiveCurrentUserId = currentUserId ?? myUserId;

	useEffect(() => {
		runPixel<[Record<string, { id: string; name: string; email: string }>]>(
			"META | GetUserInfo()",
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
		const isProject = type === "PROJECT" || type === "WORKSPACE";
		const endpoint = isProject
			? `project/getUserProjectPermission?projectId=${id}`
			: `engine/getUserEnginePermission?engineId=${id}`;
		get(`${Env.MODULE}/api/auth/${endpoint}`)
			.then((res) => {
				const perm = (res?.data as { permission?: string })?.permission;
				if (perm) setMyPermission(perm);
			})
			.catch(() => undefined);
	}, [id, type]);

	// Edit dialog state
	const [editUser, setEditUser] = useState<MemberUser | null>(null);
	const [editPermission, setEditPermission] = useState<string>("READ_ONLY");
	const [editMaxTokens, setEditMaxTokens] = useState<string>("");
	const [editMaxInputTokens, setEditMaxInputTokens] = useState<string>("");
	const [editMaxOutputTokens, setEditMaxOutputTokens] = useState<string>("");
	const [editMaxResponseTime, setEditMaxResponseTime] = useState<string>("");
	const [editFrequency, setEditFrequency] = useState<string>("DAY");
	const [resetConfirm, setResetConfirm] = useState<boolean>(false);

	const openEditDialog = (user: MemberUser) => {
		setEditUser(user);
		setEditPermission(user.permission ?? "READ_ONLY");
		setEditMaxTokens(user.max_tokens?.toString() ?? "");
		setEditMaxInputTokens(user.max_input_tokens?.toString() ?? "");
		setEditMaxOutputTokens(user.max_output_tokens?.toString() ?? "");
		setEditMaxResponseTime(user.max_response_time?.toString() ?? "");
		setEditFrequency(user.usage_frequency ?? "DAY");
	};

	const saveUserEdit = async () => {
		if (!editUser) return;
		const isEngine = type !== "PROJECT" && type !== "WORKSPACE";
		const authBase = `${Env.MODULE}/api/auth${adminMode ? "/admin" : ""}`;
		const url = `${authBase}/${isEngine ? "engine" : "project"}/${isEngine ? "editEngineUserPermissions" : "editProjectUserPermissions"}`;

		const payload: Record<string, unknown> = {
			userid: editUser.id,
			permission: editPermission,
		};

		if (type === "MODEL" || type === "PROJECT" || type === "WORKSPACE") {
			const hasAnyLimit =
				editMaxTokens || editMaxInputTokens || editMaxOutputTokens;
			const hasComputeTime = !!editMaxResponseTime;
			if (hasAnyLimit) {
				payload.usageRestriction = "token";
				payload.usageFrequency = editFrequency;
				if (editMaxTokens) payload.maxTokens = Number(editMaxTokens);
				if (editMaxInputTokens)
					payload.maxInputTokens = Number(editMaxInputTokens);
				if (editMaxOutputTokens)
					payload.maxOutputTokens = Number(editMaxOutputTokens);
			}
			if (hasComputeTime) {
				if (!hasAnyLimit) {
					payload.usageRestriction = "compute";
					payload.usageFrequency = editFrequency;
				}
				payload.maxResponseTime = Number(editMaxResponseTime);
			}
		}

		const response = await post<{ success: boolean }>(url, {
			[isEngine ? "engineId" : "projectId"]: id,
			userpermissions: [payload],
		}).catch((error: Error) => {
			toast.error(error?.message || "Error updating user.");
			return null;
		});

		if (response?.data?.success) {
			toast.success("User updated successfully.");
			setEditUser(null);
			setListRefreshKey((prev) => prev + 1);
		}
	};

	const resetUserUsage = async () => {
		if (!editUser) return;
		const isEngine = type !== "PROJECT" && type !== "WORKSPACE";
		const authBase = `${Env.MODULE}/api/auth${adminMode ? "/admin" : ""}`;
		const endpoint = isEngine
			? "engine/resetEngineUserTokenUsage"
			: "project/resetProjectUserTokenUsage";

		const response = await post<{ success: boolean }>(
			`${authBase}/${endpoint}`,
			{
				[isEngine ? "engineId" : "projectId"]: id,
				userId: editUser.id,
			},
		).catch((error: Error) => {
			toast.error(error?.message || "Error resetting token usage.");
			return null;
		});

		if (response?.data?.success) {
			toast.success("Token usage has been reset for this user.");
			setResetConfirm(false);
			setListRefreshKey((prev) => prev + 1);
		}
	};

	return (
		<div className="w-full">
			{/* Header Section */}
			<div className="flex flex-column gap-[10px] rounded-xl rounded-br-none rounded-bl-none border-gray-200 border-b bg-muted p-4 align-start">
				<div className="flex h-[36px] w-full flex-column gap-2">
					<InputGroup className="flex h-auto gap-1 self-stretch bg-background px-2 py-1 align-center">
						<InputGroupInput
							placeholder="Search"
							value={searchKey}
							onChange={(e) => setSearchKey(e.target.value)}
						/>
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
					{(adminMode ||
						myPermission === "OWNER" ||
						myPermission === "EDIT") && (
						<Button
							size="sm"
							className="flex h-auto flex-column gap-2 align-center"
							onClick={() => setOpenAddMembers(true)}
						>
							<div className="flex flex-column items-center gap-2">
								<Plus />
								<span>Add Members</span>
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
			/>

			{/** Add members overlay */}
			<AddMembersOverlay
				className="w-full"
				id={id}
				type={type}
				open={openAddMembers}
				onClose={(success) => {
					setOpenAddMembers(false);
					if (success) {
						setListRefreshKey((prev) => prev + 1);
						if (onChange) onChange();
					}
				}}
				adminMode={adminMode}
			/>

			{/* Edit member dialog — rendered here, outside the table */}
			{editUser && (
				<Dialog open onOpenChange={() => setEditUser(null)}>
					<DialogContent>
						<DialogTitle>Edit Member</DialogTitle>
						<DialogDescription>
							Update this member's permission level for the
							resource.
						</DialogDescription>
						<div className="flex flex-col gap-4 py-2">
							{/* User card */}
							<div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5">
								<Avatar className="h-9 w-9 items-center justify-center bg-muted text-muted-foreground text-sm">
									{editUser.name.charAt(0).toUpperCase()}
								</Avatar>
								<div className="flex flex-col">
									<span className="font-medium text-sm">
										{editUser.name}
									</span>
									<span className="text-muted-foreground text-xs">
										id: {editUser.id}
									</span>
									<span className="text-muted-foreground text-xs">
										email: {editUser.email}
									</span>
								</div>
							</div>

							<div className="flex flex-col gap-1.5">
								<Label>Permission</Label>
								<Select
									value={editPermission}
									onValueChange={setEditPermission}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="w-full">
										<SelectItem value="READ_ONLY">
											Viewer
										</SelectItem>
										<SelectItem value="EDIT">
											Editor
										</SelectItem>
										{(effectiveIsOwner || adminMode) && (
											<SelectItem value="OWNER">
												Owner
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>

							{(type === "MODEL" ||
								type === "PROJECT" ||
								type === "WORKSPACE") && (
								<>
									<div className="flex flex-col gap-1.5">
										<Label>
											Combined Token Limit{" "}
											<span className="text-muted-foreground">
												(optional)
											</span>
										</Label>
										<Input
											type="text"
											inputMode="numeric"
											placeholder="No limit"
											value={formatNum(editMaxTokens)}
											onChange={(e) =>
												setEditMaxTokens(
													parseNum(e.target.value),
												)
											}
										/>
									</div>

									<div className="flex flex-col gap-1.5">
										<Label>
											Input Token Limit (Prompt){" "}
											<span className="text-muted-foreground">
												(optional)
											</span>
										</Label>
										<Input
											type="text"
											inputMode="numeric"
											placeholder="No limit"
											value={formatNum(
												editMaxInputTokens,
											)}
											onChange={(e) =>
												setEditMaxInputTokens(
													parseNum(e.target.value),
												)
											}
										/>
									</div>

									<div className="flex flex-col gap-1.5">
										<Label>
											Output Token Limit (Response){" "}
											<span className="text-muted-foreground">
												(optional)
											</span>
										</Label>
										<Input
											type="text"
											inputMode="numeric"
											placeholder="No limit"
											value={formatNum(
												editMaxOutputTokens,
											)}
											onChange={(e) =>
												setEditMaxOutputTokens(
													parseNum(e.target.value),
												)
											}
										/>
									</div>

									<div className="flex flex-col gap-1.5">
										<Label>
											Max Compute Time (seconds){" "}
											<span className="text-muted-foreground">
												(optional)
											</span>
										</Label>
										<Input
											type="text"
											inputMode="numeric"
											placeholder="No limit"
											value={formatNum(
												editMaxResponseTime,
											)}
											onChange={(e) =>
												setEditMaxResponseTime(
													parseNum(e.target.value),
												)
											}
										/>
									</div>

									{(editMaxTokens ||
										editMaxInputTokens ||
										editMaxOutputTokens ||
										editMaxResponseTime) && (
										<div className="flex flex-col gap-1.5">
											<Label>
												Reset Frequency{" "}
												<span className="text-muted-foreground">
													(usage resets each period)
												</span>
											</Label>
											<Select
												value={editFrequency}
												onValueChange={setEditFrequency}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="DAY">
														Daily
													</SelectItem>
													<SelectItem value="WEEK">
														Weekly
													</SelectItem>
													<SelectItem value="MONTH">
														Monthly
													</SelectItem>
													<SelectItem value="YEAR">
														Yearly
													</SelectItem>
													<SelectItem value="ALL_TIME">
														All time
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
								</>
							)}
						</div>
						{(type === "MODEL" ||
							type === "PROJECT" ||
							type === "WORKSPACE") && (
							<div className="flex flex-col gap-2 rounded-md border border-orange-300 border-dashed bg-orange-50 p-3">
								<div className="flex items-center justify-between">
									<div className="flex flex-col">
										<span className="font-medium text-orange-800 text-xs">
											Reset Token Usage
										</span>
										<span className="text-muted-foreground text-xs">
											Zero out this user's accumulated
											token count
										</span>
									</div>
									{!resetConfirm ? (
										<Button
											variant="outline"
											size="sm"
											className="border-orange-300 text-orange-700 hover:bg-orange-100"
											onClick={() =>
												setResetConfirm(true)
											}
										>
											Reset
										</Button>
									) : (
										<div className="flex gap-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setResetConfirm(false)
												}
											>
												Cancel
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={resetUserUsage}
											>
												Confirm Reset
											</Button>
										</div>
									)}
								</div>
							</div>
						)}
						<DialogFooter>
							<Button
								variant="ghost"
								onClick={() => setEditUser(null)}
							>
								Cancel
							</Button>
							<Button onClick={saveUserEdit}>Save</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
};
