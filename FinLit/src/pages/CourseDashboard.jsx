import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Get the current hostname for API calls (works on all devices)
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

function CourseDashboard() {
  const initialCourses = [
    { courseId: "course1", title: "Beginner Finance", level: "Beginner", progress: 0, 
      description: "Learn the basics of personal finance, budgeting, and saving." },
    { courseId: "course2", title: "Investment Basics", level: "Intermediate", progress: 0,
      description: "Understand investment vehicles, risk management, and portfolio building." },
    { courseId: "course3", title: "Advanced Trading", level: "Advanced", progress: 0,
      description: "Master complex trading strategies, technical analysis, and market psychology." },
  ];

  const [courses, setCourses] = useState(initialCourses);
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in and fetch course progress
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchUserProgress(userData.id);
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProgress = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user progress");
      }
      
      const data = await response.json();
      
      // Update course progress if user has previous progress
      if (data.courseProgress && data.courseProgress.length > 0) {
        const updatedCourses = initialCourses.map(course => {
          const userCourse = data.courseProgress.find(c => c.courseId === course.courseId);
          if (userCourse) {
            return { ...course, progress: userCourse.progress };
          }
          return course;
        });
        setCourses(updatedCourses);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      setLoading(false);
    }
  };

  const updateCourseProgress = async (courseId, title, newProgress) => {
    if (!user) return; // Only track if user is logged in
    
    try {
      const response = await fetch(`${API_BASE_URL}/progress/course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          courseId,
          title,
          progress: newProgress
        }),
      });
      
      if (!response.ok) {
        console.error("Error updating course progress");
      }
      
      // Update local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.courseId === courseId 
            ? { ...course, progress: newProgress } 
            : course
        )
      );
    } catch (error) {
      console.error("Failed to update course progress:", error);
    }
  };

  const handleContinueCourse = (course) => {
    // Simulate progress when continuing a course (in a real app, this would be based on actual lesson completion)
    const newProgress = Math.min(course.progress + 25, 100);
    updateCourseProgress(course.courseId, course.title, newProgress);
  };

  const handleStartCourse = (course) => {
    // Start the course with initial progress
    updateCourseProgress(course.courseId, course.title, 10);
  };

  const filteredCourses = selectedLevel === "All"
    ? courses
    : courses.filter(course => course.level === selectedLevel);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h2>📚 Explore Our Courses</h2>
      
      <div className="filter-buttons">
        {["All", "Beginner", "Intermediate", "Advanced"].map(level => (
          <button 
            key={level} 
            className={`btn-filter ${selectedLevel === level ? 'active' : ''}`} 
            onClick={() => setSelectedLevel(level)}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="course-list">
        {filteredCourses.map((course) => (
          <div key={course.courseId} className="course-card">
            <h3>{course.title}</h3>
            <p className="course-level">Level: {course.level}</p>
            <p className="course-description">{course.description}</p>
            
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress" style={{ width: `${course.progress}%` }}></div>
              </div>
              <span className="progress-text">{course.progress}% Complete</span>
            </div>
            
            {user ? (
              course.progress > 0 ? (
                <button 
                  className="btn-continue" 
                  onClick={() => handleContinueCourse(course)}
                >
                  Continue Course
                </button>
              ) : (
                <button 
                  className="btn-start" 
                  onClick={() => handleStartCourse(course)}
                >
                  Start Course
                </button>
              )
            ) : (
              <Link to="/login" className="btn-login-prompt">
                Login to track progress
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseDashboard;