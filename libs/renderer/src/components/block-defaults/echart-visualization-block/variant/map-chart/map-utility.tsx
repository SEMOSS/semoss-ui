import worldjson from "./world";

const fetchWorldMap = (urlString: string): Record<string, unknown> => {
	return worldjson;
};

export default fetchWorldMap;
