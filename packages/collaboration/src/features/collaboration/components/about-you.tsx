import { useState } from "react";
import { Link } from "react-router";
import {
	Button,
	H1,
	H2,
	P,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { PersonAvatar } from "./person-avatar";
import { ProfileForm } from "./profile-form";
import { Section } from "./section";

/** Separates the fictional scenario profile from the signed-in person's context. */
export function AboutYou() {
	const { state, dispatch } = useCollaborationSession();
	const [target, setTarget] = useState("live");
	const profile = target === "sample" ? state.profile : state.liveProfile;
	return (
		<CollaborationSurface
			asideTitle="Profile context"
			aside={
				<Section title="Your context" variant="widget">
					<P className="text-muted-foreground text-xs leading-5">
						Confirmed profile and writing preferences can guide the
						assistant. Profile edits apply to this session.
					</P>
					<Button asChild variant="outline" size="sm">
						<Link to="/brain/sources">Sources and rules</Link>
					</Button>
				</Section>
			}
		>
			<div>
				<header className="space-y-1.5 px-4 pt-5 pb-3 md:px-6">
					<H1 className="font-semibold text-xl">About you</H1>
					<P className="text-muted-foreground text-sm">
						The profile and writing preferences you choose for
						assistant context.
					</P>
				</header>
				<Tabs
					value={target}
					onValueChange={setTarget}
					className="gap-0"
				>
					<div className="border-b px-4 md:px-6">
						<TabsList className={collaborationTabsStyles.list}>
							<TabsTrigger
								value="live"
								className={collaborationTabsStyles.trigger}
							>
								Your profile
							</TabsTrigger>
							<TabsTrigger
								value="sample"
								className={collaborationTabsStyles.trigger}
							>
								Workspace profile
							</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent value={target} className="mt-0">
						{profile ? (
							<>
								<div className="flex items-start gap-3 border-b px-4 py-5 md:px-6">
									<PersonAvatar
										name={profile.name}
										initials={profile.initials}
									/>
									<div className="min-w-0 space-y-1">
										<H2 className="font-semibold text-lg">
											{profile.name}
										</H2>
										<Small className="break-words font-normal text-muted-foreground text-xs leading-5">
											{profile.email}
											{profile.org
												? ` · ${profile.org}`
												: ""}
										</Small>
									</div>
								</div>
								<div className="border-b px-4 py-4 md:px-6">
									<ProfileForm
										key={`${target}-${profile.id}`}
										profile={profile}
										target={
											target === "sample"
												? "sample"
												: "live"
										}
									/>
								</div>
								<Section
									title="VIPs"
									className="space-y-3 px-4 py-4 md:px-6"
								>
									{state.people
										.filter(
											(person) =>
												person.vip &&
												person.isSample ===
													(target === "sample"),
										)
										.map((person) => (
											<div
												key={person.id}
												className="flex items-center justify-between gap-3 border-b pb-3"
											>
												<PersonAvatar
													name={person.name}
													initials={person.initials}
												/>
												<div className="min-w-0 flex-1">
													<Link
														className="break-words font-medium text-sm hover:underline"
														to={`/brain/people/${encodeURIComponent(person.id)}`}
													>
														{person.name}
													</Link>
													<Small className="mt-0.5 font-normal text-muted-foreground text-xs">
														{person.title ||
															person.relationship}
													</Small>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														dispatch({
															type: "person.save",
															personId: person.id,
															changes: {
																vip: false,
															},
														})
													}
												>
													Remove VIP
												</Button>
											</div>
										))}
									<Button asChild variant="outline" size="sm">
										<Link to="/brain/people">
											Choose VIPs from People
										</Link>
									</Button>
								</Section>
							</>
						) : (
							<P className="p-4 text-muted-foreground text-sm leading-6 md:p-6">
								Your account profile is unavailable. You can
								browse sources or view the workspace profile.
							</P>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</CollaborationSurface>
	);
}
