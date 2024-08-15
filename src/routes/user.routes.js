import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";


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

export default router;