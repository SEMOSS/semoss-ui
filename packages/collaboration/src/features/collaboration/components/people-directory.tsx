import { type ReactNode, useId, useState } from "react";
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
 * Everyone else only shows up when you search.
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
	const people = matching.filter(isFollowed);
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

	const row = (person: Person, action?: ReactNode) => (
		<li
			key={person.id}
			className="flex flex-wrap items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/30 md:px-6"
		>
			<PersonAvatar name={person.name} initials={person.initials} />
			<div className="min-w-0 flex-1">
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
				{person.vip && <Badge variant="secondary">VIP</Badge>}
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
				/>
			}
			aside={<BrainOverview />}
			asideTitle="Brain overview"
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
				`You follow (${people.length})`,
				people,
				(person) => row(person),
				searching
					? "Nobody you follow matches."
					: "You do not follow anyone yet. Follow people from the suggestions, or search.",
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
