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
		<CollaborationSurface>
			<header className="space-y-2 border-b p-4 md:p-6">
				<H1 className="font-semibold text-xl">People</H1>
				<P className="text-muted-foreground">
					People in the sample scenario and your selected sources.
				</P>
			</header>
			<div className="flex flex-wrap items-end gap-4 border-b p-4 md:px-6">
				<div className="min-w-0 flex-1 space-y-2">
					<Label htmlFor={`${fieldId}-people-filter`}>
						Name or email
					</Label>
					<Input
						id={`${fieldId}-people-filter`}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Find someone"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${fieldId}-people-account`}>Account</Label>
					<Select value={account} onValueChange={setAccount}>
						<SelectTrigger id={`${fieldId}-people-account`}>
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
			<output className="block px-4 py-3 text-muted-foreground text-sm md:px-6">
				{people.length} people
			</output>
			<ul>
				{people.map((person) => (
					<li
						key={person.id}
						className="flex flex-wrap items-center gap-3 border-b p-4 md:px-6"
					>
						<PersonAvatar
							name={person.name}
							initials={person.initials}
						/>
						<div className="min-w-0 flex-1">
							<Link
								className="break-words font-medium hover:underline"
								to={`/brain/people/${encodeURIComponent(person.id)}`}
							>
								{person.name}
							</Link>
							<Small className="break-words text-muted-foreground">
								{person.title ||
									person.email ||
									"Contact details unavailable"}
								{person.relationship
									? ` · ${person.relationship}`
									: ""}
							</Small>
						</div>
						<div className="flex flex-wrap gap-2">
							{person.vip && (
								<Badge variant="secondary">VIP</Badge>
							)}
							{person.neverIngest && (
								<Badge variant="outline">Excluded</Badge>
							)}
							<Badge variant="outline">
								{person.isSample ? "Sample" : "Connected"}
							</Badge>
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
