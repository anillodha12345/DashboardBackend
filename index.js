const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require("./db/User");
const Product = require("./db/Product");

const Jwt = require("jsonwebtoken");
const jwtkey = "e-comm";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  if (user) {
    Jwt.sign({ result }, jwtkey, { expiresIn: "2h" }, (err, token) => {
      if (err) {
        resp.send({
          result: "something went wrong ,please try after sometimes",
        });
      }
      resp.send({ result, auth: token });
    });
  }
});

app.post("/login", async (req, resp) => {
  try {
    if (req.body.password && req.body.email) {
      let user = await User.findOne({
        email: req.body.email,
        password: req.body.password,
      }).select("-password");
      if (user) {
        Jwt.sign ({ user }, jwtkey, { expiresIn: "2h" }, (err, token) => {
          if (err) {
            resp.send({
              result: "something went wrong ,please try after sometimes",
            });
          }
          resp.send({ user, auth: token });
        });
      } else {
        resp.status(404).send({ result: "No User Found" });
      }
    } else {
      resp.status(400).send({ result: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    resp.status(500).send({ error: "An error occurred while logging in" });
  }
});

app.post("/add-product",verifyToken, async (req, resp) => {
  try {
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result);
  } catch (error) {
    console.error("Error adding product:", error);
    resp
      .status(500)
      .send({ error: "An error occurred while adding the product" });
  }
});

app.get("/products",verifyToken, async (req, resp) => {
  try {
    let products = await Product.find();
    if (products.length > 0) {
      resp.send(products);
    } else {
      resp.status(404).send({ result: "No products found" });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    resp
      .status(500)
      .send({ error: "An error occurred while fetching products" });
  }
});

app.delete("/productdelete/:id",verifyToken, async (req, resp) => {
  try {
    const result = await Product.deleteOne({ _id: req.params.id });
    if (result.deletedCount > 0) {
      resp.send(result);
    } else {
      resp.status(404).send({ result: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    resp
      .status(500)
      .send({ error: "An error occurred while deleting the product" });
  }
});

app.get("/productupdate/:id", verifyToken,async (req, resp) => {
  try {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
      resp.send(result);
    } else {
      resp.status(404).send({ result: "No record found" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    resp
      .status(500)
      .send({ error: "An error occurred while fetching the product" });
  }
});

app.put("/updateproduct/:id",verifyToken, async (req, resp) => {
  try {
    let result = await Product.updateOne(
      { _id: req.params.id },
      {
        $set: {
          name: req.body.name,
          price: req.body.price,
          category: req.body.category,
          company: req.body.company,
        },
      }
    );
    resp.send(result);
  } catch (error) {
    console.error("Error updating product:", error);
    resp.status(500).send({ message: "Error updating product" });
  }
});
app.get("/search/:key",verifyToken, async (req, resp) => {
  const key = req.params.key;
  const result = await Product.find({
    $or: [
      { name: { $regex: key, $options: "i" } },
      { price: { $regex: key, $options: "i" } },
      { category: { $regex: key, $options: "i" } },
      { company: { $regex: key, $options: "i" } },
    ],
  });
  resp.send(result);
});



function verifyToken(req, resp, next) {
  let token = req.headers['authorization'];
  
  if (token) {
    token = token.split(' ')[1];
    Jwt.verify(token, jwtkey, (err, valid) => {
      if (err) {
        resp.status(401).send({ result: "Please provide a valid token" });
      } else {
        next();
      }
    });
  } else {
    resp.status(400).send({ result: "Please add token with header" });
  }
}

 // Ensure you export the function if needed


app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
