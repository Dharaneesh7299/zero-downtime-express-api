function isAuthenticated(req,res,next) {
    if (!req.session.username){
        return res.status(401).json({
            success : false,
            message : "unauthorised , please log in"
        });
    }
    next();
}

function isAdmin(req,res,next) {
    if (req.session.role != "admin"){
        return res.status(403).json({
            success : false,
            message : "access denied , admin only"
        });
    }
    next();
}

module.exports = {
    isAuthenticated,
    isAdmin
};