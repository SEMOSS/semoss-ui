import { useState } from "react";
import { Link } from "react-router";
import {
	Badge,
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
import { ProfileForm } from "./profile-form";
import { Section } from "./section";

/** Separates the fictional scenario profile from the signed-in person's context. */
export function AboutYou() {
	const { state, dispatch } = useCollaborationSession();
	const [target, setTarget] = useState("live");
	const profile = target === "sample" ? state.profile : state.liveProfile;
	return (
		<CollaborationSurface>
			<div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
				<header className="space-y-2">
					<H1 className="font-semibold text-xl">About you</H1>
					<P className="text-muted-foreground">
						The profile and writing preferences you choose for
						assistant context.
					</P>
				</header>
				<Tabs value={target} onValueChange={setTarget}>
					<TabsList>
						<TabsTrigger value="live">Your profile</TabsTrigger>
						<TabsTrigger value="sample">Sample profile</TabsTrigger>
					</TabsList>
					<TabsContent value={target} className="space-y-6 pt-4">
						{profile ? (
							<>
								<div className="space-y-2">
									<H2 className="font-semibold text-lg">
										{profile.name}
									</H2>
									<Small className="break-words text-muted-foreground">
										{profile.email}
										{profile.org ? ` · ${profile.org}` : ""}
									</Small>
									{target === "sample" && (
										<Badge variant="outline">
											Fictional sample identity
										</Badge>
									)}
								</div>
								<ProfileForm
									key={`${target}-${profile.id}`}
									profile={profile}
									target={
										target === "sample" ? "sample" : "live"
									}
								/>
								<Section title="VIPs">
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
												className="flex items-center justify-between gap-3"
											>
												<Link
													className="hover:underline"
													to={`/brain/people/${encodeURIComponent(person.id)}`}
												>
													{person.name}
												</Link>
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
									<Button asChild variant="outline">
										<Link to="/brain/people">
											Choose VIPs from People
										</Link>
									</Button>
								</Section>
							</>
						) : (
							<P className="text-muted-foreground">
								Your account profile is unavailable. You can
								continue browsing the sample scenario and
								sources; no sample identity will be used for
								your connected messages.
							</P>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</CollaborationSurface>
	);
}
