# FinLit: Financial Literacy & Learning Platform

## Description
FinLit is an interactive educational platform designed to improve users' financial literacy through engaging courses, trivia games, and a gamified learning experience. With features like progress tracking, achievements, and multiplayer challenges, FinLit makes learning about personal finance, investing, and money management both educational and enjoyable.

## Installation

Before you start, ensure you have a good code editor like Visual Studio Code and the following software installed:
- Node.js (v14 or higher)
- npm or yarn package manager
- SQLite3

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finlit.git
   cd finlit
   ```

2. Install dependencies:
   ```bash
   npm install eslint@^8.40.0
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
  Edit `.env` file with your configuration (database path, port, etc.)

4. Start the application:
   ```bash
   # Development mode (requires two terminals)
   Terminal 1:
   npm run server
   
   Terminal 2:
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

5. Open any selected web browser of your choice and visit [http://localhost:7900/](http://localhost:7900/) to view the app.

Alternatively, use Visual Studio Code's Live Server extension by clicking **Go Live** in the bottom right corner of the status bar.

> To install and use this web app, follow these simple steps:

- Open your web browser and navigate to the URL where the web app is hosted.
- In the browser's address bar, you will see a desktop-like icon. Click on that icon to access the installation options.
- From the menu that appears, select the option to install the web app or add it to your home screen. The exact wording may vary depending on your browser.
- If prompted, confirm the installation by clicking "Install" or "Add."
- The web app will now be installed and accessible from your device's home screen or app launcher.

> Accessing the Web App Locally
> To access the web app on your local network, follow these steps:

- Open the Command Prompt or Terminal on your computer.
- Type `ipconfig` and press Enter to retrieve your network configuration information.
- Look for the "IPv4 Address" under the network adapter you are using (e.g., Ethernet or Wi-Fi).
- Take note of the IPv4 address, which will be in the format xxx.xxx.xxx.xxx.
- Open your web browser and enter the following address in the URL bar:
- Replace `your-ipv4-address` with the actual IPv4 address you obtained in step 4.
- The web app should now load in your browser. If you see a settings or configuration page, look for an option to add the web app to your home screen for easier access.

# Features

1. Interactive Course Content
2. Battle of Budgets Game
3. Financial Trivia Challenges
4. MoneyMatch Budgeting Game
5. Achievement System
6. Progress Tracking
7. Dark/Light Theme Support
8. Multiplayer Challenges
9. Quiz System with Explanations
10. Community Leaderboard

# Description of the Features

## Interactive Course Content Feature

The "Interactive Course Content" feature in FinLit allows users to learn financial concepts through structured courses with multiple chapters and lessons.

### Key Components

- **Progressive Learning Path**: Users can start with beginner courses and advance to more complex topics
- **Chapter-Based Structure**: Each course is divided into manageable chapters for better comprehension
- **Quiz Assessments**: Interactive quizzes to test knowledge after each lesson
- **Visual Content**: Rich media including diagrams, infographics, and practical examples

### How it Works

Upon logging in, users can browse available courses on the Courses page. Each course shows a difficulty level (Beginner, Intermediate, Advanced) and estimated completion time. After selecting a course, users navigate through chapters sequentially, completing lessons and quizzes before advancing. Progress is automatically saved, allowing users to continue where they left off.

### Design

I created a structured learning path that breaks down complex financial concepts into digestible lessons. The interface is designed to be intuitive, with clear progress indicators and engaging visual elements to maintain user focus.

## Battle of Budgets Game Feature

The "Battle of Budgets" feature allows users to compete against AI personalities in a budget management challenge.

### Key Components

- **AI Opponents**: Three unique personalities (Savvy Saver, Balanced Buddy, Big Spender) with different spending behaviors
- **Financial Management**: Users must balance monthly needs, wants, and savings
- **Event System**: Random events test financial decision-making skills
- **Victory Conditions**: The player with the most money after 12 months wins

### How it Works

Players start with a monthly income and must make decisions about allocating money to essential expenses, discretionary spending, and savings. Random events occur throughout the game, affecting finances and requiring strategic responses. The AI opponents make their own decisions, creating a competitive environment where users can see their budgeting skills in action.

### Design

The game interface uses clear visual indicators for money flow and budget allocation. I implemented an engaging visual style with character animations and feedback notifications to make financial decision-making entertaining while still being educational.

## Financial Trivia Challenges Feature

The "Financial Trivia Challenges" feature provides an engaging way to test and improve financial knowledge through questions and answers.

### Key Components

- **Multiple Category System**: Questions covering investing, budgeting, credit, taxes, retirement, and more
- **Difficulty Levels**: Easy, Medium, and Hard questions to match user skill levels
- **Scoring System**: Points awarded based on correct answers
- **Performance Tracking**: Mastery levels tracked by category

### How it Works

Users can select categories and difficulty levels before starting a trivia session. The app presents multiple-choice questions with detailed explanations for both correct and incorrect answers. Points are awarded for correct responses, with more points given for harder questions. Performance data is tracked to show strengths and weaknesses.

### Design

The trivia interface features clean typography and clear answer options. Visual feedback is provided immediately after answering, with green for correct answers and red for incorrect ones. Explanations appear after each question to reinforce learning.

## MoneyMatch Budgeting Game Feature

The "MoneyMatch Budgeting Game" is a drag-and-drop budget allocation game that teaches users about the 50/30/20 budgeting rule.

### Key Components

- **Budget Allocation**: Interactive dragging of expense cards to categories
- **50/30/20 Rule**: Visual representation of needs (50%), wants (30%), and savings (20%)
- **Immediate Feedback**: Visual cues for correct and incorrect allocations
- **Various Expense Categories**: Food, rent, entertainment, insurance, shopping, transportation

### How it Works

Players receive a budget and must allocate different expenses to their proper categories. The interface provides immediate feedback on whether items are correctly placed and maintains running totals for each category. Successfully completing the allocation teaches proper budgeting principles while being engaging and interactive.

### Design

I used a card-based design with drag-and-drop functionality. The interface features color-coded categories and visual progress bars that fill as users allocate funds, making it immediately clear when they've hit the correct percentages.

## Achievement System Feature

The "Achievement System" gamifies learning by rewarding users for completing various milestones and challenges.

### Key Components

- **Multiple Achievement Categories**: Learning, Gaming, Social, Special achievements
- **Tiered Rewards**: Bronze, Silver, Gold, and special achievements with varying point values
- **Visual Badges**: Unique icons and badges for each achievement
- **Progress Tracking**: Visual indicators showing progress toward achievements

### How it Works

As users complete courses, play games, or participate in challenges, they automatically earn achievements. Each achievement has specific requirements (e.g., "Complete 5 courses" or "Win 10 multiplayer challenges"). Users can view their achievement collection and track progress toward unlocking new ones.

### Design

The achievement page displays a collection of badges with clear icons representing each accomplishment. Locked achievements are shown in grayscale with requirements, while unlocked ones display in full color with completion dates.

## Progress Tracking Feature

The "Progress Tracking" feature allows users to monitor their learning journey and see tangible results of their efforts.

### Key Components

- **Overall Course Progress**: Visual percentage of courses completed
- **Individual Course Tracking**: Detailed progress within each course
- **Game Statistics**: High scores, completion rates, and performance metrics
- **Learning Analytics**: Strengths and weaknesses by category

### How it Works

The dashboard displays progress bars for overall learning, individual courses, and game achievements. Users can see their improvement over time through charts and statistics. The system tracks lesson completion, quiz scores, and game performance to provide comprehensive insight into learning progress.

### Design

Progress is visualised through clean, modern charts and graphs. Color coding helps quickly identify areas of strength (green) and areas needing improvement (red). The interface allows users to drill down into specific courses or topics for detailed analysis.

## Dark/Light Theme Support Feature

The "Dark/Light Theme Support" provides users with visual comfort options to reduce eye strain and personalize their experience.

### Key Components

- **Toggle Switch**: Easy-to-use theme switcher in the navigation bar
- **Consistent Styling**: All pages and components adapt to the selected theme
- **Persistent Preference**: Theme choice is saved across sessions
- **Accessibility**: Enhanced contrast in both modes for better readability

### How it Works

Users can switch between light and dark modes using the sun/moon icon in the navigation bar. The change applies instantly across the entire application. The preference is stored in localStorage, so it persists across browser sessions.

### Design

The dark theme uses carefully selected colors to reduce eye strain while maintaining readability. Both themes maintain consistent branding and ensure all interactive elements remain clearly visible.

## Multiplayer Challenges Feature

The "Multiplayer Challenges" feature enables users to compete directly with friends in head-to-head financial games.

### Key Components

- **Challenge System**: Users can send and accept game challenges
- **Game Selection**: Choose from available multiplayer games
- **Real-time Competition**: Both players participate simultaneously
- **Leaderboard**: Track wins and rankings

### How it Works

Users can browse other players and send challenge invitations. Once accepted, both players compete in the selected game (trivia or Battle of Budgets). Results are recorded, and winners earn rewards and achievement progress. The system maintains a leaderboard for competitive players.

### Design

The challenge interface uses a clean list format for pending and active challenges. Visual notifications alert users to new challenges, and the game selection screen clearly displays available options with preview images.

## Quiz System with Explanations Feature

The "Quiz System with Explanations" provides immediate feedback and learning opportunities after each quiz question.

### Key Components

- **Multiple Choice Format**: Clear, well-designed answer options
- **Instant Feedback**: Immediate display of correct/incorrect results
- **Detailed Explanations**: Educational text explaining the correct answer
- **Progress Tracking**: Quiz scores contribute to overall progress

### How it Works

After completing a lesson, users take a quiz to test their knowledge. Each question provides multiple choice options. Upon answering, the system immediately shows whether the answer was correct and displays an explanation. Users must achieve a passing score (typically 70%) to continue to the next lesson.

### Design

Quiz questions are presented one at a time with clear formatting. Correct answers are highlighted in green, incorrect in red. Explanations appear in a highlighted box below the question, ensuring users understand the concept regardless of their answer.

## Community Leaderboard Feature

The "Community Leaderboard" showcases top performers and creates friendly competition among users.

### Key Components

- **Global Rankings**: See how you compare to other users
- **Multiple Categories**: Different leaderboards for courses, games, achievements
- **Real-time Updates**: Rankings update as users complete activities
- **Achievement Milestones**: Special recognition for top performers

### How it Works

The leaderboard automatically updates as users complete courses, win games, and earn achievements. Users can view rankings by different metrics (total points, courses completed, game victories) and see their relative position. Top performers receive special badges and recognition.

### Design

The leaderboard features a clean table format with user avatars, ranks, and statistics. Color coding highlights top positions (gold, silver, bronze) and the current user's position is emphasised for easy identification.

---

## Architecture Overview

FinLit is built using a modern web architecture with the following components:

- **Frontend**: React.js with Vite for fast development
- **Backend**: Express.js server with SQLite database
- **State Management**: Context API and localStorage
- **Styling**: Custom CSS with theme support
- **Database**: SQLite for data persistence

### Key Technical Decisions

1. **Single Page Application**: Improved performance and seamless navigation
2. **SQLite Database**: Lightweight, serverless database perfect for the application scale
3. **Modular Architecture**: Separate models, routes, and components for maintainability
4. **Progressive Enhancement**: Works offline with localStorage caching

## AI Integration

### Prompts used for development

> How can I implement a theme toggle that persists across sessions?

This helped create the persistent theme system using localStorage and Context API.

> What's the best way to structure a quiz system with immediate feedback?

Led to the development of the interactive quiz component with instant result display.

> How should I calculate user mastery levels across different financial topics?

Resulted in the implementation of the category-based mastery tracking algorithm.

---

## Acknowledgments
- React.js Community for excellent documentation
- SQLite team for the reliable database solution
- Express.js maintainers for the robust server framework
- All contributors and testers who helped improve the application