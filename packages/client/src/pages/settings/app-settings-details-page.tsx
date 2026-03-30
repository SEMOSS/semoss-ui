import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MembersTable } from "@semoss/shared";
import { Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { AppSettings } from "@/components/app";
import {
	// MembersTable,
	PendingMembersTable,
	SettingsTiles,
	UpdateSMSS,
} from "@/components/settings";
import { useAPI, useSettings } from "@/hooks";
import type { Role } from "@/types";

type VIEW = "CURRENT" | "PENDING" | "APP";

const AppSettingsUserDetailPage = () => {
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

		if (!getUserEnginePermission.data) {
			setPermission(null);
			return;
		}

		// set the permission
		setPermission(getUserEnginePermission.data);
	}, [getUserEnginePermission.status, getUserEnginePermission.data]);

	// if there is no permission, ignore
	if (!permission) {
		return null;
	}

	return (
		<div className="flex w-full flex-col gap-4 self-stretch pb-8">
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
			<div className="flex w-full flex-col gap-4">
				<Tabs
					value={view}
					onValueChange={(val) => setView(val as VIEW)}
				>
					<TabsList className="w-fit max-w-full flex-wrap">
						<TabsTrigger value={"CURRENT"}>Member</TabsTrigger>
						<TabsTrigger
							disabled={permission === "READ_ONLY"}
							value={"PENDING"}
						>
							Pending Requests
						</TabsTrigger>
						<TabsTrigger
							disabled={permission === "READ_ONLY"}
							value={"APP"}
						>
							Data Apps
						</TabsTrigger>
					</TabsList>
				</Tabs>
				{view === "CURRENT" && (
					// <>
					// <MembersTable
					// 	id={id}
					// 	type={"PROJECT"}
					// 	onChange={() => getUserEnginePermission.refresh()}
					// />
					<MembersTable id={id} type={"PROJECT"} />
					// </>
				)}
				{view === "PENDING" && (
					<PendingMembersTable id={id} type={"PROJECT"} />
				)}
				{view === "APP" && <AppSettings id={id} />}
			</div>
			{permission === "OWNER" ? (
				<UpdateSMSS type={"PROJECT"} id={id} />
			) : null}
		</div>
	);
};

const AppSettingsAdminDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [view, setView] = useState<VIEW>("CURRENT");

	return (
		<div className="flex w-full flex-col gap-4 self-stretch pb-8">
			<SettingsTiles
				type={"PROJECT"}
				name={"app"}
				id={id}
				direction={"row"}
				onDelete={() => {
					navigate("/settings/app");
				}}
			/>
			<div className="flex w-full flex-col gap-4">
				<Tabs
					value={view}
					onValueChange={(val) => setView(val as VIEW)}
				>
					<TabsList className="w-fit max-w-full flex-wrap">
						<TabsTrigger value={"CURRENT"}>Member</TabsTrigger>
						<TabsTrigger value={"PENDING"}>
							Pending Requests
						</TabsTrigger>
						<TabsTrigger value={"APP"}>Data Apps</TabsTrigger>
					</TabsList>
				</Tabs>
				{view === "CURRENT" && (
					<>
						<MembersTable id={id} type={"PROJECT"} />
						{/* <MembersTableShared id={id} type={"PROJECT"} /> */}
					</>
				)}
				{view === "PENDING" && (
					<PendingMembersTable id={id} type={"PROJECT"} />
				)}
				{view === "APP" && <AppSettings id={id} />}
			</div>
			<UpdateSMSS type={"PROJECT"} id={id} />
		</div>
	);
};

export const AppSettingsDetailsPage = () => {
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
