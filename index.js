const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = 3000;

const url = 'mongodb://localhost:27017/';
const dbName = 'blogsMongoDB';
const client = new MongoClient(url);

app.use(express.json());

let db;

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('connected to MongoDB');
        db = client.db(dbName);
    } catch (error) {
        console.error('couldnt connect to MongoDB:', error);
        process.exit(1);
    }
}

connectToDatabase().then(() => {
    app.listen(port, () => {
        console.log(`server is running at http://localhost:${port}`);
    });
});

const validateInputs = (title, body) => {
    return !title || !body || title.trim() === '' || body.trim() === '';
};

app.post('/blogs', async (req, res) => {
    try {
        const { title, body, author } = req.body;

        if (validateInputs(title, body)) {
            return res.status(400).json({ message: 'title and body are required.' });
        }

        const result = await db.collection('blogs').insertOne({ title, body, author });
        res.status(201).json(result.ops[0]);
    } catch (error) {
        console.error('error creating post:', error);
        res.status(500).json({ message: 'error creating post', error: error.message });
    }
});

app.get('/blogs', async (req, res) => {
    try {
        const blogs = await db.collection('blogs').find({}).toArray();
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'error retrieving posts', error: error.message });
    }
});

app.get('/blogs/:id', async (req, res) => {
    try {
        const blog = await db.collection('blogs').findOne({ _id: new ObjectId(req.params.id) });
        if (!blog) {
            return res.status(404).json({ message: 'post not found' });
        }
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'error retrieving post', error: error.message });
    }
});

app.put('/blogs/:id', async (req, res) => {
    try {
        const { title, body, author } = req.body;

        if (validateInputs(title, body)) {
            return res.status(400).json({ message: 'title and body are required.' });
        }

        const result = await db.collection('blogs').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { title, body, author, updatedAt: new Date() } });
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'post not found' });
        }
        res.json({ message: 'updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'error updating post', error: error.message });
    }
});

app.delete('/blogs/:id', async (req, res) => {
    try {
        const result = await db.collection('blogs').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'post not found' });
        }
        res.json({ message: 'post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'error deleting post', error: error.message });
    }
});
