import { Link } from "react-router";
import { Button, H3, Small } from "@semoss/ui/next";
import { givenFirst } from "@/lib/person-name";
import { selectTopicIgnores } from "../state/collaboration.selectors";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { PersonAvatar } from "./person-avatar";
import { PersonGlobalBadges } from "./person-global-badges";

/** The topic's ignore list: people whose messages in its threads are not used; elsewhere they still are. */
export function TopicIgnoredPeople({ topic }: { topic: Topic }) {
	const { state, dispatch } = useCollaborationSession();
	const rules = selectTopicIgnores(state.rules, topic.id);
	if (!rules.length) return null;
	return (
		<section className="space-y-3">
			<H3 className="font-medium text-sm">Ignored here</H3>
			<div>
				{rules.map((rule) => {
					const person = state.people.find(
						(candidate) => candidate.id === rule.personId,
					);
					const name = person ? givenFirst(person.name) : "Someone";
					return (
						<div
							key={rule.id}
							className="flex items-center gap-3 py-1"
						>
							<PersonAvatar
								name={person?.name ?? name}
								initials={person?.initials}
								email={person?.email}
							/>
							<div className="min-w-0 flex-1">
								{person ? (
									<>
										<Link
											className="break-words font-medium text-sm hover:underline"
											to={`/brain/people/${encodeURIComponent(person.id)}`}
										>
											{name}
										</Link>
										<PersonGlobalBadges person={person} />
									</>
								) : (
									<span className="font-medium text-sm">
										{name}
									</span>
								)}
								<Small className="block font-normal text-muted-foreground text-xs leading-5">
									Their messages in this topic's threads are
									not used
								</Small>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="font-normal"
								aria-label={`Stop ignoring ${name} in this topic`}
								onClick={() =>
									dispatch({
										type: "rule.remove",
										ruleId: rule.id,
									})
								}
							>
								Stop ignoring
							</Button>
						</div>
					);
				})}
			</div>
		</section>
	);
}
