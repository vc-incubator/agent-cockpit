# agent-cockpit

**The noticeboard for your AI agent team.** A web page at your own address that reads your team
repo and tells you what your agents did, what they are about to do, and — the part most dashboards
skip — **which of your jobs actually run at all.**

You deploy it. You own it. Nothing here runs on anybody else's infrastructure, and it never writes
to your repo.

---

## Who this is for

Anyone using [agent-team-template](https://github.com/vc-incubator/agent-team-template) who
would rather glance at a page than read files.

**Nothing depends on this working.** Your agents run whether or not the board is up. It is the
window, not the engine.

---

## The seven screens

| Screen | The question it answers |
|---|---|
| **Today** | What happened, what is next, what has gone quiet — plus one-tap Run buttons |
| **Ledger** | What your week costs, what was proposed for it, and what nothing on the team can do |
| **Team** | Every agent: model, last run, and whether it is working, quiet or never run |
| **Workflows** | Every job, and whether it is **armed, declared, unapproved or off** |
| **Skills** | What this team can actually do, and which jobs use each skill |
| **Memory** | Your vault, browsable and searchable **by page name** |
| **Connections** | Every runtime in `runtimes.yml` — alive or silent, from its own heartbeat |

---

## The two things this board refuses to do

These are the reason anything else on it is worth believing.

**It never invents a next-run time.** A workflow file saying `schedule: "daily 06:30"` makes
nothing happen at 06:30 — a *routine* is the alarm clock. Only an **armed** job gets a next-run
time. A job with no routine says *"Nothing fires this. The schedule above is a wish"* instead.

**It never shows a number it cannot source.** If the hero metric cannot be computed from your
ledger, the board says so in a sentence. It does not show a zero, because a zero there is a claim
about your week in the largest type on the screen.

The same rule covers the schedule itself: **no web page can call the routines API**, so the board
reads a snapshot your repo commits and always prints when it was taken. No snapshot means *"which
of these actually ring is unknown"* — never *"nothing is scheduled"*, which is a different claim it
has no evidence for.

---

## Before you start

| You need | Why |
|---|---|
| **A team repo on GitHub** | This board reads it. Without one there is nothing to show |
| **A Vercel account** (free tier is fine) | Where the page runs |
| **Node.js 20 or newer** | Only if you want to run the tests locally |

---

## Install

**1. Fork this repo.** Your own copy, your own URL.

**2. Deploy it to Vercel.** Import the fork; the defaults are correct.

**3. Point it at your team repo.** In Vercel's *Settings → Environment Variables*:

| Variable | Value | Required |
|---|---|---|
| `GITHUB_OWNER` | Your GitHub username or org — e.g. `janedoe` | **Yes** |
| `GITHUB_REPO` | Your team repo's name — e.g. `my-agent-team` | **Yes** |
| `GITHUB_BRANCH` | Usually `main`. Leave unset and it defaults to `main` | No |
| `GITHUB_TOKEN` | A read-only token. **Required if your team repo is private** | If private |
| `VIEW_KEY` | A password for the board. Send it as the `x-view-key` header | **Yes**, unless… |
| `PUBLIC_DASHBOARD` | `true` to skip the key entirely — only if the repo is genuinely public | No |
| `FIRE_TRIGGERS` | JSON mapping job slug → its trigger URL. Needed for the Run buttons. **Include `task-intake`** — a routine, not a job — or Add task, New workflow, Arm and Approve all fail | For buttons |
| `FIRE_KEY` | A password for firing jobs, sent as `x-fire-key` | For buttons |
| `PUBLIC_FIRE` | `true` to drop `FIRE_KEY` for requests from your own page. **Read the warning below first** | No |

**Redeploy after changing any of these.** Vercel does not apply env vars to a running deployment.

> **`PUBLIC_FIRE` is a convenience, not a security boundary.** It tells the fire endpoint to accept
> requests that look like they came from your own page, using headers a browser sets. A browser
> cannot lie about them; anything that is not a browser can **forge them freely**. So with
> `PUBLIC_FIRE=true`, anyone who knows your dashboard's URL can start your jobs - spending runs on
> your Claude account - without a key. The buttons still cannot make anything *send*, and the
> dashboard still cannot write to your repo, but the runs are real and they are yours. Leave it
> unset and use `FIRE_KEY` unless you have a reason not to.

**4. Open it.** If you set `VIEW_KEY`, the page asks for it once and remembers.

---

## Did it work?

- The page loads and the **Today** screen shows your repo name at the top
- All seven screens open from the nav
- **Workflows** shows a state chip on every job
- The footer says when it read your repo

**If it says "not configured"** — `VIEW_KEY` is unset and `PUBLIC_DASHBOARD` is not `true`. Set one.

**If it says "Set GITHUB_OWNER and GITHUB_REPO"** — those two are missing, or you did not redeploy
after adding them.

Locally:

```bash
npm test
```

591 tests, no dependencies to install. They cover the data logic, the fire endpoint's auth, and —
since a regex over the page source proves nothing about what a person sees — a harness that renders
all seven screens and asserts on the actual output.

---

## When it breaks

| What you saw | What to do |
|---|---|
| `This dashboard is not configured` | Set `VIEW_KEY`, or `PUBLIC_DASHBOARD=true` if the repo is public. Redeploy |
| `Set GITHUB_OWNER and GITHUB_REPO` | Add both in Vercel settings, then **redeploy** |
| `404` from GitHub | The owner/repo names are wrong, or the repo is private and `GITHUB_TOKEN` is missing |
| Every job says **UNKNOWN** | No routines snapshot in your repo. Run `/routines` in Claude Code, commit, push |
| The snapshot banner says it is stale | Exactly what it means. Run `/routines` again and commit |
| A job says **DECLARED** | Its file claims a schedule and no routine backs it. Run `/arm` |
| A job says **UNAPPROVED** | Something is firing that your files say is off. It is spending runs nobody approved |
| **No hero number yet** | Your `tiles.yml` names a metric nothing computes, or your ledger has no hours in it. The sentence says which |
| Run buttons do nothing | `FIRE_TRIGGERS` is unset, or that job has no `fire: true` in its trigger block |
| Add task, New workflow, Arm or Approve answer "No \"task-intake\" routine is registered" | Those four dispatch to one dedicated routine rather than to a job, so `task-intake` needs its own entry in `FIRE_TRIGGERS`. It is not a workflow slug and wiring every workflow does not supply it |
| The board looks empty but the repo is fine | Check the branch. `GITHUB_BRANCH` defaults to `main` |

---

## What it will never do

- **Write to your repo.** Every button is a *dispatch*: an agent session makes the change and
  commits it. A broken board cannot corrupt your team
- **Send anything.** It has no email, no publishing, no outbound anything
- **Show you somebody else's data.** It reads one repo, the one you named
- **Guess.** Where it does not know, it says it does not know

---

## Under the hood

One serverless function reads your repo through the GitHub API and returns a single JSON payload;
the page renders it. There is no database, no build step, and no framework.

The arming logic mirrors `scripts/lib/arm.mjs` in the team repo rather than importing it — there is
no import path between a student's repo and a deployed app. `tests/routines.test.mjs` pins the two
to the same answers, because mirroring means drift, and drift is what a test is for.

---

Built by [Nuno Tavares](https://github.com/AutomatedMarketer) for the V-C Ink Level 2 bootcamp.
