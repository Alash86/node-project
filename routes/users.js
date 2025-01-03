const express = require("express")
const bcrypt = require("bcrypt")
const _ = require("lodash")
const jwt = require("jsonwebtoken")
const config = require("../config/config");
const authMW = require("../middleware/auth")

const usersRouter = express.Router()
const { User, validateUser, validateLogin, validatEdit } = require("../model/users");
const { array } = require("joi");

usersRouter.post("/", async (req, res) => {
    //validate user input
    const { error } = validateUser(req.body)
    if (error) {
        res.status(400).send(error.details[0].message)
        return
    }

    //validate system
    let user = await User.findOne({ email: req.body.email })
    if (user) {
        res.status(400).send("User is already registerd")
        return
    }
    //process
    user = await new User(req.body)
    user.password = await bcrypt.hash(user.password, 12)
    await user.save()
    //response
    res.json(_.pick(user, ["name", "email", "_id"]))
})

usersRouter.post("/login", async (req, res) => {

    //validate user input
    const { error } = validateLogin(req.body)
    if (error) {
        res.status(400).send(error.details[0].message)
        return
    }

    //validate system
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        res.status(400).send("invalid Email")
        return
    }
    const ValidPass = bcrypt.compare(req.body.password, user.password)
    if (!ValidPass) {
        res.status(400).send("invalid Password")
        return
    }

    //process
    const token = jwt.sign({ _id: user._id, isBusiness: user.isBusiness, isAdmin: user.isAdmin }, config.jwtkey)

    //response
    res.json({ token, })
})

usersRouter.get("/", authMW, async (req, res) => {
    const isAdmin = req.user.isAdmin
    if (!isAdmin) {
        res.status(400).send("access Denied,User is not Admin")
        return
    }

    const Array = await User.find({}, { password: 0 })
    res.json(Array)

})

usersRouter.get("/:id", authMW, async (req, res) => {
    const isAdmin = req.user.isAdmin

    if (!isAdmin && req.user._id !== req.params.id) {
        res.status(400).send("you need to be the Registered User or Admin to make this request")
        return
    }
    const user = await User.findById(req.params.id, { password: 0 })
    if (!user) {
        res.status(400).send("user not in database")
        return
    }
    res.json(user)

})
usersRouter.put("/:id", authMW, async (req, res) => {

    if (req.user._id !== req.params.id) {
        res.status(400).send("you need to be the Registered User to make this request")
        return
    }

    const { error } = validatEdit(req.body)
    if (error) {
        res.status(400).send(error.details[0].message)
        return
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,

    }).select('-password')
    if (!user) {
        res.status(400).send("user not in database")
        return
    }

    res.json(user)
})

usersRouter.patch("/:id", authMW, async (req, res) => {

    if (req.user._id !== req.params.id) {
        res.status(400).send("you need to be the Registered User to make this request")
        return
    }
    let userTofind = await User.findById(req.user._id)
    const updatedIsBusiness = userTofind.isBusiness === true ? false : true


    let user = await User.findByIdAndUpdate(req.params.id, { isBusiness: updatedIsBusiness }, {
        new: true,

    }).select('-password')
    if (!user) {
        res.status(400).send("user not in database")
        return
    }

    res.json(user)
})

usersRouter.delete("/:id", authMW, async (req, res) => {
    const isAdmin = req.user.isAdmin

    if (!isAdmin && req.user._id !== req.params.id) {
        res.status(400).send("you need to be the Registered User or Admin to make this request")
        return
    }
    const user = await User.findOneAndDelete({ _id: req.params.id })
    if (!user) {
        res.status(400).send("user not in database")
        return
    }
    res.json(user)

})








module.exports = usersRouter