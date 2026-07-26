function isAuthenticated(req,res,next) {
    if (!req.session.username){
        return res.status(401).json({
            success : false,
            message : "unauthorised , please log in"
        });
    }
    next();
}

module.exports = isAuthenticated;