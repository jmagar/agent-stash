I want to start an idea session - I'm interested in creating a shared space that my agents(Claude Code, Codex, Gemini) can use as a central repository of sorts to dump files/logs/useful scripts/screenshots and things like that.

At the end of each session I have my agents create a markdown document detailing everything they did in the session, decisions made and why, things like that - theyre my session logs if you will. The thought was to also store those here.

So - my initial thought was create a new shared on my unRAID server, and then create a MCP server that they all used that had tools to upload/download to the unraid share - I was going to have the tool just use rsync to send the to/froom the share - realized that remote MCP servers can't execute commands like that on your system. So I was wondering what the best way to create something like this be?


I was thinking of it as something like a google drive/workspace but for your agents.


I'd also want an accompanying web frontend to go with this - because this would be a great way to easily navigate my session logs, plans, and other markdown documents from all these projects in one location rather than having to bounce between repos.

I use Claude/Codex for a lot of homelab related tasks such as maintenence, deploying services, troubleshooting services and things like that, so this would be a great place for me to store maintenence / deployment logs.

I also work on several different devices as well, so instead of trying to tell them to rsync this to that device blah blah blah and them say well if i had ssh access yada yada yada (they do have ssh access)  I could just tell them to upload it to their agent stash.

We could also have things like: 
- todo lists 
- task tracking
- plans
- reports
- research
- skills
- agents
- MCPs

(Automatical version tracking)


Think of it as an easily accessible central stash for all your AI artifacts you use for all of your projects. Often times I'll be working on one machine that has a set of skills or agents or mcp servers that aren't as up to date as my others and then ill have to remember the repo theyre in and on what machine and blah blah blah i end up just forgoing them because i just don't feel like wasting the time to find and transfer them. Agent-stash looks to solve this problem by reducing as much friction as possible when it comes with managing all your agent related artifacts that change frequently and are used in several different CLIs with slightly different variations across a myriad of devices by giving your agents a central stash to share amongst your agents, equipped with skills that direct the agents proper protocol for leveraging the stash paired effective MCP tools+ resources+promptsfor interfacing with everything the stash has to offer. 


The web app I'm considering out of scope for v1 - i think i want to get the API + MCP rock solid before we throw on the frontend. And the agents are the main clients and beneficiaries of this project anyway. 

I want to use rust and build a small daemon that runs in the background and watches user specified locations for new / changed markdown files - to be used to sync users session logs, agents, skills, mcp configs, plans, research, reports, etc.

Agents would then have tools to view, download, deploy to other devices, update/edit. They should be able to post comments on any of the files uploaded. We should automatically version track changes to the files so we can do diffs obv, but also see the evolution of an agent/skill etc or just in case for backups. 

We could expose these documents - or specified ones as resources which would be good for like templates, boilerplate, etc.

There should be a share tool/endpoint where you can generate public/secure permanent/desttuctible links.

We could have deeplinks, so like say i wanted to link my agent to a file on agent-stash:
- "Claude, check out the onboarding guide at stash:/docs/ONBOARDING.md"
- *Agent-stash skill triggers*
- Agent sees stash deeplink, and its a filetype that he can read.
- Skill says that if a stash link is mentioned, and its a filetype Claude can read, to use the view-doc tool from the agent-stash mcp server to view the file.
- Claude: Onboarding complete

Another cool feature that just came mind: Drafts
Think of it as like... Pull requests but for agent Skills, Subagents, Hooks, Commands, Prompts. 
You post a draft which is proposed changes to the markdown, agents can comment with their suggestions, the agents vote & comment why they voted the way they did to give input.

A cool webUI feature would be Claude Code & Codex marketplace and plugin builder:
- Guided creation of Marketplaces for Claude Code and Codex
- Guided & AI assisted creation of Claude Code & Codex plugins
- Mix and match any of your Agents, Skills, Commands, Hooks, MCPs
- Create new Agents, Commands, Hooks, and Skills with guidance / AI assistance
- Review & validate all your Agents, Commands, Hooks, MCPs and Skills
- Create Marketplaces for Codex, Claude Code, or both (Gemini eventually as well)
- Target Plugins for Codex, Claude Code, or both (Gemini eventually as well)
- Claude Code & Codex Marketplaces are just a git repo with either:
- .claude-plugin/marketplace.json (Claude Obviously)
- .agents/plugins/marketplace.json (Codex )

The marketplace.json tells us everything we need to know about the marketplace, including all the plugins available, their location, and information about the plugins.

Codex and Claude Code Plugins:
  - .claude-plugin/plugin.json
  - .codex-plugin/plugin.json


Plugins can consist of the following(Codex doesn't support quite a few of these):
- Agents
- Commands
- Hooks
- Skills
- Channels
- Monitors
- Output-Styles
- MCP
- LSP
- bin/ - executables added to Claude's path that can be invoked with normal bash tool by name
- scripts

!noxa https://code.claude.com/docs/en/plugins-reference.md
!noxa https://developers.openai.com/codex/plugins/build.md



So the Marketplace / Plugin Builder would scaffold
`marketplace.json`:

{

  "name": "company-tools",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@example.com"
  },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting on save",
      "version": "2.1.0",
      "author": {
        "name": "DevTools Team"
      }
    },
    {
      "name": "deployment-tools",
      "source": {
        "source": "github",
        "repo": "company/deploy-plugin"
      },
      "description": "Deployment automation tools"
    }
  ]
}


A Plugin Repo:

```text theme={null}

enterprise-plugin/
├── .claude-plugin/           # Metadata directory (optional)
│   └── plugin.json             # plugin manifest
├── skills/                   # Skills
│   ├── code-reviewer/
│   │   └── SKILL.md
│   └── pdf-processor/
│       ├── SKILL.md
│       └── scripts/
├── commands/                 # Skills as flat .md files
│   ├── status.md
│   └── logs.md
├── agents/                   # Subagent definitions
│   ├── security-reviewer.md
│   ├── performance-tester.md
│   └── compliance-checker.md
├── output-styles/            # Output style definitions
│   └── terse.md
├── monitors/                 # Background monitor configurations
│   └── monitors.json
├── hooks/                    # Hook configurations
│   ├── hooks.json           # Main hook config
│   └── security-hooks.json  # Additional hooks
├── bin/                      # Plugin executables added to PATH
│   └── my-tool               # Invokable as bare command in Bash tool
├── settings.json            # Default settings for the plugin
├── .mcp.json                # MCP server definitions
├── .lsp.json                # LSP server configurations
├── scripts/                 # Hook and utility scripts
│   ├── security-scan.sh
│   ├── format-code.py
│   └── deploy.js
├── LICENSE                  # License file
└── CHANGELOG.md             # Version history

```

Validate Skill:
``` bash
npx skills-ref Validaterences ./skills/code-reviewer/SKILL.md
```

Validate Plugin:
``` bash
claude plugin validate .
```
Or from within Claude Code:
/plugin validate .

Debug Plugin:
```bash
claude --debug-file <path>
```

To give you more clarity for when designing the API - I envision the agent-stash webUI being / feeling very similar to Github - with Google Drive built in.

- Instead of Orgs - we have Marketplaces
- Instead of Repos - we have Plugins
(Stash would be our Google Drive)
- Instead of Pull Requests - we have Drafts
- Instead of Issues - we have Ideas
- Instead of Actions - we have Tasks
- Instead of Wikis - we have Docs(Or Wikis still works)
- Instead of Projects - we have Plans
- We'd also have history/versioning for all of these things as well, so we can see the evolution of an idea, plan, doc, plugin, marketplace, etc.
- Stats

We would also allow users to "import" existing Codex & Claude Code Marketplaces & Plugins into your stash:
- Syncs just the plugin files from the repo to your stash
- Remix existing Agents, Skills, Hooks, Commands, MCPs, LSPs, Monitors, Output-Styles, and bin/ from the plugin to your stash for you to use as resources for building your own plugins or just using them as is.
- Bundle new plugins
- Cherry-pick the best parts of existing plugins to build your own custom plugins without having to fork the whole repo and deal with all the baggage that comes with it.
- Keep your plugins up to date by syncing changes from the original repo to your stash when updates are made to the original repo.
- Easily share plugins with your agents by uploading them to your stash and then using the share tool to generate links for your agents to access the plugins.
- Easily manage and organize all your plugins in one central location (your stash) rather than having them scattered across different repos and devices.
- Share plugins with the community by generating public links or even submitting them to a public marketplace for others to use and remix.

So you register a user.
Users can create the following artifacts in their stash:
- agents/ -	Custom agent definitions
- commands/ - Skills as flat Markdown files
- hooks/hooks.json - Run shell commands automatically when Claude Code edits files, finishes tasks, or needs input. Format code, send notifications, validate commands, and enforce project rules.
- skills/ - Skills extend what Claude can do. Create a SKILL.md file with instructions, and Claude adds it to its toolkit. Claude uses skills when relevant
    Skills consist of:
    - skills/my-new-skill/SKILL.md [Required]
    - skills/my-new-skill/scripts/ - Scripts Claude can use [optional]
    - skills/my-new-skill/README.md - Documentation about the skill [optional]
    - skills/my-new-skill/references(/ can be a folder if necessary).md - Any reference materials related to the skill [optional]
    - skills/my-new-skill/examples/ - Example inputs/outputs related to the skill [optional]
    - skills/my-new-skill/template.md - Template for Claude to fill in
- .mcp.json - MCP server configurations
- .lsp.json - LSP server configurations
- monitors/monitors.json - Plugins can declare background monitors that Claude Code starts automatically when the plugin is active. 
- output-styles/my-new-style.md - Output styles change how Claude responds, not what Claude knows.
- scripts/ - Any scripts related to the plugin that don't fit under a specific skill can go here. These can be utility scripts, hook scripts, or anything else the plugin needs to function.
- docs/plans/ - markdown documents outlining plans 
- docs/research/ - markdown documents outlining research 
- docs/reports/ - markdown documents outlining reports
- docs/sessions/ - session logs - markdown documents outlining what happened during sessions, decisions made, etc.
- .stash/templates/ - markdown documents outlining templates 
- .stash/ideas/ - markdown documents outlining ideas 
- .stash/tasks/ - markdown documents outlining tasks 
- bin/ - executables added to Claude's path that can be invoked with normal bash tool by name
- settings.json - default settings for the plugin
- README.md - documentation about the plugin
- Milestones - markdown documents outlining milestones 
- Deadlines - markdown documents outlining deadlines
- Progress Tracking - markdown document outlining progress
- Goals - markdown document outlining goals
- Rules - markdown document outlining rules for the project
- Agent Patches - markdown documents outlining patches to agents to account for different implementations across different agents. For example, if you have a skill that needs to be slightly different for Claude Code vs Codex, you can create a patch for each agent that modifies the original skill to work properly with each agent without having to maintain two separate versions of the skill. This keeps things organized and reduces duplication while still allowing for necessary variations across different agents.
- Statuslines - status lines for agents.
- Marketplaces
  .claude-plugin/marketplace.json [Claude Code]
  .agents/plugins/marketplace.json [Codex]
    Marketplaces consist of Plugins.
      Users also create Plugins:
        Plugins consist of:
        - .claude.plugin/plugin.json 
        - .codex-plugin/plugin.json (Metadata about the plugin, including name, description, version, author, etc.)
        - agents/my-new-agent.md - each agent is a markdown file that defines the agent's role, capabilities, and behavior
        - skills/my-new-skill/SKILL.md - each skill is in its own folder with a SKILL.md file and an optional scripts/ folder for any scripts related to the skill
        - hooks/hooks.json - automation hooks that can be triggered by certain events or conditions
        - commands/my-new-command.md - can be flat markdown files that are just read and executed by the agent, or they can be more complex and have accompanying scripts and resources
        - channels/websocket-server.ts - for defining custom channels for agent communication
        - .mcp.json - MCP server configurations
        - .lcp.json - LSP server configurations
        - monitors/monitors.json - monitors
        - output-styles/snarky.md - output style definitions
        - bin/wrapper - executables available in Claude's path using named bash tool
        - scripts/gh-address-comments.py - hook and utility scripts
        - settings.json - default settings for the plugin


Publishable Artifacts:
- Marketplaces to the public (optional)
- Plugins to the public (optional)
- Share specific files or folders with generated links (public, secure permanent, destructible)
- Drafts for proposed changes to Agents, Skills, Hooks, Commands, MCPs, LSPs, Monitors, Output-Styles, and bin/ that can be discussed and voted upon by humans & agents
- Ideas 
- Tasks 
- Plugins to the marketplace(s)
- Agents
- Skills
- Hooks
- Commands
- MCPs
- LSPs
- Monitors
- Channels
- Rules
- Output-Styles
- bin/ executables
- Prompts
- Plans
- Research
- Reports
- Session Logs
- Templates
- Scripts
- Agent Patches
- Statuslines
- Roadmaps
    Roadmaps consist of:
      - Ideas
      - Tasks
      - Plans
      - Research
      - Reports
      - Milestones
      - Deadlines
      - Progress Tracking
      - Goals
      - Deliverables
      - Rules

All Publishable Artifacts:
- Have a canonical URL that can be shared and accessed by agents and humans alike.
- Have history and automatic version tracking to see the evolution of the Artifacts and revert to previous versions if necessary.
- Have a commenting system for discussion and feedback on the item.
- Have a voting system for proposed changes (Drafts) to gauge interest and gather feedback from the community.
- Have the option to be bundled together as a Plugin and shared in Marketplaces.
- Should be tagged with metadata for easy searching and organization.
- Can Be mentioned in Ideas, Plans, Tasks, Rules, Goals, Deadlines, Milestones, Research, Reports, and Session Logs to link related items together and provide context.
- Have permissions settings to control who can view, edit, comment, and share the artifact.
- Can sync with all of your various agents amongst all of your devices.
- Have the option to be shared with specific Marketplaces or just kept private in the user's stash.
- Have the option to be shared privately with specific users or publicly with the community.
- Have the option to be included in Roadmaps, linking related items together and providing context.
- Have the option to be included in Milestones, Deadlines, and Progress Tracking to provide context and track progress.
- Have the option to be included in Goals and Deliverables to provide context and track progress.
- Have the option to be included in Research and Reports to provide context and track progress.
- Can be #tagged - for easy searching and organization.
- Can be starred - Artifacts a user likes
- Can be pulled - Keeps your stash (local storage) synced and up to date with the repo with the repo for the plugin/skill/agent/marketplace.
- Can be deployed - artifacts can be deployed and kept in sync with one, multiple, or all of your agents + devices.
- Can be remixed - take an existing artifact and use it as a base for your own artifact, making changes and adjustments as needed without affecting the original artifact. This is especially useful for plugins, skills, and agents, allowing you to customize and build upon existing work without having to start from scratch or fork an entire repo.
- Can be bundled - take multiple related artifacts and bundle them together as a plugin that can be shared and deployed as a single unit. This is useful for grouping together related skills, agents, hooks, commands, etc. into a cohesive package that can be easily shared and deployed across your agents and devices.
- Can have Agent Patches - patched version of an Artifact to account for slightly different implementations across different agents. For example, if you have a skill that needs to be slightly different for Claude Code vs Codex, you can create a patch for each agent that modifies the original skill to work properly with each agent without having to maintain two separate versions of the skill. This keeps things organized and reduces duplication while still allowing for necessary variations across different agents.



Users can also:
- Curate their stash by starring artifacts they like, tagging artifacts for easy searching, and organizing artifacts into collections.
- Search their stash using various filters and search criteria to quickly find the items they need.
- Deploy Artifacts from their stash across all their devices and agents to ensure they have access to the latest versions of their artifacts no matter where they are working from.
- Share items from their stash with specific users or publicly with the community, generating links for easy access.
- Bundle related items together into plugins that can be shared and deployed as a single unit across their agents and devices.
- Remix existing items to create new versions that are customized to their specific needs without affecting the original item.
- Track the history of their artifacts with automatic versioning, allowing them to see the evolution of their artifacts and revert to previous versions if necessary.
- Collaborate with other users by commenting on items, proposing changes through drafts, and voting on proposed changes to gather feedback and gauge interest from the community.
- Validate their artifacts using built-in validation tools to ensure they meet the necessary requirements and standards before sharing or deploying them.
- Manage permissions for their artifacts, controlling who can view, edit, comment, and share each artifact in their stash.
- Monitor the usage and performance of their artifacts, tracking how often they are used, who is using them, and how they are performing across their agents and devices.
- Receive notifications about changes to their artifacts, such as comments, proposed changes, and updates from synced repos, keeping them informed about the status of their artifacts and any relevant activity in their stash.
- Integrate their stash with other tools and platforms they use, such as GitHub for version control, project management tools for tracking tasks and milestones, and communication tools for collaborating with their team, creating a seamless workflow that connects all aspects of their projects and agent development process.
- Quickly & Easily export their artifacts and stash data for backup, sharing, or migration purposes, ensuring they have control over their data and can easily move it as needed.
- Compose new artifacts using AI assistance, leveraging the capabilities of their agents to help generate content, provide suggestions, and ensure their artifacts are well-crafted and effective for their intended use via the webUI or directly through their agents using natural language commands.
- Subscribe to updates to Artifacts in their stash, receiving notifications when Artifacts they are interested in are updated, commented on, or have proposed changes, allowing them to stay informed about the status of their artifacts and any relevant activity in their stash.
- Create and manage Roadmaps, linking related Artifacts together and providing context for their projects, helping them to plan and track the progress of their projects in a cohesive and organized way.
- Create Repo-scoped Stashes - Seperate shared Stash scoped only to a specific Repo.
- Create Agent-scoped Stashes - Seperate shared Stash scoped only to a specific Agent.
- Explore public Marketplaces and Plugins created by the community, discovering new tools, skills, and agents to leverage in their own projects, and contributing to the community by sharing their own creations for others to use and build upon.
- From scratch - create a fully functional marketplace + plugins + agents + skills + commands + mcps via the webUI with AI assistance, allowing them to quickly get up and running with new tools and capabilities for their agents without having to start from scratch or have extensive technical knowledge.
- Use templates to quickly create new artifacts, providing a starting point and structure for their artifacts that they can customize to their specific needs, streamlining the creation process and ensuring consistency across their artifacts.
- Push their marketplace and plugins to a freshly created github repo
