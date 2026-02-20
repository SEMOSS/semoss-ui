export const Home = () => {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl">Welcome</h1>
				<p className="text-muted-foreground">
					Build and manage visual rules with ease
				</p>
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<div className="rounded-lg border p-6">
					<h2 className="mb-2 font-semibold text-lg">Get Started</h2>
					<p className="text-muted-foreground text-sm">
						Create your first rule to begin
					</p>
				</div>
				<div className="rounded-lg border p-6">
					<h2 className="mb-2 font-semibold text-lg">
						Documentation
					</h2>
					<p className="text-muted-foreground text-sm">
						Learn how to use the rule builder
					</p>
				</div>
				<div className="rounded-lg border p-6">
					<h2 className="mb-2 font-semibold text-lg">Settings</h2>
					<p className="text-muted-foreground text-sm">
						Configure your preferences
					</p>
				</div>
			</div>
		</div>
	);
};
