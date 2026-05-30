const mongoose=require('mongoose');

const logSchema=new mongoose.Schema({
    stack:{
        type:String,
        required:true,
    },
    level:{
        type:String,
        required:true,
    },
    package:{
        type:String,
        required:true,
    },
    message:{
        type:String,
        required:true,
    },
},{timestamps:true});

const LogEntry=mongoose.model('LogEntry',logSchema);

module.exports=LogEntry;
