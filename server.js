// =======================
// get the packages we need
// =======================
var uniqid = require("uniqid");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var morgan = require("morgan");
var mongoose = require("mongoose");
var cors = require("cors");
var cookieParser = require("cookie-parser");

var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
var config = require("./config"); // get our config file
var Session = require("./app/models/session"); // get our mongoose model
var User = require("./app/models/user"); // get our mongoose model

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set("superSecret", config.secret); // secret variable

// cookieParser and cors
app.use(cors({ origin: "http://35.247.140.17:2015", credentials: true }));
app.use(cookieParser());

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan("dev"));

// =======================
// routes
// =======================
// basic route
app.get("/", function(req, res) {
  res.send("Hello! The API is at http://127.0.0.1:" + port + "/api");
});

// API ROUTES -------------------
// we'll get to these in a second
app.post("/setup", function(req, res) {
  var password =
    req.body.password || req.query.password || req.headers["x-access-password"];
  var email =
    req.body.email || req.query.email || req.headers["x-access-email"];
  var organisation =
    req.body.organisation ||
    req.query.organisation ||
    req.headers["x-access-organisation"];
  if (!email) {
    res.json({
      success: false,
      message: "User creation failed. Email not found."
    });
  } else if (!password) {
    res.json({
      success: false,
      message: "User creation failed. Password not found."
    });
  } else if (!organisation) {
    res.json({
      success: false,
      message: "User creation failed. Organisation not found."
    });
  } else {
    // create a sample user
    var asep = new User({
      email,
      password,
      admin: true,
      organisation
    });
    // save the sample user
    asep.save(function(err) {
      if (err) {
        return res.status(200).json({ success: false, message: err.message });
      }

      res.json({ success: true });
    });
  }
});

// get an instance of the router for api routes
var apiRoutes = express.Router();

var validateToken = async function({ email, deviceId, token }) {
  // verify token
  const session = Session.findOne({ deviceId, email }, function(err, session) {
    if (err) {
      return res.status(200).json({ success: false, message: err.message });
    }

    if (session) {
      var secretKey = session.secret;
      // verifies secret and checks exp
      jwt.verify(token, secretKey, function(err, decoded) {
        if (err) {
          return res.status(200).json({ success: false, message: err.message });
        }
      });
    } else {
      return res.json({
        success: false,
        message: "Failed to authenticate token."
      });
    }
  });

  if (session) return true;
  return false;
};

/**
 * name: /change-password
 * @param email
 * @param password
 * @param token
 * @param deviceId
 */
// route for change password request
apiRoutes.post("/change-password", async function(req, res) {
  // check header or url parameters or post parameters for email, password and token
  var email =
    req.body.email || req.query.email || req.headers["x-access-email"];
  var password =
    req.body.password || req.query.password || req.headers["x-access-password"];
  var newPassword =
    req.body.newPassword ||
    req.query.newPassword ||
    req.headers["x-access-new-password"];
  var token =
    req.body.token || req.query.token || req.headers["x-access-token"];
  var deviceId =
    req.body.deviceId ||
    req.query.deviceId ||
    req.headers["x-access-device-id"];

  if (!email) {
    return res.status(403).send({
      success: false,
      message: "No email provided."
    });
  }
  if (!password) {
    return res.status(403).send({
      success: false,
      message: "No password provided."
    });
  }
  if (!newPassword) {
    return res.status(403).send({
      success: false,
      message: "No password provided."
    });
  }
  if (!token) {
    return res.status(403).send({
      success: false,
      message: "No password provided."
    });
  }
  if (!deviceId) {
    return res.status(403).send({
      success: false,
      message: "No password provided."
    });
  }

  const isValidToken = await validateToken({ email, deviceId, token });

  if (isValidToken) {
    // find the user
    User.findOne({ email }, function(err, user) {
      if (err) {
        return res.status(200).json({ success: false, message: err.message });
      }
      if (!user) {
        res.json({
          success: false,
          message: "Change password request failed. User not found."
        });
      } else if (user) {
        // check if password matches
        if (user.password != password) {
          res.json({
            success: false,
            message: "Change password request failed. Wrong old password."
          });
        } else {
          // if user is found and password is right
          User.updateOne({ email }, { password: newPassword }, function(
            err,
            users
          ) {
            if (err) {
              return res
                .status(200)
                .json({ success: false, message: err.message });
            }

            res.json({
              success: true,
              message: "Password changed successfully"
            });
          });
        }
      }
    });
  }
});

// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)
// TODO: route middleware to verify a token
apiRoutes.post("/authenticate", function(req, res) {
  // find the user
  User.findOne(
    {
      email: req.body.email
    },
    function(err, user) {
      if (err) {
        return res.status(200).json({ success: false, message: err.message });
      }
      if (!user) {
        res.json({
          success: false,
          message: "Authentication failed. User not found."
        });
      } else if (user) {
        // check if password matches
        if (user.password != req.body.password) {
          res.json({
            success: false,
            message: "Authentication failed. Wrong password."
          });
        } else {
          if (!req.body.deviceId) {
            res.json({
              success: false,
              message: "Authentication failed. Device ID not found."
            });
          } else {
            // if user is found and password is right
            // create a token with only our given payload
            // we don't want to pass in the entire user since that has the password
            const payload = {
              admin: user.admin,
              email: user.email
            };
            var secretKey = uniqid();
            // save session to db
            var sess = {
              email: req.body.email,
              deviceId: req.body.deviceId,
              admin: user.admin,
              secret: secretKey
            };
            Session.findOneAndUpdate(
              {
                email: req.body.email,
                deviceId: req.body.deviceId
              },
              sess,
              { upsert: true },
              function(err, res) {
                if (err) throw err;
              }
            );

            var token = jwt.sign(payload, secretKey, {
              expiresIn: 144000 // expires in 24 hours (in ms)
            });

            res.cookie(
              "authentication",
              JSON.stringify({
                email: req.body.email,
                deviceId: req.body.deviceId,
                token
              }),
              {
                maxAge: 86400000,
                path: "/",
                domain: "35.247.140.17"
              }
            );

            // return the information including token as JSON
            res.json({
              success: true,
              message: "Enjoy your token!",
              token: token
            });
          }
        }
      }
    }
  );
});

var verifyToken = function(req, res, callback) {
  // check header or url parameters or post parameters for token
  var token =
    req.body.token || req.query.token || req.headers["x-access-token"];
  var deviceId =
    req.body.deviceId ||
    req.query.deviceId ||
    req.headers["x-access-device-id"];
  var email =
    req.body.email || req.query.email || req.headers["x-access-email"];
  if (!deviceId) {
    return res.status(403).send({
      success: false,
      message: "No Device ID provided."
    });
  }
  if (!email) {
    return res.status(403).send({
      success: false,
      message: "No Email provided."
    });
  }
  if (!token) {
    return res.status(403).send({
      success: false,
      message: "No token provided."
    });
  }
  // get secret key on db
  var sess = Session.findOne({ deviceId: deviceId, email: email }, function(
    err,
    session
  ) {
    if (err) {
      return res.status(200).json({ success: false, message: err.message });
    }

    if (session) {
      var secretKey = session.secret;
      // verifies secret and checks exp
      jwt.verify(token, secretKey, function(err, decoded) {
        if (err) {
          return res.status(200).json({ success: false, message: err.message });
        }
        if (callback) {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          callback();
        } else {
          return res.status(200).send({
            success: true,
            message: ""
          });
        }
      });
    } else {
      return res.json({
        success: false,
        message: "Failed to authenticate token."
      });
    }
  });
};

// route middleware verify a token
apiRoutes.use(function(req, res, next) {
  verifyToken(req, res, next);
});

// route to verify a token
apiRoutes.post("/verify", function(req, res) {
  verifyToken(req, res);
});

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.post("/logout", function(req, res) {
  // check header or url parameters or post parameters for token
  var token =
    req.body.token || req.query.token || req.headers["x-access-token"];
  var deviceId =
    req.body.deviceId ||
    req.query.deviceId ||
    req.headers["x-access-device-id"];
  var email =
    req.body.email || req.query.email || req.headers["x-access-email"];
  // decode token
  if (token && deviceId && email) {
    // remove session key on db
    Session.find({ deviceId: deviceId, email: email })
      .remove()
      .exec(function(err, data) {
        if (err) {
          return res.status(200).json({ success: false, message: err.message });
        }

        return res.status(200).send({
          success: true,
          message: ""
        });
      });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: "No token provided."
    });
  }
});

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get("/", function(req, res) {
  res.json({ message: "Welcome to the coolest API on earth!" });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get("/users", function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

// apply the routes to our application with the prefix /api
app.use("/api", apiRoutes);

// =======================
// start the server
// =======================
app.listen(port);
console.log("Server start at http://127.0.0.1:" + port);
