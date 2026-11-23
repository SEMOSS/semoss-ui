import { useId } from "react";
import { Link } from "react-router";
import { Card, H2, P } from "@semoss/ui/next";
import { givenFirst } from "@/lib/person-name";
import { personaPath } from "@/lib/workspace-paths";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { PersonAvatar } from "./person-avatar";
import { ProfileForm } from "./profile-form";

/** The signed-in person's profile, composed inside Settings. Their VIPs are on People. */
export function AboutYou() {
	const titleId = useId();
	const profile = useCollaborationSession().state.liveProfile;
	return (
		<section className="min-w-0" aria-labelledby={titleId}>
			<Card className="gap-5 p-5 shadow-none">
				<header className="space-y-2 border-b pb-4">
					<H2 id={titleId} className="font-medium text-xl">
						About you
					</H2>
					<P className="text-base text-muted-foreground">
						The profile your Digital Twin knows you by. How you
						write is under{" "}
						<Link
							to={personaPath()}
							className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
						>
							Persona
						</Link>
						.
					</P>
				</header>
				{profile ? (
					<>
						<div className="flex items-start gap-4">
							<PersonAvatar
								name={givenFirst(profile.name)}
								initials={profile.initials}
								email={profile.email}
							/>
							<div className="min-w-0 space-y-1">
								<P className="break-words font-medium text-base">
									{givenFirst(profile.name)}
								</P>
								<P className="break-words text-base text-muted-foreground">
									{profile.email}
									{profile.org ? ` · ${profile.org}` : ""}
								</P>
							</div>
						</div>
						<ProfileForm
							key={profile.id}
							profile={profile}
							target="live"
						/>
					</>
				) : (
					<P className="text-base text-muted-foreground">
						Your account profile is unavailable. You can still
						change your other settings.
					</P>
				)}
			</Card>
		</section>
	);
}
