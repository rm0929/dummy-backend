import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";


const router = Router()
router.route("/register").post( //post call since the user has to send/upload the data.
    upload.fields([ //injecting a middleware to check the files uploaded by the user
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser) //middleware verifyJFT while logout
router.route("/refresh-token").post(refreshAccessToken)

export default router;