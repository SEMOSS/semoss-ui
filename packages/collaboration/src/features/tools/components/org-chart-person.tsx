import { Button, cn } from "@semoss/ui/next";
import { PersonAvatar } from "@/features/collaboration/components/person-avatar";
import {
	type OrgChartLookup,
	type OrgChartPerson as Person,
	personLookup,
} from "../api/org-chart";

/** One chart node. Only people the directory can resolve offer navigation. */
export function OrgChartPerson({
	person,
	selected = false,
	candidate = false,
	disabled,
	onNavigate,
}: {
	person: Person;
	selected?: boolean;
	candidate?: boolean;
	disabled: boolean;
	onNavigate: (target: OrgChartLookup) => void;
}) {
	const target = selected ? undefined : personLookup(person);
	const layout =
		"inline-flex h-auto min-h-11 min-w-0 max-w-full items-center justify-start gap-2 whitespace-normal rounded-md border px-3 py-2 text-left";
	const content = (
		<>
			<PersonAvatar
				name={person.name}
				email={person.email}
				className={selected ? "size-9" : "size-8"}
			/>
			<span className="wrap-anywhere min-w-0">
				<span
					className={cn(
						"block font-semibold",
						selected ? "text-base" : "text-sm",
					)}
				>
					{person.name}
				</span>
				{person.title && (
					<span className="block font-normal text-muted-foreground text-xs">
						{person.title}
					</span>
				)}
				{(selected || candidate) && person.department && (
					<span className="block font-normal text-muted-foreground text-xs">
						{person.department}
					</span>
				)}
				{candidate && person.email && (
					<span className="block font-normal text-muted-foreground text-xs">
						{person.email}
					</span>
				)}
			</span>
		</>
	);
	return target ? (
		<Button
			type="button"
			variant="outline"
			className={cn(layout, "bg-card shadow-none")}
			disabled={disabled}
			aria-label={`Show org chart for ${[person.name, person.title, candidate && person.email].filter(Boolean).join(", ")}`}
			onClick={() => onNavigate(target)}
		>
			{content}
		</Button>
	) : (
		<figure
			className={cn(
				layout,
				selected && "border-primary/40 bg-primary/5 px-4 py-3",
			)}
			aria-label={
				selected ? `Selected person: ${person.name}` : person.name
			}
		>
			{content}
		</figure>
	);
}
