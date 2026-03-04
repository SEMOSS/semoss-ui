import { Users } from "lucide-react";
import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@semoss/ui/next";
import AMAZON_S3 from "@/assets/loginProviders/Amazon_S3.png";
import ADFS from "@/assets/loginProviders/adfs_microsoft_1.png";
import Dropbox from "@/assets/loginProviders/dropbox.png";
import Github from "@/assets/loginProviders/github.png";
import Gitlab from "@/assets/loginProviders/gitlab.png";
import newGoogle from "@/assets/loginProviders/google.png";
import Keycloak from "@/assets/loginProviders/keycloak.png";
import Linkedin from "@/assets/loginProviders/linkedin.png";
import Microsoft from "@/assets/loginProviders/microsoft.png";
import Okta from "@/assets/loginProviders/okta.png";
import ProductHunt from "@/assets/loginProviders/product_hunt.png";
import Salesforce from "@/assets/loginProviders/salesforce.png";
import Saml from "@/assets/loginProviders/saml.png";
import Siteminder from "@/assets/loginProviders/siteminder.png";
import Surverymonkey from "@/assets/loginProviders/surveymonkey.png";
import Twitter from "@/assets/loginProviders/x_twitter.png";

const TypeImageObject = {
	native: AMAZON_S3,
	google: newGoogle,
	github: Github,
	okta: Okta,
	dropbox: Dropbox,
	adfs: ADFS,
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
