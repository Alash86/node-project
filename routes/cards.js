const express = require("express")

const cardsRouter = express.Router()

cardsRouter.get("/hii", (req, res) => {
    res.send("bye")
})



module.exports = cardsRouter