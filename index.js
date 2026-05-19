const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("server is flying");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.a82ocix.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("Study-Nook");
    const roomCollection = db.collection("rooms");

    // Getting all rooms data
    app.get("/rooms", async (req, res) => {
      const result = await roomCollection.find().toArray();
      res.json(result);
    });
    // Getting 6 latest rooms data
    app.get("/rooms/latest", async (req, res) => {
      const result = await roomCollection.find().limit(3).toArray();
      res.json(result);
    });
    // Getting individual room data
    app.get("/rooms/:id", async (req, res) => {
      const { id } = req.params;
      const result = await roomCollection.find({ _id: new ObjectId(id) });
      res.json(result);
    });

    // Creating room by users

    await client.db("admin").command({ ping: 1 });
    console.log("DB connected successfully");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is flying on port ${port}`);
});
