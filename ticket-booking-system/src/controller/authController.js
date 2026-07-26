const { connect } = require("mongoose");

async function login(req,res) {
    const {username} = req.body;
    if (!username){
        return res.status(400).json({
            success : false,
            message : "username is required"
        });
    }

    req.session.username = username;

    return res.status(200).json({
        success : true,
        message : "login successful"
    });
}

async function logout(req,res) {
    req.session.destroy((err) => {
        if (err){
            return res.status(500).json({
                success : false,
                message : "logout failed"
            });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({
            success : true,
            message : "logout successful"
        });
    });
}

module.exports = {
    login,
    logout
}