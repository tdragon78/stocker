import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { KISClient } from './api/kis';
import { initializeStockMaster, searchStock } from './utils/masterFile';


dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const kisClient = new KISClient();

app.get('/', (req, res) => {
    res.send('Stocker Backend is running!');
});

app.get('/api/stock/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const data = await kisClient.getStockPrice(code);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch stock data' });
    }
});

app.get('/api/stocks/search', (req, res) => {
    const { keyword } = req.query;
    if (!keyword || typeof keyword !== 'string') {
        res.status(400).json({ error: 'Keyword is required' });
        return;
    }
    const results = searchStock(keyword);
    res.json(results);
});


app.listen(port, async () => {
    await initializeStockMaster();
    console.log(`Server is running at http://localhost:${port}`);
});
