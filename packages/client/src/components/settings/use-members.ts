import { useEffect, useState } from "react";
import { useDebouncedValue } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { deleteMember } from "@/api";
import { useAPI, useServerPagination, useSettings } from "@/hooks";
import type { SETTINGS_MEMBER } from "./settings.types";

/**
 * Shared data logic for the members tab: fetches the (admin) user directory
 * with debounced server-side search + pagination, and exposes delete + refresh.
 * Extracted from the original UserTable so the two-pane layout can reuse it.
 */
export const useMembers = () => {
	const { adminMode } = useSettings();

	const [search, setSearch] = useState<string>("");
	const debouncedSearch = useDebouncedValue(search);

	const [cachedTotalUsers, setCachedTotalUsers] = useState<number>(0);
	const [paginationTotalUsers, setPaginationTotalUsers] = useState<number>(0);

	const {
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		offset,
		totalPages,
		resetPage,
	} = useServerPagination({
		totalCount: paginationTotalUsers,
		initialRowsPerPage: 50,
		pageIndexBase: 0,
	});

	const getUsers = useAPI([
		"getAllUsers",
		adminMode,
		debouncedSearch ? debouncedSearch : "",
		offset,
		rowsPerPage,
	]);

	const isLoading =
		getUsers.status === "INITIAL" || getUsers.status === "LOADING";
	const users: SETTINGS_MEMBER[] =
		getUsers.status === "SUCCESS"
			? ((getUsers.data?.users ?? []) as SETTINGS_MEMBER[])
			: [];
	const totalUsers =
		getUsers.status === "SUCCESS" &&
		typeof getUsers.data?.totalUsers === "number"
			? getUsers.data.totalUsers
			: cachedTotalUsers;
	const filteredUsers =
		getUsers.status === "SUCCESS"
			? (getUsers.data?.filteredUsers ?? totalUsers)
			: 0;
	const hasSearch = (debouncedSearch ?? "").trim().length > 0;

	useEffect(() => {
		if (getUsers.status !== "SUCCESS") {
			return;
		}
		const nextTotalUsers =
			typeof getUsers.data?.totalUsers === "number"
				? getUsers.data.totalUsers
				: cachedTotalUsers;
		if (typeof getUsers.data?.totalUsers === "number") {
			setCachedTotalUsers(getUsers.data.totalUsers);
		}
		const nextFilteredUsers =
			getUsers.data?.filteredUsers ?? nextTotalUsers;
		setPaginationTotalUsers(hasSearch ? nextFilteredUsers : nextTotalUsers);
	}, [getUsers.status, getUsers.data, cachedTotalUsers, hasSearch]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on search change
	useEffect(() => {
		resetPage();
	}, [debouncedSearch, resetPage]);

	const removeMember = async (user: SETTINGS_MEMBER): Promise<boolean> => {
		try {
			const response = await deleteMember(adminMode, user.id, user.type);
			if (!response) {
				return false;
			}
			if (response.data) {
				toast.success("Successfully deleted user");
				getUsers.refresh();
				return true;
			}
			toast.error("Error deleting user");
			return false;
		} catch (error) {
			toast.error(String(error));
			return false;
		}
	};

	return {
		adminMode,
		search,
		setSearch,
		users,
		isLoading,
		totalUsers,
		filteredUsers,
		hasSearch,
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		totalPages,
		refresh: getUsers.refresh,
		removeMember,
	};
};
