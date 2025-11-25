import { OpenAPI } from '../client';

/**
 * Initialize the generated API client with configuration
 */
export const initApiClient = () => {
    // Set base URL from environment or default
    OpenAPI.BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

    // Set token retrieval logic
    OpenAPI.TOKEN = async () => {
        // Wait for Clerk to load
        let retries = 0;
        const maxRetries = 10;
        while (!window.Clerk && retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            retries++;
        }

        if (window.Clerk?.session) {
            const token = await window.Clerk.session.getToken();
            return token || '';
        }
        return '';
    };
};
