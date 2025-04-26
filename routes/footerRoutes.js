import express from 'express';
import Footer from '../models/Footer.js';

const router = express.Router();

// Get footer data
router.get('/', async (req, res) => {
  try {
    // Get the most recent footer data
    const footerData = await Footer.findOne().sort({ updatedAt: -1 });
    
    if (!footerData) {
      // If no footer data exists, create default data
      const defaultFooter = await Footer.create({});
      return res.json(defaultFooter);
    }
    
    res.json(footerData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update footer data (admin only)
router.put('/', async (req, res) => {
  try {
    const { companyName, socialLinks } = req.body;
    
    // Get the most recent footer data
    let footerData = await Footer.findOne().sort({ updatedAt: -1 });
    
    if (!footerData) {
      // If no footer data exists, create new
      footerData = await Footer.create({
        companyName,
        socialLinks
      });
    } else {
      // Update existing footer data
      footerData.companyName = companyName;
      footerData.socialLinks = socialLinks;
      await footerData.save();
    }
    
    res.json(footerData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 