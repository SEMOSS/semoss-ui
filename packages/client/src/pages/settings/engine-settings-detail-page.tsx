import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MembersTable } from "@semoss/shared";
import { Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import {
	// MembersTable,
	PendingMembersTable,
	SettingsTiles,
	UpdateSMSS,
} from "@/components/settings";
import { useAPI, useSettings } from "@/hooks";
import type { ALL_TYPES, Role } from "@/types";

type VIEW = "CURRENT" | "PENDING";

/**
 * Show detailed settings for an engine
 */
interface EngineSettingsDetailPageProps {
	/** Type of the page to render */
	type: ALL_TYPES;
}

export const EngineSettingsUserDetailPage = (
	props: EngineSettingsDetailPageProps,
) => {
	const { type } = props;

	const { id } = useParams();
	const navigate = useNavigate();

	const [view, setView] = useState<VIEW>("CURRENT");
	const [permission, setPermission] = useState<Role | null>(null);

	const getUserEnginePermission = useAPI(["getUserEnginePermission", id]);

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
		<div className="flex w-full flex-col gap-4 self-stretch pb-8">
			{permission === "OWNER" ? (
				<SettingsTiles
					type={type}
					name={"engine"}
					id={id}
					direction="row"
					onDelete={() => {
						navigate("..", { relative: "path" });
					}}
				/>
			) : null}
			<div className="flex w-full flex-col gap-4">
				<Tabs
					value={view}
					onValueChange={(value) => setView(value as VIEW)}
				>
					<TabsList className="w-fit max-w-full flex-wrap">
						<TabsTrigger value={"CURRENT"}>Member</TabsTrigger>
						<TabsTrigger
							disabled={permission === "READ_ONLY"}
							value={"PENDING"}
						>
							Pending Requests
						</TabsTrigger>
					</TabsList>
				</Tabs>
				{view === "CURRENT" && (
					<MembersTable
						type={type}
						id={id}
						onChange={() => getUserEnginePermission.refresh()}
					/>
				)}
				{view === "PENDING" && (
					<PendingMembersTable type={type} id={id} />
				)}
			</div>
			{permission === "OWNER" ? <UpdateSMSS type={type} id={id} /> : null}
		</div>
	);
};

export const EngineSettingsAdminDetailPage = (
	props: EngineSettingsDetailPageProps,
) => {
	const { type } = props;

	const { id } = useParams();
	const navigate = useNavigate();

	const [view, setView] = useState<VIEW>("CURRENT");

	return (
		<div className="flex w-full flex-col gap-4 self-stretch pb-8">
			<SettingsTiles
				type={type}
				name={"engine"}
				id={id}
				direction="row"
				onDelete={() => {
					navigate("..", { relative: "path" });
				}}
			/>
			<div className="flex w-full flex-col gap-4">
				<Tabs
					value={view}
					onValueChange={(value) => setView(value as VIEW)}
				>
					<TabsList className="w-fit max-w-full flex-wrap">
						<TabsTrigger value={"CURRENT"}>Member</TabsTrigger>
						<TabsTrigger value={"PENDING"}>
							Pending Requests
						</TabsTrigger>
					</TabsList>
				</Tabs>
				{view === "CURRENT" && <MembersTable type={type} id={id} />}
				{view === "PENDING" && (
					<PendingMembersTable type={type} id={id} />
				)}
			</div>
			<UpdateSMSS type={type} id={id} />
		</div>
	);
};

export const EngineSettingsDetailPage = (
	props: EngineSettingsDetailPageProps,
) => {
	const { adminMode } = useSettings();
	const { type } = props;

	return (
		<>
			{adminMode ? (
				<EngineSettingsAdminDetailPage type={type} />
			) : (
				<EngineSettingsUserDetailPage type={type} />
			)}
		</>
	);
};
