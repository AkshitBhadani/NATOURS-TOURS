const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
// JWT token create
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

//user signup
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);

  // const token = signToken(newUser._id);
  // res.status(201).json({
  //     status: 'success',
  //     token,
  //     data:{
  //         users : newUser
  //     }
  // });
});

//user login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check email and password exist
  if (!email || !password) {
    return next(new AppError("please provide email and password!", 400));
  }
  // 2) check if user exist && password cerrect
  const user = await User.findOne({ email }).select("+password");
  // console.log(user);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email and password", 401));
  }

  // 3) if everything ok, send token to client
  createSendToken(user, 200, res);
});

// user logout
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};
//password protect
exports.protect = catchAsync(async (req, res, next) => {
  // console.log('reque==headers=', req.headers);
  // console.log('reque==body=', req.body);
  // console.log("reque==params=", req.cookies);

  // 1) Getting token and check  of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  console.log(token);
  if (!token) {
    return next(
      new AppError("you are not logged in ! please log in to get access.", 401)
    );
  }

  // 2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //  console.log(decoded);

  // 3) check if user still exist

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token dose no longer exist.",
        401
      )
    );
  }

  // 4) check if user chenged password after the jwt was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("user recently chnaged password! please login again, ", 401)
    );
  }

  // grant access to protected route

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//only for rendered pages np errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1)verify tokem
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) check if user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) check if user chenged password after the jwt was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
// not all exess
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles['admin','lead-guide'].role ='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("you do not have permission to perform this action", 403)
      );
    }
    if (!userHasPermission(req.user)) {
      const error = new Error(
        "You do not have permission to perform this action"
      );
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

//forgot password to send mail in user
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }
  // 2) Generate the rendom reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
    // console.error('Error sending email:', error);
  }
});

//user reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log("reqeu---", req);
  // 1) GEt user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user

  // 4) log hte user in, send JWT
  createSendToken(user, 200, res);
});

// user password update
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed  current password is currect
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) log user in send JWT
  createSendToken(user, 200, res);
});
