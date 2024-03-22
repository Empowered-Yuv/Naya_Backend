//require('dotenv').config({path: './env'})
//above line brings inconsistency


import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js'


dotenv.config({
    path: './env'
})

connectDB()
.then(() => {

    app.on('error', (error) => {
        console.log("ERR: ", error);
        throw error
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server running on port number : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO DB connection failed !!!", err);
})




/*
first approach

import express from 'express'
const app = express()

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on('error', (error) => {
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