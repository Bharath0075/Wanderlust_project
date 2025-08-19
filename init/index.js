const mongoose  = require("mongoose");
const initData = require("./Data.js");
const Listing = require("../models/listing.js");

let URL_Mongo = 'mongodb://127.0.0.1:27017/wanderlust';

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(URL_Mongo);
}  

const initBD = async()=>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({...obj,owner:'689ef0f92ef509af093f0984'}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initBD();