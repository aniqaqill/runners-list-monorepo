# Runners List Platform

A Malaysian running community platform. Aggregates public races from external sources, hosts running clubs and their sessions, and serves as a discovery layer for runners.

## Language

### Core Entities

**Race**:
A publicly listed competitive running event scraped from an external source (e.g. a Blogger page). The platform aggregates Races — it does not organise them.
_Avoid_: Event (too generic), Running Event

**Club Session**:
An activity organised by a Running Club for its members — e.g. a group training run, time trial, or social run. Created by a Club Admin, not scraped.
_Avoid_: Event, Club Event, Activity

**Running Club**:
An organisation that groups runners together. Has a Club Admin, publishes Club Sessions, and may have members with accounts.
_Avoid_: Club (alone — ambiguous)

**User**:
A person with an account on the platform. Can save Races, join Running Clubs, and view Club Sessions.
_Avoid_: Member (ambiguous — a User is a Member of a Running Club)

**Member**:
A User who belongs to a specific Running Club.
_Avoid_: User (when the Running Club context matters — use Member instead)

**Club Admin**:
A User who manages a Running Club — can create Club Sessions and publish them to social channels.
_Avoid_: Admin (alone — ambiguous with Super Admin)

**Super Admin**:
The platform operator. Has global access across all Running Clubs and Users.
_Avoid_: Admin (alone)

**Scraper**:
The automated process that fetches Races from external sources and syncs them to the platform via the internal sync endpoint.
_Avoid_: Crawler, Bot

## Relationships

- A **Race** is sourced by the **Scraper** — it has no owner on the platform
- A **Running Club** has one or more **Club Admins** and zero or more **Members**
- A **Club Session** belongs to exactly one **Running Club**
- A **User** becomes a **Member** by joining a **Running Club**
- A **Super Admin** can manage all **Running Clubs**, **Users**, and **Races**

## Example dialogue

> **Dev:** "When a Club Admin posts an event, does it appear in the main race listing?"
> **Domain expert:** "No — a Club Session lives under its Running Club. Races are scraped aggregations. They're separate feeds."

> **Dev:** "Can a User register for a Race through the platform?"
> **Domain expert:** "Not yet — we link to the external registration URL. The User follows the link. We don't own the registration flow."

## Flagged ambiguities

- "Event" was used in the original codebase to mean Race — resolved: the domain type should be renamed `Race`. The DB table and existing column `registeration_url` (sic) will be migrated separately.
- "Admin" was used loosely — resolved: distinguish **Club Admin** (per-club) from **Super Admin** (platform-wide).
