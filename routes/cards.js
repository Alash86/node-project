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
        await card.likes.push(req.user._id)
    }
    else {
        card.likes = card.likes.filter((id) => id !== req.user._id)
    }
    await card.save()
    res.json(card)

})

cardsRouter.delete("/:id", authMW, async (req, res) => {

    const isAdmin = req.user.isAdmin
    const card = await Card.findById(req.params.id)

    if (!isAdmin && card.user_id !== req.user._id) {
        res.status(400).send("you need to be the user who created this or Admin to delete this card")
        return
    }

    if (!card) {
        res.status(400).send("Card Not found in Database to Delete")
        return
    }

    await Card.deleteOne({ _id: req.params.id })

    res.json(card)

})

cardsRouter.patch("/biz/:id", authMW, async (req, res) => {

    const isAdmin = req.user.isAdmin
    const card = await Card.findById(req.params.id)

    if (!isAdmin) {
        res.status(400).send("you need to be  Admin to edit card biz number ")
        return
    }

    if (!card) {
        res.status(400).send("Card Not found in Database to Delete")
        return
    }
    if (card.bizNumber === req.body.bizNumber) {
        res.status(400).send("card biz number already taken")
        return
    }

    card.bizNumber = req.body.bizNumber

    await card.save()
    res.json(card)

})


module.exports = cardsRouter