import db from '../config/database';
import { logger } from '../utils/logger';

export interface Company {
  ticker: string;
  name: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  exchange?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CompanyWithMetrics extends Company {
  currentPrice?: number;
  sentimentScore?: number;
  priceChange?: number;
  priceChangePercent?: number;
}

export class CompanyModel {
  /**
   * Get all companies
   */
  static async getAll(): Promise<Company[]> {
    try {
      const result = await db.query(
        'SELECT * FROM companies ORDER BY ticker'
      );
      return result.rows;
    } catch (error: any) {
      logger.error('Error getting all companies:', error);
      throw error;
    }
  }

  /**
   * Get company by ticker symbol
   */
  static async getByTicker(ticker: string): Promise<Company | null> {
    try {
      if (!ticker) {
        logger.warn('getByTicker called with undefined ticker');
        return null;
      }
      
      const result = await db.query(
        'SELECT * FROM companies WHERE ticker = $1',
        [ticker.toUpperCase()]
      );
      
      return result.rows.length ? result.rows[0] : null;
    } catch (error: any) {
      logger.error(`Error getting company by ticker ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get companies by sector
   */
  static async getBySector(sector: string): Promise<Company[]> {
    try {
      const result = await db.query(
        'SELECT * FROM companies WHERE sector = $1 ORDER BY ticker',
        [sector]
      );
      
      return result.rows;
    } catch (error: any) {
      logger.error(`Error getting companies by sector ${sector}:`, error);
      throw error;
    }
  }

  /**
   * Create a new company
   */
  static async create(company: Company): Promise<Company> {
    try {
      // Ensure ticker is uppercase
      company.ticker = company.ticker.toUpperCase();
      
      const result = await db.query(
        `INSERT INTO companies 
         (ticker, name, sector, industry, description, website, logo_url, exchange)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          company.ticker,
          company.name,
          company.sector || null,
          company.industry || null,
          company.description || null,
          company.website || null,
          company.logo_url || null,
          company.exchange || null
        ]
      );
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error creating company:', error);
      throw error;
    }
  }

  /**
   * Update an existing company
   */
  static async update(ticker: string, company: Partial<Company>): Promise<Company | null> {
    try {
      // Generate dynamic update query based on provided fields
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Only include fields that are provided
      if (company.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(company.name);
      }
      
      if (company.sector !== undefined) {
        fields.push(`sector = $${paramIndex++}`);
        values.push(company.sector);
      }
      
      if (company.industry !== undefined) {
        fields.push(`industry = $${paramIndex++}`);
        values.push(company.industry);
      }
      
      if (company.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(company.description);
      }
      
      if (company.website !== undefined) {
        fields.push(`website = $${paramIndex++}`);
        values.push(company.website);
      }
      
      if (company.logo_url !== undefined) {
        fields.push(`logo_url = $${paramIndex++}`);
        values.push(company.logo_url);
      }
      
      if (company.exchange !== undefined) {
        fields.push(`exchange = $${paramIndex++}`);
        values.push(company.exchange);
      }
      
      // Always update the updated_at timestamp
      fields.push(`updated_at = NOW()`);
      
      // If no fields to update, return the existing company
      if (fields.length === 1) {
        return this.getByTicker(ticker);
      }
      
      // Add ticker to values array
      values.push(ticker.toUpperCase());
      
      const result = await db.query(
        `UPDATE companies 
         SET ${fields.join(', ')}
         WHERE ticker = $${paramIndex}
         RETURNING *`,
        values
      );
      
      return result.rows.length ? result.rows[0] : null;
    } catch (error: any) {
      logger.error(`Error updating company ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Delete a company
   */
  static async delete(ticker: string): Promise<boolean> {
    try {
      const result = await db.query(
        'DELETE FROM companies WHERE ticker = $1 RETURNING ticker',
        [ticker.toUpperCase()]
      );
      
      return result.rows.length > 0;
    } catch (error: any) {
      logger.error(`Error deleting company ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get companies with latest metrics (price and sentiment)
   */
  static async getCompaniesWithMetrics(): Promise<CompanyWithMetrics[]> {
    try {
      const result = await db.query(`
        SELECT 
          c.*, 
          sp.close AS current_price,
          ss.sentiment_score,
          sp.close - lag(sp.close) OVER (PARTITION BY c.ticker ORDER BY sp.date) AS price_change,
          (sp.close - lag(sp.close) OVER (PARTITION BY c.ticker ORDER BY sp.date)) / lag(sp.close) OVER (PARTITION BY c.ticker ORDER BY sp.date) * 100 AS price_change_percent
        FROM 
          companies c
        LEFT JOIN (
          SELECT DISTINCT ON (ticker) 
            ticker, 
            date, 
            close 
          FROM 
            stock_prices 
          ORDER BY 
            ticker, 
            date DESC
        ) sp ON c.ticker = sp.ticker
        LEFT JOIN (
          SELECT DISTINCT ON (ticker) 
            ticker, 
            date, 
            sentiment_score 
          FROM 
            sentiment_scores 
          ORDER BY 
            ticker, 
            date DESC
        ) ss ON c.ticker = ss.ticker
        ORDER BY c.ticker
      `);
      
      return result.rows;
    } catch (error: any) {
      logger.error('Error getting companies with metrics:', error);
      throw error;
    }
  }

  /**
   * Search for companies by name or ticker
   */
  static async search(query: string): Promise<Company[]> {
    try {
      const searchTerm = `%${query}%`;
      
      const result = await db.query(
        `SELECT * FROM companies 
         WHERE ticker ILIKE $1 OR name ILIKE $1
         ORDER BY 
           CASE WHEN ticker ILIKE $2 THEN 0
                WHEN name ILIKE $2 THEN 1
                ELSE 2
           END,
           ticker`,
        [searchTerm, `${query}%`]
      );
      
      return result.rows;
    } catch (error: any) {
      logger.error(`Error searching companies with query ${query}:`, error);
      throw error;
    }
  }
}