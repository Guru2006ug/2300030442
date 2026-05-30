const express=require('express');
const router=express.Router();
const {signup,signin,getUserMessage,getNextLog,streamNotifications,notifyUser,getPlacementNotifications}=require('../Controller/userController');


router
.post('/signup',signup)
.post('/signin',signin)
.get('/stream',streamNotifications)
.post('/notify',notifyUser)
.get('/notifications/placements',getPlacementNotifications)
.get('/logs/next',getNextLog)
.get('/message/:id',getUserMessage);

module.exports=router;