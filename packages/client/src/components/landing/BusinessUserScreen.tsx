import { observer } from "mobx-react-lite";
import { PlatformSearch } from "@/components/shared";
import BusinessUserImage from "../../assets/img/BusinessUserLanding.svg";
import businessUsercheckgrid from "../../assets/img/businessUsercheckgrid.svg";

const keyframes = `
  @keyframes slide {
    8% { transform: translateY(0); opacity: 1; }
    25% { opacity: 0; }
    42% { transform: translateY(-64px); opacity: 1; }
    59% { opacity: 0; }
    76% { transform: translateY(-128px); opacity: 1; }
    91% { opacity: 0; }
  }
`;

const subTitle = ["business apps", "the power of models", "knowledge repos"];

export const BusinessUserScreen: React.FC = observer(() => {
	return (
		<div className="absolute inset-0 overflow-hidden bg-background text-foreground dark:bg-[#111521]">
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-center bg-cover opacity-100 dark:opacity-45"
				style={{
					backgroundImage: `url(${businessUsercheckgrid})`,
				}}
			/>
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-white/50 dark:bg-[#111521]/65"
			/>
			<img
				src={BusinessUserImage}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute right-0 bottom-0 z-0 w-[min(68vw,1180px)] min-w-[760px] object-contain opacity-95 drop-shadow-2xl dark:brightness-[0.62] dark:contrast-[1.18] dark:saturate-[1.08]"
			/>
			<div className="relative z-10 flex h-full flex-col items-start gap-11 px-8 pt-[8.75rem] sm:px-14 lg:px-[5.5rem]">
				<div className="flex w-full flex-col gap-1">
					<h2 className="font-bold text-[3.5rem] leading-none tracking-normal">
						Discover
					</h2>
					<style>{keyframes}</style>
					<div className="relative h-16 w-full overflow-hidden">
						<div
							className="absolute flex flex-col"
							style={{
								animation: "slide 9s infinite",
								height: "192px",
								top: 0,
							}}
						>
							{subTitle.map((title) => (
								<span
									key={title}
									className="h-16 font-bold text-[3.5rem] leading-none tracking-normal"
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
				<div className="w-full max-w-[58rem] overflow-auto">
					<PlatformSearch className="h-15 rounded-3xl border-[rgb(198,191,252)] bg-background/95 shadow-sm dark:border-primary/60 dark:bg-card/95 dark:text-muted-foreground" />
				</div>
			</div>
		</div>
	);
});
