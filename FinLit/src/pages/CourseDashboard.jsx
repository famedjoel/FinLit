function CourseDashboard() {
    const courses = [
      { title: "Beginner Finance", level: "Beginner" },
      { title: "Investment Basics", level: "Intermediate" },
      { title: "Advanced Trading", level: "Advanced" },
    ];
  
    return (
      <div className="dashboard-container">
        <h2>Explore Our Courses</h2>
        <div className="course-list">
          {courses.map((course, index) => (
            <div key={index} className="course-card">
              <h3>{course.title}</h3>
              <p>Level: {course.level}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  export default CourseDashboard;
  