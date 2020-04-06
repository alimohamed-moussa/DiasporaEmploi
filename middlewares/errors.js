const errorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      errMessage: err.message,
      stack: err.stack
    });
  }

  if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    error.message = err.message;

    //Wrong Mongoose Object ID Error

    if (err.name === "CastError") {
      const message = `Resource not found. Invalid: ${err.path}`;
      error = new errorHandler(message, 404);
    }

    //Handling Mongoose Validation Error
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map(value => value.message);
      error = new errorHandler(message, 400);
    }

    //Handle mongoose duplicate key error
    if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
      error = new errorHandler(message, 400);
    }

    //Handling Wrong JWT Token Error
    if (err.name === "JsonWebTokenError") {
      const message = "JWT token n'est pas valide.";
      error = new errorHandler(message, 500);
    }

    //Handling Expired JWT token Error
    if (err.name === "TokenExpiredError") {
      const message = "JSON Web Token est expiré.";
      error = new errorHandler(message, 500);
    }

    res.status(error.statusCode).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};
