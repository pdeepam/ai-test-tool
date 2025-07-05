# Claude Code Instructions


## Tech stack




```


## Notifications

Use `terminal-notifier` for task completion notifications:

```bash
# Basic notification
terminal-notifier -title "Claude Code" -message "Task completed!" -sound Glass

# After commands
npm test && terminal-notifier -title "Claude Code" -message "Tests completed!" -sound Glass
npm build && terminal-notifier -title "Claude Code" -message "Build finished!" -sound Glass
```

**Usage**: Add `&& terminal-notifier -title "Claude Code" -message "Your message" -sound Glass` to any long-running commands for completion alerts.

