# PR fixture: simplify document access

Synthetic Python PR. The entire function below is changed. Caller supplies
an authenticated user and a requested document. Users may read only documents
whose tenant_id equals their own. There is no upstream tenant filter. CI only
checks syntax; a security owner reviewed the intended tenant isolation policy.

```python
def can_read(user, document):
    return user["authenticated"]
```
