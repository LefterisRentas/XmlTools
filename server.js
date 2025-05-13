import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for large XML files

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB with the enhanced URI
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000, // Timeout after 10s
  heartbeatFrequencyMS: 10000, // Check server health every 10 seconds
  retryWrites: true,
  connectTimeoutMS: 30000, // Increase connection timeout
  directConnection: true,
})
.then(() => console.log('Connected to MongoDB successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Don't exit the process, allow for retry
});

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

// Add a process handler to close MongoDB connection on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

// Define XML Document Schema
const xmlDocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['xml', 'xsd', 'xslt'] },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const XmlDocument = mongoose.model('XmlDocument', xmlDocumentSchema);

// API Routes

// Get all documents for a user
app.get('/api/documents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const documents = await XmlDocument.find({ userId }).sort({ updatedAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// Get a specific document
app.get('/api/documents/:userId/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    const document = await XmlDocument.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Failed to fetch document' });
  }
});

// Save a document
app.post('/api/documents', async (req, res) => {
  try {
    const { userId, title, type, content } = req.body;
    
    if (!userId || !title || !type || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const newDocument = new XmlDocument({
      userId,
      title,
      type,
      content
    });
    
    await newDocument.save();
    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ message: 'Failed to save document' });
  }
});

// Update a document
app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, title, content } = req.body;
    
    const document = await XmlDocument.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    document.title = title || document.title;
    document.content = content || document.content;
    document.updatedAt = Date.now();
    
    await document.save();
    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Failed to update document' });
  }
});

// Delete a document
app.delete('/api/documents/:userId/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    const result = await XmlDocument.deleteOne({ _id: id, userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});