# Rent vs Buy Financial Model

A highly advanced, interactive React-based financial modeling tool designed to calculate the true wealth accumulation of Renting vs. Buying real estate over decades. Built with a focus on transforming/developing economies, it handles highly complex macroeconomic variables that traditional calculators miss.

## 🚀 Key Features

- **Macroeconomic Floating Interest Rates:** Long-term repo rates drop as developing economies mature. This model allows you to configure "Eras" (e.g., Emerging, Maturing, Developed) and dynamically restructures the loan EMI whenever the central bank rate drops, perfectly mimicking real-world mortgages.
- **Phased Property Appreciation:** Real estate doesn't grow at a flat rate forever. Configure distinct lifecycle phases (High Growth, Normal, Mature, Terminal) to accurately model the S-curve of property values in developing cities.
- **Construction Linked Plans (CLP):** Seamlessly model under-construction properties. Configure custom builder payment milestones based on construction progress, and the engine correctly delays EMI commencement while tracking pre-EMI interest.
- **Differential Capital XIRR:** The model automatically strips out "sunk living costs" (like rent) from both equations, solving for the true **Extended Internal Rate of Return (XIRR)** on your discretionary equity using a highly robust Bisection Method algorithm.
- **Local Storage Persistence:** Instantly saves your highly-customized scenarios to your browser so you never lose your inputs on refresh.
- **Beautiful Visualizations:** Built with Recharts, trace the "Wealth Difference" and "Net Worth Over Time" through overlapping Area Charts to easily identify your break-even year.

## 🛠 Tech Stack

- **Framework:** React + Vite
- **Styling:** Vanilla CSS (Glassmorphism UI)
- **Charting:** Recharts
- **Icons:** Lucide React

## 💻 How to Run Locally

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the URL provided in the terminal (usually `http://localhost:5173`).

## 🧠 Methodology Overview

The math engine evaluates two parallel universes:
1. **The Renting Universe:** You invest your intended Down Payment into the stock market. Every month, you pay Rent (which inflates annually with property values). The difference between the house EMI you *would* have paid and your rent is invested as a monthly SIP into the market at your chosen CAGR. 
2. **The Buying Universe:** You pay the Down Payment and take a dynamically-adjusting mortgage. You live rent-free (Imputed Rent). The model tracks your equity (Property Value - Remaining Loan Balance) while accounting for pre-EMI interest during the construction phase.

## 📄 License

MIT License. Feel free to fork and customize for your own financial planning!
