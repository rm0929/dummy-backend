// this middleware will verify whether there is a user or not

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async(req, _, next) => { // no response, so used '_' (production level)
    try {
        // const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
        const token = (req.cookies && req.cookies.accessToken) || (req.header("Authorization") && req.header("Authorization").replace("Bearer", ""));

        // user is found

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            //from here we get the decoded token

        // const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        const user = await User.findById(decodedToken && decodedToken._id).select("-password -refreshToken");


        if (!user) {
            // TODO: frontend discussion
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next()
    } catch (error) {
        // throw new ApiError(401, error?.message || "Invalid access token")
        throw new ApiError(401, (error && error.message) || "Invalid access token");

    }

})