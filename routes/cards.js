const express = require("express")
const { Card, validateCard, generateBizNum } = require("../model/cards")
const authMW = require("../middleware/auth")

const cardsRouter = express.Router()

cardsRouter.get("/", async (req, res) => {
    const array = await Card.find({})
    if (array.length === 0) {
        res.status(400).send("Database doesn't contain cards")
        return
    }
    res.json(array)

})


cardsRouter.get("/my-cards", authMW, async (req, res) => {
    const array = await Card.find({ user_id: req.user._id })

    if (array.length === 0) {
        res.status(400).send("This user doesn't have Cards in Database")
        return
    }
    res.json(array)

})

cardsRouter.get("/:id", async (req, res) => {
    const card = await Card.findOne({ _id: req.params.id })
    if (!card) {
        res.status(400).send("Card Not Found in Database")
        return
    }
    res.json(card)

})


cardsRouter.post("/", authMW, async (req, res) => {

    //validate input
    const { error } = validateCard(req.body)
    if (error) {
        res.status(400).send(error.details[0].message)
        return
    }

    //validate system
    const isBusiness = req.user.isBusiness
    if (!isBusiness) {
        res.status(400).send("Only Business user can make this request")
        return
    }

    //process
    const card = await new Card({
        ...req.body,
        user_id: req.user._id,
        bizNumber: await generateBizNum()
    })
    await card.save()
    //response
    res.json(card)

})

cardsRouter.put("/:id", authMW, async (req, res) => {

    const { error } = validateCard(req.body)
    if (error) {
        res.status(400).send(error.details[0].message)
        return
    }

    const card = await Card.findOneAndUpdate({ _id: req.params.id, user_id: req.user._id }, req.body, {
        new: true,

    })
    if (!card) {
        res.status(400).send("Card Not Found in Database or User Not authorized")
        return
    }
    res.json(card)

})

cardsRouter.patch("/:id", authMW, async (req, res) => {


    let card = await Card.findOne({ _id: req.params.id })
    if (!card) {
        res.status(400).send("Card Not Found in Database ")
        return
    }

    const IdInArray = card.likes.find((id) => id == req.user._id)
    if (!IdInArray) {
        card.likes.push(req.user._id)
        res.json(card)
        return
    }
    card.likes.filter((id) => id !== req.user._id)
    res.json(card)

})


module.exports = cardsRouter