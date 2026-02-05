# IngenIA-Q - Backend Server 🧠

This repository contains the RESTful API for **IngenIA-Q**, an Intelligent Academic Management System designed to optimize the university experience for students, teachers, and administrators.

It powers the academic mesh tracking, grading systems, attendance, and the **AI Tutor** (powered by Google Gemini).

## 🛠️ Tech Stack

* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **Language:** TypeScript
* **Databases:**
    * **PostgreSQL** (via Prisma ORM): Relational data (Users, Courses, Grades).
    * **MongoDB** (via Mongoose): Unstructured data (Chat logs, AI interactions).
* **AI Integration:** Google Generative AI (Gemini 1.5 Flash).
* **Authentication:** JWT (JSON Web Tokens).
* **Containerization:** Docker.

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js installed (v18 or higher).
* PostgreSQL and MongoDB databases running (locally or via Docker).
* A Google Gemini API Key.

### 2. Installation

Navigate to the server directory and install dependencies:

```bash
cd server
npm install