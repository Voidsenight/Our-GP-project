import type { Request, Response } from "express";
import Quiz from "../models/Quiz";
import QuizResult from "../models/QuizResult";
import Video from "../models/Video";

import Course from "../models/Course"; // Added Course import

// Create Quiz (Teacher)
export const createQuiz = async (req: Request, res: Response) => {
  try {
    const { title, courseId, videoId, questions } = req.body;
    const teacherId = (req as any).auth.userId;

    // Verify video exists
    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    // Verify course belongs to this teacher
    const course = await Course.findOne({ _id: courseId, teacherId });
    if (!course) {
      res
        .status(403)
        .json({ message: "Forbidden: You do not own the parent course" });
      return;
    }

    // Verify video actually belongs to this course
    if (video.courseId?.toString() !== courseId) {
      res
        .status(400)
        .json({
          message: "Bad Request: Video does not belong to the specified course",
        });
      return;
    }

    const quiz = await Quiz.create({
      title,
      courseId,
      videoId,
      teacherId,
      questions,
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error("Create Quiz Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Quizzes for a specific Video (Student/Teacher)
export const getQuizzesByVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const quizzes = await Quiz.find({ videoId });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Specific Quiz (Student) - Exclude correct answers?
// Actually, detailed view might be needed.
// For taking the quiz, we might want to hide correct answers if the frontend isn't trusted.
// But for simplicity, we send the whole object and frontend handles display.
export const getQuizById = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Submit Quiz (Student)
export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of { questionIndex, selectedOptionIndex }
    const studentId = (req as any).auth.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

    let score = 0;
    const totalQuestions = quiz.questions.length;
    const resultAnswers = [];
    const processedQuestions = new Set<number>();

    for (const ans of answers) {
      if (processedQuestions.has(ans.questionIndex)) {
        continue; // Prevent submitting multiple answers for the same question
      }
      processedQuestions.add(ans.questionIndex);

      const question = quiz.questions[ans.questionIndex];
      if (!question) {
        continue; // Skip invalid questions
      }
      const isCorrect = question.correctAnswerIndex === ans.selectedOptionIndex;
      if (isCorrect) score++;

      resultAnswers.push({
        questionIndex: ans.questionIndex,
        selectedOptionIndex: ans.selectedOptionIndex,
        isCorrect,
      });
    }

    const result = await QuizResult.create({
      quizId,
      studentId,
      score,
      totalQuestions,
      answers: resultAnswers,
    });

    res.json(result);
  } catch (error) {
    console.error("Submit Quiz Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Results (Student - history)
export const getQuizResults = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const studentId = (req as any).auth.userId;

    const results = await QuizResult.find({ quizId, studentId }).sort({
      completedAt: -1,
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
