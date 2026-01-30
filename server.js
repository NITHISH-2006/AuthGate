const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.json());


mongoose.connect('mongodb://127.0.0.1:27017/gatehouse_db')
  .then(() => console.log('MongoDB Connected!'))
  .catch((err) => console.error('Database Connection Error:', err));



const SECRET_KEY = "my_super_secret_hostel_key";
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


app.post('/register', async (req, res) => {
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


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(!user){
      return res.status(401).json({message: "Invalid UserName"});
    }
    
    const isMatch =  await bcrypt.compare(password, user.password);

    if (isMatch) {
        
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.json({ message: "Login Successful!", token });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

app.get('/dashboard', verifyToken, (req, res) => {
    res.json({ message: "Welcome to the Student Common Room " });
});

app.get('/admin-dashboard', verifyToken, checkRole('admin'), (req, res) =>{
  res.json({message:"Welcome to the Warden's Office"});
});

app.listen(3000, () => {
    console.log('AuthGate Server running on 3000');
});