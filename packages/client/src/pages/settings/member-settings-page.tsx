import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button, Card } from "@semoss/ui/next";
import {
	MemberAccessPanel,
	MemberList,
	type SETTINGS_MEMBER,
} from "@/components/settings";
import { useSettings } from "@/hooks";

export const MemberSettingsPage = () => {
	const { adminMode } = useSettings();

	const [selectedUser, setSelectedUser] = useState<SETTINGS_MEMBER | null>(
		null,
	);
	const [refreshKey, setRefreshKey] = useState(0);

	// Both panels are visible at the `lg` breakpoint (1024px). On desktop we
	// auto-select the first user so the detail pane isn't empty on load; on
	// smaller screens the list stays in front until a user is tapped.
	const [isDesktop, setIsDesktop] = useState(
		() =>
			typeof window !== "undefined" &&
			window.matchMedia("(min-width: 1024px)").matches,
	);
	useEffect(() => {
		const mql = window.matchMedia("(min-width: 1024px)");
		const onChange = () => setIsDesktop(mql.matches);
		onChange();
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	if (!adminMode) {
		return <Navigate to="/settings" />;
	}

	return (
		<div className="flex flex-col gap-4 lg:grid lg:h-[calc(100dvh-15rem)] lg:min-h-[500px] lg:grid-cols-[minmax(280px,360px)_1fr]">
			{/* Master (user list). On mobile it takes over the screen and is
			    hidden once a user is selected. */}
			<div
				className={`${
					selectedUser ? "hidden lg:block" : "block"
				} h-[70vh] min-h-0 lg:h-full`}
			>
				<MemberList
					selectedUserId={selectedUser?.id}
					onSelectUser={setSelectedUser}
					refreshKey={refreshKey}
					autoSelectFirst={isDesktop}
				/>
			</div>

			{/* Detail (access panel). On mobile it is hidden until a user is
			    selected, then replaces the list with a back button. */}
			<div
				className={`${
					selectedUser ? "block" : "hidden lg:block"
				} min-h-0 lg:h-full`}
			>
				{selectedUser ? (
					<Card className="flex h-full min-h-0 flex-col gap-3 overflow-hidden border border-border/60 p-3">
						<Button
							variant="ghost"
							size="sm"
							className="w-fit lg:hidden"
							onClick={() => setSelectedUser(null)}
						>
							<ArrowLeft className="size-4" />
							Back to members
						</Button>
						<div className="min-h-0 flex-1">
							<MemberAccessPanel
								user={selectedUser}
								onUserChanged={() =>
									setRefreshKey((key) => key + 1)
								}
							/>
						</div>
					</Card>
				) : (
					<Card className="hidden h-full items-center justify-center border border-border/60 p-3 text-center text-muted-foreground text-sm lg:flex">
						Select a member to view and edit their access
					</Card>
				)}
			</div>
		</div>
	);
};
