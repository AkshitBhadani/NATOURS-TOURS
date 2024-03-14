const AppEroor = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}:${err.value}.`;
  return new AppEroor(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value : ${value}.Please use another value!`;
  return new AppEroor(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppEroor("invalid token. please login again!", 401);

const handleJWTExpiredError = () =>
  new AppEroor("your token has expired! please login again.", 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // B) RENDERED WEBSITE
  console.error("ERROR🎇", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    // a) operational,trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // b) programming or other unkonwn error:don't leak error details
    // 1) log error
    console.error("ERROR🎇", err);

    // 2) send generic message
    return res.status(500).json({
      status: "error",
      message: "something went very wrong!",
    });
  }

  // B) RENDERED WEBSITE
  // a) operational,trusted error: send message to client
  if (err.isOperational) {
    console.log(err.message);
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
  // b)programming or other unkonwn error:don't leak error details
  // 1) log error
  console.error("ERROR🎇", err);
  // 2) send generic message
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: "Please try again later.",
  });
};

module.exports = (err, req, res, next) => {
  // console.log (err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "jsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    console.log(err.message);
    console.log(error.message);
    sendErrorProd(error, req, res);
  }
};
