# 🎓 IngeniaQ - Academic Management System (Client)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**IngeniaQ Client** is the frontend interface for the IngeniaQ Academic System. It provides a comprehensive dashboard for Students, Teachers, and Administrators to manage courses, grades, attendance, and tutoring sessions effectively.

## ✨ Key Features

### 👨‍🎓 Student Module
* **Academic Dashboard:** Real-time summary of pending tasks and current grades.
* **Agenda & Calendar:** Manage deadlines and personal events.
* **Tutoring Booking:** Search and book reinforcement sessions (Virtual/In-person).
* **Grade History:** View curriculum progress and academic history.

### 👩‍🏫 Teacher Module
* **Course Management:** Manage activities, assignments, and exams.
* **Grading Book:** Real-time calculation of weighted averages (Individual, Group, Midterm, Final).
* **Attendance Tracking:** Mark students as Present, Late, or Absent.
* **Tutoring Scheduler:** Create and manage tutoring availability.

### 🛡️ Admin Module
* **User Management:** Create and manage accounts.
* **Academic Period Control:** Open/Close semesters.
* **System Configuration:** Global settings.

## 🛠️ Tech Stack

* **Framework:** React 18 (Vite)
* **Language:** TypeScript
* **Styling:** Tailwind CSS + Lucide React (Icons)
* **State Management:** Zustand (Persisted Auth Store)
* **Routing:** React Router DOM v6
* **HTTP Client:** Axios

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/your-username/ingeniaq-client.git](https://github.com/your-username/ingeniaq-client.git)
    cd ingeniaq-client
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env` file in the root directory:
    ```env
    VITE_API_URL=http://localhost:3000/api
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

## 🐳 Docker Deployment

To build and run this application in a production container using Nginx:

1.  **Build the image:**
    ```bash
    docker build -t ingeniaq-client .
    ```

2.  **Run the container:**
    ```bash
    docker run -d -p 80:80 --name ingeniaq-frontend ingeniaq-client
    ```

Open [http://localhost](http://localhost) to view it in the browser.

## 📂 Project Structure

```bash
src/
├── api/            # Axios configuration
├── components/     # Reusable UI components
├── pages/          # Application views
│   ├── admin/      # Administrator pages
│   ├── auth/       # Login & Security
│   ├── student/    # Student specific pages
│   ├── teacher/    # Teacher specific pages
│   └── shared/     # Shared profiles/layouts
├── store/          # Zustand state (Auth)
├── utils/          # Helpers & Theme logic
└── App.tsx         # Main Routing