

require("dotenv/config");
const PORT = 8009

const express = require("express")
const mongoose = require("mongoose")

const { initialusers } = require("./seedData/initialusers")
const { initialCards } = require("./seedData/initialCards")
const app = express()
app.use(express.json())
app.use(require("morgan")("dev"))

app.use("/users", require("./routes/users"))
app.use("/cards", require("./routes/cards"))



connect()
async function connect() {


    try {
        await mongoose.connect(process.env.ENVIROMENT === "development" ? process.env.CONNECTION_STRING_COMPASS : process.env.CONNECTION_STRING_ATLAS)
        console.log("connected to db");
        app.listen(PORT, () => {
            try {

                console.log(`listening on port :${PORT}`)
            }
            catch (error) {
                console.log(error.message)
            }

        })

    }
    catch (error) {
        console.log("failed connecting to db", error.message)
    }
}



