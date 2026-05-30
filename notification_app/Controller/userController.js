const express=require('express');
const User=require('../Model/userModel');
const LogEntry=require('../Model/logModel');
const Notification=require('../Model/notificationModel');
const bcrypt=require('bcrypt');
const LogData=require('../Logging_Middleware/logData');
const jwt=require('jsonwebtoken');

const activeStreams=new Map();

function sendSse(res,eventName,payload){
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function getTokenFromRequest(req){
    const authHeader=req.headers.authorization || '';
    if(!authHeader.startsWith('Bearer ')){
        return null;
    }
    return authHeader.slice('Bearer '.length).trim();
}

function resolveDynamicMessage(user,event,priority){
    if(!event || !priority || !Array.isArray(user.messageRules)){
        return user.message;
    }
    const normalizedEvent=String(event).trim().toLowerCase();
    const normalizedPriority=String(priority).trim().toLowerCase();
    const match=user.messageRules.find((rule)=>{
        return String(rule.event).trim().toLowerCase()===normalizedEvent
            && String(rule.priority).trim().toLowerCase()===normalizedPriority;
    });
    return match ? match.message : user.message;
}

async function signup(req,res){
    const {email,password,name,messageRules}=req.body;
    if(!email || !password || !name || !messageRules){
        return res.status(404).json({error:'All fields are required'});
    }
    const existingUser=await User.findOne({email});
    if(existingUser){
        return res.status(409).json({error:'User already exists'});
    }

    const hasedPassword=await bcrypt.hash(password,10);
    try{
        const user=new User({
            name,
            email,
            password:hasedPassword,
            messageRules: Array.isArray(messageRules) ? messageRules : [],
        });
        await user.save();
        await LogData('userController.js','error','signup','User created successfully');
        res.status(201).json({message:'User created successfully'});
    }
    catch(error){
        await LogData('userController.js','error','signup','Error occurred while creating user');
        res.status(500).json({error:'Internal server error'});
    }
}

async function signin(req,res){
    const {email,password,event,priority}=req.body;
    if(!email || !password){
        return res.status(404).json({error:'All fields are required'});
    }
    const existingUser=await User.findOne({email});
    if(!existingUser){
        return res.status(409).json({error:'User not found'});
    }

    const isMatch=await bcrypt.compare(password,existingUser.password);
    if(!isMatch){
        return res.status(409).json({error:'Invalid credentials'});
    }
    const token=await jwt.sign(
        {
            id:existingUser._id
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '1h'
        }
    );
    const dynamicMessage=resolveDynamicMessage(existingUser,event,priority);
    await LogData('userController.js','info','signin',JSON.stringify({
        userId: existingUser._id,
        event: event || null,
        priority: priority || null,
        message: dynamicMessage,
    }));
    res.status(200).json({ message: 'Signin successful', token, userMessage: dynamicMessage });
}

async function getUserMessage(req,res){
    const userId=req.params.id;
    const {event,priority}=req.query;
    try{
        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({error:'User not found'});
        }
        const dynamicMessage=resolveDynamicMessage(user,event,priority);
        await LogData('userController.js','info','getUserMessage',JSON.stringify({
            userId: user._id,
            event: event || null,
            priority: priority || null,
            message: dynamicMessage,
        }));
        res.status(200).json({message:dynamicMessage});
    }
    catch(error){
        await LogData('userController.js','error','getUserMessage','Error occurred while fetching user message');
        res.status(500).json({error:'Internal server error'});
    }
}

async function getNextLog(req,res){
    const {after}=req.query;
    try{
        let query={};
        if(after){
            const afterLog=await LogEntry.findById(after);
            if(!afterLog){
                return res.status(404).json({error:'Log not found'});
            }
            query={createdAt:{$gt: afterLog.createdAt}};
        }
        const nextLog=await LogEntry.findOne(query).sort({createdAt:1});
        if(!nextLog){
            return res.status(200).json({log:null, hasMore:false});
        }
        const hasMore=await LogEntry.exists({createdAt:{$gt: nextLog.createdAt}});
        res.status(200).json({log:nextLog, hasMore:!!hasMore});
    }
    catch(error){
        await LogData('userController.js','error','getNextLog','Error occurred while fetching logs');
        res.status(500).json({error:'Internal server error'});
    }
}

async function streamNotifications(req,res){
    const token=getTokenFromRequest(req);
    if(!token){
        return res.status(401).json({error:'Missing token'});
    }
    let decoded;
    try{
        decoded=jwt.verify(token,process.env.JWT_SECRET);
    }
    catch(error){
        return res.status(401).json({error:'Invalid token'});
    }
    const userId=decoded.id;
    const user=await User.findById(userId);
    if(!user){
        return res.status(404).json({error:'User not found'});
    }

    res.status(200).set({
        'Content-Type':'text/event-stream',
        'Cache-Control':'no-cache',
        'Connection':'keep-alive',
    });

    activeStreams.set(String(userId),res);
    sendSse(res,'connected',{message:'Stream connected'});

    const keepAlive=setInterval(()=>{
        sendSse(res,'ping',{time:new Date().toISOString()});
    },25000);

    req.on('close',()=>{
        clearInterval(keepAlive);
        activeStreams.delete(String(userId));
        res.end();
    });
}

async function notifyUser(req,res){
    const {userId,event,priority}=req.body;
    if(!userId || !event || !priority){
        return res.status(404).json({error:'All fields are required'});
    }
    const user=await User.findById(userId);
    if(!user){
        return res.status(404).json({error:'User not found'});
    }
    const dynamicMessage=resolveDynamicMessage(user,event,priority);
    try{
        const notification=new Notification({
            studentId:user._id,
            eventType:String(event).trim().toLowerCase(),
            priority:String(priority).trim().toLowerCase(),
            message:dynamicMessage,
        });
        await notification.save();
    }
    catch(error){
        await LogData('userController.js','error','notifyUser','Error occurred while saving notification');
        return res.status(500).json({error:'Internal server error'});
    }
    const stream=activeStreams.get(String(userId));
    if(stream){
        sendSse(stream,'message',{message:dynamicMessage,event,priority});
    }
    await LogData('userController.js','info','notifyUser',JSON.stringify({
        userId: user._id,
        event,
        priority,
        message: dynamicMessage,
        delivered: !!stream,
    }));
    res.status(200).json({message:'Notification processed', delivered: !!stream});
}

async function getPlacementNotifications(req,res){
    const {days}=req.query;
    const match={
        eventType:{ $in:['results','offer'] },
    };
    if(days){
        const parsedDays=Number(days);
        if(Number.isNaN(parsedDays) || parsedDays <= 0){
            return res.status(400).json({error:'Days must be a positive number'});
        }
        const since=new Date(Date.now() - parsedDays*24*60*60*1000);
        match.createdAt={ $gte: since };
    }
    try{
        const students=await Notification.aggregate([
            {
                $match:match,
            },
            {
                $group:{
                    _id:'$studentId'
                }
            }
        ]);
        res.status(200).json({studentIds:students.map((item)=>item._id)});
    }
    catch(error){
        await LogData('userController.js','error','getPlacementNotifications','Error occurred while fetching placement notifications');
        res.status(500).json({error:'Internal server error'});
    }
}

module.exports={
    signup,
    signin,
    getUserMessage,
    getNextLog,
    streamNotifications,
    notifyUser,
    getPlacementNotifications,
};