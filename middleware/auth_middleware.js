// auth_middleware.js
const jwt = require('jsonwebtoken');
require("dotenv").config();

// const decodedToken = jwt.verify(token, jwtSecretKey);

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication failed - Token missing on header' });
    }
    
    const token = req.headers['authorization'].split(' ')[1];
    console.log("token",token);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed ' });
    }

    const decodedToken = jwt.verify(token,process.env.JWT_SECRET_KEY);
    const user = await db.User.findByPk(decodedToken.userId);
    const tokens = await db.Token.findByPk(decodedToken.tokenId);
    if (!user || !tokens || (tokens.tokenVersion !== decodedToken.tokenVersion)) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.userData = user;
    req.tokenData =tokens;
    next();
  } catch (error) {
    console.error('Error verifying JWT:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports =  authMiddleware;