const { BLACKLIST } = require('./config/vars');
const app = require("./config/express");
const logger = require('./config/logger');

const routerUtils = require("./utils/routerUtils");

app.all("*", function (req, res, next) {
    try {
        let ipAddress = req.ipInfo.ip.slice(0, 7) === "::ffff:" ? req.ipInfo.ip.slice(7) : req.ipInfo.ip;
        if (!BLACKLIST.includes(ipAddress)) {
            req.ipAddress = ipAddress;
            routerUtils.log(req);
            next();
        } else {
            req.statusCode = 403;
            throw new Error(ipAddress + " IP is not in whiteList");
        }
    } catch (error) {
        next(error);

    }
});

app.get("/", (req, res) => {
    res.status(200).json({
        "success": true,
        "data": {
            "message": "Welcome to the API",
            "origin": "https://github.com/nexus9111/nodejs_boilerplate_rest_api.git"
        }
    });
});

// easter egg
app.get("/easter-egg", (req, res) => {
    res.status(418).json({
        "success": true,
        "data": {
            "message": "Congratulations! You've stumbled upon a secret path in the API. Take a break from your usual requests and enjoy this little Easter egg. May your code be filled with joy and your bugs be minimal.",
            "website": "https://www.joss-coupet.eu/",
            "origin": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418"
        }
    });
});

const routes = [
    { path: "/users", router: require("./router/authRouter") },
    { path: "/blogs", router: require("./router/blogRouter") }
]

routes.forEach(route => {
    app.use(route.path, route.router);
});

app.use((error, req, res, next) => {
    statusCode = req.statusCode || 500;
    if (statusCode === 500) {
        logger.error(error.toString());
    }
    res.status(statusCode).json({
        "success": false,
        "data": {
            "message": error.toString()
        }
    });
});

module.exports = app;