import { ChevronDown, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Env, get, post } from "@semoss/sdk";
import { useNotification } from "@semoss/ui";
import {
	Avatar,
	Button,
	Card,
	CardContent,
	CardHeader,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuTrigger,
	Muted,
	toast,
} from "@semoss/ui/next";
import { returnAccessType } from "./common";

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
	search?: string;
	isAddMember?: boolean;
	refreshList?: boolean;
	permission?: string;
}

interface SETTINGS_PROVISIONED_USER {
	id: string;
	name: string;
	type: string;
	email: string;
	permission: string;
	permission_granted_by: string;
	permission_granted_by_type: string;
	date_added: string;
}

/**
 * Renders a list of members for a given project/engine.
 * This component is reused in main members table and add members overlay.
 * It fetches records from api on initial render and on search and also when the scrolling is reaching the bottom.
 * It also handles refreshing the list of members when add members popup is closed or when a user is deleted.
 * @param {string} id - The ID of the project/engine to fetch members for.
 * @param {string} type - The type of the project/engine to fetch members for.
 * @param {string} [search] - The search query to filter members by.
 * @param {boolean} [isAddMember] - Whether to display add members button or not.
 * @param {number} [refreshList] - Whether to refresh the list of members or not.
 * @param {string} [permission] - The permission to filter members by.
 */
export const MembersList = ({
	id,
	type,
	search = "",
	isAddMember = false,
	refreshList = false,
	permission = "",
}: MembersProps) => {
	const [userData, setUserData] = useState<SETTINGS_PROVISIONED_USER[]>([]);
	const [refreshData, setRefreshData] = useState<number>(0);
	const [limit, setLimit] = useState<number>(5);
	const [totalMembers, setTotalMembers] = useState<number>(0);
	const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
	const [userDataLoading, setUserDataLoading] = useState<boolean>(false);
	const membersListId = `members-table-list-container-${isAddMember ? "add-member" : "default"}`;
	const apiCallTriggerId = `triggerAPICall-${isAddMember ? "add-member" : "default"}`;
	const notification = useNotification();

	/**
	 * Central managing of fetching records from api based on scroll by adding the limit
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: this is essential for fetching data
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

	/**
	 * fetches records from api on initial render and on search
	 */
	//biome-ignore lint: elint/correctness/useExhaustiveDependencies: this is essential for fetching data
	useEffect(() => {
		async function fetchUserData() {
			// Fetch user data based on type and id
			try {
				setUserDataLoading(true);
				const response = await get(
					`${Env.MODULE}/api/auth/${type === "PROJECT" || type === "WORKSPACE" ? "project" : "engine"}/${type === "PROJECT" || type === "WORKSPACE" ? "getProjectUsers" : "getEngineUsers"}?${type === "PROJECT" || type === "WORKSPACE" ? "projectId" : "engineId"}=${id}&limit=${limit}${search !== "" ? `&userId=${search}` : ""}`,
				).catch((error) => {
					throw Error(error);
				});

				if (response?.data) {
					setUserData(response?.data?.members || []);
					setTotalMembers(response?.data?.totalMembers || 0);
				}
				console.log(response.data, "memberslistresponse");
				setTimeout(() => {
					setUserDataLoading(false);
				}, 100);
			} catch (error) {
				console.error("Error fetching user data:", error);
				setUserDataLoading(false);
			} finally {
				setUserDataLoading(false);
			}
		}
		fetchUserData();
	}, [id, type, refreshData, limit, search]);
	/**
	 * refreshes members list, when add members is closed
	 */
	useEffect(() => {
		if (refreshList) {
			setRefreshData((prev) => prev + 1);
			refreshList = false;
		}
	}, [refreshList]);

	/**
	 * Updates a user's permission for the given project/engine.
	 * @param {string} userId - The ID of the user to update.
	 * @param {string} permission - The permission to update the user to.
	 */
	const updateUserPermission = async (userId, permission) => {
		// Implement API call to update user permission
		const url = `${Env.MODULE}/api/auth/${type === "PROJECT" || type === "WORKSPACE" ? "project" : "engine"}/${type === "PROJECT" || type === "WORKSPACE" ? "editProjectUserPermissions" : "editEngineUserPermissions"}`;
		const response = await post(url, {
			[type === "PROJECT" || type === "WORKSPACE"
				? "projectId"
				: "engineId"]: id,
			userpermissions: [{ userid: userId, permission: permission }],
		}).catch((error) => {
			console.error("Error updating user permission:", error);
			if (type === "WORKSPACE") {
				toast.error("Error updating user permission.");
			} else {
				notification.add({
					id: "error",
					color: "error",
					message: "Error updating user permission.",
				});
			}
		});
		if (response?.data?.success) {
			// Refresh user data
			setRefreshData((prev) => {
				return prev + 1;
			});
			if (type === "WORKSPACE") {
				toast.success("User permission updated successfully.");
			} else {
				notification.add({
					id: "success",
					color: "success",
					message: "User permission updated successfully.",
				});
			}
		}
	};
	const resetSelectedMembers = () => {
		setIdsToDelete([]);
		setRefreshData((prev) => prev + 1); //fetches latest user data when a user is deleted
	};

	const deleteSelectedMembers = () => {
		const usersUrl =
			type === "PROJECT" || type === "WORKSPACE"
				? "removeProjectUserPermissions"
				: "removeEngineUserPermissions";

		post(
			`${Env.MODULE}/api/auth/${type === "PROJECT" || type === "WORKSPACE" ? "project" : "engine"}/${usersUrl}`,
			{
				[type === "PROJECT" || type === "WORKSPACE"
					? "projectId"
					: "engineId"]: id,
				ids: idsToDelete,
			},
		)
			.then(() => {
				if (type === "WORKSPACE") {
					toast.success(
						"Selected members have been deleted successfully.",
					);
				} else {
					notification.add({
						id: "success",
						color: "success",
						message:
							"Selected members have been deleted successfully.",
					});
				}
				resetSelectedMembers();
			})
			.catch(() => {
				if (type === "WORKSPACE") {
					toast.error(
						"There was an error deleting the selected members.",
					);
				} else {
					notification.add({
						id: "error",
						color: "error",
						message:
							"There was an error deleting the selected members.",
					});
				}
				resetSelectedMembers();
			});
	};
	//filtering user data based on permission group like, can view/ can edit
	const userDataFiltered =
		permission !== ""
			? userData.filter((user) => {
					if (permission !== "select access")
						return user.permission === permission;
					return true;
				})
			: userData;

	return (
		<>
			<div
				className="flex h-full w-full flex-column gap-2"
				id={membersListId}
			>
				<Card className="max-h-[300px] w-full gap-0 overflow-y-auto rounded-none p-4">
					<CardHeader className="px-2 py-0">
						<span className="font-geist font-medium text-neutral-500 text-sm leading-[20px]">
							Who has access{" "}
						</span>
					</CardHeader>
					<CardContent className="px-2 py-0">
						{userDataFiltered.length > 0 ? (
							userDataFiltered.map((user) => (
								<div
									className="flex flex-column items-center gap-2 py-2"
									key={`members-row-${user.email}`}
								>
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
									{user.permission !== "OWNER" ? (
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
														onCheckedChange={async () => {
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
														onCheckedChange={async () => {
															updateUserPermission(
																user.id,
																"EDIT",
															);
														}}
													>
														can edit
													</DropdownMenuCheckboxItem>
												</DropdownMenuRadioGroup>
											</DropdownMenuContent>
										</DropdownMenu>
									) : (
										<Muted className="w-[120px] px-4 py-2">
											Owner
										</Muted>
									)}
									<Button
										variant="outline"
										size="icon-sm"
										className="border-none"
										disabled={user.permission === "OWNER"}
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
						) : userDataLoading ? (
							<div className="flex h-full w-full items-center justify-center">
								Loading...
							</div>
						) : (
							<div className="flex h-full w-full items-center justify-center">
								<Muted>No members found</Muted>
							</div>
						)}
						<div id={apiCallTriggerId}>&nbsp;</div>
					</CardContent>
				</Card>
			</div>
			{/* <DeleteMembersOverlay
				id={id}
				type={type}
				open={idsToDelete.length > 0}
				onClose={() => {
					setIdsToDelete([]);
					setRefreshData((prev) => prev + 1); //fetches latest user data when a user is deleted
				}}
				idsToDelete={idsToDelete}
			/> */}
			<Dialog
				open={idsToDelete.length > 0}
				onOpenChange={resetSelectedMembers}
			>
				<DialogContent className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
					<DialogTitle>Delete Members</DialogTitle>

					<DialogDescription className="mb-4 flex flex-col gap-4 text-gray-600">
						Do you want to delete the selected members?
					</DialogDescription>
					<DialogFooter>
						<DialogClose>
							<Button
								variant="destructive"
								onClick={deleteSelectedMembers}
							>
								Confirm
							</Button>
							<Button
								variant="ghost"
								onClick={resetSelectedMembers}
							>
								Cancel
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
