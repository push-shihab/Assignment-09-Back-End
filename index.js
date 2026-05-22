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
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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
    // await client.connect();

    const db = client.db("Study-Nook");
    const roomCollection = db.collection("rooms");
    const bookingCollection = db.collection("bookings");

    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
    );

    const verifyToken = async (req, res, next) => {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "unauthurized" });
      }
      try {
        const { payload } = await jwtVerify(token, JWKS);
        next();
      } catch (error) {
        return res.status(401).json({ message: error.message });
      }
    };

    // Getting all rooms data
    app.get("/rooms", async (req, res) => {
      const result = await roomCollection
        .find()
        .sort({ bookings: -1 })
        .toArray();
      res.send(result);
    });
    // Getting 6 latest rooms data
    app.get("/rooms/latest", async (req, res) => {
      const result = await roomCollection.find().limit(6).toArray();
      res.json(result);
    });
    // Booking conflict route
    app.get("/rooms/bookings", async (req, res) => {
      const { roomId, date, startTime, endTime } = req.query;

      const result = await bookingCollection
        .find({
          roomId: roomId,
          date: date,
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        })
        .toArray();

      res.json(result);
    });
    // Getting individual room data
    app.get("/rooms/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await roomCollection
        .find({ _id: new ObjectId(id) })
        .toArray();
      res.json(result);
    });
    // Getting all rooms of individual owner
    app.get("/rooms/self/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await roomCollection.find({ id: id }).toArray();
      res.json(result);
    });

    // Creating room by users
    app.post("/rooms/new", verifyToken, async (req, res) => {
      const roomData = req.body;
      const result = await roomCollection.insertOne(roomData);
      res.json(result);
    });
    // Booking room by users
    app.post("/rooms/book", async (req, res) => {
      const roomData = req.body;
      const result = await bookingCollection.insertOne(roomData);
      if (result.acknowledged) {
        await roomCollection.updateOne(
          { _id: new ObjectId(roomData.roomId) },
          {
            $inc: { bookings: 1 },
          },
        );
      }
      res.json(result);
    });
    // All bookings by individual user
    app.get("/rooms/bookings/:userId", verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await bookingCollection.find({ userId: userId }).toArray();
      res.json(result);
    });

    // Updating room data by room owner
    app.patch("/rooms/update/:id", async (req, res) => {
      const { id } = req.params;
      const findData = await roomCollection.findOne({ _id: new ObjectId(id) });
      const newData = req.body;
      const updatedData = {
        $set: {
          name: newData.name,
          image: newData.image,
          rate: newData.rate,
          floor: newData.floor,
          capacity: newData.capacity,
          description: newData.description,
          amenities: newData.amenities,
        },
      };
      const result = await roomCollection.updateOne(findData, updatedData);
      res.json(result);
    });

    // Canceling a booking
    app.patch("/rooms/bookings/cancel/:id", async (req, res) => {
      const { id } = req.params;
      const { date, startTime, endTime } = req.body;
      const findData = await bookingCollection.findOne({
        _id: new ObjectId(id),
        date,
        startTime,
        endTime,
      });
      const updatedData = {
        $set: { status: "Canceled" },
      };
      const result = await bookingCollection.updateOne(findData, updatedData);
      res.json(result);
    });

    // Deleting a room
    app.delete("/rooms/delete/:id", async (req, res) => {
      const { id } = req.params;
      const result = await roomCollection.deleteOne({ _id: new ObjectId(id) });
      if (result.acknowledged) {
        await bookingCollection.deleteOne({ roomId: id });
      }
      res.json(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("DB connected successfully");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is flying on port ${port}`);
});
