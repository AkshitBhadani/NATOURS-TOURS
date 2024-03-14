const express = require("express");
const path = require("path");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controller/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const paymentRoute = require("./routes/paymentRoutes");
const viewRouter = require("./routes/viewRoutes");

const app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//  1) global MIDDLEWARES

//serving static files
app.use(express.static(path.join(__dirname, "public")));

// set security HTTP headers
app.use(helmet());

//Devlopment logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 100,
  window: 60 * 60 * 1000,
  message: "Too many requests from this IP,please try agian in an hours!",
});
app.use("/api", limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

//Data snnitization against NoSQL query injection
app.use(mongoSanitize());

//Data snnitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingQuantity",
      "ratingAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

//Test middleware

// app.use((req,res,next)=>{
//     console.log('hello from the middleware..👋');
//     next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});
// app.get('/',(req,res)=>{
//     //res.status(200).send('hello from  the server side!');

//     res.status(200).json({message :'hello from  the server side',app :'Natours'});
// })

// app.post('/',(req,res)=>{
//     res.send('you can post to this endpoint.....')
// })

//  3) ROUTES
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/payments", paymentRoute);

app.all("*", (req, res, next) => {
  // res.status(404).json({
  //     status: 'fail',
  //     message:`can't find ${req.originalUrl} on this server!!`
  // });

  // const err = new Error(`can't find ${req.originalUrl} on this server!!`);
  // err.status ='Fail';
  // err.statusCode=404;
  next(new AppError(`can't find ${req.originalUrl} on this server!!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
