//require('dotenv').config({path: './env'})
//above line brings inconsistency


import dotenv from 'dotenv'
import connectDB from "./db/index.js";


dotenv.config({
    path: './env'
})

connectDB()




/*
first approach

import express from 'express'
const app = express()

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on('error', () => {
            console.log("ERR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on the port ${process.env.PORT}`);
        })
    } catch (error) {
     console.error("Error: ", error);
     throw error   
    }
})()

*/