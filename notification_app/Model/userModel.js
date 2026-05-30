const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    messageRules:[
        {
            event:{
                type:String,
                required:true,
            },
            priority:{
                type:String,
                required:true,
            },
            message:{
                type:String,
                required:true,
            }
        }
    ]
},{timestamps:true});

const User=mongoose.model('User',userSchema);

module.exports=User;