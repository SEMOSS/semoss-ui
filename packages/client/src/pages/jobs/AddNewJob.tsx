import { useSettings } from "@/hooks";
import { Navigate } from "react-router-dom";
export function AddNewJob() {
    const { adminMode } = useSettings();
    
    if (!adminMode) {
            return <Navigate to={"/settings"} />;
    }
    return (
        <div>
            <h1>Hi</h1>
        </div>
    );
}
