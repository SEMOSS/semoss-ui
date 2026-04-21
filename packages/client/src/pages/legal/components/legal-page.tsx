export const LegalPage = ({ children }) => {
	return (
		<div className="flex w-full justify-center px-10 py-14">
			<div className="w-full max-w-[1800px] rounded-md bg-background p-6 shadow-sm">
				{children}
			</div>
		</div>
	);
};
