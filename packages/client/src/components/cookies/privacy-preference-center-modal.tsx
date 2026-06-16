import { useEffect, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface PrivacyPreferenceCenterProps {
	/** determines if the modal is displayed or not */
	isOpen: boolean;

	/** function called when the user attempts to close the modal. */
	onClose: (boolean) => void;
}

export const PrivacyPreferenceCenterModal = (
	props: PrivacyPreferenceCenterProps,
) => {
	const { isOpen, onClose } = props;
	const { configStore } = useRootStore();
	const [cookiePolicyOrder, setCookiePolicyOrder] = useState<string[]>([]);
	const [cookiePolicies, setCookiePolicies] = useState({});
	const [cookiePolicyModalHeader, setCookiePolicyModalHeader] = useState("");
	const [cookiePolicyModalBody, setCookiePolicyModalBody] = useState("");
	const [selectedTab, setTab] = useState<string>("0");

	useEffect(() => {
		const theme = configStore.theme;

		try {
			const order = theme.cookiePolicyOrderReact
				? theme.cookiePolicyOrderReact
				: [];
			setCookiePolicyOrder(order);
			const policies = theme.cookiePoliciesReact
				? theme.cookiePoliciesReact
				: {};
			setCookiePolicies(policies);
			const body = theme.cookiePolicyModalBodyReact
				? theme.cookiePolicyModalBodyReact
				: "";
			setCookiePolicyModalBody(body);
			const header = theme.cookiePolicyModalHeaderReact
				? theme.cookiePolicyModalHeaderReact
				: "Privacy Preference Center";
			setCookiePolicyModalHeader(header);
		} catch {
			console.error(
				"Unable to parse theme for Privacy Preference Center",
			);
		}
	}, [configStore.theme]);

	const renderPoliciesContent = () => {
		if (
			cookiePolicyOrder.length > 0 &&
			Object.keys(cookiePolicies).length > 0
		) {
			return (
				<div className="grid grid-cols-[250px_1fr] gap-6">
					<Tabs
						value={selectedTab}
						onValueChange={(val) => setTab(val)}
						className="flex flex-col"
					>
						<TabsList className="flex h-auto flex-col items-stretch gap-1 bg-transparent p-0">
							{cookiePolicyOrder.map((name, idx) => (
								<TabsTrigger
									value={String(idx)}
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									key={`tab-${name}-${idx}`}
									className="justify-start"
								>
									{name}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>

					{/* biome-ignore lint/correctness/useUniqueElementIds: IDs are scoped to component instances */}
					<div
						className="pt-6 [&_a:hover]:opacity-80 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4"
						id="modal-content"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: third-party cookie script content
						dangerouslySetInnerHTML={{
							__html:
								cookiePolicies[
									cookiePolicyOrder[Number(selectedTab)]
								] || "",
						}}
					/>
				</div>
			);
		}
		return (
			// biome-ignore lint/correctness/useUniqueElementIds: IDs are scoped to component instances
			<div
				className="p-4 pt-0 [&_a:hover]:opacity-80 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4"
				id="cookie-modal-body"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: third-party cookie script content
				dangerouslySetInnerHTML={{
					__html: cookiePolicyModalBody,
				}}
			/>
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{cookiePolicyModalHeader}</DialogTitle>
				</DialogHeader>

				<div className="w-full border-border border-y pb-4">
					{renderPoliciesContent()}
				</div>

				<DialogFooter>
					<Button onClick={() => onClose(false)}>Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
