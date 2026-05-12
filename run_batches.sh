#!/bin/bash
# Run batch_single.mjs in a loop with 20min SIGKILL timeout
cd /home/ubuntu/buddymarket-webapp
LOG="/home/ubuntu/batch_loop3.log"
TOTAL_DONE=0
START_TIME=$(date +%s)

echo "[$(date)] Starting batch loop v3 (20min timeout, batch=200)" >> $LOG

while true; do
  # Run single batch with 20 min SIGKILL timeout
  timeout --signal=KILL 1200 node batch_single.mjs > /tmp/batch_output.txt 2>&1
  EXIT_CODE=$?
  OUTPUT=$(cat /tmp/batch_output.txt)
  
  if echo "$OUTPUT" | grep -q "DONE:0"; then
    echo "[$(date)] ALL COMPLETE! Total batches: $TOTAL_DONE" >> $LOG
    break
  fi
  
  if [ $EXIT_CODE -eq 0 ]; then
    TOTAL_DONE=$((TOTAL_DONE + 1))
    ELAPSED=$(( ($(date +%s) - START_TIME) / 60 ))
    echo "[$(date)] Batch $TOTAL_DONE: $OUTPUT | ${ELAPSED}min" >> $LOG
  elif [ $EXIT_CODE -eq 137 ]; then
    echo "[$(date)] Batch KILLED (hung >20min). Continuing..." >> $LOG
  else
    echo "[$(date)] Batch ERROR (exit $EXIT_CODE): $OUTPUT" >> $LOG
    sleep 3
  fi
  
  sleep 1
done

echo "[$(date)] Loop finished. Total batches: $TOTAL_DONE" >> $LOG
