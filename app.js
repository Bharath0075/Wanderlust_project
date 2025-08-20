const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const multer = require("multer");

// File uploads (for local testing — use cloud storage in production)
const upload = multer({ dest: "uploads/" });

// Routers
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const usersRouter = require("./routes/user.js");

// ✅ Database URL
const dbUrl = process.env.ATLASDB_URL;

// ✅ Database Connection
async function connectDB() {
  if (!dbUrl) {
    console.error("❌ ATLASDB_URL environment variable is not set. Please check your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true, // for MongoDB Atlas
    });
    console.log("✅ Database connected successfully!");
  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  }
}
connectDB();

// ✅ View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

// ✅ Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// ✅ Session store
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600,
});

const sessionOptions = {
  store,
  secret: process.env.SECRET || "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// ✅ Passport Auth
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ✅ Flash + Current User middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ===================== ROUTES ===================== //

// ✅ Redirect root ("/") → listings
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// ✅ Optional: custom homepage
app.get("/home", (req, res) => {
  res.render("home"); // create views/home.ejs
});

// ✅ Listings routes
app.use("/listings", listingsRouter);

// ✅ Reviews routes (nested under listings)
app.use("/listings/:id/reviews", reviewsRouter);

// ✅ User routes
app.use("/", usersRouter);

// Middleware
// 404 Middleware
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// ===================== START SERVER ===================== //
app.listen(8080, () => {
  console.log("🚀 Server is running on port 8080");
});
