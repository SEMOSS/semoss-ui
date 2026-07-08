import {
	Badge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { formatPermission } from "@/utility";
import type { modelledDependency } from "./app-details.utility";

interface PropsDependencyTable {
	dependencies: modelledDependency[];
	permission: string;
}

export const DependencyTable = (props: PropsDependencyTable) => {
	const { dependencies, permission } = props;
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>
						<span className="font-bold text-sm">{`Dependency (${dependencies.length})`}</span>
					</TableHead>
					<TableHead>
						<span className="font-bold text-sm">
							Current level of access
						</span>
					</TableHead>
					{permission === "author" && (
						<TableHead>
							<span className="font-bold text-sm">
								Access Type
							</span>
						</TableHead>
					)}
				</TableRow>
			</TableHeader>
			<TableBody>
				{dependencies.map((dep: modelledDependency) => (
					<TableRow
						key={`name-${dep.name}--id-${dep.id}`}
						className="border-b-0"
					>
						<TableCell>
							<a
								href={`./#/${dep.type}/${dep.id}`}
								className="text-primary underline-offset-4 hover:underline"
							>
								<span className="text-sm">{dep.name}</span>
							</a>
						</TableCell>
						<TableCell>
							<span className="text-sm">
								{formatPermission(dep.userPermission)}
							</span>
						</TableCell>
						{permission === "author" && (
							<TableCell>
								<div className="flex flex-row gap-1">
									{dep.isPublic ? (
										<Badge variant="secondary">
											Public
										</Badge>
									) : dep.isDiscoverable ? (
										<Badge variant="secondary">
											Discoverable
										</Badge>
									) : (
										<>
											<Badge variant="secondary">
												Non-Discoverable
											</Badge>
											<Badge variant="secondary">
												Non-Public
											</Badge>
										</>
									)}
								</div>
							</TableCell>
						)}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};
