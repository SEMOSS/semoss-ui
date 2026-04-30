import { Calendar, Clock, Hash, Sigma, Type } from "lucide-react";
import type React from "react";

interface DataTypeIconProps {
	type: string;
	className?: string;
}

export const DataTypeIcon: React.FC<DataTypeIconProps> = ({
	type,
	className = "size-4",
}) => {
	switch (type?.toUpperCase()) {
		case "STRING":
		case "VARCHAR":
		case "TEXT":
			return <Type className={className} />;
		case "DATE":
			return <Calendar className={className} />;
		case "TIMESTAMP":
		case "DATETIME":
			return <Clock className={className} />;
		case "NUMBER":
		case "INT":
		case "INTEGER":
			return <Hash className={className} />;
		case "DOUBLE":
		case "FLOAT":
			return <Sigma className={className} />;
		default:
			return <Type className={className} />;
	}
};
