# Kaaravaan – Offline Trip Planner & Expense Tracker

Kaaravaan is an **offline-first mobile application** that allows users to plan trips and track expenses without requiring an internet connection. The app ensures reliable access to trip details and expense data even in low or no connectivity environments.

The goal of this project was to build a lightweight and reliable mobile tool for travelers where trip planning and expense tracking work seamlessly **without network dependency**.

---

## Features

- Create and manage trips
- Add and track expenses for each trip
- Offline-first functionality (no internet required)
- Persistent local storage to retain data across app restarts
- Visual spending analytics using charts
- Clean and responsive mobile UI

---

## Tech Stack

**Frontend**
- React Native
- TypeScript
- Expo

**State Management**
- React Hooks

**Storage**
- Local persistent storage

**Visualization**
- Chart-based expense analytics

---

## Screenshots

### Trip Dashboard
![Trip Dashboard](screenshots/dashboard.png)

### Expense Tracking
![Expense Tracking](screenshots/expenses.png)

### Expense Analytics
![Analytics](screenshots/analytics.png)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/AarinK/Kaaravaan.git
```

### 2. Navigate to the project directory

```bash
cd Kaaravaan
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the development server

```bash
npx expo start
```

You can then run the app using:

- Expo Go on your mobile device
- Android Emulator
- iOS Simulator

---

## Project Structure

```
Kaaravaan
│
├── components      # Reusable UI components
├── screens         # Application screens
├── assets          # Images, icons and static files
├── utils           # Helper functions
└── App.tsx         # Application entry point
```

---

## Key Learnings

While building this project, I gained hands-on experience with:

- Designing **offline-first mobile applications**
- Managing **local data persistence**
- Building modular and reusable **React Native components**
- Implementing **expense analytics and visualization**
- Structuring scalable mobile app architecture

---

## Future Improvements

- Cloud sync for multi-device access
- Group trip planning and shared expenses
- Budget alerts and spending limits
- Export trip reports

---

## Author

**Aarin Kachroo**

GitHub: https://github.com/AarinK  
LinkedIn: https://www.linkedin.com/in/aarinkachroo/

---

## License

This project is open source and available under the MIT License.
