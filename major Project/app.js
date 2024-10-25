import express from 'express';
import mongoose from 'mongoose';
import Listing from  './models/listings.js'
import path   from "path";
import {dirname}   from "path";
import { fileURLToPath } from "url";
import { log } from 'console';
import methodOverride from 'method-override';
import ejsMate from 'ejs-mate';
import customError from './utils/customError.js';
import wrapAsync from './utils/wrapAsyncError.js';




const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename);


const app = express();

app.use(express.urlencoded({extended: true}));

app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")))
app.use(methodOverride('_method'));

app.engine('ejs',ejsMate)

app.listen(8080, ()=>{
    console.log(`app is listening on port number 8080`);
    
})

const mongo_url = "mongodb://127.0.0.1:27017/wanderlust"

async function main (){
    await  mongoose.connect(mongo_url)
}

main()
    .then(()=>{
        console.log("connected to db successfully ");
        
    })
    .catch((err)=>{
        console.log(err);
        
    })



app.get("/",wrapAsync(async(req,res)=>{
    res.send("working ");
}));

app.get("/testListing", wrapAsync(async(req,res)=>{
    let sampleListing = new Listing({
        title       : "My Dream Bike mt-07",
        description : "I love this bike",
        image       : "",
        // image : "https://imgd.aeplcdn.com/1280x720/n/cw/ec/146941/mt-07-right-front-three-quarter.jpeg?isig=0",
        location    : "hyderabad",
        country     : "INDIA",
        price       : 1500000
    })
    await sampleListing.save();
    console.log("saved");
    res.send("saved")
    
}));

app.get("/listings", wrapAsync(async (req,res,next)=>{

        let allListings = await Listing.find({})
        console.log("req reciedved");
        
        res.render("listings/allListings",{allListings})

}));

app.get("/listings/new", wrapAsync(async(req,res)=>{
    res.render("listings/addListForm")
}));

app.get("/listings/:id", wrapAsync(async (req,res)=>{
    let  id     = req.params.id ;
    console.log(id);
    
    let  singleListing  =  await Listing.findById(id);
    console.log(singleListing);
    
    res.render('listings/singleListing' , {singleListing})
}));

app.post("/listings", wrapAsync(async(req,res,next)=>{
    // try {
            console.log("new post request ");
            console.log(req.body);
            let addList = new Listing({
                title : req.body.title,
                description : req.body.description,
                price : req.body.price,
                image : req.body.image,
                country : req.body.country,
                location : req.body.location
            })

            

           await addList.save();
        //    res.send("added");

           res.redirect("/listings"); // Redirect after successful save

           console.log("added");
           

    //     } 
    // catch (err) 
    //     {
    //         console.log("error catched");
    //         res.status(500).send("An error occurred while adding the listing."); // Send an error response

    //         next(err)
    //     }
    
}));

app.get("/listing/edit/:id",wrapAsync(async(req,res)=>{
    console.log(req.params.id);
    let id = req.params.id;
    let editListing = await Listing.findById(id);
    res.render("listings/editListForm",{editListing})
    
}));

app.put("/listing/edit/:id",wrapAsync(async(req,res)=>{
    let id = req.params.id;
    if(!req.body.listing){
        throw new customError(400,"please provide information")
    } 
    let updateJSONBody = req.body.listing;
    let editListing = await Listing.findByIdAndUpdate(id,{...updateJSONBody})

    console.log('id in put is ',id);
    console.log('body in put is ',updateJSONBody);
    res.redirect(`/listings/${id}`)
    
}));

app.delete("/listing/delete/:id", wrapAsync(async(req,res)=>{
    let id = req.params.id;
    await Listing.findByIdAndDelete(id)
    res.redirect("/listings");
}));

app.delete("/listings" ,wrapAsync(async(req,res)=>{
        await Listing.deleteMany({});
        res.redirect("/listings");
}));


app.all("*",(req,res,next)=>{
    next (new customError(404,"Page not found "))
})

// app.use((err,req,res,next)=>{
//     next( new customError(500,err.message) )
// })

app.use((err,req,res,next)=>{
    console.log(err);
    let {statusCode = 500 , message = "something went wrong "} = err;
    res.render("listings/error.ejs")
    // res.status(statusCode).send(message);
})