import { useEffect } from "react";

function ApiKeepAlive() {
    useEffect(() => {
        const callApi = async () => {
            try {
                const response = await fetch(
                    "https://billing-backend-5xym.onrender.com/api/health"
                );

                console.log("API health status:", response.status);
            } catch (error) {
                console.error("API health check failed:", error);
            }
        };

        // Call immediately when the component mounts
        callApi();

        // Call again every 15 minutes
        const interval = setInterval(callApi, 15 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return null;
}

export default ApiKeepAlive;