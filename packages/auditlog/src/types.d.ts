export interface Theme {
	/** Name of the app */
	name: string;

	/** Description of the app */
	description: string;

	/** Styles of the app */
	styles: {
		backgroundColor: string;
		primaryColor: string;
	};

	/** Images throughout app */
	images: {
		logo: string;
	};
}
