const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const fileUpload = require('express-fileupload');
const expressip = require('express-ip');
const app = express();

const limiter = rateLimit(
    {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
        message:
            {
                status: 403,
                success: false,
                message: "Too many request from this IP, DDoS is bad 😈 ..."
            },
    }
);

app.use(limiter);

app.use(expressip().getIpInfoMiddleware);
app.use(helmet());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "20mb" }));
app.use(cors());
app.options("*", cors());
app.use(fileUpload());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "PUT, PATCH, POST, GET, DELETE, OPTIONS");
    next();
});

module.exports = app;