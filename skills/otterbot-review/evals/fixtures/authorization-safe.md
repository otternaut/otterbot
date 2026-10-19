# PR fixture: centralize document access

Synthetic Python PR. The entire function below is changed. The caller invokes
this guard before reading the document. It replaces three inline checks that
each required authentication and compared tenant_id the same way. User identity
and tenant_id come from validated authentication; document tenant_id comes from
storage. Security owner explicitly approved this exact guard behavior at the
reviewed head. All required head checks passed. Other gates are satisfied.

```python
def can_read(user, document):
    return user["authenticated"] and user["tenant_id"] == document["tenant_id"]
```
