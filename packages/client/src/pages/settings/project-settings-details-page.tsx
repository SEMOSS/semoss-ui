import { ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import type { Role } from "@semoss/sdk";
import { MembersTable } from "@semoss/shared";
import { Button, Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { AppSettings } from "@/components/app";
import {
	PendingMembersTable,
	SettingsTiles,
	UpdateSMSS,
} from "@/components/settings";
import { BulkAccessManagementCard } from "@/features/bulk-access-management/bulk-access-management-card";
import { useAPI, useConfig, useSettings } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

type VIEW = "CURRENT" | "PENDING" | "APP";

const AppSettingsUserDetailPage = () => {
	const { id } = useParams();
	const isDirectoryAvailable = useConfig(
		(state) => state.config.msGraphLookup === true,
	);
	const navigate = useNavigate();
	const { search } = useLocation();

	const [view, setView] = useState<VIEW>("CURRENT");
	const [permission, setPermission] = useState<Role | null>(null);

	const getUserProjectPermission = useAPI(["getUserProjectPermission", id]);

	/**
	 * @name useEffect
	 * @desc - Set Permission to see Pending Requests
	 */
	useEffect(() => {
		if (getUserProjectPermission.status !== "SUCCESS") {
			return;
		}

		if (!getUserProjectPermission.data) {
			setPermission(null);
			return;
		}

		// set the permission
		setPermission(getUserProjectPermission.data);
	}, [getUserProjectPermission.status, getUserProjectPermission.data]);

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
						navigate({ pathname: "/settings/app", search });
					}}
				/>
			) : null}
			<div className="flex w-full flex-col gap-4">
				<Tabs
					value={view}
					onValueChange={(val) => setView(val as VIEW)}
				>
					<TabsList className="w-fit max-w-full flex-wrap">
						<TabsTrigger value={"CURRENT"}>Members</TabsTrigger>
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
					<MembersTable
						id={id}
						type={"PROJECT"}
						isDirectoryAvailable={isDirectoryAvailable}
					/>
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
	const isDirectoryAvailable = useConfig(
		(state) => state.config.msGraphLookup === true,
	);
	const navigate = useNavigate();
	const { search } = useLocation();

	const [view, setView] = useState<VIEW>("CURRENT");

	return (
		<div className="flex w-full flex-col gap-4 self-stretch pb-8">
			<SettingsTiles
				type={"PROJECT"}
				name={"app"}
				id={id}
				direction={"row"}
				onDelete={() => {
					navigate({ pathname: "/settings/app", search });
				}}
			/>
			<div className="flex w-full flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<Tabs
						value={view}
						onValueChange={(val) => setView(val as VIEW)}
					>
						<TabsList className="w-fit max-w-full flex-wrap">
							<TabsTrigger value={"CURRENT"}>Members</TabsTrigger>
							<TabsTrigger value={"PENDING"}>
								Pending Requests
							</TabsTrigger>
							<TabsTrigger value={"APP"}>Data Apps</TabsTrigger>
						</TabsList>
					</Tabs>
					{view === "CURRENT" ? (
						<Button asChild variant="outline" size="sm">
							<Link to="effective-permissions" relative="path">
								<ListChecks className="size-4" aria-hidden />
								Effective Permissions
							</Link>
						</Button>
					) : null}
				</div>
				{view === "CURRENT" ? (
					<BulkAccessManagementCard
						to="bulk-access-management"
						noun="app"
						description="make many changes in admin mode, copy access from another app or engine, and review everything before it is saved"
					/>
				) : null}
				{view === "CURRENT" && id && (
					<MembersTable
						id={id}
						type={"PROJECT"}
						adminMode
						isDirectoryAvailable={isDirectoryAvailable}
					/>
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

export const ProjectSettingsDetailsPage = () => {
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
