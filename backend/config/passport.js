
const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(options, (payload, done) => {
    try {
      if (!payload.userId) {
        return done(null, false);
      }

      return done(null, {
        userId: payload.userId,
      });
    } catch (error) {
      return done(error, false);
    }
  })
);

module.exports = passport;