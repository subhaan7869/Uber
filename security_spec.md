# Security Specification - Uber Eats Driver App

## Data Invariants
1. A **User Profile** must have a `uid` matching the document ID.
2. An **Active Order** or **Scheduled Order** must belong to an authenticated driver (`driverUid`).
3. Drivers can only see their own active and scheduled orders.
4. User profiles are public for face verification purposes (lookup by UID), but private details should be protected.
5. `carplay_sync` is strictly limited to the owner.

## The Dirty Dozen (Malicious Payloads)
1. **Identity Spoofing**: Attempt to create a user profile with a `uid` field that doesn't match `request.auth.uid`.
2. **Privilege Escalation**: Attempt to update a user profile to set `role: 'admin'`.
3. **Ghost Field Injection**: Adding an `isVerified: true` field to a profile during creation.
4. **Order Hijacking**: Attempt to read or list `scheduled_orders` belonging to another driver.
5. **Unauthorized Scheduling**: Creating a `scheduled_order` with a `driverUid` of another user.
6. **Immutable Field Tampering**: Changing `createdAt` or `originalDriverUid` on an existing order.
7. **Resource Poisoning**: Injecting 1MB of junk text into the `name` field of a profile.
8. **Sync Interference**: Attempting to write to another user's `carplay_sync` document.
9. **State Shortcutting**: Updating a scheduled order directly to `completed` without going through `active`. (Actually, in this app, we'll just check status allowed values).
10. **PII Scraping**: Attempting to list the `users` collection to gather all driver names.
11. **Denial of Wallet**: Sending massive arrays of `documentExpiries`.
12. **Timestamp Fraud**: Providing a future `lastUpdated` time manually from the client.

## Test Cases (Expected Denied)
- `list /users` (PII Privacy)
- `create /users/victim_id` by `attacker_id`
- `update /users/my_id` with `{ role: 'admin' }`
- `list /scheduled_orders` without `driverUid` filter
- `get /scheduled_orders/other_drivers_order`
- `create /active_orders` with `{ driverUid: 'not_me' }`
- `update /active_orders/my_order` with `{ status: 'completed' }` by someone else.
