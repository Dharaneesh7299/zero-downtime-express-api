const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const { json } = require("node:stream/consumers");

async function register(req,res) {
    try {
        const {username,email,password} = req.body;

        if (!username || !email || !password){
            return res.status(400).json({
                success : false,
                message : "all fields are required"
            });
        }

        const normemail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where : {
                email : normemail
            }
        });

        if (user){
            return res.status(409).json({
                success : false,
                message : "user already exixts"
            })
        }

        const hashpass = await bcrypt.hash(password,10);

        await prisma.user.create({
            data : {
                username : username,
                email : normemail,
                password : hashpass
            }
        });

        return res.status(201).json({
            success : true,
            message : "user registered successfully"
        });
    }

    catch(err){
        console.error(err);

        return res.status(500).json({
            success : false,
            message : "internal server error"
        });
    }
}

async function login(req,res) {
    try {
        const { email , password } = req.body;
        
        if (!email || !password){
            return res.status(400).json({
                success : false,
                message : "email and password are required"
            });
        }

        const normEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where : {
                email : normEmail,
            }
        });

        if (!user){
            return res.status(401).json({
                success : false,
                message : "invalid user or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch){
            return res.status(401).json({
                success : false,
                message : "invalid user or password"
            });
        }

        req.session.user = {
            id : user.id,
            username : user.username,
            role : user.role
        }

        return res.status(200).json({
            success: true,
            message: "Login successful"
        });

    }
    
    catch(err){
        console.log(err);

        return res.status(500).json({
            success : false,
            message : "Internal server error"
        });
    }
}

async function logout(req,res) {
    try{
        req.session.destroy((err) => {
            if (err){
                return res.status(500),json({
                    success : false,
                    message : "failed to logout" 
                });
            }

            res.clearCookie("connect.sid");

            return res.status(200).json({
                success: true,
                message: "Logged out successfully"
            });
        });
    }

    catch(err){
        return res.status(500),json({
           success : false,
           message : "Internal server error" 
        });
    }
}

module.exports = {
    register,
    login,
    logout
}