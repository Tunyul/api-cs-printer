const { Product } = require('../models');

// Perbaikan: Fungsi harus didefinisikan dengan nama yang benar
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: error.message 
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      message: error.message 
    });
  }
};

// Tambahkan fungsi createProduct jika belum ada
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ 
      error: 'Failed to create product',
      message: error.message 
    });
  }
};

// Tambahkan fungsi updateProduct jika belum ada
exports.updateProduct = async (req, res) => {
  try {
    const [updated] = await Product.update(req.body, {
      where: { id_produk: req.params.id }
    });
    if (updated) {
      const updatedProduct = await Product.findByPk(req.params.id);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ 
      error: 'Failed to update product',
      message: error.message 
    });
  }
};

// Tambahkan fungsi deleteProduct jika belum ada
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.destroy({
      where: { id_produk: req.params.id }
    });
    if (deleted) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      error: 'Failed to delete product',
      message: error.message 
    });
  }
};