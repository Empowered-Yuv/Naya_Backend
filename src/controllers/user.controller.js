import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { UploadStream } from "cloudinary"



const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({
            validateBeforeSave: false
        })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // pehle project se dekhna

    const { username, email, fullname, password } = req.body

    //console.log("email:", email);


    // validation - not empty
    // if (fullname === "") {
    //     throw new ApiError(400, "fullname is required")
    // }

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "") // naaya method to check everyfield
    ) {
        throw new ApiError(400, "All fields are required")
    }
    //email validation

    if (email.includes("@") === false) {
        throw new ApiError(400, "Invalid email id")
    }


    //console.log(req.files);
    // check if user already exists: check username aur email 

    // const existedUsername = User.findOne({
    //     username
    // })

    // if (existedUsername) {
    //     throw new ApiError(409, "Username existed Please choose different username")
    // }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }


    // check for images, check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path

    // agar coverImage nhi bhejte hai toh error aata hai const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    // upload them to cloudinary, avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    



    // create user object - create entry in db

     const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // remove password and refresh token field from res


    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }


    // return res

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


} )


const loginUser = asyncHandler( async (req, res) => {
    //req body ---> data
    const {email, username, password} = req.body

    // username or email
    if (!(username || email)) {
        throw new ApiError(400, "usernname or email is required")
    }

    // find the user
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User doesnt exist!")
    }


    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "Invalid user credentials")
    }


    // access token or refresh token generate

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)


    // send cookies

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    const options = {
        httpOnly: true,
        secure: true
    }
    // when we add options cookes r modifiable at server only not for any frontend user


    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Loggin In Successfully"
        )
    )



})


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})


// kb refresh krenge
const refreshAccessToken = asyncHandler( async (req, res) => {
    try {
        const incomigRefreshToken = req.cookies.refreshToken ||req.body.refreshToken
    
        if (!incomigRefreshToken) {
            throw new ApiError(401, "Unauthorized Request")
        }
    
    
    
        const decodedToken = jwt.verify(
            incomigRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomigRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refrshToken")
    }
})

const changeCurrentPassword = asyncHandler ( async (req, res) => {
    const { oldPassword, newPassword } = req.body


    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Inavalid old Password")
    }

    user.password = newPassword

    await user.save({
        validateBefore: false
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {

        }, "Password changed successfully")
    )

} )


const getCurrentUser = asyncHandler ( async(req, res) => {
    return res.status(200)
    .json(200, req.user, "Current User fetched Successfully")
} )

const updateAccountDetails = asyncHandler( async(req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true } //update hone ke baad save hoti hai
        ).select("-password")



        return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Account Details Updated Successfully"
        )
        )
} )

const updateUserAvatar = asyncHandler( async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)


    if (!avatar.url) {
       throw new ApiError( 400, "Errror while uploading on avatar") 
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:  {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")


    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            user,
            "Avatar Image Updated Successfully"
        )
    )
} )



const updateUserCoverImage = asyncHandler( async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "CoverImage file is missing")
    }


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if (!coverImage.url) {
       throw new ApiError( 400, "Errror while uploading on avatar") 
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:  {
               coverImage:coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")


    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            user,
            "Cover Image Updated Successfully"
        )
    )
} )


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}