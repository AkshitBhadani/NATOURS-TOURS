const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required :[true,'please tell us your name']
    },
    email:{
        type:String,
        required:[true,'please provide your Email'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'please provide valid email']
    },
    photo:{ 
        type:String,
        default:'default.jpg'
    },
    role:{
        type: String,
        enum:['user','guide','lend-guide','admin'],
        default:'user'
    },
    password:{
        type:String,
        required:[true,'please provide a password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'please confirm your password'],
        validate:{
            //this only works on create and save!!
            validator:function(el){
                return el === this.password;
            },
            message:'password are not the same!'
        }
    },
    passwordChangedAt:Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }
});



// password managing
userSchema.pre('save',async function(next){
    // only run  this function if password was actually modified
    if(!this.isModified('password'))return next();
    // hash the password with cost of 12
    this.password = await bcrypt.hash(this.password,12);
    // delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

//reset password
userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew)return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});
//delete data
userSchema.pre(/^find/,function(next){
    // this points to the current query
    this.find({active:{$ne:false}});
    next();
})

//correct password
userSchema.methods.correctPassword = async function(candidatePassword,userPassword)
{
    return await bcrypt.compare(candidatePassword,userPassword);
};

///changed password 
userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
       
        // console.log(this.passwordChangedAt,JWTTimestamp);
        return JWTTimestamp < changedTimestamp;//100<200
    }
    //False means Not changed
    return false;
}



userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken= crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    console.log({resetToken}, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000 ;

    return resetToken ;  
};


const User =mongoose.model('User',userSchema);

module.exports =User;