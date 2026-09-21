---
name: permission-role
description: Design and implement role-based permissions where only the Super Admin can grant or revoke permissions, and the interface shows actions only when the signed-in user has access.
---

# Permission Role

Use this skill when designing or implementing permission-based access for users, branches, roles, or application features.

## Core rule

Only the **Super Admin** may create, change, or revoke permissions. Other roles, including branch administrators, may use the capabilities assigned to them but must not manage permissions themselves.

Permissions are deny-by-default: a user can perform an action only when an active permission explicitly grants it. Do not treat a hidden interface control as the security boundary; enforce the same permission on the server or API for every protected action.

## Permission model

- Identify the subject receiving access, such as a user, role, or branch.
- Identify the resource and action, such as `product:create`, `product:read`, `product:update`, or `product:delete`.
- Allow only the Super Admin to assign or remove those permissions.
- Check the effective permission for the signed-in user before returning protected data or performing a mutation.
- Keep permission changes auditable when the product has an audit log: record the Super Admin, subject, permission, timestamp, and change made.

## Interface behavior

The interface must reflect the effective permissions of the signed-in user:

- If the user has a permission, show the related control and allow the action.
- If the user does not have a permission, hide or disable the related control according to the product's UX convention, and ensure the API still rejects unauthorized requests.
- Show permission-management controls only to the Super Admin.
- If permissions are changed while a user is signed in, refresh or invalidate the permission state so the interface does not show stale access.

## Example: Branch B can create products

1. The Super Admin opens role or branch permissions.
2. The Super Admin grants Branch B the `product:create` permission and saves the change.
3. A user operating in Branch B receives that effective permission after the permission state refreshes.
4. On the product screen, the **Create product** button appears for that user.
5. Selecting the button opens the create-product flow, and the server authorizes the create request.
6. If the Super Admin later revokes `product:create`, the button disappears (or becomes disabled) after refresh, and direct API attempts are rejected as unauthorized.

When implementing this example, do not grant all product permissions automatically: `product:create` should be independent from viewing, editing, or deleting products unless the Super Admin explicitly assigns those permissions too.

## Acceptance checks

- A non-Super-Admin cannot assign, edit, or revoke permissions.
- An authorized Branch B user sees **Create product** and can successfully create a product.
- A user without `product:create` does not see the control and cannot create a product through a direct request.
- Revocation affects both the interface and the server authorization check.
