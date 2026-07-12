import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { AppCatalogAvatar } from "@semoss/shared";
import {
	Avatar,
	AvatarFallback,
	Button,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { setUserLocked } from "@/api";
import { useAPI, useSettings } from "@/hooks";
import { MemberProfileForm } from "./member-profile-form";
import { MemberResourceAccess } from "./member-resource-access";
import type { SETTINGS_MEMBER } from "./settings.types";

type VIEW = "PROFILE" | "APP" | "ENGINE" | "INSIGHT";

export interface MemberAccessPanelProps {
	/** The selected user whose access is being managed */
	user: SETTINGS_MEMBER;
	/** Called after the user's profile/roles change so the list can refresh */
	onUserChanged: () => void;
}

/**
 * Right pane of the members tab: the selected user's profile/roles and their
 * access to apps, engines, and a project's insights.
 */
export const MemberAccessPanel = ({
	user,
	onUserChanged,
}: MemberAccessPanelProps) => {
	const { adminMode } = useSettings();

	const [view, setView] = useState<VIEW>("PROFILE");
	const [member, setMember] = useState<SETTINGS_MEMBER>(user);
	const [insightProjectId, setInsightProjectId] = useState<string>("");
	const [unlocking, setUnlocking] = useState(false);

	// Keep the local copy in sync and reset transient state when the selection changes
	useEffect(() => {
		setMember(user);
		setInsightProjectId("");
		setView("PROFILE");
	}, [user]);

	// Projects to choose from for the Insights tab (only fetched on that tab)
	const projectsApi = useAPI(
		(view === "INSIGHT" ? ["getProjects", adminMode] : []) as unknown as [
			"getProjects",
			boolean,
		],
	);
	const projectOptions =
		(projectsApi.data as
			| { project_id: string; project_name: string }[]
			| undefined) ?? [];

	const displayName = member.name || member.id || "Unknown";

	const handleUnlock = async () => {
		setUnlocking(true);
		try {
			const response = await setUserLocked(
				adminMode,
				member.id,
				member.type,
				false,
			);
			if (response?.data?.success) {
				toast.success("User unlocked");
				setMember({ ...member, locked: false });
				onUserChanged();
			} else {
				toast.error("Failed to unlock user");
			}
		} catch (error) {
			toast.error(String(error));
		} finally {
			setUnlocking(false);
		}
	};

	return (
		<div className="flex h-full flex-col gap-3">
			{/* Header */}
			<div className="flex min-w-0 items-center gap-3">
				<Avatar className="size-9 shrink-0">
					<AvatarFallback>
						{displayName.charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 flex-col leading-tight">
					<span className="truncate font-semibold text-base">
						{displayName}
					</span>
					<span className="truncate text-muted-foreground text-sm">
						{member.email
							? `${member.email} · id: ${member.id}`
							: `id: ${member.id}`}
					</span>
				</div>
			</div>

			{member.locked ? (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
					<div className="flex items-center gap-2">
						<Lock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
						<div className="flex flex-col">
							<span className="font-medium text-sm">
								This user is locked
							</span>
							<span className="text-muted-foreground text-xs">
								They can't sign in until unlocked. Unlock the
								user to restore their access.
							</span>
						</div>
					</div>
					<Button
						size="sm"
						variant="outline"
						disabled={unlocking}
						onClick={handleUnlock}
					>
						{unlocking ? "Unlocking..." : "Unlock user"}
					</Button>
				</div>
			) : null}

			<Tabs
				value={view}
				onValueChange={(value) => setView(value as VIEW)}
			>
				<TabsList className="w-fit max-w-full flex-wrap">
					<TabsTrigger value="PROFILE">Profile</TabsTrigger>
					<TabsTrigger value="APP">Apps</TabsTrigger>
					<TabsTrigger value="ENGINE">Engines</TabsTrigger>
					<TabsTrigger value="INSIGHT">Insights</TabsTrigger>
				</TabsList>
			</Tabs>

			<div className="min-h-0 flex-1 overflow-y-auto">
				{view === "PROFILE" ? (
					<MemberProfileForm
						user={member}
						onSaved={(updated) => {
							setMember(updated);
							onUserChanged();
						}}
					/>
				) : null}

				{view === "APP" ? (
					<MemberResourceAccess kind="APP" userId={member.id} />
				) : null}

				{view === "ENGINE" ? (
					<MemberResourceAccess kind="ENGINE" userId={member.id} />
				) : null}

				{view === "INSIGHT" ? (
					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-1.5">
							<Label className="text-muted-foreground text-sm">
								App
							</Label>
							<Select
								value={insightProjectId}
								onValueChange={setInsightProjectId}
							>
								<SelectTrigger className="h-auto w-full max-w-sm py-2 text-left *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:w-full">
									<SelectValue placeholder="Select an app to manage its insights" />
								</SelectTrigger>
								<SelectContent>
									{projectOptions.map((project) => (
										<SelectItem
											key={project.project_id}
											value={project.project_id}
										>
											<div className="flex w-full items-center gap-2">
												<AppCatalogAvatar
													name={
														project.project_name ||
														project.project_id
													}
													className="size-8 shrink-0 rounded-md text-xs"
												/>
												<div className="flex min-w-0 flex-col text-left">
													<span className="truncate font-medium">
														{project.project_name ||
															project.project_id}
													</span>
													<span className="truncate text-muted-foreground text-xs">
														id: {project.project_id}
													</span>
												</div>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{insightProjectId ? (
							<MemberResourceAccess
								kind="INSIGHT"
								userId={member.id}
								projectId={insightProjectId}
							/>
						) : (
							<div className="flex h-24 items-center justify-center text-muted-foreground text-sm">
								Select an app to view and edit its insight
								access
							</div>
						)}
					</div>
				) : null}
			</div>
		</div>
	);
};
