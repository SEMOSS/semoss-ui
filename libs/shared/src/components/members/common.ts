export const returnAccessType = (permission: string) => {
	switch (permission) {
		case "READ_ONLY":
			return "can view";
		case "EDIT":
			return "can edit";
		case "OWNER":
			return "owner";
		default:
			return "select access";
	}
};
