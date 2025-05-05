import { connect } from './sqlite-adapter.js';
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';

// Initialize sample course data
export async function initSampleCourseData() {
  try {
    const connection = await connect();

    // Check if we already have courses in the database
    const existingCourses = await connection.all('SELECT * FROM courses');

    if (existingCourses && existingCourses.length > 0) {
      console.log(`Database already contains ${existingCourses.length} courses.`);
      return;
    }

    console.log('Initializing sample course data...');

    // Create sample courses
    const course1 = await Course.create({
      title: 'Personal Finance Fundamentals',
      description: 'Learn the basics of personal finance, budgeting, and saving.',
      level: 'Beginner',
      imageUrl: '/images/courses/personal-finance.jpg',
      chaptersCount: 2,
      lessonsCount: 4,
      estimatedHours: 4.5,
      status: 'published',
    });

    const course2 = await Course.create({
      title: 'Investment Basics',
      description: 'Understand investment vehicles, risk management, and portfolio building.',
      level: 'Intermediate',
      imageUrl: '/images/courses/investments.jpg',
      chaptersCount: 2,
      lessonsCount: 4,
      estimatedHours: 6,
      status: 'published',
    });

    const course3 = await Course.create({
      title: 'Advanced Trading Strategies',
      description: 'Master complex trading strategies, technical analysis, and market psychology.',
      level: 'Advanced',
      imageUrl: '/images/courses/trading.jpg',
      chaptersCount: 1,
      lessonsCount: 2,
      estimatedHours: 8,
      status: 'published',
    });

    // Create chapters for Course 1
    const c1ch1 = await Chapter.create({
      courseId: course1.id,
      title: 'Understanding Personal Finance',
      description: 'An introduction to personal finance concepts',
      order: 0,
    });

    const c1ch2 = await Chapter.create({
      courseId: course1.id,
      title: 'Building a Budget',
      description: 'Learn how to create and manage a budget',
      order: 1,
    });

    // Create lessons for Chapter 1 of Course 1
    const c1ch1l1 = await Lesson.create({
      chapterId: c1ch1.id,
      title: 'What is Personal Finance?',
      content: `
        <h2>What is Personal Finance?</h2>
        <p>Personal finance refers to managing your money and planning for your financial future. It encompasses a wide range of activities including:</p>
        <ul>
          <li>Budgeting and tracking expenses</li>
          <li>Saving for short and long-term goals</li>
          <li>Managing debt responsibly</li>
          <li>Planning for retirement</li>
          <li>Making investment decisions</li>
          <li>Protecting your assets through insurance</li>
        </ul>
        
        <h3>Why Personal Finance Matters</h3>
        <p>Taking control of your personal finances allows you to:</p>
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon">💰</div>
            <h4>Financial Security</h4>
            <p>Build safety nets for emergencies and unexpected expenses</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">🏖️</div>
            <h4>Life Goals</h4>
            <p>Fund important life milestones like education, home ownership, or travel</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">😌</div>
            <h4>Peace of Mind</h4>
            <p>Reduce stress and anxiety related to money matters</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">🚀</div>
            <h4>Opportunity</h4>
            <p>Create freedom and options for your future self</p>
          </div>
        </div>
        
        <div class="key-concept">
          <h3>Key Concept: Financial Literacy</h3>
          <p>Financial literacy is the ability to understand and effectively use various financial skills, including personal financial management, budgeting, and investing. The foundation of smart financial decisions is knowledge.</p>
        </div>
        
        <h3>The Personal Finance Roadmap</h3>
        <p>Throughout this course, we'll cover the essential components of personal finance in a logical order:</p>
        <ol>
          <li><strong>Financial assessment</strong> - Understanding your current situation</li>
          <li><strong>Budgeting</strong> - Creating and maintaining a budget</li>
          <li><strong>Emergency fund</strong> - Building financial safety nets</li>
          <li><strong>Debt management</strong> - Strategies for handling debt</li>
          <li><strong>Saving and investing</strong> - Growing your wealth</li>
          <li><strong>Financial protection</strong> - Insurance and estate planning</li>
        </ol>
        
        <div class="interactive-element">
          <h4>Self Assessment: Your Financial Health</h4>
          <p>Rate yourself on a scale of 1-5 in these areas of personal finance:</p>
          <div class="assessment-grid">
            <div class="assessment-item">
              <span>I regularly track my expenses</span>
              <div class="rating-scale">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
            <div class="assessment-item">
              <span>I have a budget that I follow</span>
              <div class="rating-scale">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
            <div class="assessment-item">
              <span>I have an emergency fund</span>
              <div class="rating-scale">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
            <div class="assessment-item">
              <span>I save regularly for future goals</span>
              <div class="rating-scale">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
          </div>
          <p class="assessment-note">Your honest self-assessment will help you identify areas for improvement as you progress through this course.</p>
        </div>
        
        <div class="resource-download">
          <h4>Downloadable Resource</h4>
          <p>Get our Personal Finance Checklist to help you track your progress throughout this course.</p>
          <button class="download-btn">Download PDF</button>
        </div>
      `,
      resources: [
        {
          title: 'Personal Finance Checklist',
          type: 'pdf',
          url: '/resources/personal-finance-checklist.pdf',
        },
      ],
      order: 0,
      estimatedMinutes: 20,
    });

    // Create quiz for the first lesson
    await Quiz.create({
      lessonId: c1ch1l1.id,
      title: 'Personal Finance Basics Quiz',
      instructions: 'Test your understanding of personal finance basics.',
      passingScore: 70,
      questions: [
        {
          type: 'multiple-choice',
          question: 'What does personal finance encompass?',
          options: [
            'Only budgeting and saving money',
            'Only investing in the stock market',
            'Managing money, planning for the future, and making financial decisions',
            'Just learning about taxes and retirement',
          ],
          correctAnswer: '2',
          explanation: 'Personal finance covers a wide range of activities including budgeting, saving, investing, debt management, and retirement planning.',
        },
        {
          type: 'multiple-choice',
          question: 'Why is financial literacy important?',
          options: [
            "It's only important for wealthy individuals",
            'It helps you make informed financial decisions',
            "It's only relevant when applying for loans",
            'It only matters for business owners',
          ],
          correctAnswer: '1',
          explanation: 'Financial literacy is important because it provides the knowledge and skills needed to make informed financial decisions throughout your life.',
        },
      ],
    });

    // Create second lesson for Chapter 1 of Course 1
    const c1ch1l2 = await Lesson.create({
      chapterId: c1ch1.id,
      title: 'Setting Financial Goals',
      content: `
        <h2>Setting Financial Goals</h2>
        <p>Clear financial goals are the foundation of successful personal finance management. Well-defined goals give you direction and motivation to make smart financial decisions.</p>
        
        <h3>Types of Financial Goals</h3>
        <p>Financial goals are commonly categorized by timeframe:</p>
        
        <div class="goals-container">
          <div class="goal-category">
            <h4><span class="goal-icon">🕐</span> Short-Term Goals (under 1 year)</h4>
            <ul>
              <li>Building an emergency fund</li>
              <li>Paying off small debts</li>
              <li>Saving for a vacation</li>
              <li>Making a major purchase (appliance, electronics)</li>
            </ul>
          </div>
          
          <div class="goal-category">
            <h4><span class="goal-icon">📅</span> Medium-Term Goals (1-5 years)</h4>
            <ul>
              <li>Saving for a down payment on a house</li>
              <li>Paying off student loans</li>
              <li>Saving for a wedding</li>
              <li>Starting a business</li>
            </ul>
          </div>
          
          <div class="goal-category">
            <h4><span class="goal-icon">🔮</span> Long-Term Goals (5+ years)</h4>
            <ul>
              <li>Retirement planning</li>
              <li>Paying off a mortgage</li>
              <li>Funding children's education</li>
              <li>Achieving financial independence</li>
            </ul>
          </div>
        </div>
        
        <h3>The SMART Framework for Financial Goals</h3>
        <p>Effective financial goals should follow the SMART framework:</p>
        
        <div class="smart-goals">
          <div class="smart-item">
            <div class="smart-letter">S</div>
            <div class="smart-content">
              <h4>Specific</h4>
              <p>Clearly define what you want to accomplish</p>
              <p class="example">Instead of "save more money," try "save $5,000"</p>
            </div>
          </div>
          
          <div class="smart-item">
            <div class="smart-letter">M</div>
            <div class="smart-content">
              <h4>Measurable</h4>
              <p>Set concrete criteria to track your progress</p>
              <p class="example">Track your savings balance to see growth</p>
            </div>
          </div>
          
          <div class="smart-item">
            <div class="smart-letter">A</div>
            <div class="smart-content">
              <h4>Achievable</h4>
              <p>Make sure your goal is realistic given your resources</p>
              <p class="example">Setting aside $200 monthly is more realistic than $2,000 if your income is $3,000/month</p>
            </div>
          </div>
          
          <div class="smart-item">
            <div class="smart-letter">R</div>
            <div class="smart-content">
              <h4>Relevant</h4>
              <p>Ensure your goal aligns with your values and life plan</p>
              <p class="example">If travel matters to you, saving for trips makes sense</p>
            </div>
          </div>
          
          <div class="smart-item">
            <div class="smart-letter">T</div>
            <div class="smart-content">
              <h4>Time-bound</h4>
              <p>Set a deadline to create urgency and focus</p>
              <p class="example">"Save $5,000 by December 31st next year"</p>
            </div>
          </div>
        </div>
        
        <div class="interactive-element">
          <h3>Exercise: Create Your Own SMART Financial Goal</h3>
          <p>Fill in the following sections to create a SMART financial goal:</p>
          
          <div class="goal-worksheet">
            <div class="worksheet-section">
              <label>I want to save/pay off</label>
              <input type="text" placeholder="$amount or item" />
            </div>
            
            <div class="worksheet-section">
              <label>For the purpose of</label>
              <input type="text" placeholder="specific purpose" />
            </div>
            
            <div class="worksheet-section">
              <label>By setting aside</label>
              <input type="text" placeholder="$amount" />
              <select>
                <option>per week</option>
                <option>per month</option>
              </select>
            </div>
            
            <div class="worksheet-section">
              <label>I will achieve this goal by</label>
              <input type="date" />
            </div>
            
            <button class="goal-save-btn">Save My Goal</button>
          </div>
        </div>
        
        <div class="key-concept">
          <h3>Key Concept: Goal Prioritization</h3>
          <p>When you have multiple financial goals, prioritize them based on:</p>
          <ol>
            <li>Urgency: Which goals need immediate attention?</li>
            <li>Impact: Which goals will have the greatest positive impact on your life?</li>
            <li>Prerequisites: Some goals may need to be accomplished before others.</li>
          </ol>
          <p>Generally, building an emergency fund and addressing high-interest debt should be prioritized before long-term investing.</p>
        </div>
        
        <div class="resource-download">
          <h4>Downloadable Resource</h4>
          <p>Download our Financial Goal Setting Worksheet to map out your personal financial goals.</p>
          <button class="download-btn">Download Worksheet</button>
        </div>
      `,
      resources: [
        {
          title: 'Financial Goal Setting Worksheet',
          type: 'pdf',
          url: '/resources/financial-goal-worksheet.pdf',
        },
      ],
      order: 1,
      estimatedMinutes: 25,
    });

    // Create quiz for the second lesson
    await Quiz.create({
      lessonId: c1ch1l2.id,
      title: 'Financial Goals Quiz',
      instructions: 'Test your understanding of financial goal setting.',
      passingScore: 70,
      questions: [
        {
          type: 'multiple-choice',
          question: "What does the 'M' in SMART goals stand for?",
          options: [
            'Manageable',
            'Measurable',
            'Meaningful',
            'Momentous',
          ],
          correctAnswer: '1',
          explanation: "The 'M' stands for Measurable, meaning your goal should have concrete criteria to track progress.",
        },
        {
          type: 'multiple-choice',
          question: 'Which of these would be considered a long-term financial goal?',
          options: [
            "Saving for next month's rent",
            'Building an emergency fund',
            'Planning for retirement',
            'Paying off a credit card',
          ],
          correctAnswer: '2',
          explanation: 'Planning for retirement is typically a long-term goal that spans many years or decades.',
        },
      ],
    });

    // Create lessons for Chapter 2 of Course 1
    await Lesson.create({
      chapterId: c1ch2.id,
      title: 'Budgeting Basics',
      content: 'Coming soon...',
      order: 0,
      estimatedMinutes: 30,
    });

    await Lesson.create({
      chapterId: c1ch2.id,
      title: 'Tracking Expenses',
      content: 'Coming soon...',
      order: 1,
      estimatedMinutes: 20,
    });

    // Create chapters and lessons for Course 2
    const c2ch1 = await Chapter.create({
      courseId: course2.id,
      title: 'Introduction to Investing',
      description: 'Understanding what investing is and why it matters',
      order: 0,
    });

    const c2ch2 = await Chapter.create({
      courseId: course2.id,
      title: 'Investment Vehicles',
      description: 'Exploring different ways to invest your money',
      order: 1,
    });

    // Create lessons for Course 2
    await Lesson.create({
      chapterId: c2ch1.id,
      title: 'Why Invest?',
      content: 'Coming soon...',
      order: 0,
      estimatedMinutes: 15,
    });

    await Lesson.create({
      chapterId: c2ch1.id,
      title: 'Risk and Return',
      content: 'Coming soon...',
      order: 1,
      estimatedMinutes: 20,
    });

    await Lesson.create({
      chapterId: c2ch2.id,
      title: 'Stocks and Bonds',
      content: 'Coming soon...',
      order: 0,
      estimatedMinutes: 25,
    });

    await Lesson.create({
      chapterId: c2ch2.id,
      title: 'Mutual Funds and ETFs',
      content: 'Coming soon...',
      order: 1,
      estimatedMinutes: 30,
    });

    // Create chapters and lessons for Course 3
    const c3ch1 = await Chapter.create({
      courseId: course3.id,
      title: 'Technical Analysis',
      description: 'Understanding chart patterns and technical indicators',
      order: 0,
    });

    // Create lessons for Course 3
    await Lesson.create({
      chapterId: c3ch1.id,
      title: 'Chart Patterns',
      content: 'Coming soon...',
      order: 0,
      estimatedMinutes: 45,
    });

    await Lesson.create({
      chapterId: c3ch1.id,
      title: 'Technical Indicators',
      content: 'Coming soon...',
      order: 1,
      estimatedMinutes: 40,
    });

    console.log('Sample course data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample course data:', error);
    throw error;
  }
}
