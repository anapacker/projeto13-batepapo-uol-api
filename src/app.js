import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb";
import Joi from "joi"
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

    const nameSchema = Joi.object({
        name: Joi.string().required()
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

    const from = req.headers.user
    const messagesSchema = Joi.object({
        to: Joi.string().required(),
        type: Joi.string().valid('message', 'private_message').required(),
        text: Joi.string().required()
    })

    const validation = messagesSchema.validate(req.body, { abortEarly: false })
    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message)
        return res.status(422).send(errors)
    }

    try {
        const userExists = await db.collection("participants").findOne({ name: from })
        if (!userExists) {
            return res.sendStatus(422)
        }
        await db.collection("messages").insertOne({ from, to, text, type, time: dayjs().format('HH:mm:ss') })
        res.sendStatus(201)
    } catch (err) {
        res.sendStatus(500)
    }
})

app.get("/messages", async (req, res) => {
    const limit = parseInt(req.query.limit)
    const { user } = req.headers

    if (limit <= 0 || isNaN(limit) || !user) {
        return res.sendStatus(422)
    }
    try {
        const searchParams = {
            $or: [
                { to: "Todos" },
                { from: "Todos" },
                { to: user },
                { from: user },
                { type: "message" }
            ]
        }

        if (limit) {
            const limitMessages = await db.collection("messages").find(searchParams).limit(limit).toArray()
            res.send(limitMessages)
            return
        }

        const messages = await db.collection("messages").find(searchParams).toArray()
        res.send(messages)
    } catch (err) {
        res.status(500).send(err.message)
    }

})

const PORT = 5000
app.listen(PORT, () => console.log(`servidor rodando na porta ${PORT}`))