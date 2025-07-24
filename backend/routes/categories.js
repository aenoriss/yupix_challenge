import express from 'express';
import Category from '../models/Category.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const existingCategory = await Category.findOne({ 
      userId: req.user._id, 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    const category = new Category({
      name,
      color: color || '#6B7280',
      userId: req.user._id
    });
    
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const { name, color } = req.body;
    
    if (name !== undefined) {
      const existingCategory = await Category.findOne({ 
        userId: req.user._id, 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      
      category.name = name;
    }
    
    if (color !== undefined) {
      category.color = color;
    }
    
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const Task = (await import('../models/Task.js')).default;
    await Task.updateMany(
      { categoryId: req.params.id, userId: req.user._id },
      { $unset: { categoryId: 1 } }
    );
    
    await category.deleteOne();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;