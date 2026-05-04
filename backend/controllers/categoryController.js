const Category = require('../models/Category');
const { createError } = require('../utils/errorUtils');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
};

const adminGetCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, slug, isActive } = req.body;
    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) return next(createError(409, 'Category with this name or slug already exists.'));
    const category = await Category.create({ name, slug, isActive });
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return next(createError(404, 'Category not found.'));
    res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return next(createError(404, 'Category not found.'));
    res.status(200).json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, adminGetCategories, createCategory, updateCategory, deleteCategory };
