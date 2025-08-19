if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require ("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const multer = require("multer");
const upload = multer({ dest: "uploads/"})

const listingsRouter = require("./routes/listing.js")
const reviewsRouter = require("./routes/review.js");
const usersRouter = require("./routes/user.js");

const { applyTimestamps } = require("./models/review.js");

// let URL_Mongo = 'mongodb://127.0.0.1:27017/wanderlust';

const dbUrl = process.env.ATLASTDB_URL;


app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
}

app.set("views engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const store = MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
    secret:process.env.SECRET,
  },
  touchAfter:24*3600,
});

store.on("error",()=>{
  console.log("ERROR in MONGO SESSION STORE",err);
});

const sessionOptions ={
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized:false,
  cookie:{
    expires: Date.now() + 7 * 24 * 60 * 60 *1000,
    maxAge:7 * 24 * 60 * 60 * 1000,
    httpOnly : true,
  },
};


// app.get("/",(req,res)=>{
//     res.send("Project get initializing");
// });




app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());  
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req,res,next)=>{
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  // console.log(res.locals.success);
  next();
})

// app.get("/demouser", async(req,res)=>{
//   let fakeuser = new User({
//     email: "student@gmail.com",
//     username: "rohan",

//   });
//   let registerUser = await User.register(fakeuser,"helloworld");
//   res.send(registerUser);
// })



app.use("/listings",listingsRouter);

app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", usersRouter);


// Listing.findByIdAndDelete("6889d4600d5457c14d71122e").then((res)=>{
//     console.log(res);
// }).catch((err)=>{
//     comsole.log(err);
// });

//Middleware

app.all(/./, (req, res, next) => {
  next(new ExpressError(404,"Page Not Found"));
});

app.use((err, req, res, next)=>{
  let { statusCode = 500, message = "Somthing went wrong!"} = err;
    res.status(statusCode).render("error.ejs",{message});
  //   res.status(statusCode).send(message);
});

app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});