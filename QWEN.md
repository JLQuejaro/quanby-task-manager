# QWEN.md - Comprehensive Guide for Qwen Code AI

## Purpose
This file instructs Qwen Code AI to assist in **analyzing, debugging, and improving** the Quanby Task Manager project:  
[https://github.com/JLQuejaro/quanby-task-manager.git](https://github.com/JLQuejaro/quanby-task-manager.git)  

Goal: **Enhance functionality, reduce errors, and ensure smooth operation** across all features including login, registration, task management, notifications, and Google Sign-In integration.

---

## Project Context
- **Tech Stack:** TypeScript, Node.js, Express, PostgreSQL , HTML/CSS/JS, Google Sign-In integration.
- **Primary Features:**
  1. Login and registration with email verification and optional Google Sign-In.
  2. Task creation, editing, deletion, and management.
  3. Notifications for task updates and user actions.
  4. User account management including profile and password settings.
  5. Dashboard showing user tasks and activity.

---

## Instructions for Qwen Code AI

### 1. Login & Registration
- Display notification if account does not exist: `"This account doesn’t exist. Please register first."`
- Redirect non-existing users to **registration page**.
- Ensure **email verification** is completed before login.
- Require **account verification** for extra security.
- Fix logic for **existing vs. non-existing accounts**.
- Google Sign-In: allow login/register without password; enable password changes; verify Google-linked email.

### 2. Task Management
- Ensure users can **create, edit, delete, and mark tasks as completed** without errors.
- Validate input data and handle database errors.
- Ensure tasks are properly displayed in the dashboard with correct sorting/filtering.

### 3. Notifications
- Ensure notifications show **real-time updates** for task changes or system messages.
- Validate notification content and timing.
- Avoid duplication of notifications.

### 4. User Account Management
- Ensure users can **update profiles, change passwords, and manage account settings** safely.
- Properly handle errors when updating data.
- Protect sensitive data and follow security best practices.

### 5. Error Minimization
- Validate all forms and database calls.
- Properly handle asynchronous operations (await, try/catch).
- Suggest improvements to reduce potential bugs in all flows.

### 6. Code Quality & Best Practices
- Refactor redundant or messy code.
- Follow TypeScript typing standards.
- Ensure modular, reusable, and maintainable code structure.

### 7. Testing & Validation
- Suggest **manual and programmatic tests** for login, registration, tasks, notifications, and user management.
- Highlight potential **security, logical, and performance issues**.

---

## Additional Notes
- Provide **concise, step-by-step code fixes**.
- Highlight security and logic flaws.
- Responses should be **actionable and easy to implement**.
- Prioritize minimizing errors while maintaining full functionality.

