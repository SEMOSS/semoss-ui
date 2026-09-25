import { useId, useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	H1,
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
import { useCollaborationSession } from "../state/collaboration-session.context";
import { BrainOverview } from "./brain-overview";
import { CollaborationSurface } from "./collaboration-surface";
import { PersonAvatar } from "./person-avatar";
import { TopicChip } from "./topic-chip";

/** Searchable directory that never invents missing imported contact details. */
export function PeopleDirectory() {
	const fieldId = useId();
	const { state } = useCollaborationSession();
	const [query, setQuery] = useState("");
	const [account, setAccount] = useState("all");
	const people = state.people
		.filter(
			(person) =>
				(account === "all" ||
					person.accountId === account ||
					(account === "connected" && !person.isSample)) &&
				`${person.name} ${person.email ?? ""}`
					.toLowerCase()
					.includes(query.toLowerCase()),
		)
		.sort((left, right) => (right.strength ?? 0) - (left.strength ?? 0));
	return (
		<CollaborationSurface
			aside={<BrainOverview />}
			asideTitle="Brain overview"
		>
			<header className="space-y-1.5 px-4 pt-5 pb-4 md:px-6">
				<H1 className="font-semibold text-xl">People</H1>
				<P className="text-muted-foreground text-sm">
					The people in your topics and selected sources.
				</P>
			</header>
			<div className="flex flex-wrap items-center gap-2 border-b px-4 pb-3 md:px-6">
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
			<output className="block px-4 pt-3 pb-2 font-medium text-muted-foreground text-xs md:px-6">
				{people.length} people
			</output>
			<ul>
				{people.map((person) => (
					<li
						key={person.id}
						className="flex flex-wrap items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/30 md:px-6"
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
							<Small className="mt-0.5 break-words font-normal text-muted-foreground text-xs leading-5">
								{person.title ||
									person.email ||
									"Contact details unavailable"}
								{person.relationship
									? ` · ${person.relationship}`
									: ""}
							</Small>
						</div>
						<div className="flex flex-wrap items-center gap-1.5">
							{person.vip && (
								<Badge variant="secondary">VIP</Badge>
							)}
							{person.neverIngest && (
								<Badge variant="outline">Excluded</Badge>
							)}
							{person.topics.slice(0, 2).map((id) => {
								const topic = state.topics.find(
									(item) => item.id === id,
								);
								return (
									topic && (
										<TopicChip key={id} topic={topic} />
									)
								);
							})}
							{person.topics.length > 2 && (
								<Small className="font-normal text-muted-foreground text-xs">
									+{person.topics.length - 2}
								</Small>
							)}
						</div>
					</li>
				))}
			</ul>
			{!people.length && (
				<P className="p-6 text-muted-foreground">
					No matching people. Change the filters to see more.
				</P>
			)}
		</CollaborationSurface>
	);
}
