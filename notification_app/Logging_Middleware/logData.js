const express=require('express');

async function LogData(stack,level,package,message){
    const LogData={
        stack:stack,
        level:level,
        package:package,
        message:message,
    }
    console.log(LogData);
}

module.exports=LogData;