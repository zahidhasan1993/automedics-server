const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//zgsrQlFubgRzSUd7
//automedics

//connections/routes

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.d09ztu7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJWT = (req,res,next) => {
  // console.log('jwt theke asche',req.headers.authorization);

  const authorization = req.headers.authorization;

  if(!authorization){
    return res.status(401).send({error : true, message: 'User now founded, token false'})
  }

  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded) => {
    if (err) {
      res.status(403).send({error : true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
  // console.log('token theke paise',token);

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("autoMedics");
    const serviceCollections = database.collection("services");
    const orderCollections = database.collection("orders");

    //jwt

    app.post("/token", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });
      // console.log(token);
      res.send({ token });
    });

    //service database
    app.get("/services", async (req, res) => {
      const cursor = serviceCollections.find();
      const result = await cursor.toArray();

      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const service = await serviceCollections.findOne(query);

      res.send(service);
    });

    //order database

    app.get("/orders", verifyJWT , async (req, res) => {
      let query = {};
      const decoded = req.decoded;
      // console.log('comeback after authorized', req.query.email);
      // console.log(req.headers.authorization);
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      if (req.query.email !== decoded.email) {
        return res.status(402).send({error: true, message: 'Unauthorized Access'})
        
      }

      const orders = orderCollections.find(query);
      // console.log(orders);
      const result = await orders.toArray();
      res.send(result);
    });

    app.post("/orders", async (req, res) => {
      const order = req.body;
      console.log(order);
      const result = await orderCollections.insertOne(order);

      res.send(result);
    });

    //update confirmed order
    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Confirmed",
        },
      };

      const result = await orderCollections.updateOne(filter, updateDoc);

      console.log(id);
      res.send(result);
    });

    // Delete single order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await orderCollections.deleteOne(query);

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to automedics serversite");
});

app.listen(port, () => {
  console.log("running on port :", port);
});
