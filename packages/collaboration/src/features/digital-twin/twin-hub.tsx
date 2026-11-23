import { ArrowRight, ArrowUp, ArrowUpRight, Plus, Search } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	H2,
	H3,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { agentImageUrl } from "@/features/agents/api/agent-image";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useTwinUpdates } from "@/features/dashboard/dashboard.context";
import { twinChatPath } from "@/lib/workspace-paths";
import { type DigitalTwin, listTwins } from "./api/digital-twin";
import { MainTwinCard } from "./main-twin-card";
import { readOpenedTwins } from "./opened-twins";
import { OwnedTwinCard } from "./owned-twin-card";
import { PersonaCard } from "./persona/persona-card";
import { useTwinRead } from "./use-twin-read";

const PREVIEW_COUNT = 3;

/**
 * The signed-in person's own Digital Twin, then their persona and the twins
 * they share, then the twins other people have shared with them.
 */
export function TwinHub() {
	const twins = useTwinRead(listTwins);
	const mineId = useId();
	const sharedId = useId();
	const searchRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [isExpanded, setExpanded] = useState(false);
	const { profile, liveProfile } = useCollaborationSession().state;
	const [opened] = useState(() =>
		readOpenedTwins(profile.email || profile.id),
	);
	const twinUpdates = useTwinUpdates();
	const waiting = new Map<string, number>();
	for (const update of twinUpdates.data?.updates ?? [])
		waiting.set(update.twinId, (waiting.get(update.twinId) ?? 0) + 1);

	const term = query.trim().toLocaleLowerCase();
	const matches = (twin: DigitalTwin, owner = twin.ownerName) =>
		twin.name.toLocaleLowerCase().includes(term) ||
		Boolean(owner?.toLocaleLowerCase().includes(term));
	const mine =
		twins.data?.mine.filter((twin) =>
			matches(twin, twin.ownerName || liveProfile?.name || profile.name),
		) ?? [];
	const shared = twins.data?.shared.filter((twin) => matches(twin)) ?? [];
	const visibleMine =
		isExpanded || term ? mine : mine.slice(0, PREVIEW_COUNT);
	const hasSearchResults = mine.length + shared.length > 0;
	return (
		<CollaborationPage>
			<div className="@container/twins">
				<CollaborationPageHeader
					title="Digital Twins"
					description="Your own Digital Twin, the twins you share, and the twins other people share with you."
					titleClassName="font-display font-medium text-4xl leading-none tracking-tight md:text-5xl 2xl:text-5xl"
					layoutClassName="flex-col @3xl/twins:flex-row"
					className="mb-5"
					actions={
						<>
							{twins.data &&
								twins.data.mine.length +
									twins.data.shared.length >
									0 && (
									<InputGroup className="pointer-coarse:min-h-11 w-full bg-card sm:w-56">
										<InputGroupAddon>
											<Search aria-hidden="true" />
										</InputGroupAddon>
										<InputGroupInput
											type="search"
											aria-label="Find a twin or owner"
											placeholder="Find a twin or owner…"
											ref={searchRef}
											value={query}
											onChange={(event) =>
												setQuery(event.target.value)
											}
										/>
									</InputGroup>
								)}
							<Button asChild className="pointer-coarse:min-h-11">
								<Link to="/twins/mine?create=true">
									<Plus aria-hidden="true" />
									Create a Twin to Share
								</Link>
							</Button>
						</>
					}
				/>
				{/* outside the list's states: it shows while the twins load or fail, whatever is searched for */}
				<div className="mb-6">
					<MainTwinCard />
				</div>
				{twins.data ? (
					<div className="flex min-w-0 flex-col gap-6">
						<PersonaCard
							twinIds={twins.data.mine.map((twin) => twin.id)}
						/>
						{(!term || mine.length > 0) && (
							<section
								aria-labelledby={mineId}
								className="flex flex-col gap-3"
							>
								<div className="flex flex-wrap items-center gap-2">
									<H2
										id={mineId}
										className="font-semibold text-xl tracking-tight"
									>
										Twins You Share
									</H2>
									<Badge
										variant="outline"
										className="rounded-full tabular-nums"
									>
										{mine.length}
									</Badge>
									{!term && mine.length > PREVIEW_COUNT && (
										<Button
											type="button"
											size="sm"
											variant="ghost"
											className="ms-auto pointer-coarse:min-h-11"
											aria-expanded={isExpanded}
											aria-controls={`${mineId}-cards`}
											onClick={() =>
												setExpanded((value) => !value)
											}
										>
											{isExpanded ? (
												<>
													Show fewer{" "}
													<ArrowUp aria-hidden="true" />
												</>
											) : (
												<>
													View all {mine.length}{" "}
													<ArrowRight aria-hidden="true" />
												</>
											)}
										</Button>
									)}
								</div>
								{mine.length > 0 && (
									<P className="-mt-2 text-muted-foreground text-sm">
										Each knows only what you copied into it.
									</P>
								)}
								{mine.length > 0 ? (
									<ul
										id={`${mineId}-cards`}
										className="grid @2xl/twins:grid-cols-3 @lg/twins:grid-cols-2 items-start @4xl/twins:gap-4 gap-3"
									>
										{visibleMine.map((twin) => (
											<OwnedTwinCard
												key={twin.id}
												twin={twin}
												updateCount={
													waiting.get(twin.id) ?? 0
												}
											/>
										))}
									</ul>
								) : (
									<P className="rounded-xl border border-dashed p-6 text-muted-foreground text-sm">
										You are not sharing a twin yet. Create
										one, choose what it knows, then name the
										people who can ask it about you.
									</P>
								)}
							</section>
						)}
						{(!term || shared.length > 0) && (
							<section
								aria-labelledby={sharedId}
								className="flex flex-col gap-2"
							>
								<div className="flex items-center gap-2">
									<H2
										id={sharedId}
										className="font-semibold text-xl tracking-tight"
									>
										Shared With You
									</H2>
									<Badge
										variant="outline"
										className="rounded-full tabular-nums"
									>
										{shared.length}
									</Badge>
								</div>
								{shared.length > 0 ? (
									<ul className="grid @lg/twins:grid-cols-2 gap-x-8">
										{shared.map((twin) => (
											<li
												key={twin.id}
												className="flex min-w-0 items-center gap-3 border-b py-3"
											>
												<AgentAvatar
													agent={{
														name: twin.name,
														avatar: agentImageUrl(
															twin.id,
														),
													}}
												/>
												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
														<H3 className="wrap-anywhere min-w-0 font-semibold text-base leading-snug">
															{twin.name}
														</H3>
														{!opened.has(
															twin.id,
														) && (
															<Badge variant="secondary">
																New
															</Badge>
														)}
													</div>
													{twin.ownerName && (
														<P className="wrap-anywhere text-muted-foreground text-sm">
															By {twin.ownerName}
														</P>
													)}
												</div>
												<Button
													asChild
													size="sm"
													variant="ghost"
													className="pointer-coarse:min-h-11"
												>
													<Link
														to={twinChatPath(
															twin.id,
														)}
														aria-label={`Chat: ${twin.name}`}
													>
														Chat{" "}
														<ArrowUpRight aria-hidden="true" />
													</Link>
												</Button>
											</li>
										))}
									</ul>
								) : (
									<P className="border-t py-3 text-muted-foreground text-sm">
										No one has shared a Digital Twin with
										you yet. When someone does, it shows
										here.
									</P>
								)}
							</section>
						)}
						{term && !hasSearchResults && (
							<div className="flex flex-col items-start gap-2">
								<H2 className="text-lg">No matching twins</H2>
								<P className="text-muted-foreground text-sm">
									Try a different twin or owner name.
								</P>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										setQuery("");
										searchRef.current?.focus();
									}}
								>
									Clear search
								</Button>
							</div>
						)}
						<output className="sr-only">
							{term
								? `${mine.length + shared.length} matching twins`
								: ""}
						</output>
					</div>
				) : twins.error ? (
					<Alert variant="destructive">
						<AlertTitle>Could not load Digital Twins</AlertTitle>
						<AlertDescription>
							{twins.error}
							<Button
								type="button"
								variant="outline"
								onClick={twins.reload}
							>
								Try again
							</Button>
						</AlertDescription>
					</Alert>
				) : (
					<div className="flex flex-col gap-4">
						<Skeleton className="h-32 w-full" />
						<Skeleton className="h-7 w-40" />
						<Skeleton className="h-40 w-full" />
						<output className="sr-only">
							Loading Digital Twins…
						</output>
					</div>
				)}
			</div>
		</CollaborationPage>
	);
}
