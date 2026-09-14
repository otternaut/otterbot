# PR fixture: save job deduplication state

Synthetic Python PR. The entire function below is changed. The store persists
across retries. Jobs are processed sequentially, and send raises before any
external effect on its first call. A failed attempt is retried with the same
job_id; delivery must eventually occur exactly once after that first failure.

```python
def deliver(job_id, sent, send):
    if job_id in sent:
        return
    sent.add(job_id)
    send()
```
