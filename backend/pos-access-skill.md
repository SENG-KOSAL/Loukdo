# pos-access-skill.md

## Core Rule

* Backend = Security
* Frontend = UX only
* Never trust frontend roles, URLs, request payloads, or hidden menus.

---

## Roles

| Role         | Scope                 |
| ------------ | --------------------- |
| SUPER_ADMIN  | All branches          |
| BRANCH_ADMIN | Own branch only       |
| MANAGER      | Own branch only       |
| CASHIER      | Own transactions only |

---

## JWT Claims

```json
{
  "userId": 1,
  "role": "BRANCH_ADMIN",
  "branchId": 5
}
```

Required:

* userId
* role
* branchId

---

## Request Flow

```text
Request
  ↓
Auth Middleware
  ↓
Role Check
  ↓
Branch Validation
  ↓
Controller
  ↓
Service
```

---

## Authorization Rules

### SUPER_ADMIN

Can:

* Access all dashboards
* Manage all branches
* Manage all users
* View all reports

### BRANCH_ADMIN

Can:

* Access own branch dashboard
* Manage own branch users
* View own branch reports

Cannot:

* Access Super Admin dashboard
* Access other branches

### MANAGER

Can:

* View own branch reports
* Manage inventory

Cannot:

* Manage users
* Access Super Admin dashboard

### CASHIER

Can:

* Create sales
* View own transactions

Cannot:

* Access admin features

---

## Branch Isolation

Always use:

```ts
const branchId = req.user.branchId;
```

Never use:

```ts
const branchId = req.body.branchId;
```

---

## Security Rules

* Every API must validate JWT.
* Every API must validate role.
* Every API must validate branch ownership.
* Return HTTP 403 for unauthorized access.
* Hide menus/pages on frontend.
* Enforce permissions on backend.

---

## Golden Rule

A BRANCH_ADMIN must never:

* Open Super Admin dashboard
* Call Super Admin APIs
* Access another branch's data
* Modify another branch's data

Backend must reject unauthorized requests even if the user knows the URL.
