import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"



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
    if (!username || !email) {
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


const logoutUser = asyncHandler( async(req, res) => {
    //clear ur cookies
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
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
    .clearcookie(accessToken)
    .clearcookie(refreshToken)
    .json(
        new ApiResponse(
            200,
            {

            },
            "User Logged Out Successfully"
        )
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser
}