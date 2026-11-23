import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	H2,
	Input,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
} from "@semoss/ui/next";
import { isFollowed, type Person } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { BrainOverview } from "./brain-overview";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { PersonAvatar } from "./person-avatar";
import { TopicChip } from "./topic-chip";

/**
 * Your people, like a follow list: VIPs first, then the people you follow, then Brain's suggestions.
 * Everyone else only shows up when you search. Each row makes its person a VIP, or stops them being one.
 */
export function PeopleDirectory() {
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const [query, setQuery] = useState("");
	const [account, setAccount] = useState("all");
	const searching = query.trim().length > 0;
	const matching = state.people
		.filter(
			(person) =>
				!person.automated &&
				(account === "all" ||
					person.accountId === account ||
					(account === "connected" && !person.isSample)) &&
				`${person.name} ${person.email ?? ""}`
					.toLowerCase()
					.includes(query.toLowerCase()),
		)
		.sort(
			(left, right) =>
				Number(right.vip) - Number(left.vip) ||
				(right.strength ?? 0) - (left.strength ?? 0),
		);
	const vips = matching.filter((person) => person.vip);
	// a VIP is always followed; they have a section of their own, so they are not listed twice
	const people = matching.filter(
		(person) => isFollowed(person) && !person.vip,
	);
	const suggested = matching.filter(
		(person) => person.follow === "suggested",
	);
	const others = searching
		? matching.filter(
				(person) =>
					!isFollowed(person) && person.follow !== "suggested",
			)
		: [];
	const follow = (person: Person, value: Person["follow"]) =>
		dispatch({
			type: "person.save",
			personId: person.id,
			changes: { follow: value },
		});
	// Whose VIP button was pressed from the keyboard. Their row moves to another section, and the button it
	// has there takes the focus that would be lost with the old one. A pointer click leaves the page where it is.
	const movedByKeyboard = useRef<string | null>(null);
	// good for the one render after the press: a row that left the page must not take the focus from the
	// filter when a search finds it again
	useEffect(() => {
		movedByKeyboard.current = null;
	});

	const row = (person: Person, action?: ReactNode) => (
		<li
			key={person.id}
			className="flex flex-wrap items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/30 md:px-6"
		>
			<PersonAvatar
				name={person.name}
				initials={person.initials}
				email={person.email}
			/>
			{/* wide enough to read: an action and chips that nearly fill the line wrap under the name, not beside a sliver of it */}
			<div className="min-w-40 flex-1">
				<Link
					className="break-words font-medium text-sm hover:underline"
					to={`/brain/people/${encodeURIComponent(person.id)}`}
				>
					{person.name}
				</Link>
				<Small className="mt-0.5 break-words font-normal text-muted-foreground text-xs leading-5">
					{person.title ||
						person.email ||
						"Contact details unavailable"}
					{person.relationship ? ` - ${person.relationship}` : ""}
					{person.follow === "suggested" && person.followReason
						? ` - ${person.followReason}`
						: ""}
				</Small>
			</div>
			<div className="flex flex-wrap items-center gap-1.5">
				{action}
				<Button
					ref={(node) => {
						if (node && movedByKeyboard.current === person.id) {
							movedByKeyboard.current = null;
							node.focus();
						}
					}}
					size="sm"
					variant="ghost"
					className="pointer-coarse:min-h-11"
					aria-label={`${person.vip ? "Remove VIP" : "Make VIP"} ${person.name}`}
					onClick={(event) => {
						// a click made from the keyboard carries no pointer detail
						if (event.detail === 0)
							movedByKeyboard.current = person.id;
						dispatch({
							type: "person.save",
							personId: person.id,
							// a VIP is always followed, as on the person's own page
							changes: person.vip
								? { vip: false }
								: { vip: true, follow: "following" },
						});
					}}
				>
					{person.vip ? "Remove VIP" : "Make VIP"}
				</Button>
				{person.neverIngest && (
					<Badge variant="outline">Excluded</Badge>
				)}
				{person.topics.slice(0, 2).map((id) => {
					const topic = state.topics.find((item) => item.id === id);
					return topic && <TopicChip key={id} topic={topic} />;
				})}
				{person.topics.length > 2 && (
					<Small className="font-normal text-muted-foreground text-xs">
						+{person.topics.length - 2}
					</Small>
				)}
			</div>
		</li>
	);
	const section = (
		title: string,
		list: Person[],
		render: (p: Person) => ReactNode,
		empty?: string,
	) => (
		<section aria-label={title}>
			<H2 className="px-4 pt-4 pb-2 font-medium text-muted-foreground text-xs md:px-6">
				{title}
			</H2>
			{list.length > 0 ? (
				<ul>{list.map(render)}</ul>
			) : (
				empty && (
					<P className="px-4 pb-4 text-muted-foreground text-sm md:px-6">
						{empty}
					</P>
				)
			)}
		</section>
	);

	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title="People"
					description="The people you follow, VIPs first. Search to find anyone else."
				>
					<div className="max-w-prose space-y-1 text-muted-foreground text-sm leading-relaxed">
						<P className="text-sm leading-relaxed">
							VIP ranks someone's mail higher everywhere; a VIP in
							a topic, set on that topic's People, ranks it higher
							in that topic's threads only.
						</P>
						<P className="text-sm leading-relaxed">
							Excluded keeps someone's messages out everywhere and
							wins over every other setting; ignoring someone in a
							topic keeps their messages out of that topic's
							threads only.
						</P>
					</div>
				</CollaborationPageHeader>
			}
			aside={<BrainOverview />}
			asideTitle="Overview"
		>
			<div className="flex flex-wrap items-center gap-2 border-b p-4 md:px-6">
				<div className="min-w-40 flex-1">
					<Label
						htmlFor={`${fieldId}-people-filter`}
						className="sr-only"
					>
						Name or email
					</Label>
					<Input
						id={`${fieldId}-people-filter`}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Filter by name or email"
						className="h-9 text-sm"
					/>
				</div>
				<div>
					<Label
						htmlFor={`${fieldId}-people-account`}
						className="sr-only"
					>
						Account
					</Label>
					<Select value={account} onValueChange={setAccount}>
						<SelectTrigger
							id={`${fieldId}-people-account`}
							className="h-9"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Everyone</SelectItem>
							<SelectItem value="connected">
								Connected contacts
							</SelectItem>
							{state.accounts.map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			{section(
				`VIPs (${vips.length})`,
				vips,
				(person) => row(person),
				searching
					? "None of your VIPs match."
					: "No VIPs yet. Choose Make VIP beside anyone below to keep them close at hand.",
			)}
			{section(
				`You follow (${people.length})`,
				people,
				(person) => row(person),
				searching
					? "Nobody you follow matches."
					: "No one here yet. Follow people from the suggestions, or search.",
			)}
			{suggested.length > 0 &&
				section(
					`Suggested to follow (${suggested.length})`,
					suggested,
					(person) =>
						row(
							person,
							<>
								<Button
									size="sm"
									onClick={() => follow(person, "following")}
								>
									Follow
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => follow(person, "declined")}
								>
									Not now
								</Button>
							</>,
						),
				)}
			{searching &&
				section(
					"Everyone else",
					others,
					(person) =>
						row(
							person,
							<Button
								size="sm"
								variant="outline"
								onClick={() => follow(person, "following")}
							>
								Follow
							</Button>,
						),
					"No one else matches.",
				)}
		</CollaborationSurface>
	);
}
