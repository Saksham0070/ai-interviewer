import asyncHandler from 'express-async-handler';
import Session from '../models/SessionModel.js'
import User from '../models/User.js';
import fs from 'fs';
import formData from 'form-data';
import mongoose, { mongo } from 'mongoose';
import { error } from 'console';

const AI_SERVICE_URL =
    process.env.AI_SERVICE_URL || "http://localhost:8000";
    
const pushSocketUpdate = (io,userId,sessionId, status,message,session=null) => {
    io.to(userId.toString()).emit('sessionUpdate', {
        sessionId,
        status,
        message,
        session,
    });   
}

const createSession = asyncHandler(async (req, res) => {
    const { role, level, interviewType,count } = req.body;
    const userId = req.user._id;

    if (!role || !level || !interviewType || !count) {
        res.status(400);
        throw new Error('Please provide all required fields (role, level, interviewType)');
    }

    let session = await Session.create({
        user: userId,
        role,
        level,
        interviewType,
        status: 'pending',
    });
    const io = req.app.get('io');

    res.status(202).json(
        {   message: 'Session created successfully',
            sessionId: session._id,
            status: "processing"
        }
    );
    //IIFE => Immediately Invoked Function Expression
    (async () => {
        try {
            pushSocketUpdate(io,userId,session._id,'AI_GENERATING_QUESTIONS',`Generating ${count} questions for ${role}...`);
            console.log("Till here--------------")
            const aiResponse = await fetch(`${AI_SERVICE_URL}/generate-questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role, level,count, interview_type:interviewType }),
            });
            console.log("Till here--------34r------")
            if(!aiResponse.ok) {
                throw new Error(`AI service failed to generate questions: responded with status ${aiResponse.status} ${await aiResponse.text()}`);
            }
            const aiData = await aiResponse.json();
            //console.log("AI Data received:", aiData);
            const codingCount = interviewType === 'coding-mix' ? Math.floor(count * 0.2) : 0;
            
            const questions = aiData.questions.map((q, index) => ({
                questionText: q,
                questionType: index < codingCount ? 'coding' : 'oral',
                isEvaluated: false,
                isSubmitted: false,
            }));

            session.questions = questions;
            session.status = 'in-progress';
            await session.save();

            pushSocketUpdate(io,userId,session._id,'QUESTIONS_READY','Questions generated successfully. Starting session.', session);

        } catch (error) {
            console.error('Error creating session:', error.message);
            session.status = 'failed';
            await session.save();
            pushSocketUpdate(io,userId,session._id,'GENERATION_FAILED',`Question generation failed. Reason: ${error.message}.`);
        }
    })();
});

const getSessions = asyncHandler(async (req, res) => {
    // Find all sessions for the logged-in user, sorted by newest first
    const sessions = await Session.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .select('-questions.userAnswerText -questions.userSubmittedCode'); // Exclude heavy data for list view
    res.json(sessions);
});

const getSessionById = asyncHandler(async (req, res) => {
    const sessionId = req.params.id;
    const userId = req.user._id;
    const session = await Session.findOne({user: userId , _id: sessionId});
    if (!session) {
        res.status(404);
        throw new Error('Session not found or user unauthorized.');
    }

    // Repair summaries created before the score aggregation fix whenever a
    // completed session is opened.
    if (session.status === 'completed' && session.questions.some(q => q.isEvaluated)) {
        const scoreSummary = await calculateOverallScore(sessionId);
        session.overallScore = scoreSummary.overallScore;
        session.metrics = {
            avgTechnical: scoreSummary.avgTechnical,
            avgConfidence: scoreSummary.avgConfidence,
        };
        await session.save();
    }
    res.status(200).json(session);
});

const deleteSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Check if the user owns this session
    if (session.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    await session.deleteOne();

    res.status(200).json({ id: req.params.id });
});

const calculateOverallScore = async(sessionId)=>{
    const results = await Session.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(sessionId)
            }
        },
        {
            $unwind: "$questions"
        },
        {
            $group:{
                _id:'$_id',
                avgTechnical:{$avg: {$cond:[{$eq:['$questions.isEvaluated',true]},'$questions.technicalScore',0]}},
                avgConfidence:{$avg: {$cond:[{$eq:['$questions.isEvaluated',true]},'$questions.confidenceScore',0]}},
            }
        },
        {
            $project :{
                _id: 0,
                overallScore:{$round:[{$avg:['$avgTechnical','$avgConfidence']},0]},
                avgTechnical: {$round: ['$avgTechnical', 0]},
                avgConfidence :{$round: ['$avgConfidence', 0]}
            }
        }
    ]);
    return results[0] || {overallScore:0,avgTechnical:0,avgConfidence:0};
}

const evaluateAnswerAsync = async (io,userId,sessionId,questionIndex,audioFilePath=null,codeSubmission=null) => {
    let transcription = "";
    const questionIdx = typeof questionIndex === 'string' ? parseInt(questionIndex, 10) : questionIndex;
    const session  = await Session.findById(sessionId);

    if (!session) {
        console.error(`Session ${sessionId} not found`);
        return;
    }

    const question = session.questions[questionIdx];
    if(!question) {
        pushSocketUpdate(io,userId,sessionId,'EVALUATION_FAILED',`Q${questionIdx + 1} not found.`, null);
        return;
    }
    console.log("evaluating answer-------------")
    //Phase 1: Transcription (Only if audio exists)....
    if(audioFilePath) {
        console.log("with audio file path-----------")
        try{
            pushSocketUpdate(io,userId,sessionId,'AI_TRANSCRIBING',`Transcribing audio for Q${questionIdx + 1}...`);
            const formData = new FormData();
            formData.append("file",fs.createReadStream(audioFilePath));

            const transResponse =  await fetch(`${AI_SERVICE_URL}/transcribe`,{
                method:"POST",
                body:formData,
                headers:formData.getHeaders()
            });

            if(!transResponse.ok){
                throw new Error('Transcription service failed');
            }

            const transData = await transResponse.json();
            transcription = transData.transcription || "";
        }catch(error) {
            console.error(`Transcription Error: ${error.message}`);

        }finally{
            if(audioFilePath && fs.existsSync(audioFilePath)){
                fs.unlinkSync(audioFilePath);
            }
        }
    }else{
        console.log("No audio file provided, skipping transcription.");
    }
        // Phase 2: AI Evaluation .....
        try{
            pushSocketUpdate(io,userId,sessionId,"AI_EVALUATING",`AI is analyzing Q${questionIdx + 1}...`);

            const evalResponse = await fetch(`${AI_SERVICE_URL}/evaluate`,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    question:question.questionText,
                    question_type: question.questionType,
                    role:session.role,
                    level:session.level,
                    user_answer:transcription, // Dedicated transcription field
                    user_code: codeSubmission || ""
                }),
            });
            if (!evalResponse.ok) throw new Error('AI Evaluation service failed');

            const evalData = await evalResponse.json();
            
            question.userAnswerText = transcription;
            question.userSubmittedCode = codeSubmission || "";
            question.idealAnswer = evalData.idealAnswer;
            question.aiFeedback =  evalData.aiFeedback;
            question.technicalScore = evalData.technicalScore;
            question.confidenceScore = evalData.confidenceScore;
            question.isEvaluated = true;

            const allQuestionsEvaluated = session.questions.every(q => q.isEvaluated);
            
            if(session.status==="completed" && allQuestionsEvaluated){
                const scoreSummary = await calculateOverallScore(sessionId);

                session.overallScore = scoreSummary.overallScore || 0;

                session.metrics = {
                    avgTechnical: scoreSummary.avgTechnical,
                    avgConfidence: scoreSummary.avgConfidence
                };

                if(allQuestionsEvaluated){
                    session.status = 'completed';
                    session.endTime = session.endTime || new Date();
                }
                await session.save();

                pushSocketUpdate(io, userId, sessionId, 'SESSION_COMPLETED', 'Scores finalized.', session);
            }else{
                // Normal behavior: User is still in the interview
            await session.save();
            pushSocketUpdate(io, userId, sessionId, 'EVALUATION_COMPLETE', `Feedback for Q${questionIdx + 1} is ready!`, session);
            }


        }catch(error){
            console.error(`Evaluation failed :${error.message}`);
            pushSocketUpdate(io, userId, sessionId, 'EVALUATION_FAILED', `Evaluation failed: ${error.message}`, session);
        }
            
    
};

const submitAnswer = asyncHandler(async (req, res) => {
    console.log("Code with audio submitted in submit-answer-----")
    const sessionId = req.params.id;
    const { questionIndex, code } = req.body; // Remove submissionType if not strictly needed
    const userId = req.user._id;

    const session = await Session.findById(sessionId);

    if (!session || session.user.toString() !== userId.toString()) {
        res.status(404);
        throw new Error('Session not found or user unauthorized.');
    }

    const questionIdx = parseInt(questionIndex, 10);
    const question = session.questions[questionIdx];

    if (!question) {
        res.status(400);
        throw new Error(`Question at index ${questionIdx} not found.`);
    }
    

    // --- NEW UNIFIED LOGIC ---
    let audioFilePath = null;
    if (req.file) {
        audioFilePath = req.file.path;
    }

    // We no longer error out if one is missing; 
    // we take whatever is provided (audio, code, or both).
    const codeSubmission = code || null;

    // 1. Update status in DB
    question.isSubmitted = true;
    await session.save();

    // 2. Respond immediately
    res.status(202).json({
        message: 'Answer received. Processing asynchronously...',
        status: 'received',
    });

    const io = req.app.get('io');

    // 3. Start AI processing with BOTH potential inputs
    void evaluateAnswerAsync(io, userId, sessionId, questionIdx, audioFilePath, codeSubmission)
        .catch((error) => {
            console.error(`Unexpected evaluation error: ${error.message}`);
            pushSocketUpdate(io, userId, sessionId, 'EVALUATION_FAILED', `Evaluation failed: ${error.message}`);
        });
});

const endSession = asyncHandler(async(req,res)=>{
    const sessionId = req.params.id;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);

    if (!session || session.user.toString() !== userId.toString()) {
        res.status(404);
        throw new Error('Session not found or user unauthorized.');
    }
    const isProcessing = session.questions.some(q => q.isSubmitted && !q.isEvaluated);
    if (isProcessing) {
        res.status(400);
        throw new Error('Cannot end interview while AI is processing answers.');
    }
    if (session.status === 'completed') {
        res.status(400);
        throw new Error('Session is already completed.');
    }

    // Calculate scores for evaluated questions
    const scoreSummary = await calculateOverallScore(sessionId);

    session.overallScore = scoreSummary.overallScore || 0;
    session.status = 'completed';
    session.endTime = new Date();
    session.metrics = {
        avgTechnical: scoreSummary.avgTechnical,
        avgConfidence: scoreSummary.avgConfidence,
    };

    await session.save();

    const io = req.app.get('io');
    pushSocketUpdate(io, userId, sessionId, 'SESSION_COMPLETED', 'Interview session ended early.', session);

    res.json({ message: 'Session ended successfully.', session });
})

export { createSession, getSessions, getSessionById, deleteSession, submitAnswer,endSession,calculateOverallScore };
