import { ArrowLeft, Network } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Button, H4, Muted, Spinner } from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";
import {
	type OrgChartLookup,
	type OrgChartResult,
	type OrgChartPerson as Person,
	parseOrgChart,
	readOrgChart,
} from "../api/org-chart";
import { OrgChartPerson } from "./org-chart-person";

interface Page {
	result: OrgChartResult;
	target?: OrgChartLookup;
}

const spine = "mx-auto h-4 w-px bg-border";
const disclosure =
	"min-h-11 cursor-pointer content-center rounded-sm py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring";

/** A replay opens the saved chart. Only explicit navigation asks the directory for another person. */
export function OrgChartCard({ tool }: { tool: ConversationTool }) {
	const { actions } = useInsight();
	const [isLoading, setIsLoading] = useState(false);
	const heading = useRef<HTMLHeadingElement>(null);
	const request = useRef(0);
	const initial = useMemo((): Page => {
		const { personId, query } = tool.arguments;
		return {
			result: parseOrgChart(tool.output),
			target:
				typeof personId === "string"
					? { personId }
					: typeof query === "string"
						? { query }
						: undefined,
		};
	}, [tool.arguments, tool.output]);
	const [pages, setPages] = useState<Page[]>([initial]);
	const currentPage = pages.at(-1) ?? initial;
	const previousPage = useRef(currentPage);
	const { result, target } = currentPage;

	useEffect(
		() => () => {
			request.current++;
		},
		[],
	);
	useEffect(() => {
		if (previousPage.current !== currentPage) {
			previousPage.current = currentPage;
			heading.current?.focus();
		}
	}, [currentPage]);

	async function navigate(target: OrgChartLookup, replace = false) {
		const id = ++request.current;
		setIsLoading(true);
		let result: OrgChartResult;
		try {
			result = await readOrgChart(actions, target);
		} catch {
			result = {
				status: "unavailable",
				message: "The directory could not be reached. Try again.",
			};
		}
		if (id !== request.current) return;
		setPages((current) => [
			...(replace ? current.slice(0, -1) : current),
			{ result, target },
		]);
		setIsLoading(false);
	}

	function back() {
		request.current++;
		setIsLoading(false);
		setPages((current) => current.slice(0, -1));
	}

	function peopleList(people: Person[], candidate = false) {
		return (
			<ul className="flex flex-wrap gap-2">
				{people.map((person) => (
					<li
						key={person.id ?? person.email ?? person.name}
						className="min-w-0 max-w-full"
					>
						<OrgChartPerson
							person={person}
							disabled={isLoading}
							candidate={candidate}
							onNavigate={navigate}
						/>
					</li>
				))}
			</ul>
		);
	}

	return (
		<section
			className="@container/chart w-full max-w-2xl rounded-xl border bg-card text-card-foreground"
			aria-label="Org chart"
		>
			<header className="flex min-h-12 flex-wrap items-center gap-2 border-b px-4 py-2">
				<Network
					aria-hidden="true"
					className="size-4 text-muted-foreground"
				/>
				<H4
					ref={heading}
					tabIndex={-1}
					className="rounded-sm text-sm focus-visible:outline-2 focus-visible:outline-ring"
				>
					Org Chart
					{result.status === "ok" && (
						<span className="sr-only">
							{" "}
							for {result.person.name}
						</span>
					)}
				</H4>
				<Muted className="font-normal text-xs">Microsoft 365</Muted>
				{pages.length > 1 && (
					<Button
						variant="ghost"
						size="sm"
						className="ml-auto"
						type="button"
						onClick={back}
					>
						<ArrowLeft aria-hidden="true" />
						Back
					</Button>
				)}
			</header>
			<output
				className={
					isLoading
						? "flex items-center gap-2 px-4 pt-3 text-muted-foreground text-sm"
						: "sr-only"
				}
			>
				{isLoading && (
					<>
						<Spinner aria-hidden="true" />
						Loading org chart…
					</>
				)}
			</output>
			{result.status === "ok" ? (
				<>
					<div className="@sm/chart:px-4 px-3 py-4 text-center">
						{result.manager ? (
							<>
								<Muted className="mb-1 block text-xs">
									Reports To
								</Muted>
								<OrgChartPerson
									person={result.manager}
									disabled={isLoading}
									onNavigate={navigate}
								/>
							</>
						) : (
							<Muted className="text-xs">
								{result.managerStatus === "unavailable"
									? "Manager information is unavailable."
									: "No manager listed."}
							</Muted>
						)}
						<div aria-hidden="true" className={spine} />
						<OrgChartPerson
							selected
							person={result.person}
							disabled={isLoading}
							onNavigate={navigate}
						/>
						{result.directReports.length > 0 ? (
							<>
								<div aria-hidden="true" className={spine} />
								<Muted className="block text-xs">
									Direct Reports
								</Muted>
								<div
									aria-hidden="true"
									className="mx-auto @sm/chart:block hidden h-4 w-px bg-border"
								/>
								<ul
									aria-label={`Direct reports of ${result.person.name}`}
									className="mx-auto @sm/chart:mt-0 mt-2 flex @sm/chart:w-full w-fit @sm/chart:max-w-xl max-w-full @sm/chart:flex-row flex-col items-start @sm/chart:items-stretch @sm/chart:gap-0 gap-2 @sm/chart:border-0 border-border border-l @sm/chart:pl-0 pl-3 text-left @sm/chart:text-center"
								>
									{result.directReports
										.slice(0, 3)
										.map((person) => (
											<li
												key={
													person.id ??
													person.email ??
													person.name
												}
												className="before:-left-3 relative min-w-0 max-w-full @sm/chart:flex-1 @sm/chart:px-1 @sm/chart:pt-3 before:absolute @sm/chart:before:inset-x-0 @sm/chart:before:top-0 before:top-1/2 @sm/chart:before:w-auto before:w-3 before:border-border before:border-t @sm/chart:after:absolute @sm/chart:after:top-0 @sm/chart:after:left-1/2 @sm/chart:after:h-3 @sm/chart:after:border-border @sm/chart:after:border-l @sm/chart:first:before:left-1/2 @sm/chart:last:before:right-1/2"
											>
												<OrgChartPerson
													person={person}
													disabled={isLoading}
													onNavigate={navigate}
												/>
											</li>
										))}
								</ul>
								{result.directReports.length > 3 && (
									<details
										key={
											result.person.id ??
											result.person.name
										}
										className="mt-2 text-left"
									>
										<summary className={disclosure}>
											More Direct Reports (
											{result.directReports.length - 3})
										</summary>
										{peopleList(
											result.directReports.slice(3),
										)}
									</details>
								)}
							</>
						) : (
							result.directReportsStatus !== "partial" && (
								<Muted className="mt-3 block text-xs">
									{result.directReportsStatus ===
									"unavailable"
										? "Direct reports are unavailable."
										: "No direct reports listed."}
								</Muted>
							)
						)}
						{result.directReportsStatus === "partial" && (
							<Muted className="mt-2 block text-xs">
								The directory returned a partial list of direct
								reports.
							</Muted>
						)}
					</div>
					{(result.peers.length > 0 ||
						result.peersStatus === "partial" ||
						result.peersStatus === "unavailable") && (
						<details
							key={result.person.id ?? result.person.name}
							className="border-t px-4"
						>
							<summary className={disclosure}>
								{result.manager
									? `Also Reporting to ${result.manager.name}`
									: "Peers"}
								{result.peers.length > 0 &&
									` (${result.peers.length}${result.peersStatus === "partial" ? "+" : ""})`}
							</summary>
							<div className="space-y-2 pb-3">
								{result.peers.length > 0 &&
									peopleList(result.peers)}
								{result.peersStatus === "partial" && (
									<Muted>
										The directory returned a partial list of
										peers.
									</Muted>
								)}
								{result.peersStatus === "unavailable" && (
									<Muted>
										Peer information is unavailable.
									</Muted>
								)}
							</div>
						</details>
					)}
				</>
			) : result.status === "ambiguous" ? (
				<div className="space-y-3 p-4">
					<p className="text-sm">
						Select the person whose org chart you want to see.
					</p>
					{peopleList(result.candidates, true)}
					{result.candidatesTruncated && (
						<Muted>
							For more matches, ask again with a full name or
							email address.
						</Muted>
					)}
				</div>
			) : (
				<div className="flex flex-wrap items-center gap-2 p-4">
					<Muted>
						{result.message ||
							(result.status === "not_found"
								? "No matching person was found. Try a full name or email address."
								: "Org chart information is unavailable.")}
					</Muted>
					{result.status === "unavailable" && target && (
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isLoading}
							onClick={() => navigate(target, true)}
						>
							Try Again
						</Button>
					)}
				</div>
			)}
		</section>
	);
}
