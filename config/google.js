const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const { PORT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_ENDPOINT } = require("./vars");

passport.use(
    new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `http://localhost:${PORT}${GOOGLE_CALLBACK_ENDPOINT}`,
        passReqToCallback: true,
    },
        (req, accessToken, refreshToken, profile, done) => {
            console.log("accessToken", accessToken);
            return done(undefined, profile);
        }),
);

passport.serializeUser((user, done) => {
    done(undefined, user);
});

passport.deserializeUser((user, done) => {
    done(undefined, user);
});