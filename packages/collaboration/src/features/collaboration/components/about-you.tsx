import { useId } from "react";
import { Link } from "react-router";
import { Button, Card, H2, H3, P } from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { PersonAvatar } from "./person-avatar";
import { ProfileForm } from "./profile-form";

/** The signed-in person's profile and VIPs, composed inside Settings. */
export function AboutYou() {
	const titleId = useId();
	const { state, dispatch } = useCollaborationSession();
	const profile = state.liveProfile;
	const vips = state.people.filter(
		(person) => person.vip && !person.isSample,
	);
	return (
		<section className="min-w-0" aria-labelledby={titleId}>
			<Card className="gap-5 p-5 shadow-none">
				<header className="space-y-2 border-b pb-4">
					<H2 id={titleId} className="font-medium text-xl">
						About you
					</H2>
					<P className="text-base text-muted-foreground">
						The profile and writing preferences you choose for
						assistant context.
					</P>
				</header>
				{profile ? (
					<>
						<div className="flex items-start gap-4">
							<PersonAvatar
								name={profile.name}
								initials={profile.initials}
							/>
							<div className="min-w-0 space-y-1">
								<P className="break-words font-medium text-base">
									{profile.name}
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
						<section
							className="space-y-4 border-border border-t pt-5"
							aria-label="VIPs"
						>
							<H3 className="font-medium text-base">VIPs</H3>
							{vips.length === 0 && (
								<P className="text-base text-muted-foreground">
									Choose the people you want to keep close at
									hand.
								</P>
							)}
							{vips.map((person) => (
								<div
									key={person.id}
									className="flex flex-wrap items-center gap-3 border-border border-b pb-4"
								>
									<PersonAvatar
										name={person.name}
										initials={person.initials}
									/>
									<div className="min-w-0 flex-1">
										<Link
											className="break-words font-medium text-base underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
											to={`/brain/people/${encodeURIComponent(person.id)}`}
										>
											{person.name}
										</Link>
										<P className="break-words text-base text-muted-foreground">
											{person.title ||
												person.relationship}
										</P>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="pointer-coarse:min-h-11"
										aria-label={`Remove VIP ${person.name}`}
										onClick={() =>
											dispatch({
												type: "person.save",
												personId: person.id,
												changes: { vip: false },
											})
										}
									>
										Remove VIP
									</Button>
								</div>
							))}
							<Button asChild variant="outline">
								<Link to="/brain/people">
									Choose VIPs from People
								</Link>
							</Button>
						</section>
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
