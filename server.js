const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');


const app = express();

app.use(express.json());


mongoose.connect('mongodb://127.0.0.1:27017/gatehouse_db')
  .then(() => console.log('MongoDB Connected!'))
  .catch((err) => console.error('Database Connection Error:', err));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});


const SECRET_KEY = "my_super_secret_hostel_key";
const REFRESH_SECRET_KEY = "my_amazing_refresh_secret";

const User = require('./models/User'); 



const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; 

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: "Access Denied" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
  }
};


const checkRole = (requiredRole) => {
  return (req, res, next) =>{
    if(req.user.role !== requiredRole){
      return res.status(403).json({message:"Access Denied: You do not have permission!"});
    }
    next();
  };
};




app.get('/', (req, res) => {
    res.send('Authgate Online & Connected to Database!');
});


app.post('/register', authLimiter, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
     
        const salt = await bcrypt.genSalt(9);
        
        const hashedPass = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email,
            password: hashedPass,
            role
        });

        res.status(201).json({ message: "User Registered Successfully!", userId: newUser._id });
    } catch (err) {
       
        res.status(400).json({ error: err.message });
    }
});


app.post('/login', authLimiter, async (req, res) => {
    

  
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(!user){
      return res.status(401).json({message: "Invalid credentials"});
    }
    
    const isMatch =  await bcrypt.compare(password, user.password);

    if (isMatch) {
        
        const accessToken = jwt.sign(
            { userId: user._id, role: user.role },
            SECRET_KEY,
            { expiresIn: "2m" }
        );

        const refreshToken = jwt.sign(
          { userId: user._id },
          REFRESH_SECRET_KEY,
          { expiresIn: "7d" }
        );

        user.refreshToken = refreshToken;
        await user.save();

        res.json({ message: "Login Successful!", accessToken, refreshToken });
    
      } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

app.post('/refresh', (req, res)=>{
  const { refreshToken } = req.body;

  if(!refreshToken){
    return res.status(401).json({message: "Access Denied"});
  }

  try{
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);
    
    const user = await User.findById(decoded.userId);
    if(!user || user.refreshToken !== refreshToken){
        return res.status(403).json({message:"Invalid refresh Token (Revoked)"})
    }

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      SECRET_KEY,
      {expiresIn: "2m"}
    );
    
    res.json({ accessToken: newAccessToken });
  }
  catch(err){
    res.status(401).json({message: "Invalid Refresh Token"});
  }
});

app.get('/dashboard', verifyToken, (req, res) => {
    res.json({ message: "Welcome to the Student Common Room " });
});

app.get('/admin-dashboard', verifyToken, checkRole('admin'), (req, res) =>{
  res.json({message:"Welcome to the Warden's Office"});
});

app.post('/logout', asyn(req, res) => {
  const {email } =  req.body;

  await User.findOneAndUpdate(
    {email:email},
    {refreshToken: null}
  );
  res.json({message:"Logged out Successfully. Token Destroyed"});
})

app.listen(3000, () => {
    console.log('AuthGate Server running on 3000');
});