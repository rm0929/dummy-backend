import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models.user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req, res) => {
    // get user details from frontend
    // validation (email, fullname ,etc/ not empty )
    // check if user already exist: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avtar
    // create user object - create entry in db
    // remove password and referesh token field from response
    // check for user creation
    // return res


    const { fullName, email, username, password } = req.body
    console.log("email:", email);

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

    const existedUser = User.findOne({
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
    const coverImageLocalPath = req.files && req.files.coverImage && req.files.coverImage[0] && req.files.coverImage[0].path;

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
        "-password -refereshToken" // remove the field that is not required
    )

    if (!createdUser) { //server side error
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered succcessfully")
    )
})


export { registerUser }