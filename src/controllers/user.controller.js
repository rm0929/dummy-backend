import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}



// register user
const registerUser = asyncHandler(async(req, res) => {
    // get user details from frontend
    // validation (email, fullname ,etc/ not empty )
    // check if user already exist: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avtar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const { fullName, email, username, password } = req.body
        //console.log("email:", email);

    //validation
    // checking individual conditions one by one
    // if (fullName ===""){
    //     throw new ApiError(400, "fullname is required") 
    // }

    // checking all conditions in one if using "some" keyword.
    if (
        [fullName, email, username, password].some((field) => field && field.trim() === "") // some is used to check multiple conditions, and it returns true or false. 
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // write more validations 

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // optional chaining not working

    // Alternative code
    const avatarLocalPath = req.files && req.files.avatar && req.files.avatar[0] && req.files.avatar[0].path;
    //console.log(avatarLocalPath);
    //const coverImageLocalPath = req.files && req.files.coverImage && req.files.coverImage[0] && req.files.coverImage[0].path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    //check avatar local path is recieved or not
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
        // check whether avatar is uploaded
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        // coverImage: coverImage?.url || "",
        coverImage: (coverImage && coverImage.url) || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // remove the field that is not required
    )

    if (!createdUser) { // server side error
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered succcessfully")
    )
})


// login user
const loginUser = asyncHandler(async(req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body

    if (!(username || email)) { //login using either username or email
        throw new ApiError(400, "Username or password is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    // if we dont get user despite findOne, it means there was never that user..
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    //if user exist, check password
    const isPasswordValid = await user.
    isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // if password is valid, make user access and refresh token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // optional step
    const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    //send cookies
    const options = {
        httpOnly: true, //by default anyone can modify cookies at frontend, but these opitons can make these modifiable from server end only
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in Successfully"
            )
        )

})


// logout
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, {
            $set: {
                refreshToken: undefined
            },
        }, {
            new: true // returned response will have the new updated value
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
        .json(new ApiResponse(200, {}, "User logged out"))

})

export { registerUser, loginUser, logoutUser }