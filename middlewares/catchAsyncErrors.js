module.exports = (func) => (req, res, next) => {
  //https://expressjs.com/en/guide/error-handling.html
  Promise.resolve(func(req, res, next)).catch(next);
};
