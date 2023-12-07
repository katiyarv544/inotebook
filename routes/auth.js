const express=require('express');
const User = require('../models/User');
const router=express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const JWT_SECRET='harryisagoodboy';
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');


//ROUTE 1:create a User using:POST "/api/auth/createuser". No login required
router.post('/createuser',[
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email','Enter a valid email').isEmail(),
    body('password','Password must be atleast 5 characters').isLength({ min: 5 }),

], async (req,res)=>{
  //If there are errors,return bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  //check whether the user with this email exit already
  try {
  let user= await User.findOne({email: req.body.email});
  if(user){
    return res.status(400).json({error: "sorry a user with this email already exists"})
  }

  const salt= await bcrypt.genSalt(10);
  const secPass= await bcrypt.hash(req.body.password, salt);

    //create a new user
    user= await User.create({
    name: req.body.name,
    password: secPass,
    email: req.body.email,
  })
  const data={
    user:{
      id:user.id
    }

  }
  const authtoken=jwt.sign(data,JWT_SECRET);
  res.json({authtoken})
    //res.json(user)
  } catch (error) {
    console.error(error.message);
    res.status(500).send("internal server error");
  }  
})
//ROURE 2:Authenticate a User using:POST "/api/auth/login". No login required
router.post('/login',[
  body('email','Enter a valid email').isEmail(),
  body('password','Password can not be blank').exists(),


], async (req,res)=>{
  //If there are errors,return bad request and the errors

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {email,password}=req.body;
  try {
    let user= await User.findOne({email});
    if(!user){
      return res.status(400).json({error:"Plese try to login with correct credentials"});
    }

    const passwordCompare= await bcrypt.compare(password,user.password);
    if(!passwordCompare){
      return res.status(400).json({error:"Plese try to login with correct credentials2"});
    }
    const data={
      user:{
        id:user.id
      }
    }
    const authtoken=jwt.sign(data,JWT_SECRET);
    res.json({authtoken})
  } catch (error) {
    console.error(error.message);
    res.status(500).send("internal server error");
  }
})

//ROURE 3:Get login user detail  using:POST "/api/auth/getuser". login required
router.post('/getuser',fetchuser, async (req,res)=>{
try {
  userId = req.user.id;
  const user=await User.findById(userId).select("-password") 
  res.send(user)
} catch (error) {
  console.error(error.message);
  res.status(500).send("internal server error");
}
})
module.exports=router