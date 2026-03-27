# Nexus Protocol Reference

This project follows the [Nexus Protocol](https://github.com/AuthorsWisdom/nexus-protocol).

## Parent Protocol
- **Repo:** https://github.com/AuthorsWisdom/nexus-protocol
- **Domain:** software
- **SOPs:** nexus-protocol/domains/software/SOP.md

## Session Start
```bash
cat ~/projects/nexus-protocol/core/SESSION_START.md
cat LOCKED.md
```

## Search Past Decisions
```bash
bash ~/projects/nexus-protocol/scripts/search-decisions.sh "your query"
```

## End Session
```bash
bash ~/projects/nexus-protocol/scripts/end-session.sh xatlas-website
```

## Elite Workflow SOP
See: ~/projects/nexus-protocol/core/ELITE_WORKFLOW.md

Key rules:
- 20-minute rule: no progress in 20 min → STOP, run 5-Why, change strategy
- Provider status first when multiple things break simultaneously
- One change at a time: make → verify → commit → repeat
- Pre-flight: pwd + health check + cat LOCKED.md before every session
- Stability before features: health check green before any new work
