export const config = {
    // API URL Priority:
    // 1. VITE_API_URL environment variable (if set)
    // 2. Default to localhost:3009 (new backend port)
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3009',
};
