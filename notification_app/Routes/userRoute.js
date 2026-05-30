const express=require('express');
const router=express.Router();
const {signup,signin,getUserMessage}=require('../Controller/userController');


router
.post('/signup',signup)
.post('/signin',signin)
.get('/message/:id',getUserMessage);

module.exports=router;