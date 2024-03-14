const Review = require("./../models/reviewModel");
// const catchAsync = require('./../utils/catchAsync');
const factory = require("./handlerFactory");

//get all reviews list
exports.getAllReviews = factory.getAll(Review);
// exports.getAllReviews = catchAsync(async(req,res,next)=>{
//     let filter = {};
//     if(req.params.tourId) filter = {tour:req.params.tourId};

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status:'success',
//         results:require.length,
//         Data:{
//             reviews
//         }
//     });
// });

//user and tour id set in reviews
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// new review create
// exports.createReview = catchAsync(async(req,res,next)=>{
//     const newReview = await Review.create(req.body);

//     res.status(200).json({
//         status:'success',
//         Data:{
//             review :newReview
//         }
//     });
// })
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updatereview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
