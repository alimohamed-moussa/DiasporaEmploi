const express = require("express");
const app = express();

const dotenv = require("dotenv");

const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const bodyParser = require("body-parser");

//Import de la configuration de la base de données
const connectDatabase = require("./config/database");
//Erreur middleware
const errorMiddleware = require("./middlewares/errors");

const errorHandler = require("./utils/errorHandler");

//Configurations des variables d'environements
dotenv.config({ path: "./config/config.env" });

//Gestion des "Uncaught Exception"
process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err.message}`);
  console.log("Shutting down the server due to uncaught exception.");

  process.exit(1);
});

//Connextion à la base de données
connectDatabase();

//Setup security headers
app.use(helmet());

//Configurations de bodyParser
app.use(bodyParser.urlencoded({ extended: true }));

//Configurations du répertoire public
app.use(express.static("public"));

//Configurations de bodyParser
app.use(express.json());

//configuration de cookieParser
app.use(cookieParser());

//Configurations file upload
app.use(fileUpload());

//Sanitize data
app.use(mongoSanitize());

//Prevention des attaques de type xss
app.use(xssClean());

//Prevent parameters pollution
app.use(hpp());

//Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 minutes
  max: 100,
});

app.use(limiter);

//Setup CORS - Accessible by other domains
app.use(cors());

//Import des routes
const jobs = require("./routes/jobs");
const auth = require("./routes/auth");
const user = require("./routes/user");

//Montage des routes
app.use("/api/v1", jobs);
app.use("/api/v1", auth);
app.use("/api/v1", user);

//Missing routes error handling
app.all("*", (req, res, next) => {
  next(new errorHandler(`${req.originalUrl} route not found`, 404));
});

//ErrorMiddleware
app.use(errorMiddleware);

//Configuration du port
const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
  console.log(
    `Server is listen on ${process.env.PORT} in ${process.env.NODE_ENV} mode.`
  );
});

//Gestion des Promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`ERROR: ${err.message}`);
  console.log("Shutting down the server due to Unhandled promise rejection.");

  server.close(() => process.exit(1));
});
