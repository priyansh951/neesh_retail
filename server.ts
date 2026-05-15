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
    // Add timestamp cache-busting to the URL
    const separator = publicCsvUrl.includes("?") ? "&" : "?";
    const bustedUrl = `${publicCsvUrl}${separator}t=${Date.now()}`;
    
    console.log(`[${new Date().toISOString()}] Fetching fresh data from: ${bustedUrl}`);
    
    const response = await fetch(bustedUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
    });

    if (results.errors && results.errors.length > 0) {
      console.warn("CSV Parsing errors:", results.errors);
    }

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
app.get("/api/sales", async (req, res) => {
  try {
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

startServer();
