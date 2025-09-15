import express from 'express';
import { companyController } from '../controllers/companyController';

const router = express.Router();

/**
 * @route   GET /companies
 * @desc    Get all companies
 */
router.get('/', companyController.getAllCompanies);

/**
 * @route   GET /companies/search
 * @desc    Search companies by name or ticker
 */
router.get('/search', companyController.searchCompanies);

/**
 * @route   GET /companies/metrics
 * @desc    Get companies with metrics
 */
router.get('/metrics', companyController.getCompaniesWithMetrics);

/**
 * @route   GET /companies/sector/:sector
 * @desc    Get companies by sector
 */
router.get('/sector/:sector', companyController.getCompaniesBySector);

/**
 * @route   GET /companies/:ticker
 * @desc    Get company by ticker
 */
router.get('/:ticker', companyController.getCompanyByTicker);

/**
 * @route   POST /companies
 * @desc    Create a new company
 */
router.post('/', companyController.createCompany);

/**
 * @route   PUT /companies/:ticker
 * @desc    Update a company
 */
router.put('/:ticker', companyController.updateCompany);

/**
 * @route   DELETE /companies/:ticker
 * @desc    Delete a company
 */
router.delete('/:ticker', companyController.deleteCompany);

/**
 * @route   POST /companies/:ticker/refresh
 * @desc    Refresh company data
 */
router.post('/:ticker/refresh', companyController.refreshCompanyData);

export default router;