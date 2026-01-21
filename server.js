const express = require('express');
const jwt = require('jsonwebtoken')
const app = express();

app.use(express.json());

const MOCK_USER = {
    email: "student@hostel.com",
    password: "password123",
    id: "user_555"
};

const SECRET_KEY = "my_super_secret_hostel_key";

const verifyToken = (req , res , next) => {

  const authHeader = req.headers['authorization'];

  if(!authHeader || !authHeader.startsWith('Bearer ')){
    res.status(403).json({message: "Access Denied"});

  }

  const token = authHeader.split(' ')[1];

  try{

    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded;

    next();
  
  }
  catch (err){
    res.status(404).json({message:"Invalid Token"});
  }

};


app.get('/', (req, res) => {
    res.send('authGate is Online!');
});


app.post('/login' , (req,res) => {
  const {email , password} = req.body;

  if(email === MOCK_USER.email && password === MOCK_USER.password){
    
    const token = jwt.sign(
      {userId: MOCK_USER.id , role: "student"},
      SECRET_KEY,
      {expiresIn:"1h"}
    );

    res.json({
            message: "Login Successful!",
            token: token
        });
    }

    else{
      res.status(401).json({message:"Invalid login"});
    }

});

app.get('/dashboard' ,verifyToken  , (req,res) =>{
    res.json({
      message:`Welcome to the dashboard, User ${req.user.userId}`,
      role: req.user.role  
    });  
});

app.listen(3000, () => {
    console.log(' authgate Server is running on 3000');
});

