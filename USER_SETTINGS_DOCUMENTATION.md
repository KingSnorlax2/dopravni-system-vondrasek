# User Settings System Documentation

## Overview

The User Settings System provides a comprehensive interface for users to manage their preferences, view their permissions, and configure their experience within the application. This system is designed to be user-friendly, dynamic, and secure.

## Features

### 1. User Preferences Management
- **Default Landing Page Selection**: Users can choose which page loads after login
- **Display Preferences**: Customize interface appearance and behavior
- **Notification Settings**: Configure how and when to receive notifications
- **Theme and Language**: Personalize the application interface

### 2. Permission Visualization
- **Comprehensive Permission Display**: View all available permissions organized by category
- **Role-Based Access**: See permissions granted through assigned roles
- **Permission Categories**: Organized into logical groups for easy understanding

### 3. Dynamic Interface
- **Real-time Updates**: Changes are saved immediately without page refresh
- **Responsive Design**: Works seamlessly across all device sizes
- **Intuitive Controls**: Easy-to-use switches, dropdowns, and form elements

## Technical Architecture

### Database Schema

#### UserPreferences Model
```prisma
model UserPreferences {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Navigation preferences
  defaultLandingPage String  @default("/homepage")
  
  // Display preferences
  theme             String   @default("system")
  language          String   @default("cs")
  
  // Notification preferences
  emailNotifications Boolean @default(true)
  pushNotifications Boolean @default(true)
  smsNotifications  Boolean @default(false)
  
  // Display settings
  compactMode       Boolean @default(false)
  showAvatars       Boolean @default(true)
  autoRefresh       Boolean @default(true)
  
  // Custom preferences
  customSettings    Json?
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId])
}
```

### API Endpoints

#### GET /api/user/permissions
Retrieves user permissions based on assigned roles.

**Response:**
```json
{
  "userId": "user_id",
  "permissions": ["view_dashboard", "edit_users", ...],
  "roleCount": 2
}
```

#### GET /api/user/preferences
Retrieves user preferences and settings.

**Response:**
```json
{
  "defaultLandingPage": "/homepage",
  "theme": "system",
  "language": "cs",
  "notifications": {
    "email": true,
    "push": true,
    "sms": false
  },
  "display": {
    "compactMode": false,
    "showAvatars": true,
    "autoRefresh": true
  }
}
```

#### PUT /api/user/preferences
Updates user preferences and settings.

**Request Body:**
```json
{
  "defaultLandingPage": "/dashboard",
  "theme": "dark",
  "language": "en",
  "notifications": {
    "email": true,
    "push": false,
    "sms": true
  },
  "display": {
    "compactMode": true,
    "showAvatars": false,
    "autoRefresh": false
  }
}
```

## Permission Categories

### 1. Dashboard Permissions
- `view_dashboard`: Access main dashboard
- `customize_dashboard`: Modify dashboard layout
- `export_dashboard`: Download dashboard data

### 2. User Management
- `view_users`: See user list
- `create_users`: Add new users
- `edit_users`: Modify user information
- `delete_users`: Remove users
- `assign_roles`: Change user roles
- `manage_roles`: Create/edit roles

### 3. Vehicle Management
- `view_vehicles`: Access vehicle information
- `create_vehicles`: Register new vehicles
- `edit_vehicles`: Update vehicle details
- `delete_vehicles`: Remove vehicles
- `track_vehicles`: GPS tracking access
- `assign_vehicles`: Assign vehicles to drivers

### 4. Financial Management
- `view_transactions`: See financial records
- `create_transactions`: Add new transactions
- `edit_transactions`: Modify transactions
- `delete_transactions`: Remove transactions
- `approve_expenses`: Approve expense requests
- `view_financial_reports`: Access financial analytics

### 5. Maintenance Management
- `view_maintenance`: See maintenance schedules
- `schedule_maintenance`: Create maintenance appointments
- `approve_maintenance`: Approve repair requests
- `edit_maintenance`: Modify maintenance records
- `delete_maintenance`: Remove maintenance records
- `track_service_history`: View service history

### 6. Distribution Management
- `view_distribution`: See distribution schedules
- `manage_distribution`: Create/modify distribution plans
- `assign_routes`: Assign delivery routes
- `edit_routes`: Modify existing routes

### 7. System Administration
- `system_settings`: Access system configuration
- `view_audit_logs`: Access audit logs
- `manage_departments`: Department management
- `backup_restore`: System backup operations

### 8. Reports & Analytics
- `view_reports`: Access system reports
- `generate_reports`: Create custom reports
- `export_reports`: Download reports
- `view_analytics`: Advanced analytics access

### 9. Driver Operations
- `driver_access`: Driver-specific features
- `view_personal_history`: Personal delivery history
- `report_issues`: Report vehicle/delivery issues
- `update_vehicle_status`: Update vehicle condition

## Available Landing Pages

Users can select from the following default landing pages:

1. **`/homepage`** - Main dashboard overview (default)
2. **`/dashboard`** - Classic dashboard view
3. **`/dashboard/auta`** - Vehicle management
4. **`/dashboard/grafy`** - Analytics and charts
5. **`/dashboard/transakce`** - Financial transactions
6. **`/dashboard/noviny`** - Newspaper distribution
7. **`/dashboard/users`** - User management
8. **`/dashboard/settings`** - System settings

## User Interface Components

### UserSettings Component
The main component that provides the complete user settings interface.

**Features:**
- Tabbed interface (Preferences, Permissions, Profile)
- Dynamic form controls
- Real-time validation
- Responsive design
- Unified styling with the rest of the application

**Props:**
```typescript
interface UserSettingsProps {
  onSettingsChange?: () => void
}
```

### Integration
The UserSettings component is integrated into the account page at `/dashboard/account` and provides:

1. **Preferences Tab**: Manage personal settings and preferences
2. **Permissions Tab**: View and understand available permissions
3. **Profile Tab**: Display user account information

## Security Features

### Authentication
- All API endpoints require valid user session
- User can only access their own preferences
- Permission data is read-only for regular users

### Validation
- Input validation for all preference fields
- Whitelist validation for landing page selection
- Type safety through TypeScript interfaces

### Audit Logging
- All preference changes are logged
- Timestamp and user information recorded
- IP address and user agent tracking

## Usage Examples

### Setting Default Landing Page
```typescript
// User selects a new default page
const handleDefaultPageChange = (value: string) => {
  setUserPreferences(prev => ({
    ...prev,
    defaultLandingPage: value
  }))
}

// Save to database
const response = await fetch('/api/user/preferences', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userPreferences)
})
```

### Loading User Permissions
```typescript
const loadUserPermissions = async () => {
  const response = await fetch('/api/user/permissions')
  if (response.ok) {
    const data = await response.json()
    setUserPermissions(data.permissions || [])
  }
}
```

### Updating Display Preferences
```typescript
const handlePreferenceChange = (category: string, key: string, value: any) => {
  setUserPreferences(prev => ({
    ...prev,
    [category]: {
      ...prev[category as keyof typeof prev],
      [key]: value
    }
  }))
}
```

## Future Enhancements

### Planned Features
1. **Advanced Theme System**: Custom color schemes and layouts
2. **Notification Templates**: Personalized notification content
3. **Dashboard Widgets**: Customizable dashboard components
4. **Language Localization**: Multi-language support
5. **Accessibility Options**: Enhanced accessibility features

### Database Improvements
1. **Preference History**: Track changes over time
2. **Bulk Operations**: Batch preference updates
3. **Export/Import**: Backup and restore preferences
4. **Default Templates**: Role-based default preferences

## Troubleshooting

### Common Issues

#### Permission Loading Errors
- Check user session validity
- Verify role assignments in database
- Ensure Prisma client is up to date

#### Preference Save Failures
- Validate input data format
- Check database connection
- Verify user authentication

#### UI Rendering Issues
- Clear browser cache
- Check component imports
- Verify CSS class availability

### Debug Information
The system provides comprehensive logging for debugging:
- API request/response logging
- User preference change tracking
- Error details with stack traces
- Performance metrics

## Best Practices

### For Developers
1. **Type Safety**: Always use TypeScript interfaces
2. **Error Handling**: Implement comprehensive error handling
3. **Validation**: Validate all user inputs
4. **Performance**: Optimize database queries
5. **Security**: Follow principle of least privilege

### For Users
1. **Regular Updates**: Keep preferences current
2. **Security**: Use strong authentication
3. **Backup**: Export important settings
4. **Documentation**: Read feature descriptions
5. **Support**: Contact administrators for issues

## Conclusion

The User Settings System provides a robust, user-friendly interface for managing personal preferences and understanding system permissions. It follows modern web development best practices and provides a solid foundation for future enhancements.

The system is designed to be:
- **Intuitive**: Easy to use for all user types
- **Secure**: Protected against unauthorized access
- **Scalable**: Ready for future feature additions
- **Maintainable**: Well-documented and structured code
- **Accessible**: Following accessibility guidelines

For technical support or feature requests, please contact the development team.
