import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import PropTypes from 'prop-types';

const DashboardCourseItem = ({ course }) => {
  const { theme } = useContext(ThemeContext);
  
  return (
    <div className={`dashboard-course-item ${theme === "dark" ? "dark-theme" : ""}`}>
      <h3 className="dashboard-course-title">{course.title}</h3>
      <span className="dashboard-course-progress">{course.progress}%</span>
      
      <div className="dashboard-progress-bar">
        <div 
          className="dashboard-progress-fill" 
          style={{ width: `${course.progress}%` }}
        ></div>
      </div>
      
      <Link 
        to={`/courses/${course.courseId}`} 
        className="dashboard-continue-btn"
      >
        {course.progress > 0 ? 'Continue' : 'Start'}
      </Link>
    </div>
  );
};

DashboardCourseItem.propTypes = {
  course: PropTypes.shape({
    courseId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired
  }).isRequired
};

export default DashboardCourseItem;