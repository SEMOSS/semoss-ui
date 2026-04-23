import { observer } from "mobx-react-lite";
import { PlatformSearch } from "@/components/shared";
import BusinessUserImage from "../../assets/img/BusinessUserLanding.svg";
import businessUsercheckgrid from "../../assets/img/businessUsercheckgrid.svg";

const keyframes = `
  @keyframes slide {
    8% { transform: translateY(0); opacity: 1; }
    25% { opacity: 0; }
    42% { transform: translateY(-72px); opacity: 1; }
    59% { opacity: 0; }
    76% { transform: translateY(-144px); opacity: 1; }
    91% { opacity: 0; }
  }
`;

const subTitle = ["business apps", "the power of models", "knowledge repos"];

export const BusinessUserScreen: React.FC = observer(() => {
	return (
		<div
			className="absolute inset-0 flex flex-col items-start gap-16 px-36 py-0"
			style={{
				backgroundImage: `url(${BusinessUserImage}), linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url(${businessUsercheckgrid})`,
				backgroundRepeat: "no-repeat",
				backgroundSize: "47%, 100%, 100%",
				backgroundPosition: "right bottom, center",
			}}
		>
			<div className="mt-6 flex w-full flex-col gap-16">
				<h2 className="font-bold text-5xl leading-none">Discover</h2>
				<style>{keyframes}</style>
				<div className="relative h-[72px] w-full overflow-hidden">
					<div
						className="absolute flex flex-col"
						style={{
							animation: "slide 9s infinite",
							height: "216px",
							top: 0,
						}}
					>
						{subTitle.map((title) => (
							<span
								key={title}
								className="font-bold text-5xl"
								style={{
									background:
										"linear-gradient(90deg, #6C53FF 0%, #86ECFF 100%)",
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
									backgroundClip: "text",
									color: "transparent",
								}}
							>
								{title}
							</span>
						))}
					</div>
				</div>
			</div>
			<div className="w-full max-w-[60%] overflow-auto">
				<PlatformSearch className="h-15 rounded-3xl border-[rgb(198,191,252)]" />
			</div>
		</div>
	);
});
