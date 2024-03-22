import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'//to encrypt password

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,//index is used to enable searching field enable krna hai
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String, //cloudinary url
        required: true,
    },
    coverImage: {
        type: String, //cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String,
    },

}, {
    timestamps: true
})


// userSchema.pre("save", () => {

// }) aise callback nhi likhna


//pre hook to do something beforehand
userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) return next()
    //to encrypt password only when it is first created or updated
    //not everytime

    this.password = bcrypt.hash(this.password, 10)
    //how many times it should be encrypted means 10 rounds
    next()
})


userSchema.methods.isPasswordCorrect = async function(password) {
    //to check password is correct
    return await bcrypt.compare(password, this.password)
}



//we can add as many methods as we want
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        },
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        },
    )
}


export const User = mongoose.model('User', userSchema)

