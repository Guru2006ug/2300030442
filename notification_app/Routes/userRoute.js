const express=require('express');
const router=express.Router();
const {signup,signin,getUserMessage,getNextLog}=require('../Controller/userController');


router
.post('/signup',signup)
.post('/signin',signin)
.get('/message/:id',getUserMessage)
.get('/logs/next',getNextLog);

module.exports=router;