const express = require("express");
const app = express();
const filename = "/public/index.html";
const PORT = 8080;
const bodyParser = require("body-parser");
const router = express.Router();
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const url = require("./secret.js");

//Logs
// const { createLogger, format, transports } = require("winston");

// const logLevels = {
//   fatal: 0,
//   error: 1,
//   warn: 2,
//   info: 3,
//   debug: 4,
//   trace: 5,
// };

// const logger = createLogger({
//   levels: logLevels,
//   format: format.combine(format.timestamp(), format.json()),
//   defaultMeta: {
//     service: "MongoDB data manipulation",
//   },
//   exceptionHandlers: [new transports.File({ filename: "exceptions.log" })],
//   rejectionHandlers: [new transports.File({ filename: "rejections.log" })],
//   transports: [new transports.File({ level: "info",filename: "file.log" })]
// });

// logger.info("System launch");
// // logger.fatal("A critical failure!");
// // logger.debug("Diagnostic information:");
// // logger.error("Error!");
// // logger.warn("Undesired or Unusual Run-time conditions");
// // logger.trace("Complete log information");
const { format, createLogger, transports } = require("winston");
const { timestamp, combine, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  format: combine(
    format.colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.File({ filename: "file.log" }),
    new transports.Console(),
  ],
  exceptionHandlers: [new transports.File({ filename: "exceptions.log" })],
  rejectionHandlers: [new transports.File({ filename: "rejections.log" })],
});

//middleware funcitons...
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());

MongoClient.connect(url, (err, db) => {
  if (err) throw err;
  //console.log("connected to Mongodb server");
  logger.info("connected to Mongodb atlas!");
  db.close();
});

const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const emptyValueChecker = function (str) {
  if (typeof str === "string" && str.trim().length === 0) {
    return false;
  } else {
    return true;
  }
};

client.connect((err) => {
  const myDb = client.db("people").collection("friends");

  app.get("/user/:name", (req, res) => {
    const userName = req.body.name;
    // console.log(userName);
    const checking = emptyValueChecker(userName);
    // console.log(checking);
    let boolen = true;
    if (checking) {
      //console.log(req.params);
      myDb
        .find(req.params)
        .toArray()
        .then((results) => {
          // console.log(results);
          res.send(JSON.stringify(results));
          logger.info("Response for finding of user details sent!");
        });
    } else {
      console.log("entered else part");
      res.send({ status: boolen });
    }
  });

  app
    .route("/users")
    .get((req, res) => {
      myDb
        .find()
        .toArray()
        .then((results) => {
          // console.log(results);
          res.send(JSON.stringify(results));
        });
      logger.info("Response for list of users sent!");
    })

    .post((req, res) => {
      //console.log(req.body);

      const userName = req.body.name;
      // console.log(userName);
      const checking = emptyValueChecker(userName);
      // console.log(checking);
      let boolen = true;
      if (checking) {
        myDb.insertOne(req.body).then((results) => {
          //  console.log(results);
          res.contentType("application/json");
          res.send(JSON.stringify(req.body));
          boolen: false;
        });
        logger.info(`Response for creation of user:${req.body} details sent!`);
      } else {
        console.log("entered else part");
        res.send({ status: boolen });
      }
    })
    .put((req, res) => {
      // console.log(req.body);

      const userName = req.body.name;
      // console.log(userName);
      const checking = emptyValueChecker(userName);
      // console.log(checking);
      let boolen = true;
      if (checking) {
        logger.warn(
          `Data Modificaion of user: ${req.body.name} with id: ${req.body._id} is been initiated`
        );

        myDb
          .findOneAndUpdate(
            {
              _id: ObjectId(req.body._id),
            },
            {
              $set: { name: req.body.name },
            },
            { upsert: false }
          )
          .then((results) => {
            // console.log(results);
            res.send(JSON.stringify(results));
            boolen: false;
            logger.info(
              `Response for updation of user: ${req.body.name} with id: ${req.body._id} details is been sent!`
            );
          });
      } else {
        console.log("entered else part");
        res.send({ status: boolen });
      }
    })
    .delete((req, res) => {
      logger.warn(
        `Deletion of user: ${req.body.name} with id: ${req.body._id} is been initiated`
      );

      myDb
        .deleteOne({
          _id: ObjectId(req.body._id),
        })
        .then((results) => {
          //  console.log(results);
          let boo = true;
          if (results.deletedCount === 0) {
            boo: false;
          }
          res.send({ status: boo });
          logger.info(
            `Response for deletion of user: ${req.body.name} with id: ${req.body._id} details sent!`
          );
        })
        .catch((error) => console.log(error));
    });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + filename);
  logger.info("Homepage loaded!");
});

app.listen(PORT, function (error) {
  if (error) throw error;
  // console.log("Server running successfully on PORT : ", PORT)
  logger.info(`Server running successfully on PORT : ${PORT}`);
});

module.exports = { emptyValueChecker };
