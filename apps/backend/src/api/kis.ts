import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class KISClient {
    private client: AxiosInstance;
    private appKey: string;
    private appSecret: string;
    private baseUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor() {
        this.appKey = process.env.KIS_APP_KEY || '';
        this.appSecret = process.env.KIS_APP_SECRET || '';
        this.baseUrl = process.env.KIS_BASE_URL || 'https://openapivts.koreainvestment.com:29443';

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const response = await this.client.post('/oauth2/tokenP', {
                grant_type: 'client_credentials',
                appkey: this.appKey,
                appsecret: this.appSecret,
            });

            this.accessToken = response.data.access_token;
            // Expires in varies, safe default 3600s usually, setting 1 hour
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;

            console.log('KIS Access Token refreshed');
            return this.accessToken!;
        } catch (error) {
            console.error('Failed to get access token:', error);
            throw error;
        }
    }

    public async getStockPrice(code: string): Promise<any> {
        try {
            const token = await this.getAccessToken();

            // Korea Investment API: Get Current Price (Domestic Stock)
            // Path: /uapi/domestic-stock/v1/quotations/inquire-price
            const response = await this.client.get('/uapi/domestic-stock/v1/quotations/inquire-price', {
                headers: {
                    authorization: `Bearer ${token}`,
                    appkey: this.appKey,
                    appsecret: this.appSecret,
                    tr_id: 'FHKST01010100', // Transaction ID for current price
                },
                params: {
                    fid_cond_mrkt_div_code: 'J', // Market division code (J: Stock)
                    fid_input_iscd: code, // Stock code
                },
            });

            return response.data;
        } catch (error) {
            console.error(`Failed to fetch stock price for ${code}:`, error);
            // Logic to handle 401 token expiry retry could go here
            throw error;
        }
    }
}
