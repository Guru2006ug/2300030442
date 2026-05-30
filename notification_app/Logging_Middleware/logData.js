const LogEntry=require('../Model/logModel');

async function LogData(stack,level,package,message){
    const logPayload={
        stack:stack,
        level:level,
        package:package,
        message:message,
    };
    try{
        const logEntry=new LogEntry(logPayload);
        await logEntry.save();
    }
    catch(error){
        console.log({
            stack:'logData.js',
            level:'error',
            package:'LogData',
            message:'Failed to persist log entry',
        });
    }
    console.log(logPayload);
}

module.exports=LogData;