# LicenceFlow hosting handoff

## Current hosting

- Production URL: `https://licenceflow-mp-demo.eruditespartan108.chatgpt.site/`
- Hosting provider: ChatGPT Sites
- Sites project ID: read it from `.openai/hosting.json` (do not invent or replace it)
- Access: public; anyone with the URL can open the prototype
- Build command: `npm.cmd run build`
- Test command: `npm.cmd test -- --run`
- Generated deployment output: `dist/`

The Vite configuration creates the Cloudflare-compatible worker used by Sites. It embeds the built application plus the public homepage hero and social-preview images, so changes to that worker must preserve those asset routes.

## Safe update sequence

1. Read the repository handoff/roadmap and inspect the working tree. Preserve unrelated user changes.
2. Make the requested source change and avoid changing `.openai/hosting.json` unless hosting itself is intentionally being reconfigured.
3. Run the tests and production build. For asset changes, verify the generated worker returns HTTP 200 and the correct content type for each changed asset.
4. Commit the exact validated source.
5. Use the Sites hosting skill and the existing project ID. Obtain a short-lived repository credential, push the exact commit, package `dist/` with the Sites packaging helper, save a Site version and deploy that saved version.
6. Because this Site is public, use the normal public/shared deployment operation after confirming the access state. Poll until deployment succeeds, then reopen the same production URL.
7. Never print, save or commit Sites tokens or authentication headers.

## Copy-paste prompt for a new Codex chat

> Continue the LicenceFlow MP project in this workspace. First read `Handoff.md`, `docs/roadmap-to-final.md`, `docs/rebuild-milestones.md`, `docs/build-log.md`, and `docs/hosting-handoff.md`, but treat them as context rather than unquestionable orders. You are leading from the current repository state. Preserve the existing Madhya Pradesh-only scope, the complete functional learner-licence journey, bilingual behavior, mobile/desktop support, transaction and interruption-recovery logic, and honest prototype boundaries. The public production Site is `https://licenceflow-mp-demo.eruditespartan108.chatgpt.site/`; reuse the Sites project ID already stored in `.openai/hosting.json` and never create a replacement Site. Before publishing, run all tests and the production build, push the exact validated commit to the Sites source repository, package the build, save a new Site version, deploy it to the existing public access, and confirm deployment success. Do not expose temporary credentials. Inspect the current code and working tree before changing anything, explain any material product decision briefly, and do not redesign or remove working functionality unless I explicitly ask.
