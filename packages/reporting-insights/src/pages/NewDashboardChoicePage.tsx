/**
 * NewDashboardChoicePage — the entry point when creating a dashboard. Lets the user
 * choose between the AI builder (describe → generated draft) and the manual builder
 * (add visualizations + build queries yourself). Rendered at `#/dashboards/new`.
 */
import { ArrowRight, Sparkles, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NewDashboardChoicePage() {
	const navigate = useNavigate();

	const cards = [
		{
			key: "ai",
			to: "/dashboards/new/ai",
			icon: Sparkles,
			tone: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
			title: "Build with AI",
			body: "Describe the dashboard you want and pick a database — AI drafts the queries and charts for you to review and refine.",
		},
		{
			key: "manual",
			to: "/dashboards/new/manual",
			icon: Wrench,
			tone: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
			title: "Build manually",
			body: "Add visualizations, compose SQL with the visual query builder (or by hand), and configure every chart yourself.",
		},
	];

	return (
		<div className="flex h-full w-full items-center justify-center p-8">
			<div className="w-full max-w-3xl">
				<div className="mb-8 text-center">
					<h1 className="font-semibold text-2xl text-stone-800">
						Create a dashboard
					</h1>
					<p className="mt-1.5 text-[14px] text-stone-500">
						Start from a description with AI, or build it yourself.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					{cards.map((c) => (
						<button
							key={c.key}
							onClick={() => navigate(c.to)}
							className="group hover:-translate-y-0.5 flex flex-col rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
						>
							<div
								className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${c.tone}`}
							>
								<c.icon className="h-6 w-6" />
							</div>
							<h2 className="font-semibold text-[15px] text-stone-800">
								{c.title}
							</h2>
							<p className="mt-1.5 flex-1 text-[13px] text-stone-500 leading-relaxed">
								{c.body}
							</p>
							<span className="mt-4 inline-flex items-center gap-1 font-medium text-[13px] text-indigo-600">
								Continue{" "}
								<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
