import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";

export interface PropDoc {
	name: string;
	type: string;
	required?: boolean;
	default?: string;
	description: string;
}

interface PropsTableProps {
	props: PropDoc[];
}

/** Static props reference table — no live-editable "controls," matching how
 * @semoss/chat's own sandbox already demonstrates variation via multiple
 * side-by-side demo states rather than a Storybook-style controls panel. */
export const PropsTable = ({ props }: PropsTableProps) => {
	return (
		<div className="overflow-hidden rounded-lg border border-border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Prop</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Default</TableHead>
						<TableHead>Description</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{props.map((prop) => (
						<TableRow key={prop.name}>
							<TableCell className="font-mono text-xs">
								{prop.name}
								{prop.required ? (
									<span className="ml-1 text-destructive">
										*
									</span>
								) : null}
							</TableCell>
							<TableCell className="font-mono text-muted-foreground text-xs">
								{prop.type}
							</TableCell>
							<TableCell className="font-mono text-muted-foreground text-xs">
								{prop.default ?? "—"}
							</TableCell>
							<TableCell className="text-sm">
								{prop.description}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};
