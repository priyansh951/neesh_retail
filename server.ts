import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import Papa from "papaparse";

dotenv.config();

const app = express();
const PORT = 3000;

async function fetchGoogleSheetsData() {
  const publicCsvUrl = process.env.GOOGLE_SHEETS_CSV_URL;

  if (!publicCsvUrl) {
    console.warn("GOOGLE_SHEETS_CSV_URL not configured.");
    return null;
  }

  try {
    const separator = publicCsvUrl.includes("?") ? "&" : "?";
    const bustedUrl = `${publicCsvUrl}${separator}t=${Date.now()}`;
    
    // Safety check for common mistake: providing the spreadsheet URL instead of the CSV export URL
    if (publicCsvUrl.includes("/edit") || !publicCsvUrl.includes("csv")) {
      console.warn("[PROD_WARN] The GOOGLE_SHEETS_CSV_URL might be a spreadsheet link instead of a CSV export link. Ensure you use 'File > Share > Publish to Web > CSV'.");
    }

    console.log(`[PROD_LOG] [${new Date().toISOString()}] Initiating fetch: ${bustedUrl.replace(/key=[^&]+/, "key=REDACTED")}`);
    
    const response = await fetch(bustedUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'User-Agent': 'Broadway-Analytics-Dashboard/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROD_ERROR] Google Sheets returned ${response.status}: ${errorText}`);
      throw new Error(`Google Sheets responded with ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    
    if (!csvText || csvText.length < 50) {
      console.error(`[PROD_ERROR] Received tiny/empty CSV response. Ensure the sheet is Published to the Web.`);
      throw new Error("Received empty data from Google Sheets. Ensure your Sheet is Published to the Web as CSV.");
    }

    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
    });

    if (results.errors && results.errors.length > 0) {
      console.warn("[PROD_WARN] CSV Parsing warnings:", results.errors);
    }
    
    console.log(`[PROD_LOG] Successfully parsed ${results.data.length} rows.`);
    return cleanData(results.data);
  } catch (error) {
    console.error("Error fetching from public CSV:", error);
    throw error;
  }
}

/**
 * Clean data to match Broadway report expectations
 */
function cleanData(data: any[]): any[] {
  return data.map(item => {
    const cleaned: any = {};
    Object.keys(item).forEach(key => {
      const normalizedKey = key.trim();
      cleaned[normalizedKey] = item[key];
    });

    const numericFields = ["MRP", "RSP", "Qty", "Basic Amt", "Promo Amt", "Coupon Amt", "Net Sale Amt"];
    numericFields.forEach(field => {
      if (cleaned[field] !== undefined && cleaned[field] !== null) {
        cleaned[field] = cleaned[field].toString().replace(/[₹,]/g, "");
      } else {
        cleaned[field] = "0";
      }
    });

    return cleaned;
  });
}

// API routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env_loaded: !!process.env.GOOGLE_SHEETS_CSV_URL,
    node_env: process.env.NODE_ENV
  });
});

app.get("/api/sales", async (req, res) => {
  try {
    const csvUrl = process.env.GOOGLE_SHEETS_CSV_URL;
    
    if (!csvUrl) {
      console.error("CRITICAL: GOOGLE_SHEETS_CSV_URL is not defined in environment variables.");
      return res.status(400).json({
        success: false,
        error: "Server Configuration Error: GOOGLE_SHEETS_CSV_URL is missing. Please add it to Vercel environment variables.",
        source: "none"
      });
    }

    const data = await fetchGoogleSheetsData();
    
    if (!data || data.length === 0) {
       return res.status(404).json({
         success: false,
         error: "No data available. Please check if the Google Sheet has data and the link is correct.",
         source: "none"
       });
    }

    res.json({
      success: true,
      data: data,
      source: "sheets",
      count: data.length,
      lastFetched: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

if (process.env.NODE_ENV !== "production") {
  startServer();
}
