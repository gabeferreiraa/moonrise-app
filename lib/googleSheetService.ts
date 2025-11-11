// googleSheetsService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
  SHEET_ID: "1NsC-0EIqwpKBYXbAp4ICovEgFaMa5vdujujfCuEcVLY",
  API_KEY: "AIzaSyBe19xdvqPs6HCXmJkRuvtOn9vSeX1z4xM",
  RANGE: "Sheet1!A:C", // Columns A (title), B (description), C (created_at)
};

export interface Announcement {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

class GoogleSheetsService {
  private cacheKey = "announcements_cache";
  private cacheExpiryKey = "announcements_cache_expiry";
  private cacheExpiryTime = 5 * 60 * 1000; // 5 minutes

  async fetchAnnouncements(forceRefresh = false): Promise<Announcement[]> {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = await this.getCachedData();
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SHEET_ID}/values/${GOOGLE_SHEETS_CONFIG.RANGE}?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.values || data.values.length === 0) {
        return [];
      }

      // Parse the data (first row is headers)
      const [headers, ...rows] = data.values;

      const announcements: Announcement[] = rows.map((row, index) => ({
        id: `announcement-${Date.now()}-${index}`,
        title: row[0] || "",
        description: row[1] || "",
        created_at: row[2] || new Date().toISOString(),
      }));

      // Sort by date (newest first)
      announcements.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      // Cache the data
      await this.setCachedData(announcements);

      return announcements;
    } catch (error) {
      console.error("Error fetching from Google Sheets:", error);

      // Try to return cached data if available
      const cachedData = await this.getCachedData(true);
      if (cachedData) {
        console.log("Returning stale cache due to error");
        return cachedData;
      }

      throw error;
    }
  }

  private async getCachedData(
    ignoreExpiry = false
  ): Promise<Announcement[] | null> {
    try {
      const [cachedData, expiryTime] = await Promise.all([
        AsyncStorage.getItem(this.cacheKey),
        AsyncStorage.getItem(this.cacheExpiryKey),
      ]);

      if (!cachedData) return null;

      if (!ignoreExpiry && expiryTime) {
        const expiry = parseInt(expiryTime, 10);
        if (Date.now() > expiry) {
          return null;
        }
      }

      return JSON.parse(cachedData);
    } catch (error) {
      console.error("Error getting cached data:", error);
      return null;
    }
  }

  private async setCachedData(data: Announcement[]): Promise<void> {
    try {
      const expiryTime = Date.now() + this.cacheExpiryTime;
      await Promise.all([
        AsyncStorage.setItem(this.cacheKey, JSON.stringify(data)),
        AsyncStorage.setItem(this.cacheExpiryKey, expiryTime.toString()),
      ]);
    } catch (error) {
      console.error("Error setting cached data:", error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.cacheKey),
        AsyncStorage.removeItem(this.cacheExpiryKey),
      ]);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }
}

export default new GoogleSheetsService();
