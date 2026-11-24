import { ArrowUpRight, Fingerprint, Pencil } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import { Button, H2, P } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { newRoomPath, twinPersonaPath } from "@/lib/workspace-paths";
import { MainTwinEdit } from "./main-twin-edit";
import {
	FOCUS_ASK_BOX,
	MAIN_TWIN_PRIVACY,
	MAIN_TWIN_REACH,
	useMainTwin,
} from "./use-main-twin";

const HEADING = "Your Digital Twin";

/**
 * The signed-in person's own Digital Twin at the top of Digital Twins: who it
 * is, that it is private to them, and the ways into its chat, its persona and
 * its name and picture. It reads only the session, so it shows whatever the
 * lists below it are doing.
 */
export function MainTwinCard() {
	const titleId = useId();
	const twin = useMainTwin();
	// a server that predates the twin has nowhere to save a name or a picture
	const canEdit =
		useOptionalCollaborationSession()?.state.mainTwin !== undefined;
	const editButton = useRef<HTMLButtonElement>(null);
	const [isEditing, setIsEditing] = useState(false);
	return (
		<section aria-labelledby={titleId} className="min-w-0">
			<div className="flex min-w-0 @2xl/twins:flex-row flex-col @2xl/twins:items-center gap-4 rounded-xl border bg-card @2xl/twins:p-6 p-4 text-card-foreground">
				<div className="flex min-w-0 flex-1 items-center gap-4">
					{/* the Microsoft photo is 96 px wide, so it is drawn smaller than a picture the person chose */}
					<AgentAvatar
						agent={{ name: twin.name, avatar: twin.avatar }}
						size={twin.isSaved ? "xl" : "lg"}
					/>
					<div className="flex min-w-0 flex-col gap-1">
						<H2
							id={titleId}
							className="font-semibold text-xl tracking-tight"
						>
							{HEADING}
						</H2>
						{twin.name !== HEADING && (
							<P className="wrap-anywhere font-display font-medium @2xl/twins:text-3xl text-2xl leading-tight tracking-tight">
								{twin.name}
							</P>
						)}
						<P className="text-muted-foreground text-sm">
							{MAIN_TWIN_PRIVACY}. {MAIN_TWIN_REACH}
						</P>
					</div>
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					<Button
						asChild
						className="pointer-coarse:min-h-11 bg-foreground text-background hover:bg-foreground/85"
					>
						<Link
							to={newRoomPath()}
							state={FOCUS_ASK_BOX}
							aria-label={`Chat: ${twin.name}`}
						>
							Chat <ArrowUpRight aria-hidden="true" />
						</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						className="pointer-coarse:min-h-11"
					>
						<Link to={twinPersonaPath()}>
							<Fingerprint aria-hidden="true" />
							Persona
						</Link>
					</Button>
					{canEdit && (
						<Button
							type="button"
							variant="outline"
							ref={editButton}
							className="pointer-coarse:min-h-11"
							onClick={() => setIsEditing(true)}
						>
							<Pencil aria-hidden="true" />
							Name and Picture
						</Button>
					)}
				</div>
			</div>
			{isEditing && (
				<MainTwinEdit
					returnFocusRef={editButton}
					onClose={() => setIsEditing(false)}
				/>
			)}
		</section>
	);
}
