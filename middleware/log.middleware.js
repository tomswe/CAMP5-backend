export const log = (req, res, next) => {
    let method = req.method
    let url = req.originalUrl

    console.log(`${req.method} ${url}`)

    next()
}