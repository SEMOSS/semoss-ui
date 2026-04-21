import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks/";

const RawHtml = ({ html }: { html: string }) => {
	// biome-ignore lint/security/noDangerouslySetInnerHtml: server-controlled terms content
	return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export const PlatformMessages: React.FC = observer(() => {
	const { configStore } = useRootStore();
	const [acceptedTerms, setAcceptedTerms] = useState<boolean | null>(null);

	const terms = {
		header: configStore.theme.termsHeaderReact,
		text: configStore.theme.termsReact,
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - config is used for side effects only
	useEffect(() => {
		if (configStore.store.userEpoch) {
			const key = `smss--terms--${configStore.store.userEpoch}`;
			const item = localStorage.getItem(key);
			if (item) {
				const d = JSON.parse(item);
				setAcceptedTerms(d.state);
			} else {
				setAcceptedTerms(false);
			}
		}
	}, [configStore.store.userEpoch, configStore.store.config]);

	const acceptTerms = () => {
		if (configStore.store.userEpoch) {
			const key = `smss--terms--${configStore.store.userEpoch}`;
			localStorage.setItem(key, JSON.stringify({ state: true }));
		}
		setAcceptedTerms(true);
	};

	return (
		<>
			{!acceptedTerms && terms.header && terms.text && (
				<Dialog open={true}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								<RawHtml html={terms.header} />
							</DialogTitle>
						</DialogHeader>
						<RawHtml html={terms.text} />
						<DialogFooter>
							<Button
								onClick={acceptTerms}
								data-testid={"platformMessages-accept-btn"}
							>
								Accept
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
});
