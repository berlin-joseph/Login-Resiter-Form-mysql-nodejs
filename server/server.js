const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const db = require("./config/db");
const path = require("path");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");

//
dotenv.config({ path: path.join(__dirname, ".", "config", "config.env") });

//
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

//
app.use(
  session({
    key: "id",
    secret: "Learning",
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 60 * 60 * 24 },
  })
);
//
db;

//

// Check if user exists
async function userExist(email) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM Employee_login WHERE email = ?",
      [email],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results.length > 0);
        }
      }
    );
  });
}

//Register User
app.post("/register", async (req, res) => {
  const firstName = req.body.first_name;
  const lastName = req.body.last_name;
  const email = req.body.email;
  const password = req.body.password;
  try {
    // Check if user exists
    const userAlreadyExists = await userExist(email);
    if (userAlreadyExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const sql =
      "INSERT INTO Employee_login (first_name, last_name, email, password) VALUES (?,?,?,?)";

    db.query(sql, [firstName, lastName, email, hashedPassword], (err, data) => {
      if (err) {
        return res
          .status(400)
          .json({ success: false, message: "Error registering user" });
      } else {
        return res.status(201).json({
          success: true,
          message: "User registered successfully",
          data: data,
        });
      }
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const query = "SELECT * FROM Employee_login WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      res.status(500).json({ success: false, Error: err });
    } else {
      if (results.length === 0) {
        res.status(401).json({ message: "User not found" });
      } else {
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          // Create a JWT token
          const token = jwt.sign({ userId: user.id }, "hi all", {
            expiresIn: "1h",
          });

          // insert jwt_tokens
          const sql = "UPDATE Employee_login SET jwt_tokens = ? WHERE id = ?";
          db.query(sql, [token, user.id], (err) => {
            if (err) {
              res.status(500).json({ success: false, Error: err });
            } else {
              res.status(200).json({ message: "Login successful", token });
            }
          });
        } else {
          res.status(401).json({ message: "Invalid Password" });
        }
      }
    }
  });
});

//
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
