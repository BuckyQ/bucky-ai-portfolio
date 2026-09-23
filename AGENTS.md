# Bucky Qian Portfolio - Agent Rules

These instructions apply to every AI-assisted change in this repository. Read
this file before inspecting or editing the application.

## Current Project Brief

This brief defines the baseline version of the portfolio. Treat it as the
current product specification until the user supplies screenshots, reference
sites, updated copy, or a direct instruction that supersedes it.

### Candidate Positioning

- Bucky Qian is a frontend engineer transitioning into an Applied AI Engineer.
- The portfolio must make the transition credible rather than hiding the
  frontend background. Frontend product craft is part of the differentiator.
- The core positioning is: an Applied AI Engineer who can build the AI system
  and turn it into a polished product people can use.
- The primary audience is recruiters, hiring managers, engineering leaders,
  founders, and potential collaborators hiring for Applied AI roles.
- A visitor should understand Bucky's name, target role, differentiator, and
  strongest evidence within the first viewport or first few seconds.

### Baseline Deliverable

- Build a polished single-page portfolio using the repository's existing
  React, TypeScript, and Next.js foundation.
- The first implementation is a strong structural and visual baseline. Do not
  overfit the design before the user provides screenshots and reference URLs.
- Future visual references should refine this foundation rather than forcing a
  rewrite unless the user explicitly requests a new direction.
- Support desktop and mobile as complete experiences, not as a desktop page
  with a compressed mobile fallback.
- Do not add unrelated routes, dashboards, blogs, authentication, a CMS, or
  speculative product features to the baseline.

## Required Page Architecture

Keep the narrative order below unless the user explicitly changes it. Section
transitions should feel like one continuous editorial experience, not a stack
of interchangeable landing-page modules.

The approved visual rhythm is:

1. Cinematic image / Hero
2. Portrait plus compact experience / Profile
3. Three-project proof / Selected Work
   - Product UI / Topify AI
   - System diagram / AI Job Intelligence Agent
   - Pipeline / RAG + Evaluation System
4. Short typography / Background
5. Minimal / Contact

Visible section labels must remain sequential and use this exact system:
`01 / PROFILE`, `02 / SELECTED WORK`, `02.1 / TOPIFY AI`,
`02.2 / AI JOB INTELLIGENCE AGENT`, `02.3 / RAG + EVALUATION SYSTEM`,
`03 / BACKGROUND`, and `04 / CONTACT`. Primary navigation uses `ABOUT`,
`SELECTED WORK`, `BACKGROUND`, and `CONTACT`.

Everything after Hero should be concise and recruiter-scannable. The site must
prove production engineering experience, real AI product work at Topify, and
deeper Applied AI work through agents, retrieval, and evaluation. Remove or
merge content that does not strengthen one of those three points.

### 1. Full-Viewport Hero

- Treat the current `ElectronicOcean` implementation as the approved visual
  baseline. Refine it incrementally; do not replace it with a generic hero,
  stock video, gradient background, or unrelated animation unless the user
  explicitly requests a new direction.
- Fill the initial viewport on desktop and mobile. The next section may remain
  discoverable through the composition itself, but do not add a visible
  `Scroll to explore` label or another instructional scroll prompt.
- Keep the persistent header, identity-led headline, supporting transition
  statement, Applied AI focus panel, two clear actions (`View Selected Work`
  and `Ask Bucky AI`), and clear contact destination. The resume remains
  available in Contact.
- The headline must communicate Bucky's name or Applied AI Engineer identity;
  supporting copy should explain the frontend-to-AI transition.
- Preserve the current hero copy hierarchy: `Bucky Qian builds` followed by
  the editorial italic line `AI people can use.` The supporting paragraph must
  continue to connect frontend engineering with Applied AI delivery.
- Keep text readable over the moving ocean with deliberate framing and dark
  overlays. Do not place the headline inside a floating card.

#### Approved Ocean Scene

- Use the official Three.js `Water` foundation with the local water-normal
  texture. The scene should feel like a real dark ocean rather than a neon,
  wireframe, particle, or synthetic liquid effect.
- Keep the foundation near-black with restrained cool silver-blue moonlight.
  The scene must not drift into saturated blue, cyberpunk neon, or a bright
  daytime ocean.
- Keep the small textured moon in the upper-left portion of the sky. It should
  be bright enough to read clearly while preserving visible lunar detail.
- Keep the moonlight path diagonal: it begins near the upper-left horizon and
  widens toward the lower-right foreground. Do not revert it to a centered or
  vertical reflection column.
- Keep two detailed boat silhouettes on the right side of the horizon. The
  nearer boat sits lower and is larger; the farther boat sits higher and is
  smaller. Preserve the curved hulls, cabins, railings, masts, antennas, warm
  windows, mast lights, navigation lights, and subtle depth separation.
- Boat lighting should be visibly warm against the cool ocean, but remain
  small and cinematic rather than becoming large decorative glow effects.
- Preserve the raycast-aligned pointer interaction: moving across the water
  creates layered concentric ripples, stronger local normal disturbance, and
  subtle fish avoidance. The visible response must remain aligned with the
  pointer after responsive resizing.
- Preserve the stronger wave motion and moving broken highlights along the
  diagonal moon path. Motion should feel continuous and natural, not fast or
  mechanically repetitive.
- Keep the scene responsive. On compact viewports, reposition and rescale the
  moon and both boats so the title remains readable and no horizontal overflow
  is introduced.
- Honor `prefers-reduced-motion`, pause animation while the document is hidden,
  cap pixel ratio and reflection resolution, and dispose all Three.js geometry,
  materials, textures, render targets, and event listeners during cleanup.
- Keep the real Mini RAG assistant discoverable through the Hero action and a
  persistent bottom-right launcher. It must remain closed on initial load and
  open in the established dark editorial drawer rather than an empty or fake
  chat surface.
- Keep one shared Ask Bucky drawer and state for all homepage entry points:
  Hero, the persistent launcher, and the RAG project's live-demo action. Do not
  create parallel chatbot instances on the homepage.
- The assistant launcher and drawer must not obscure navigation, the contact
  action, or important mobile controls.

### 2. Profile And Experience

- Continue the approved hero's cinematic editorial language into Profile. The
  ocean may darken and fade during the transition, but it must disappear before
  it competes with the Profile content.
- Do not restore the hexagonal/honeycomb canvas in Profile. Use near-black
  surfaces, monochrome portrait treatment, restrained grid lines, thin borders,
  and quiet system metadata that relates to the hero's intelligence layer.
- Keep Profile on a near-black charcoal surface rather than pure black. A very
  faint ocean horizon or reflection may survive only through the first
  `150-250px`, then must fade completely into the section background. Film
  grain, guide lines, neutral headline glow, and sparse coordinate-style
  annotations must remain extremely subtle and must not become a pattern-led
  cyberpunk treatment.
- Include a real portrait/avatar area, a contextual person image when useful,
  a concise personal introduction, public contact methods, and verified career
  or project data.
- The portrait must feel integrated into the composition rather than placed in
  a generic profile card. Until the user supplies approved photography, use an
  explicit replaceable asset slot and do not invent a photorealistic identity.
- Merge the career story and employment history into this one section. Do not
  create a later standalone Experience section or a separate metric band.
- Use the approved two-part headline: `I learned to shape the interface.` and
  the serif italic line `Now I shape the intelligence behind it.`
- State the `4+ years` of verified production experience across Apple and
  Topify AI once, then explain that latency should be visible, uncertainty
  understandable, and system quality measurable.
- Keep only the concise Topify `2025-2026` and Apple `2021-2025` timeline with
  roles and focus areas. Do not add another philosophy block, additional
  photography, or long employment summaries.

### 3. Selected Work

- This is the most important section after Hero and must contain exactly three
  projects: Topify AI, AI Job Intelligence Agent, and RAG + Evaluation System.
- Keep the homepage section concise enough for recruiter scanning. Dedicated
  project routes may add compact engineering evidence, but must not become a
  long case-study archive. Do not add more projects without an explicit request.
- Give projects consistent actions only when the destination exists. Never use
  a general GitHub profile link as though it were a project repository, and do
  not add a source, demo, or case-study link that cannot be verified.
- Keep one secondary `Q /` annotation in each project introduction: what Bucky
  built at Topify, how the Job Intelligence Agent works, and how RAG quality is
  evaluated. Answers must be direct, factual, and immediately follow the
  question. Do not expand these annotations into an FAQ or add FAQ schema.

#### 3.1 Topify AI

- Make Topify the largest project because it proves real production AI product
  experience.
- State ownership of realtime AI analysis, prompt tracking, competitor
  intelligence, reporting, onboarding, and conversion.
- Show exactly two product visuals: one large Product Overview and one smaller,
  focused Realtime / recommendation detail. Do not restore the Prompt
  Intelligence or additional recommendation screenshots as new chapters.
- Describe recommendation UI as `Generated Recommendations` or
  `AI-generated recommendations`; do not call it autonomous agent behavior
  unless a defensible implementation can be explained in an interview.
- Present screenshots inside the established technical viewport with a thin
  low-contrast frame, subtle neutral border light, restrained hover, and no
  device mockup or fake browser chrome.
- Keep the second visual near a desktop maximum of `760px` by `560px`, with a
  focused crop and generous negative space. Keep it near `420px` high on tablet
  and `300-350px` high on mobile.
- Label shipped Topify interfaces as `PRODUCTION` or `PRODUCTION INTERFACE`.
  Do not use `LIVE` or wording that implies current operation or maintenance.

#### 3.2 AI Job Intelligence Agent

- Use one monochrome system architecture visual rather than another SaaS
  screenshot.
- Preserve this flow: User -> Triage -> Planner; Planner branches to Company
  Research and Job Analyzer; both feed Resume Analyzer -> Strategy Agent ->
  Interview Plan.
- Supporting annotations may name Tools, Structured Output, Tracing, and
  Evaluation. Use thin lines, indexed stages, and monospace labels; avoid
  colorful boxes, glowing nodes, decorative illustrations, or fake metrics.
- Keep `/projects/ai-job-intelligence` concise and engineering-focused. Claims
  may cover planner-led orchestration, specialist boundaries, tool-connected
  research, structured outputs, tracing, evidence evaluation, and human review.
  Do not claim a framework, runtime, retry strategy, timeout policy, or public
  source repository unless the project evidence explicitly supports it.

#### 3.3 RAG + Evaluation System

- Use one technical pipeline: Documents -> Chunk -> Embed -> Vector Store ->
  Retrieve -> Generate -> Evaluate.
- Show Precision@K, Recall@K, Faithfulness, and Answer Relevance as evaluation
  concepts. Never invent numeric results.
- Use a ruled technical strip rather than a dashboard screenshot, metric cards,
  or abstract AI illustration.
- Under the pipeline, retain concise engineering evidence for document
  chunking, configurable size and overlap, embeddings, cosine similarity,
  Top-K retrieval, similarity thresholds, metadata filtering, context
  construction, grounded generation, and retrieval/answer evaluation.
- Explain failure diagnosis directly: Precision and Recall diagnose retrieval;
  Faithfulness and Answer Relevance diagnose generation. The live-demo action
  must open the same homepage Ask Bucky drawer, while `/projects/mini-rag`
  remains the concise project route with the embedded demo.

### 4. Background

- Keep this as a short typography-only section around `50-65vh` on desktop.
- Use the heading `Frontend instincts. Applied AI systems.` with one secondary
  question about why frontend experience matters for Applied AI and one direct
  answer about latency, uncertainty, model state, accessibility, and trust.
- Do not restore `From model behavior to human behavior`, three principle
  blocks, Build / Expose / Measure cards, screenshots, or another large
  transition statement.

### 5. Contact Finale

- End with `LET'S BUILD SOMETHING USEFUL.`
- Keep Email, GitHub, LinkedIn, Resume, and `Start a conversation` as the only
  primary destinations.
- Keep the subtle `Resume + selected AI projects` context near the Resume link;
  do not regenerate the PDF unless its editable source is available and the
  user explicitly requests a resume update.
- Keep Contact in two normal-flow vertical layers: headline, links, and CTA in
  the upper layer; identity metadata and copyright in a ruled footer row at the
  very bottom. The CTA must sit above that footer row and must never share an
  absolute bottom-left position with the metadata.
- Keep the footer minimal and retain enough identity context to associate it
  with Bucky Qian and Applied AI Engineering. Do not add a lead form, signal
  circle, or decorative system graphic.
- Keep the machine-readable freshness label `LAST UPDATED / SEP 2026` in the
  ruled footer metadata row and back it with a semantic `time` element using
  the real content update date.

## Content And Asset Readiness

- Treat the background video, portrait, person image, and Topify product media
  as named asset requirements. Keep their locations easy to replace when the
  user provides final files.
- Never fabricate a portrait of Bucky or imply that an AI-generated person is
  him without explicit approval.
- Do not publish confidential Apple or Topify interfaces. Use only assets the
  user provides or confirms are public.
- Use clear temporary asset boundaries during development, but do not ship
  visible placeholder labels, broken media, or fake screenshots.
- Record important missing assets or copy in the final handoff instead of
  silently inventing them.

## Product Intent

This site is Bucky Qian's interactive portfolio and resume. Its central story
is the transition from Frontend Engineer to Applied AI Engineer. Every change
should strengthen both sides of that story:

- Strong product craft, interaction design, accessibility, and frontend depth.
- Credible production experience with AI agents, RAG, retrieval, evaluation,
  LLM applications, and real-time AI interfaces.

The site should feel technically ambitious, premium, restrained, and visually
distinctive without becoming a generic cyberpunk template, modular template
site, or animation showcase that obscures the candidate's work.

## Source Of Truth

- Resume facts currently represented on the site come from
  `public/Bucky-Qian-Resume.pdf`.
- Do not invent employers, dates, metrics, project outcomes, technologies,
  education, testimonials, or client names.
- Preserve these contact destinations unless the user explicitly changes them:
  - Email: `BuckQianWorking@gmail.com`
  - GitHub: `https://github.com/BuckyQ`
  - LinkedIn: `https://www.linkedin.com/in/hao-q-156421170/`
- Use `https://topify.ai/` as the verified public product link for Topify. Do
  not label a repository as project source unless that repository has been
  verified to contain the project shown on the site.
- If a design needs undocumented content, use neutral labels or ask for the
  missing facts. Never present placeholder achievements as real experience.

## Visual Direction

- The overall experience is dark, premium, restrained, and technologically
  sophisticated. Darkness should create depth and focus, not reduce legibility.
- Keep a near-black foundation and warm white typography. Accent colors should
  be sparse and intentional; do not make the page glow everywhere.
- Use strong typography, grid lines, system diagrams, and restrained technical
  details to communicate AI engineering.
- The first viewport must communicate Bucky's identity and the
  `Frontend Engineer -> AI Engineer` transition.
- Avoid generic SaaS layouts, excessive rounded cards, decorative gradients,
  stock imagery, and unrelated visual effects.
- Avoid a visibly modular website: no repetitive stacks of equally sized cards,
  repeated icon-title-description grids, isolated floating section containers,
  or obvious page-builder patterns.
- Prefer editorial composition, asymmetry, full-width media, controlled overlap,
  strong pacing, and varied section rhythm while keeping navigation predictable.
- Let imagery, video, typography, and content hierarchy carry the design. Do
  not decorate empty space with gradient orbs, bokeh, or arbitrary particles.
- Do not replace the visual language wholesale unless the user asks for a
  redesign.

### Ambient Background System

- Keep ambient effects below the content hierarchy and preserve all approved
  typography, layout, spacing, screenshots, and Hero behavior.
- Reuse a restrained language of `2-3%` film grain, `3-5%` large technical
  grids, neutral radial light, and occasional `8-12%` section rules. Effects
  should be felt before they are consciously noticed.
- Profile may retain its fading ocean residue and one very slow, non-looping
  scan. Topify may use quiet data markers, screenshot backlight, and one
  background-only signal sweep when it enters view.
- The Job Agent project may use only a few low-opacity nodes and connecting
  lines. The RAG project may use sparse vector dots, path lines, markers, and a
  few one-time retrieval signals. Never turn either into a large neural-network
  illustration or particle field.
- Keep Background almost static and quiet. Preserve its approved light paper
  interval while using an inverted, barely visible grid, grain, and neutral
  radial light rather than changing its established palette.
- Contact may use sparse signal points, one faint horizon line, grain, and a
  soft neutral CTA glow. The CTA remains dominant and the two-layer footer
  layout must not be disturbed.
- Ambient interaction movement must stay below `30px`; one-time signal travel
  should finish within roughly `1.5-3s`, while any continuous ambient cycle
  must take `10-25s`. Do not add pointer tracking unless explicitly requested.
- Disable sweeps, path travel, scans, and background drift under
  `prefers-reduced-motion`. On touch/mobile, keep the static treatment and
  remove nonessential automatic motion.
- Never add neon blue or purple, code rain, hexagons, circuit patterns, AI
  brains, dense particles, aggressive parallax, glitching, rotating shapes, or
  3D ambient backgrounds.

## Design System Tokens

Treat the following typography and color values as the default visual system
for every page and component. Reuse these tokens instead of introducing
one-off font sizes, font families, or colors.

### Typography

- Use `var(--font-geist-sans)` / Geist Sans as the primary interface and body
  typeface.
- Use `var(--font-geist-mono)` / Geist Mono for navigation, metadata, compact
  labels, technical annotations, and code-like content.
- Use `Georgia, "Times New Roman", serif` selectively for display accents,
  editorial italics, and large project data. It must support the primary type,
  not replace it across the interface.
- Use these responsive type roles:
  - Hero `h1`: `96-138px` desktop, `54-72px` mobile, weight `500`.
  - Page `h2`: `64-92px` desktop, `40-52px` mobile, weight `500`.
  - Section `h3`: `28-44px` desktop, `24-32px` mobile, weight `500`.
  - Lead copy: `20-24px` desktop, `18-20px` mobile.
  - Body copy: `16-18px` desktop, `15-17px` mobile.
  - Supporting text: `13-14px` desktop, `12-14px` mobile.
  - Navigation and labels: `10-12px` desktop, `12-13px` mobile, Geist
    Mono, weight `500`. Meaningful mobile text must never render below `12px`;
    interactive mobile text should use at least `13px`.
  - Header navigation is the approved exception: `14px` desktop, `13px`
    tablet, and `20px` inside the mobile menu. The mobile `MENU/CLOSE` trigger
    is `13px`, and the mobile contact action is `16px`.
  - Data numbers: `40-64px` desktop, `34-48px` mobile, Georgia, weight
    `400`.
  - Editorial accents: Georgia Italic at the size of their surrounding
    heading role.
- Keep letter spacing at `0` except for an already established small uppercase
  label style. Body copy line height should stay between `1.55` and `1.7`.
- Use `clamp()` with explicit minimum and maximum values for responsive display
  text. Do not use unbounded viewport-based font sizing.

Use these CSS custom properties as the canonical starting point:

```css
--font-primary: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
--font-display: Georgia, "Times New Roman", serif;

--text-hero: clamp(3.5rem, 8vw, 8.625rem);
--text-h2: clamp(2.5rem, 6vw, 5.75rem);
--text-h3: clamp(1.5rem, 3vw, 2.75rem);
--text-lead: clamp(1.125rem, 1.5vw, 1.5rem);
--text-body: clamp(0.9375rem, 1vw, 1.125rem);
--text-label: 0.6875rem;
```

### Color

Use this palette as the canonical color system:

```css
--color-black: #080908;
--color-surface: #111310;
--color-surface-raised: #171a17;
--color-text-primary: #eceee8;
--color-text-secondary: #b2b7af;
--color-text-muted: #858b83;
--color-text-dark: #101210;
--color-accent: #c7ff5a;
--color-accent-muted: #6f874f;
--color-accent-dark: #33452b;
--color-border: rgba(236, 238, 232, 0.17);
--color-border-strong: rgba(236, 238, 232, 0.3);
--color-paper: #e7e9e3;
--color-paper-muted: #555b55;
```

- Reserve accent green for positioning statements, key data, interaction
  feedback, and primary links or actions. It must not become a general fill
  color across the page.
- Use `--color-text-secondary` for normal body copy rather than pure white, and
  `--color-text-muted` for labels and secondary metadata.
- Use the border tokens for dividers and component outlines; do not invent
  unrelated gray values for each section.
- Hover states should increase brightness or contrast by one visual step while
  preserving the established palette.
- Do not introduce purple or blue neon treatments, multicolor gradients, or a
  competing accent hue.
- A new typography or color value requires either an explicit user-directed
  redesign or a documented addition to this design system.

### Layout, Alignment, And Spacing

Use a shared alignment system across the portfolio so sections feel related
even when their compositions and backgrounds change. Full-width backgrounds,
video, and interactive canvases may bleed to the viewport edge; readable
content must align to the shared inner layout.

Use these layout properties as the canonical starting point:

```css
--layout-max: 1600px;
--layout-gutter: clamp(22px, 4vw, 64px);
--layout-gutter-wide: clamp(22px, 6vw, 96px);
--grid-gap: clamp(18px, 2vw, 32px);
--section-space: clamp(90px, 10vw, 160px);
--section-space-compact: clamp(64px, 7vw, 112px);
--header-height: 82px;
```

- Center the main inner layout with `max-width: var(--layout-max)` and equal
  inline gutters. Do not independently nudge adjacent sections with arbitrary
  left or right margins.
- Use a 12-column grid on desktop, an 8-column grid on tablet, and a 4-column
  grid on mobile. Editorial asymmetry is encouraged, but major edges must land
  on a shared column line.
- Keep primary section labels, headings, body content, media edges, and footer
  content aligned to the same outer gutter unless a clearly intentional
  full-bleed composition requires otherwise.
- Default to left-aligned headings and paragraphs. Centered text is reserved
  for short, intentional moments and must not be used as a generic section
  layout.
- Limit normal body copy to approximately `60-68ch` and large lead copy to
  approximately `26-34ch`. Do not stretch prose across the full viewport.
- Maintain a visible vertical relationship between a section label, heading,
  lead, and supporting content. Use spacing tokens or a consistent multiple of
  `8px`; avoid one-off pixel gaps unless an asset requires optical correction.
- Use `--section-space` for major section boundaries and
  `--section-space-compact` inside a section. Do not compress unrelated
  sections into a continuous card-like stack.
- In two-column editorial layouts, prefer stable proportions such as `4/8`,
  `5/7`, or the established Profile portrait/content split. Align the top edge
  of the first meaningful content in both columns.
- Keep repeated rows, metrics, dividers, and project details aligned to a
  consistent internal grid. Dynamic text must wrap without moving neighboring
  columns or resizing controls.
- The Profile portrait may remain sticky on desktop, offset by the fixed header
  where needed, while the story scrolls in the adjacent column. Its image,
  circular graphic, caption, and crop must share one visual center. On screens
  `900px` and below, stack the portrait above the story and disable sticky
  positioning.
- Use `900px` as the primary desktop-to-mobile composition breakpoint and
  `520px` for narrow-phone refinements unless a component has a documented
  content-driven reason for another breakpoint.
- At `900px` and below, use a minimum `22px` inline gutter, collapse complex
  grids to one column in reading order, and keep tap targets at least `44px` in
  either width or height where practical.
- Sticky and fixed elements must account for the header height and must never
  cover headings, links, or focused controls.
- Before completing a layout change, inspect at least one wide desktop, one
  standard desktop, and one narrow mobile viewport for shared edges, readable
  line lengths, text wrapping, and overlap.

## Motion And Interaction

- Motion is a core part of the portfolio. Prefer meaningful motion tied to
  hierarchy, scrolling, system flow, or user input.
- Keep animation smooth and purposeful. Reading must not depend on an animation
  finishing.
- Use `framer-motion` for component and scroll transitions and CSS for
  lightweight ambient loops.
- Avoid rerendering the whole page on every pointer event.
- Every new animation needs a usable `prefers-reduced-motion` fallback.
- Hover cannot be the only way to reveal information or access an action.
- On fine-pointer hover, product viewports may scale only to `1.008`, brighten
  from roughly `.94` to `1`, and raise frame contrast over `350-450ms`. Never
  add dramatic zoom, floating motion, parallax, or 3D tilt.
- A product viewport may run one restrained `600-900ms` horizontal scan on its
  first mouse entry. It must not loop or become a persistent scan effect.
- Animate only the dot inside live status labels with a low-amplitude
  `2.5-3s` opacity breath. Do not pulse or move the accompanying text.
- Links and CTAs may reveal a `1px` underline from left to right and move their
  arrow by `2-4px` over `200-300ms`. Hover color should move from muted gray to
  off-white rather than introducing neon accents.
- Keep large headlines stable. Serif italic phrases may gain a small contrast
  change only; never shake, glitch, bounce, rotate, or significantly re-space
  display typography.
- Use a one-time `120-180ms`, maximum `1px` jitter only on a sparse set of
  technical labels. Never loop label jitter.
- Do not depend on hover for mobile behavior. Disable hover scale, scans,
  jitter, ambient border travel, and nonessential automatic motion for coarse
  pointers; preserve static hierarchy and simple tap feedback.

## Content And UX

- Lead with outcomes and engineering decisions, not buzzword lists.
- Project sections should explain the problem, role, architecture,
  implementation, and measurable result when a verified metric exists.
- Keep navigation, resume download, email, GitHub, and LinkedIn functional.
- Do not expose the phone number publicly unless the user specifically asks.
- Use concise English copy by default. A bilingual experience must keep both
  languages complete and equivalent.
- Do not add visible instructions explaining the site's animation or design.

## SEO And GEO

SEO and Generative Engine Optimization are product requirements, not optional
polish. Every public page must remain understandable to traditional search
engines and answer engines even when JavaScript, animation, or canvas effects
are unavailable.

The discoverability goal is specific: when a recruiter or hiring manager
searches for Bucky Qian, his verified profiles, Applied AI Engineer experience,
frontend background, AI agents, RAG, or relevant project work, the portfolio
should clearly identify the right person and provide enough evidence to judge
role fit. Optimize for accurate entity recognition and useful answers, not raw
traffic or broad high-volume keywords.

### Search Fundamentals

- Every indexable route must have a unique, accurate title and meta description
  derived from the visible page content.
- Maintain a single descriptive `h1` per page and a logical heading hierarchy.
- Important identity, experience, project, and skill content must exist as
  crawlable HTML text. Do not place essential copy only in images, canvas,
  video, animation state, or client-fetched content.
- Use semantic landmarks and descriptive internal links. Link labels must
  explain the destination without relying on surrounding text.
- Provide canonical URLs once the production domain is known. Never invent or
  hard-code a placeholder production domain.
- Keep `robots.txt` and `sitemap.xml` accurate for all public routes. Exclude
  drafts, private pages, duplicate URLs, and non-content utility routes.
- Preserve useful image alternative text and explicit image dimensions. Use
  empty alt text for purely decorative imagery.
- Do not use keyword stuffing, hidden text, doorway pages, fake freshness, or
  duplicated location pages.
- Naturally include relevant role language where supported by real experience:
  `Bucky Qian`, `Applied AI Engineer`, `Frontend Engineer`, `AI Agents`,
  `Retrieval-Augmented Generation`, `LLM applications`, `TypeScript`, and
  `Mountain View, California`. Do not repeat these phrases mechanically.
- Metadata should be written for a recruiter scanning search results: identify
  the person, target role, strongest differentiator, and evidence succinctly.

### Structured Data And Entity Consistency

- Keep one JSON-LD `@graph` containing the homepage's `WebSite`, `ProfilePage`,
  and `Person` entities. Connect them with `publisher`, `mainEntity`, `about`,
  `author`, and `isPartOf`. Add `Article`, `CreativeWork`, or
  `SoftwareSourceCode` only when the visible content genuinely supports it.
- JSON-LD must match visible content and the resume source of truth. Never add
  unsupported ratings, awards, employers, job titles, dates, metrics, or
  `sameAs` profiles.
- Keep the core entity consistent across page copy, metadata, JSON-LD, social
  previews, and resume content: Bucky Qian, Applied AI Engineer, Mountain View,
  California, with the verified GitHub and LinkedIn URLs in this file.
- Use stable project names and terminology across headings, descriptions,
  metadata, and structured data so search and answer engines can connect each
  project to the same entity.
- Treat `https://buckyqian.com` as the canonical production URL. Use
  `Bucky Qian | Applied AI Engineer` as the page title and `Bucky Qian` as the
  site and person entity name across metadata, Open Graph, and schema.
- Keep the entity IDs stable as `https://buckyqian.com/#website`,
  `https://buckyqian.com/#profile`, and `https://buckyqian.com/#person`.
  Keep the verified LinkedIn and GitHub URLs in `Person.sameAs`, and do not add
  a meta keywords tag.
- Validate structured data after meaningful metadata or content changes.

### Generative Engine Optimization

- Write concise, self-contained passages that clearly state who Bucky is, what
  he built, his role, the technologies used, and the verified outcome. A reader
  should not need to infer the subject from decorative context.
- Prefer concrete claims and attributable first-party evidence over vague
  superlatives such as "world-class", "best", or "revolutionary".
- Make project case studies easy to quote: include a clear summary, problem,
  approach, architecture, responsibilities, and verified result.
- Expand acronyms at first meaningful use when ambiguity is likely, for example
  Retrieval-Augmented Generation (RAG) and Server-Sent Events (SSE).
- Use tables, lists, definitions, and short factual paragraphs when they make
  technical relationships easier to extract. Do not flatten substantive
  content into tag clouds.
- Add dates or `dateModified` only when accurate and maintainable. Do not update
  dates merely to appear fresh.
- Cite or link to public first-party evidence such as GitHub repositories,
  live demos, technical writing, or company pages when those sources exist and
  are approved for public use.
- Do not create `llms.txt`, FAQ schema, or AI-crawler-specific files as empty
  SEO theater. Add them only when they contain useful, maintained, public
  information and are consistent with the site.
- Do not create a Terms page solely for an SEO or audit score. Before a future
  Mini RAG assistant begins collecting prompts, analytics, or logs, add a
  concise Privacy page that accurately explains the collected data, purpose,
  retention, and contact path, then link it from the site.
- Ensure answer engines can extract direct answers to these questions from
  visible HTML without guessing:
  - Who is Bucky Qian?
  - What Applied AI work has he done?
  - How does his frontend background improve his AI product work?
  - Which AI systems, tools, and evaluation methods has he used?
  - What did he build at Topify AI and Apple?
  - How can a recruiter contact him or download his resume?

### Social Discovery And Performance

- Maintain complete Open Graph and X/Twitter metadata for shareable routes.
  Social preview titles, descriptions, and images must describe the actual
  route rather than repeat a generic site-wide message.
- Keep the social preview image legible at small sizes and consistent with the
  current visual system. Do not ship starter or placeholder preview assets.
- Protect Core Web Vitals. Animation and visual effects must not cause layout
  shifts, delay the primary text, block interaction, or substantially increase
  the initial JavaScript payload.
- Prefer server-rendered content and Next.js metadata APIs. Client-side effects
  may enhance presentation but must not be required for indexing core content.

### SEO/GEO Validation

After changing public content, routes, metadata, navigation, or rendering:

1. Confirm the rendered page title, description, canonical URL when configured,
   heading hierarchy, and crawlable body content.
2. Confirm JSON-LD parses and matches visible, verified facts.
3. Confirm `robots.txt`, `sitemap.xml`, and social metadata remain accurate.
4. Check that important content is present in the server-rendered HTML.
5. Check for broken internal links, missing alt text, accidental `noindex`, and
   regressions to Core Web Vitals or bundle size.
6. Confirm a recruiter can identify Bucky, his target role, strongest evidence,
   location, verified profiles, and contact path from rendered text alone.

## Responsive And Accessible Quality

- Treat desktop and mobile as first-class layouts. Check at minimum a narrow
  mobile viewport and a wide desktop viewport.
- Prevent text, navigation, diagrams, and buttons from clipping or overlapping.
- Use semantic HTML, logical headings, keyboard-operable controls, visible
  focus states, descriptive labels, and sufficient contrast.
- Keep `Skip to main content` as the first focusable control and preserve
  `#main-content` as its target. Anchored sections must account for the fixed
  header with scroll padding or scroll margin.
- The mobile menu must expose `aria-expanded`, `aria-controls`, and an accurate
  label; move focus into the open menu, contain keyboard focus while it is
  open, close on Escape, and return focus to the trigger.
- The Ask Bucky drawer must move focus inside when opened, keep background
  regions inert, trap Tab focus, close on Escape, and restore focus to whichever
  control opened it.
- Keep meaningful mobile actions near a `44px` minimum touch target and use a
  clear `2px` `:focus-visible` indicator. Small technical copy must remain
  readable at WCAG AA contrast. Meaningful mobile labels and metadata must be
  at least `12px`, while interactive text should be at least `13px`.
  Decorative grid lines and nonessential coordinate markers may remain subdued
  or be hidden on narrow screens.
- Decorative graphics must be hidden from assistive technology. Meaningful
  content cannot exist only inside a canvas or animation.
- Preserve `prefers-reduced-motion` support. Accessibility regressions are
  especially damaging because accessibility is a stated professional strength.

## Engineering Conventions

- Preserve Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and
  Lucide unless a change clearly requires otherwise.
- Read relevant local Next.js documentation under `node_modules/next/dist/docs/`
  before using unfamiliar or version-sensitive APIs.
- Prefer small typed components and data-driven repeated sections. Extract a
  component when it removes meaningful duplication or isolates complex state.
- Keep client components limited to interactive surfaces.
- Use Lucide icons when available. Do not hand-author SVG interface icons or
  use emoji as interface icons.
- Avoid dependencies for behavior the current stack can implement cleanly.
- Never commit secrets, API keys, tokens, `.env` values, build output, or
  dependency directories.

### MiniRAG Data Workflow

- Treat `src/data/profile/bucky-profile.md` as the comprehensive public profile.
  The other Markdown files in that directory are supplemental sources.
- `src/data/profile/bucky-profile-index.json` is generated data. Never edit it
  manually.
- After changing any profile Markdown, run `npm run rag:index` and commit the
  refreshed JSON index with the source change.
- `npm run build` validates that the local index matches the Markdown sources
  without making an embeddings API request.
- Runtime retrieval reads the checked-in JSON index and embeds only the user's
  query. It must not regenerate document embeddings during a request.
- Keep AI limits, validation, retrieval thresholds, and model defaults in
  `src/config/ai.ts`. A rejected or failed request must not consume a successful
  question allowance.
- Suggested questions and typed questions must use the same validation, API,
  retrieval, and successful-answer counting flow.
- Handle brief assistant-introduction, capability, greeting, and portfolio-site
  purpose prompts with a deterministic server response before quota
  reservation. These responses must not call embeddings or answer generation,
  consume question limits, or enter unanswered-question feedback. Natural
  questions about who Bucky is still use the grounded RAG flow.
- After a valid question is submitted, collapse the suggestion guide so the
  conversation gains space, keep an accessible control to reopen it, and have
  the message viewport follow new questions, loading states, and answers.
  Respect `prefers-reduced-motion` when scrolling.
- Voice is an alternate input method, not a separate answer system. Record with
  the browser MediaRecorder API, cap recordings at 30 seconds and 5 MB, send
  audio only to the server-side transcription route, and feed the returned text
  through the same validation, quota, retrieval, feedback, and generation flow.
  Never expose the OpenAI key, persist audio, or count permission, recording, or
  transcription failures as successful questions.
- Temporary document comparison supports PDF and TXT only for V1. Cap uploads
  at 5 MB and extracted text at 50,000 characters. Parse on the server, reuse
  the shared chunker, keep temporary retrieval separate from the checked-in
  profile index, and label profile versus uploaded-document sources clearly.
- Never save uploaded files or extracted text to Supabase, Supabase Storage,
  unanswered-question feedback, or the permanent vector index. Temporary
  document context may live only in the current client session/request and must
  be discarded when removed or the session ends. File parsing failures are not
  unanswered profile questions.
- Keep voice, file, suggested, and typed input normalized into the one Ask Bucky
  answer route. Only a successful grounded final answer consumes the 3-question
  browser allowance or 10-answer daily IP allowance.
- The Ask Bucky route may use the in-memory rate-limit store only for local
  development and automated tests. Production must use a shared atomic store:
  the Supabase RPC migration is the default, while Upstash Redis remains an
  optional backend through `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN`. Never expose any of these values to client code.
- Reserve a daily quota slot before an expensive AI request, then release it
  for rejected or failed requests. Keep reservation and release atomic so
  concurrent Vercel instances cannot all consume the final slot.
- Unanswered-question feedback is written only from the server to Supabase.
  Use `SUPABASE_URL` and `SUPABASE_SECRET_KEY`; keep both server-only, never
  store raw IP addresses or chat history, and exclude malformed, unrelated,
  spam-like, or sensitive inputs.
- Store only reasonable professional questions that fail with `no_results`,
  `low_similarity`, or `missing_profile_info`. Feedback writes must never block
  the user response.
- Feedback records are a human review queue only. Never add user questions or
  answers directly to the public profile or generated RAG index.
- Keep `/privacy` accurate whenever Ask Bucky data collection, subprocessors,
  retention, or contact handling changes.
- Keep API keys and other MiniRAG secrets only in ignored `.env.local` files.

## Change Workflow

Before editing:

1. Read this file completely.
2. Inspect the relevant component and styles.
3. Check `git status` and preserve unrelated user changes.
4. Identify effects on resume facts, SEO/GEO, performance, accessibility,
   mobile layout, and external links.

While editing:

1. Keep the change scoped to the request.
2. Reuse established colors, spacing, typography, and interaction patterns.
3. Preserve accurate resume content and working contact links.
4. Add reduced-motion and responsive behavior with new interactions.

Before considering work complete:

1. Run `npm run build` and fix compilation and TypeScript errors.
2. Run `npm run lint` when application code changes.
3. Run `npm run test` after changing Ask Bucky, RAG, feedback logging, or rate
   limiting. Run `npm run test:concurrency` after changing quota semantics.
4. For visual changes, inspect desktop and mobile for overlap, clipping, blank
   states, and unreadable contrast.
5. Exercise modified navigation, download, email, and external links.
6. Run the relevant SEO/GEO validation steps for public-content changes.
7. Summarize changes and report any check that could not be completed.

## Definition Of Done

A change is complete only when it is factually accurate, responsive,
keyboard-usable, reduced-motion aware, visually consistent, and passes the
production build. Public-facing changes must also preserve crawlable content,
accurate metadata, and verifiable entity information. A flashy effect that
harms clarity, performance, accessibility, SEO, or GEO is not complete.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
