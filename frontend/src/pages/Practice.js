import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiCheckCircle, FiXCircle, FiAward } from 'react-icons/fi';
import './Practice.css';

const Practice = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [examComplete, setExamComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const startExam = async (courseId) => {
    try {
      setLoading(true);
      const response = await api.get(`/questions/course/${courseId}`);
      setQuestions(response.data.data);
      setSelectedCourse(courseId);
      setCurrentQuestionIndex(0);
      setScore(0);
      setAnswers([]);
      setExamComplete(false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    try {
      const response = await api.post(
        `/questions/${questions[currentQuestionIndex]._id}/check`,
        { answer: selectedAnswer }
      );

      setShowResult(true);
      setAnswers([...answers, response.data.data]);

      if (response.data.data.isCorrect) {
        setScore(score + 1);
      }
    } catch (error) {
      console.error('Error checking answer:', error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setExamComplete(true);
    }
  };

  const resetExam = () => {
    setSelectedCourse(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setExamComplete(false);
  };

  if (loading) {
    return (
      <div className="practice-container">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (examComplete) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="practice-container">
        <div className="container">
          <div className="exam-results">
            <FiAward size={64} className="result-icon" />
            <h1>Exam Complete!</h1>
            <div className="score-display">
              <span className="score-number">{score}</span>
              <span className="score-total">/ {questions.length}</span>
            </div>
            <div className="percentage-display">
              {percentage.toFixed(0)}% Score
            </div>
            <div className="result-message">
              {percentage >= 70 ? (
                <p className="text-success">Great job! You passed!</p>
              ) : (
                <p className="text-warning">Keep practicing to improve!</p>
              )}
            </div>
            <button onClick={resetExam} className="btn btn-primary">
              Take Another Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="practice-container">
        <div className="container">
          <div className="practice-header">
            <h1>Practice Exam</h1>
            <p>Select a course to start practicing</p>
          </div>

          <div className="grid grid-3">
            {courses.map((course) => (
              <div key={course._id} className="practice-course-card">
                <h3>{course.courseCode}</h3>
                <p>{course.courseName}</p>
                <button
                  onClick={() => startExam(course._id)}
                  className="btn btn-primary"
                >
                  Start Practice
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="practice-container">
        <div className="container">
          <div className="no-questions">
            <p>No practice questions available for this course yet.</p>
            <button onClick={resetExam} className="btn btn-secondary">
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="practice-container">
      <div className="container">
        <div className="exam-header">
          <div className="exam-progress">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>Score: {score}/{currentQuestionIndex}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="question-card">
          <h2 className="question-text">{currentQuestion.questionText}</h2>

          <div className="options-list">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${selectedAnswer === index ? 'selected' : ''} ${
                  showResult
                    ? answers[currentQuestionIndex]?.correctAnswer === index
                      ? 'correct'
                      : selectedAnswer === index
                      ? 'incorrect'
                      : ''
                    : ''
                }`}
                onClick={() => !showResult && handleAnswerSelect(index)}
                disabled={showResult}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
                {showResult && answers[currentQuestionIndex]?.correctAnswer === index && (
                  <FiCheckCircle className="option-icon correct-icon" />
                )}
                {showResult &&
                  selectedAnswer === index &&
                  answers[currentQuestionIndex]?.correctAnswer !== index && (
                    <FiXCircle className="option-icon incorrect-icon" />
                  )}
              </button>
            ))}
          </div>

          {showResult && (
            <div className={`result-feedback ${answers[currentQuestionIndex]?.isCorrect ? 'correct' : 'incorrect'}`}>
              {answers[currentQuestionIndex]?.isCorrect ? (
                <p><FiCheckCircle /> Correct! Well done!</p>
              ) : (
                <p><FiXCircle /> {answers[currentQuestionIndex]?.explanation}</p>
              )}
            </div>
          )}

          <div className="question-actions">
            {!showResult ? (
              <button
                onClick={handleSubmitAnswer}
                className="btn btn-primary"
                disabled={selectedAnswer === null}
              >
                Submit Answer
              </button>
            ) : (
              <button onClick={handleNextQuestion} className="btn btn-primary">
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Exam'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
