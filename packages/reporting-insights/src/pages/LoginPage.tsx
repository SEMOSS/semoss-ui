import { AlertCircle, BarChart3, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Location } from "react-router-dom";
import { Navigate, useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk-react";
import { Input } from "@/components/ui";

export function LoginPage() {
	const { actions, isAuthorized, isInitialized } = useInsight();
	const location = useLocation();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPass, setShowPass] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Where to go after successful login
	const from = (location.state as { from: Location })?.from?.pathname ?? "/";

	// Redirect only once the SDK has finished its session check
	if (isInitialized && isAuthorized) {
		return <Navigate to={from} replace />;
	}

	const handleNativeLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!username || !password) {
			setError("Username and password are required.");
			return;
		}

		setLoading(true);
		try {
			await actions.login({ type: "native", username, password });
		} catch (err: any) {
			setError(err?.message || "Invalid username or password.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
			<div className="w-full max-w-sm">
				{/* Logo / branding */}
				<div className="mb-8 text-center">
					<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-blue-200 shadow-lg">
						<BarChart3 className="h-6 w-6 text-white" />
					</div>
					<h1 className="font-bold text-2xl text-stone-900 tracking-tight">
						Insights
					</h1>
					<p className="mt-1 text-sm text-stone-500">
						Sign in to your workspace
					</p>
				</div>

				<div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-8 shadow-soft">
					{/* Error banner */}
					{error && (
						<div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-red-700 text-sm">
							<AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
							<span>{error}</span>
						</div>
					)}

					{/* Native login form */}
					<form onSubmit={handleNativeLogin} className="space-y-4">
						<div>
							<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
								Username
							</label>
							<Input
								type="text"
								autoComplete="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								disabled={loading}
								className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
								placeholder="Enter your username"
							/>
						</div>

						<div>
							<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
								Password
							</label>
							<div className="relative">
								<Input
									type={showPass ? "text" : "password"}
									autoComplete="current-password"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									disabled={loading}
									className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 pr-10 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
									placeholder="Enter your password"
								/>
								<button
									type="button"
									onClick={() => setShowPass((v) => !v)}
									className="-translate-y-1/2 absolute top-1/2 right-3 text-stone-400 hover:text-stone-600"
									tabIndex={-1}
								>
									{showPass ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
						>
							{loading && (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
							{loading ? "Signing in…" : "Sign in"}
						</button>
					</form>
				</div>

				<p className="mt-6 text-center text-stone-400 text-xs">
					Authentication is managed by your SEMOSS instance.
				</p>
			</div>
		</div>
	);
}
