const mongoose=require('mongoose');
const url=process.env.MONGO_URL;
async function ConnectDB(url){
    await mongoose.connect(url)
    .then(()=>{
        console.log('Connected to MongoDB');
    })
    .catch((error)=>{
        console.log('Error connecting to MongoDB: ',error);
    });
}

module.exports=ConnectDB;