# Tamil Language Society Website

A full-stack web application for the Tamil Language Society, featuring user authentication, content management, and admin dashboard.

## Features

- User authentication (register, login, forgot password)
- User profile management
- Admin dashboard for content and user management
- Responsive design for all devices
- EJS templating for server-side rendering
- RESTful API endpoints
- MongoDB database integration

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- Express-session with connect-mongo for session management

### Frontend
- HTML5, CSS3, JavaScript
- EJS templating engine
- Responsive custom CSS
- Font Awesome icons

## Project Structure

```
├── backend/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Mongoose models
│   ├── public/         # Static assets
│   │   ├── assets/     # Images and other assets
│   │   ├── css/        # Stylesheets
│   │   └── js/         # Client-side JavaScript
│   ├── routes/         # API and page routes
│   ├── utils/          # Utility functions
│   ├── views/          # EJS templates
│   │   ├── admin/      # Admin page templates
│   │   ├── layouts/    # Layout templates
│   │   └── partials/   # Partial templates
│   ├── app.js          # Express application setup
│   └── server.js       # Server entry point
└── frontend/          # Frontend code (if separate from backend)
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/tamil-literary-society.git
   cd tamil-literary-society
   ```

2. Install dependencies
   ```
   cd backend
   npm install
   ```

3. Create a `.env` file in the `backend/config` directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/tamil_literary_society
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   SESSION_SECRET=your_session_secret
   ADMIN_EMAIL=admin@example.com
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/logout` - Logout a user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password
- `POST /api/auth/forgotpassword` - Request password reset
- `PUT /api/auth/resetpassword/:resettoken` - Reset password

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Admin
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/content` - Get website content
- `PUT /api/admin/content` - Update website content
- `GET /api/admin/messages` - Get contact messages
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

## Testing

This project uses Playwright for comprehensive end-to-end testing with optimized configuration for reliability and speed.

### Running Tests

**Run all tests (recommended):**
```bash
npx playwright test --project=chromium
```

**Debug a specific test:**
```bash
npx playwright test tests/[feature].spec.js --headed
```

**Run tests with UI mode:**
```bash
npx playwright test --ui
```

**View test reports:**
```bash
npx playwright show-report
```

### Test Coverage

The test suite covers all major features:
- **Authentication**: Login, signup, password reset, JWT validation
- **Public Website**: Homepage, navigation, books, ebooks, projects
- **Admin Panel**: Complete admin functionality, user management, CRUD operations
- **API Integration**: All backend endpoints with proper error handling
- **Chat System**: Real-time messaging, session management
- **File Storage**: Upload, download, bulk operations
- **Responsive Design**: Mobile, tablet, desktop viewports
- **Theme Toggle**: Light/dark mode across all components
- **Security**: Authentication, authorization, CSRF protection
- **Performance**: Load times, resource optimization
- **Accessibility**: WCAG compliance, keyboard navigation

### Test Configuration

Optimized configuration in `playwright.config.js`:
- **Chromium-only** execution for speed (WebKit fallback available)
- **15-second timeout** per test with fast failure
- **Headless mode** by default (use `--headed` for debugging)
- **Automatic screenshots** and console logs on failure
- **HTML, JSON, and JUnit reports** with visual summaries
- **Global setup/teardown** with server health checks
- **Retry logic** for flaky tests

### Server Requirements

Before running tests, ensure both servers are running:

**Backend Server (Port 8080):**
```bash
cd backend
node server.js
```

**Frontend Server (Port 3000):**
```bash
npx http-server -p 3000
```

The global setup will automatically verify both servers are accessible before starting tests.

### Test Reports

After running tests, reports are generated in:
- **HTML Report**: Interactive visual report at `http://localhost:9323`
- **JSON Report**: Machine-readable results in `test-results.json`
- **JUnit Report**: CI/CD compatible format in `test-results.xml`
- **Screenshots**: Failure screenshots in `test-results/` directory

### Optimized Test Files

The following optimized test files are available:
- `public-website-optimized.spec.js` - Public website functionality
- `api-integration-optimized.spec.js` - Backend API testing
- `admin-panel-optimized.spec.js` - Admin panel features
- All other `.spec.js` files for specific features

### Troubleshooting

**Tests hanging or timing out:**
- Ensure both servers are running and accessible
- Check network connectivity to localhost
- Use `--headed` mode to debug visually

**Server connection issues:**
- Verify backend server on `http://localhost:8080/api/health`
- Verify frontend server on `http://127.0.0.1:3000`
- Check for port conflicts with `netstat -ano | findstr :8080`

**Test failures:**
- Check HTML report for detailed failure information
- Review screenshots in `test-results/` directory
- Examine console logs for JavaScript errors

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [EJS](https://ejs.co/)
- [Font Awesome](https://fontawesome.com/)