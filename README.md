# Gym Hub: Smart Gym Management System

## Overview

Gym Hub is a web-based Smart Gym Management System designed to simplify and automate the day-to-day operations of modern fitness centers. The system provides a centralized platform for managing memberships, trainers, fitness classes, bookings, payments, workouts, hydration tracking, and user interactions.

The system also integrates an AI-based Exercise Form Correction module using computer vision. The module analyzes exercise posture and provides corrective feedback to help users perform exercises safely and effectively.

## Objectives

* Centralize gym management operations.
* Automate membership and payment management.
* Manage trainers, fitness classes, and bookings.
* Provide secure role-based access for Admins, Trainers, and Members.
* Allow members to track workouts, hydration, and fitness streaks.
* Provide AI-based exercise posture analysis and corrective feedback.
* Reduce administrative effort and errors.
* Improve member engagement and promote safer workout practices.

## Key Features

### 1. AI-Based Exercise Form Correction

Uses computer vision and pose analysis to detect incorrect exercise posture and provide corrective suggestions.

### 2. Membership Management

Allows administrators to create and manage membership plans, pricing tiers, renewals, and upgrades.

### 3. Trainer & Class Booking

Members can register for group fitness classes and schedule one-on-one training sessions through a booking system.

### 4. Workout & Hydration Tracking

Members can log workouts, monitor hydration, and maintain daily fitness streaks.

### 5. Payment Management

Supports online payment processing for memberships, trainer sessions, and class bookings.

### 6. Role-Based Dashboards

Provides separate workflows and permissions for:

* Administrators
* Trainers
* Members

### 7. Notifications & Engagement

Provides automated notifications such as class reminders, membership expiry alerts, payment confirmations, and trainer messages.

## System Modules

```text
Gym Hub
│
├── User & Role Management
├── Membership Management
├── Trainer Management
├── Class & Session Booking
├── Payment Management
├── Workout Tracking
├── Hydration & Streak Tracking
├── Notification System
└── AI Exercise Form Correction
```

## Technology Stack

### Frontend

* React.js
* Vite
* TypeScript
* Tailwind CSS
* HTML5
* CSS3

### Backend

* Next.js
* Node.js

### Authentication

* JWT (JSON Web Tokens)

### Database

* PostgreSQL
* Supabase
* Local JSON fallback for offline development

### Payment

* Stripe API

### Email

* Nodemailer
* SMTP

### AI & Computer Vision

* Python
* OpenCV
* MediaPipe Pose

### Cloud & Deployment

* Supabase
* Vercel
* Render

### Version Control

* Git
* GitHub

## Project Structure

```text
Software Project
│
├── README.md
│
├── gymhub-frontend-ai/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── backend/
│
├── ai-module/
│
├── database/
│
└── docs/
```

## Development Process

Gym Hub follows an Agile Scrum development approach. Development is divided into iterative sprints covering:

1. Requirement gathering and system architecture
2. Database design and authentication
3. User and role management
4. Membership management
5. Class and group booking
6. Trainer booking and fitness tracking
7. Payment and notification integration
8. AI exercise form correction
9. Testing and refinement
10. System integration and offline fallback
11. Security, optimization, and user acceptance testing
12. Final deployment and documentation

## Expected Outcomes

* Efficient management of gym operations.
* Reduced manual work and administrative errors.
* Improved scheduling and resource utilization.
* Secure access to gym services.
* Better tracking of member fitness progress.
* Computer vision-based exercise posture analysis.
* Corrective feedback for safer exercise practices.
* Improved overall member engagement.

## Project Information

**Project:** Gym Hub: Smart Gym Management System with AI-Based Exercise Form Correction

**Developer:** Samridhi Gusain

**Registration Number:** 24BPS1053

**Institution:** Vellore Institute of Technology, Chennai
