import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import {OAuth2Client} from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
}

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if(!name || !email || !password) {
        res.status(400);
        throw new Error('Please provide all required fields (name, email, password)');
    }
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }   

    const user = await User.create({
        name,
        email,
        password
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
            token: generateToken(user._id)
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data provided');
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        res.status(400);
        throw new Error('Please provide all required fields (email, password)');
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
            token: generateToken(user._id)
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        res.status(400);
        throw new Error('Google sign-in did not provide an ID token.');
    }

    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    // let ticket;
    // try {
    //     ticket = await client.verifyIdToken({
    //         idToken,
    //         audience: process.env.GOOGLE_CLIENT_ID,
    //     });
    // } catch (error) {
    //     const payloadSegment = idToken.split('.')[1];
    //     const tokenPayload = payloadSegment
    //         ? JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8'))
    //         : {};

    //     console.error('Google ID token audience mismatch:', {
    //         tokenAudience: tokenPayload.aud,
    //         requiredAudience: process.env.GOOGLE_CLIENT_ID,
    //     });
    //     res.status(401);
    //     throw new Error('Google sign-in is configured with a different OAuth client ID. Restart both servers after aligning GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID.');
    // }

    const {email_verified, name,email,sub: googleId} = ticket.getPayload();  

    if(!email_verified) {
        res.status(401);
        throw new Error('Google login failed. Email not verified');
    }
    let user = await User.findOne({ email });

    if (user) {
        if(!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
    } else {
        user = await User.create({
            name,
            email,
            googleId,
            password: null
        });
        if(!user) {
            res.status(400);
            throw new Error('could not create user with Google login');
        }
    }

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        preferredRole: user.preferredRole,
        token: generateToken(user._id)
    });

});

const getUserProfile = asyncHandler(async (req, res) => {
    if (req.user) {
        res.status(200).json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            preferredRole: req.user.preferredRole,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }   
});

const updateUserProfile = asyncHandler(async (req, res) => {
    if(req.user) {
        const user = await User.findById(req.user._id);
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.preferredRole = req.body.preferredRole || user.preferredRole;
        if(req.body.password) {
            user.password = req.body.password;
        }   
        await user.save();
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
            token: generateToken(user._id)
        });
    }
});

export { registerUser, loginUser, googleLogin, getUserProfile, updateUserProfile };
