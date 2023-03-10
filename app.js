const { BLACKLIST } = require("./config/vars");
const app = require("./config/express");
const logger = require("./config/logger");

const routerUtils = require("./utils/routerUtils");
const responseUtils = require("./utils/apiResponseUtils");
const securityUtils = require("./utils/securityUtils");

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
    responseUtils.successResponse(res, req, 200, {
        message: "Welcome to the API",
        origin: "https://github.com/nexus9111/nodejs_boilerplate_rest_api.git"
    });
});

// easter egg
app.get("/easter-egg", (req, res) => {
    responseUtils.successResponse(res, req, 418, {
        message: "Congratulations! You've stumbled upon a secret path in the API. Take a break from your usual requests and enjoy this little Easter egg. May your code be filled with joy and your bugs be minimal.",
        website: "https://www.joss-coupet.eu/",
        statusCodeOrigin: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418"
    });
});

const routes = [
    { path: "/auth", router: require("./router/authRouter"), authguard: false },
    { path: "/blogs", router: require("./router/blogRouter"), authguard: false },
    { path: "/profiles", router: require("./router/profileRouter"), authguard: true },
    { path: "/auth-provider", router: require("./router/authProviderRouter"), authguard: false },
];

for (const route of routes) {
    if (route.authguard) {
        app.use(route.path, securityUtils.authenticate , route.router);
    }
    app.use(route.path, route.router);
    logger.info("Route loaded", { "path": route.path });
}

app.use((error, req, res, next) => {
    statusCode = req.statusCode || 500;
    if (statusCode === 500) {
        /* istanbul ignore next */
        logger.error(error.toString());
    }
    res.header("Location", routerUtils.getFullUrl(res));
    res.status(statusCode).json({
        "success": false,
        "data": {
            "message": error.toString()
        }
    });
});

module.exports = app;