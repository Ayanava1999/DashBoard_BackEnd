const express = require("express");
require("./db/config");
const User = require("./db/User");
const cors = require("cors");
const Product = require("./db/product");
const product = require("./db/product");
//jwt
const Jwt = require('jsonwebtoken')
const jwtkey='e-com';

const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());
//Cors
app.use(cors());


//login  routes
app.post("/register", async (req, res) => {
  const user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;

  Jwt.sign({result},jwtkey,{expiresIn:"2h"},(err,token)=>{
    if(err){
      res.send({result:'Something went wrong Please try after some time...'})
    }
    res.send({result , auth:token});
  })
});

app.post("/login", async (req, res) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({user},jwtkey,{expiresIn:"2h"},(err,token)=>{
        if(err){
          res.send({result:'Something went wrong Please try after some time...'})
        }
        res.send({user , auth:token});
      })
     
    } else {
      res.send({ result: "No user found" });
    }
  } else {
    res.send({ result: "Password not Entered" });
  }
});


//product routes

app.post('/addproduct',verifyToken,async(req,res)=>{

  let product =new Product(req.body);
  let result =await product.save();
  res.send(result)
})

app.get('/products',verifyToken,async(req,res)=>{
  let products=await Product.find();
  if(products.length>0){
    res.send(products)
  }else{
    res.send({result:'No products found'})
  }
})

app.delete('/product/:id',verifyToken,async(req,res)=>{
  const result=await product.deleteOne({_id:req.params.id});
  res.send(result);
})

app.get('/product/:id',verifyToken, async (req, res) => {
  try {
    const result = await Product.findOne({ _id: req.params.id });
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ error: "No record found" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put('/product/:id',verifyToken, async (req, res) => {
  try {
    let result = await Product.updateOne(
      { _id: req.params.id },
      { $set: req.body }
    );
    res.send(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/search/:key",verifyToken, async (req, res) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { catagory: { $regex: req.params.key } }
    ],
  });
  res.send(result);
});

//making middle wire for jwt
function verifyToken(req,resp,next){
  let  token=req.headers['authorization']

if(token){
token=token.split(' ')[1];
console.log('Middle Wire Called if',token)
Jwt.verify(token,jwtkey,(err,valid)=>{
if(err){
  resp.status(401).send({result :'Plaese provide valid token '})
}else{
  next();
}
})
}else{
resp.status(403).send({result :'Plaese add token with Header'})
}

}

app.listen(5000, () => {
  console.log("Port is listening on 5000");
});
