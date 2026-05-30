const express=require('express');
const User=require('../Model/userModel');
const bcrypt=require('bcrypt');
const LogData=require('../Logging_Middleware/logData');
const jwt=require('jsonwebtoken');

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

module.exports={signup, signin, getUserMessage};