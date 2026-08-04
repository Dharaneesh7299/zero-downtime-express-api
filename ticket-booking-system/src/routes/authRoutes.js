const express = require("express");
const router = express.Router();
const {register,login,logout} = require("../controller/authController");

router.post('/login',login);
router.post('/logout',logout);
router.get('/test',(req,res)=>{
    return res.status(200).json({
        success : true,
        message : "auth route is wokring"
    })
});

module.exports = router;