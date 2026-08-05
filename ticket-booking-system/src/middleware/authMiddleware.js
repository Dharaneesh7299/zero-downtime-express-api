const { ADMIN } = require("../constants/roles");

function isAuthenticated(req,res,next) {
    if (!req.session.user){
        return res.status(401).json({
            success : false,
            message : "unauthorised , please log in"
        });
    }
    next();
}

function isAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== ADMIN) {
        return res.status(403).json({
            success: false,
            message: "Access denied, admin only"
        });
    }

    next();
}

module.exports = {
    isAuthenticated,
    isAdmin
};