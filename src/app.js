import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb";
import joi from "joi"
import dotenv from "dotenv";
import dayjs from "dayjs";

const app = express()

app.use(cors())
app.use(express.json())
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
    .then(() => db = mongoClient.db("batepapouol"))
    .catch((err) => console.log(err.message));

app.post("/participants", async (req, res) => {
    const { name } = req.body
    if (!name) {
        return res.sendStatus(422)
    }
    const nameSchema = joi.object({
        name: joi.string().required()
    })
    const validate = nameSchema.validate(req.body)
    if (validate.error) return res.sendStatus(422)

    try {
        const nameExists = await db.collection("participants").findOne({ name: name })
        if (nameExists) return res.sendStatus(409)
        await db.collection("participants").insertOne({ name, lastStatus: Date.now() })
        await db.collection("messages").insertOne(
            { from: name, to: 'Todos', text: "entra na sala...", type: 'status', time: dayjs().format('HH:mm:ss') }
        )

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }

})

app.get("/participants", async (req, res) => {
    try {
        const participant = await db.collection("participants").find().toArray()
        res.send(participant)
    } catch (err) {
        res.sendStatus(422)
    }
})

app.post("/messages", async (req, res) => {
    const { to, text, type } = req.body

    if (!to || !text || !type) {
        return res.sendStatus(422)
    }

    const { from } = req.headers.user
    const messagesSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.valid('message, private_message').required
    })

    try {
        const participantExists = await db.collection("participants").findOne({ name: from })
        if (!participantExists) {
            res.sendStatus(422)
        }
        await db.collection("messages").insertOne({ from, to, text, type, })
        res.send(message)
    } catch (err) {
        res.sendStatus(500)
    }
}
)

app.get("/messages", async (req, res) => {
    try {
        const messages = await db.collection("messages").find().toArray()
        res.send(messages)
    } catch (err) {
        res.status(500).send(err.message)
    }

})


const PORT = 5000
app.listen(PORT, () => console.log(`servidor rodando na porta ${PORT}`))