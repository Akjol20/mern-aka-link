const {Router} = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check,validationResult} = require('express-validator')
const User = require('../models/User.js')
const router = Router()
//register
router.post(
    '/register',
    [
      check('email','incorrect email').isEmail(),
      check('password','minimum password length 6 characters')
      .isLength({min:6})
    ],
    async (req,res) => {
   try{
       const  errors = validationResult(req)
       if(!errors.isEmpty()){
             return res.status(400).json({
                 errors:errors.array(),
                 message:'Incorrect registration data'
             })
       }
        const {email,password} = req.body
        const candidate =  await User.findOne({email})
        if(candidate){
           return  res.status(400).json({message:"Such user has already existed"})
        }

       const hashedPassword =await bcrypt.hash(password,12)
       const user = new User({email,password:hashedPassword})

       await user.save()
       res.status(201).json({message:'The user was created'})

    }catch(e){
        res.status(500).json({message:'Something went wrong Try again'})
       }
})


//login
router.post(
    '/login',
    [
      check('email','Enter correct email').normalizeEmail().isEmail(),
      check('password','Enter password').exists()
    ],
    async (req,res) => {
        try{
            const  errors = validationResult(req)
            if(!errors.isEmpty()){
                  return res.status(400).json({
                      errors:errors.array(),
                      message:'Incorrect data at system login'
                  })
            }
        const {email,password} = req.body
           const user = await  User.findOne({email})
            if(!user){
                 return res.status(400).json({message:"User was not found"})
            }
            const isMatch = await bcrypt.compare(password,user.password)
            if(!isMatch){
                return res.status(400).json({message:"Invalid password Try again please"})
            }
            const token = jwt.sign(
                { userId:user.id },
                config.get('jwtSecret'),
                {expiresIn:'1h'}
            )
            res.json({token,userId:user.id})
    }catch(e){
             res.status(500).json({message:'Something went wrong Try again'})
            }
     }
)

module.exports = router
