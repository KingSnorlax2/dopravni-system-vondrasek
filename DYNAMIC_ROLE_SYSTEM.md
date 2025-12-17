# 🎯 Dynamic Role-Based Access Control (RBAC) System

## 📋 Overview

This document describes the comprehensive dynamic role-based access control system implemented for the transportation management platform. The system provides user-friendly role management with context-aware permissions, dynamic rules, and scalable architecture.

## 🏗️ System Architecture

### **Core Components**

1. **Enhanced Database Schema** (`prisma/schema.prisma`)
   - Extended Role model with dynamic capabilities
   - Comprehensive permission system
   - Department-based access control
   - Audit logging for all role changes

2. **Role Management Interface** (`src/components/admin/RoleManagement.tsx`)
   - User-friendly role creation and editing
   - Visual permission matrix
   - Dynamic rule configuration
   - Role templates for quick setup

3. **Dynamic Permission Engine** (`src/lib/dynamicPermissions.ts`)
   - Context-aware permission checking
   - Time-based restrictions
   - Budget-based approval workflows
   - Trust score integration

4. **API Endpoints** (`src/app/api/admin/roles/`)
   - Complete CRUD operations for roles
   - Permission management
   - Audit trail logging

## 🎨 Role Hierarchy

### **System Roles**

```
🛡️ System Administrator (ADMIN)
├── 🚗 Fleet Manager (FLEET_MANAGER)
├── 👨‍💼 Driver (DRIVER)
├── 💰 Accountant (ACCOUNTANT)
├── 📊 Dispatcher (DISPATCHER)
├── 🔧 Maintenance Technician (MAINTENANCE_TECH)
├── 👁️ Viewer (VIEWER)
└── 🚪 Guest (GUEST)
```

### **Role Templates**

#### **🛡️ System Administrator**
- **Description**: Full system access with all permissions
- **Permissions**: All permissions across all categories
- **Dynamic Rules**: None (unrestricted access)
- **Use Case**: Platform owners and senior IT staff

#### **🚗 Fleet Manager**
- **Description**: Manages vehicle fleet operations, maintenance scheduling, and driver assignments
- **Permissions**: 
  - Dashboard: View, customize, export
  - Vehicles: View, edit, track, assign
  - Transactions: View, create, edit, approve (up to 1000 Kč)
  - Maintenance: View, schedule, approve, edit
  - Reports: View, generate
- **Dynamic Rules**:
  - Department restriction: ✅ (can only manage assigned department)
  - Time restriction: ✅ (business hours only)
  - Budget limit: 1000 Kč
- **Use Case**: Department managers responsible for vehicle operations

#### **👨‍💼 Driver**
- **Description**: Operates assigned vehicles and reports maintenance issues
- **Permissions**:
  - Dashboard: View
  - Vehicles: View assigned vehicles only
  - Personal: Update vehicle status, report issues, view history
- **Dynamic Rules**:
  - Department restriction: ✅ (assigned vehicles only)
  - Time restriction: ❌ (24/7 access)
  - Budget limit: 0 Kč (no approval authority)
- **Use Case**: Vehicle operators and delivery drivers

#### **💰 Accountant**
- **Description**: Manages financial records, transactions, and reporting
- **Permissions**:
  - Dashboard: View
  - Transactions: View, create, edit
  - Reports: View financial reports, generate, export
- **Dynamic Rules**:
  - Department restriction: ❌ (access to all departments)
  - Time restriction: ✅ (business hours only)
  - Budget limit: 5000 Kč
- **Use Case**: Financial staff and accounting personnel

## 🔐 Permission Categories

### **Dashboard Access**
```typescript
view_dashboard: "Access the main dashboard with overview information"
customize_dashboard: "Add, remove, or rearrange dashboard widgets"
export_dashboard: "Download dashboard data as reports"
```

### **User Management**
```typescript
view_users: "See list of users in the system"
create_users: "Add new users to the system"
edit_users: "Modify user information and settings"
delete_users: "Remove users from the system"
assign_roles: "Change user role assignments"
manage_roles: "Create, edit, and delete roles"
```

### **Vehicle Management**
```typescript
view_vehicles: "See vehicle information and status"
create_vehicles: "Register new vehicles in the system"
edit_vehicles: "Update vehicle details and status"
delete_vehicles: "Remove vehicles from the system"
track_vehicles: "Access real-time GPS tracking data"
assign_vehicles: "Assign vehicles to drivers"
```

### **Financial Management**
```typescript
view_transactions: "See financial transaction history"
create_transactions: "Add new financial records"
edit_transactions: "Modify existing financial records"
delete_transactions: "Remove financial records"
approve_expenses: "Approve or reject expense requests"
view_financial_reports: "Access financial reports and analytics"
```

### **Maintenance Management**
```typescript
view_maintenance: "See maintenance schedules and history"
schedule_maintenance: "Create maintenance appointments"
approve_maintenance: "Approve repair requests and costs"
edit_maintenance: "Modify maintenance records"
delete_maintenance: "Remove maintenance records"
track_service_history: "View vehicle service records"
```

## ⚡ Dynamic Rules Engine

### **Rule Types**

#### **1. Department Restriction**
```typescript
// Users can only manage resources in their assigned department
if (dynamicRules.departmentRestriction && context.department) {
  const departmentAssignment = role.departmentAssignments?.find(
    da => da.department === context.department
  )
  
  if (!departmentAssignment?.canManage) {
    return { allowed: false, reason: 'Access restricted to assigned department' }
  }
}
```

#### **2. Time Restriction**
```typescript
// Access limited to business hours (8:00 - 18:00)
if (dynamicRules.timeRestriction) {
  const currentHour = new Date().getHours()
  if (currentHour < 8 || currentHour >= 18) {
    return { allowed: false, reason: 'Access restricted to business hours' }
  }
}
```

#### **3. Budget Limit**
```typescript
// Approval required for amounts exceeding limit
if (dynamicRules.budgetLimit && context.amount) {
  if (context.amount > dynamicRules.budgetLimit) {
    return {
      allowed: true,
      requiresApproval: true,
      approvalLevel: context.amount > 5000 ? 'admin' : 'manager',
      reason: `Amount exceeds approval limit of ${dynamicRules.budgetLimit} Kč`
    }
  }
}
```

#### **4. Trust Score**
```typescript
// Access based on user reliability score
if (dynamicRules.minTrustScore && user.trustScore < dynamicRules.minTrustScore) {
  return {
    allowed: false,
    reason: `Trust score too low (${user.trustScore}/${dynamicRules.minTrustScore})`
  }
}
```

### **Context-Aware Permissions**

#### **Vehicle Access**
```typescript
export async function canEditVehicle(userId: string, vehicleId: number) {
  const vehicle = await prisma.auto.findUnique({
    where: { id: vehicleId },
    select: { department: true, assignedDriver: true }
  })

  return checkDynamicPermission('edit_vehicles', {
    userId,
    vehicleId,
    department: vehicle.department
  })
}
```

#### **Transaction Approval**
```typescript
export async function canApproveTransaction(userId: string, transactionId: number) {
  const transaction = await prisma.transakce.findUnique({
    where: { id: transactionId },
    select: { castka: true, status: true }
  })

  return checkDynamicPermission('approve_expenses', {
    userId,
    transactionId,
    amount: transaction.castka
  })
}
```

## 🎨 User Interface

### **Role Management Dashboard**

#### **Role List View**
- Visual role cards with icons and colors
- Permission count and priority indicators
- Quick edit and delete actions
- System role protection

#### **Role Creation Wizard**
```
Step 1: Basic Information
├── Role Name (e.g., "FLEET_MANAGER")
├── Display Name (e.g., "Fleet Manager")
├── Description
├── Icon (emoji)
├── Color theme
└── Priority level

Step 2: Permission Selection
├── Dashboard Access
├── User Management
├── Vehicle Management
├── Financial Management
└── Maintenance Management

Step 3: Dynamic Rules
├── Department Restriction
├── Time Restriction
├── Budget Limits
└── Trust Score Requirements

Step 4: Templates
├── System Administrator
├── Fleet Manager
├── Driver
└── Accountant
```

#### **Permission Matrix**
```
┌─────────────────┬─────────┬─────────┬─────────┬─────────┐
│ Permission      │ Viewer  │ Driver  │ Manager │ Admin   │
├─────────────────┼─────────┼─────────┼─────────┼─────────┤
│ View Dashboard  │    ✓    │    ✓    │    ✓    │    ✓    │
│ Edit Vehicles   │    ✗    │    ✓    │    ✓    │    ✓    │
│ Manage Users    │    ✗    │    ✗    │    ✓    │    ✓    │
│ System Settings │    ✗    │    ✗    │    ✗    │    ✓    │
└─────────────────┴─────────┴─────────┴─────────┴─────────┘
```

## 🔧 Implementation Examples

### **Creating a New Role**
```typescript
const newRole = {
  name: 'DISPATCHER',
  displayName: 'Dispatcher',
  description: 'Manages route assignments and driver coordination',
  icon: '🗺️',
  color: '#059669',
  permissions: [
    'view_dashboard',
    'view_vehicles',
    'assign_vehicles',
    'view_distribution',
    'assign_routes',
    'edit_routes'
  ],
  dynamicRules: {
    departmentRestriction: true,
    timeRestriction: true,
    budgetLimit: 500
  }
}
```

### **Checking Dynamic Permissions**
```typescript
// Check if user can edit a specific vehicle
const canEdit = await canEditVehicle(userId, vehicleId)
if (canEdit.allowed) {
  // Allow editing
} else {
  // Show error: canEdit.reason
}

// Check if user can approve a transaction
const canApprove = await canApproveTransaction(userId, transactionId)
if (canApprove.requiresApproval) {
  // Show approval workflow
  // Approval level: canApprove.approvalLevel
}
```

### **Getting User's Effective Permissions**
```typescript
const permissions = await getUserEffectivePermissions(userId, {
  department: 'Fleet A',
  time: new Date()
})

// permissions will contain all user permissions with dynamic rules applied
Object.entries(permissions).forEach(([permission, result]) => {
  if (result.allowed) {
    console.log(`${permission}: Allowed`)
  } else {
    console.log(`${permission}: Denied - ${result.reason}`)
  }
})
```

## 📊 Audit and Compliance

### **Audit Logging**
All role and permission changes are automatically logged:

```typescript
await prisma.roleAuditLog.create({
  data: {
    action: 'UPDATE',
    entityType: 'ROLE',
    entityId: roleId.toString(),
    oldValue: previousRole,
    newValue: updatedRole,
    userId: session.user.id,
    ipAddress: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent')
  }
})
```

### **Audit Trail Features**
- **Complete History**: All role changes tracked
- **User Attribution**: Who made the change
- **IP Tracking**: Security audit trail
- **Before/After Values**: Full change history
- **Timestamp**: Precise change timing

## 🚀 Benefits Achieved

### **1. User Experience**
- ✅ **Intuitive Interface**: Visual role management with clear descriptions
- ✅ **Template System**: Quick role creation from predefined templates
- ✅ **Progressive Disclosure**: Advanced options hidden by default
- ✅ **Real-time Feedback**: Immediate permission validation

### **2. Security & Compliance**
- ✅ **Granular Control**: Fine-grained permission management
- ✅ **Context Awareness**: Permissions adapt to situation
- ✅ **Audit Trail**: Complete change history
- ✅ **System Protection**: Critical roles cannot be modified

### **3. Scalability**
- ✅ **Flexible Architecture**: Easy to add new permissions and rules
- ✅ **Department Support**: Multi-tenant access control
- ✅ **Dynamic Rules**: Context-aware permissions
- ✅ **Template System**: Rapid role deployment

### **4. Business Logic**
- ✅ **Approval Workflows**: Automatic approval routing
- ✅ **Time Restrictions**: Business hours enforcement
- ✅ **Budget Controls**: Spending limit enforcement
- ✅ **Trust Scoring**: Reliability-based access

## 🔄 Migration Guide

### **From Static to Dynamic Roles**

1. **Database Migration**
   ```bash
   npx prisma migrate dev --name enhance_role_system
   ```

2. **Update Existing Roles**
   ```typescript
   // Update ADMIN role with new structure
   await prisma.role.update({
     where: { name: 'ADMIN' },
     data: {
       displayName: 'System Administrator',
       description: 'Full system access with all permissions',
       icon: '🛡️',
       color: '#dc2626',
       isSystem: true,
       priority: 100
     }
   })
   ```

3. **Migrate Permissions**
   ```typescript
   // Convert old permission strings to new enum values
   const permissionMapping = {
     'manage_users': 'manage_roles',
     'manage_vehicles': 'edit_vehicles',
     // ... other mappings
   }
   ```

## 📈 Future Enhancements

### **Planned Features**
1. **Advanced Dynamic Rules**
   - Location-based permissions
   - Workload-based access control
   - Risk-based permission scaling

2. **Enhanced UI**
   - Drag-and-drop permission assignment
   - Visual permission flow diagrams
   - Role comparison tools

3. **Integration Features**
   - LDAP/Active Directory integration
   - Single Sign-On (SSO) support
   - API key management

4. **Analytics & Reporting**
   - Permission usage analytics
   - Access pattern analysis
   - Security risk assessment

---

*This dynamic role system provides a comprehensive, user-friendly, and scalable solution for managing access control in the transportation management platform.*
