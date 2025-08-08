# Test Commander

A modern, extensible platform for managing test cases, issues/defects, test scheduling, and quality reporting. Built with React, Firebase, and Tailwind CSS.

## Features

### 🎯 Core Functionality
- **Test Case Management**: Hierarchical organization with unlimited category layers
- **Defect Tracking**: Comprehensive issue management with workflow states
- **Test Scheduling**: Multi-phase test execution with cycle management
- **Reporting & Analytics**: Interactive dashboards with exportable reports
- **User Management**: Role-based access control and authentication

### 🎨 Design Highlights
- **Modern UI**: Clean, professional interface with subtle animations
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: WCAG 2.1 AA compliant components
- **Dark Mode Ready**: Built with future dark mode support in mind

### 🔧 Technical Stack
- **Frontend**: React 18 with Hooks and Functional Components
- **Backend**: Firebase Authentication and Firestore
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography
- **Forms**: React Hook Form with Yup validation
- **Routing**: React Router for SPA navigation

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Firebase project with Authentication and Firestore enabled

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd test-commander
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Google Authentication
   - Enable Firestore Database
   - Create a `.env` file with your Firebase configuration (see SETUP_GUIDE.md)

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Set up App Admin Account**
   - Open the application in your browser
   - Sign in with Google using testinternals@gmail.com
   - Run `window.setupTestCommanderAppAdmin()` in browser console
   - You'll be redirected to the Super Admin Dashboard

### Detailed Setup
For complete setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Authentication

### Google OAuth Integration
- **Sign-in Method**: Google OAuth via Firebase Authentication
- **UI Framework**: FirebaseUI for seamless authentication experience
- **Token Management**: Automatic ID token handling with cookie storage
- **Role-based Access**: App Admin, Org Admin, Analyst, Test Engineer, Defect Coordinator

### Super User Access
- **Email**: testinternals@gmail.com
- **Role**: APP_ADMIN (Full system access)
- **Setup**: Run `window.setupTestCommanderAppAdmin()` after first login

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navigation.js   # Main navigation component
│   ├── ProtectedRoute.js # Route protection
│   └── SuperUserDashboard.js # Admin dashboard
├── contexts/           # React contexts
│   └── AuthContext.js  # Authentication context
├── pages/              # Page components
│   ├── Dashboard.js    # Main dashboard
│   ├── TestCases.js    # Test case management
│   ├── Defects.js      # Defect tracking
│   ├── TestSchedules.js # Test scheduling
│   ├── Reports.js      # Analytics & reporting
│   ├── Organizations.js # Organization management
│   ├── Projects.js     # Project management
│   ├── UserManagement.js # User administration
│   └── Login.js        # Authentication page
├── services/           # API and service functions
│   ├── firebase.js     # Firebase configuration
│   └── authService.js  # Authentication services
├── utils/              # Utility functions
│   └── setupAppAdmin.js # App admin setup utility
├── App.js              # Main application component
├── index.js            # Application entry point
└── index.css           # Global styles and Tailwind imports
```

## Key Features Explained

### Test Case Hierarchy
- **Unlimited Layers**: Organization → Project → Function → Subsystem → Test Case
- **Drag & Drop**: Intuitive model building (planned)
- **CRUD Operations**: Full create, read, update, delete functionality
- **Versioning**: Track changes and maintain history

### Defect Management
- **Workflow States**: Open → Investigation → Resolved → Closed
- **Severity Levels**: Critical, High, Medium, Low
- **Assignment**: Route issues to appropriate team members
- **Attachments**: Support for files and external links

### Test Scheduling
- **Multi-Phase**: System, Integration, UAT, Regression testing
- **Cycle Management**: Multiple execution cycles per phase
- **Progress Tracking**: Real-time execution status
- **Metrics**: Hours to construct and execute

### Reporting & Analytics
- **Interactive Dashboards**: Real-time data visualization
- **Multiple Chart Types**: Bar, line, pie, and area charts
- **Export Options**: PDF and CSV export capabilities
- **Custom Queries**: Advanced filtering and search

## Design System

### Color Palette
- **Primary Blue**: `#3762c4` - Main brand color
- **Slate Grey**: `#606a78` - Neutral text and backgrounds
- **Teal Accent**: `#36b1ae` - Success states and highlights
- **Amber Accent**: `#f7c873` - Warnings and attention

### Typography
- **Font Family**: Inter, Segoe UI, Roboto, system-ui
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Hierarchy**: Clear size progression for headings and body text

### Components
- **Cards**: Soft shadows with rounded corners
- **Buttons**: Rounded with hover states and focus rings
- **Forms**: Clean inputs with subtle borders
- **Navigation**: Horizontal desktop, collapsible mobile

## Security

### Authentication
- **Google OAuth**: Secure authentication via Firebase
- **Token-based**: ID tokens for server-side verification
- **Role-based Access**: Granular permissions per user role
- **Session Management**: Automatic token refresh

### Data Protection
- **Firestore Rules**: Server-side security rules
- **Organization Isolation**: Data separation between tenants
- **Audit Logging**: Track user actions and changes
- **Backup Strategy**: Regular data backups

## Development

### Available Scripts
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm eject` - Eject from Create React App

### Code Style
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **TypeScript**: Type safety (planned migration)

### Testing
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Cypress**: End-to-end testing (planned)

## Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Environment Configuration
- Set production Firebase project
- Update environment variables
- Configure custom domain
- Deploy Firestore security rules

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation
- Review the setup guide

---

**Test Commander** - Empowering quality assurance teams with modern, intuitive test management tools. 