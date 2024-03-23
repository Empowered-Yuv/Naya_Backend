import { Router } from 'express'
import { registerUser } from '../controllers/user.controller.js'

import { upload } from '../middlewares/multer.middleware.js'

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



export default router