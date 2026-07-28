import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { 
        type: String,
        required: true 
    },
    email: { 
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password is required if googleId is not provided
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allow null or undefined values
    },
    preferredRole: {
        type: String,
        default: 'MERN Stack Developer',
    },
  },    
    {
        timestamps: true
    }
);

userSchema.pre('save', async function (next) {  //pre-hook , it called before the await user.save() (from controller)
    if (!this.isModified('password') || !this.password) {
        return ; // Skip hashing if password is not modified or not provided
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if(!this.password) {
        return false; // No password set, cannot match
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;