/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext.jsx';

// Build API base URL using current protocol and hostname, with a fixed port 7900.
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

function CourseDashboard() {
  // State variables for courses list, selected filter level, user info, loading status, and error message.
  const [courses, setCourses] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Access the current theme from ThemeContext.
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    // Retrieve user information from localStorage when component mounts.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch courses whenever the component mounts or selectedLevel changes.
    fetchCourses();
  }, [selectedLevel]);

  // Function to fetch courses and possibly course progress for a logged-in user.
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch list of courses from the API.
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const coursesData = await response.json();

      // If a user is logged in, fetch progress data for each course.
      if (user) {
        console.log('Fetching course progress for user:', user.id);

        const coursesWithProgress = await Promise.all(
          coursesData.map(async (course) => {
            try {
              // Fetch course progress for current user.
              const progressResponse = await fetch(
                `${API_BASE_URL}/api/users/${user.id}/courses/${course.id}/progress`,
                {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                },
              );

              console.log(`Progress response for course ${course.id}:`, progressResponse.status);

              if (progressResponse.ok) {
                const progressData = await progressResponse.json();
                console.log(`Progress data for course ${course.id}:`, progressData);

                // Return course data along with progress, status, and enrolment information.
                return {
                  ...course,
                  progress: progressData.progress || 0,
                  status: progressData.status || 'not-started',
                  enrolled: progressData.enrolled || false,
                };
              }

              // If progress data is not available, return the original course data.
              return course;
            } catch (err) {
              console.error(`Error fetching progress for course ${course.id}:`, err);
              return course;
            }
          }),
        );

        // Update courses state with progress-enhanced courses.
        setCourses(coursesWithProgress);
      } else {
        // If no user is logged in, simply update courses state.
        setCourses(coursesData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Display a loading spinner when data is being fetched.
  if (loading) {
    return (
      <div className={`courses-dashboard ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  // Display error message and retry button if there is an error.
  if (error) {
    return (
      <div className={`courses-dashboard ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="error-message">
          <h3>Error Loading Courses</h3>
          <p>{error}</p>
          <button onClick={fetchCourses} className="retry-btn">Try Again</button>
        </div>
      </div>
    );
  }

  // Filter courses based on the selected level.
  const filteredCourses = selectedLevel === 'All'
    ? courses
    : courses.filter(course => course.level === selectedLevel);

  return (
    <div className={`courses-dashboard ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="courses-header">
        <h2>📚 Financial Education Courses</h2>
        <p className="courses-intro">
          Explore our comprehensive financial literacy courses designed to help you build a solid financial foundation and reach your goals.
        </p>
      </div>

      {/* Render filter buttons for course levels */}
      <div className="filter-buttons">
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map(level => (
          <button
            key={level}
            className={`btn-filter ${selectedLevel === level ? 'active' : ''}`}
            onClick={() => setSelectedLevel(level)}
          >
            {level}
          </button>
        ))}
      </div>

      {/* If there are filtered courses, render them; otherwise, show 'no courses found' message */}
      {filteredCourses.length > 0
        ? (
          <div className="course-list">
            {filteredCourses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-image-container">
                  <div className="course-image" style={{ backgroundImage: `url(${course.imageUrl || '/images/courses/default.jpg'})` }}></div>
                  <div className="course-level-badge">{course.level}</div>
                </div>

                <div className="course-details">
                  <h3>{course.title}</h3>
                  <p className="course-description">{course.description}</p>

                  {/* Display course statistics */}
                  <div className="course-stats">
                    <div className="stat-item">
                      <span className="stat-icon">📚</span>
                      <span className="stat-text">{course.chaptersCount} Chapters</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📝</span>
                      <span className="stat-text">{course.lessonsCount} Lessons</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">⏱️</span>
                      <span className="stat-text">{course.estimatedHours} Hours</span>
                    </div>
                  </div>

                  {/* Display course progress */}
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div className="progress" style={{ width: `${course.progress || 0}%` }}></div>
                    </div>
                    <span className="progress-text">{course.progress || 0}% Complete</span>
                  </div>

                  {/* Show different call-to-action links based on user login and progress */}
                  {user
                    ? (
                        course.progress > 0
                          ? (
                              <Link
                                to={`/courses/${course.id}`}
                                className="btn-continue"
                              >
                                Continue Course
                              </Link>
                            )
                          : (
                              <Link
                                to={`/courses/${course.id}`}
                                className="btn-start"
                              >
                                Start Course
                              </Link>
                            )
                      )
                    : (
                        <Link to="/login" className="btn-login-prompt">
                          Login to track progress
                        </Link>
                      )}
                </div>
              </div>
            ))}
          </div>
          )
        : (
          <div className="no-courses">
            <p>No courses found for the selected filter. Please try another category.</p>
          </div>
          )}
    </div>
  );
}

export default CourseDashboard;
