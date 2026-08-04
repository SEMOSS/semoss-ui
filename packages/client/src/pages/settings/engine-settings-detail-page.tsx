import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { MembersTable, type Role } from "@semoss/shared";
import { Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import {
	PendingMembersTable,
	SettingsTiles,
	UpdateSMSS,
} from "@/components/settings";
import { useAPI, useSettings } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import type { ALL_TYPES } from "@/types";

type VIEW = "CURRENT" | "PENDING";

/**
 * Show detailed settings for an engine
 */
interface EngineSettingsDetailPageProps {
	/** Type of the page to render */
	type: ALL_TYPES;
}

const EngineSettingsUserDetailPage = (props: EngineSettingsDetailPageProps) => {
	const { type } = props;

	const { id } = useParams();
	const navigate = useNavigate();
	const { search } = useLocation();

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
					type={type}
					name={"engine"}
					id={id}
					direction="row"
					onDelete={() => {
						navigate(
							{ pathname: "..", search },
							{ relative: "path" },
						);
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

const EngineSettingsAdminDetailPage = (
	props: EngineSettingsDetailPageProps,
) => {
	const { type } = props;

	const { id } = useParams();
	const navigate = useNavigate();
	const { search } = useLocation();

	const [view, setView] = useState<VIEW>("CURRENT");

	return (
		<div className="flex w-full flex-col gap-4 self-stretch pb-8">
			<SettingsTiles
				type={type}
				name={"engine"}
				id={id}
				direction="row"
				onDelete={() => {
					navigate({ pathname: "..", search }, { relative: "path" });
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
				{view === "CURRENT" && (
					<MembersTable type={type} id={id} adminMode />
				)}
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
