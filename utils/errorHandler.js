//ErrorHandler est la classe Enfant du parent Error: une classe d'erreur de JavaScript, qui ne spécifie pas les détails de l'erreur
class ErrorHandler extends Error {
  //Passer notre message d'erreur personnalisé ainsi qu'un status code d'erreur (ex: 404, 400)
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    //Creates a .stack property on targetObject, which when accessed returns a string representing the location in the code at which Error.captureStackTrace() was called.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorHandler;
