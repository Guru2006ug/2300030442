const express=require('express');
const app=express();
require('dotenv').config();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const port=process.env.PORT;
const ConnectDB=require('./db');
const userRoutes=require('./Routes/userRoute');

ConnectDB(process.env.MONGO_URL);


app.use('/users',userRoutes);
app.listen(port,()=>{
    console.log('Server is running on port '+port);
});

