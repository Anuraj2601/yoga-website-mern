const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000; 

// middleware
app.use(cors());
app.use(express.json())

//MongoDB connection

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yoga.delab.mongodb.net/?retryWrites=true&w=majority&appName=yoga`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // create a database and collections
    const database = client.db("yoga");
    const userCollection = database.collection("users");
    const classCollection = database.collection("classes");
    const cartCollection = database.collection("cart");
    const paymentCollection = database.collection("payments");
    const enrolledCollection = database.collection("enrolled");
    const appliedCollection = database.collection("applied");

    // classes Routes ---

        // add new class
        app.post('/new-class', async (req, res) => {
            const newClass = req.body;
            //newClass.availableSeats = parseInt(newClass.availableSeats);
            const result = await classCollection.insertOne(newClass);
            res.send(result);
        })

        // get all approved classes
        app.get('/classes', async (req, res) => {
            const query = { status: 'approved'};
            const result = await classCollection.find().toArray();
            res.send(result);
        })

        // get classes by Instrutor email address
        app.get('/classes/:email', async(req,res) => {
            const email = req.params.email;
            const query = {instructorEmail:  email};
            const result = await classCollection.find(query).toArray();
            res.send(result);
        })

        // get all classes
        app.get('/classes-manage', async(req,res) => {
          const result = await classCollection.find().toArray();
          res.send(result);
        })

        // update classes status and reason
        app.patch('/change-status/:id', async(req,res) => {
            const id = req.params.id;
            const status = req.body.status;
            const reason = req.body.reason;
            const filter = {_id: new ObjectId(id)}; // filter by class id
            const options = { upsert: true};  // create a new document if any query doesn't match
            const updateDoc = {
              $set: {
                status: status,
                reason: reason
              },
            };
            const result = await classCollection.updateOne(filter,updateDoc, options);
            res.send(result);
        })

        // get approved classes
        app.get('/approved-classes', async(req,res) => {
          const query = {status: 'approved'};
          const result = await classCollection.find(query).toArray();
          res.send(result);
        })

        // get single classe details
        app.get('/class/:id', async(req,res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await classCollection.findOne(query);
            res.send(result);
        })

        // update class details
        app.put('/update-class/:id', async(req,res) => {
            const id = req.params.id;
            const updateClass = req.body;
            const filter = {_id: new ObjectId(id)};
            const options = {upsert: true};
            const updateDoc = {
              $set : {
                name: updateClass.name,
                description: updateClass.description,
                price: updateClass.price,
                availableSeats: parseInt(updateClass.availableSeats),
                videoLink: updateClass.videoLink,
                status: 'pending',
              },
            };
            const result = await classCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

    // Card Routes  ---

        // add to cart
        app.post('/add-to-cart', async(req,res) => {
            const newCartItem = req.body;
            const result = await cartCollection.insertOne(newCartItem);
            res.send(result);
        })

        // get Cart item by id
        app.get('/cart-item/:id', async(req,res) => {
            const id = req.params.id;
            const email = req.body.email;
            const query = {
              classId: id,
              userMail: email
            };
            const projection = {classId: 1};
            const result = await cartCollection.findOne(query, {projection: projection});
            res.send(result);
        })

        // cart info by user email
        app.get('/cart/:email', async(req,res) => {
          const email = req.params.email;
          const query = {userMail: email};
          const projection = {classId: 1};
          const carts = await cartCollection.find(query, {projection : projection});
          const classIds = carts.map((cart) => new ObjectId(cart.classId));
          const query2 = {_id: {$in: classIds}};
          const result = await classCollection.find(query2).toArray();
          res.send(result);
        })

        // delete cart items
        app.delete('/delete-item/:id', async(req,res) => {
          const id = req.params.id;
          const  query = {classId:  id};
          const result = await cartCollection.deleteOne(query);
          res.send(result);
        })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch(err) {
   console.error('Error connecting to MongoDB:',err);
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})