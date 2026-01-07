import axios from 'axios';
import AdmZip from 'adm-zip';
import iconv from 'iconv-lite';
import fs from 'fs';
import path from 'path';

export interface StockMaster {
    code: string;
    name: string;
}

let stockMasterList: StockMaster[] = [];

const KOSPI_MASTER_URL = 'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip';
// TODO: Add KOSDAQ support later if needed.

export const initializeStockMaster = async () => {
    console.log('Initializing Stock Master Data...');
    try {
        const downloadPath = path.join(__dirname, '../../temp_kospi_code.zip');

        // Download the ZIP file
        console.log(`Downloading master file from ${KOSPI_MASTER_URL}...`);
        const response = await axios({
            url: KOSPI_MASTER_URL,
            method: 'GET',
            responseType: 'arraybuffer',
        });

        const buffer = Buffer.from(response.data, 'binary');
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        let mstContent: Buffer | null = null;

        // Find .mst file in zip
        const mstEntry = zipEntries.find(entry => entry.entryName.endsWith('.mst'));
        if (mstEntry) {
            mstContent = mstEntry.getData();
        }

        if (!mstContent) {
            throw new Error('No .mst file found in the downloaded zip');
        }

        const validMstContent = mstContent; // Ensure type is Buffer

        // Decode content (cp949)
        const decodedContent = iconv.decode(validMstContent, 'cp949');

        // Parse Lines
        const lines = decodedContent.split('\n');
        const stocks: StockMaster[] = [];

        lines.forEach((line) => {
            if (line.length < 20) return; // Skip empty or invalid lines

            // Parsing Logic based on approximate fixed widths
            // Code: 0-9 (includes spaces usually, trim it)
            // Name: 21 onwards (up to next section, checking manually often best)

            // KOSPI mst line format is tricky, usually:
            // ShortCode(9) + StandardCode(12) + Name(Unknown length fixed or variable?)
            // Let's rely on the Python logic: name starts at index 21.
            // We will take a safe chunk from 21 to say 60 or trim end.

            const code = line.substring(0, 9).trim();
            // Name is typically 40 bytes but let's take a larger slice and trim.
            // Note: Javascript substring works on characters, not bytes. 
            // This is a risk if the decode happened already. 
            // Wait, iconv.decode converts to JS string (UTF-8 compatible). 
            // So character indexing should be somewhat safe IF the width was defined in bytes but we are slicing string.
            // Korean characters are 1 char in JS string usually. 
            // Fixed width 'byte' offsets don't map 1:1 to JS string indices if Korean is present.

            // BETTER APPROACH: Slice the BUFFER, not the string, then decode the slices.
        });

        // Resetting to buffer parsing for safety
        const linesBuffer: Buffer[] = [];
        let start = 0;
        for (let i = 0; i < validMstContent.length; i++) {
            if (validMstContent[i] === 10) { // Newline \n
                linesBuffer.push(validMstContent.subarray(start, i));
                start = i + 1;
            }
        }

        linesBuffer.forEach(lineBuf => {
            if (lineBuf.length < 25) return;

            // rf1_1 (Short Code): 0-9 bytes
            const codeBuf = lineBuf.subarray(0, 9);
            const code = iconv.decode(codeBuf, 'cp949').trim();

            // rf1_3 (Name): 21 bytes onwards.
            // Based on python ref: rf1_3 = rf1[21:].strip()
            // It seems the first part of the row (rf1) has a fixed length.
            // Let's assume the name is from 21 to the end of this "block".
            // Typically the KOSPI row is very long (228+ bytes).
            // The name is usually followed by grouping codes.
            // Let's take a large enough chunk to cover the name, e.g., 21 to 61 (40 bytes).
            const nameBuf = lineBuf.subarray(21, 61);
            const name = iconv.decode(nameBuf, 'cp949').trim();

            if (code && name) {
                stocks.push({ code, name });
            }
        });

        stockMasterList = stocks;
        console.log(`Loaded ${stockMasterList.length} stocks from master file.`);

    } catch (error) {
        console.error('Failed to initialize stock master:', error);
    }
};

export const searchStock = (keyword: string): StockMaster[] => {
    const lowerKeyword = keyword.toLowerCase();
    return stockMasterList.filter(stock =>
        stock.name.includes(keyword) ||
        stock.code.includes(keyword)
    ).slice(0, 20); // Limit to 20 results
};
