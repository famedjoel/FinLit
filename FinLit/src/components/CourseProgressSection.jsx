/* eslint-disable no-unused-vars */
import React from 'react';
import { Link } from 'react-router-dom';

// Component to display the user's course progress
const CourseProgressSection = ({ courseProgress }) => {
  // If no course progress data is available, show a message with a link to browse courses
  if (!courseProgress || courseProgress.length === 0) {
    return (
      <div className="progress-section">
        <h3>Your Courses</h3>
        <p className="no-data">No courses in progress yet. Start learning today!</p>
        <Link to="/courses" className="browse-courses-btn">Browse Courses</Link>
      </div>
    );
  }

  // If course progress data exists, render each course's progress
  return (
    <div className="progress-section">
      <h3>Your Learning Progress</h3>
      <div className="courses-list">
        {courseProgress.map((course, index) => (
          // Render individual course progress item
          <div key={index} className="course-item">
            <div className="course-info">
              <span className="course-title">{course.title}</span>
              <span className="course-progress">{course.progress}%</span>
            </div>
            <div className="course-progress-bar">
              <div
                className="course-progress-fill"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
            <Link to={`/courses/${course.courseId}`} className="continue-btn">
              {course.progress > 0 ? 'Continue' : 'Start'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export the component for use in other modules
export default CourseProgressSection;
