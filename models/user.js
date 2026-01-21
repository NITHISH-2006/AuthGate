const mongoose = require('mongoose');

const userSchema =mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type: String,
        required:true
    },
    role:{
        type: String,
        enum:['student', 'warden', 'admin'],
        default:'student'
    }

});

module.exports = mongoose.model('User', userSchema);