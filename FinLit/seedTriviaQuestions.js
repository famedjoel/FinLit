/* eslint-disable no-undef */
import TriviaQuestion from './models/TriviaQuestion.js';
import connectDB from './config/db.js';

// Financial trivia questions database
const questionsData = {
  easy: [
    {
      question: "What is a budget?",
      options: [
        "A type of investment",
        "A plan for managing income and expenses",
        "A type of loan",
        "A government tax"
      ],
      correctAnswer: 1,
      explanation: "A budget is a financial plan that outlines your income and expenses, helping you manage your money effectively."
    },
    {
      question: "What is compound interest?",
      options: [
        "Interest only on the principal amount",
        "Interest that doesn't change over time",
        "Interest on both the principal and accumulated interest",
        "Interest that decreases over time"
      ],
      correctAnswer: 2,
      explanation: "Compound interest is calculated on both the initial principal and the accumulated interest, making your money grow faster over time."
    },
    {
      question: "What is the purpose of an emergency fund?",
      options: [
        "To pay for vacations",
        "To buy luxury items",
        "To cover unexpected expenses",
        "To invest in stocks"
      ],
      correctAnswer: 2,
      explanation: "An emergency fund is money set aside for unexpected expenses like medical emergencies, car repairs, or job loss."
    },
    {
      question: "What is a 401(k)?",
      options: [
        "A type of loan",
        "A retirement savings plan",
        "A credit card",
        "A tax form"
      ],
      correctAnswer: 1,
      explanation: "A 401(k) is a retirement savings plan sponsored by an employer that allows workers to save and invest a portion of their paycheck before taxes are taken out."
    },
    {
      question: "What is the difference between a debit card and a credit card?",
      options: [
        "There is no difference",
        "Debit cards are more secure",
        "Debit cards use money from your account; credit cards borrow money",
        "Credit cards cannot be used online"
      ],
      correctAnswer: 2,
      explanation: "A debit card uses money directly from your bank account, while a credit card allows you to borrow money up to a certain limit that you must pay back later."
    },
    {
      question: "What is a credit score?",
      options: [
        "Your bank account balance",
        "A number that represents your creditworthiness",
        "The amount of credit card debt you have",
        "Your annual income"
      ],
      correctAnswer: 1,
      explanation: "A credit score is a number (usually between 300-850) that represents your creditworthiness based on your credit history."
    },
    {
      question: "What does 'net income' mean?",
      options: [
        "Total income before any deductions",
        "Income after all taxes and deductions",
        "Money spent on internet services",
        "Business profits only"
      ],
      correctAnswer: 1,
      explanation: "Net income is the amount of money you take home after all deductions like taxes, insurance, and retirement contributions are subtracted from your gross income."
    },
    {
      question: "What is inflation?",
      options: [
        "Rising stock prices",
        "Increasing interest rates",
        "A general increase in prices and fall in purchasing value of money",
        "Economic growth"
      ],
      correctAnswer: 2,
      explanation: "Inflation is a general increase in prices and fall in the purchasing value of money over time, meaning the same amount of money buys less than it did before."
    },
    {
      question: "What is the main purpose of a savings account?",
      options: [
        "To earn high returns on investments",
        "To save money safely with some interest",
        "To pay bills automatically",
        "To borrow money when needed"
      ],
      correctAnswer: 1,
      explanation: "A savings account is designed to keep your money safe while earning a small amount of interest, unlike investment accounts which aim for higher returns with more risk."
    },
    {
      question: "What is a deductible in insurance?",
      options: [
        "The monthly payment for insurance",
        "The amount you pay before insurance covers costs",
        "The total amount insurance will pay",
        "A tax benefit for having insurance"
      ],
      correctAnswer: 1,
      explanation: "A deductible is the amount you must pay out-of-pocket before your insurance company begins to cover costs."
    },
    {
      question: "Which of these is NOT typically considered a fixed expense?",
      options: [
        "Mortgage payment",
        "Dining out",
        "Car insurance premium",
        "Internet bill"
      ],
      correctAnswer: 1,
      explanation: "Dining out is a variable expense because the amount can change each month and it's discretionary, unlike fixed expenses like mortgage, insurance, or utility bills that stay relatively constant."
    },
    {
      question: "What is gross income?",
      options: [
        "Income after taxes",
        "Total income before any deductions",
        "Business profit after expenses",
        "Income from investments only"
      ],
      correctAnswer: 1,
      explanation: "Gross income is the total amount of money you earn before taxes and other deductions are taken out."
    }
  ],
  medium: [
    {
      question: "What is diversification in investing?",
      options: [
        "Investing all money in a single stock",
        "Spreading investments across various assets to reduce risk",
        "Investing only in foreign markets",
        "Frequently trading stocks"
      ],
      correctAnswer: 1,
      explanation: "Diversification means spreading your investments across different asset types to reduce risk, following the principle of not putting all your eggs in one basket."
    },
    {
      question: "What is an index fund?",
      options: [
        "A high-risk investment option",
        "A fund that tracks a specific market index like the S&P 500",
        "A government bond",
        "A type of savings account"
      ],
      correctAnswer: 1,
      explanation: "An index fund is a type of mutual fund or ETF that aims to track the returns of a market index, such as the S&P 500, offering broad market exposure with low operating expenses."
    },
    {
      question: "What is a mortgage?",
      options: [
        "A savings account for home buyers",
        "A loan to buy stocks",
        "A loan used to purchase real estate",
        "A type of insurance"
      ],
      correctAnswer: 2,
      explanation: "A mortgage is a loan from a bank or financial institution that helps you purchase a house or other real estate, typically paid back over 15-30 years."
    },
    {
      question: "What is an IRA?",
      options: [
        "International Revenue Agency",
        "Individual Retirement Account",
        "Internal Rate Assessment",
        "Investment Return Analysis"
      ],
      correctAnswer: 1,
      explanation: "An IRA (Individual Retirement Account) is a tax-advantaged investment account designed to help you save for retirement."
    },
    {
      question: "What is the Rule of 72 in finance?",
      options: [
        "A tax regulation",
        "A formula to estimate how long it takes for an investment to double",
        "A banking regulation",
        "A credit score requirement"
      ],
      correctAnswer: 1,
      explanation: "The Rule of 72 is a simple way to determine how long it will take for an investment to double by dividing 72 by the annual rate of return."
    },
    {
      question: "What is a bear market?",
      options: [
        "A market where prices are rising",
        "A market where prices are falling",
        "A market only for agricultural products",
        "A market open only to institutional investors"
      ],
      correctAnswer: 1,
      explanation: "A bear market refers to a market condition where prices are falling and investor confidence is low, typically defined as a 20% or more decline from recent highs."
    },
    {
      question: "What is the main purpose of a health savings account (HSA)?",
      options: [
        "To pay for any personal expenses",
        "To save for retirement only",
        "To cover qualified medical expenses with tax advantages",
        "To invest in the stock market"
      ],
      correctAnswer: 2,
      explanation: "A Health Savings Account (HSA) is a tax-advantaged savings account designed specifically for qualified medical expenses when paired with high-deductible health plans."
    },
    {
      question: "What does 'APY' stand for in banking?",
      options: [
        "Annual Percentage Yield",
        "Average Payment Yearly",
        "Additional Profit Yearly",
        "Accrued Penalty Yield"
      ],
      correctAnswer: 0,
      explanation: "APY stands for Annual Percentage Yield, which is the real rate of return earned on a savings deposit or investment taking into account the effect of compounding interest."
    },
    {
      question: "What is a bond in investing?",
      options: [
        "A share of ownership in a company",
        "A debt security where you lend money to an entity",
        "A tax-free investment account",
        "A type of real estate investment"
      ],
      correctAnswer: 1,
      explanation: "A bond is a debt security where you essentially lend money to a government, municipality, corporation, or other entity, which borrows the funds for a defined period at a variable or fixed interest rate."
    },
    {
      question: "What is dollar-cost averaging?",
      options: [
        "Converting investments from one currency to another",
        "Investing a fixed amount at regular intervals, regardless of share price",
        "Buying stocks only when prices fall below a dollar",
        "Calculating investment returns in dollar terms"
      ],
      correctAnswer: 1,
      explanation: "Dollar-cost averaging is an investment strategy where you invest a fixed amount at regular intervals, regardless of share price, which can reduce the impact of volatility on the overall purchase."
    },
    {
      question: "What does it mean to 'short' a stock?",
      options: [
        "To buy a small amount of a company's stock",
        "To hold a stock for a short period of time",
        "To bet that a stock's price will fall",
        "To buy stocks in small-cap companies"
      ],
      correctAnswer: 2,
      explanation: "Shorting a stock means borrowing shares and selling them with the intention of buying them back later at a lower price, essentially betting that the stock's price will decrease."
    },
    {
      question: "What is a mutual fund?",
      options: [
        "A fund that only invests in government bonds",
        "A pool of money from many investors to invest in stocks, bonds, etc.",
        "A retirement account only for government employees",
        "A type of bank account with multiple owners"
      ],
      correctAnswer: 1,
      explanation: "A mutual fund is a pooled investment vehicle that allows many investors to combine their money to invest in a diversified portfolio of stocks, bonds, or other securities, managed by professionals."
    }
  ],
  hard: [
    {
      question: "What is the difference between monetary policy and fiscal policy?",
      options: [
        "Monetary policy deals with government spending; fiscal policy deals with interest rates",
        "Monetary policy is implemented by central banks; fiscal policy by the government",
        "They are two terms for the same policy",
        "Monetary policy is international; fiscal policy is domestic"
      ],
      correctAnswer: 1,
      explanation: "Monetary policy is controlled by central banks and involves changing interest rates and money supply, while fiscal policy is implemented by the government through taxes and spending."
    },
    {
      question: "What is a derivative in finance?",
      options: [
        "A direct investment in a company",
        "A financial security with a value that depends on underlying assets",
        "A type of cryptocurrency",
        "A government bond"
      ],
      correctAnswer: 1,
      explanation: "A derivative is a financial security whose value is derived from an underlying asset or group of assets, such as stocks, bonds, commodities, currencies, interest rates, or market indexes."
    },
    {
      question: "What is the efficient market hypothesis?",
      options: [
        "The theory that market prices fully reflect all available information",
        "The idea that markets always go up in the long run",
        "A theory about efficient production methods",
        "The concept that government regulation makes markets efficient"
      ],
      correctAnswer: 0,
      explanation: "The Efficient Market Hypothesis (EMH) suggests that stock prices reflect all information and consistent alpha generation is impossible, making markets 'efficient'."
    },
    {
      question: "What is the difference between systematic and unsystematic risk?",
      options: [
        "Systematic risk is predictable; unsystematic risk is unpredictable",
        "Systematic risk is higher; unsystematic risk is lower",
        "Systematic risk affects the entire market; unsystematic risk affects only specific industries or companies",
        "They are two terms for the same type of risk"
      ],
      correctAnswer: 2,
      explanation: "Systematic risk (market risk) affects the entire market and can't be diversified away, while unsystematic risk is specific to individual companies or industries and can be reduced through diversification."
    },
    {
      question: "What is the purpose of the Federal Reserve's 'Quantitative Easing'?",
      options: [
        "To increase tax revenue",
        "To reduce unemployment directly",
        "To stimulate economic growth by increasing the money supply",
        "To reduce government spending"
      ],
      correctAnswer: 2,
      explanation: "Quantitative Easing (QE) is when a central bank purchases securities to increase the money supply, reduce interest rates, and encourage lending and investment to stimulate economic growth."
    },
    {
      question: "What is a 'dead cat bounce' in stock market terminology?",
      options: [
        "A small recovery in price of a stock after a substantial fall",
        "A long period of market stagnation",
        "The final phase of a bull market",
        "A market correction"
      ],
      correctAnswer: 0,
      explanation: "A 'dead cat bounce' is a temporary recovery in the price of a declining stock or market, which is followed by a continuation of the downward trend."
    },
    {
      question: "What is the Price-to-Earnings (P/E) ratio?",
      options: [
        "The ratio of a company's debt to its equity",
        "The ratio of a company's market price per share to its earnings per share",
        "The percentage of profits paid to shareholders",
        "The ratio of a company's price to its total sales"
      ],
      correctAnswer: 1,
      explanation: "The Price-to-Earnings (P/E) ratio is a valuation ratio calculated by dividing a company's current share price by its earnings per share, helping investors compare relative values of companies."
    },
    {
      question: "What is 'arbitrage' in financial markets?",
      options: [
        "The process of selling stocks when prices are falling",
        "Taking advantage of price differences in different markets for the same asset",
        "A type of high-risk investment strategy",
        "The practice of timing the market"
      ],
      correctAnswer: 1,
      explanation: "Arbitrage is the practice of simultaneously buying and selling an asset in different markets to profit from tiny differences in the asset's listed price, taking advantage of market inefficiencies."
    },
    {
      question: "What is the 'yield curve' in bond markets?",
      options: [
        "The total return of a bond over its lifetime",
        "A graph showing bond yields across different maturity dates",
        "The curve representing a bond's price over time",
        "The maximum interest rate a bond can pay"
      ],
      correctAnswer: 1,
      explanation: "The yield curve is a graph that plots the yields (interest rates) of bonds with equal credit quality but differing maturity dates. It's used to predict economic activity and interest rate changes."
    },
    {
      question: "What is the Capital Asset Pricing Model (CAPM)?",
      options: [
        "A model for calculating depreciation of capital assets",
        "A model that describes the relationship between risk and expected return",
        "A taxation model for capital gains",
        "A method for pricing initial public offerings"
      ],
      correctAnswer: 1,
      explanation: "The Capital Asset Pricing Model (CAPM) is a model that describes the relationship between systematic risk and expected return for assets, particularly stocks, used to price risky securities."
    },
    {
      question: "What is meant by 'duration' in bond investing?",
      options: [
        "The time until a bond matures",
        "A measure of a bond's sensitivity to interest rate changes",
        "The length of time a bond has been trading",
        "The period over which a bond pays interest"
      ],
      correctAnswer: 1,
      explanation: "Duration is a measure of a bond's sensitivity to interest rate changes. It indicates how much a bond's price might change when interest rates move, helping investors understand risk."
    },
    {
      question: "What is a 'straddle' in options trading?",
      options: [
        "Buying both call and put options with the same strike price and expiration",
        "Trading stocks on multiple exchanges",
        "Holding positions in competing companies",
        "Splitting an investment between stocks and bonds"
      ],
      correctAnswer: 0,
      explanation: "A straddle is an options strategy involving buying both a call option and a put option for the same underlying security, with the same strike price and expiration date, allowing investors to profit from significant price movements in either direction."
    }
  ]
};

// Categories for additional organization
const categories = [
  'personal-finance',
  'investing',
  'retirement',
  'banking',
  'credit',
  'taxes',
  'insurance',
  'real-estate',
  'business',
  'economics'
];

// Function to seed the database with trivia questions
async function seedTriviaQuestions() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database');
    
    // Prepare all questions with appropriate difficulty levels
    const allQuestions = [];
    
    for (const [difficulty, questions] of Object.entries(questionsData)) {
      console.log(`Processing ${questions.length} ${difficulty} questions...`);
      
      // Add each question with the appropriate difficulty
      questions.forEach(question => {
        // Randomly assign a category for demonstration
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        allQuestions.push({
          ...question,
          difficulty,
          category: randomCategory
        });
      });
    }
    
    console.log(`Prepared ${allQuestions.length} questions for insertion`);
    
    // Insert all questions at once
    console.log('Inserting questions...');
    await TriviaQuestion.bulkInsert(allQuestions);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTriviaQuestions();