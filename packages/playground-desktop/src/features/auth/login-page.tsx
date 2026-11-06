import { Navigate, useLocation } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { useSession } from "@semoss/sdk/react";
import { SessionLoginForm } from "@semoss/shared";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	H2,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { AppLoading } from "../../components/app-loading";
import { TITLE_BAR_ATTRIBUTE } from "../../platform/window-chrome";
import type { InstanceStore } from "../instances/instance.store";
import { BearerTokenForm } from "./bearer-token-form";

/** Props for {@link LoginPage}. */
export interface LoginPageProps {
	/** The saved instances; the one in use is signed in to. */
	instances: InstanceStore;
	/** Go back to the instance picker. */
	onSwitchServer: () => void;
}

/**
 * Sign in to the instance in use: every method its config offers (native,
 * LDAP, one-time code, OAuth in the app's own window) through the SDK's
 * session, or a bearer token. Once signed in, it goes where the user was
 * going.
 *
 * @component
 */
export const LoginPage = ({ instances, onSwitchServer }: LoginPageProps) => {
	const { t } = useTranslation("desktop");
	const status = useSession((state) => state.status);
	const location = useLocation();
	const from =
		(location.state as { from?: { pathname?: string } } | null)?.from
			?.pathname ?? "/new";

	if (status === "INITIALIZING") {
		return <AppLoading />;
	}
	if (status === "AUTHENTICATED") {
		return <Navigate to={from} replace />;
	}

	return (
		<main
			{...{ [TITLE_BAR_ATTRIBUTE]: "" }}
			className="flex min-h-svh items-center justify-center bg-muted/30 p-6"
		>
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>
						<H2 className="text-xl">
							{t("auth.title", {
								name: instances.activeInstance?.name ?? "",
							})}
						</H2>
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<Tabs defaultValue="session">
						<TabsList className="w-full">
							<TabsTrigger value="session">
								{t("auth.signIn")}
							</TabsTrigger>
							<TabsTrigger value="token">
								{t("auth.token")}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="session" className="pt-4">
							<SessionLoginForm />
						</TabsContent>
						<TabsContent value="token" className="pt-4">
							<BearerTokenForm instances={instances} />
						</TabsContent>
					</Tabs>
					<Button variant="link" onClick={onSwitchServer}>
						{t("auth.switchServer")}
					</Button>
				</CardContent>
			</Card>
		</main>
	);
};
