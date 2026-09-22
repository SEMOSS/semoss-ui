import { Navigate, useLocation, useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Form,
	FormInput,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";

const loginSchema = z.object({
	username: z.string().trim().min(1, "Enter your username."),
	password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

function getReturnTarget(state: unknown): string {
	if (
		typeof state === "object" &&
		state !== null &&
		"target" in state &&
		typeof state.target === "string"
	) {
		return state.target;
	}

	return "/";
}

/**
 * Renders a the login page if the user is not already logged in, otherwise sends them to the home page.
 *
 * @component
 */
export const LoginPage = () => {
	const { isAuthorized, actions } = useInsight();
	const { state } = useLocation();
	const navigate = useNavigate();
	const target = getReturnTarget(state);
	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { username: "", password: "" },
	});
	const { errors, isSubmitting } = form.formState;

	const handleSubmit = async (values: LoginValues): Promise<void> => {
		try {
			const success = await actions.login({
				type: "native",
				username: values.username,
				password: values.password,
			});

			if (!success) throw new Error("Unable to log in.");

			navigate(target);
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "An error occurred while attempting to log in.",
			});
		}
	};

	// If the user is already authorized, we can route them off of this page. If the user was routed here, attempt to send them back to their target
	if (isAuthorized) {
		return <Navigate to={target} />;
	}

	return (
		<main className="flex min-h-full items-center justify-center">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Login</CardTitle>
				</CardHeader>
				<CardContent>
					<Form
						form={form}
						onSubmit={handleSubmit}
						noValidate
						aria-busy={isSubmitting}
						className="space-y-4"
					>
						<FormInput
							name="username"
							label="Username (required)"
							autoComplete="username"
							required
							disabled={isSubmitting}
						/>
						<FormInput
							name="password"
							label="Password (required)"
							type="password"
							autoComplete="current-password"
							required
							disabled={isSubmitting}
						/>
						{errors.root?.server?.message && (
							<Alert variant="destructive">
								<AlertDescription>
									{errors.root.server.message}
								</AlertDescription>
							</Alert>
						)}
						<div className="flex justify-end">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Spinner className="size-4" />}
								{isSubmitting ? "Logging in…" : "Log in"}
							</Button>
						</div>
					</Form>
				</CardContent>
			</Card>
		</main>
	);
};
