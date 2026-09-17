# PR fixture: extract isEligible helper

Synthetic Python PR. The predicate is moved from an inline expression into a
helper with identical semantics; the caller is shown unchanged. `user.age` is
always an int from validated input. Existing tests cover both branches of the
caller and are unchanged.

```python
# before, inline in send_offer
# if user.active and user.age >= 18 and not user.opted_out:

def is_eligible(user):
    return user.active and user.age >= 18 and not user.opted_out

def send_offer(user, offer):
    if is_eligible(user):
        mailer.send(user.email, offer)
```
