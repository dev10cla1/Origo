fuser -k 8765/tcp 2>/dev/null; sleep .5; (setsid python3 /home/claude/qa2/server.py >/home/claude/qa2/server.log 2>&1 &); sleep 1
