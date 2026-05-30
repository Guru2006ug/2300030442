const mongoose=require('mongoose');

const notificationSchema=new mongoose.Schema({
    studentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    eventType:{
        type:String,
        enum:['results','offer','interview','drive'],
        required:true,
    },
    priority:{
        type:String,
        required:true,
    },
    message:{
        type:String,
        required:true,
    },
    isRead:{
        type:Boolean,
        default:false,
    },
},{timestamps:true});

const Notification=mongoose.model('Notification',notificationSchema);

module.exports=Notification;
