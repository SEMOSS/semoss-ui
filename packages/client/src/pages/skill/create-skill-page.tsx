import { ChevronRight, UploadIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	H2,
	P,
} from "@semoss/ui/next";
import { AddAppModal } from "@/components/app";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useNavigate } from "@/hooks/useNavigate";

export const CreateSkillPage = () => {
	const navigate = useNavigate();
	const [isUploadOpen, setIsUploadOpen] = useState(false);

	const navigateSkill = (appId: string) => {
		if (!appId) return;
		navigate(`/skill/${appId}/edit`);
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex w-full flex-col items-start gap-6">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="../" className="text-inherit">
									Skills
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage>New</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex w-full flex-row items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<H2>Create Skill</H2>
						<P className="text-muted-foreground">
							Define a reusable skill that agents can call
						</P>
					</div>
					<Button
						variant="outline"
						onClick={() => setIsUploadOpen(true)}
					>
						<UploadIcon />
						Upload
					</Button>
				</div>

				{isUploadOpen && (
					<AddAppModal
						type="skill"
						open={isUploadOpen}
						handleClose={(appId) => {
							if (appId) {
								navigateSkill(appId);
							}
							setIsUploadOpen(false);
						}}
					/>
				)}

				{/* TODO: form */}
			</div>
		</>
	);
};
