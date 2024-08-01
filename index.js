require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3aom8f0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const blogCollection = client.db('mindfulDB').collection('blogs');
        const savedBlogCollection = client.db('mindfulDB').collection('savedBlogs');
        const commentCollection = client.db('mindfulDB').collection('comments');
        const userCollection = client.db('plantDB').collection('user');

        // Get all blogs from the database
        app.get('/blog', async (req, res) => {
            const cursor = blogCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // Get a specific blog by id
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            if (ObjectId.isValid(id)) {
                const query = { _id: new ObjectId(id) };
                const result = await blogCollection.findOne(query);
                res.send(result);
            } else {
                res.status(400).send({ error: 'Invalid ID format' });
            }
        });

        // Save a new blog post to the database
        app.post('/blog', async (req, res) => {
            const blogDetails = req.body;
            if (!blogDetails) {
                res.status(400).send({ error: 'Blog details are required' });
                return;
            }

            try {
                const result = await blogCollection.insertOne(blogDetails);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error saving blog', error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        // Save a blog to the savedBlogs collection
        app.post('/savedBlogs', async (req, res) => {
            const blogDetails = req.body;
            if (!blogDetails) {
                res.status(400).send({ error: 'Blog details are required' });
                return;
            }

            try {
                const result = await savedBlogCollection.insertOne(blogDetails);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error saving blog', error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        // Get all saved blogs from the database
        app.get('/savedBlogs', async (req, res) => {
            const userId = req.query.userId;
            if (!userId) {
                return res.status(400).send({ error: 'User ID is required' });
            }

            try {
                const query = { userId: userId };
                const cursor = savedBlogCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching saved blogs:', error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        // Delete a blog from the savedBlogs collection
        app.delete('/savedBlogs/:itemId', async (req, res) => {
            const itemId = req.params.itemId;
            const query = { _id: new ObjectId(itemId) };

            try {
                const result = await savedBlogCollection.deleteOne(query);
                if (result.deletedCount === 1) {
                    res.json({ message: 'Item deleted successfully' });
                } else {
                    res.status(404).json({ message: 'Item not found' });
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                res.status(500).json({ message: 'Server error' });
            }
        });




        // Get all comments for a specific blog post
        app.get('/comments/:blogId', async (req, res) => {
            const blogId = req.params.blogId;
            const query = { blogId: new ObjectId(blogId) };
            const cursor = commentCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // Post a new comment for a specific blog post
        app.post('/comments', async (req, res) => {
            const commentDetails = req.body;
            if (!commentDetails || !commentDetails.blogId || !commentDetails.content) {
                res.status(400).send({ error: 'Comment details are required' });
                return;
            }

            try {
                commentDetails.blogId = new ObjectId(commentDetails.blogId);
                const result = await commentCollection.insertOne(commentDetails);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error posting comment', error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        app.post('/user', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.get('/user', async (req, res) => {
            const cursor = userCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensure the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Mindful Mosaic is Running');
});

app.listen(port, () => {
    console.log(`Mindful Mosaic is Running on Port: ${port}`);
});
