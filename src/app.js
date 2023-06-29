import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb";
import joi from "joi"
import dotenv from "dotenv";

const app = express()

app.use(cors())
app.use(express.json())
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message));

app.post("/participants", async (req, res) => {
    const { name, lastStatus } = req.body

    try {
        const participant = await db.collection("participants").insertOne({ name: name, lastStatus: Date.now() })
        if (participant) return res.sendStatus(409)

        await db.collection("messages").insertOne({ from: name, to: 'Todos', text: "entra na sala...", type: 'status' })
        res.sendStatus(201)
    } catch (err) {
        res.status(409).send(err.message)
    }

})

app.get("/participants", async (req, res) => {
    try {
        const participant = db.collection("participant").find({}).toArray()
        res.send(participant)
    } catch (err) {
        res.sendStatus(500)
    }
})

// app.post("/messages", (req, res) => {
//     const { to, text, type } = req.body
//     const promisse = db.collection("message").insertOne({ to, text, type })
//     promisse.then(names => res.send(names))
//     promisse.catch(err => res.status())

// })
// app.get("/messages", (req, res) => {
//     const promisse = db.collection("messages").find().toArray()
//     promisse.then(names => res.send(names))
//     promisse.catch(err => res.status())

// })


const PORT = 5000
app.listen(PORT, () => console.log(`servidor rodando na porta ${PORT}`))