import { config } from './config';

interface StockPriceResponse {
    success: boolean;
    data: {
        output: {
            stck_prpr: string;
            prdy_vrss: string;
            prdy_ctrt: string;
        };
    };
    code?: string; // Appended by frontend logic often, but good to have in type if needed
}

export const api = {
    getStocksPrices: async (codes: string[]) => {
        const response = await fetch(`${config.apiUrl}/api/stocks/prices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codes }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch prices');
        }
        return response.json();
    },

    searchStocks: async (keyword: string) => {
        const response = await fetch(`${config.apiUrl}/api/stocks/search?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) {
            throw new Error('Search failed');
        }
        return response.json();
    }
};
