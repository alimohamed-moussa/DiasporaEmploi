//Creation et transmission de token et sauvegarde dans un cookie
const sendToken = (user, statusCode, res) => {
  //Creation d'un JWT token
  const token = user.getJwtToken();

  //Options pour un cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // if (process.env.NODE_ENV === "production") {
  //  options.secure = true;
  //}

  //Setup the cookie and send response
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};

module.exports = sendToken;
