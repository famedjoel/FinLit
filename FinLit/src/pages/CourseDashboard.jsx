import { useState } from "react";

function CourseDashboard() {
  const courses = [
    { title: "Beginner Finance", level: "Beginner", progress: 30 },
    { title: "Investment Basics", level: "Intermediate", progress: 50 },
    { title: "Advanced Trading", level: "Advanced", progress: 70 },
  ];

  const [selectedLevel, setSelectedLevel] = useState("All");

  const filteredCourses = selectedLevel === "All"
    ? courses
    : courses.filter(course => course.level === selectedLevel);

  return (
    <div className="dashboard-container">
      <h2>📚 Explore Our Courses</h2>
      
      <div className="filter-buttons">
        {["All", "Beginner", "Intermediate", "Advanced"].map(level => (
          <button key={level} className="btn-filter" onClick={() => setSelectedLevel(level)}>
            {level}
          </button>
        ))}
      </div>

      <div className="course-list">
        {filteredCourses.map((course, index) => (
          <div key={index} className="course-card">
            <h3>{course.title}</h3>
            <p>Level: {course.level}</p>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${course.progress}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseDashboard;
