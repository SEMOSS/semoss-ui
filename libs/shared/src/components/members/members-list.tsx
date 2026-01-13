import { ChevronDown, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNotification } from "@semoss/ui";
import {
	Avatar,
	Button,
	Card,
	CardContent,
	CardHeader,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuTrigger,
	Muted,
} from "@semoss/ui/next";
import { apiGet, apiPost } from "../utility/api";
import { DeleteMembersOverlay } from "./delete-members";
import type { SETTINGS_PROVISIONED_USER } from "./members-types";

interface MembersProps {
	id: string;
	type:
		| "PROJECT"
		| "ENGINE"
		| "DATABASE"
		| "STORAGE"
		| "MODEL"
		| "VECTOR"
		| "FUNCTION";
	search?: string;
	isAddMember?: boolean;
	refreshList?: boolean;
	permission?: string;
}

export const MembersList = ({
	id,
	type,
	search = "",
	isAddMember = false,
	refreshList = false,
	permission = "",
}: MembersProps) => {
	const [userData, setUserData] = useState<SETTINGS_PROVISIONED_USER[]>([
		/*{
			id: "",
			name: "string",
			type: "string",
			email: "string",
			permission: "string",
			permission_granted_by: "string",
			permission_granted_by_type: "string",
			date_added: "string",
		},*/
	]);
	const [refreshData, setRefreshData] = useState<number>(0);
	const [limit, setLimit] = useState<number>(5);
	const [totalMembers, setTotalMembers] = useState<number>(0);
	const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
	const membersListId = `members-table-list-container-${isAddMember ? "add-member" : "default"}`;
	const apiCallTriggerId = `triggerAPICall-${isAddMember ? "add-member" : "default"}`;
	const notification = useNotification();
	//biome-ignore lint: elint/correctness/useExhaustiveDependencies: this is essential for fetching data
	useEffect(() => {
		const observer = new IntersectionObserver(
			(observerObj) => {
				if (
					observerObj[0].isIntersecting &&
					userData.length < totalMembers
				) {
					setLimit((prevLimit) => prevLimit + 5);
				}
			},
			{
				root: document.getElementById(membersListId),
				threshold: 1.0,
			},
		);

		observer.observe(document.getElementById(apiCallTriggerId));

		return () => {
			observer.disconnect();
		};
	}, [userData, totalMembers]);
	// const getUserDataApi = ["getUserProjectPermission", id];
	//biome-ignore lint: elint/correctness/useExhaustiveDependencies: this is essential for fetching data
	useEffect(() => {
		async function fetchUserData() {
			// Fetch user data based on type and id
			try {
				const response:
					| {
							members: SETTINGS_PROVISIONED_USER[];
							totalMembers: number;
					  }
					| { members: []; totalMembers: number } = (await apiGet(
					`/api/auth/project/${type === "PROJECT" ? "getProjectUsers" : "getEngineUsers"}?projectId=${id}&limit=${limit}${search !== "" ? `&userId=${search}` : ""}`,
				)) as unknown as
					| {
							members: SETTINGS_PROVISIONED_USER[];
							totalMembers: number;
					  }
					| { members: []; totalMembers: number };
				console.log(response.members, "membersresponse");
				setUserData(response?.members || []);
				setTotalMembers(response?.totalMembers || 0);
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		}
		fetchUserData();
	}, [id, type, refreshData, limit, search]);

	useEffect(() => {
		if (refreshList) {
			setRefreshData((prev) => prev + 1);
			refreshList = false;
		}
	}, [refreshList]);

	const returnAccessType = useCallback((permission: string) => {
		switch (permission) {
			case "READ_ONLY":
				return "can view";
			case "EDIT":
				return "can edit";
			case "OWNER":
				return "owner";
			default:
				return "select access";
		}
	}, []);

	const updateUserPermission = (userId, permission) => {
		// Implement API call to update user permission
		apiPost(
			`/api/auth/project/${type === "PROJECT" ? "editProjectUserPermissions" : "editEngineUserPermissions"}`,
			{
				projectId: id,
				userpermissions: [{ userid: userId, permission: permission }],
			},
		)
			.then((response) => {
				if (response?.success) {
					// Refresh user data
					setRefreshData((prev) => prev + 1);
					notification.add({
						id: "success",
						color: "success",
						message: "User permission updated successfully.",
					});
				}
			})
			.catch((error) => {
				console.error("Error updating user permission:", error);
				notification.add({
					id: "error",
					color: "error",
					message: "Error updating user permission.",
				});
			});
	};

	const userDataFiltered =
		permission !== ""
			? userData.filter((user) => user.permission === permission)
			: userData;

	return (
		<>
			<div className="flex w-full flex-column gap-2" id={membersListId}>
				<Card className="max-h-[300px] w-full gap-0 overflow-y-auto rounded-none p-4">
					<CardHeader className="px-2 py-0">
						<span className="font-geist font-medium text-neutral-500 text-sm leading-[20px]">
							Who has access{" "}
							{/* <Badge variant="secondary">{userData.length}</Badge> */}
						</span>
					</CardHeader>
					<CardContent className="px-2 py-0">
						{userDataFiltered.length > 0 ? (
							userDataFiltered.map((user) => (
								<div
									className="flex flex-column items-center gap-2 py-2"
									key={`members-row-${user.email}`}
								>
									{/* <img
                                                className="h-16 w-16 text-neutral-300"
                                                src={""}
                                                alt="User"
                                            /> */}
									{/* <UserRound /> */}
									<div className="width-[50px] flex rounded-2xl bg-[#ECEDEF]">
										<Avatar className="items-center justify-center text-gray-500">
											{user.name.charAt(0).toUpperCase()}
										</Avatar>
									</div>
									<span className="flex w-full flex-col overflow-hidden font-geist">
										<span className="flex font-semibold font-style-normal text-accent-foreground text-sm">
											{user.name}
										</span>
										<span className="flex font-normal font-style-normal text-muted-foreground text-xs">
											{user.email}
										</span>
									</span>
									<DropdownMenu>
										<DropdownMenuTrigger
											asChild
											className="flex h-auto items-center"
										>
											<Button
												variant="outline"
												size="default"
												className="w-[120px]"
											>
												<div className="flex flex-column items-center justify-between gap-2">
													<span className="flex">
														{returnAccessType(
															user.permission,
														)}{" "}
													</span>
													<ChevronDown />
												</div>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuRadioGroup>
												<DropdownMenuCheckboxItem
													key={`can-view-${user.email}`}
													checked={
														returnAccessType(
															user.permission,
														) === "can view"
													}
													onCheckedChange={() => {
														updateUserPermission(
															user.id,
															"READ_ONLY",
														);
													}}
												>
													can view
												</DropdownMenuCheckboxItem>
												<DropdownMenuCheckboxItem
													key={`can-edit-${user.email}`}
													checked={
														returnAccessType(
															user.permission,
														) === "can edit"
													}
													onCheckedChange={() => {
														updateUserPermission(
															user.id,
															"EDIT",
														);
													}}
												>
													can edit
												</DropdownMenuCheckboxItem>
												{user.permission === "OWNER" ? (
													<DropdownMenuCheckboxItem
														key={`owner-${user.email}`}
														checked={
															returnAccessType(
																user.permission,
															) === "owner"
														}
													>
														owner
													</DropdownMenuCheckboxItem>
												) : null}
											</DropdownMenuRadioGroup>
										</DropdownMenuContent>
									</DropdownMenu>
									<Button
										variant="outline"
										size="icon-sm"
										className="border-none"
										onClick={() => {
											setIdsToDelete([
												...idsToDelete,
												user.id,
											]);
										}}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))
						) : (
							<div className="flex h-full w-full items-center justify-center">
								<Muted>No members found</Muted>
							</div>
						)}
						<div id={apiCallTriggerId}>&nbsp;</div>
					</CardContent>
				</Card>
			</div>
			<DeleteMembersOverlay
				id={id}
				type={type}
				open={idsToDelete.length > 0}
				onClose={() => {
					setIdsToDelete([]);
					setRefreshData((prev) => prev + 1);
				}}
				idsToDelete={idsToDelete}
			/>
		</>
	);
};
