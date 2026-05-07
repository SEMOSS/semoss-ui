import { Users } from "lucide-react";
import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@semoss/ui/next";
import AMAZON_S3 from "@/assets/img/AMAZON_S3.png";
import Dropbox from "@/assets/img/DROPBOX.png";
import Github from "@/assets/img/GITHUB.svg";
import newGoogle from "@/assets/img/GOOGLE.svg";
import CAC from "@/assets/loginProviders/CAC.svg";
import Generic from "@/assets/loginProviders/GENERIC.svg";
import Gitlab from "@/assets/loginProviders/GITLAB.svg";
import Keycloak from "@/assets/loginProviders/KEYCLOAK.svg";
import Linkedin from "@/assets/loginProviders/LINKEDIN.svg";
import Microsoft from "@/assets/loginProviders/MICROSOFT.png";
import Okta from "@/assets/loginProviders/OKTA.svg";
import ProductHunt from "@/assets/loginProviders/product_hunt.png";
import Salesforce from "@/assets/loginProviders/SALESFORCE.svg";
import Surverymonkey from "@/assets/loginProviders/SURVEYMONKEY.svg";
import Saml from "@/assets/loginProviders/saml.png";
import Siteminder from "@/assets/loginProviders/siteminder.png";
import Twitter from "@/assets/loginProviders/X_TWITTER.svg";

const TypeImageObject = {
	native: AMAZON_S3,
	google: newGoogle,
	github: Github,
	okta: Okta,
	cac: CAC,
	dropbox: Dropbox,
	adfs: Microsoft,
	generic: Generic,
	gitlab: Gitlab,
	keycloak: Keycloak,
	linkedin: Linkedin,
	ms: Microsoft,
	product_hunt: ProductHunt,
	salesforce: Salesforce,
	saml: Saml,
	siteminder: Siteminder,
	surveymonkey: Surverymonkey,
	twitter: Twitter,
};

interface TeamMembersProviderBannerProps {
	/**
	 *
	 */
	type: string;
}
export const TeamMembersProviderBanner = (
	props: TeamMembersProviderBannerProps,
) => {
	const { type } = props;

	const lowercase = type.toLowerCase();
	const imgsrc = TypeImageObject[lowercase];

	return (
		<Card className="w-full">
			<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<CardTitle>Members</CardTitle>
					<CardDescription>
						Members are managed by the external identity provider
					</CardDescription>
				</div>
				<div className="flex items-center gap-3">
					{imgsrc ? (
						<img
							src={imgsrc}
							className="h-9 w-9"
							alt={`${type} icon`}
						/>
					) : (
						<Users className="h-8 w-8 text-muted-foreground" />
					)}
					<Badge
						variant="secondary"
						className="rounded-full px-3 py-1 text-xs uppercase"
					>
						{type}
					</Badge>
				</div>
			</CardContent>
		</Card>
	);
};
