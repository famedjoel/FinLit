// Sample questions for the Financial Trivia Quiz
// Located at: FinLit/data/financial-trivia-questions.js

const questions = [
  // Investing - Easy
  {
    question: "What is a stock?",
    options: [
      "A loan to a company",
      "Ownership in a company",
      "A type of bond",
      "A government investment"
    ],
    correctAnswer: 1,
    explanation: "A stock represents ownership (or equity) in a company. When you buy a share of stock, you're buying a small piece of that company.",
    difficulty: "easy",
    category: "investing"
  },
  {
    question: "What does diversification mean in investing?",
    options: [
      "Buying stocks in different countries",
      "Investing in many different types of assets",
      "Investing all your money in one industry",
      "Frequently trading stocks"
    ],
    correctAnswer: 1,
    explanation: "Diversification means spreading your investments across various asset types (stocks, bonds, real estate, etc.) to reduce risk.",
    difficulty: "easy",
    category: "investing"
  },
  {
    question: "What is a mutual fund?",
    options: [
      "A government bond",
      "A type of retirement account",
      "A pool of money from many investors used to buy stocks, bonds, or other assets",
      "A high-interest savings account"
    ],
    correctAnswer: 2,
    explanation: "A mutual fund pools money from many investors to purchase a diversified portfolio of stocks, bonds, or other securities, managed by investment professionals.",
    difficulty: "easy",
    category: "investing"
  },
  
  // Budgeting - Easy
  {
    question: "What is the 50/30/20 rule in budgeting?",
    options: [
      "50% needs, 30% wants, 20% savings",
      "50% savings, 30% needs, 20% wants",
      "50% wants, 30% savings, 20% needs",
      "50% needs, 30% savings, 20% wants"
    ],
    correctAnswer: 0,
    explanation: "The 50/30/20 rule recommends allocating 50% of your income to necessities (housing, food, utilities), 30% to wants (entertainment, dining out), and 20% to savings and debt repayment.",
    difficulty: "easy",
    category: "budgeting"
  },
  {
    question: "What is a fixed expense?",
    options: [
      "An expense that changes each month",
      "A one-time expense",
      "An expense that stays the same each month",
      "An unexpected expense"
    ],
    correctAnswer: 2,
    explanation: "A fixed expense is a cost that remains constant each month, such as rent/mortgage, car payments, or insurance premiums.",
    difficulty: "easy",
    category: "budgeting"
  },
  {
    question: "Which of these is an example of a variable expense?",
    options: [
      "Mortgage payment",
      "Car insurance",
      "Grocery bill",
      "Property tax"
    ],
    correctAnswer: 2,
    explanation: "Variable expenses change from month to month. Grocery bills vary depending on what and how much you buy, unlike fixed expenses like mortgage payments or insurance.",
    difficulty: "easy",
    category: "budgeting"
  },
  
  // Savings - Easy
  {
    question: "What is an emergency fund?",
    options: [
      "Money saved for retirement",
      "Money set aside for unexpected expenses",
      "Money invested in stocks",
      "Money used for vacations"
    ],
    correctAnswer: 1,
    explanation: "An emergency fund is money set aside specifically for unexpected expenses like medical emergencies, car repairs, or job loss.",
    difficulty: "easy",
    category: "savings"
  },
  {
    question: "How much should an emergency fund typically cover?",
    options: [
      "1 week of expenses",
      "1 month of expenses",
      "3-6 months of expenses",
      "2 years of expenses"
    ],
    correctAnswer: 2,
    explanation: "Financial experts generally recommend having an emergency fund that covers 3-6 months of essential living expenses.",
    difficulty: "easy",
    category: "savings"
  },
  {
    question: "What is compound interest?",
    options: [
      "Interest earned only on the principal amount",
      "Interest that decreases over time",
      "Interest earned on both the principal and accumulated interest",
      "A fixed interest rate that never changes"
    ],
    correctAnswer: 2,
    explanation: "Compound interest is when you earn interest not only on your initial deposit (principal) but also on any interest already earned. It's often described as 'interest on interest.'",
    difficulty: "easy",
    category: "savings"
  },
  
  // Credit - Easy
  {
    question: "What is a credit score?",
    options: [
      "The amount of money you owe",
      "A numerical rating of your creditworthiness",
      "Your bank account balance",
      "The interest rate on your loans"
    ],
    correctAnswer: 1,
    explanation: "A credit score is a number (typically between 300-850) that represents your creditworthiness, based on your credit history. Higher scores indicate less risk to lenders.",
    difficulty: "easy",
    category: "credit"
  },
  {
    question: "What is APR?",
    options: [
      "Annual Percentage Rate - the yearly cost of borrowing money",
      "Average Payment Requirement",
      "Additional Purchase Rate",
      "Automatic Payment Return"
    ],
    correctAnswer: 0,
    explanation: "APR stands for Annual Percentage Rate, which represents the yearly cost of borrowing money, including fees and interest rate.",
    difficulty: "easy",
    category: "credit"
  },
  {
    question: "What is the main difference between a credit card and a debit card?",
    options: [
      "Credit cards are plastic, debit cards are metal",
      "Credit cards can only be used online",
      "Credit cards borrow money from a lender, debit cards use your own money",
      "Debit cards have higher interest rates"
    ],
    correctAnswer: 2,
    explanation: "When you use a credit card, you're borrowing money from the card issuer. With a debit card, you're using your own money directly from your bank account.",
    difficulty: "easy",
    category: "credit"
  },
  
  // Investing - Medium
  {
    question: "What is a P/E ratio?",
    options: [
      "Price to Earnings - a valuation metric for stocks",
      "Profit and Expense ratio",
      "Percentage of Equity in a portfolio",
      "Performance Evaluation score"
    ],
    correctAnswer: 0,
    explanation: "P/E (Price to Earnings) ratio is a valuation metric that compares a company's share price to its earnings per share. It helps investors determine if a stock is overvalued or undervalued.",
    difficulty: "medium",
    category: "investing"
  },
  {
    question: "What is dollar-cost averaging?",
    options: [
      "Converting investments to dollars",
      "Investing a fixed amount at regular intervals regardless of price",
      "Buying stocks only when they're cheap",
      "Exchanging currency at optimal rates"
    ],
    correctAnswer: 1,
    explanation: "Dollar-cost averaging is an investment strategy where you invest a fixed amount at regular intervals, regardless of the asset's price. This reduces the impact of volatility and the risk of investing a large amount at the wrong time.",
    difficulty: "medium",
    category: "investing"
  },
  {
    question: "What is an ETF?",
    options: [
      "Electronic Trading Fund",
      "Extra Tax Form",
      "Exchange-Traded Fund - a type of investment that tracks an index",
      "Extended Time Finance"
    ],
    correctAnswer: 2,
    explanation: "An ETF (Exchange-Traded Fund) is an investment fund traded on stock exchanges that holds assets like stocks, bonds, or commodities and typically tracks an index. ETFs combine features of mutual funds and stocks.",
    difficulty: "medium",
    category: "investing"
  },
  
  // Budgeting - Medium
  {
    question: "What is a zero-based budget?",
    options: [
      "A budget where you spend everything you earn",
      "A budget where you save everything and spend nothing",
      "A budget where your income minus expenses equals zero",
      "A budget with zero debt payments"
    ],
    correctAnswer: 2,
    explanation: "A zero-based budget is a method where you assign every dollar of your income to a specific expense, savings, or debt payment category until your income minus your allocations equals zero. Every dollar has a purpose.",
    difficulty: "medium",
    category: "budgeting"
  },
  {
    question: "What does 'paying yourself first' mean in budgeting?",
    options: [
      "Giving yourself a salary from your business",
      "Prioritizing savings before spending on expenses",
      "Paying all your bills at the beginning of the month",
      "Taking a percentage of your income as cash"
    ],
    correctAnswer: 1,
    explanation: "'Paying yourself first' means automatically setting aside a portion of your income for savings goals before paying bills or other expenses. This ensures saving remains a priority.",
    difficulty: "medium",
    category: "budgeting"
  },
  {
    question: "What is lifestyle inflation?",
    options: [
      "The rising cost of luxury goods",
      "Increasing your spending as your income increases",
      "The impact of inflation on your standard of living",
      "Buying status symbols to appear wealthy"
    ],
    correctAnswer: 1,
    explanation: "Lifestyle inflation occurs when your spending increases with your income. Instead of saving the additional income, people often upgrade their lifestyle with bigger homes, luxury cars, or more expensive habits.",
    difficulty: "medium",
    category: "budgeting"
  },
  
  // Savings - Medium
  {
    question: "What is the difference between a traditional IRA and a Roth IRA?",
    options: [
      "Traditional IRAs are for employees, Roth IRAs are for self-employed individuals",
      "Traditional IRAs have contribution limits, Roth IRAs don't",
      "Traditional IRA contributions are tax-deductible now but taxed in retirement, Roth IRA contributions are taxed now but tax-free in retirement",
      "Traditional IRAs can only invest in stocks, Roth IRAs can invest in bonds"
    ],
    correctAnswer: 2,
    explanation: "With a Traditional IRA, you get a tax deduction for contributions now, but pay taxes when you withdraw in retirement. With a Roth IRA, you pay taxes on contributions now, but withdrawals in retirement are tax-free.",
    difficulty: "medium",
    category: "savings"
  },
  {
    question: "What is a Health Savings Account (HSA)?",
    options: [
      "A regular savings account for medical expenses",
      "A tax-advantaged account for medical expenses if you have a high-deductible health plan",
      "A government program for low-income healthcare",
      "An insurance policy for major medical expenses"
    ],
    correctAnswer: 1,
    explanation: "An HSA is a tax-advantaged savings account available to individuals enrolled in high-deductible health plans. Contributions are tax-deductible, grow tax-free, and withdrawals for qualified medical expenses are tax-free.",
    difficulty: "medium",
    category: "savings"
  },
  {
    question: "What is the Rule of 72?",
    options: [
      "A rule stating you should save 72% of your income",
      "A formula to estimate how long it takes for an investment to double",
      "A retirement planning guideline to have 72 times your annual expenses saved",
      "A tax rule for withdrawals after age 72"
    ],
    correctAnswer: 1,
    explanation: "The Rule of 72 is a simple way to estimate how long it will take for an investment to double. You divide 72 by the annual rate of return. For example, at 8% interest, an investment would double in approximately 72 ÷ 8 = 9 years.",
    difficulty: "medium",
    category: "savings"
  },
  
  // Credit - Medium
  {
    question: "What factors have the largest impact on your credit score?",
    options: [
      "Your income and employment history",
      "Payment history and credit utilization",
      "Your education level and address",
      "The number of credit cards you own"
    ],
    correctAnswer: 1,
    explanation: "The two most important factors affecting your credit score are payment history (35% of your FICO score) and credit utilization (30%). Income and education don't directly impact your credit score.",
    difficulty: "medium",
    category: "credit"
  },
  {
    question: "What is credit utilization?",
    options: [
      "How frequently you use your credit cards",
      "The ratio of your credit card balances to your credit limits",
      "The number of different types of credit you have",
      "How long you've been using credit"
    ],
    correctAnswer: 1,
    explanation: "Credit utilization is the percentage of your available credit that you're using. For example, if you have a $10,000 credit limit and a $3,000 balance, your utilization is 30%. Lower utilization (under 30%) is better for your credit score.",
    difficulty: "medium",
    category: "credit"
  },
  {
    question: "What is a secured credit card?",
    options: [
      "A credit card with fraud protection",
      "A credit card that requires a security deposit as collateral",
      "A credit card with a high credit limit",
      "A credit card that can only be used for online purchases"
    ],
    correctAnswer: 1,
    explanation: "A secured credit card requires a security deposit that typically becomes your credit limit. It's designed for people with limited or poor credit history, helping them build or rebuild their credit.",
    difficulty: "medium",
    category: "credit"
  },
  
  // Taxes - Medium
  {
    question: "What is the difference between a tax deduction and a tax credit?",
    options: [
      "They are different names for the same thing",
      "A deduction reduces your taxable income, a credit reduces your tax bill directly",
      "A deduction is for businesses, a credit is for individuals",
      "A deduction is applied before filing taxes, a credit is applied after"
    ],
    correctAnswer: 1,
    explanation: "A tax deduction reduces your taxable income, lowering your tax bill based on your tax bracket. A tax credit reduces your tax bill dollar-for-dollar, making credits generally more valuable than deductions of the same amount.",
    difficulty: "medium",
    category: "taxes"
  },
  {
    question: "What is the difference between a traditional 401(k) and a Roth 401(k)?",
    options: [
      "Traditional 401(k)s are offered by employers, Roth 401(k)s are individual accounts",
      "Traditional 401(k)s have higher contribution limits than Roth 401(k)s",
      "Traditional 401(k) contributions are pre-tax, Roth 401(k) contributions are after-tax",
      "Traditional 401(k)s can invest in stocks, Roth 401(k)s can only invest in bonds"
    ],
    correctAnswer: 2,
    explanation: "Traditional 401(k) contributions are made with pre-tax dollars, reducing your current taxable income but requiring you to pay taxes when you withdraw in retirement. Roth 401(k) contributions are made with after-tax dollars, allowing tax-free withdrawals in retirement.",
    difficulty: "medium",
    category: "taxes"
  },
  
  // Investing - Hard
  {
    question: "What is the efficient frontier in portfolio theory?",
    options: [
      "The maximum return possible for any investment",
      "The set of optimal portfolios that offer the highest expected return for a defined level of risk",
      "The point at which adding more investments no longer improves diversification",
      "The threshold at which investment gains become tax-exempt"
    ],
    correctAnswer: 1,
    explanation: "The efficient frontier represents the set of optimal portfolios that offer the maximum possible expected return for a given level of risk, or the minimum risk for a given level of expected return. It's a key concept in modern portfolio theory.",
    difficulty: "hard",
    category: "investing"
  },
  {
    question: "What is a put option?",
    options: [
      "An option to buy a stock at a specified price before a specified date",
      "An option to sell a stock at a specified price before a specified date",
      "A guarantee that a stock price will increase",
      "A requirement to purchase a stock if it reaches a certain price"
    ],
    correctAnswer: 1,
    explanation: "A put option gives the holder the right, but not the obligation, to sell a specific asset at a predetermined price (strike price) by a specified date. Put options generally increase in value when the underlying asset falls in price.",
    difficulty: "hard",
    category: "investing"
  },
  {
    question: "What is the difference between alpha and beta in investing?",
    options: [
      "Alpha measures volatility, beta measures performance",
      "Alpha measures performance relative to a benchmark, beta measures volatility relative to the market",
      "Alpha is for stock investments, beta is for bond investments",
      "Alpha measures short-term returns, beta measures long-term returns"
    ],
    correctAnswer: 1,
    explanation: "Alpha represents an investment's excess return relative to a benchmark index, indicating a portfolio manager's skill. Beta measures volatility or systematic risk compared to the market as a whole. A beta of 1 means the investment moves with the market.",
    difficulty: "hard",
    category: "investing"
  },
  
  // Retirement - Hard
  {
    question: "What is the 4% rule in retirement planning?",
    options: [
      "Saving 4% of your income for retirement",
      "Withdrawing 4% of your retirement portfolio in the first year, then adjusting for inflation",
      "Limiting retirement investments to 4% of high-risk assets",
      "Ensuring your retirement account grows by at least 4% annually"
    ],
    correctAnswer: 1,
    explanation: "The 4% rule is a retirement withdrawal strategy that suggests you can withdraw 4% of your portfolio in the first year of retirement, then adjust that amount for inflation each year, with a high probability that your money will last at least 30 years.",
    difficulty: "hard",
    category: "retirement"
  },
  {
    question: "What is a Qualified Longevity Annuity Contract (QLAC)?",
    options: [
      "A life insurance policy that pays out upon reaching a certain age",
      "A retirement account that allows penalty-free withdrawals for education expenses",
      "A deferred annuity purchased with retirement account funds that delays required minimum distributions",
      "A government pension supplement for individuals over 80"
    ],
    correctAnswer: 2,
    explanation: "A QLAC is a type of deferred annuity purchased with funds from a qualified retirement account. It provides guaranteed income later in life and allows you to exclude the money used to buy the QLAC from required minimum distributions (RMDs) until age 85.",
    difficulty: "hard",
    category: "retirement"
  },
  
  // Insurance - Hard
  {
    question: "What is the difference between term life insurance and whole life insurance?",
    options: [
      "Term life covers disabilities, whole life covers death",
      "Term life provides coverage for a specific period, whole life provides lifelong coverage and has a cash value component",
      "Term life is for individuals, whole life is for families",
      "Term life is provided by employers, whole life is purchased individually"
    ],
    correctAnswer: 1,
    explanation: "Term life insurance provides coverage for a specific period (e.g., 20 years) with no cash value accumulation. Whole life insurance provides lifelong coverage with a cash value component that grows over time, but typically has higher premiums.",
    difficulty: "hard",
    category: "insurance"
  },
  {
    question: "What is an umbrella insurance policy?",
    options: [
      "Insurance that covers multiple properties under one policy",
      "Insurance that provides additional liability coverage beyond the limits of your auto and home insurance",
      "Insurance specifically for natural disasters",
      "A bundle of different insurance types from the same company"
    ],
    correctAnswer: 1,
    explanation: "An umbrella insurance policy provides additional liability coverage beyond the limits of your existing home, auto, or other insurance policies. It helps protect your assets from major claims and lawsuits, typically offering $1 million or more in coverage.",
    difficulty: "hard",
    category: "insurance"
  },
  
  // Debt Management - Hard
  {
    question: "What is debt-to-income ratio (DTI) and why is it important?",
    options: [
      "The ratio of good debt to bad debt; it helps you balance different types of debt",
      "The percentage of your income that goes toward paying debts; lenders use it to evaluate borrowing risk",
      "The ratio of secured to unsecured debt; it affects your credit score directly",
      "The amount of debt relative to your net worth; it determines your financial health"
    ],
    correctAnswer: 1,
    explanation: "Debt-to-income ratio (DTI) is the percentage of your gross monthly income that goes toward paying debts. Lenders use DTI to assess your ability to manage monthly payments and repay debts. A lower DTI (typically below 36%) is preferred for loan approval.",
    difficulty: "hard",
    category: "debt"
  },
  {
    question: "What is the avalanche method of debt repayment?",
    options: [
      "Paying off the newest debts first",
      "Paying off the debts with the highest interest rates first",
      "Paying off the debts with the lowest balances first",
      "Making equal payments to all debts simultaneously"
    ],
    correctAnswer: 1,
    explanation: "The avalanche method involves paying minimum payments on all debts while putting extra money toward the debt with the highest interest rate. Once that debt is paid off, you focus on the next highest interest rate debt. This method minimizes the total interest paid.",
    difficulty: "hard",
    category: "debt"
  }
];

export default questions;

