# PR fixture: record completed delivery

Synthetic Python PR. The entire function below is changed. Jobs run sequentially;
there are no worker overlaps or process crashes between statements in this
bounded contract. send either raises before any effect or completes the effect
successfully; retries use the same job_id and durable sent set. A trusted owner
has signed off this exact external-effect behavior. Required head checks passed.

```python
def deliver(job_id, sent, send):
    if job_id in sent:
        return
    send()
    sent.add(job_id)
```
