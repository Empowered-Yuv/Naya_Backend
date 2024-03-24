import { Router } from 'express'
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller.js'

import { upload } from '../middlewares/multer.middleware.js'

import { verifyJWT } from '../middlewares/auth.middleware.js'

//{ sample } tb use krte hai jb export default use nhi hota hai



const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 2
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT, logoutUser)

//router.route("/logout").post(verifyJWT, anothermiddle wares logoutUser)


export default router