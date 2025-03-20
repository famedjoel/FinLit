/**
 * Sample financial trivia questions organized by category
 * This file is imported by the seed-trivia.js script
 */

const financialTriviaQuestions = [
    // Investing Category
    {
      question: "What is the term for the measure of how much an investment's returns fluctuate over time?",
      options: ["Volatility", "Liquidity", "Dividend", "Maturity"],
      correctAnswer: 0,
      explanation: "Volatility measures how much an investment's returns fluctuate over time. Higher volatility generally implies higher risk.",
      difficulty: "easy",
      category: "investing"
    },
    {
      question: "Which of these is a retirement account that allows for tax-free withdrawals in retirement?",
      options: ["Traditional IRA", "Roth IRA", "401(k)", "Pension"],
      correctAnswer: 1,
      explanation: "A Roth IRA allows for tax-free withdrawals in retirement because contributions are made with after-tax dollars.",
      difficulty: "easy",
      category: "investing"
    },
    {
      question: "What is the term for spreading your investments across different asset classes to reduce risk?",
      options: ["Leverage", "Diversification", "Arbitrage", "Hedging"],
      correctAnswer: 1,
      explanation: "Diversification involves spreading investments across different asset classes (like stocks, bonds, real estate) to reduce risk.",
      difficulty: "easy",
      category: "investing"
    },
    {
      question: "What is the P/E ratio used for in stock analysis?",
      options: ["To compare debt to equity", "To measure how fast a company is growing", "To compare a stock's price to its earnings", "To determine dividend yield"],
      correctAnswer: 2,
      explanation: "The Price-to-Earnings (P/E) ratio compares a company's stock price to its earnings per share, helping investors assess if a stock is overvalued or undervalued.",
      difficulty: "medium",
      category: "investing"
    },
    {
      question: "What investment strategy involves buying assets that have underperformed but have strong fundamentals?",
      options: ["Momentum investing", "Growth investing", "Value investing", "Dollar-cost averaging"],
      correctAnswer: 2,
      explanation: "Value investing focuses on finding assets trading below their intrinsic value, often buying underperforming assets with strong fundamentals.",
      difficulty: "medium",
      category: "investing"
    },
    {
      question: "Which of these is NOT considered a defensive stock sector?",
      options: ["Utilities", "Healthcare", "Technology", "Consumer staples"],
      correctAnswer: 2,
      explanation: "Technology is considered a cyclical or growth sector, not a defensive sector. Defensive sectors typically perform relatively well during economic downturns.",
      difficulty: "hard",
      category: "investing"
    },
    
    // Budgeting Category
    {
      question: "What is the 50/30/20 rule in budgeting?",
      options: ["50% needs, 30% wants, 20% savings", "50% savings, 30% needs, 20% wants", "50% wants, 30% needs, 20% savings", "50% income, 30% expenses, 20% debt"],
      correctAnswer: 0,
      explanation: "The 50/30/20 rule suggests allocating 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment.",
      difficulty: "easy",
      category: "budgeting"
    },
    {
      question: "What does 'paying yourself first' mean in budgeting?",
      options: ["Paying your bills before buying wants", "Setting aside money for saving before other expenses", "Giving yourself a regular allowance", "Taking your salary before paying taxes"],
      correctAnswer: 1,
      explanation: "Paying yourself first means setting aside money for savings goals before spending on other expenses, making saving a priority.",
      difficulty: "easy",
      category: "budgeting"
    },
    {
      question: "What is a zero-based budget?",
      options: ["A budget where you spend nothing", "A budget that always equals zero at the end of the month", "A budget that starts from zero each month", "A budget with no fixed expenses"],
      correctAnswer: 1,
      explanation: "A zero-based budget is when your income minus expenses equals zero because every dollar has a specific purpose, including saving and investing.",
      difficulty: "medium",
      category: "budgeting"
    },
    {
      question: "Which budgeting method uses envelopes filled with cash for different spending categories?",
      options: ["Zero-based budgeting", "50/30/20 method", "Envelope budgeting", "Value-based budgeting"],
      correctAnswer: 2,
      explanation: "Envelope budgeting involves placing cash in physical or digital envelopes for different spending categories, and when an envelope is empty, you stop spending in that category.",
      difficulty: "medium",
      category: "budgeting"
    },
    {
      question: "What is the term for expenses that vary from month to month?",
      options: ["Variable expenses", "Discretionary expenses", "Flexible expenses", "Indirect expenses"],
      correctAnswer: 0,
      explanation: "Variable expenses are costs that change from month to month, such as groceries, entertainment, or utility bills.",
      difficulty: "easy",
      category: "budgeting"
    },
    
    // Savings Category
    {
      question: "What is an emergency fund?",
      options: ["Money set aside for vacations", "Money saved for retirement", "Money kept for unexpected expenses", "Money invested in stocks"],
      correctAnswer: 2,
      explanation: "An emergency fund is money set aside specifically for unexpected expenses like medical emergencies, car repairs, or job loss.",
      difficulty: "easy",
      category: "savings"
    },
    {
      question: "How many months of expenses should an ideal emergency fund cover?",
      options: ["1-2 months", "3-6 months", "7-9 months", "10-12 months"],
      correctAnswer: 1,
      explanation: "Financial experts typically recommend having 3-6 months of essential expenses saved in an emergency fund.",
      difficulty: "easy",
      category: "savings"
    },
    {
      question: "What type of account typically offers the highest interest rate?",
      options: ["Checking account", "Basic savings account", "Certificate of Deposit (CD)", "Money market account"],
      correctAnswer: 2,
      explanation: "Certificates of Deposit (CDs) typically offer higher interest rates than standard checking, savings, or money market accounts because they require you to lock up your money for a set period.",
      difficulty: "medium",
      category: "savings"
    },
    {
      question: "What is a Health Savings Account (HSA)?",
      options: ["An account for general medical expenses", "A tax-advantaged account for medical expenses", "A government health insurance program", "A retirement account for healthcare workers"],
      correctAnswer: 1,
      explanation: "An HSA is a tax-advantaged savings account available to people with high-deductible health plans, used for qualified medical expenses.",
      difficulty: "medium",
      category: "savings"
    },
    {
      question: "What is the Rule of 72 used for?",
      options: ["Calculating how fast inflation erodes savings", "Determining retirement age", "Estimating how long it takes for money to double", "Calculating tax advantages"],
      correctAnswer: 2,
      explanation: "The Rule of 72 is a simple way to estimate how long it will take for money to double at a given interest rate. Divide 72 by the interest rate to get the approximate number of years.",
      difficulty: "hard",
      category: "savings"
    },
    
    // Credit Category
    {
      question: "What is a credit score?",
      options: ["The total amount of debt you owe", "A numerical representation of your creditworthiness", "The interest rate on your credit card", "The credit limit on your account"],
      correctAnswer: 1,
      explanation: "A credit score is a numerical representation of your creditworthiness based on your credit history, used by lenders to evaluate risk.",
      difficulty: "easy",
      category: "credit"
    },
    {
      question: "What is the typical range for a FICO credit score?",
      options: ["0-100", "100-500", "300-850", "500-1000"],
      correctAnswer: 2,
      explanation: "FICO credit scores typically range from 300 to 850, with higher scores indicating better creditworthiness.",
      difficulty: "easy",
      category: "credit"
    },
    {
      question: "What is the most important factor in calculating your credit score?",
      options: ["Credit utilization", "Payment history", "Length of credit history", "Types of credit"],
      correctAnswer: 1,
      explanation: "Payment history—whether you've paid your credit accounts on time—is the most important factor in calculating your credit score, accounting for about 35% of a FICO score.",
      difficulty: "medium",
      category: "credit"
    },
    {
      question: "What does APR stand for in credit terms?",
      options: ["Annual Percentage Rate", "Average Payment Return", "Approved Personal Rate", "Additional Payment Requirement"],
      correctAnswer: 0,
      explanation: "APR stands for Annual Percentage Rate, which represents the yearly cost of funds over the term of a loan, including fees and interest.",
      difficulty: "easy",
      category: "credit"
    },
    {
      question: "What is a secured credit card?",
      options: ["A card that requires PIN for every purchase", "A card that is backed by a cash deposit", "A card with advanced security features", "A card with a very low interest rate"],
      correctAnswer: 1,
      explanation: "A secured credit card is backed by a cash deposit made by the cardholder, which serves as collateral. It's often used to build or rebuild credit.",
      difficulty: "medium",
      category: "credit"
    },
    
    // Taxes Category
    {
      question: "What is the difference between a tax deduction and a tax credit?",
      options: ["They are the same thing", "A deduction reduces taxable income, a credit reduces tax owed", "A credit is for businesses, a deduction is for individuals", "A deduction is refundable, a credit is not"],
      correctAnswer: 1,
      explanation: "A tax deduction reduces the amount of income subject to taxation, while a tax credit directly reduces the amount of tax owed, dollar for dollar.",
      difficulty: "medium",
      category: "taxes"
    },
    {
      question: "What is a W-2 form?",
      options: ["A form for self-employed income", "A tax refund form", "A wage and tax statement from your employer", "A form to claim dependents"],
      correctAnswer: 2,
      explanation: "A W-2 is a Wage and Tax Statement provided by employers that shows total earnings and taxes withheld for the year.",
      difficulty: "easy",
      category: "taxes"
    },
    {
      question: "What does it mean to itemize deductions on your tax return?",
      options: ["To list all your income sources", "To list specific deductible expenses rather than taking the standard deduction", "To pay taxes in installments", "To claim business expenses"],
      correctAnswer: 1,
      explanation: "Itemizing deductions means listing specific eligible expenses (like mortgage interest, charitable donations, etc.) rather than taking the standard deduction.",
      difficulty: "medium",
      category: "taxes"
    },
    {
      question: "What is capital gains tax?",
      options: ["Tax on your regular income", "Tax on profits from selling investments", "Tax on property", "Tax on retirement withdrawals"],
      correctAnswer: 1,
      explanation: "Capital gains tax is a tax on the profit realized on the sale of a non-inventory asset such as stocks, bonds, real estate, or other investments.",
      difficulty: "medium",
      category: "taxes"
    },
    {
      question: "What is tax-loss harvesting?",
      options: ["A way to defer taxes until retirement", "Claiming a tax refund", "Selling investments at a loss to offset capital gains", "Taking the standard deduction every year"],
      correctAnswer: 2,
      explanation: "Tax-loss harvesting is the strategy of selling investments at a loss to offset capital gains tax on other investments that were sold at a profit.",
      difficulty: "hard",
      category: "taxes"
    },
    
    // Retirement Category
    {
      question: "What is a 401(k)?",
      options: ["A government pension program", "A type of health insurance", "An employer-sponsored retirement plan", "A college savings account"],
      correctAnswer: 2,
      explanation: "A 401(k) is an employer-sponsored retirement plan that allows employees to save and invest a portion of their paycheck before taxes are taken out.",
      difficulty: "easy",
      category: "retirement"
    },
    {
      question: "At what age can you typically start making penalty-free withdrawals from retirement accounts?",
      options: ["55", "59½", "62", "65"],
      correctAnswer: 1,
      explanation: "In most retirement accounts, you can start making penalty-free withdrawals at age 59½. Earlier withdrawals typically incur a 10% penalty plus taxes.",
      difficulty: "medium",
      category: "retirement"
    },
    {
      question: "What is an IRA?",
      options: ["International Retirement Association", "Individual Retirement Account", "Income Reporting Application", "Investment Risk Assessment"],
      correctAnswer: 1,
      explanation: "An IRA (Individual Retirement Account) is a tax-advantaged investing account designed to help people save for retirement.",
      difficulty: "easy",
      category: "retirement"
    },
    {
      question: "What is the '4% rule' in retirement planning?",
      options: ["Withdraw 4% of your salary for retirement savings", "Ensure retirement income is 4% of your final salary", "Withdraw 4% of your retirement savings annually", "Invest 4% of your portfolio in bonds"],
      correctAnswer: 2,
      explanation: "The 4% rule suggests withdrawing 4% of your retirement savings in the first year of retirement and adjusting for inflation in subsequent years, as a sustainable withdrawal rate.",
      difficulty: "medium",
      category: "retirement"
    },
    {
      question: "What is a defined benefit pension plan?",
      options: ["A plan where benefits depend on investment performance", "A plan that guarantees a specified monthly benefit in retirement", "A self-directed retirement account", "A government-sponsored retirement plan"],
      correctAnswer: 1,
      explanation: "A defined benefit pension plan guarantees a specified monthly benefit in retirement, often based on salary history and years of service with an employer.",
      difficulty: "medium",
      category: "retirement"
    },
    
    // Insurance Category
    {
      question: "What is a deductible in insurance?",
      options: ["The monthly premium amount", "The amount you pay before insurance coverage begins", "The maximum insurance will pay", "A tax-deductible insurance payment"],
      correctAnswer: 1,
      explanation: "A deductible is the amount you must pay out-of-pocket for covered services before your insurance begins to pay.",
      difficulty: "easy",
      category: "insurance"
    },
    {
      question: "What type of insurance covers damage to your vehicle from an accident?",
      options: ["Liability insurance", "Comprehensive insurance", "Collision insurance", "Gap insurance"],
      correctAnswer: 2,
      explanation: "Collision insurance covers damage to your vehicle resulting from a collision with another vehicle or object, regardless of fault.",
      difficulty: "medium",
      category: "insurance"
    },
    {
      question: "What is the purpose of life insurance?",
      options: ["To cover medical expenses", "To provide financial protection to dependents after your death", "To pay for retirement", "To cover property damage"],
      correctAnswer: 1,
      explanation: "Life insurance is designed to provide financial protection to your dependents or beneficiaries in the event of your death.",
      difficulty: "easy",
      category: "insurance"
    },
    {
      question: "What is an insurance premium?",
      options: ["The amount paid for an insurance policy", "The amount the insurer pays for a claim", "The deductible amount", "The coverage limit"],
      correctAnswer: 0,
      explanation: "An insurance premium is the amount paid for an insurance policy, typically on a monthly, semi-annual, or annual basis.",
      difficulty: "easy",
      category: "insurance"
    },
    {
      question: "What is an umbrella insurance policy?",
      options: ["Insurance for natural disasters", "Insurance for personal property", "Insurance that provides additional liability coverage", "Insurance for business owners"],
      correctAnswer: 2,
      explanation: "An umbrella insurance policy provides additional liability coverage beyond the limits of your homeowners, auto, or other basic liability policies.",
      difficulty: "medium",
      category: "insurance"
    },
    
    // Debt Management Category
    {
      question: "What is the debt snowball method?",
      options: ["Paying off the highest interest rate debt first", "Paying off the lowest balance debt first", "Consolidating all debts into one payment", "Taking on more debt to pay existing debt"],
      correctAnswer: 1,
      explanation: "The debt snowball method involves paying off debts from smallest to largest balance, regardless of interest rate, to build momentum and motivation.",
      difficulty: "easy",
      category: "debt"
    },
    {
      question: "What is the debt avalanche method?",
      options: ["Paying off the highest interest rate debt first", "Paying off the lowest balance debt first", "Consolidating all debts into one payment", "Taking on more debt to pay existing debt"],
      correctAnswer: 0,
      explanation: "The debt avalanche method involves paying off debts in order from highest interest rate to lowest, which saves the most money in interest over time.",
      difficulty: "easy",
      category: "debt"
    },
    {
      question: "What is debt consolidation?",
      options: ["Bankruptcy protection", "Combining multiple debts into a single payment", "Settling debt for less than owed", "Transferring credit card balances"],
      correctAnswer: 1,
      explanation: "Debt consolidation involves combining multiple debts into a single loan, often to secure a lower interest rate or lower monthly payment.",
      difficulty: "medium",
      category: "debt"
    },
    {
      question: "What is a debt-to-income ratio?",
      options: ["The ratio of good debt to bad debt", "The ratio of your monthly debt payments to your gross monthly income", "The ratio of total debt to total assets", "The ratio of interest to principal in debt payments"],
      correctAnswer: 1,
      explanation: "Debt-to-income ratio is the percentage of your gross monthly income that goes toward paying debts. Lenders use this to evaluate borrowing risk.",
      difficulty: "medium",
      category: "debt"
    },
    {
      question: "What typically happens to your credit score when you close a credit card account?",
      options: ["It always increases", "It always decreases", "It can decrease if it impacts your credit utilization ratio", "It's not affected"],
      correctAnswer: 2,
      explanation: "Closing a credit card can decrease your credit score if it increases your credit utilization ratio (the percentage of available credit you're using) or reduces the average age of your accounts.",
      difficulty: "hard",
      category: "debt"
    }
  ];
  
  export default financialTriviaQuestions;