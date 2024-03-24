import { Router } from 'express'
import { 
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser, 
    refreshAccessToken, 
    registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage
 } from '../controllers/user.controller.js'

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

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)


//params se le rahe hai isliye colon ke baad hai username
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)



export default router