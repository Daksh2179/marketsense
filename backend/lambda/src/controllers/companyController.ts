import { Request, Response } from 'express';
import { CompanyModel } from '../models/Company';
import { DataIngestionService } from '../services/dataIngestionService';
import { logger } from '../utils/logger';

export const companyController = {
  /**
   * Get all companies
   */
  getAllCompanies: async (req: Request, res: Response): Promise<void> => {
    try {
      const companies = await CompanyModel.getAll();
      res.status(200).json(companies);
    } catch (error) {
      logger.error('Error fetching all companies:', error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  },

  /**
   * Get company by ticker
   */
getCompanyByTicker: async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticker } = req.params;
    logger.info(`Fetching company data for ${ticker}`);
    
    let company = await CompanyModel.getByTicker(ticker);
    
    if (!company) {
      logger.info(`Company ${ticker} not in DB, fetching from API`);
      
      const { FinancialApiService } = require('../services/financialApiService');
      
      const overview = await FinancialApiService.getCompanyOverview(ticker);
      
      if (overview && overview.Symbol) {
        company = {
          ticker: overview.Symbol,
          name: overview.Name || `${ticker} Inc.`,
          sector: overview.Sector || 'Unknown',
          industry: overview.Industry || 'Unknown',
          description: overview.Description || '',
          website: overview.Website || '',
          exchange: overview.Exchange || 'UNKNOWN',
          // Remove market_cap and employees as they don't exist in Company type
          created_at: new Date(),
          updated_at: new Date()
        };
        
        logger.info(`Successfully fetched ${ticker} company data from API`);
      }
    }
    
    if (!company) {
      company = {
        ticker: ticker,
        name: `${ticker} Inc.`,
        sector: 'Unknown',
        industry: 'Unknown',
        description: 'Company information temporarily unavailable',
        website: '',
        exchange: 'UNKNOWN',
        created_at: new Date(),
        updated_at: new Date()
      };
    }
    
    res.status(200).json(company);
  } catch (error) {
    logger.error(`Error fetching company ${req.params.ticker}:`, error);
    
    res.status(200).json({
      ticker: req.params.ticker,
      name: `${req.params.ticker} Inc.`,
      sector: 'Unknown',
      industry: 'Unknown',
      description: 'Company information temporarily unavailable',
      website: '',
      exchange: 'UNKNOWN',
      created_at: new Date(),
      updated_at: new Date()
    });
  }
},

  /**
   * Get companies by sector
   */
  getCompaniesBySector: async (req: Request, res: Response): Promise<void> => {
    try {
      const { sector } = req.params;
      const companies = await CompanyModel.getBySector(sector);
      res.status(200).json(companies);
    } catch (error) {
      logger.error(`Error fetching companies in sector ${req.params.sector}:`, error);
      res.status(500).json({ error: 'Failed to fetch companies by sector' });
    }
  },

  /**
   * Create company
   */
  createCompany: async (req: Request, res: Response): Promise<void> => {
    try {
      // Add debugging
      logger.debug('Create company request body:', req.body);
      
      const companyData = req.body;
      
      // Validate required fields
      if (!companyData || !companyData.ticker || !companyData.name) {
        logger.error('Missing required fields for company creation');
        res.status(400).json({ error: 'Missing required fields: ticker and name are required' });
        return;
      }
      
      // Check if company already exists
      const existingCompany = await CompanyModel.getByTicker(companyData.ticker);
      
      if (existingCompany) {
        res.status(409).json({ error: 'Company already exists' });
        return;
      }
      
      const newCompany = await CompanyModel.create(companyData);
      res.status(201).json(newCompany);
    } catch (error: any) {
      logger.error('Error creating company:', error);
      res.status(500).json({ error: 'Failed to create company', details: error.message });
    }
  },

  /**
   * Update company
   */
  updateCompany: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      const companyData = req.body;
      
      const updatedCompany = await CompanyModel.update(ticker, companyData);
      
      if (!updatedCompany) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      res.status(200).json(updatedCompany);
    } catch (error) {
      logger.error(`Error updating company ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to update company' });
    }
  },

  /**
   * Delete company
   */
  deleteCompany: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      
      const deleted = await CompanyModel.delete(ticker);
      
      if (!deleted) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      res.status(200).json({ message: 'Company deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting company ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to delete company' });
    }
  },

  /**
   * Search companies
   */
  searchCompanies: async (req: Request, res: Response): Promise<void> => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }
      
      const results = await CompanyModel.search(query);
      res.status(200).json(results);
    } catch (error) {
      logger.error(`Error searching companies with query ${req.query.query}:`, error);
      res.status(500).json({ error: 'Failed to search companies' });
    }
  },

  /**
   * Get companies with metrics
   */
  getCompaniesWithMetrics: async (req: Request, res: Response): Promise<void> => {
    try {
      const companiesWithMetrics = await CompanyModel.getCompaniesWithMetrics();
      res.status(200).json(companiesWithMetrics);
    } catch (error) {
      logger.error('Error fetching companies with metrics:', error);
      res.status(500).json({ error: 'Failed to fetch companies with metrics' });
    }
  },

  /**
   * Refresh company data
   */
  refreshCompanyData: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      
      // Check if company exists
      const company = await CompanyModel.getByTicker(ticker);
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      // Start data refresh in background
      DataIngestionService.fullDataRefresh(ticker)
        .then(success => {
          logger.info(`Data refresh for ${ticker} completed with status: ${success}`);
        })
        .catch(error => {
          logger.error(`Error in data refresh for ${ticker}:`, error);
        });
      
      res.status(202).json({ 
        message: `Data refresh for ${ticker} has been initiated`,
        company
      });
    } catch (error) {
      logger.error(`Error initiating data refresh for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to initiate data refresh' });
    }
  }
};