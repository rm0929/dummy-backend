class APIError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message) //constructor overriding
        this.statusCode = statusCode
        this.date = null
        this.message = message
        this.success = false
        this.errors = errors

        //to check error stack trace
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }


    }
}

export { APIError }