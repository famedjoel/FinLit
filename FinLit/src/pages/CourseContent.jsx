/* eslint-disable multiline-ternary */
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext.jsx';
import '../styles/CourseContent.css';

// Set API endpoint base URL using the current protocol and hostname
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

const CourseContent = () => {
  // State variables for tracking UI and API data
  const [markingComplete, setMarkingComplete] = useState(false);
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showTableOfContents, setShowTableOfContents] = useState(true);
  const [progress, setProgress] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useContext(ThemeContext);

  // Retrieve the stored user from local storage when the component mounts
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch course details and chapters from the API
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Attempting to fetch course ${courseId} details`);

        // Fetch course details
        const courseResponse = await fetch(`${API_BASE_URL}/api/courses/${courseId}`);
        console.log(`Course response status: ${courseResponse.status}`);

        if (!courseResponse.ok) {
          throw new Error(`Failed to fetch course details: ${courseResponse.status}`);
        }

        const courseData = await courseResponse.json();
        console.log('Course data received:', courseData);

        // Fetch chapters for the course
        console.log(`Fetching chapters for course ${courseId}`);
        const chaptersResponse = await fetch(`${API_BASE_URL}/api/courses/${courseId}/chapters`);
        console.log(`Chapters response status: ${chaptersResponse.status}`);

        if (!chaptersResponse.ok) {
          throw new Error(`Failed to fetch course chapters: ${chaptersResponse.status}`);
        }

        const chaptersData = await chaptersResponse.json();
        console.log(`Received ${chaptersData.length} chapters`);

        // Combine course data with chapters
        setCurrentCourse({
          ...courseData,
          chapters: chaptersData,
        });

        // If a user is logged in, fetch their progress for the course
        if (user) {
          console.log(`Fetching progress for user ${user.id} and course ${courseId}`);
          const progressResponse = await fetch(`${API_BASE_URL}/api/users/${user.id}/courses/${courseId}/progress`);
          console.log(`Progress response status: ${progressResponse.status}`);

          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            console.log('Progress data received:', progressData);

            if (progressData.enrolled) {
              const progressMap = {};

              // Build a nested progress map for chapters and lessons
              progressData.chapters.forEach(chapter => {
                progressMap[chapter.id] = {};

                chapter.lessons.forEach(lesson => {
                  progressMap[chapter.id][lesson.id] = {
                    visited: lesson.progress.status !== 'not-started',
                    completed: lesson.progress.status === 'completed',
                  };
                });
              });

              setProgress(progressMap);

              // Set the next lesson/chapter indices based on user's progress
              if (progressData.nextLessonId && progressData.nextChapterId) {
                const chapterIndex = chaptersData.findIndex(chapter => chapter.id === progressData.nextChapterId);

                if (chapterIndex >= 0) {
                  const lessonIndex = chaptersData[chapterIndex].lessons.findIndex(lesson => lesson.id === progressData.nextLessonId);

                  if (lessonIndex >= 0) {
                    setCurrentChapterIndex(chapterIndex);
                    setCurrentLessonIndex(lessonIndex);
                  }
                }
              }
            }
          } else {
            console.warn(`Failed to fetch progress: ${progressResponse.status}`);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading course:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  // Fetch the content for the current lesson
  useEffect(() => {
    const fetchLessonContent = async () => {
      if (!currentCourse || !currentCourse.chapters[currentChapterIndex]) {
        return;
      }

      const chapter = currentCourse.chapters[currentChapterIndex];
      if (!chapter.lessons[currentLessonIndex]) {
        return;
      }

      const lessonId = chapter.lessons[currentLessonIndex].id;

      try {
        console.log(`Fetching content for lesson ${lessonId}`);
        const lessonResponse = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`);
        console.log(`Lesson response status: ${lessonResponse.status}`);

        if (!lessonResponse.ok) {
          throw new Error(`Failed to fetch lesson content: ${lessonResponse.status}`);
        }

        const lessonData = await lessonResponse.json();
        console.log('Lesson data received:', lessonData);

        // Merge the fetched lesson data with the current lesson data
        const updatedChapters = [...currentCourse.chapters];
        updatedChapters[currentChapterIndex].lessons[currentLessonIndex] = {
          ...updatedChapters[currentChapterIndex].lessons[currentLessonIndex],
          ...lessonData,
        };

        setCurrentCourse({
          ...currentCourse,
          chapters: updatedChapters,
        });

        // If user is logged in, mark the lesson as visited on the server
        if (user) {
          const chapterId = chapter.id;

          console.log(`Marking lesson ${lessonId} as visited for user ${user.id}`);
          await fetch(`${API_BASE_URL}/api/progress/lesson`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              lessonId,
              status: 'in-progress',
              position: 0,
            }),
          });

          // Update local progress state to reflect the lesson visit
          setProgress(prev => ({
            ...prev,
            [chapterId]: {
              ...prev[chapterId],
              [lessonId]: {
                visited: true,
                completed: true,
              },
            },
          }));
        }
      } catch (err) {
        console.error('Error fetching lesson content:', err);
      }
    };

    fetchLessonContent();
  }, [currentChapterIndex, currentLessonIndex, currentCourse, user]);

  // Navigate to a given lesson/chapter and reset quiz state
  const navigateToLesson = (chapterIndex, lessonIndex) => {
    setCurrentChapterIndex(chapterIndex);
    setCurrentLessonIndex(lessonIndex);
    setShowQuiz(false);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    window.scrollTo(0, 0);
  };

  // Mark current lesson as completed and update progress on the server
  const markLessonCompleted = async () => {
    if (markingComplete) return;

    if (!currentCourse || !currentCourse.chapters[currentChapterIndex]) {
      return;
    }

    const chapter = currentCourse.chapters[currentChapterIndex];
    if (!chapter.lessons[currentLessonIndex]) {
      return;
    }

    const lesson = chapter.lessons[currentLessonIndex];

    try {
      setMarkingComplete(true);

      // Update local progress state
      setProgress(prev => ({
        ...prev,
        [chapter.id]: {
          ...prev[chapter.id],
          [lesson.id]: {
            visited: true,
            completed: true,
          },
        },
      }));

      // Update progress on the server
      if (user) {
        console.log(`Marking lesson ${lesson.id} as completed for user ${user.id}`);
        const lessonResponse = await fetch(`${API_BASE_URL}/api/progress/lesson`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            lessonId: lesson.id,
            status: 'completed',
            position: 100,
          }),
        });

        if (!lessonResponse.ok) {
          throw new Error('Failed to update lesson progress');
        }

        // Calculate overall course progress to update the course progress on the server
        const completedLessonsCount = calculateCompletedLessonsCount();
        const totalLessonsCount = calculateTotalLessonsCount();
        const overallProgress = Math.round((completedLessonsCount / totalLessonsCount) * 100);

        console.log(`Updating course progress: ${overallProgress}% (${completedLessonsCount}/${totalLessonsCount})`);
        const courseResponse = await fetch(`${API_BASE_URL}/progress/course`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            courseId: currentCourse.id,
            title: currentCourse.title,
            progress: overallProgress,
          }),
        });

        if (!courseResponse.ok) {
          throw new Error('Failed to update course progress');
        }

        // Refresh progress data from the server
        const progressResponse = await fetch(`${API_BASE_URL}/api/users/${user.id}/courses/${currentCourse.id}/progress`);
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();

          const serverProgress = {};
          progressData.chapters.forEach(chapter => {
            serverProgress[chapter.id] = {};
            chapter.lessons.forEach(lesson => {
              serverProgress[chapter.id][lesson.id] = {
                visited: lesson.progress.status !== 'not-started',
                completed: lesson.progress.status === 'completed',
              };
            });
          });
          setProgress(serverProgress);
        }
      }

      // If the lesson has a quiz, display quiz UI. Otherwise, navigate to the next lesson.
      if (lesson.quiz) {
        setShowQuiz(true);
        setQuizAnswers(Array(lesson.quiz.questions.length).fill(null));
      } else {
        navigateToNext();
      }
    } catch (err) {
      console.error('Error marking lesson as completed:', err);

      // Roll back local progress update if there is an error
      setProgress(prev => ({
        ...prev,
        [chapter.id]: {
          ...prev[chapter.id],
          [lesson.id]: {
            visited: lesson.id in (prev[chapter.id] || {}),
            completed: false,
          },
        },
      }));

      alert('Failed to mark lesson as completed. Please try again.');
    } finally {
      setMarkingComplete(false);
    }
  };

  // Navigate to the next lesson or chapter or display course completion message
  const navigateToNext = () => {
    if (!currentCourse || !currentCourse.chapters[currentChapterIndex]) {
      return;
    }

    const chapter = currentCourse.chapters[currentChapterIndex];
    if (currentLessonIndex < chapter.lessons.length - 1) {
      navigateToLesson(currentChapterIndex, currentLessonIndex + 1);
    } else if (currentChapterIndex < currentCourse.chapters.length - 1) {
      navigateToLesson(currentChapterIndex + 1, 0);
    } else {
      alert("Congratulations! You've completed the course!");
    }
  };

  // Calculate total number of lessons in the course
  const calculateTotalLessonsCount = () => {
    if (!currentCourse) return 0;

    let totalLessons = 0;
    currentCourse.chapters.forEach(chapter => {
      totalLessons += chapter.lessons.length;
    });

    return totalLessons;
  };

  // Calculate total number of completed lessons
  const calculateCompletedLessonsCount = () => {
    if (!currentCourse) return 0;

    let completedLessons = 0;
    currentCourse.chapters.forEach(chapter => {
      chapter.lessons.forEach(lesson => {
        if (progress[chapter.id]?.[lesson.id]?.completed) {
          completedLessons++;
        }
      });
    });

    return completedLessons;
  };

  // Handle quiz option selection; only allow changes before the quiz is submitted
  const handleQuizAnswerSelect = (questionIndex, answerIndex) => {
    if (!quizSubmitted) {
      const newAnswers = [...quizAnswers];
      newAnswers[questionIndex] = answerIndex;
      setQuizAnswers(newAnswers);
    }
  };

  // Submit the quiz answers to the server and calculate the score
  const submitQuiz = async () => {
    // Ensure all quiz questions have been answered
    if (quizAnswers.includes(null)) {
      alert('Please answer all questions before submitting.');
      return;
    }

    const lesson = currentCourse.chapters[currentChapterIndex].lessons[currentLessonIndex];

    try {
      if (user && lesson.quiz) {
        console.log(`Submitting quiz ${lesson.quiz.id} for user ${user.id}`);
        const response = await fetch(`${API_BASE_URL}/api/progress/quiz`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            quizId: lesson.quiz.id,
            answers: quizAnswers,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Quiz result:', result);
          setQuizScore(result.score);
          setQuizSubmitted(true);

          return;
        } else {
          console.error('Error submitting quiz:', await response.text());
        }
      }

      // Fallback: calculate score locally if server submission fails
      let score = 0;
      quizAnswers.forEach((answer, index) => {
        if (answer.toString() === lesson.quiz.questions[index].correctAnswer.toString()) {
          score++;
        }
      });

      const percentage = Math.round((score / lesson.quiz.questions.length) * 100);
      setQuizScore(percentage);
      setQuizSubmitted(true);
    } catch (err) {
      console.error('Error submitting quiz:', err);

      // Fallback: calculate score locally on error
      let score = 0;
      quizAnswers.forEach((answer, index) => {
        if (answer.toString() === lesson.quiz.questions[index].correctAnswer.toString()) {
          score++;
        }
      });

      const percentage = Math.round((score / lesson.quiz.questions.length) * 100);
      setQuizScore(percentage);
      setQuizSubmitted(true);
    }
  };

  // Calculate the overall progress for the course
  const calculateOverallProgress = () => {
    if (!currentCourse) return 0;

    const completedLessons = calculateCompletedLessonsCount();
    const totalLessons = calculateTotalLessonsCount();

    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // Check if a specific lesson has been completed
  const isLessonCompleted = (chapterId, lessonId) => {
    return progress[chapterId]?.[lessonId]?.completed || false;
  };

  // Render content for the current lesson or quiz if available
  const renderLessonContent = () => {
    if (!currentCourse || !currentCourse.chapters[currentChapterIndex]) {
      return <div>Loading course content...</div>;
    }

    const chapter = currentCourse.chapters[currentChapterIndex];
    if (!chapter.lessons[currentLessonIndex]) {
      return <div>Lesson not found</div>;
    }

    const lesson = chapter.lessons[currentLessonIndex];

    return (
      <div className="lesson-content">
        {showQuiz && lesson.quiz ? (
          <div className="quiz-container">
            <h2>Lesson Quiz</h2>
            <p>Test your knowledge of the concepts covered in this lesson.</p>

            {lesson.quiz.questions.map((quizItem, questionIndex) => (
              <div className="quiz-question" key={questionIndex}>
                <h3>Question {questionIndex + 1}:</h3>
                <p>{quizItem.question}</p>
                <div className="quiz-options">
                  {quizItem.options.map((option, answerIndex) => (
                    <div
                      key={answerIndex}
                      className={`quiz-option ${quizAnswers[questionIndex] === answerIndex ? 'selected' : ''} 
                                 ${quizSubmitted && quizItem.correctAnswer.toString() === answerIndex.toString() ? 'correct' : ''} 
                                 ${quizSubmitted && quizAnswers[questionIndex] === answerIndex && quizItem.correctAnswer.toString() !== answerIndex.toString() ? 'incorrect' : ''}`}
                      onClick={() => handleQuizAnswerSelect(questionIndex, answerIndex)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                {quizSubmitted && (
                  <div className="explanation">
                    <strong>Explanation:</strong> {quizItem.explanation}
                  </div>
                )}
              </div>
            ))}

            {quizSubmitted
              ? (
              <div className="quiz-results">
                <h3>Quiz Results</h3>
                <div className="quiz-score">
                  <span>Your Score: </span>
                  <span className={quizScore >= 70 ? 'passing-score' : 'failing-score'}>{quizScore}%</span>
                </div>

                {quizScore >= 70
                  ? (
                  <div className="quiz-pass-message">
                    <p>Congratulations! You&apos;ve passed the quiz.</p>
                    <button className="primary-button" onClick={navigateToNext}>
                      Continue to Next Lesson
                    </button>
                  </div>
                    )
                  : (
                  <div className="quiz-fail-message">
                    <p>You might want to review this lesson before continuing.</p>
                    <div className="quiz-actions">
                      <button className="secondary-button" onClick={() => setShowQuiz(false)}>
                        Review Lesson
                      </button>
                      <button
                        className="primary-button"
                        onClick={() => {
                          setQuizAnswers(Array(lesson.quiz.questions.length).fill(null));
                          setQuizSubmitted(false);
                        }}
                      >
                        Retry Quiz
                      </button>
                    </div>
                  </div>
                    )}
              </div>
                )
              : (
              <button
                className="primary-button"
                onClick={submitQuiz}
                disabled={quizAnswers.includes(null)}
              >
                Submit Answers
              </button>
                )}
          </div>
        ) : (
          <>
            {/* Render lesson content using dangerouslySetInnerHTML */}
            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />

            <div className="lesson-navigation">
              <button
                className="secondary-button"
                onClick={() => {
                  if (currentLessonIndex > 0) {
                    navigateToLesson(currentChapterIndex, currentLessonIndex - 1);
                  } else if (currentChapterIndex > 0) {
                    const prevChapter = currentCourse.chapters[currentChapterIndex - 1];
                    navigateToLesson(currentChapterIndex - 1, prevChapter.lessons.length - 1);
                  }
                }}
                disabled={currentChapterIndex === 0 && currentLessonIndex === 0}
              >
                Previous
              </button>

              <button className="primary-button" onClick={markLessonCompleted} disabled={markingComplete}>
                {markingComplete
                  ? 'Saving...'
                  : (isLessonCompleted(chapter.id, lesson.id)
                      ? 'Continue to Next'
                      : 'Mark as Completed')}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Display loading state while API calls are in progress
  if (loading) {
    return <div className="loading">Loading course...</div>;
  }

  // Display error message if there was an error fetching data
  if (error) {
    return (
      <div className="course-error">
        <h2>Error Loading Course</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/courses')} className="secondary-button">
          Back to Courses
        </button>
      </div>
    );
  }

  // Fallback if no course data is available
  if (!currentCourse) {
    return <div className="loading">Course not found</div>;
  }

  return (
    <div className={`course-content-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="course-header">
        <h1>{currentCourse.title}</h1>
        <div className="course-progress-container">
          <div className="course-progress-bar">
            <div
              className="course-progress-fill"
              style={{ width: `${calculateOverallProgress()}%` }}
            ></div>
          </div>
          <span className="course-progress-text">{calculateOverallProgress()}% Complete</span>
        </div>
      </div>

      <div className="course-layout">
        {/* Toggle button for table of contents */}
        <button
          className="toc-toggle"
          onClick={() => setShowTableOfContents(!showTableOfContents)}
        >
          {showTableOfContents ? '« Hide Contents' : '» Show Contents'}
        </button>

        <div className={`course-sidebar ${showTableOfContents ? 'visible' : 'hidden'}`}>
          <div className="table-of-contents">
            <h2>Table of Contents</h2>
            {currentCourse.chapters.map((chapter, chapterIndex) => (
              <div key={chapter.id} className="toc-chapter">
                <div className="toc-chapter-title">
                  <h3>{chapter.title}</h3>
                </div>
                <ul className="toc-lessons">
                  {chapter.lessons.map((lesson, lessonIndex) => (
                    <li
                      key={lesson.id}
                      className={`toc-lesson ${currentChapterIndex === chapterIndex && currentLessonIndex === lessonIndex ? 'active' : ''} 
                                 ${isLessonCompleted(chapter.id, lesson.id) ? 'completed' : ''}`}
                      onClick={() => navigateToLesson(chapterIndex, lessonIndex)}
                    >
                      <span className="lesson-title">{lesson.title}</span>
                      {isLessonCompleted(chapter.id, lesson.id) && <span className="completion-icon">✓</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="course-main-content">
          {renderLessonContent()}
        </div>
      </div>
    </div>
  );
};

export default CourseContent;
