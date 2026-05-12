#!/bin/bash
# Watchdog: monitors batch_pexels_v4 and restarts if stuck
LOG_FILE="/home/ubuntu/pexels_watchdog.log"
SCRIPT="batch_pexels_v4.mjs"
CHECK_INTERVAL=120  # Check every 2 minutes
STUCK_THRESHOLD=3   # Restart after 3 checks with no progress (6 min)

cd /home/ubuntu/buddymarket-webapp

last_count=0
stuck_checks=0

while true; do
  # Get current count
  current_count=$(node -e "const pg=require('pg');const p=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query(\"SELECT COUNT(*) as c FROM recipes WHERE \\\"isSeeded\\\"=true AND \\\"deletedAt\\\" IS NULL AND \\\"imageUrl\\\" NOT LIKE '%unsplash%'\").then(r=>{console.log(r.rows[0].c);p.end();})" 2>/dev/null)
  
  # Check if process is running
  pid=$(pgrep -f "$SCRIPT")
  
  if [ -z "$pid" ]; then
    echo "[$(date)] Process not running. Starting..." >> $LOG_FILE
    nohup node $SCRIPT >> /home/ubuntu/pexels_v4_auto.log 2>&1 &
    stuck_checks=0
    sleep 10
    continue
  fi
  
  # Check if stuck
  if [ "$current_count" = "$last_count" ] && [ "$last_count" != "0" ]; then
    stuck_checks=$((stuck_checks + 1))
    echo "[$(date)] No progress: $current_count (stuck: $stuck_checks/$STUCK_THRESHOLD)" >> $LOG_FILE
    
    if [ $stuck_checks -ge $STUCK_THRESHOLD ]; then
      echo "[$(date)] RESTARTING - stuck at $current_count" >> $LOG_FILE
      kill $pid 2>/dev/null
      sleep 3
      nohup node $SCRIPT >> /home/ubuntu/pexels_v4_auto.log 2>&1 &
      stuck_checks=0
    fi
  else
    if [ "$current_count" != "$last_count" ]; then
      diff=$((current_count - last_count))
      echo "[$(date)] Progress: $last_count -> $current_count (+$diff)" >> $LOG_FILE
      stuck_checks=0
    fi
  fi
  
  last_count=$current_count
  
  # Check if done (0 pending)
  pending=$(node -e "const pg=require('pg');const p=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query(\"SELECT COUNT(*) as c FROM recipes WHERE \\\"isSeeded\\\"=true AND \\\"deletedAt\\\" IS NULL AND \\\"imageUrl\\\" LIKE '%unsplash%'\").then(r=>{console.log(r.rows[0].c);p.end();})" 2>/dev/null)
  
  if [ "$pending" = "0" ]; then
    echo "[$(date)] ALL DONE! Total: $current_count" >> $LOG_FILE
    kill $pid 2>/dev/null
    break
  fi
  
  sleep $CHECK_INTERVAL
done
