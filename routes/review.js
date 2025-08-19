const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const {validateReview,isLoggedIn ,isRevirwAuthor} = require("../middleware.js")

const reviewController = require("../controllers/reviews.js");

//Review router[POST route]
router.post("/",isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

//Review router[POST  delete route]
    router.delete("/:reviewId",isRevirwAuthor, isLoggedIn,wrapAsync(reviewController.destroyReview));

    module.exports = router;