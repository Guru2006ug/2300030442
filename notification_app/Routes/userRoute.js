const express=require('express');
const router=express.Router();
const {signup,signin,getUserMessage,getNextLog,streamNotifications,notifyUser,getPlacementNotifications,getPriorityInbox}=require('../Controller/userController');


router
.post('/signup',signup)
.post('/signin',signin)
.get('/stream',streamNotifications)
.post('/notify',notifyUser)
.get('/priority-inbox',getPriorityInbox)
.get('/notifications/placements',getPlacementNotifications)
.get('/logs/next',getNextLog)
.get('/message/:id',getUserMessage);

module.exports=router;