import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { styled, ToggleTabsGroup } from "@semoss/ui";
import { AppSettings } from "@/components/app";
import {
	MembersTable,
	PendingMembersTable,
	SettingsTiles,
} from "@/components/settings";
import { useAPI, useSettings } from "@/hooks";
import type { Role } from "@/types";

const StyledContainer = styled("div")(({ theme }) => ({
	width: "100%",
	display: "flex",
	alignSelf: "stretch",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(2),
}));

const StyledContent = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(2),
	flexShrink: "0",
}));

type VIEW = "CURRENT" | "PENDING" | "APP";

export const AppSettingsUserDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [view, setView] = useState<VIEW>("CURRENT");
	const [permission, setPermission] = useState<Role | null>(null);

	const getUserEnginePermission = useAPI(["getUserProjectPermission", id]);

	/**
	 * @name useEffect
	 * @desc - Set Permission to see Pending Requests
	 */
	useEffect(() => {
		if (getUserEnginePermission.status !== "SUCCESS") {
			return;
		}

		if (
			!getUserEnginePermission.data ||
			!getUserEnginePermission.data.permission
		) {
			setPermission(null);
			return;
		}

		// set the permission
		setPermission(getUserEnginePermission.data.permission);
	}, [getUserEnginePermission.status, getUserEnginePermission.data]);

	// if there is no permission, ignore
	if (!permission) {
		return null;
	}

	return (
		<StyledContainer>
			{permission === "OWNER" ? (
				<SettingsTiles
					type={"PROJECT"}
					name={"app"}
					id={id}
					direction={"row"}
					onDelete={() => {
						navigate("/settings/app");
					}}
				/>
			) : null}
			<StyledContent>
				<ToggleTabsGroup
					value={view}
					onChange={(e, v) => setView(v as VIEW)}
				>
					<ToggleTabsGroup.Item label="Member" value={"CURRENT"} />
					<ToggleTabsGroup.Item
						label="Pending Requests"
						disabled={permission === "READ_ONLY"}
						value={"PENDING"}
					/>
					<ToggleTabsGroup.Item
						label="Data Apps"
						disabled={permission === "READ_ONLY"}
						value={"APP"}
					/>
				</ToggleTabsGroup>
				{view === "CURRENT" && (
					<MembersTable
						id={id}
						type={"PROJECT"}
						onChange={() => getUserEnginePermission.refresh()}
					/>
				)}
				{view === "PENDING" && (
					<PendingMembersTable id={id} type={"PROJECT"} />
				)}
				{view === "APP" && <AppSettings id={id} />}
			</StyledContent>
		</StyledContainer>
	);
};

export const AppSettingsAdminDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [view, setView] = useState<VIEW>("CURRENT");

	return (
		<StyledContainer>
			<SettingsTiles
				type={"PROJECT"}
				name={"app"}
				id={id}
				direction={"row"}
				onDelete={() => {
					navigate("/settings/app");
				}}
			/>
			<StyledContent>
				<ToggleTabsGroup
					value={view}
					onChange={(e, v) => setView(v as VIEW)}
				>
					<ToggleTabsGroup.Item label="Member" value={"CURRENT"} />
					<ToggleTabsGroup.Item
						label="Pending Requests"
						value={"PENDING"}
					/>
					<ToggleTabsGroup.Item label="Data Apps" value={"APP"} />
				</ToggleTabsGroup>
				{view === "CURRENT" && (
					<MembersTable id={id} type={"PROJECT"} />
				)}
				{view === "PENDING" && (
					<PendingMembersTable id={id} type={"PROJECT"} />
				)}
				{view === "APP" && <AppSettings id={id} />}
			</StyledContent>
		</StyledContainer>
	);
};

export const AppSettingsDetailPage = () => {
	const { adminMode } = useSettings();

	return (
		<>
			{adminMode ? (
				<AppSettingsAdminDetailPage />
			) : (
				<AppSettingsUserDetailPage />
			)}
		</>
	);
};
