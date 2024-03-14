const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');


//upload photo
// const multerStorage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'public/img/users');
//     },
//     filename:(req,file,cb)=>{
//         const ext = file.mimetype.split('/')[1];
//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });
const multerStorage =multer.memoryStorage();    

const multerFilter =  (req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }else{
        cb(new AppError('not an image! please upload only images.',400),false);
    }
};
const upload = multer({
    storage:multerStorage,
    fileFilter:multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto =catchAsync(async(req,res,next)=>{
    if(!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    
    await sharp(req.file.buffer)
    .resize(500,500)
    .toFormat('jpeg')
    .jpeg({quality:90})
    .toFile(`public/img/users/${req.file.filename}`);
    next();
});

// const { use } = require('../routes/userRoutes');
const filterObj = (obj, ...allowedFields)=>{
    const newObj ={};
   Object.keys(obj).forEach(el=>{
    if (allowedFields.includes(el)) newObj[el]= obj[el];
   });
   return newObj;
}

// current user data
exports.getMe =(req,res,next)=>{
    req.params.id = req.user.id;
    next();
}


// user document update
exports.upadeMe = catchAsync(async(req,res,next)=>{
   // 1) Create error if user POSTs password data
   if(req.body.password || req.body.passwordConfirm){
    return next(new AppError('This is not for password update. please use /updateMyPassword.',400));
   }

   // 2) Filtered out unwanted fields names that are allowed to be updated 
   const filteredBody = filterObj(req.body, 'name','email');
   if(req.file) filteredBody.photo = req.file.filename;
   // 3) Update user document 

     const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody,{
        new:true,
        runValidators:true
     });

    res.status(200).json({
    status : 'success',
    data:{
        user: updateUser
    }
   })
});
// user id delete
exports.deleteMe =catchAsync(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user.id,{active:false});
    res.status(204).json({
        status:'success',
        data:null
    })
})

//all user list
exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers= catchAsync( async (req,res,next)=>{
//     const users =await User.find();
    
//    //SEND RESPONSE
//    res.status(200).json({
//     status :"success",
//     result: users.length,
//     data:{
//         users
//     }
//   });
// });

// new user create
exports.createUser=(req,res)=>{
    res.status(500).json({
        status:'error',
        message:'this route is not defined! Please use / signup instead'
    });
};

//find user
exports.getUser = factory.getOne(User);
// exports.getUser=(req,res)=>{
//     res.status(500).json({
//         status:'error',
//         message:'this route is not defined! Please use / signup instead'
//     });
// };


//update user
// exports.updateUser=(req,res)=>{
//     res.status(500).json({
//         status:'error',
//         message:'this route is not yet  defined'
//     });
// };

//not update to password
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);