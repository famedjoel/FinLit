// Import the SQLite connection module
import { connect } from '../config/sqlite-adapter.js';

// This asynchronous function populates course, chapter and lesson data in the database.
// It uses a transaction to ensure data integrity.
async function populateCourseData() {
  try {
    console.log('Starting database population for course content...');
    const connection = await connect();

    // Check if chapters already exist to avoid duplicate population.
    const existingChapters = await connection.all('SELECT * FROM chapters');
    if (existingChapters && existingChapters.length > 0) {
      console.log(`Database already contains ${existingChapters.length} chapters. Skipping population.`);
      return;
    }

    // Retrieve existing courses to reference their IDs.
    const courses = await connection.all('SELECT * FROM courses');
    if (!courses || courses.length === 0) {
      console.log('No courses found in database. Please run initSampleCourseData() first.');
      return;
    }
    console.log(`Found ${courses.length} courses. Populating chapters and lessons...`);

    // Begin a transaction for improved performance and data integrity.
    await connection.run('BEGIN TRANSACTION');

    try {
      // For Course 1: Personal Finance Fundamentals.
      const course1 = courses.find(c => c.title === 'Personal Finance Fundamentals') || courses[0];

      // Insert chapters for Course 1.
      const c1ch1 = await connection.run(
        `INSERT INTO chapters (course_id, title, description, "order") 
         VALUES (?, ?, ?, ?)`,
        [course1.id, 'Understanding Personal Finance', 'An introduction to personal finance concepts', 0],
      );

      const c1ch2 = await connection.run(
        `INSERT INTO chapters (course_id, title, description, "order") 
         VALUES (?, ?, ?, ?)`,
        [course1.id, 'Building a Budget', 'Learn how to create and manage a budget', 1],
      );

      // Insert lessons for the first chapter of Course 1.
      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c1ch1.lastID,
          'What is Personal Finance?',
          `<h2>What is Personal Finance?</h2>
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
          </div>`,
          0,
          20,
        ],
      );

      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c1ch1.lastID,
          'Setting Financial Goals',
          `<h2>Setting Financial Goals</h2>
          <p>Clear financial goals are the foundation of successful personal finance management. Well-defined goals give you direction and motivation to make smart financial decisions.</p>
          
          <h3>Types of Financial Goals</h3>
          <p>Financial goals are commonly categorised by timeframe:</p>
          
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
          </div>`,
          1,
          25,
        ],
      );

      // Insert lessons for the second chapter of Course 1.
      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c1ch2.lastID,
          'Budgeting Basics',
          `<h2>Budgeting Basics</h2>
          <p>A budget is a financial plan that helps you track your income and expenses. It's the cornerstone of personal finance management.</p>
          
          <h3>Why Create a Budget?</h3>
          <ul>
            <li>Gain visibility into your spending habits</li>
            <li>Ensure you're spending less than you earn</li>
            <li>Allocate money toward your financial goals</li>
            <li>Reduce financial stress and uncertainty</li>
            <li>Avoid unnecessary debt</li>
          </ul>
          
          <h3>The 50/30/20 Budget Rule</h3>
          <p>A simple framework to start budgeting:</p>
          <div class="budget-breakdown">
            <div class="budget-category">
              <h4>50% - Needs</h4>
              <p>Essential expenses like housing, utilities, groceries, transportation, and minimum debt payments.</p>
            </div>
            <div class="budget-category">
              <h4>30% - Wants</h4>
              <p>Non-essential expenses like dining out, entertainment, hobbies, and subscriptions.</p>
            </div>
            <div class="budget-category">
              <h4>20% - Savings & Debt Payoff</h4>
              <p>Emergency fund, retirement contributions, investments, and extra debt payments.</p>
            </div>
          </div>`,
          0,
          30,
        ],
      );

      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c1ch2.lastID,
          'Tracking Expenses',
          `<h2>Tracking Expenses</h2>
          <p>Knowing where your money goes is essential for maintaining a budget. Expense tracking helps you identify spending patterns and areas for improvement.</p>
          
          <h3>Methods for Tracking Expenses</h3>
          <div class="methods-grid">
            <div class="method-card">
              <h4>📱 Budgeting Apps</h4>
              <p>Apps like Mint, YNAB, or Personal Capital automatically categorise transactions and provide insights.</p>
              <p class="pros">Pros: Convenient, automated categorisation, visual reports</p>
              <p class="cons">Cons: May require linking financial accounts, potential privacy concerns</p>
            </div>
            <div class="method-card">
              <h4>📊 Spreadsheets</h4>
              <p>Create custom tracking systems in Excel or Google Sheets.</p>
              <p class="pros">Pros: Highly customisable, no cost, complete control over your data</p>
              <p class="cons">Cons: Manual entry required, more time-consuming</p>
            </div>
            <div class="method-card">
              <h4>📝 Pen and Paper</h4>
              <p>Traditional expense tracking in a notebook or journal.</p>
              <p class="pros">Pros: No technology required, helps create mindfulness about spending</p>
              <p class="cons">Cons: Manual calculations, no automatic insights</p>
            </div>
          </div>`,
          1,
          20,
        ],
      );

      // For Course 2: Investment Basics.
      const course2 = courses.find(c => c.title === 'Investment Basics') || courses[1];

      // Insert chapters for Course 2.
      const c2ch1 = await connection.run(
        `INSERT INTO chapters (course_id, title, description, "order") 
         VALUES (?, ?, ?, ?)`,
        [course2.id, 'Introduction to Investing', 'Understanding what investing is and why it matters', 0],
      );

      const c2ch2 = await connection.run(
        `INSERT INTO chapters (course_id, title, description, "order") 
         VALUES (?, ?, ?, ?)`,
        [course2.id, 'Investment Vehicles', 'Exploring different ways to invest your money', 1],
      );

      // Insert lessons for the first chapter of Course 2.
      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c2ch1.lastID,
          'Why Invest?',
          `<h2>Why Invest?</h2>
          <p>Investing is the process of putting money into assets with the expectation of generating income or profit over time. It's a critical component of building wealth and achieving financial goals.</p>
          
          <h3>Key Reasons to Invest</h3>
          <div class="reasons-grid">
            <div class="reason-card">
              <div class="reason-icon">💰</div>
              <h4>Beat Inflation</h4>
              <p>Money sitting in a regular savings account loses purchasing power over time due to inflation. Investing helps your money grow faster than the inflation rate.</p>
            </div>
            <div class="reason-card">
              <div class="reason-icon">📈</div>
              <h4>Build Wealth</h4>
              <p>Over long periods, investments typically outperform savings accounts, allowing your money to grow substantially through the power of compounding.</p>
            </div>
            <div class="reason-card">
              <div class="reason-icon">🏡</div>
              <h4>Achieve Financial Goals</h4>
              <p>Investing helps you build funds for major life goals like retirement, home ownership, or education funding.</p>
            </div>
            <div class="reason-card">
              <div class="reason-icon">💼</div>
              <h4>Generate Passive Income</h4>
              <p>Certain investments can provide regular income streams without requiring active work.</p>
            </div>
          </div>`,
          0,
          15,
        ],
      );

      // Insert lessons for the first chapter of Course 2.
      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c2ch1.lastID,
          'Risk and Return',
          `<h2>Risk and Return</h2>
          <p>Understanding the relationship between risk and return is fundamental to making sound investment decisions.</p>
          
          <h3>The Risk-Return Tradeoff</h3>
          <p>In the investment world, risk and return are closely linked. Generally, investments with higher potential returns come with higher risk, while safer investments offer lower returns.</p>
          
          <div class="risk-return-spectrum">
            <div class="investment-type low-risk">
              <h4>Lower Risk, Lower Return</h4>
              <ul>
                <li>Savings accounts</li>
                <li>Certificates of Deposit (CDs)</li>
                <li>Treasury bonds</li>
                <li>Money market accounts</li>
              </ul>
            </div>
            <div class="investment-type medium-risk">
              <h4>Medium Risk, Medium Return</h4>
              <ul>
                <li>Corporate bonds</li>
                <li>Dividend stocks</li>
                <li>Real estate investment trusts (REITs)</li>
                <li>Balanced mutual funds</li>
              </ul>
            </div>
            <div class="investment-type high-risk">
              <h4>Higher Risk, Higher Return</h4>
              <ul>
                <li>Growth stocks</li>
                <li>Small-cap stocks</li>
                <li>International emerging markets</li>
                <li>Cryptocurrency</li>
                <li>Venture capital</li>
              </ul>
            </div>
          </div>`,
          1,
          20,
        ],
      );

      // Insert lessons for the second chapter of Course 2.
      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c2ch2.lastID,
          'Stocks and Bonds',
          `<h2>Stocks and Bonds</h2>
          <p>Stocks and bonds are the two most common investment vehicles and form the foundation of most investment portfolios.</p>
          
          <h3>Stocks (Equities)</h3>
          <p>When you buy stocks, you're purchasing ownership shares in a company.</p>
          
          <div class="investment-details">
            <div class="detail-section">
              <h4>How Stocks Work</h4>
              <p>As a shareholder, you:</p>
              <ul>
                <li>Own a portion of the company</li>
                <li>May receive dividends (a share of profits)</li>
                <li>Can vote on certain company matters</li>
                <li>Can sell your shares to other investors</li>
              </ul>
            </div>
            <div class="detail-section">
              <h4>Potential Returns</h4>
              <ul>
                <li><strong>Capital appreciation:</strong> The share price increases</li>
                <li><strong>Dividends:</strong> Regular payments from company profits</li>
              </ul>
            </div>
            <div class="detail-section">
              <h4>Risks</h4>
              <ul>
                <li>Share prices can be volatile</li>
                <li>Companies can reduce or eliminate dividends</li>
                <li>Company performance can decline</li>
                <li>Market downturns can affect all stocks</li>
              </ul>
            </div>
          </div>
          
          <h3>Bonds (Fixed Income)</h3>
          <p>When you buy bonds, you're essentially lending money to an entity (government or corporation).</p>
          
          <div class="investment-details">
            <div class="detail-section">
              <h4>How Bonds Work</h4>
              <p>As a bondholder, you:</p>
              <ul>
                <li>Lend money for a specific time period</li>
                <li>Receive regular interest payments</li>
                <li>Get your principal back at maturity</li>
              </ul>
            </div>
            <div class="detail-section">
              <h4>Potential Returns</h4>
              <ul>
                <li><strong>Interest payments:</strong> Regular income</li>
                <li><strong>Capital appreciation:</strong> Possible if interest rates fall</li>
              </ul>
            </div>
            <div class="detail-section">
              <h4>Risks</h4>
              <ul>
                <li>Interest rate risk (bond prices fall when rates rise)</li>
                <li>Inflation risk (fixed payments worth less over time)</li>
                <li>Default risk (borrower unable to repay)</li>
              </ul>
            </div>
          </div>`,
          0,
          25,
        ],
      );

      // Insert lessons for the second chapter of Course 2.
      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c2ch2.lastID,
          'Mutual Funds and ETFs',
          `<h2>Mutual Funds and ETFs</h2>
          <p>Mutual funds and Exchange-Traded Funds (ETFs) are investment vehicles that pool money from multiple investors to purchase a diversified portfolio of stocks, bonds, or other securities.</p>
          
          <h3>Mutual Funds</h3>
          <div class="investment-details">
            <div class="detail-section">
              <h4>Key Characteristics</h4>
              <ul>
                <li>Professionally managed by a fund manager</li>
                <li>Priced once per day after market close (NAV)</li>
                <li>May have minimum investment requirements</li>
                <li>Typically purchased directly from the fund company</li>
              </ul>
            </div>
            <div class="detail-section">
              <h4>Types of Mutual Funds</h4>
              <ul>
                <li><strong>Index funds:</strong> Track a specific market index (e.g., S&P 500)</li>
                <li><strong>Actively managed funds:</strong> Managers select investments to outperform the market</li>
                <li><strong>Bond funds:</strong> Invest primarily in bonds</li>
                <li><strong>Balanced funds:</strong> Mix of stocks and bonds</li>
                <li><strong>Sector funds:</strong> Focus on specific industries</li>
              </ul>
            </div>
          </div>
          
          <h3>Exchange-Traded Funds (ETFs)</h3>
          <div class="investment-details">
            <div class="detail-section">
              <h4>Key Characteristics</h4>
              <ul>
                <li>Trade like stocks on exchanges throughout the day</li>
                <li>Usually no minimum investment beyond one share</li>
                <li>Often have lower expense ratios than mutual funds</li>
                <li>Most are passively managed (track an index)</li>
              </ul>
            </div>
            <div class="detail-section">
              <h4>Types of ETFs</h4>
              <ul>
                <li><strong>Broad market ETFs:</strong> Cover entire markets (e.g., total stock market)</li>
                <li><strong>Sector ETFs:</strong> Focus on specific industries</li>
                <li><strong>Bond ETFs:</strong> Invest in various types of bonds</li>
                <li><strong>International ETFs:</strong> Invest in foreign markets</li>
                <li><strong>Commodity ETFs:</strong> Track prices of commodities like gold or oil</li>
              </ul>
            </div>
          </div>`,
          1,
          30,
        ],
      );

      // For Course 3: Advanced Trading Strategies.
      const course3 = courses.find(c => c.title === 'Advanced Trading Strategies') || courses[2];

      // Insert chapter for Course 3.
      const c3ch1 = await connection.run(
        `INSERT INTO chapters (course_id, title, description, "order") 
         VALUES (?, ?, ?, ?)`,
        [course3.id, 'Technical Analysis', 'Understanding chart patterns and technical indicators', 0],
      );

      // Insert lessons for the chapter of Course 3.
      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c3ch1.lastID,
          'Chart Patterns',
          `<h2>Chart Patterns</h2>
          <p>Chart patterns are specific formations that appear on price charts and can help traders predict future price movements based on historical patterns.</p>
          
          <h3>Reversal Patterns</h3>
          <p>These patterns signal that a trend is likely to change direction.</p>
          
          <div class="pattern-grid">
            <div class="pattern-card">
              <h4>Head and Shoulders</h4>
              <p>A bearish reversal pattern consisting of three peaks, with the middle peak (head) higher than the two surrounding peaks (shoulders).</p>
              <div class="pattern-characteristics">
                <ul>
                  <li><strong>Signal:</strong> Bearish (downward) reversal</li>
                  <li><strong>Volume:</strong> Typically decreases on the right shoulder</li>
                  <li><strong>Target:</strong> Distance from neckline to head</li>
                </ul>
              </div>
            </div>
            <div class="pattern-card">
              <h4>Double Top</h4>
              <p>A bearish reversal pattern that forms after an uptrend, showing two consecutive peaks at approximately the same price level.</p>
              <div class="pattern-characteristics">
                <ul>
                  <li><strong>Signal:</strong> Bearish (downward) reversal</li>
                  <li><strong>Volume:</strong> Often higher on the first peak</li>
                  <li><strong>Target:</strong> Height of the pattern projected downward</li>
                </ul>
              </div>
            </div>
            <div class="pattern-card">
              <h4>Double Bottom</h4>
              <p>A bullish reversal pattern that forms after a downtrend, showing two consecutive troughs at approximately the same price level.</p>
              <div class="pattern-characteristics">
                <ul>
                  <li><strong>Signal:</strong> Bullish (upward) reversal</li>
                  <li><strong>Volume:</strong> Often higher on the second bottom</li>
                  <li><strong>Target:</strong> Height of the pattern projected upward</li>
                </ul>
              </div>
            </div>
          </div>`,
          0,
          45,
        ],
      );

      await connection.run(
        `INSERT INTO lessons (chapter_id, title, content, "order", estimated_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          c3ch1.lastID,
          'Technical Indicators',
          `<h2>Technical Indicators</h2>
          <p>Technical indicators are mathematical calculations based on price, volume, or open interest of a security or contract. They help traders analyse past patterns to predict future price movements.</p>
          
          <h3>Trend Indicators</h3>
          <p>These indicators help identify the direction of a market trend.</p>
          
          <div class="indicator-grid">
            <div class="indicator-card">
              <h4>Moving Averages</h4>
              <p>Calculates the average price over a specific time period, smoothing price data to identify trends.</p>
              <div class="indicator-details">
                <h5>Types:</h5>
                <ul>
                  <li><strong>Simple Moving Average (SMA):</strong> Equal weight to all prices</li>
                  <li><strong>Exponential Moving Average (EMA):</strong> More weight to recent prices</li>
                </ul>
                <h5>Usage:</h5>
                <ul>
                  <li>Trend direction: rising MA = uptrend, falling MA = downtrend</li>
                  <li>Support/resistance levels</li>
                  <li>Crossovers: when a shorter-term MA crosses a longer-term MA</li>
                </ul>
              </div>
            </div>
            <div class="indicator-card">
              <h4>MACD (Moving Average Convergence Divergence)</h4>
              <p>A trend-following momentum indicator that shows the relationship between two moving averages of a security's price.</p>
              <div class="indicator-details">
                <h5>Components:</h5>
                <ul>
                  <li>MACD Line: difference between 12-day and 26-day EMA</li>
                  <li>Signal Line: 9-day EMA of MACD Line</li>
                  <li>Histogram: difference between MACD and Signal Line</li>
                </ul>
                <h5>Signals:</h5>
                <ul>
                  <li>MACD crossing above signal line: bullish</li>
                  <li>MACD crossing below signal line: bearish</li>
                  <li>Divergence between MACD and price: potential reversal</li>
                </ul>
              </div>
            </div>
            <div class="indicator-card">
              <h4>Parabolic SAR (Stop and Reverse)</h4>
              <p>Identifies potential reversals in price direction, placing dots on the chart that indicate stop or reverse points.</p>
              <div class="indicator-details">
                <h5>Characteristics:</h5>
                <ul>
                  <li>Dots below price: uptrend</li>
                  <li>Dots above price: downtrend</li>
                  <li>When dots change position: potential trend reversal</li>
                </ul>
                <h5>Usage:</h5>
                <ul>
                  <li>Setting trailing stop-loss points</li>
                  <li>Identifying trend changes</li>
                  <li>Works best in trending markets</li>
                </ul>
              </div>
            </div>
          </div>`,
          1,
          40,
        ],
      );

      // Update each course record with the count of chapters and lessons.
      for (const course of courses) {
        const chapterCount = await connection.get(
          'SELECT COUNT(*) as count FROM chapters WHERE course_id = ?',
          course.id,
        );

        const lessonCount = await connection.get(
          `SELECT COUNT(*) as count FROM lessons 
           WHERE chapter_id IN (SELECT id FROM chapters WHERE course_id = ?)`,
          course.id,
        );

        await connection.run(
          'UPDATE courses SET chapters_count = ?, lessons_count = ? WHERE id = ?',
          [chapterCount.count, lessonCount.count, course.id],
        );

        console.log(`Updated course ${course.title} with ${chapterCount.count} chapters and ${lessonCount.count} lessons`);
      }

      // Commit the transaction.
      await connection.run('COMMIT');
      console.log('Course data populated successfully!');
    } catch (error) {
      // Roll back the transaction if any error occurs.
      await connection.run('ROLLBACK');
      console.error('Error populating course data:', error);
      throw error;
    }
  } catch (error) {
    console.error('Database population failed:', error);
    throw error;
  }
}

// Export the function for use in other modules.
export default populateCourseData;
